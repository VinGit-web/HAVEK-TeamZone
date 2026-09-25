const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tooltip = document.getElementById("tooltip");

const profilePanel = document.getElementById("profilePanel");
const closeProfile = document.getElementById("closeProfile");

const profileAvatar = document.getElementById("profileAvatar");
const profileName = document.getElementById("profileName");
const profileLocation = document.getElementById("profileLocation");
const profileAge = document.getElementById("profileAge");
const profileGender = document.getElementById("profileGender");
const profileMbti = document.getElementById("profileMbti");
const profileInterests = document.getElementById("profileInterests");
const profileAbout = document.getElementById("profileAbout");
const profileEvents = document.getElementById("profileEvents");
const profileConnection = document.getElementById("profileConnection");

const messageProfile = document.getElementById("messageProfile");

const homeSearch = document.getElementById("homeSearch");
const searchSuggestions = document.getElementById("searchSuggestions");

const infoButton = document.getElementById("infoButton");
const aboutOverlay = document.getElementById("aboutOverlay");
const closeAbout = document.getElementById("closeAbout");

const referenceButton = document.getElementById("referenceButton");
const referenceList = document.getElementById("referenceList");

const people = [
    {
        id: "samuel",
        name: "Samuel Smith",
        shortName: "You",
        initials: "SS",
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
            "An introvert looking to build meaningful connections through shared interests and local events.",
        events: [
            "Beginner Pottery Workshop",
            "Museum Social"
        ],
        connection:
            "This is your profile.",
        longitude: 0,
        latitude: 0,
        distance: 0,
        colour: "#a855f7"
    },

    {
        id: "zach",
        name: "Zach T",
        shortName: "Zach",
        initials: "ZT",
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
            "Enjoys quiet activities, reading and outdoor experiences.",
        events: [
            "Weekend Reading Club",
            "Social Horse Riding"
        ],
        connection:
            "You connected through a shared interest in reading.",
        longitude: -2.4,
        latitude: 0.35,
        distance: 0.86,
        colour: "#34d6b2"
    },

    {
        id: "mike",
        name: "Mike S",
        shortName: "Mike",
        initials: "MS",
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
            "Interested in fitness, books and discovering new food.",
        events: [
            "Beginner Boxing Session",
            "Food Market Meetup"
        ],
        connection:
            "Mike is part of your wider social sphere.",
        longitude: -0.6,
        latitude: -0.25,
        distance: 0.88,
        colour: "#a855f7"
    },

    {
        id: "sally",
        name: "Sally S",
        shortName: "Sally",
        initials: "SA",
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
            "Enjoys creative activities, sport and meeting people through shared experiences.",
        events: [
            "Ballet Social",
            "Community Painting"
        ],
        connection:
            "You share an interest in ballet.",
        longitude: 0.2,
        latitude: 0.35,
        distance: 0.9,
        colour: "#38bdf8"
    },

    {
        id: "holly",
        name: "Holly M",
        shortName: "Holly",
        initials: "HM",
        age: 24,
        gender: "Female",
        mbti: "Unknown",
        suburb: "Carindale",
        interests: [
            "Swimming",
            "Museums",
            "Gaming"
        ],
        about:
            "Enjoys gaming, museums and swimming.",
        events: [
            "Museum Social",
            "Gaming Meetup"
        ],
        connection:
            "You share interests in gaming and museums.",
        longitude: 2.4,
        latitude: -0.3,
        distance: 0.87,
        colour: "#38bdf8"
    },

    {
        id: "priya",
        name: "Priya K",
        shortName: "Priya",
        initials: "PK",
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
            "Enjoys creative workshops, outdoor activities and food experiences.",
        events: [
            "Beginner Pottery Workshop",
            "Food Market Meetup"
        ],
        connection:
            "You share an interest in pottery.",
        longitude: 1.2,
        latitude: 0.7,
        distance: 0.86,
        colour: "#f062a6"
    }
];

