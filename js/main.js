import { watchProfileEvents } from "./profile-events.js";
import * as THREE from "three";


import { svgAvatar } from "./avatar-renderer.js";

import {
  subscribeToSphere,
  getSphereRequest,
  isSphereConnected,
  sendSphereRequest,
  respondToSphereRequest
} from "./sphere-firebase.js";



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

    return `${firstName} ${lastName}`.trim();
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
    if (!user) return "";

    return (
        user.uid ||
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



function loadUsers() {
  // Home now receives its users from Firebase.
  // The local JSON file is no longer an account database.
}

function setupCurrentUser(me) {
  if (!me) {
    currentUserName.textContent = "Loading...";
    currentAvatar.textContent = "?";
    return;
  }

  const name = getUserName(me);

  currentUserName.textContent = getFirstName(me);

  if (me.avatar) {
    currentAvatar.innerHTML = svgAvatar(me.avatar);
  } else {
    currentAvatar.textContent = getInitials(name);
  }
}

function findUserExact(value) {
    const searchValue =
        String(value)
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
        String(value)
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
                interest;

            profileInterests.appendChild(
                chip
            );
        }
    );
}



let stopProfileEvents = null;

function displayEvents(user) {
    if (stopProfileEvents) {
        stopProfileEvents();
        stopProfileEvents = null;
    }

    profileEvents.replaceChildren();

    if (!user) return;

    const uid = getUserId(user);
    const isOwnProfile = uid === sphereMe?.uid;

    if (!isOwnProfile && !isSphereConnected(uid)) {
        const message = document.createElement("p");
        message.className = "empty-text";
        message.textContent = "Connect to see this person's upcoming events.";
        profileEvents.appendChild(message);
        return;
    }

    const loading = document.createElement("p");
    loading.className = "empty-text";
    loading.textContent = "Loading upcoming events...";
    profileEvents.appendChild(loading);

    stopProfileEvents = watchProfileEvents(uid, events => {
        if (getUserId(selectedUser) !== uid) return;

        profileEvents.replaceChildren();

        if (!events.length) {
            const empty = document.createElement("p");
            empty.className = "empty-text";
            empty.textContent = "No upcoming events.";
            profileEvents.appendChild(empty);
            return;
        }

        events.forEach(event => {
            const item = document.createElement("div");
            item.className = "profile-event-item";

            const title = document.createElement("strong");
            title.textContent = event.title;

            const details = document.createElement("p");

            const date = new Date(event.startDate);

            details.textContent =
                `${date.toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                })} · ${event.venue || "Venue unavailable"}`;

            item.append(title, details);
            profileEvents.appendChild(item);
        });
    });
}


function getConnections() {
  return users
    .filter(user => isSphereConnected(getUserId(user)))
    .map(user => getUserId(user));
}

function isConnected(user) {
  return Boolean(user && isSphereConnected(getUserId(user)));
}

function updateConnectionStatus(user) {
  const request = getSphereRequest(getUserId(user));

  messageButton.disabled = !isSphereConnected(getUserId(user));

  if (!request) {
    profileConnection.textContent =
      "You have not connected with this person yet.";

    connectButton.textContent = "Connect";
    connectButton.disabled = false;
    return;
  }

  if (request.status === "accepted") {
    profileConnection.textContent =
      "This person is part of your Sphere.";

    connectButton.textContent = "Connected";
    connectButton.disabled = true;

    return;
  }

  if (request.status === "pending") {
    if (request.toUid === sphereMe?.uid) {
      profileConnection.textContent =
        "This person sent you a connection request.";

      connectButton.textContent = "Accept Request";
      connectButton.disabled = false;
    } else {
      profileConnection.textContent =
        "Waiting for this person to respond.";

      connectButton.textContent = "Request Sent";
      connectButton.disabled = true;
    }

    return;
  }

  profileConnection.textContent =
    "The previous connection request was declined.";

  connectButton.textContent = "Connect";
  connectButton.disabled = request.fromUid !== sphereMe?.uid;
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
        "Connect through shared interests and local experiences.";

    displayInterests(user);

    displayEvents(user);

    updateConnectionStatus(user);

    
    profilePanel.classList.add("open");
    profileOverlay.classList.add("open");
    profilePanel.setAttribute("aria-hidden", "false");

}



