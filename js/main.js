const backupUsers = [
    {
        id: "samuel",
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
        ],
        about:
            "An introvert who wants to build meaningful connections through shared interests and local events."
    },

    {
        id: "zach",
        name: "Zach T",
        age: 23,
        gender: "Male",
        mbti: "INFJ",
        suburb: "Toowong",
        interests: [
            "Horse Back Riding",
            "Reading",
            "Football"
        ],
        about:
            "Interested in meeting people through reading, sport and outdoor activities."
    },

    {
        id: "mike",
        name: "Mike S",
        age: 31,
        gender: "Male",
        mbti: "ISFP",
        suburb: "Toowong",
        interests: [
            "Boxing",
            "Reading",
            "Eating"
        ],
        about:
            "Enjoys boxing, reading and discovering new places to eat."
    },

    {
        id: "sally",
        name: "Sally S",
        age: 27,
        gender: "Non-Binary",
        mbti: "ISFJ",
        suburb: "Indooroopilly",
        interests: [
            "Ballet",
            "Painting",
            "Netball"
        ],
        about:
            "Interested in creative activities, ballet and sport."
    },

    {
        id: "holly",
        name: "Holly M",
        age: 24,
        gender: "Female",
        mbti: "Not available",
        suburb: "Carindale",
        interests: [
            "Swimming",
            "Museums",
            "Gaming"
        ],
        about:
            "Enjoys swimming, visiting museums and gaming."
    },

    {
        id: "priya",
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
        ],
        about:
            "Enjoys creative activities, sport and trying new experiences."
    }
];


let users = [...backupUsers];

let selectedUser = null;


const userSearch =
    document.getElementById("userSearch");

const searchSuggestions =
    document.getElementById("searchSuggestions");

const searchMessage =
    document.getElementById("searchMessage");

const currentUserButton =
    document.getElementById("currentUserButton");

const currentAvatar =
    document.getElementById("currentAvatar");

const currentUserName =
    document.getElementById("currentUserName");

const sphereCurrentAvatar =
    document.getElementById("sphereCurrentAvatar");

const profilePanel =
    document.getElementById("profilePanel");

const profileOverlay =
    document.getElementById("profileOverlay");

const closeProfile =
    document.getElementById("closeProfile");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileName =
    document.getElementById("profileName");

const profileLocation =
    document.getElementById("profileLocation");

const profileAge =
    document.getElementById("profileAge");

const profileGender =
    document.getElementById("profileGender");

const profileMBTI =
    document.getElementById("profileMBTI");

const profileInterests =
    document.getElementById("profileInterests");

const profileAbout =
    document.getElementById("profileAbout");

const profileEvents =
    document.getElementById("profileEvents");

const profileConnection =
    document.getElementById("profileConnection");

const connectButton =
    document.getElementById("connectButton");

const messageButton =
    document.getElementById("messageButton");

const sphere =
    document.getElementById("sphere");

const sphereContainer =
    document.getElementById("sphereContainer");

const aboutButton =
    document.getElementById("aboutButton");

const aboutModal =
    document.getElementById("aboutModal");

const closeAbout =
    document.getElementById("closeAbout");

const showReferences =
    document.getElementById("showReferences");

const referenceList =
    document.getElementById("referenceList");


function getUserName(user) {

    if (!user) {
        return "";
    }

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


function getFirstName(user) {

    const name =
        getUserName(user);

    return (
        name.split(" ")[0] ||
        "User"
    );

}


function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .map(function (word) {

            return word.charAt(0);

        })
        .join("")
        .substring(0, 2)
        .toUpperCase();

}


function getUserId(user) {

    return (
        user.id ||
        user.userId ||
        user.user_id ||
        getUserName(user)
    );

}


function normaliseUsers(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.users)
    ) {
        return data.users;
    }

    if (
        data &&
        Array.isArray(data.personas)
    ) {
        return data.personas;
    }

    return [];

}


function mergeUsersWithBackup(loadedUsers) {

    const combined =
        [...loadedUsers];

    backupUsers.forEach(
        function (backupUser) {

            const alreadyExists =
                combined.some(
                    function (user) {

                        return (
                            getUserName(user)
                                .toLowerCase() ===
                            getUserName(backupUser)
                                .toLowerCase()
                        );

                    }
                );

            if (!alreadyExists) {

                combined.push(
                    backupUser
                );

            }

        }
    );

    return combined;

}


