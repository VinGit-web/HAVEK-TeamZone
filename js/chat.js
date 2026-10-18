import { blockMember, reportMember } from './safety-firebase.js';

import { auth, db } from "./firebase.js";
import {
  subscribeToSphere,
  isSphereConnected
} from "./sphere-firebase.js";

import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  addDoc,
  deleteDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const chatLayout = document.querySelector(".chat-layout");
const chatList = document.getElementById("chat-list");
const chatSearch = document.getElementById("chatSearch");
const conversationName = document.getElementById("conversation-name");
const conversationAvatar = document.getElementById("conversation-avatar");
const backButton = document.getElementById("back-button");
const messageBox = document.getElementById("message-box");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const sendButton = document.getElementById("send-button");

const safetyButton = document.getElementById("safety-button");
const safetyOptions = document.getElementById("safety-options");
const reportModal = document.getElementById("report-modal");
const blockModal = document.getElementById("block-modal");

let myUid = null;
let connections = [];
let currentChatUid = null;
let unsubscribeMessages = null;
let messageGeneration = 0;
let currentMessages = [];
let sending = false;


const unreadByUid = new Map();
const latestMessageByUid = new Map();
const unreadListeners = new Map();
const readMarkers = new Map();
const pendingReadWrites = new Set();
let unreadGeneration = 0;

function clearUnreadListeners() {
  unreadGeneration++;

  for (const stops of unreadListeners.values()) {
    stops.forEach(stop => stop());
  }

  unreadListeners.clear();
  unreadByUid.clear();
  latestMessageByUid.clear();
  readMarkers.clear();
  pendingReadWrites.clear();
  updateUnreadNavigation();
}

function updateUnreadNavigation() {
  const total = [...unreadByUid.values()]
    .reduce((sum, count) => sum + count, 0);

  const badge = document.getElementById("nav-unread-count");

  if (!badge) return;

  badge.hidden = total === 0;
  badge.textContent = total > 99 ? "99+" : String(total);
  badge.setAttribute(
    "aria-label",
    `${total} unread messages`
  );
}

function isConversationVisible(uid) {
  return (
    document.visibilityState === "visible" &&
    currentChatUid === uid &&
    isCurrentConnection() &&
    (
      (!document.body.classList.contains("embedded-chat") && window.innerWidth > 820) ||
      chatLayout.classList.contains("mobile-conversation")
    )
  );
}

async function markConversationRead(uid) {
  if (
    !myUid ||
    !isConversationVisible(uid) ||
    pendingReadWrites.has(uid)
  ) return;

  const chatId = conversationId(myUid, uid);
  pendingReadWrites.add(uid);

  try {
    await setDoc(
      doc(db, "chats", chatId, "readStates", myUid),
      { lastReadAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.error("Unable to mark conversation as read:", error);
  } finally {
    pendingReadWrites.delete(uid);
  }
}

function calculateUnread(uid, items) {
  const lastRead = readMarkers.get(uid);
  const lastReadMillis = lastRead?.toMillis() ?? 0;

  return items.filter(message => (
    message.senderUid !== myUid &&
    message.createdAt?.toMillis?.() > lastReadMillis
  )).length;
}

function watchUnreadConversations() {
  const activeIds = new Set(connections.map(person => person.uid));
  const generation = unreadGeneration;

  for (const [uid, stops] of unreadListeners) {
    if (!activeIds.has(uid)) {
      stops.forEach(stop => stop());
      unreadListeners.delete(uid);
      unreadByUid.delete(uid);
      readMarkers.delete(uid);
      latestMessageByUid.delete(uid);
    }
  }

  for (const uid of activeIds) {
    if (unreadListeners.has(uid) || !myUid) continue;

    const chatId = conversationId(myUid, uid);
    let latestMessages = [];
    let messagesLoaded = false;
    let markerLoaded = false;

    const refresh = () => {
      if (
        generation !== unreadGeneration ||
        !messagesLoaded ||
        !markerLoaded
      ) return;

      unreadByUid.set(
        uid,
        isConversationVisible(uid)
          ? 0
          : calculateUnread(uid, latestMessages)
      );

      updateUnreadNavigation();
      renderContacts();

      if (
        isConversationVisible(uid) &&
        latestMessages.some(message => (
          message.senderUid !== myUid &&
          message.createdAt?.toMillis?.() >
            (readMarkers.get(uid)?.toMillis() ?? 0)
        ))
      ) {
        markConversationRead(uid);
      }
    };

    const stopMessages = onSnapshot(
      query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "desc"),
        limit(200)
      ),
      snapshot => {
        if (generation !== unreadGeneration) return;

       latestMessages = snapshot.docs.map(item => item.data());

const newestMessage = latestMessages.find(
  message => message.createdAt?.toMillis?.()
);

if (newestMessage) {
  latestMessageByUid.set(
    uid,
    newestMessage.createdAt.toMillis()
  );
} else {
  latestMessageByUid.delete(uid);
}

messagesLoaded = true;

refresh();
renderContacts();
      },
      error => console.error("Unread messages listener:", error)
    );

    const stopMarker = onSnapshot(
      doc(db, "chats", chatId, "readStates", myUid),
      snapshot => {
        if (generation !== unreadGeneration) return;

        readMarkers.set(
          uid,
          snapshot.exists()
            ? snapshot.data().lastReadAt
            : Timestamp.fromMillis(0)
        );

        markerLoaded = true;
        refresh();
      },
      error => console.error("Read marker listener:", error)
    );

    unreadListeners.set(uid, [stopMessages, stopMarker]);
  }

  updateUnreadNavigation();
  renderContacts();
}


