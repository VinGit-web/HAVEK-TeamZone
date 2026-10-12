
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const openPostForm = document.getElementById("openPostForm");
const postFormContainer = document.getElementById("postFormContainer");
const cancelPost = document.getElementById("cancelPost");
const postForm = document.getElementById("postForm");
const stringsFeed = document.getElementById("stringsFeed");
const stringsStatus = document.getElementById("stringsStatus");
const submitPost = document.getElementById("submitPost");

const postName = document.getElementById("postName");
const postText = document.getElementById("postText");
const postEvent = document.getElementById("postEvent");
const postLocation = document.getElementById("postLocation");

let currentUser = null;
let stopPostsListener = null;
let commentListeners = [];

/* HELPERS */

function makeElement(tag, className = "", text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function showStatus(message) {
    stringsStatus.textContent = message;
}

function getDisplayName() {
    if (!currentUser) {
        return "";
    }

    return (
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "INTROSPHEER User"
    ).slice(0, 60);
}

function stopCommentListeners() {
    commentListeners.forEach(stop => stop());
    commentListeners = [];
}

/* AUTHENTICATION */

onAuthStateChanged(auth, user => {
    if (stopPostsListener) {
        stopPostsListener();
        stopPostsListener = null;
    }

    stopCommentListeners();

    currentUser = user;

    if (!user) {
        stringsFeed.replaceChildren();
        showStatus("Please log in to view Strings.");
        return;
    }

    postName.value = getDisplayName();

    loadPosts();
});

/* LOAD SHARED POSTS */

function loadPosts() {
    showStatus("Loading posts...");

    const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
    );

    stopPostsListener = onSnapshot(
        postsQuery,
        snapshot => {
            stopCommentListeners();
            stringsFeed.replaceChildren();

            if (snapshot.empty) {
                showStatus("No posts yet. Create the first String!");
                return;
            }

            showStatus("");

            snapshot.forEach(documentSnapshot => {
                const post = {
                    id: documentSnapshot.id,
                    ...documentSnapshot.data()
                };

                renderPost(post);
            });
        },
        error => {
            console.error("Unable to load posts:", error);
            showStatus("Unable to load posts. Check your Firestore permissions.");
        }
    );
}

/* DISPLAY A POST */

