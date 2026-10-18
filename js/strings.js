
import { auth, db } from "./firebase.js";
import { supabase } from "./supabase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc
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
const postPhoto = document.getElementById("postPhoto");
const postPhotoPreview = document.getElementById("postPhotoPreview");
const postPhotoImage = document.getElementById("postPhotoImage");
const removePostPhoto = document.getElementById("removePostPhoto");
const postPhotoStatus = document.getElementById("postPhotoStatus");
const BUCKET = "strings-photos";
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 5 * 1024 * 1024;
let selectedPhoto = null;
let previewURL = null;
let posting = false;
function clearPostPhoto() {
    selectedPhoto = null;
    postPhoto.value = "";
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
    postPhotoImage.removeAttribute("src");
    postPhotoPreview.hidden = true;
    postPhotoStatus.textContent = "";
}
postPhoto.addEventListener("change", () => {
    const file = postPhoto.files?.[0];
    clearPostPhoto();
    if (!file) return;
    if (!TYPES[file.type] || !file.size || file.size > MAX_BYTES) {
        postPhotoStatus.textContent = "Choose a JPG, PNG, WebP or GIF image up to 5 MB.";
        return;
    }
    selectedPhoto = file;
    previewURL = URL.createObjectURL(file);
    postPhotoImage.src = previewURL;
    postPhotoPreview.hidden = false;
});
removePostPhoto.addEventListener("click", clearPostPhoto);


let currentUser = null;
let stopPostsListener = null;
let commentListeners = [];

/* LINK STRINGS TO BCC EVENTS */

const EVENTS_API =
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records";
const EVENT_PAGE_SIZE = 100;
const MAX_EVENT_PAGES = 5; // Match the Events page's current 500-record limit.
const MAX_PICKER_RESULTS = 10;
let linkedEvent = null;
let eventPickerPromise = null;
let eventSearchTimer = null;
let eventSearchVersion = 0;
let handledIncomingEvent = false;
let editingPostId = null;
let editingOriginalPost = null;

function getBCCEventId(event) {
    if (event.recordid != null) return String(event.recordid);

    // Same fallback ID used in events.js when recordid is unavailable.
    return JSON.stringify([
        event.subject || event.title,
        event.start_datetime,
        event.venue
    ]);
}

function eventDateLabel(value) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? "Date unavailable" :
        date.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

function clearLinkedEvent({ keepSearch = false } = {}) {
    linkedEvent = null;
    postEvent.value = "";
    postLocation.value = "";
    selectedEventPreview.replaceChildren();
    selectedEventPreview.hidden = true;
    if (!keepSearch) eventPickerSearch.value = "";
}

function selectBCCEvent(event) {
    linkedEvent = event;
    const title = String(event.subject || event.title || "Brisbane Event");
    const venue = String(event.venue || "Venue unavailable");
    postEvent.value = title.slice(0, postEvent.maxLength);
    postLocation.value = venue.slice(0, postLocation.maxLength);
    eventPickerSearch.value = title;
    eventPickerResults.replaceChildren();
    selectedEventPreview.textContent =
        `${title} · ${eventDateLabel(event.start_datetime)} · ${venue}`;
    selectedEventPreview.hidden = false;
    eventPickerStatus.textContent = "Event linked to your String.";
}

async function loadPickerEvents() {
    // Fetch once and reuse for subsequent searches; reset the cache if it fails.
    if (!eventPickerPromise) {
        eventPickerPromise = (async () => {
            const events = new Map();
            for (let page = 0; page < MAX_EVENT_PAGES; page++) {
                const offset = page * EVENT_PAGE_SIZE;
                const response = await fetch(
                    `${EVENTS_API}?limit=${EVENT_PAGE_SIZE}&offset=${offset}`
                );
                if (!response.ok) throw new Error(`BCC API returned ${response.status}`);
                const data = await response.json();
                const batch = data.results || [];
                batch.forEach(event => events.set(getBCCEventId(event), event));
                if (batch.length < EVENT_PAGE_SIZE || offset + batch.length >= data.total_count) {
                    break;
                }
            }
            return [...events.values()];
        })().catch(error => {
            eventPickerPromise = null;
            throw error;
        });
    }
    return eventPickerPromise;
}

function isUpcomingEvent(event) {
    const date = new Date(event.end_datetime || event.start_datetime || "");
    return !Number.isNaN(date.getTime()) && date >= new Date();
}

async function showEventSearchResults(search, version) {
    eventPickerStatus.textContent = "Searching Brisbane events...";
    try {
        const events = await loadPickerEvents();
        if (version !== eventSearchVersion) return;

        const matches = events.filter(event =>
            isUpcomingEvent(event) &&
            [event.subject, event.title, event.venue, event.description]
                .filter(Boolean).join(" ").toLowerCase().includes(search)
        ).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
            .slice(0, MAX_PICKER_RESULTS);

        eventPickerResults.replaceChildren();
        matches.forEach(event => {
            const option = makeElement("button", "event-picker-option");
            option.type = "button";
            option.textContent = `${event.subject || event.title || "Brisbane Event"} · ` +
                `${eventDateLabel(event.start_datetime)} · ${event.venue || "Venue unavailable"}`;
            option.addEventListener("click", () => {
                eventSearchVersion++; // Ignore any older search responses.
                selectBCCEvent(event);
            });
            eventPickerResults.appendChild(option);
        });
        eventPickerStatus.textContent = matches.length
            ? `Choose an event from the ${matches.length} results below.`
            : "No matching upcoming events found in the loaded BCC records.";
    } catch (error) {
        if (version !== eventSearchVersion) return;
        console.error("Unable to search BCC events:", error);
        eventPickerStatus.textContent = "Could not load Brisbane events. Please try searching again.";
    }
}

