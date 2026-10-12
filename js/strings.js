
const openPostForm = document.getElementById("openPostForm");
const postFormContainer = document.getElementById("postFormContainer");
const cancelPost = document.getElementById("cancelPost");
const postForm = document.getElementById("postForm");
const stringsFeed = document.getElementById("stringsFeed");

/* ORIGINAL POSTS */

const starterPosts = [
    {
        id: "mike-markets",
        name: "Mike S",
        text: "Brisbane City Markets looks pretty good this week. Mainly going for the food honestly 😅 Anyone else keen to come along?",
        eventName: "Brisbane City Markets",
        location: "Queen Street Mall",
        comments: []
    },

    {
        id: "sally-matsuri",
        name: "Sally S",
        text: "I’m interested in heading to Matsuri Brisbane. The performances and cultural activities look really fun and I’d love some company!",
        eventName: "Matsuri Brisbane",
        location: "Brisbane",
        comments: []
    },

    {
        id: "holly-ferny",
        name: "Holly M",
        text: "Thinking about going to the Ferny Grove Festival. Looks like there’ll be food, live entertainment and heaps happening. Happy to meet a few people there rather than going solo :)",
        eventName: "Ferny Grove Festival",
        location: "Ferny Grove",
        comments: []
    },

    {
        id: "priya-markets",
        name: "Priya K",
        text: "I really want to explore the Brisbane City Markets. Food stalls + walking around the city sounds like an ideal afternoon. Anyone want to join?",
        eventName: "Brisbane City Markets",
        location: "Queen Street Mall",
        comments: []
    }
];

/* LOCAL STORAGE */

function readPosts() {
    try {
        const value = JSON.parse(
            localStorage.getItem("introspheer-strings-v1")
        );

        return Array.isArray(value) ? value : starterPosts;
    } catch {
        return starterPosts;
    }
}

let posts = readPosts();

function savePosts() {
    localStorage.setItem(
        "introspheer-strings-v1",
        JSON.stringify(posts)
    );
}

/* CREATE HTML ELEMENTS SAFELY */

function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

/* DISPLAY ALL POSTS */

function renderPosts() {
    stringsFeed.replaceChildren();

    posts.forEach(post => {

        const card = makeElement("article", "string-card");
        card.dataset.postId = post.id;

        /* USER */

        const user = makeElement("div", "post-user");

        const avatar = makeElement(
            "div",
            "profile-circle",
            post.name.charAt(0).toUpperCase()
        );

        const name = makeElement("h3", "", post.name);

        user.append(avatar, name);

        /* MESSAGE */

        const message = makeElement(
            "p",
            "post-message",
            post.text
        );

        /* EVENT DETAILS */

        const details = makeElement("div", "event-details");

        const eventLine = makeElement("p");

        const eventTitle = makeElement(
            "strong",
            "",
            post.eventName
        );

        eventLine.appendChild(eventTitle);

        const location = makeElement(
            "p",
            "",
            post.location
        );

        details.append(eventLine, location);

        /* ACTION BUTTONS */

        const actions = makeElement("div", "post-actions");

        const commentCount = Array.isArray(post.comments)
            ? post.comments.length
            : 0;

        const commentButton = makeElement(
            "button",
            "comment-button",
            `Comment (${commentCount})`
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

        /* EXISTING COMMENTS */

        const existingComments = Array.isArray(post.comments)
            ? post.comments
            : [];

        existingComments.forEach(item => {
            const comment = makeElement(
                "div",
                "comment-item"
            );

            const author = makeElement(
                "strong",
                "",
                item.author
            );

            const commentText = makeElement(
                "p",
                "",
                item.text
            );

            comment.append(author, commentText);
            list.appendChild(comment);
        });

        /* COMMENT FORM */

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
            `Comment on ${post.name}'s post`
        );

        const submit = makeElement(
            "button",
            "",
            "Post"
        );

        submit.type = "submit";

        form.append(input, submit);

        section.append(heading, list, form);

        /* SUBMIT COMMENT */

        form.addEventListener("submit", event => {
            event.preventDefault();

            const value = input.value.trim();

            if (!value) return;

            if (!Array.isArray(post.comments)) {
                post.comments = [];
            }

            post.comments.push({
                author: "You",
                text: value
            });

            savePosts();

            const comment = makeElement(
                "div",
                "comment-item"
            );

            const author = makeElement(
                "strong",
                "",
                "You"
            );

            const commentText = makeElement(
                "p",
                "",
                value
            );

            comment.append(author, commentText);
            list.appendChild(comment);

            commentButton.textContent =
                `Comment (${post.comments.length})`;

            form.reset();
        });

        /* OPEN / CLOSE COMMENTS */

        commentButton.addEventListener("click", () => {
            section.classList.toggle("hidden");
        });

        /* JOIN EVENT */

        joinButton.addEventListener("click", () => {

            const eventName = encodeURIComponent(
                post.eventName
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
    });
}

/* OPEN CREATE POST FORM */

openPostForm.addEventListener("click", () => {
    postFormContainer.classList.remove("hidden");

    document.getElementById("postName").focus();
});

/* CANCEL CREATE POST */

cancelPost.addEventListener("click", () => {
    postFormContainer.classList.add("hidden");
    postForm.reset();
});

/* CREATE NEW POST */

postForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document
        .getElementById("postName")
        .value.trim();

    const text = document
        .getElementById("postText")
        .value.trim();

    const eventName = document
        .getElementById("postEvent")
        .value.trim();

    const location = document
        .getElementById("postLocation")
        .value.trim();

    if (!name || !text || !eventName || !location) {
        alert("Please complete every field.");
        return;
    }

    const newPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name,
        text: text,
        eventName: eventName,
        location: location,
        comments: []
    };

    posts.unshift(newPost);

    savePosts();
    renderPosts();

    postForm.reset();
    postFormContainer.classList.add("hidden");
});

/* INITIAL LOAD */

renderPosts();