async function loadUsers() {

    try {

        const response =
            await fetch(
                "data/userpersona.json"
            );

        if (!response.ok) {

            throw new Error(
                "Could not load userpersona.json"
            );

        }

        const data =
            await response.json();

        const loadedUsers =
            normaliseUsers(data);

        if (
            loadedUsers.length > 0
        ) {

            users =
                mergeUsersWithBackup(
                    loadedUsers
                );

        }

        console.log(
            "Personas loaded:",
            users
        );

    } catch (error) {

        console.warn(
            "Using backup personas because the JSON file could not be loaded.",
            error
        );

        users =
            [...backupUsers];

    }

    setupCurrentUser();

}


function setupCurrentUser() {

    const samuel =
        findUserExact(
            "Samuel Smith"
        ) ||
        backupUsers[0];

    const name =
        getUserName(samuel);

    const initials =
        getInitials(name);

    currentAvatar.textContent =
        initials;

    sphereCurrentAvatar.textContent =
        initials;

    currentUserName.textContent =
        getFirstName(samuel);

}


function findUserExact(value) {

    const searchValue =
        value
            .trim()
            .toLowerCase();

    return (
        users.find(
            function (user) {

                return (
                    getUserName(user)
                        .toLowerCase() ===
                    searchValue
                );

            }
        ) ||
        null
    );

}


function findUser(value) {

    const searchValue =
        value
            .trim()
            .toLowerCase();

    if (!searchValue) {
        return null;
    }

    const exactMatch =
        findUserExact(
            searchValue
        );

    if (exactMatch) {
        return exactMatch;
    }

    return (
        users.find(
            function (user) {

                return (
                    getUserName(user)
                        .toLowerCase()
                        .includes(
                            searchValue
                        )
                );

            }
        ) ||
        null
    );

}


function openUserProfile(user) {

    if (!user) {
        return;
    }

    selectedUser =
        user;

    const name =
        getUserName(user);

    profileAvatar.textContent =
        getInitials(name);

    profileName.textContent =
        name ||
        "User";

    profileLocation.textContent =
        user.suburb ||
        user.location ||
        "Location unavailable";

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

    profileAbout.textContent =
        user.about ||
        "Connect through shared interests and local experiences.";

    displayInterests(
        user
    );

    displayEvents(
        user
    );

    updateConnectionStatus(
        user
    );

    profilePanel.classList.add(
        "open"
    );

    profileOverlay.classList.add(
        "open"
    );

}


function closeUserProfile() {

    profilePanel.classList.remove(
        "open"
    );

    profileOverlay.classList.remove(
        "open"
    );

}


function displayInterests(user) {

    profileInterests.innerHTML =
        "";

    let interests =
        user.interests ||
        [];

    if (
        typeof interests ===
        "string"
    ) {

        interests =
            interests
                .split(",")
                .map(
                    function (interest) {

                        return interest.trim();

                    }
                );

    }

    if (
        !Array.isArray(
            interests
        ) ||
        interests.length === 0
    ) {

        profileInterests.innerHTML =
            '<span class="empty-text">No interests available.</span>';

        return;

    }

    interests.forEach(
        function (interest) {

            const chip =
                document.createElement(
                    "span"
                );

            chip.className =
                "interest-chip";

            chip.textContent =
                interest;

            profileInterests.appendChild(
                chip
            );

        }
    );

}


function displayEvents(user) {

    profileEvents.innerHTML =
        "";

    const events =
        Array.isArray(
            user.events
        )
            ? user.events
            : [];

    if (
        events.length === 0
    ) {

        profileEvents.innerHTML =
            '<p class="empty-text">No upcoming events.</p>';

        return;

    }

    events.forEach(
        function (event) {

            const item =
                document.createElement(
                    "p"
                );

            if (
                typeof event ===
                "string"
            ) {

                item.textContent =
                    event;

            } else {

                item.textContent =
                    event.name ||
                    event.title ||
                    "Upcoming event";

            }

            profileEvents.appendChild(
                item
            );

        }
    );

}


function getConnectionKey() {

    return "introspheerConnections";

}


function getConnections() {

    try {

        const saved =
            localStorage.getItem(
                getConnectionKey()
            );

        if (!saved) {

            return [
                "zach",
                "mike",
                "sally",
                "holly",
                "priya"
            ];

        }

        return (
            JSON.parse(saved) ||
            []
        );

    } catch (error) {

        return [
            "zach",
            "mike",
            "sally",
            "holly",
            "priya"
        ];

    }

}


function isConnected(user) {

    const connections =
        getConnections();

    const userId =
        getUserId(user);

    const userName =
        getUserName(user);

    return connections.some(
        function (connection) {

            return (
                String(connection)
                    .toLowerCase() ===
                    String(userId)
                        .toLowerCase() ||

                String(connection)
                    .toLowerCase() ===
                    userName
                        .toLowerCase()
            );

        }
    );

}