function closeUserProfile() {
    profilePanel.classList.remove("open");
    profileOverlay.classList.remove("open");
    profilePanel.setAttribute("aria-hidden", "true");
    if (stopProfileEvents) {
    stopProfileEvents();
    stopProfileEvents = null;}
    selectedUser = null;
}



connectButton.addEventListener("click", async () => {
  if (!selectedUser || !sphereMe) return;

  const uid = getUserId(selectedUser);
  const request = getSphereRequest(uid);

  connectButton.disabled = true;

  try {
    if (
      request?.status === "pending" &&
      request.toUid === sphereMe.uid
    ) {
      await respondToSphereRequest(uid, "accepted");
    } else if (!request || request.status === "declined") {
      await sendSphereRequest(uid);
    }
  } catch (error) {
    console.error("Sphere connection error:", error);
    profileConnection.textContent =
      error.message || "Unable to update this connection.";
  } finally {
    updateConnectionStatus(selectedUser);
  }
});


messageButton.addEventListener("click", () => {
  if (!selectedUser || !isConnected(selectedUser)) return;
  const targetUid = getUserId(selectedUser);

if (!targetUid || !isSphereConnected(targetUid)) {
    alert("You must be connected before messaging this person.");
    return;
}

window.location.href =
    `chat.html?uid=${encodeURIComponent(targetUid)}`;
});



closeProfile.addEventListener(
    "click",
    closeUserProfile
);


profileOverlay.addEventListener(
    "click",
    closeUserProfile
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
                            getUserName(user)
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
                findUser(value);

            if (!user) {
                searchMessage.textContent =
                    "User not found.";

                return;
            }

            searchMessage.textContent =
                "";

            userSearch.value =
                getUserName(user);

            openUserProfile(
                user
            );
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


// Keep the About overlay keyboard-accessible and restore the launch control.
function closeAboutDialog() {
    if (aboutModal.hidden) return;
    aboutModal.hidden = true;
    document.body.style.overflow = "";
    aboutButton.focus();
}

aboutButton.addEventListener("click", function () {
    aboutModal.hidden = false;
    document.body.style.overflow = "hidden";
    closeAbout.focus();
});

closeAbout.addEventListener("click", closeAboutDialog);

aboutModal.addEventListener("click", function (event) {
    if (event.target === aboutModal) closeAboutDialog();
});

showReferences.addEventListener(
    "click",
    function () {
        const currentlyHidden =
            referenceList.hidden;

        referenceList.hidden =
            !currentlyHidden;

        showReferences.textContent =
            currentlyHidden
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

            closeUserProfile();

            closeAboutDialog();
        }
    }
);


const sphereContainer =
    document.getElementById(
        "sphereContainer"
    );

const sphereCanvas =
    document.getElementById(
        "sphereCanvas"
    );


const scene =
    new THREE.Scene();


const camera =
    new THREE.PerspectiveCamera(
        42,
        sphereContainer.clientWidth /
        sphereContainer.clientHeight,
        0.1,
        100
    );


camera.position.set(
    0,
    0,
    15
);


const renderer =
    new THREE.WebGLRenderer({
        canvas: sphereCanvas,
        antialias: true,
        alpha: true
    });


renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        2
    )
);


renderer.setSize(
    sphereContainer.clientWidth,
    sphereContainer.clientHeight,
    false
);


renderer.outputColorSpace =
    THREE.SRGBColorSpace;


const networkGroup =
    new THREE.Group();


scene.add(
    networkGroup
);


const sphereRadius =
    5;


const globeGeometry =
    new THREE.SphereGeometry(
        sphereRadius,
        24,
        16
    );


const globeMaterial =
    new THREE.MeshBasicMaterial({
        color: 0x914fe8,
        wireframe: true,
        transparent: true,
        opacity: 0.10,
        depthWrite: false
    });


const globe =
    new THREE.Mesh(
        globeGeometry,
        globeMaterial
    );