const lockedPeople = [
    {
        longitude: 3.1,
        latitude: 0.5,
        distance: 0.9
    },
    {
        longitude: -1.4,
        latitude: 0.75,
        distance: 0.82
    },
    {
        longitude: 2.8,
        latitude: -0.65,
        distance: 0.9
    },
    {
        longitude: 0.7,
        latitude: -0.8,
        distance: 0.85
    },
    {
        longitude: -2.1,
        latitude: -0.4,
        distance: 0.72
    }
];

let canvasWidth = 470;
let canvasHeight = 470;

let centreX = canvasWidth / 2;
let centreY = canvasHeight / 2;

let sphereRadius = 185;

let rotationX = 0;
let rotationY = 0;

let zoom = 1;

let dragging = false;
let movedWhileDragging = false;

let lastMouseX = 0;
let lastMouseY = 0;

let lastTouchDistance = null;

const AUTO_ROTATE_SPEED = 0.0005;

let lastAnimationTime = performance.now();

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    const ratio = window.devicePixelRatio || 1;

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    canvasWidth = rect.width;
    canvasHeight = rect.height;

    centreX = canvasWidth / 2;
    centreY = canvasHeight / 2;

    sphereRadius =
        Math.min(
            canvasWidth,
            canvasHeight
        ) * 0.395;
}

function rotatePoint(x, y, z) {

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);

    let rotatedX =
        x * cosY +
        z * sinY;

    let rotatedZ =
        -x * sinY +
        z * cosY;

    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    let rotatedY =
        y * cosX -
        rotatedZ * sinX;

    rotatedZ =
        y * sinX +
        rotatedZ * cosX;

    return {
        x: rotatedX,
        y: rotatedY,
        z: rotatedZ
    };
}

function getPersonPosition(person) {

    const radius =
        sphereRadius *
        zoom *
        person.distance;

    const longitude =
        person.longitude;

    const latitude =
        person.latitude;

    const x =
        Math.cos(latitude) *
        Math.cos(longitude) *
        radius;

    const y =
        Math.sin(latitude) *
        radius;

    const z =
        Math.cos(latitude) *
        Math.sin(longitude) *
        radius;

    const rotated =
        rotatePoint(
            x,
            y,
            z
        );

    const perspective =
        1 +
        rotated.z /
        (sphereRadius * 5);

    return {
        x:
            centreX +
            rotated.x *
            perspective,

        y:
            centreY +
            rotated.y *
            perspective,

        z:
            rotated.z,

        scale:
            Math.max(
                0.7,
                Math.min(
                    1.25,
                    perspective
                )
            )
    };
}

function drawGlowCircle(
    x,
    y,
    radius,
    colour,
    glow
) {

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#27375a";

    ctx.shadowColor =
        colour;

    ctx.shadowBlur =
        glow;

    ctx.fill();

    ctx.lineWidth = 3;

    ctx.strokeStyle =
        colour;

    ctx.stroke();

    ctx.restore();
}