function updateConnectionStatus(user) {

    const connected =
        isConnected(user);

    if (connected) {

        profileConnection.textContent =
            "This person is part of your Sphere.";

        connectButton.textContent =
            "Connected";

        connectButton.disabled =
            true;

    } else {

        profileConnection.textContent =
            "You have not connected with this person yet.";

        connectButton.textContent =
            "Connect";

        connectButton.disabled =
            false;

    }

}


connectButton.addEventListener(
    "click",
    function () {

        if (!selectedUser) {
            return;
        }

        const connections =
            getConnections();

        const userId =
            getUserId(
                selectedUser
            );

        if (
            !isConnected(
                selectedUser
            )
        ) {

            connections.push(
                userId
            );

            localStorage.setItem(
                getConnectionKey(),
                JSON.stringify(
                    connections
                )
            );

        }

        updateConnectionStatus(
            selectedUser
        );

    }
);


messageButton.addEventListener(
    "click",
    function () {

        if (!selectedUser) {
            return;
        }

        localStorage.setItem(
            "selectedChatUser",
            getUserName(
                selectedUser
            )
        );

        window.location.href =
            "chat.html";

    }
);


closeProfile.addEventListener(
    "click",
    closeUserProfile
);


profileOverlay.addEventListener(
    "click",
    closeUserProfile
);


document
    .querySelectorAll(
        ".person-node[data-user]"
    )
    .forEach(
        function (node) {

            node.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    const name =
                        node.dataset.user;

                    let user =
                        findUserExact(
                            name
                        );

                    if (!user) {

                        user =
                            backupUsers.find(
                                function (
                                    backupUser
                                ) {

                                    return (
                                        getUserName(
                                            backupUser
                                        ).toLowerCase() ===
                                        name.toLowerCase()
                                    );

                                }
                            );

                    }

                    if (user) {

                        openUserProfile(
                            user
                        );

                    }

                }
            );

        }
    );


function hideSuggestions() {

    searchSuggestions.hidden =
        true;

    searchSuggestions.innerHTML =
        "";

}


function showSuggestions(matches) {

    searchSuggestions.innerHTML =
        "";

    if (
        matches.length === 0
    ) {

        hideSuggestions();

        return;

    }

    matches.forEach(
        function (user) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "search-suggestion";

            const name =
                getUserName(user);

            const suburb =
                user.suburb ||
                user.location ||
                "";

            const avatar =
                document.createElement(
                    "span"
                );

            avatar.className =
                "suggestion-avatar";

            avatar.textContent =
                getInitials(name);

            const info =
                document.createElement(
                    "span"
                );

            info.className =
                "suggestion-info";

            const strong =
                document.createElement(
                    "strong"
                );

            strong.textContent =
                name;

            const small =
                document.createElement(
                    "small"
                );

            small.textContent =
                suburb;

            info.appendChild(
                strong
            );

            info.appendChild(
                small
            );

            button.appendChild(
                avatar
            );

            button.appendChild(
                info
            );

            button.addEventListener(
                "click",
                function () {

                    userSearch.value =
                        name;

                    searchMessage.textContent =
                        "";

                    hideSuggestions();

                    openUserProfile(
                        user
                    );

                }
            );

            searchSuggestions.appendChild(
                button
            );

        }
    );

    searchSuggestions.hidden =
        false;

}


userSearch.addEventListener(
    "input",
    function () {

        const value =
            userSearch.value
                .trim()
                .toLowerCase();

        searchMessage.textContent =
            "";

        if (
            value.length < 2
        ) {

            hideSuggestions();

            return;

        }

        const matches =
            users
                .filter(
                    function (user) {

                        return (
                            getUserName(
                                user
                            )
                                .toLowerCase()
                                .includes(
                                    value
                                )
                        );

                    }
                )
                .slice(
                    0,
                    6
                );

        showSuggestions(
            matches
        );

    }
);


userSearch.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            const value =
                userSearch.value
                    .trim();

            hideSuggestions();

            if (!value) {

                searchMessage.textContent =
                    "Enter a person's name.";

                return;

            }

            const user =
                findUser(
                    value
                );

            if (!user) {

                searchMessage.textContent =
                    "User not found.";

                return;

            }

            searchMessage.textContent =
                "";

            userSearch.value =
                getUserName(
                    user
                );

            openUserProfile(
                user
            );

        }

        if (
            event.key ===
            "Escape"
        ) {

            hideSuggestions();

        }

    }
);


document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".search-wrapper"
            )
        ) {

            hideSuggestions();

        }

    }
);


currentUserButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "account.html";

    }
);