function renderPost(post) {
    const card = makeElement("article", "string-card");
    card.dataset.postId = post.id;

    /* USER DETAILS */

    const user = makeElement("div", "post-user");

    const authorName = post.authorName || "INTROSPHEER User";

    const avatar = makeElement(
        "div",
        "profile-circle",
        authorName.charAt(0).toUpperCase()
    );

    const name = makeElement("h3", "", authorName);

    user.append(avatar, name);

    /* POST CONTENT */

    const message = makeElement(
        "p",
        "post-message",
        post.content || ""
    );

    /* EVENT DETAILS */

    const details = makeElement("div", "event-details");

    const eventLine = makeElement("p");

    const eventTitle = makeElement(
        "strong",
        "",
        post.eventName || ""
    );

    eventLine.appendChild(eventTitle);

    const location = makeElement(
        "p",
        "",
        post.location || ""
    );

    details.append(eventLine, location);

    /* ACTION BUTTONS */

    const actions = makeElement("div", "post-actions");

    const commentButton = makeElement(
        "button",
        "comment-button",
        "Comment (0)"
    );

    commentButton.type = "button";

    const joinButton = makeElement(
        "button",
        "join-button",
        "View event & join"
    );

    joinButton.type = "button";

    actions.append(commentButton, joinButton);

    /* COMMENT SECTION */

    const section = makeElement(
        "section",
        "comments-section hidden"
    );

    const heading = makeElement(
        "h4",
        "",
        "Comments"
    );

    const list = makeElement(
        "div",
        "comments-list"
    );

    const form = makeElement(
        "form",
        "comment-form"
    );

    const input = makeElement("input");

    input.type = "text";
    input.maxLength = 500;
    input.required = true;
    input.placeholder = "Write a comment...";

    input.setAttribute(
        "aria-label",
        `Comment on ${authorName}'s post`
    );

    const submit = makeElement(
        "button",
        "",
        "Post"
    );

    submit.type = "submit";

    form.append(input, submit);

    section.append(heading, list, form);

    /* LOAD SHARED COMMENTS */

    const commentsCollection = collection(
        db,
        "posts",
        post.id,
        "comments"
    );

    const commentsQuery = query(
        commentsCollection,
        orderBy("createdAt", "asc")
    );

    const stopComments = onSnapshot(
        commentsQuery,
        snapshot => {
            list.replaceChildren();

            commentButton.textContent =
                `Comment (${snapshot.size})`;

            snapshot.forEach(commentSnapshot => {
                const item = commentSnapshot.data();

                const comment = makeElement(
                    "div",
                    "comment-item"
                );

                const author = makeElement(
                    "strong",
                    "",
                    item.authorName || "INTROSPHEER User"
                );

                const commentText = makeElement(
                    "p",
                    "",
                    item.content || ""
                );

                comment.append(author, commentText);
                list.appendChild(comment);
            });
        },
        error => {
            console.error("Unable to load comments:", error);

            list.replaceChildren(
                makeElement(
                    "p",
                    "",
                    "Unable to load comments."
                )
            );
        }
    );

    commentListeners.push(stopComments);

    /* SUBMIT COMMENT */

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        const value = input.value.trim();

        if (!value || value.length > 500) {
            return;
        }

        submit.disabled = true;
        submit.textContent = "Posting...";

        try {
            await addDoc(commentsCollection, {
                authorId: currentUser.uid,
                authorName: getDisplayName(),
                content: value,
                createdAt: serverTimestamp()
            });

            form.reset();
        } catch (error) {
            console.error("Unable to post comment:", error);
            alert("Your comment could not be saved. Please try again.");
        } finally {
            submit.disabled = false;
            submit.textContent = "Post";
        }
    });

    /* OPEN / CLOSE COMMENTS */

    commentButton.addEventListener("click", () => {
        section.classList.toggle("hidden");
    });

    /* VIEW EVENT */

    joinButton.addEventListener("click", () => {
        const eventName = encodeURIComponent(
            post.eventName || ""
        );

        window.location.href =
            `events.html?event=${eventName}`;
    });

    /* ADD POST TO FEED */

    card.append(
        user,
        message,
        details,
        actions,
        section
    );

    stringsFeed.appendChild(card);
}

/* OPEN CREATE POST FORM */

openPostForm.addEventListener("click", () => {
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    postFormContainer.classList.remove("hidden");

    if (!postName.value.trim()) {
        postName.value = getDisplayName();
    }

    postText.focus();
});

/* CANCEL CREATE POST */

cancelPost.addEventListener("click", () => {
    postFormContainer.classList.add("hidden");
    postForm.reset();

    if (currentUser) {
        postName.value = getDisplayName();
    }
});

/* CREATE NEW POST */

postForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const name = postName.value.trim();
    const text = postText.value.trim();
    const eventName = postEvent.value.trim();
    const location = postLocation.value.trim();

    if (!name || !text || !eventName || !location) {
        alert("Please complete every field.");
        return;
    }

    if (
        name.length > 60 ||
        text.length > 1000 ||
        eventName.length > 120 ||
        location.length > 120
    ) {
        alert("One or more fields exceed the character limit.");
        return;
    }

    submitPost.disabled = true;
    submitPost.textContent = "Posting...";

    try {
        await addDoc(collection(db, "posts"), {
            authorId: currentUser.uid,
            authorName: name,
            content: text,
            eventName: eventName,
            location: location,
            createdAt: serverTimestamp()
        });

        postForm.reset();
        postName.value = getDisplayName();

        postFormContainer.classList.add("hidden");

        showStatus("");
    } catch (error) {
        console.error("Unable to create post:", error);

        alert(
            "Your post could not be saved. Check your Firestore rules and try again."
        );
    } finally {
        submitPost.disabled = false;
        submitPost.textContent = "Post";
    }
});

/* CLEAN UP LISTENERS */

window.addEventListener("pagehide", () => {
    if (stopPostsListener) {
        stopPostsListener();
    }

    stopCommentListeners();
});
