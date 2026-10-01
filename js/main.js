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

    return (
        user.name ||
        user.fullName ||
        user.full_name ||
        ""
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


function findUser(value) {

    const searchValue =
        value.trim().toLowerCase();

    if (!searchValue) {
        return null;
    }

    const exact =
        users.find(function (user) {

            return (
                getUserName(user)
                    .toLowerCase() ===
                searchValue
            );

        });

    if (exact) {
        return exact;
    }

    return (
        users.find(function (user) {

            return getUserName(user)
                .toLowerCase()
                .includes(searchValue);

        }) ||
        null
    );

}


async function loadUsers() {

    try {

        const response =
            await fetch(
                "data/userpersona.json"
            );

        if (!response.ok) {
            throw new Error(
                "Persona dataset unavailable"
            );
        }

        const data =
            await response.json();

        let loadedUsers = [];

        if (Array.isArray(data)) {
            loadedUsers = data;
        }

        if (
            data &&
            Array.isArray(data.users)
        ) {
            loadedUsers = data.users;
        }

        if (
            data &&
            Array.isArray(data.personas)
        ) {
            loadedUsers = data.personas;
        }

        if (loadedUsers.length > 0) {

            backupUsers.forEach(
                function (backup) {

                    const exists =
                        loadedUsers.some(
                            function (user) {

                                return (
                                    getUserName(user)
                                        .toLowerCase() ===
                                    backup.name
                                        .toLowerCase()
                                );

                            }
                        );

                    if (!exists) {
                        loadedUsers.push(
                            backup
                        );
                    }

                }
            );

            users = loadedUsers;

        }

    } catch (error) {

        users =
            [...backupUsers];

        console.warn(
            "Using backup persona data.",
            error
        );

    }

}


function openProfile(user) {

    if (!user) {
        return;
    }

    selectedUser = user;

    const name =
        getUserName(user);

    profileAvatar.textContent =
        getInitials(name);

    profileName.textContent =
        name;

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
        "Connect through shared interests and local events.";

    displayInterests(user);

    displayEvents(user);

    updateConnection(user);

    profilePanel.classList.add(
        "open"
    );

    profileOverlay.classList.add(
        "open"
    );

}


function closeProfilePanel() {

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
        user.interests || [];

    if (
        typeof interests ===
        "string"
    ) {

        interests =
            interests.split(",");

    }

    if (
        !Array.isArray(interests) ||
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
                interest.trim();

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
        Array.isArray(user.events)
            ? user.events
            : [];

    if (events.length === 0) {

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

            item.textContent =
                typeof event === "string"
                    ? event
                    : event.name ||
                      event.title ||
                      "Upcoming event";

            profileEvents.appendChild(
                item
            );

        }
    );

}


function getConnections() {

    try {

        const saved =
            localStorage.getItem(
                "introspheerConnections"
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

        return JSON.parse(saved);

    } catch {

        return [];

    }

}


function updateConnection(user) {

    const connections =
        getConnections();

    const userId =
        user.id ||
        getUserName(user);

    const connected =
        connections.some(
            function (item) {

                return (
                    String(item)
                        .toLowerCase() ===
                    String(userId)
                        .toLowerCase()
                );

            }
        );

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
            selectedUser.id ||
            getUserName(selectedUser);

        if (
            !connections.includes(userId)
        ) {

            connections.push(userId);

            localStorage.setItem(
                "introspheerConnections",
                JSON.stringify(
                    connections
                )
            );

        }

        updateConnection(
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


document
    .querySelectorAll(
        ".person-node[data-user]"
    )
    .forEach(
        function (node) {

            node.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    const user =
                        findUser(
                            node.dataset.user
                        );

                    if (user) {
                        openProfile(user);
                    }

                }
            );

        }
    );


closeProfile.addEventListener(
    "click",
    closeProfilePanel
);


profileOverlay.addEventListener(
    "click",
    closeProfilePanel
);


function hideSuggestions() {

    searchSuggestions.innerHTML =
        "";

    searchSuggestions.hidden =
        true;

}


function showSuggestions(matches) {

    searchSuggestions.innerHTML =
        "";

    if (matches.length === 0) {

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

            const avatar =
                document.createElement(
                    "span"
                );

            avatar.className =
                "suggestion-avatar";

            avatar.textContent =
                getInitials(
                    getUserName(user)
                );

            const info =
                document.createElement(
                    "span"
                );

            info.className =
                "suggestion-info";

            const name =
                document.createElement(
                    "strong"
                );

            name.textContent =
                getUserName(user);

            const suburb =
                document.createElement(
                    "small"
                );

            suburb.textContent =
                user.suburb ||
                user.location ||
                "";

            info.appendChild(name);
            info.appendChild(suburb);

            button.appendChild(avatar);
            button.appendChild(info);

            button.addEventListener(
                "click",
                function () {

                    userSearch.value =
                        getUserName(user);

                    hideSuggestions();

                    openProfile(user);

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

        if (value.length < 2) {

            hideSuggestions();

            return;

        }

        const matches =
            users
                .filter(
                    function (user) {

                        return getUserName(
                            user
                        )
                            .toLowerCase()
                            .includes(value);

                    }
                )
                .slice(0, 6);

        showSuggestions(matches);

    }
);


userSearch.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !==
            "Enter"
        ) {
            return;
        }

        event.preventDefault();

        const user =
            findUser(
                userSearch.value
            );

        hideSuggestions();

        if (!user) {

            searchMessage.textContent =
                "User not found.";

            return;

        }

        searchMessage.textContent =
            "";

        userSearch.value =
            getUserName(user);

        openProfile(user);

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

        const isHidden =
            referenceList.hidden;

        referenceList.hidden =
            !isHidden;

        showReferences.textContent =
            isHidden
                ? "Hide Reference List"
                : "View APA 7 Reference List";

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

            closeProfilePanel();

            aboutModal.hidden =
                true;

            document.body.style.overflow =
                "";

        }

    }
);