const requestedChatUid =
  new URLSearchParams(window.location.search).get("uid");

function conversationId(a, b) {
  return [a, b].sort().join("_");
}

function getContact(uid) {
  return connections.find(person => person.uid === uid) || null;
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
}

function showStatus(text) {
  messages.replaceChildren();

  const note = document.createElement("p");
  note.className = "empty-chat";
  note.textContent = text;
  messages.appendChild(note);
}

function setComposerEnabled(enabled) {
  messageBox.disabled = !enabled;
  sendButton.disabled = !enabled;
}

function isCurrentConnection() {
  return Boolean(
    myUid &&
    currentChatUid &&
    getContact(currentChatUid) &&
    isSphereConnected(currentChatUid)
  );
}

function closeMessageListener() {
  messageGeneration++;

  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  currentMessages = [];
}

function renderContacts() {
  chatList.replaceChildren();

  if (!myUid) {
    const note = document.createElement("p");
    note.className = "empty-chat";
    note.textContent = "Sign in to view your chats.";
    chatList.appendChild(note);
    return;
  }

  if (connections.length === 0) {
    const note = document.createElement("p");
    note.className = "empty-chat";
    note.textContent =
      "No connections yet. Connect with someone on Strings to start chatting.";
    chatList.appendChild(note);
    return;
  }

  const searchTerm = chatSearch.value.trim().toLowerCase();

  const filteredConnections = connections
  .filter(person => {
    const name = person.name || "INTROSPHEER User";
    return name.toLowerCase().includes(searchTerm);
  })
  .sort((a, b) => {
    const aTime = latestMessageByUid.get(a.uid) || 0;
    const bTime = latestMessageByUid.get(b.uid) || 0;

    if (bTime !== aTime) {
      return bTime - aTime;
    }

    return (a.name || "").localeCompare(b.name || "");
  });

  if (filteredConnections.length === 0) {
    const note = document.createElement("p");
    note.className = "chat-search-empty";
    note.textContent = "No matching connections found.";
    chatList.appendChild(note);
    return;
  }

  for (const person of filteredConnections) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "chat-card";
    card.dataset.uid = person.uid;

    if (person.uid === currentChatUid) {
      card.classList.add("selected");
    }

    const avatar = document.createElement("span");
    avatar.className = "profile-image";
    avatar.textContent = initials(person.name || "User");

    const name = document.createElement("span");
    name.textContent = person.name || "INTROSPHEER User";

    card.append(avatar, name);

    const unread = unreadByUid.get(person.uid) || 0;

    if (unread > 0) {
      card.classList.add("has-unread");

      const badge = document.createElement("span");
      badge.className = "unread-badge";
      badge.textContent = unread > 99 ? "99+" : String(unread);
      badge.setAttribute(
        "aria-label",
        `${unread} unread messages`
      );

      card.appendChild(badge);
    }

    card.addEventListener("click", () => selectChat(person.uid));

    chatList.appendChild(card);
  }
}