networkGroup.add(
    globe
);


function createOrbit(
    radiusX,
    radiusY,
    rotationX,
    rotationY,
    rotationZ,
    opacity = 0.25
) {
    const curve =
        new THREE.EllipseCurve(
            0,
            0,
            radiusX,
            radiusY,
            0,
            Math.PI * 2,
            false,
            0
        );

    const points2D =
        curve.getPoints(
            120
        );

    const points3D =
        points2D.map(
            function (point) {
                return new THREE.Vector3(
                    point.x,
                    point.y,
                    0
                );
            }
        );

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                points3D
            );

    const material =
        new THREE.LineBasicMaterial({
            color: 0xa260ff,
            transparent: true,
            opacity: opacity,
            depthWrite: false
        });

    const line =
        new THREE.LineLoop(
            geometry,
            material
        );

    line.rotation.set(
        rotationX,
        rotationY,
        rotationZ
    );

    networkGroup.add(
        line
    );
}

createOrbit(
    5.08,
    5.08,
    Math.PI / 2,
    0,
    0,
    0.32
);

createOrbit(
    5.08,
    5.08,
    0,
    Math.PI / 2,
    0,
    0.22
);

createOrbit(
    5.05,
    3.7,
    0.7,
    0.3,
    0.5,
    0.22
);

createOrbit(
    4.7,
    3.1,
    -0.55,
    0.7,
    -0.35,
    0.18
);


const particlePositions =
    [];


for (
    let i = 0;
    i < 140;
    i++
) {
    const radius =
        Math.pow(
            Math.random(),
            1 / 3
        ) *
        4.65;

    const theta =
        Math.random() *
        Math.PI *
        2;

    const phi =
        Math.acos(
            2 *
            Math.random() -
            1
        );

    particlePositions.push(
        radius *
        Math.sin(phi) *
        Math.cos(theta),

        radius *
        Math.cos(phi),

        radius *
        Math.sin(phi) *
        Math.sin(theta)
    );
}


const particleGeometry =
    new THREE.BufferGeometry();


particleGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
        particlePositions,
        3
    )
);


const particleMaterial =
    new THREE.PointsMaterial({
        color: 0xa467ff,
        size: 0.07,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        sizeAttenuation: true
    });


const particles =
    new THREE.Points(
        particleGeometry,
        particleMaterial
    );


networkGroup.add(
    particles
);


function createNodeTexture(
    initials,
    name,
    colour,
    locked = false
) {
    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        512;

    canvas.height =
        512;

    const context =
        canvas.getContext(
            "2d"
        );

    context.clearRect(
        0,
        0,
        512,
        512
    );


    const glow =
        context.createRadialGradient(
            256,
            205,
            10,
            256,
            205,
            155
        );

    if (locked) {
        glow.addColorStop(
            0,
            "rgba(170,170,195,0.45)"
        );

        glow.addColorStop(
            1,
            "rgba(170,170,195,0)"
        );
    } else {
        glow.addColorStop(
            0,
            colour + "aa"
        );

        glow.addColorStop(
            1,
            colour + "00"
        );
    }

    context.fillStyle =
        glow;

    context.fillRect(
        40,
        -10,
        432,
        430
    );


    context.beginPath();

    context.arc(
        256,
        205,
        102,
        0,
        Math.PI * 2
    );

    context.fillStyle =
        locked
            ? "rgba(48,52,73,0.97)"
            : "rgba(18,23,58,0.98)";

    context.fill();


    context.lineWidth =
        10;

    context.strokeStyle =
        locked
            ? "rgba(165,165,185,0.9)"
            : colour;

    context.stroke();


    context.fillStyle =
        "#ffffff";

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";

    context.font =
        locked
            ? "72px Arial"
            : "bold 58px Arial";

    context.fillText(
        locked
            ? "?"
            : initials,
        256,
        205
    );


    if (!locked) {
        context.font =
            "bold 35px Arial";

        const measured =
            context.measureText(
                name
            ).width;

        const labelWidth =
            Math.min(
                measured + 55,
                360
            );

        context.fillStyle =
            "rgba(4,9,28,0.94)";

        if (
            typeof context.roundRect ===
            "function"
        ) {
            context.beginPath();

            context.roundRect(
                256 -
                labelWidth / 2,
                335,
                labelWidth,
                66,
                18
            );

            context.fill();
        } else {
            context.fillRect(
                256 -
                labelWidth / 2,
                335,
                labelWidth,
                66
            );
        }

        context.fillStyle =
            "#ffffff";

        context.fillText(
            name,
            256,
            368
        );
    }


    const texture =
        new THREE.CanvasTexture(
            canvas
        );

    texture.colorSpace =
        THREE.SRGBColorSpace;

    return texture;
}