let rotationX = -8;
let rotationY = 0;

let scale = 1;

let dragging = false;

let previousX = 0;
let previousY = 0;

let lastTime =
    performance.now();


function updateSphere() {

    sphere.style.transform =
        `rotateX(${rotationX}deg)
         rotateY(${rotationY}deg)
         scale3d(${scale}, ${scale}, ${scale})`;

}


function animateSphere(time) {

    const delta =
        time - lastTime;

    lastTime = time;

    if (!dragging) {

        rotationY +=
            delta * 0.01;

    }

    updateSphere();

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

        dragging = true;

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

        const deltaX =
            event.clientX -
            previousX;

        const deltaY =
            event.clientY -
            previousY;

        rotationY +=
            deltaX * 0.4;

        rotationX -=
            deltaY * 0.4;

        rotationX =
            Math.max(
                -80,
                Math.min(
                    80,
                    rotationX
                )
            );

        previousX =
            event.clientX;

        previousY =
            event.clientY;

        updateSphere();

    }
);


sphere.addEventListener(
    "pointerup",
    function (event) {

        dragging = false;

        sphere.classList.remove(
            "dragging"
        );

        try {

            sphere.releasePointerCapture(
                event.pointerId
            );

        } catch {}

    }
);


sphere.addEventListener(
    "pointercancel",
    function () {

        dragging = false;

        sphere.classList.remove(
            "dragging"
        );

    }
);


sphereContainer.addEventListener(
    "wheel",
    function (event) {

        if (!event.ctrlKey) {

            return;

        }

        event.preventDefault();

        if (
            event.deltaY < 0
        ) {

            scale += 0.05;

        } else {

            scale -= 0.05;

        }

        scale =
            Math.max(
                0.7,
                Math.min(
                    1.4,
                    scale
                )
            );

        updateSphere();

    },
    {
        passive: false
    }
);


loadUsers();