function drawSphereBackground() {

    const radius =
        sphereRadius * zoom;

    const gradient =
        ctx.createRadialGradient(
            centreX,
            centreY,
            radius * 0.1,
            centreX,
            centreY,
            radius
        );

    gradient.addColorStop(
        0,
        "rgba(96, 51, 165, 0.50)"
    );

    gradient.addColorStop(
        0.65,
        "rgba(59, 37, 123, 0.24)"
    );

    gradient.addColorStop(
        1,
        "rgba(20, 20, 60, 0.10)"
    );

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        centreX,
        centreY,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        gradient;

    ctx.fill();

    ctx.lineWidth = 2.5;

    ctx.strokeStyle =
        "rgba(132, 73, 245, 0.9)";

    ctx.shadowColor =
        "#8b5cf6";

    ctx.shadowBlur = 8;

    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.clip();

    ctx.strokeStyle =
        "rgba(124, 91, 200, 0.28)";

    ctx.lineWidth = 1;

    for (
        let i = -3;
        i <= 3;
        i++
    ) {

        const offset =
            i * radius * 0.22;

        ctx.beginPath();

        ctx.ellipse(
            centreX,
            centreY + offset,
            radius,
            radius * 0.25,
            0,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }

    for (
        let i = -3;
        i <= 3;
        i++
    ) {

        const width =
            radius *
            Math.cos(
                i * 0.22
            );

        ctx.beginPath();

        ctx.ellipse(
            centreX,
            centreY,
            Math.abs(width),
            radius,
            0,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }

    ctx.restore();
}

function drawPersonConnections() {

    people
        .slice(1)
        .forEach(
            function (person) {

                const position =
                    getPersonPosition(
                        person
                    );

                ctx.beginPath();

                ctx.moveTo(
                    centreX,
                    centreY
                );

                ctx.lineTo(
                    position.x,
                    position.y
                );

                ctx.strokeStyle =
                    person.colour +
                    "88";

                ctx.lineWidth =
                    1.3;

                ctx.stroke();
            }
        );
}

function drawPerson(person) {

    const position =
        getPersonPosition(person);

    const size =
        position.scale;

    const radius =
        22 *
        zoom *
        size;

    drawGlowCircle(
        position.x,
        position.y,
        radius,
        person.colour,
        12
    );

    ctx.fillStyle =
        "white";

    ctx.font =
        `bold ${10 * zoom * size}px Arial`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        person.initials,
        position.x,
        position.y
    );

    ctx.font =
        `${10 * zoom * size}px Arial`;

    ctx.fillText(
        person.shortName,
        position.x,
        position.y +
        radius +
        12 * zoom
    );
}

function drawCentrePerson(person) {

    const radius =
        35 * zoom;

    drawGlowCircle(
        centreX,
        centreY,
        radius,
        "#a855f7",
        18
    );

    ctx.fillStyle =
        "white";

    ctx.font =
        `bold ${15 * zoom}px Arial`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        person.initials,
        centreX,
        centreY
    );

    ctx.font =
        `bold ${11 * zoom}px Arial`;

    ctx.fillText(
        "You",
        centreX,
        centreY +
        radius +
        14 * zoom
    );
}

function drawLockedPerson(person) {

    const position =
        getPersonPosition(
            person
        );

    const size =
        position.scale;

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        position.x,
        position.y,
        14 * zoom * size,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(90, 90, 105, 0.5)";

    ctx.shadowColor =
        "rgba(255,255,255,0.35)";

    ctx.shadowBlur = 9;

    ctx.fill();

    ctx.lineWidth = 1.5;

    ctx.strokeStyle =
        "rgba(255,255,255,0.25)";

    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "rgba(255,255,255,0.65)";

    ctx.font =
        `${10 * zoom * size}px Arial`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "🔒",
        position.x,
        position.y
    );

    ctx.restore();
}

function drawSphere() {

    ctx.clearRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );

    drawSphereBackground();

    drawPersonConnections();

    const drawablePeople =
        people
            .slice(1)
            .map(
                function (person) {
                    return {
                        type: "person",
                        data: person,
                        position:
                            getPersonPosition(
                                person
                            )
                    };
                }
            );

    const drawableLocked =
        lockedPeople.map(
            function (person) {
                return {
                    type: "locked",
                    data: person,
                    position:
                        getPersonPosition(
                            person
                        )
                };
            }
        );

    const allDrawable =
        drawablePeople.concat(
            drawableLocked
        );

    allDrawable.sort(
        function (a, b) {
            return (
                a.position.z -
                b.position.z
            );
        }
    );

    allDrawable.forEach(
        function (item) {

            if (
                item.type ===
                "person"
            ) {

                drawPerson(
                    item.data
                );

            } else {

                drawLockedPerson(
                    item.data
                );
            }
        }
    );

    drawCentrePerson(
        people[0]
    );
}

function findPersonAt(x, y) {

    const centreDistance =
        Math.hypot(
            x - centreX,
            y - centreY
        );

    if (
        centreDistance <
        40 * zoom
    ) {

        return people[0];
    }

    for (
        let i = 1;
        i < people.length;
        i++
    ) {

        const position =
            getPersonPosition(
                people[i]
            );

        const distance =
            Math.hypot(
                x - position.x,
                y - position.y
            );

        if (
            distance <
            30 *
            zoom *
            position.scale
        ) {

            return people[i];
        }
    }

    return null;
}

function getCanvasPosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top
    };
}

