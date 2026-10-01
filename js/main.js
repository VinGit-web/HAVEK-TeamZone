let personas = [];

const homeSearchInput =
    document.getElementById("homeSearchInput");

const searchSuggestions =
    document.getElementById("searchSuggestions");

const searchMessage =
    document.getElementById("searchMessage");

const profileModal =
    document.getElementById("profileModal");

const closeProfileModal =
    document.getElementById("closeProfileModal");

const profileInitials =
    document.getElementById("profileInitials");

const profileName =
    document.getElementById("profileName");

const profileAge =
    document.getElementById("profileAge");

const profileGender =
    document.getElementById("profileGender");

const profileMBTI =
    document.getElementById("profileMBTI");

const profileSuburb =
    document.getElementById("profileSuburb");

const profileInterests =
    document.getElementById("profileInterests");

const connectButton =
    document.getElementById("connectButton");

const sphere =
    document.getElementById("sphere");

const sphereContainer =
    document.getElementById("sphereContainer");

const aboutInfoButton =
    document.getElementById("aboutInfoButton");

const aboutPopup =
    document.getElementById("aboutPopup");

const closeAboutPopup =
    document.getElementById("closeAboutPopup");


async function loadPersonas() {

    try {

        const response =
            await fetch("data/personas.json");

        if (!response.ok) {
            throw new Error(
                "Could not load persona dataset."
            );
        }

        const data =
            await response.json();

        if (Array.isArray(data)) {
            personas = data;
        } else if (Array.isArray(data.personas)) {
            personas = data.personas;
        } else if (Array.isArray(data.users)) {
            personas = data.users;
        } else {
            personas = [];
        }

        console.log(
            "Personas loaded:",
            personas
        );

    } catch (error) {

        console.error(
            "Error loading personas:",
            error
        );

        personas = getBackupPersonas();

    }

}


function getBackupPersonas() {

    return [
        {
            name: "Samuel Smith",
            age: 22,
            gender: "Male",
            mbti: "INFP",
            suburb: "South Bank",
            interests: [
                "Gaming",
                "Pottery",
                "Ballet",
                "Museums",
                "Reading"
            ]
        },

        {
            name: "Zach T",
            age: 23,
            gender: "Male",
            mbti: "INFJ",
            suburb: "Toowong",
            interests: [
                "Horse Back Riding",
                "Reading",
                "Football"
            ]
        },

        {
            name: "Mike S",
            age: 31,
            gender: "Male",
            mbti: "ISFP",
            suburb: "Toowong",
            interests: [
                "Boxing",
                "Reading",
                "Eating"
            ]
        },

        {
            name: "Sally S",
            age: 27,
            gender: "Non-Binary",
            mbti: "ISFJ",
            suburb: "Indooroopilly",
            interests: [
                "Ballet",
                "Painting",
                "Netball"
            ]
        },

        {
            name: "Holly M",
            age: 24,
            gender: "Female",
            mbti: "",
            suburb: "Carindale",
            interests: [
                "Swimming",
                "Museums",
                "Gaming"
            ]
        },

        {
            name: "Priya K",
            age: 20,
            gender: "Female",
            mbti: "ESFP",
            suburb: "Mt Gravatt",
            interests: [
                "Pottery",
                "Horse Back Riding",
                "Fencing",
                "Eating"
            ]
        }
    ];

}


function getUserName(user) {

    if (user.name) {
        return user.name;
    }

    if (user.fullName) {
        return user.fullName;
    }

    if (user.full_name) {
        return user.full_name;
    }

    const firstName =
        user.firstName ||
        user.first_name ||
        "";

    const lastName =
        user.lastName ||
        user.last_name ||
        "";

    return (
        firstName +
        " " +
        lastName
    ).trim();

}


function findUser(searchValue) {

    const value =
        searchValue
            .trim()
            .toLowerCase();

    if (!value) {
        return null;
    }

    let exactMatch =
        personas.find(function (user) {

            return (
                getUserName(user)
                    .toLowerCase() === value
            );

        });

    if (exactMatch) {
        return exactMatch;
    }


    return personas.find(function (user) {

        return (
            getUserName(user)
                .toLowerCase()
                .includes(value)
        );

    }) || null;

}