let nodeData = [
    {
        id: "samuel",
        user: "Samuel Smith",
        name: "You",
        initials: "SS",
        colour: "#a64dff",
        position: [
            0,
            0,
            0
        ],
        size: 1.9,
        centre: true
    },

    {
        id: "zach",
        user: "Zach T",
        name: "Zach",
        initials: "ZT",
        colour: "#2ce6c2",
        position: [
            -3.2,
            1.7,
            2.2
        ],
        size: 1.35
    },

    {
        id: "mike",
        user: "Mike S",
        name: "Mike",
        initials: "MS",
        colour: "#a34fff",
        position: [
            2.8,
            2.1,
            -1.4
        ],
        size: 1.35
    },

    {
        id: "sally",
        user: "Sally S",
        name: "Sally",
        initials: "SS",
        colour: "#31bfff",
        position: [
            3.4,
            -0.7,
            2.0
        ],
        size: 1.35
    },

    {
        id: "holly",
        user: "Holly M",
        name: "Holly",
        initials: "HM",
        colour: "#42d7ef",
        position: [
            -3.1,
            -1.8,
            -1.6
        ],
        size: 1.35
    },

    {
        id: "priya",
        user: "Priya K",
        name: "Priya",
        initials: "PK",
        colour: "#ff65ae",
        position: [
            1.4,
            -3.4,
            1.5
        ],
        size: 1.35
    },

    {
        id: "locked1",
        locked: true,
        position: [
            -1.3,
            3.7,
            -1.7
        ],
        size: 0.85
    },

    {
        id: "locked2",
        locked: true,
        position: [
            2.5,
            2.8,
            2.1
        ],
        size: 0.85
    },

    {
        id: "locked3",
        locked: true,
        position: [
            -3.8,
            -0.1,
            1.0
        ],
        size: 0.85
    },

    {
        id: "locked4",
        locked: true,
        position: [
            -0.8,
            -3.8,
            -2.0
        ],
        size: 0.85
    },

    {
        id: "locked5",
        locked: true,
        position: [
            3.6,
            0.3,
            -2.1
        ],
        size: 0.85
    },

    {
        id: "locked6",
        locked: true,
        position: [
            0.4,
            1.1,
            -4.0
        ],
        size: 0.8
    }
];


const nodeObjects =
    new Map();


const clickableNodes =
    [];


function createNode(data) {
    const texture =
        createNodeTexture(
            data.initials || "",
            data.name || "",
            data.colour ||
            "#888899",
            Boolean(
                data.locked
            )
        );

    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: true,
            depthWrite: false
        });

    const sprite =
        new THREE.Sprite(
            material
        );

    sprite.position.set(
        data.position[0],
        data.position[1],
        data.position[2]
    );

    sprite.scale.set(
        data.size,
        data.size,
        1
    );

    sprite.userData =
        data;

    networkGroup.add(
        sprite
    );

    nodeObjects.set(
        data.id,
        sprite
    );

    if (
        !data.locked &&
        !data.centre
    ) {
        clickableNodes.push(
            sprite
        );
    }

    return sprite;
}

