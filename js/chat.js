
const chatCards = document.querySelectorAll(".chat-card");
const chatLayout = document.querySelector(".chat-layout");

const chatListPage = document.getElementById("chat-list-page");
const conversationPage = document.getElementById("conversation-page");

const conversationName = document.getElementById("conversation-name");
const conversationAvatar = document.getElementById("conversation-avatar");

const backButton = document.getElementById("back-button");
const messageBox = document.getElementById("message-box");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");

const safetyButton = document.getElementById("safety-button");
const safetyOptions = document.getElementById("safety-options");

const reportModal = document.getElementById("report-modal");
const blockModal = document.getElementById("block-modal");

const contacts = ["Zach T", "Mike S", "Sally S", "Holly M"];

const starterConversations = {
    "Zach T": [
        { type: "received", text: "Hey, are you coming to the event?" },
        { type: "sent", text: "Yeah, I should be there!" },
        { type: "received", text: "Perfect, see you there." }
    ],

    "Mike S": [
        { type: "received", text: "Did you finish the assignment?" },
        { type: "sent", text: "Almost, just fixing a few things." },
        { type: "received", text: "Keen as" }
    ],

    "Sally S": [
        { type: "sent", text: "Are you free tomorrow?" },
        { type: "received", text: "Yep, what time?" },
        { type: "sent", text: "Around 2pm?" }
    ],

    "Holly M": [
        { type: "received", text: "Thanks for sending that through!" },
        { type: "sent", text: "No worries!" },
        { type: "sent", text: "See you soon" }
    ]
};

function readLocal(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

const storedConversations = readLocal("introspheer-chat-v1", {});

const conversations = Object.fromEntries(
    contacts.map(name => [
        name,
        Array.isArray(storedConversations[name])
            ? storedConversations[name]
            : starterConversations[name].map(message => ({ ...message }))
    ])
);

let blocked = readLocal("introspheer-blocked-v1", []);

if (!Array.isArray(blocked)) {
    blocked = [];
}

let currentChat = "";

function saveChats() {
    localStorage.setItem(
        "introspheer-chat-v1",
        JSON.stringify(conversations)
    );
}

function isBlocked(name) {
    return blocked.includes(name);
}

/* OPEN CONVERSATION */

function selectChat(name) {
    if (!contacts.includes(name)) return;

    currentChat = name;

    conversationName.textContent = name;

    conversationAvatar.textContent = name
        .split(" ")
        .map(word => word[0])
        .join("");

    chatCards.forEach(card => {
        card.classList.toggle(
            "selected",
            card.dataset.name === name
        );
    });

    chatLayout.classList.add("mobile-conversation");

    safetyOptions.classList.remove("show");
    safetyButton.setAttribute("aria-expanded", "false");

    loadMessages();
}

chatCards.forEach(card => {
    card.addEventListener("click", () => {
        selectChat(card.dataset.name);
    });
});

/* DISPLAY MESSAGES */

function loadMessages() {
    messages.replaceChildren();

    if (!currentChat) return;

    const name = currentChat;

    conversations[name].forEach((message, index) => {
        const bubble = document.createElement("div");

        bubble.className = message.type === "sent"
            ? "sent-message"
            : "received-message";

        const text = document.createElement("span");
        text.className = "message-text";
        text.textContent = message.text;

        bubble.appendChild(text);

        if (message.type === "sent") {
            const unsend = document.createElement("button");

            unsend.type = "button";
            unsend.className = "unsend-btn";
            unsend.textContent = "Unsend";

            unsend.addEventListener("click", () => {
                conversations[name].splice(index, 1);
                saveChats();

                if (currentChat === name) {
                    loadMessages();
                }
            });

            bubble.appendChild(unsend);
        }

        messages.appendChild(bubble);
    });

    if (isBlocked(name)) {
        const note = document.createElement("p");
        note.className = "empty-chat";
        note.textContent =
            "You blocked this contact in this browser prototype.";

        const unblock = document.createElement("button");
        unblock.type = "button";
        unblock.textContent = "Unblock";

        unblock.addEventListener("click", () => {
            blocked = blocked.filter(contact => contact !== name);

            localStorage.setItem(
                "introspheer-blocked-v1",
                JSON.stringify(blocked)
            );

            loadMessages();
        });

        note.append(" ", unblock);
        messages.appendChild(note);
    }

    messageBox.disabled = isBlocked(name);

    chatForm.querySelector("button").disabled = isBlocked(name);

    messages.scrollTop = messages.scrollHeight;
}

/* SEND MESSAGE */

chatForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = messageBox.value.trim();

    if (!text || !currentChat || isBlocked(currentChat)) return;

    conversations[currentChat].push({
        type: "sent",
        text: text
    });

    saveChats();

    messageBox.value = "";

    loadMessages();
    messageBox.focus();
});

/* BACK BUTTON */

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

/* MODALS */

function openModal(modal) {
    if (!currentChat) return;

    safetyOptions.classList.remove("show");
    safetyButton.setAttribute("aria-expanded", "false");

    modal.classList.add("show");
    modal.querySelector(".modal-close").focus();
}

function closeModal(modal) {
    modal.classList.remove("show");
}

/* REPORT */

document.getElementById("report-button").addEventListener("click", () => {
    document.getElementById("report-user-name").textContent = currentChat;
    openModal(reportModal);
});

document.getElementById("close-report").addEventListener("click", () => {
    closeModal(reportModal);
});

document.getElementById("submit-report").addEventListener("click", () => {
    const selected = document.querySelector(
        'input[name="report-reason"]:checked'
    );

    if (!selected) {
        alert("Please select a reason for reporting.");
        return;
    }

    const reports = readLocal("introspheer-reports-demo-v1", []);

    reports.push({
        contact: currentChat,
        reason: selected.value,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem(
        "introspheer-reports-demo-v1",
        JSON.stringify(reports)
    );

    selected.checked = false;
    closeModal(reportModal);

    alert(
        "Report recorded in this browser prototype. " +
        "It has not been sent to moderators."
    );
});

/* BLOCK */

document.getElementById("block-button").addEventListener("click", () => {
    document.getElementById("block-user-name").textContent = currentChat;
    openModal(blockModal);
});

document.getElementById("close-block").addEventListener("click", () => {
    closeModal(blockModal);
});

document.getElementById("cancel-block").addEventListener("click", () => {
    closeModal(blockModal);
});

document.getElementById("confirm-block").addEventListener("click", () => {
    if (currentChat && !isBlocked(currentChat)) {
        blocked.push(currentChat);
    }

    localStorage.setItem(
        "introspheer-blocked-v1",
        JSON.stringify(blocked)
    );

    closeModal(blockModal);
    loadMessages();
});

/* CLOSE MODALS */

[reportModal, blockModal].forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal(reportModal);
        closeModal(blockModal);
        safetyOptions.classList.remove("show");
    }
});

/* DEFAULT CONVERSATION */

selectChat(contacts[0]);
chatLayout.classList.remove("mobile-conversation");