function renderMessages() {
  messages.replaceChildren();

  if (!currentChatUid) return;

  if (!isCurrentConnection()) {
    showStatus("This person is not an accepted connection.");
    setComposerEnabled(false);
    return;
  }

  if (currentMessages.length === 0) {
    showStatus("No messages yet. Start the conversation.");
    return;
  }

  for (const message of currentMessages) {
    const bubble = document.createElement("div");
    const mine = message.senderUid === myUid;

    bubble.className = mine ? "sent-message" : "received-message";

    const text = document.createElement("span");
    text.className = "message-text";
    text.textContent = message.text || "";

    bubble.appendChild(text);

    if (mine) {
      const unsend = document.createElement("button");
      unsend.type = "button";
      unsend.className = "unsend-btn";
      unsend.textContent = "Unsend";

      unsend.addEventListener("click", async () => {
        if (!isCurrentConnection()) return;

        try {
          const chatId = conversationId(myUid, currentChatUid);

          await deleteDoc(
            doc(db, "chats", chatId, "messages", message.id)
          );
        } catch (error) {
          console.error("Unable to unsend:", error);
          alert("Unable to unsend this message.");
        }
      });

      bubble.appendChild(unsend);
    }

    messages.appendChild(bubble);
  }

  messages.scrollTop = messages.scrollHeight;
}

async function selectChat(uid) {
  const person = getContact(uid);

  if (!person || !isSphereConnected(uid) || !myUid) return;

  closeMessageListener();
  currentChatUid = uid;

  conversationName.textContent = person.name || "INTROSPHEER User";
  conversationAvatar.textContent = initials(person.name || "User");

  chatLayout.classList.add("mobile-conversation");
  unreadByUid.set(uid, 0);
updateUnreadNavigation();
markConversationRead(uid);

  safetyOptions.classList.remove("show");
  safetyButton.setAttribute("aria-expanded", "false");

  renderContacts();
  showStatus("Loading messages...");
  setComposerEnabled(true);

  const chatId = conversationId(myUid, uid);
const generation = messageGeneration;

try {
  const chatRef = doc(db, "chats", chatId);
  const existingChat = await getDoc(chatRef);

  if (!existingChat.exists()) {
    if (!isCurrentConnection()) {
      throw new Error("This connection is no longer active.");
    }

    await setDoc(chatRef, {
      participants: [myUid, uid].sort(),
      createdAt: serverTimestamp()
    });
  }
} catch (error) {
  console.error("Unable to initialise conversation:", error);

  if (generation === messageGeneration) {
    showStatus("Unable to open this conversation.");
    setComposerEnabled(false);
  }

  return;
}

if (
  generation !== messageGeneration ||
  currentChatUid !== uid
) return;

const messagesQuery = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );

  unsubscribeMessages = onSnapshot(
    messagesQuery,
    snapshot => {
      if (
        generation !== messageGeneration ||
        currentChatUid !== uid
      ) return;

      currentMessages = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      renderMessages();
      if (isConversationVisible(uid)) {
  markConversationRead(uid);
}
    },
    error => {
      console.error("Chat listener failed:", error);

      if (generation === messageGeneration) {
        showStatus("Unable to load messages. Check Firestore permissions.");
        setComposerEnabled(false);
      }
    }
  );

  const url = new URL(window.location.href);
  url.searchParams.set("uid", uid);
  window.history.replaceState({}, "", url);
}

function resetConversation() {
  closeMessageListener();
  currentChatUid = null;

  conversationName.textContent = "Select a chat";
  conversationAvatar.textContent = "";
  messages.replaceChildren();

  setComposerEnabled(false);
  chatLayout.classList.remove("mobile-conversation");

  const url = new URL(window.location.href);
  url.searchParams.delete("uid");
  window.history.replaceState({}, "", url);

  renderContacts();
}

onAuthStateChanged(auth, user => {
  myUid = user?.uid || null;

  if (!myUid) {
    connections = [];
    resetConversation();
  }
});

subscribeToSphere(state => {
  if (!state.uid || state.uid !== auth.currentUser?.uid) {
    clearUnreadListeners(); connections = [];
    renderContacts();
    return;
  }

  myUid = state.uid;
  connections = state.connections || [];
  watchUnreadConversations();

  if (currentChatUid && !isCurrentConnection()) {
    resetConversation();
  }

  renderContacts();

  if (
    requestedChatUid &&
    !currentChatUid &&
    connections.some(person => person.uid === requestedChatUid)
  ) {
    selectChat(requestedChatUid);
  }
});