function showProfile(person) {

    profileAvatar.textContent =
        person.initials;

    profileName.textContent =
        person.name;

    profileLocation.textContent =
        person.suburb;

    profileAge.textContent =
        person.age;

    profileGender.textContent =
        person.gender;

    profileMbti.textContent =
        person.mbti;

    profileAbout.textContent =
        person.about;

    profileConnection.textContent =
        person.connection;

    profileInterests.innerHTML =
        "";

    person.interests.forEach(
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

    profileEvents.innerHTML =
        "";

    person.events.forEach(
        function (eventName) {

            const eventElement =
                document.createElement(
                    "div"
                );

            eventElement.className =
                "event-small";

            eventElement.textContent =
                eventName;

            profileEvents.appendChild(
                eventElement
            );
        }
    );

    messageProfile.dataset.person =
        person.id;

    profilePanel.classList.add(
        "show"
    );
}

function startDragging(
    clientX,
    clientY
) {

    dragging = true;

    movedWhileDragging =
        false;

    lastMouseX =
        clientX;

    lastMouseY =
        clientY;
}

function dragSphere(
    clientX,
    clientY
) {

    if (!dragging) {
        return;
    }

    const differenceX =
        clientX -
        lastMouseX;

    const differenceY =
        clientY -
        lastMouseY;

    if (
        Math.abs(differenceX) > 1 ||
        Math.abs(differenceY) > 1
    ) {

        movedWhileDragging =
            true;
    }

    rotationY +=
        differenceX *
        0.007;

    rotationX +=
        differenceY *
        0.007;

    lastMouseX =
        clientX;

    lastMouseY =
        clientY;

    tooltip.style.display =
        "none";
}

canvas.addEventListener(
    "mousedown",
    function (event) {

        startDragging(
            event.clientX,
            event.clientY
        );
    }
);

window.addEventListener(
    "mousemove",
    function (event) {

        if (dragging) {

            dragSphere(
                event.clientX,
                event.clientY
            );

            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        if (
            event.clientX <
                rect.left ||
            event.clientX >
                rect.right ||
            event.clientY <
                rect.top ||
            event.clientY >
                rect.bottom
        ) {

            tooltip.style.display =
                "none";

            return;
        }

        const position =
            getCanvasPosition(
                event
            );

        const person =
            findPersonAt(
                position.x,
                position.y
            );

        if (person) {

            tooltip.style.display =
                "block";

            tooltip.textContent =
                person.name +
                " · " +
                person.suburb;

            tooltip.style.left =
                event.clientX +
                12 +
                "px";

            tooltip.style.top =
                event.clientY +
                12 +
                "px";

        } else {

            tooltip.style.display =
                "none";
        }
    }
);

window.addEventListener(
    "mouseup",
    function () {

        dragging = false;
    }
);

canvas.addEventListener(
    "click",
    function (event) {

        if (
            movedWhileDragging
        ) {

            movedWhileDragging =
                false;

            return;
        }

        const position =
            getCanvasPosition(
                event
            );

        const person =
            findPersonAt(
                position.x,
                position.y
            );

        if (person) {

            showProfile(
                person
            );
        }
    }
);

canvas.addEventListener(
    "touchstart",
    function (event) {

        if (
            event.touches.length === 2
        ) {

            lastTouchDistance =
                getTouchDistance(
                    event.touches
                );

        } else if (
            event.touches.length === 1
        ) {

            startDragging(
                event.touches[0]
                    .clientX,

                event.touches[0]
                    .clientY
            );
        }
    },
    {
        passive: true
    }
);

canvas.addEventListener(
    "touchmove",
    function (event) {

        if (
            event.touches.length === 2
        ) {

            const distance =
                getTouchDistance(
                    event.touches
                );

            if (
                lastTouchDistance !==
                null
            ) {

                const difference =
                    distance -
                    lastTouchDistance;

                zoom +=
                    difference *
                    0.002;

                zoom =
                    Math.max(
                        0.75,
                        Math.min(
                            1.25,
                            zoom
                        )
                    );
            }

            lastTouchDistance =
                distance;

        } else if (
            event.touches.length === 1
        ) {

            dragSphere(
                event.touches[0]
                    .clientX,

                event.touches[0]
                    .clientY
            );
        }
    },
    {
        passive: true
    }
);

canvas.addEventListener(
    "touchend",
    function () {

        dragging = false;

        lastTouchDistance =
            null;
    }
);

function getTouchDistance(touches) {

    const x =
        touches[0].clientX -
        touches[1].clientX;

    const y =
        touches[0].clientY -
        touches[1].clientY;

    return Math.hypot(
        x,
        y
    );
}

closeProfile.addEventListener(
    "click",
    function () {

        profilePanel.classList.remove(
            "show"
        );
    }
);

messageProfile.addEventListener(
    "click",
    function () {

        window.location.href =
            "chat.html";
    }
);

homeSearch.addEventListener(
    "input",
    function () {

        const query =
            homeSearch.value
                .trim()
                .toLowerCase();

        searchSuggestions.innerHTML =
            "";

        if (
            query.length < 2
        ) {

            searchSuggestions
                .classList
                .remove("show");

            return;
        }

        const results =
            people.filter(
                function (person) {

                    const interests =
                        person.interests
                            .join(" ")
                            .toLowerCase();

                    return (
                        person.name
                            .toLowerCase()
                            .includes(query) ||

                        person.suburb
                            .toLowerCase()
                            .includes(query) ||

                        person.mbti
                            .toLowerCase()
                            .includes(query) ||

                        interests
                            .includes(query)
                    );
                }
            );

        if (
            results.length === 0
        ) {

            searchSuggestions
                .classList
                .remove("show");

            return;
        }

        results
            .slice(0, 5)
            .forEach(
                function (person) {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "suggestion";

                    button.innerHTML = `
                        <span class="suggestion-avatar">
                            ${person.initials}
                        </span>

                        <span class="suggestion-text">
                            <strong>
                                ${person.name}
                            </strong>

                            <span>
                                ${person.suburb} · ${person.mbti}
                            </span>
                        </span>
                    `;

                    button.addEventListener(
                        "click",
                        function () {

                            homeSearch.value =
                                person.name;

                            searchSuggestions
                                .classList
                                .remove(
                                    "show"
                                );

                            showProfile(
                                person
                            );
                        }
                    );

                    searchSuggestions
                        .appendChild(
                            button
                        );
                }
            );

        searchSuggestions
            .classList
            .add("show");
    }
);

document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".search-container"
            )
        ) {

            searchSuggestions
                .classList
                .remove("show");
        }
    }
);