function createConnection(
    fromId,
    toId,
    colour,
    opacity = 0.6
) {
    const from =
        nodeObjects.get(
            fromId
        );

    const to =
        nodeObjects.get(
            toId
        );

    if (
        !from ||
        !to
    ) {
        return;
    }


    const start =
        from.position.clone();

    const end =
        to.position.clone();

    const middle =
        start
            .clone()
            .add(end)
            .multiplyScalar(
                0.5
            );


    if (
        fromId !== "samuel" &&
        toId !== "samuel"
    ) {
        const curvePush =
            middle.clone();

        if (
            curvePush.length() >
            0
        ) {
            curvePush
                .normalize()
                .multiplyScalar(
                    0.45
                );

            middle.add(
                curvePush
            );
        }
    }


    const curve =
        new THREE.QuadraticBezierCurve3(
            start,
            middle,
            end
        );


    const points =
        curve.getPoints(
            32
        );


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                points
            );


    const material =
        new THREE.LineBasicMaterial({
            color: colour,
            transparent: true,
            opacity: opacity,
            depthWrite: false
        });


    const line =
        new THREE.Line(
            geometry,
            material
        );


    networkGroup.add(
        line
    );
}


let sphereMe = null;
let sphereState = null;

const connectionColours = [
  "#2ce6c2",
  "#a34fff",
  "#31bfff",
  "#42d7ef",
  "#ff65ae",
  "#eab95b"
];

const dynamicSphereObjects = [];


function removeDynamicSphere() {
    for (const object of dynamicSphereObjects) {
        networkGroup.remove(object);

        object.geometry?.dispose?.();

        const materials = Array.isArray(object.material)
            ? object.material
            : object.material
                ? [object.material]
                : [];

        materials.forEach(material => {
            material.map?.dispose?.();
            material.dispose();
        });
    }

    dynamicSphereObjects.length = 0;
    nodeObjects.clear();
    clickableNodes.length = 0;
}

function spherePosition(index, total) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const y = 1 - (index / Math.max(1, total - 1)) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const angle = index * goldenAngle;

  return [
    Math.cos(angle) * radius * 3.8,
    y * 3.8,
    Math.sin(angle) * radius * 3.8
  ];
}

function addSphereNode(data) {
  const sprite = createNode(data);
  dynamicSphereObjects.push(sprite);
  return sprite;
}

function addSphereConnection(from, to, colour, opacity) {
  const before = networkGroup.children.length;

  createConnection(from, to, colour, opacity);

  const added = networkGroup.children.slice(before);
  dynamicSphereObjects.push(...added);
}

function renderLiveSphere(state) {
  sphereState = state;
  sphereMe = state.me;

  users = state.publicMembers.map(person => ({
    ...person,
    name: person.name
  }));

  if (state.me) {
    users.unshift(state.me);
  }

  setupCurrentUser(state.me);
  removeDynamicSphere();

  if (!state.me) return;

  const me = state.me;
  const name = getUserName(me);

  addSphereNode({
    id: me.uid,
    user: name,
    name: "You",
    initials: getInitials(name),
    colour: "#a64dff",
    position: [0, 0, 0],
    size: 1.9,
    centre: true
  });

  
  const connectedIds = new Set(
    state.connections.map(person => person.uid)
  );

  const members = state.publicMembers
    .filter(person => person.uid !== me.uid)
    .slice(0, 60);

  members.forEach((person, index) => {
    const connected = connectedIds.has(person.uid);

    const colour =
      connectionColours[index % connectionColours.length];

    const displayName = getUserName(person);

    addSphereNode({
      id: person.uid,
      user: connected ? displayName : "Unknown Member",
      name: connected ? displayName.split(" ")[0] : "",
      initials: connected ? getInitials(displayName) : "",
      colour,
      locked: !connected,
      position: spherePosition(index, members.length),
      size: connected ? 1.35 : 0.9
    });

    if (connected) {
      addSphereConnection(
        me.uid,
        person.uid,
        Number.parseInt(colour.slice(1), 16),
        0.85
      );
    }
  });

  if (
    selectedUser &&
    !users.some(user => getUserId(user) === getUserId(selectedUser))
  ) {
    closeUserProfile();
    selectedUser = null;
  } else if (selectedUser) {
    selectedUser = users.find(
      user => getUserId(user) === getUserId(selectedUser)
    );

    openUserProfile(selectedUser);
  }
}

subscribeToSphere(renderLiveSphere);

