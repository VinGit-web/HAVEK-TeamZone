const chatCards = document.querySelectorAll(".chat-card");

const chatListPage = document.getElementById("chat-list-page");
const conversationPage = document.getElementById("conversation-page");

const conversationName = document.getElementById("conversation-name");
const conversationAvatar = document.getElementById("conversation-avatar");

const backButton = document.getElementById("back-button");
const messageBox = document.getElementById("message-box");
const sendButton = document.getElementById("send-button");
const messages = document.getElementById("messages");

let currentChat = "";


/* DIFFERENT CONVERSATIONS FOR EACH PERSON */

const conversations = {
    "Zach T": [
        {
            type: "received",
            text: "Hey, are you coming to the event?"
        },
        {
            type: "sent",
            text: "Yeah, I should be there!"
        },
        {
            type: "received",
            text: "Perfect, see you there."
        }
    ],

    "Mike S": [
        {
            type: "received",
            text: "Did you finish the assignment?"
        },
        {
            type: "sent",
            text: "Almost, just fixing a few things."
        },
        {
            type: "received",
            text: "Keen as"
        }
    ],

    "Sally S": [
        {
            type: "sent",
            text: "Are you free tomorrow?"
        },
        {
            type: "received",
            text: "Yep, what time?"
        },
        {
            type: "sent",
            text: "Around 2pm?"
        }
    ],

    "Holly M": [
        {
            type: "received",
            text: "Thanks for sending that through!"
        },
        {
            type: "sent",
            text: "No worries!"
        },
        {
            type: "sent",
            text: "See you soon"
        }
    ]
};


/* OPEN A CHAT */

chatCards.forEach(function(card) {

    card.addEventListener("click", function() {

        currentChat = card.dataset.name;

        conversationName.textContent = currentChat;

        const initials = currentChat
            .split(" ")
            .map(function(word) {
                return word.charAt(0);
            })
            .join("");

        conversationAvatar.textContent = initials;

        chatListPage.style.display = "none";
        conversationPage.style.display = "flex";

        loadMessages();
    });

});


/* LOAD THE CORRECT PERSON'S MESSAGES */

function loadMessages() {

    messages.innerHTML = "";

    conversations[currentChat].forEach(function(message, index) {

        const messageElement = document.createElement("div");

        if (message.type === "sent") {
            messageElement.classList.add("sent-message");
        } else {
            messageElement.classList.add("received-message");
        }

        messageElement.textContent = message.text;

        if (message.type === "sent") {
    const unsendButton = document.createElement("button");

    unsendButton.textContent = "Unsend";
    unsendButton.classList.add("unsend-btn");

    unsendButton.addEventListener("click", function () {
        conversations[currentChat].splice(index, 1);
        loadMessages();
    });

    messageElement.appendChild(unsendButton);
}

messages.appendChild(messageElement);

    });

    messages.scrollTop = messages.scrollHeight;
}


/* SEND A NEW MESSAGE */

function sendMessage() {

    const messageText = messageBox.value.trim();

    if (messageText !== "") {

        const newMessage = {
            type: "sent",
            text: messageText
        };

        // Add message to the current person's conversation
        conversations[currentChat].push(newMessage);

        messageBox.value = "";

        loadMessages();
    }
}


sendButton.addEventListener("click", sendMessage);


/* PRESS ENTER TO SEND */

messageBox.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        sendMessage();
    }

});


/* BACK BUTTON */

backButton.addEventListener("click", function() {

    conversationPage.style.display = "none";

    chatListPage.style.display = "block";

});



/* ========================= */
/* CHAT SAFETY FEATURE */
/* ========================= */

const safetyButton = document.getElementById("safety-button");
const safetyOptions = document.getElementById("safety-options");

const reportButton = document.getElementById("report-button");
const blockButton = document.getElementById("block-button");

const reportModal = document.getElementById("report-modal");
const blockModal = document.getElementById("block-modal");

const reportUserName = document.getElementById("report-user-name");
const blockUserName = document.getElementById("block-user-name");


/* Open and close the three-dot menu */

safetyButton.addEventListener("click", function (event) {

    event.stopPropagation();

    safetyOptions.classList.toggle("show");

});


/* Close menu when clicking elsewhere */

document.addEventListener("click", function (event) {

    if (!event.target.closest(".chat-safety-menu")) {

        safetyOptions.classList.remove("show");

    }

});


/* ========================= */
/* REPORT */
/* ========================= */

reportButton.addEventListener("click", function () {

    // Get the current person's name
    const currentUser =
        document.getElementById("conversation-name").textContent;

    reportUserName.textContent = currentUser;

    // Close dropdown
    safetyOptions.classList.remove("show");

    // Open report modal
    reportModal.classList.add("show");

});


/* Close report modal */

document.getElementById("close-report").addEventListener("click", function () {

    reportModal.classList.remove("show");

});


/* Submit report */

document.getElementById("submit-report").addEventListener("click", function () {

    const selectedReason =
        document.querySelector('input[name="report-reason"]:checked');


    if (!selectedReason) {

        alert("Please select a reason for reporting.");

        return;

    }


    alert(
        "Your report has been submitted. Thank you for helping keep our community safe."
    );


    // Close modal
    reportModal.classList.remove("show");


    // Remove selected radio button
    selectedReason.checked = false;

});


/* ========================= */
/* BLOCK */
/* ========================= */

blockButton.addEventListener("click", function () {

    // Get current person's name
    const currentUser =
        document.getElementById("conversation-name").textContent;

    blockUserName.textContent = currentUser;

    // Close dropdown
    safetyOptions.classList.remove("show");

    // Open block modal
    blockModal.classList.add("show");

});


/* Close block modal */

document.getElementById("close-block").addEventListener("click", function () {

    blockModal.classList.remove("show");

});


/* Cancel block */

document.getElementById("cancel-block").addEventListener("click", function () {

    blockModal.classList.remove("show");

});


/* Confirm block */

document.getElementById("confirm-block").addEventListener("click", function () {

    const currentUser =
        document.getElementById("conversation-name").textContent;


    alert(currentUser + " has been blocked.");


    blockModal.classList.remove("show");

});