infoButton.addEventListener(
    "click",
    function () {

        aboutOverlay
            .classList
            .add("show");

        document.body.style.overflow =
            "hidden";
    }
);

closeAbout.addEventListener(
    "click",
    function () {

        aboutOverlay
            .classList
            .remove("show");

        document.body.style.overflow =
            "";
    }
);

aboutOverlay.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            aboutOverlay
        ) {

            aboutOverlay
                .classList
                .remove("show");

            document.body.style.overflow =
                "";
        }
    }
);

referenceButton.addEventListener(
    "click",
    function () {

        referenceList.hidden =
            !referenceList.hidden;

        if (
            referenceList.hidden
        ) {

            referenceButton.textContent =
                "View APA 7 Reference List";

        } else {

            referenceButton.textContent =
                "Hide APA 7 Reference List";
        }
    }
);

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            aboutOverlay
                .classList
                .remove("show");

            profilePanel
                .classList
                .remove("show");

            document.body.style.overflow =
                "";
        }
    }
);

window.addEventListener(
    "resize",
    function () {

        resizeCanvas();
    }
);

function animateSphere(
    currentTime
) {

    const deltaTime =
        currentTime -
        lastAnimationTime;

    lastAnimationTime =
        currentTime;

    if (
        !dragging &&
        !profilePanel.classList.contains(
            "show"
        )
    ) {

        rotationY +=
            AUTO_ROTATE_SPEED *
            deltaTime;
    }

    drawSphere();

    requestAnimationFrame(
        animateSphere
    );
}

resizeCanvas();

requestAnimationFrame(
    animateSphere
);