const internalPoints =
    [];


for (
    let i = 0;
    i < 48;
    i++
) {
    const radius =
        1.1 +
        Math.random() *
        3.3;

    const theta =
        Math.random() *
        Math.PI *
        2;

    const phi =
        Math.acos(
            2 *
            Math.random() -
            1
        );

    internalPoints.push(
        new THREE.Vector3(
            radius *
            Math.sin(phi) *
            Math.cos(theta),

            radius *
            Math.cos(phi),

            radius *
            Math.sin(phi) *
            Math.sin(theta)
        )
    );
}


const internalPositions =
    [];


for (
    let i = 0;
    i < internalPoints.length;
    i++
) {
    for (
        let j = i + 1;
        j < internalPoints.length;
        j++
    ) {
        const distance =
            internalPoints[i]
                .distanceTo(
                    internalPoints[j]
                );

        if (
            distance < 1.9 &&
            Math.random() > 0.35
        ) {
            internalPositions.push(
                internalPoints[i].x,
                internalPoints[i].y,
                internalPoints[i].z,

                internalPoints[j].x,
                internalPoints[j].y,
                internalPoints[j].z
            );
        }
    }
}


const internalGeometry =
    new THREE.BufferGeometry();


internalGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
        internalPositions,
        3
    )
);


const internalMaterial =
    new THREE.LineBasicMaterial({
        color: 0x7446b8,
        transparent: true,
        opacity: 0.16,
        depthWrite: false
    });


const internalLines =
    new THREE.LineSegments(
        internalGeometry,
        internalMaterial
    );


networkGroup.add(
    internalLines
);


const raycaster =
    new THREE.Raycaster();


const pointer =
    new THREE.Vector2();


let dragging =
    false;

let movedWhileDragging =
    false;

let previousPointerX =
    0;

let previousPointerY =
    0;

let targetRotationX =
    -0.12;

let targetRotationY =
    0;

let currentRotationX =
    targetRotationX;

let currentRotationY =
    targetRotationY;

let cameraDistance =
    15;

let targetCameraDistance =
    15;


sphereCanvas.addEventListener(
    "pointerdown",
    function (event) {
        dragging =
            true;

        movedWhileDragging =
            false;

        previousPointerX =
            event.clientX;

        previousPointerY =
            event.clientY;

        try {
            sphereCanvas
                .setPointerCapture(
                    event.pointerId
                );
        } catch (error) {
        }
    }
);


sphereCanvas.addEventListener(
    "pointermove",
    function (event) {
        if (!dragging) return;

        const deltaX = event.clientX - previousPointerX;
        const deltaY = event.clientY - previousPointerY;

        if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
            movedWhileDragging = true;
        }

        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;

        targetRotationX = THREE.MathUtils.clamp(
            targetRotationX,
            -Math.PI / 2,
            Math.PI / 2
        );

        previousPointerX = event.clientX;
        previousPointerY = event.clientY;
    }
);


function stopSphereDrag(
    event
) {
    dragging =
        false;

    try {
        sphereCanvas
            .releasePointerCapture(
                event.pointerId
            );
    } catch (error) {
    }
}


sphereCanvas.addEventListener(
    "pointerup",
    function (event) {
        stopSphereDrag(
            event
        );

        if (
            movedWhileDragging
        ) {
            return;
        }

        const rect =
            sphereCanvas
                .getBoundingClientRect();

        pointer.x =
            (
                (
                    event.clientX -
                    rect.left
                ) /
                rect.width
            ) *
            2 -
            1;

        pointer.y =
            -(
                (
                    event.clientY -
                    rect.top
                ) /
                rect.height
            ) *
            2 +
            1;

        raycaster.setFromCamera(
            pointer,
            camera
        );

        const intersections =
            raycaster.intersectObjects(
                clickableNodes,
                false
            );

        if (
            intersections.length ===
            0
        ) {
            return;
        }

        const selected =
            intersections[0]
                .object;
        const user = users.find(
        person => getUserId(person) === selected.userData.id
        );  

        if (user) {
            openUserProfile(
                user
            );
        }
    }
);


