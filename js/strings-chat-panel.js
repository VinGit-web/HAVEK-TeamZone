
import { auth, db } from "./firebase.js";
import { subscribeToSphere } from "./sphere-firebase.js";

import {
    doc,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const openButton = document.getElementById("stringsChatButton");
const navButton = document.getElementById("openChatNav");
const closeButton = document.getElementById("stringsChatClose");
const panel = document.getElementById("stringsChatPanel");
const backdrop = document.getElementById("stringsChatBackdrop");
const frame = document.getElementById("stringsChatFrame");

const badge = document.getElementById("stringsChatUnread");
const navBadge = document.getElementById("stringsNavUnread");

const counts = new Map();
const listeners = new Map();

let currentUid = null;
let generation = 0;
let panelOpen = false;

function updateBadge() {
    const total = [...counts.values()].reduce(
        (sum, count) => sum + count,
        0
    );

    const value = total > 99 ? "99+" : String(total);

    badge.hidden = total === 0;
    badge.textContent = value;

    if (navBadge) {
        navBadge.hidden = total === 0;
        navBadge.textContent = value;
    }

    openButton.setAttribute(
        "aria-label",
        total
            ? `Open Chat, ${total} unread messages`
            : "Open Chat"
    );
}

function clearAll() {
    generation++;

    for (const stop of listeners.values()) {
        stop();
    }

    listeners.clear();
    counts.clear();

    updateBadge();
}

function watchConversation(otherUid) {
    const uid = currentUid;
    const version = generation;
    const chatId = [uid, otherUid].sort().join("_");

    let stopMessages = null;
    let stopRead = null;

    let lastRead = 0;
    let received = [];

    let messagesLoaded = false;
    let readLoaded = false;

    function refresh() {
        if (
            version !== generation ||
            !messagesLoaded ||
            !readLoaded
        ) {
            return;
        }

        const unread = received.filter(message => {
            return (
                message.senderUid === otherUid &&
                message.createdAt?.toMillis?.() > lastRead
            );
        }).length;

        counts.set(otherUid, unread);

        updateBadge();
    }

    const stopChat = onSnapshot(
        doc(db, "chats", chatId),

        snapshot => {
            if (version !== generation) return;

            if (!snapshot.exists()) {
                if (stopMessages) {
                    stopMessages();
                    stopMessages = null;
                }

                if (stopRead) {
                    stopRead();
                    stopRead = null;
                }

                messagesLoaded = false;
                readLoaded = false;

                counts.set(otherUid, 0);
                updateBadge();

                return;
            }

            if (stopMessages) return;

            stopMessages = onSnapshot(
                query(
                    collection(
                        db,
                        "chats",
                        chatId,
                        "messages"
                    ),
                    orderBy("createdAt", "desc"),
                    limit(200)
                ),

                snapshot => {
                    if (version !== generation) return;

                    received = snapshot.docs.map(item => item.data());
                    messagesLoaded = true;

                    refresh();
                },

                error => {
                    console.error(
                        "Strings unread messages:",
                        error
                    );
                }
            );

            stopRead = onSnapshot(
                doc(
                    db,
                    "chats",
                    chatId,
                    "readStates",
                    uid
                ),

                snapshot => {
                    if (version !== generation) return;

                    lastRead = snapshot.exists()
                        ? snapshot.data().lastReadAt?.toMillis?.() ?? 0
                        : 0;

                    readLoaded = true;

                    refresh();
                },

                error => {
                    console.error(
                        "Strings read status:",
                        error
                    );
                }
            );
        },

        error => {
            console.error(
                "Strings chat status:",
                error
            );
        }
    );

    listeners.set(otherUid, () => {
        stopChat();

        if (stopMessages) stopMessages();
        if (stopRead) stopRead();
    });
}

subscribeToSphere(state => {
    if (
        !state.uid ||
        state.uid !== auth.currentUser?.uid
    ) {
        currentUid = null;
        clearAll();
        return;
    }

    if (currentUid !== state.uid) {
        clearAll();
        currentUid = state.uid;

        if (frame.dataset.loaded === "true") {
            frame.src = "chat.html?embedded=1";
        }
    }

    const allowed = new Set(
        (state.connections || []).map(person => person.uid)
    );

    for (const [uid, stop] of listeners) {
        if (!allowed.has(uid)) {
            stop();
            listeners.delete(uid);
            counts.delete(uid);
        }
    }

    for (const uid of allowed) {
        if (!listeners.has(uid)) {
            watchConversation(uid);
        }
    }

    updateBadge();
});

function setOpen(open) {
    panelOpen = open;

    panel.classList.toggle("is-open", open);
    backdrop.hidden = !open;

    panel.setAttribute(
        "aria-hidden",
        String(!open)
    );

    openButton.setAttribute(
        "aria-expanded",
        String(open)
    );

    document.body.classList.toggle(
        "strings-chat-open",
        open
    );

    if (open) {
        if (frame.dataset.loaded !== "true") {
            frame.src = "chat.html?embedded=1";
            frame.dataset.loaded = "true";
        }

        closeButton.focus();
    } else {
        openButton.focus();
    }
}

openButton.addEventListener("click", () => {
    setOpen(true);
});

navButton?.addEventListener("click", () => {
    setOpen(true);
});

closeButton.addEventListener("click", () => {
    setOpen(false);
});

backdrop.addEventListener("click", () => {
    setOpen(false);
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && panelOpen) {
        setOpen(false);
    }
});

window.addEventListener("pagehide", clearAll);

updateBadge();