function searchForUser() {

    const searchValue =
        homeSearchInput.value.trim();

    hideSuggestions();

    if (searchValue.length === 0) {

        searchMessage.textContent =
            "Please enter a user name.";

        return;
    }


    const foundUser =
        findUser(searchValue);


    if (!foundUser) {

        searchMessage.textContent =
            "User not found.";

        return;
    }


    searchMessage.textContent = "";

    homeSearchInput.value =
        getUserName(foundUser);

    openUserProfile(foundUser);

}


homeSearchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            searchForUser();

        }

    }
);


homeSearchInput.addEventListener(
    "input",
    function () {

        const value =
            homeSearchInput.value
                .trim()
                .toLowerCase();

        searchMessage.textContent = "";


        if (value.length < 2) {

            hideSuggestions();

            return;

        }


        const matches =
            personas
                .filter(function (user) {

                    return (
                        getUserName(user)
                            .toLowerCase()
                            .includes(value)
                    );

                })
                .slice(0, 5);


        showSuggestions(matches);

    }
);


function showSuggestions(users) {

    searchSuggestions.innerHTML = "";


    if (users.length === 0) {

        hideSuggestions();

        return;

    }


    users.forEach(function (user) {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "search-suggestion";

        button.textContent =
            getUserName(user);


        button.addEventListener(
            "click",
            function () {

                homeSearchInput.value =
                    getUserName(user);

                hideSuggestions();

                openUserProfile(user);

            }
        );


        searchSuggestions.appendChild(
            button
        );

    });


    searchSuggestions.hidden = false;

}


function hideSuggestions() {

    searchSuggestions.hidden = true;

    searchSuggestions.innerHTML = "";

}


document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".home-search-container"
            )
        ) {

            hideSuggestions();

        }

    }
);


function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .map(function (part) {
            return part.charAt(0);
        })
        .join("")
        .substring(0, 2)
        .toUpperCase();

}


function openUserProfile(user) {

    const name =
        getUserName(user);

    profileInitials.textContent =
        getInitials(name);

    profileName.textContent =
        name || "User";

    profileAge.textContent =
        user.age ||
        "Not available";

    profileGender.textContent =
        user.gender ||
        "Not available";

    profileMBTI.textContent =
        user.mbti ||
        user.MBTI ||
        "Not available";

    profileSuburb.textContent =
        user.suburb ||
        user.location ||
        "Not available";


    if (
        Array.isArray(user.interests)
    ) {

        profileInterests.textContent =
            user.interests.join(", ");

    } else {

        profileInterests.textContent =
            user.interests ||
            "Not available";

    }


    profileModal.hidden = false;

    profileModal.dataset.currentUser =
        name;

}


closeProfileModal.addEventListener(
    "click",
    function () {

        profileModal.hidden = true;

    }
);


profileModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === profileModal
        ) {

            profileModal.hidden = true;

        }

    }
);


document
    .querySelectorAll(".sphere-person[data-user]")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                const userName =
                    button.dataset.user;

                const user =
                    findUser(userName);


                if (user) {

                    openUserProfile(user);

                }

            }
        );

    });


connectButton.addEventListener(
    "click",
    function () {

        const selectedUser =
            profileModal.dataset.currentUser;

        if (!selectedUser) {
            return;
        }

        connectButton.textContent =
            "Connected";

        connectButton.disabled =
            true;

        setTimeout(function () {

            connectButton.textContent =
                "Connect";

            connectButton.disabled =
                false;

        }, 2000);

    }
);


aboutInfoButton.addEventListener(
    "click",
    function () {

        aboutPopup.hidden = false;

    }
);


closeAboutPopup.addEventListener(
    "click",
    function () {

        aboutPopup.hidden = true;

    }
);