sphereCanvas.addEventListener(
    "pointercancel",
    stopSphereDrag
);


sphereCanvas.addEventListener(
    "wheel",
    function (event) {
        event.preventDefault();

        targetCameraDistance += event.deltaY * 0.008;

        targetCameraDistance = THREE.MathUtils.clamp(
            targetCameraDistance,
            8.5,
            21
        );
    },
    { passive: false }
);

let pinchDistance =
    null;


sphereCanvas.addEventListener(
    "touchstart",
    function (event) {
        if (
            event.touches.length ===
            2
        ) {
            const first =
                event.touches[0];

            const second =
                event.touches[1];

            pinchDistance =
                Math.hypot(
                    second.clientX -
                    first.clientX,

                    second.clientY -
                    first.clientY
                );
        }
    },
    {
        passive: true
    }
);


sphereCanvas.addEventListener(
    "touchmove",
    function (event) {
        if (
            event.touches.length !==
            2 ||
            pinchDistance === null
        ) {
            return;
        }

        const first =
            event.touches[0];

        const second =
            event.touches[1];

        const newDistance =
            Math.hypot(
                second.clientX -
                first.clientX,

                second.clientY -
                first.clientY
            );

        const difference =
            newDistance -
            pinchDistance;

        targetCameraDistance -=
            difference *
            0.009;

        targetCameraDistance =
            Math.max(
                8.5,
                Math.min(
                    21,
                    targetCameraDistance
                )
            );

        pinchDistance =
            newDistance;
    },
    {
        passive: true
    }
);


sphereCanvas.addEventListener(
    "touchend",
    function () {
        pinchDistance =
            null;
    },
    {
        passive: true
    }
);


function updateNodeDepth() {
    nodeObjects.forEach(
        function (sprite) {
            const worldPosition =
                new THREE.Vector3();

            sprite.getWorldPosition(
                worldPosition
            );

            const distance =
                camera.position
                    .distanceTo(
                        worldPosition
                    );

            const depthFactor =
                THREE.MathUtils.clamp(
                    1.24 -
                    (
                        distance -
                        9
                    ) *
                    0.035,
                    0.58,
                    1.12
                );

            const baseSize =
                sprite.userData.size ||
                1;

            sprite.scale.set(
                baseSize *
                depthFactor,

                baseSize *
                depthFactor,

                1
            );

            sprite.material.opacity =
                THREE.MathUtils.clamp(
                    1.22 -
                    (
                        distance -
                        8
                    ) *
                    0.045,
                    0.34,
                    1
                );
        }
    );
}


function resizeSphere() {
    const width =
        sphereContainer.clientWidth;

    const height =
        sphereContainer.clientHeight;

    if (
        width === 0 ||
        height === 0
    ) {
        return;
    }

    camera.aspect =
        width /
        height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height,
        false
    );
}


window.addEventListener(
    "resize",
    resizeSphere
);


if (
    "ResizeObserver" in window
) {
    const resizeObserver =
        new ResizeObserver(
            resizeSphere
        );

    resizeObserver.observe(
        sphereContainer
    );
}


let previousTime =
    performance.now();


function animateSphere(time) {
    requestAnimationFrame(
        animateSphere
    );

    const delta =
        Math.min(
            (
                time -
                previousTime
            ) /
            1000,
            0.05
        );

    previousTime =
        time;

    if (!dragging) {
        targetRotationY +=
            delta *
            0.10;
    }

    currentRotationX +=
        (
            targetRotationX -
            currentRotationX
        ) *
        0.08;

    currentRotationY +=
        (
            targetRotationY -
            currentRotationY
        ) *
        0.08;

    networkGroup.rotation.x =
        currentRotationX;

    networkGroup.rotation.y =
        currentRotationY;

    cameraDistance +=
        (
            targetCameraDistance -
            cameraDistance
        ) *
        0.06;

    camera.position.z =
        cameraDistance;

    camera.lookAt(
        0,
        0,
        0
    );

    updateNodeDepth();

    renderer.render(
        scene,
        camera
    );
}


resizeSphere();

requestAnimationFrame(
    animateSphere
);

