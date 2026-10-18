
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
const eventPickerSearch = document.getElementById("eventPickerSearch");
const eventPickerStatus = document.getElementById("eventPickerStatus");
const eventPickerResults = document.getElementById("eventPickerResults");
const selectedEventPreview = document.getElementById("selectedEventPreview");

let currentUser = null;
let stopPostsListener = null;
let commentListeners = [];
let availableEvents = [];
let selectedLinkedEvent = null;
let eventsLoadPromise = null;

// Use the same BCC dataset and stable record IDs as Discover Events.
const EVENTS_API =
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records";

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

/* BCC EVENT PICKER */

function linkedEventId(event) {
    if (event.recordid != null) return String(event.recordid);
    return JSON.stringify([event.subject || event.title, event.start_datetime, event.venue]);
}

function linkedEventLabel(event) {
    const date = new Date(event.start_datetime || "");
    const dateText = Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    return `${dateText} · ${event.venue || "Venue unavailable"}`;
}

async function loadLinkedEvents() {
    if (eventsLoadPromise) return eventsLoadPromise;

    eventPickerStatus.textContent = "Loading available events...";
    eventsLoadPromise = (async () => {
        const uniqueEvents = new Map();
        let fetchedAny = false;

        for (let page = 0; page < 5; page++) {
            try {
                const response = await fetch(`${EVENTS_API}?limit=100&offset=${page * 100}`);
                if (!response.ok) throw new Error(`BCC request failed: ${response.status}`);
                const data = await response.json();
                const batch = data.results || [];
                batch.forEach(event => uniqueEvents.set(linkedEventId(event), event));
                fetchedAny = true;
                if (!batch.length || uniqueEvents.size >= data.total_count) break;
            } catch (error) {
                if (!fetchedAny) throw error;
                console.warn("Some event-picker pages could not load:", error);
                break;
            }
        }

        const now = Date.now();
        availableEvents = [...uniqueEvents.values()].filter(event => {
            const end = Date.parse(event.end_datetime || event.start_datetime || "");
            return Number.isFinite(end) && end >= now;
        });
        eventPickerStatus.textContent = "Search for an event, then select it below.";
        renderEventPickerResults();
    })().catch(error => {
        eventsLoadPromise = null; // Let the user retry opening the form.
        eventPickerStatus.textContent = "Couldn't load events. Close and reopen the form to retry.";
        console.error("Unable to load BCC events for Strings:", error);
    });

    return eventsLoadPromise;
}

function chooseLinkedEvent(event) {
    selectedLinkedEvent = event;
    postEvent.value = (event.subject || event.title || "Brisbane event").slice(0, 120);
    postLocation.value = (event.venue || "Venue unavailable").slice(0, 120);
    eventPickerSearch.value = postEvent.value;
    selectedEventPreview.textContent = `Selected: ${postEvent.value} · ${linkedEventLabel(event)}`;
    selectedEventPreview.hidden = false;
    eventPickerResults.replaceChildren();
    eventPickerStatus.textContent = "Event linked to your String.";
}

function renderEventPickerResults() {
    const search = eventPickerSearch.value.trim().toLowerCase();
    eventPickerResults.replaceChildren();
    if (!search || selectedLinkedEvent) return;

    const matches = availableEvents.filter(event =>
        [event.subject, event.title, event.venue].some(value =>
            String(value || "").toLowerCase().includes(search)
        )
    ).slice(0, 12);

    matches.forEach(event => {
        const button = makeElement("button", "event-picker-result");
        button.type = "button";
        button.append(
            makeElement("strong", "", event.subject || event.title || "Brisbane event"),
            makeElement("small", "", linkedEventLabel(event))
        );
        button.addEventListener("click", () => chooseLinkedEvent(event));
        eventPickerResults.appendChild(button);
    });

    eventPickerStatus.textContent = matches.length
        ? "Choose an event from these results."
        : "No matching events in the first 500 records. Try a different search.";
}

eventPickerSearch.addEventListener("input", () => {
    selectedLinkedEvent = null;
    postEvent.value = "";
    postLocation.value = "";
    selectedEventPreview.hidden = true;
    renderEventPickerResults();
});

function resetLinkedEvent() {
    selectedLinkedEvent = null;
    eventPickerResults.replaceChildren();
    selectedEventPreview.hidden = true;
    eventPickerSearch.value = "";
    postEvent.value = "";
    postLocation.value = "";
}

// Events page can preselect a record without changing the posting interface.
async function preselectLinkedEvent() {
    const id = new URLSearchParams(window.location.search).get("event");
    if (!id || id.length > 400) return;
    await loadLinkedEvents();
    let event = availableEvents.find(item => linkedEventId(item) === id);
    if (!event && !id.startsWith("[")) {
        try {
            const response = await fetch(`${EVENTS_API}/${encodeURIComponent(id)}`);
            if (response.ok) event = await response.json();
        } catch (error) {
            console.warn("Could not preselect linked event:", error);
        }
    }
    if (event) chooseLinkedEvent(event);
    else eventPickerStatus.textContent = "Linked event unavailable. Search for another event.";
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
    const eventDate = post.eventStart
        ? makeElement("p", "", new Date(post.eventStart).toLocaleDateString("en-AU"))
        : null;

    details.append(eventLine, location);
    if (eventDate) details.appendChild(eventDate);

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

    // Historical posts may not have an event ID; don't send users to a broken link.
    joinButton.disabled = !post.eventId;
    if (!post.eventId) joinButton.title = "This older post has no linked BCC event.";
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
        if (!post.eventId) return;
        window.location.href =
            `events.html?event=${encodeURIComponent(post.eventId)}`;
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
    loadLinkedEvents();
});

/* CANCEL CREATE POST */

cancelPost.addEventListener("click", () => {
    postFormContainer.classList.add("hidden");
    postForm.reset();
    resetLinkedEvent();

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

    if (!selectedLinkedEvent) {
        alert("Please select a real event from the search results.");
        return;
    }

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
            eventId: linkedEventId(selectedLinkedEvent),
            eventStart: selectedLinkedEvent.start_datetime || "",
            createdAt: serverTimestamp()
        });

        postForm.reset();
        resetLinkedEvent();
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

// Allow an Events detail page to open this form with its event selected.
if (new URLSearchParams(window.location.search).has("event")) {
    postFormContainer.classList.remove("hidden");
    preselectLinkedEvent();
}

/* CLEAN UP LISTENERS */

window.addEventListener("pagehide", () => {
    if (stopPostsListener) {
        stopPostsListener();
    }

    stopCommentListeners();
});