aboutPopup.addEventListener(
    "click",
    function (event) {

        if (
            event.target === aboutPopup
        ) {

            aboutPopup.hidden = true;

        }

    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            profileModal.hidden = true;

            aboutPopup.hidden = true;

            hideSuggestions();

        }

    }
);


let rotationX = 0;
let rotationY = 0;

let scale = 1;

let dragging = false;

let previousX = 0;
let previousY = 0;

let autoRotate = true;

let lastFrameTime =
    performance.now();


function updateSphereTransform() {

    sphere.style.transform =
        "rotateX(" +
        rotationX +
        "deg) rotateY(" +
        rotationY +
        "deg) scale(" +
        scale +
        ")";

}


function animateSphere(currentTime) {

    const delta =
        currentTime -
        lastFrameTime;

    lastFrameTime =
        currentTime;


    if (
        autoRotate &&
        !dragging
    ) {

        rotationY +=
            delta * 0.006;

        updateSphereTransform();

    }


    requestAnimationFrame(
        animateSphere
    );

}


requestAnimationFrame(
    animateSphere
);


sphere.addEventListener(
    "pointerdown",
    function (event) {

        if (
            event.target.closest(
                ".sphere-person"
            )
        ) {
            return;
        }


        dragging = true;

        autoRotate = false;

        previousX =
            event.clientX;

        previousY =
            event.clientY;

        sphere.classList.add(
            "dragging"
        );

        sphere.setPointerCapture(
            event.pointerId
        );

    }
);


sphere.addEventListener(
    "pointermove",
    function (event) {

        if (!dragging) {
            return;
        }


        const differenceX =
            event.clientX -
            previousX;

        const differenceY =
            event.clientY -
            previousY;


        rotationY +=
            differenceX * 0.35;

        rotationX -=
            differenceY * 0.35;


        previousX =
            event.clientX;

        previousY =
            event.clientY;


        updateSphereTransform();

    }
);


function stopDragging(event) {

    if (!dragging) {
        return;
    }


    dragging = false;

    sphere.classList.remove(
        "dragging"
    );


    if (
        sphere.hasPointerCapture(
            event.pointerId
        )
    ) {

        sphere.releasePointerCapture(
            event.pointerId
        );

    }


    setTimeout(function () {

        autoRotate = true;

    }, 1500);

}


sphere.addEventListener(
    "pointerup",
    stopDragging
);


sphere.addEventListener(
    "pointercancel",
    stopDragging
);


sphere.addEventListener(
    "wheel",
    function () {

        return;

    },
    {
        passive: true
    }
);


let initialPinchDistance = null;
let initialPinchScale = 1;


sphereContainer.addEventListener(
    "touchstart",
    function (event) {

        if (
            event.touches.length === 2
        ) {

            const touchOne =
                event.touches[0];

            const touchTwo =
                event.touches[1];


            initialPinchDistance =
                Math.hypot(
                    touchTwo.clientX -
                    touchOne.clientX,

                    touchTwo.clientY -
                    touchOne.clientY
                );


            initialPinchScale =
                scale;

        }

    },
    {
        passive: true
    }
);


sphereContainer.addEventListener(
    "touchmove",
    function (event) {

        if (
            event.touches.length !== 2 ||
            initialPinchDistance === null
        ) {
            return;
        }


        const touchOne =
            event.touches[0];

        const touchTwo =
            event.touches[1];


        const currentDistance =
            Math.hypot(
                touchTwo.clientX -
                touchOne.clientX,

                touchTwo.clientY -
                touchOne.clientY
            );


        const pinchAmount =
            currentDistance /
            initialPinchDistance;


        scale =
            initialPinchScale *
            pinchAmount;


        scale =
            Math.min(
                1.35,
                Math.max(
                    0.75,
                    scale
                )
            );


        updateSphereTransform();

    },
    {
        passive: true
    }
);


sphereContainer.addEventListener(
    "touchend",
    function (event) {

        if (
            event.touches.length < 2
        ) {

            initialPinchDistance =
                null;

        }

    },
    {
        passive: true
    }
);


loadPersonas();