eventPickerSearch.addEventListener("input", () => {
    clearTimeout(eventSearchTimer);
    const version = ++eventSearchVersion;
    const search = eventPickerSearch.value.trim().toLowerCase();
    clearLinkedEvent({ keepSearch: true });
    eventPickerResults.replaceChildren();

    if (search.length < 2) {
        eventPickerStatus.textContent = "Type at least two characters to search for an event.";
        return;
    }
    eventSearchTimer = setTimeout(() => showEventSearchResults(search, version), 250);
});

async function findBCCEvent(id) {
    let event = null;
    if (!id.startsWith("[")) {
        const response = await fetch(`${EVENTS_API}/${encodeURIComponent(id)}`);
        if (response.ok) {
            const result = await response.json();
            event = result.record || result;
            if (getBCCEventId(event) !== id) event = null;
        }
    }
    if (!event) {
        const events = await loadPickerEvents();
        event = events.find(item => getBCCEventId(item) === id) || null;
    }
    return event;
}

async function prefillEventFromURL() {
    const id = new URLSearchParams(window.location.search).get("event");
    if (!id || id.length > 400) return;

    postFormContainer.classList.remove("hidden");
    postFormContainer.scrollIntoView({ block: "start" });
    eventPickerStatus.textContent = "Loading the selected event...";
    eventPickerResults.replaceChildren();

    try {
        const event = await findBCCEvent(id);
        if (!event) throw new Error("That event was not found in the BCC dataset.");
        selectBCCEvent(event);
        postText.focus();
    } catch (error) {
        console.error("Unable to open linked BCC event:", error);
        clearLinkedEvent();
        eventPickerStatus.textContent =
            "Could not load that event. Search for it above or choose another upcoming event.";
        eventPickerSearch.focus();
    }
}

function clearIncomingEventURL() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("event")) return;
    url.searchParams.delete("event");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

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
    if (!handledIncomingEvent) {
        handledIncomingEvent = true;
        prefillEventFromURL();
    }
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

    let photoElement = null;
    if (typeof post.photoPath === "string" &&
        typeof post.authorId === "string" &&
        post.photoPath.startsWith(`${post.authorId}/`) &&
        /^[A-Za-z0-9_-]+\/[a-f0-9-]+\.(jpg|png|webp|gif)$/.test(post.photoPath)) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(post.photoPath);
        photoElement = makeElement("img", "string-post-photo");
        photoElement.src = data.publicUrl;
        photoElement.alt = `Photo attached to ${authorName}'s post`;
        photoElement.loading = "lazy";
    }

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

    /* EDIT + DELETE FOR OWN POSTS */

    if (currentUser && post.authorId === currentUser.uid) {

        const editButton = makeElement(
            "button",
            "edit-post-button",
            "Edit"
        );

        editButton.type = "button";

        const deleteButton = makeElement(
            "button",
            "delete-post-button",
            "Delete"
        );

        deleteButton.type = "button";

        actions.append(editButton, deleteButton);


        /* EDIT POST */

        editButton.addEventListener("click", async () => {
            if (!currentUser || currentUser.uid !== post.authorId) return;

            // Reuse the Create String form without losing the existing event link.
            editingPostId = post.id;
            editingOriginalPost = post;
            clearLinkedEvent();
            clearPostPhoto();
            clearTimeout(eventSearchTimer);
            const version = ++eventSearchVersion;
            eventPickerResults.replaceChildren();
            eventPickerStatus.textContent = "";

            postName.value = post.authorName || getDisplayName();
            postText.value = post.content || "";
            postEvent.value = post.eventName || "";
            postLocation.value = post.location || "";
            submitPost.textContent = "Save Changes";
            postFormContainer.classList.remove("hidden");
            postFormContainer.scrollIntoView({ block: "start" });
            postText.focus();

            if (post.eventId) {
                eventPickerStatus.textContent = "Loading linked event...";
                try {
                    const linked = await findBCCEvent(post.eventId);
                    // Ignore an old asynchronous request if the user cancels/changes posts.
                    if (version !== eventSearchVersion || editingPostId !== post.id) return;
                    if (linked) selectBCCEvent(linked);
                    else eventPickerStatus.textContent =
                        "Original event is unavailable. You can save your text or select another event.";
                } catch (error) {
                    if (version !== eventSearchVersion || editingPostId !== post.id) return;
                    console.warn("Could not reload linked event:", error);
                    eventPickerStatus.textContent =
                        "Could not reload the linked event. You can still save your text.";
                }
            }
        });

        /* DELETE POST */

        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
                "Are you sure you want to delete this post?"
            );

            if (!confirmed) {
                return;
            }

            try {
                await deleteDoc(
                    doc(db, "posts", post.id)
                );
            } catch (error) {
                console.error("Unable to delete post:", error);
                alert("Your post could not be deleted.");
            }
        });
    }

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

    // Older Strings don't have a BCC record ID; a title alone isn't a reliable link.
    joinButton.disabled = !post.eventId;
    if (!post.eventId) {
        joinButton.title = "This older String does not have a linked BCC event.";
    }

    joinButton.addEventListener("click", () => {
        if (!post.eventId) return;
        window.location.href =
            `events.html?event=${encodeURIComponent(post.eventId)}`;
    });

    /* ADD POST TO FEED */

    card.append(
        user,
        message,
        ...(photoElement ? [photoElement] : []),
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

    if (editingPostId) {
        resetPostForm();
    }
    postFormContainer.classList.remove("hidden");

    if (!postName.value.trim()) {
        postName.value = getDisplayName();
    }

    postText.focus();
});