aboutButton.addEventListener(
    "click",
    function () {

        aboutModal.hidden =
            false;

        document.body.style.overflow =
            "hidden";

    }
);


closeAbout.addEventListener(
    "click",
    function () {

        aboutModal.hidden =
            true;

        document.body.style.overflow =
            "";

    }
);


aboutModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            aboutModal
        ) {

            aboutModal.hidden =
                true;

            document.body.style.overflow =
                "";

        }

    }
);


showReferences.addEventListener(
    "click",
    function () {

        const currentlyHidden =
            referenceList.hidden;

        referenceList.hidden =
            !currentlyHidden;

        if (currentlyHidden) {

            showReferences.textContent =
                "Hide Reference List";

        } else {

            showReferences.textContent =
                "View APA 7 Reference List";

        }

    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            hideSuggestions();

            closeUserProfile();

            aboutModal.hidden =
                true;

            document.body.style.overflow =
                "";

        }

    }
);


let rotationX = 0;

let rotationY = 0;

let sphereScale = 1;

let isDragging = false;

let previousX = 0;

let previousY = 0;

let lastAnimationTime =
    performance.now();


function updateSphereTransform() {

    sphere.style.transform =
        "rotateX(" +
        rotationX +
        "deg) " +

        "rotateY(" +
        rotationY +
        "deg) " +

        "scale(" +
        sphereScale +
        ")";

}


function animateSphere(time) {

    const delta =
        time -
        lastAnimationTime;

    lastAnimationTime =
        time;

    if (
        !isDragging
    ) {

        rotationY +=
            delta * 0.005;

    }

    updateSphereTransform();

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
                ".person-node"
            )
        ) {

            return;

        }

        isDragging =
            true;

        previousX =
            event.clientX;

        previousY =
            event.clientY;

        sphere.classList.add(
            "dragging"
        );

        try {

            sphere.setPointerCapture(
                event.pointerId
            );

        } catch (error) {}

    }
);


sphere.addEventListener(
    "pointermove",
    function (event) {

        if (
            !isDragging
        ) {
            return;
        }

        const differenceX =
            event.clientX -
            previousX;

        const differenceY =
            event.clientY -
            previousY;

        rotationY +=
            differenceX *
            0.35;

        rotationX -=
            differenceY *
            0.35;

        previousX =
            event.clientX;

        previousY =
            event.clientY;

        updateSphereTransform();

    }
);


function finishDragging(event) {

    isDragging =
        false;

    sphere.classList.remove(
        "dragging"
    );

    try {

        if (
            sphere.hasPointerCapture(
                event.pointerId
            )
        ) {

            sphere.releasePointerCapture(
                event.pointerId
            );

        }

    } catch (error) {}

}


sphere.addEventListener(
    "pointerup",
    finishDragging
);


sphere.addEventListener(
    "pointercancel",
    finishDragging
);


sphereContainer.addEventListener(
    "wheel",
    function (event) {

        if (
            !event.ctrlKey
        ) {

            return;

        }

        event.preventDefault();

        if (
            event.deltaY < 0
        ) {

            sphereScale +=
                0.05;

        } else {

            sphereScale -=
                0.05;

        }

        sphereScale =
            Math.max(
                0.75,
                Math.min(
                    1.35,
                    sphereScale
                )
            );

        updateSphereTransform();

    },
    {
        passive: false
    }
);


let pinchStartDistance =
    null;

let pinchStartScale =
    1;


sphereContainer.addEventListener(
    "touchstart",
    function (event) {

        if (
            event.touches.length !==
            2
        ) {

            return;

        }

        const first =
            event.touches[0];

        const second =
            event.touches[1];

        pinchStartDistance =
            Math.hypot(
                second.clientX -
                first.clientX,

                second.clientY -
                first.clientY
            );

        pinchStartScale =
            sphereScale;

    },
    {
        passive: true
    }
);


sphereContainer.addEventListener(
    "touchmove",
    function (event) {

        if (
            event.touches.length !==
            2 ||
            pinchStartDistance ===
            null
        ) {

            return;

        }

        const first =
            event.touches[0];

        const second =
            event.touches[1];

        const currentDistance =
            Math.hypot(
                second.clientX -
                first.clientX,

                second.clientY -
                first.clientY
            );

        sphereScale =
            pinchStartScale *
            (
                currentDistance /
                pinchStartDistance
            );

        sphereScale =
            Math.max(
                0.75,
                Math.min(
                    1.35,
                    sphereScale
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
            event.touches.length <
            2
        ) {

            pinchStartDistance =
                null;

        }

    },
    {
        passive: true
    }
);


loadUsers();