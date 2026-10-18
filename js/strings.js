
import { auth, db } from "./firebase.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js";

const storage = getStorage(auth.app);

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
const postPhoto = document.getElementById("postPhoto");
const postPhotoPreview = document.getElementById("postPhotoPreview");
const postPhotoImage = document.getElementById("postPhotoImage");
const removePostPhoto = document.getElementById("removePostPhoto");
const postPhotoStatus = document.getElementById("postPhotoStatus");
let selectedPhoto = null;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function clearPostPhoto() {
    selectedPhoto = null;
    postPhoto.value = "";
    postPhotoImage.removeAttribute("src");
    postPhotoPreview.hidden = true;
    postPhotoStatus.textContent = "";
}

postPhoto.addEventListener("change", () => {
    const file = postPhoto.files?.[0];
    clearPostPhoto();
    if (!file) return;
    if (!PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) {
        postPhotoStatus.textContent = "Choose a JPG, PNG, WebP or GIF image up to 5 MB.";
        return;
    }
    selectedPhoto = file;
    const reader = new FileReader();
    reader.onload = () => {
        if (selectedPhoto === file) {
            postPhotoImage.src = reader.result;
            postPhotoPreview.hidden = false;
        }
    };
    reader.readAsDataURL(file);
});
removePostPhoto.addEventListener("click", clearPostPhoto);

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

    let postPhotoElement = null;
    if (typeof post.photoURL === "string" && /^https:\/\//i.test(post.photoURL)) {
        const photo = makeElement("img", "string-post-photo");
        photo.src = post.photoURL;
        photo.alt = `Photo attached to ${authorName}'s post`;
        photo.loading = "lazy";
        photo.decoding = "async";
        postPhotoElement = photo;
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
        const newContent = prompt(
            "Edit your post:",
            post.content || ""
        );

        if (newContent === null) {
            return;
        }

        const trimmedContent = newContent.trim();

        if (!trimmedContent) {
            alert("Post cannot be empty.");
            return;
        }

        if (trimmedContent.length > 1000) {
            alert("Post must be under 1000 characters.");
            return;
        }

        try {
            await updateDoc(
                doc(db, "posts", post.id),
                {
                    content: trimmedContent
                }
            );
        } catch (error) {
            console.error("Unable to edit post:", error);
            alert("Your post could not be edited.");
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
        ...(postPhotoElement ? [postPhotoElement] : []),
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
    clearPostPhoto();

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
    let uploadedPhotoRef = null;
    let postSaved = false;
    try {
        let photoURL = null;
        let photoPath = null;
        if (selectedPhoto) {
            const file = selectedPhoto;
            if (!PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) throw new Error("Invalid image. Select JPG, PNG, WebP or GIF up to 5 MB.");
            const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[file.type];
            const id = crypto.randomUUID();
            photoPath = `strings/${currentUser.uid}/${id}.${extension}`;
            uploadedPhotoRef = ref(storage, photoPath);
            submitPost.textContent = "Uploading photo...";
            await uploadBytes(uploadedPhotoRef, file, { contentType: file.type });
            photoURL = await getDownloadURL(uploadedPhotoRef);
        }
        submitPost.textContent = "Posting...";
        await addDoc(collection(db, "posts"), {
            authorId: currentUser.uid,
            authorName: name,
            content: text,
            eventName: eventName,
            location: location,
            photoURL,
            photoPath,
            createdAt: serverTimestamp()
        });

        postSaved = true;
        postForm.reset();
        clearPostPhoto();
        postName.value = getDisplayName();

        postFormContainer.classList.add("hidden");

        showStatus("");
    } catch (error) {
        console.error("Unable to create post:", error);
        if (uploadedPhotoRef && !postSaved) {
            try { await deleteObject(uploadedPhotoRef); } catch (cleanupError) { console.warn("Unable to clean up uploaded photo:", cleanupError); }
        }
        alert(error.message || "Your post could not be saved. Check Firebase Storage and Firestore rules.");
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
