const openPostForm = document.getElementById("openPostForm");
const postFormContainer = document.getElementById("postFormContainer");
const cancelPost = document.getElementById("cancelPost");
const postForm = document.getElementById("postForm");
const stringsFeed = document.getElementById("stringsFeed");


/* open create post form */

openPostForm.addEventListener("click", function () {

    postFormContainer.classList.remove("hidden");

});


/* close create post form */

cancelPost.addEventListener("click", function () {

    postFormContainer.classList.add("hidden");

});


/* create new post */

postForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const name = document.getElementById("postName").value;
    const text = document.getElementById("postText").value;
    const eventName = document.getElementById("postEvent").value;
    const location = document.getElementById("postLocation").value;


    const post = document.createElement("article");

    post.classList.add("string-card");


    const firstLetter = name.charAt(0).toUpperCase();


    post.innerHTML = `

        <div class="post-user">

            <div class="profile-circle">
                ${firstLetter}
            </div>

            <h3>${name}</h3>

        </div>


        <p class="post-message">
            ${text}
        </p>


        <div class="event-details">

            <p>
                <strong>${eventName}</strong>
            </p>

            <p>
                ${location}
            </p>

        </div>


        <div class="post-actions">

            <button class="comment-button">
                Comment
            </button>

            <button class="join-button">
                Join
            </button>

        </div>
    `;


    /* add newest post to top */

    stringsFeed.prepend(post);


    /* clear form */

    postForm.reset();


    /* hide form */

    postFormContainer.classList.add("hidden");

});


/* ============================= */
/* JOIN BUTTON */
/* ============================= */

stringsFeed.addEventListener("click", function (event) {

    if (event.target.classList.contains("join-button")) {

        if (event.target.textContent.trim() === "Join") {

            event.target.textContent = "Joined ✓";

        } else {

            event.target.textContent = "Join";

        }

    }

});