/* RESET CREATE / EDIT POST */

function resetPostForm() {
    editingPostId = null;
    editingOriginalPost = null;
    postForm.reset();
    clearPostPhoto();
    clearLinkedEvent();
    clearIncomingEventURL();
    clearTimeout(eventSearchTimer);
    eventSearchVersion++;
    eventPickerResults.replaceChildren();
    eventPickerStatus.textContent = "";
    submitPost.textContent = "Post";
    postName.value = currentUser ? getDisplayName() : "";
}

/* CANCEL CREATE POST */

cancelPost.addEventListener("click", () => {
    postFormContainer.classList.add("hidden");
    resetPostForm();
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

    if (name.length > 60 || text.length > 1000 ||
        eventName.length > 120 || location.length > 120) {
        alert("One or more fields exceed the character limit.");
        return;
    }

    // New posts must use an actual selected BCC record. Existing older posts
    // may be edited without inventing an event ID for their legacy text.
    if (!editingPostId && (!linkedEvent || !getBCCEventId(linkedEvent) ||
        eventName !== String(linkedEvent.subject || linkedEvent.title || "Brisbane Event").slice(0, postEvent.maxLength) ||
        location !== String(linkedEvent.venue || "Venue unavailable").slice(0, postLocation.maxLength))) {
        alert("Please select a real BCC event from the search results.");
        return;
    }

    if (editingPostId && !linkedEvent && !editingOriginalPost) return;

    if (posting) return;
    posting = true;
    submitPost.disabled = true;
    cancelPost.disabled = true;
    submitPost.textContent = "Posting...";
    const postingUser = currentUser;
    let uploadedPath = null;
    let saved = false;
    try {
        if (editingPostId) {
            const original = editingOriginalPost;
            if (!original || original.authorId !== postingUser.uid) {
                throw new Error("You can only edit your own String.");
            }
            // Preserve the original event ID when the BCC record cannot be reloaded.
            const chosenEventId = linkedEvent
                ? getBCCEventId(linkedEvent)
                : (original.eventId || null);
            const changes = {
                authorName: name,
                content: text,
                eventName: linkedEvent ? eventName : (original.eventName || eventName),
                location: linkedEvent ? location : (original.location || location)
            };
            if (chosenEventId) changes.eventId = chosenEventId;
            await updateDoc(doc(db, "posts", editingPostId), changes);
            saved = true;
            resetPostForm();
            postFormContainer.classList.add("hidden");
            showStatus("");
            return;
        }

        if (selectedPhoto) {
            const file = selectedPhoto;
            const extension = TYPES[file.type];
            if (!extension || !file.size || file.size > MAX_BYTES) throw new Error("Invalid image. Maximum 5 MB.");
            uploadedPath = `${postingUser.uid}/${crypto.randomUUID()}.${extension}`;
            submitPost.textContent = "Uploading photo...";
            const { error } = await supabase.storage.from(BUCKET).upload(uploadedPath, file, {
                contentType: file.type, upsert: false
            });
            if (error) { uploadedPath = null; throw error; }
        }
        submitPost.textContent = "Posting...";
        await addDoc(collection(db, "posts"), {
            authorId: postingUser.uid,
            authorName: name,
            content: text,
            eventName: eventName,
            location: location,
            eventId: getBCCEventId(linkedEvent),
            ...(uploadedPath ? { photoPath: uploadedPath } : {}),
            createdAt: serverTimestamp()
        });

        saved = true;
        resetPostForm();

        postFormContainer.classList.add("hidden");

        showStatus("");
    } catch (error) {
        console.error("Unable to create post:", error);

        if (uploadedPath && !saved) {
            const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([uploadedPath]);
            if (cleanupError) console.warn("Unable to clean up photo:", cleanupError);
        }
        alert(error.message || "Your post could not be saved. Check Supabase and Firestore policies.");
    } finally {
        posting = false;
        submitPost.disabled = false;
        cancelPost.disabled = false;
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