chatForm.addEventListener("submit", async event => {
  event.preventDefault();

  const text = messageBox.value.trim();

  if (!text || sending || !isCurrentConnection()) return;

  const senderUid = myUid;
  const recipientUid = currentChatUid;
  const chatId = conversationId(senderUid, recipientUid);

  sending = true;
  setComposerEnabled(false);

  try {
    if (!isCurrentConnection()) {
      throw new Error("This connection is no longer active.");
    }

    const chatRef = doc(db, "chats", chatId);

    const existingChat = await getDoc(chatRef);

    if (!existingChat.exists()) {
      await setDoc(chatRef, {
        participants: [senderUid, recipientUid].sort(),
        createdAt: serverTimestamp()
      });
    }

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderUid,
      text,
      createdAt: serverTimestamp()
    });

    messageBox.value = "";
    messageBox.focus();
  } catch (error) {
    console.error("Unable to send message:", error);
    alert("Message not sent. Check your connection and Firestore permissions.");
  } finally {
    sending = false;
    setComposerEnabled(isCurrentConnection());
  }
});

backButton.addEventListener("click", () => {
  chatLayout.classList.remove("mobile-conversation");
});

/* SAFETY MENU */

safetyButton.addEventListener("click", event => {
  event.stopPropagation();

  const show = safetyOptions.classList.toggle("show");
  safetyButton.setAttribute("aria-expanded", String(show));
});

document.addEventListener("click", event => {
  if (!event.target.closest(".chat-safety-menu")) {
    safetyOptions.classList.remove("show");
    safetyButton.setAttribute("aria-expanded", "false");
  }
});

function openModal(modal) {
  if (!currentChatUid) return;

  safetyOptions.classList.remove("show");
  safetyButton.setAttribute("aria-expanded", "false");

  modal.classList.add("show");
  modal.querySelector(".modal-close").focus();
}

function closeModal(modal) {
  modal.classList.remove("show");
}

document.getElementById("report-button").addEventListener("click", () => {
  document.getElementById("report-user-name").textContent =
    getContact(currentChatUid)?.name || "this user";

  openModal(reportModal);
});

document.getElementById("close-report").addEventListener("click", () => {
  closeModal(reportModal);
});

document.getElementById("submit-report").addEventListener("click", async () => {
  const selected = document.querySelector('input[name="report-reason"]:checked');
  if (!selected || !currentChatUid) { alert("Select a report reason."); return; }
  const button = document.getElementById('submit-report'); button.disabled = true;
  try { await reportMember(currentChatUid, selected.value); selected.checked = false; closeModal(reportModal); alert('Report submitted.'); }
  catch(error) { console.error('Report failed:',error); alert(error.message || 'Unable to submit report.'); }
  finally { button.disabled = false; }
});

document.getElementById("block-button").addEventListener("click", () => {
  document.getElementById("block-user-name").textContent =
    getContact(currentChatUid)?.name || "this user";

  openModal(blockModal);
});

document.getElementById("close-block").addEventListener("click", () => {
  closeModal(blockModal);
});

document.getElementById("cancel-block").addEventListener("click", () => {
  closeModal(blockModal);
});

document.getElementById("confirm-block").addEventListener("click", async () => {
  if (!currentChatUid) return;
  const target = currentChatUid, button = document.getElementById('confirm-block'); button.disabled = true;
  try { await blockMember(target); closeModal(blockModal); resetConversation(); alert('Member blocked. Manage blocked users in Account.'); }
  catch(error) { console.error('Block failed:',error); alert(error.message || 'Unable to block member.'); }
  finally { button.disabled = false; }
});

[reportModal, blockModal].forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal(modal);
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal(reportModal);
    closeModal(blockModal);
    safetyOptions.classList.remove("show");
  }
});

setComposerEnabled(false);
renderContacts();


document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;

  if (currentChatUid && isConversationVisible(currentChatUid)) {
    markConversationRead(currentChatUid);
  }
});

window.addEventListener("pageshow", () => {
  if (currentChatUid && isConversationVisible(currentChatUid)) {
    markConversationRead(currentChatUid);
  }
});
chatSearch.addEventListener("input", renderContacts);