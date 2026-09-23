const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tooltip = document.getElementById("tooltip");

const profilePanel = document.getElementById("profilePanel");
const panelClose = document.getElementById("panelClose");

const profileAvatar = document.getElementById("profileAvatar");
const profileName = document.getElementById("profileName");
const profileLocation = document.getElementById("profileLocation");
const profileAge = document.getElementById("profileAge");
const profileMBTI = document.getElementById("profileMBTI");
const profileInterests = document.getElementById("profileInterests");
const profileAbout = document.getElementById("profileAbout");
const profileEvents = document.getElementById("profileEvents");
const profileConnection = document.getElementById("profileConnection");

const messageButton = document.getElementById("messageButton");
const viewSphereButton = document.getElementById("viewSphereButton");

const homeSearch = document.getElementById("homeSearch");
const searchSuggestions = document.getElementById("searchSuggestions");

const infoButton = document.getElementById("infoButton");
const infoPopup = document.getElementById("infoPopup");
const closeInfo = document.getElementById("closeInfo");

let personas = [];

const fallbackPersonas = [
    {
        id: "U001",
        name: "Samuel Smith",
        age: 22,
        gender: "Male",
        mbti: "INFP",
        friends: 10,
        interests: [
            "Gaming",
            "Pottery",
            "Ballet",
            "Museums",
            "Reading"
        ],
        suburb: "South Bank",
        preference: "No preferences"
    },

    {
        id: "U002",
        name: "Zach T",
        age: 23,
        gender: "Male",
        mbti: "INFJ",
        friends: 8,
        interests: [
            "Horse Back Riding",
            "Reading",
            "Football"
        ],
        suburb: "Toowong",
        preference: "Same Sex"
    },

    {
        id: "U003",
        name: "Mike S",
        age: 31,
        gender: "Male",
        mbti: "ISFP",
        friends: 12,
        interests: [
            "Boxing",
            "Reading",
            "Eating"
        ],
        suburb: "Toowong",
        preference: "No preferences"
    },

    {
        id: "U004",
        name: "Sally S",
        age: 27,
        gender: "Non-Binary",
        mbti: "ISFJ",
        friends: 7,
        interests: [
            "Ballet",
            "Painting",
            "Netball"
        ],
        suburb: "Indooroopilly",
        preference: "No preferences"
    },

    {
        id: "U005",
        name: "Holly M",
        age: 24,
        gender: "Female",
        mbti: "",
        friends: 9,
        interests: [
            "Swimming",
            "Museums",
            "Gaming"
        ],
        suburb: "Carindale",
        preference: "No preferences"
    },

    {
        id: "U006",
        name: "Priya K",
        age: 20,
        gender: "Female",
        mbti: "ESFP",
        friends: 6,
        interests: [
            "Pottery",
            "Horse Back Riding",
            "Fencing",
            "Eating"
        ],
        suburb: "Mt Gravatt",
        preference: "No preferences"
    }
];

const spherePeople = [
    {
        personaId: "U002",
        shortName: "Zach",
        initials: "ZT",
        x: -0.72,
        y: -0.35,
        z: 0.35,
        colour: "#38d6b4"
    },

    {
        personaId: "U003",
        shortName: "Mike",
        initials: "MS",
        x: 0.72,
        y: -0.40,
        z: 0.25,
        colour: "#9c5cff"
    },

    {
        personaId: "U004",
        shortName: "Sally",
        initials: "SA",
        x: 0.88,
        y: 0.02,
        z: 0.1,
        colour: "#3ba4d8"
    },

    {
        personaId: "U005",
        shortName: "Holly",
        initials: "HM",
        x: -0.72,
        y: 0.58,
        z: 0.18,
        colour: "#49a5d1"
    },

    {
        personaId: "U006",
        shortName: "Priya",
        initials: "PK",
        x: 0.55,
        y: 0.72,
        z: 0.2,
        colour: "#d767a5"
    }
];

const lockedPeople = [
    {
        x: -0.10,
        y: -0.92,
        z: 0.15
    },

    {
        x: 0.45,
        y: -0.78,
        z: -0.45
    },

    {
        x: 0.20,
        y: -0.25,
        z: -0.7
    },

    {
        x: -0.82,
        y: -0.10,
        z: -0.35
    },

    {
        x: 0.30,
        y: 0.35,
        z: -0.75
    },

    {
        x: -0.15,
        y: 0.92,
        z: -0.1
    }
];

let rotationY = 0;
let rotationX = 0;

let targetRotationY = 0;
let targetRotationX = 0;

let sphereZoom = 1;

let dragging = false;

let lastMouseX = 0;
let lastMouseY = 0;

let clickableProfiles = [];

let lastTouchDistance = null;


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

}


function rotatePoint(point) {

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);

    const x1 =
        point.x * cosY -
        point.z * sinY;

    const z1 =
        point.x * sinY +
        point.z * cosY;


    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    const y2 =
        point.y * cosX -
        z1 * sinX;

    const z2 =
        point.y * sinX +
        z1 * cosX;


    return {
        x: x1,
        y: y2,
        z: z2
    };

}


function projectPoint(point, radius, centerX, centerY) {

    const rotated = rotatePoint(point);

    const depth =
        1 +
        rotated.z * 0.18;

    return {
        x:
            centerX +
            rotated.x *
            radius *
            sphereZoom *
            depth,

        y:
            centerY +
            rotated.y *
            radius *
            sphereZoom *
            depth,

        z: rotated.z
    };

}


function drawGlowCircle(
    x,
    y,
    radius,
    colour,
    fill
) {

    ctx.save();

    ctx.shadowColor = colour;
    ctx.shadowBlur = 20;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = fill;

    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = colour;

    ctx.stroke();

    ctx.restore();

}


function drawSphereGrid(
    centerX,
    centerY,
    radius
) {

    ctx.save();

    ctx.strokeStyle =
        "rgba(130, 82, 220, 0.30)";

    ctx.lineWidth = 1;


    for (let latitude = -60; latitude <= 60; latitude += 30) {

        const latitudeRadians =
            latitude *
            Math.PI /
            180;

        const y =
            Math.sin(latitudeRadians);

        const horizontalRadius =
            Math.cos(latitudeRadians);


        ctx.beginPath();

        for (
            let longitude = 0;
            longitude <= 360;
            longitude += 4
        ) {

            const longitudeRadians =
                longitude *
                Math.PI /
                180;

            const point = {
                x:
                    Math.cos(longitudeRadians) *
                    horizontalRadius,

                y: y,

                z:
                    Math.sin(longitudeRadians) *
                    horizontalRadius
            };

            const projected =
                projectPoint(
                    point,
                    radius,
                    centerX,
                    centerY
                );

            if (longitude === 0) {

                ctx.moveTo(
                    projected.x,
                    projected.y
                );

            } else {

                ctx.lineTo(
                    projected.x,
                    projected.y
                );

            }

        }

        ctx.stroke();

    }


    for (
        let longitude = 0;
        longitude < 180;
        longitude += 30
    ) {

        const longitudeRadians =
            longitude *
            Math.PI /
            180;

        ctx.beginPath();

        for (
            let latitude = -90;
            latitude <= 90;
            latitude += 3
        ) {

            const latitudeRadians =
                latitude *
                Math.PI /
                180;

            const point = {
                x:
                    Math.cos(latitudeRadians) *
                    Math.cos(longitudeRadians),

                y:
                    Math.sin(latitudeRadians),

                z:
                    Math.cos(latitudeRadians) *
                    Math.sin(longitudeRadians)
            };

            const projected =
                projectPoint(
                    point,
                    radius,
                    centerX,
                    centerY
                );

            if (latitude === -90) {

                ctx.moveTo(
                    projected.x,
                    projected.y
                );

            } else {

                ctx.lineTo(
                    projected.x,
                    projected.y
                );

            }

        }

        ctx.stroke();

    }


    const gradient =
        ctx.createRadialGradient(
            centerX - radius * 0.25,
            centerY - radius * 0.25,
            radius * 0.1,

            centerX,
            centerY,
            radius
        );


    gradient.addColorStop(
        0,
        "rgba(103, 56, 185, 0.34)"
    );

    gradient.addColorStop(
        0.65,
        "rgba(52, 29, 108, 0.23)"
    );

    gradient.addColorStop(
        1,
        "rgba(25, 16, 60, 0.08)"
    );


    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius * sphereZoom,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = gradient;

    ctx.fill();


    ctx.shadowColor =
        "rgba(138, 77, 255, 0.9)";

    ctx.shadowBlur = 15;

    ctx.lineWidth = 2.5;

    ctx.strokeStyle =
        "rgba(132, 79, 240, 0.85)";

    ctx.stroke();

    ctx.restore();

}


function drawConnection(
    centerX,
    centerY,
    target,
    colour
) {

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
        centerX,
        centerY
    );

    ctx.lineTo(
        target.x,
        target.y
    );

    ctx.strokeStyle = colour;
    ctx.globalAlpha = 0.7;

    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.restore();

}


function drawProfileNode(
    person,
    position
) {

    const nodeRadius =
        27 +
        position.z * 4;

    drawGlowCircle(
        position.x,
        position.y,
        nodeRadius,
        person.colour,
        "rgba(35, 38, 68, 0.94)"
    );


    ctx.save();

    ctx.fillStyle = "white";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font =
        "bold 12px Arial";

    ctx.fillText(
        person.initials,
        position.x,
        position.y
    );


    ctx.font =
        "12px Arial";

    ctx.fillStyle =
        "rgba(255,255,255,0.9)";

    ctx.fillText(
        person.shortName,
        position.x,
        position.y + nodeRadius + 16
    );

    ctx.restore();


    clickableProfiles.push({
        x: position.x,
        y: position.y,
        radius: nodeRadius + 10,
        person: person
    });

}


function drawLockedNode(position) {

    const radius = 18;

    ctx.save();

    ctx.shadowColor =
        "rgba(255,255,255,0.25)";

    ctx.shadowBlur = 12;

    ctx.beginPath();

    ctx.arc(
        position.x,
        position.y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(50, 51, 67, 0.82)";

    ctx.fill();

    ctx.lineWidth = 2;

    ctx.strokeStyle =
        "rgba(255,255,255,0.20)";

    ctx.stroke();


    ctx.font = "14px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle =
        "rgba(255,255,255,0.6)";

    ctx.fillText(
        "🔒",
        position.x,
        position.y
    );

    ctx.restore();

}


function drawCenterUser(
    centerX,
    centerY
) {

    drawGlowCircle(
        centerX,
        centerY,
        48,
        "#9b52ff",
        "rgba(60, 36, 91, 0.98)"
    );


    ctx.save();

    ctx.textAlign = "center";

    ctx.fillStyle = "white";

    ctx.font =
        "bold 20px Arial";

    ctx.fillText(
        "SS",
        centerX,
        centerY + 7
    );


    ctx.font =
        "bold 14px Arial";

    ctx.fillText(
        "You",
        centerX,
        centerY + 72
    );

    ctx.restore();

}


function drawSphere() {

    const width =
        canvas.clientWidth;

    const height =
        canvas.clientHeight;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    rotationY +=
        (targetRotationY - rotationY) *
        0.08;

    rotationX +=
        (targetRotationX - rotationX) *
        0.08;


    const centerX =
        width / 2;

    const centerY =
        height / 2;

    const radius =
        Math.min(
            width,
            height
        ) * 0.39;


    clickableProfiles = [];


    drawSphereGrid(
        centerX,
        centerY,
        radius
    );


    const projectedPeople =
        spherePeople.map(
            function (person) {

                return {
                    person: person,

                    position:
                        projectPoint(
                            person,
                            radius,
                            centerX,
                            centerY
                        )
                };

            }
        );


    projectedPeople.forEach(
        function (item) {

            drawConnection(
                centerX,
                centerY,
                item.position,
                item.person.colour
            );

        }
    );


    const lockedProjected =
        lockedPeople.map(
            function (person) {

                return projectPoint(
                    person,
                    radius,
                    centerX,
                    centerY
                );

            }
        );


    const allNodes = [];


    projectedPeople.forEach(
        function (item) {

            allNodes.push({
                type: "person",
                z: item.position.z,
                person: item.person,
                position: item.position
            });

        }
    );


    lockedProjected.forEach(
        function (position) {

            allNodes.push({
                type: "locked",
                z: position.z,
                position: position
            });

        }
    );


    allNodes.sort(
        function (a, b) {

            return a.z - b.z;

        }
    );


    allNodes.forEach(
        function (node) {

            if (node.type === "person") {

                drawProfileNode(
                    node.person,
                    node.position
                );

            } else {

                drawLockedNode(
                    node.position
                );

            }

        }
    );


    drawCenterUser(
        centerX,
        centerY
    );


    requestAnimationFrame(
        drawSphere
    );

}


function getInitials(name) {

    return name
        .split(" ")
        .map(function (part) {

            return part[0];

        })
        .join("")
        .substring(0, 2)
        .toUpperCase();

}


function getPersonaById(id) {

    return personas.find(
        function (person) {

            return person.id === id;

        }
    );

}


function openProfile(person) {

    if (!person) {
        return;
    }


    profileAvatar.textContent =
        getInitials(person.name);


    profileName.textContent =
        person.name;


    profileLocation.textContent =
        person.suburb ||
        "Brisbane";


    profileAge.textContent =
        person.age ||
        "-";


    profileMBTI.textContent =
        person.mbti ||
        "Not specified";


    profileInterests.innerHTML = "";


    const interests =
        person.interests || [];


    interests.forEach(
        function (interest) {

            const chip =
                document.createElement("span");

            chip.className =
                "interest-chip";

            chip.textContent =
                interest;

            profileInterests.appendChild(
                chip
            );

        }
    );


    profileAbout.textContent =
        person.persona ||
        "Interested in meeting people through shared interests and local events.";


    profileConnection.textContent =
        person.friends
            ? person.friends +
              " connections in their Sphere."
            : "Potential connection";


    profileEvents.innerHTML = `
        <div class="event-mini-card">
            Explore shared events and interests
        </div>
    `;


    messageButton.onclick =
        function () {

            window.location.href =
                "chat.html";

        };


    viewSphereButton.onclick =
        function () {

            profilePanel.classList.remove(
                "open"
            );

        };


    profilePanel.classList.add(
        "open"
    );

}


async function loadPersonas() {

    try {

        const response =
            await fetch(
                "data/personas.json"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load personas.json"
            );

        }


        personas =
            await response.json();


        console.log(
            "Personas loaded:",
            personas.length
        );


    } catch (error) {

        console.warn(
            "Using fallback personas:",
            error
        );

        personas =
            fallbackPersonas;

    }

}


function displaySearchSuggestions(
    results
) {

    searchSuggestions.innerHTML = "";


    if (results.length === 0) {

        searchSuggestions.classList.remove(
            "active"
        );

        return;

    }


    results
        .slice(0, 6)
        .forEach(
            function (person) {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type = "button";

                button.className =
                    "suggestion-item";


                button.innerHTML = `
                    <span class="suggestion-avatar">
                        ${getInitials(person.name)}
                    </span>

                    <span class="suggestion-info">
                        <strong>
                            ${person.name}
                        </strong>

                        <span>
                            ${person.suburb || "Brisbane"}
                            ·
                            ${(person.interests || [])
                                .slice(0, 2)
                                .join(", ")}
                        </span>
                    </span>
                `;


                button.addEventListener(
                    "click",
                    function () {

                        homeSearch.value =
                            person.name;

                        searchSuggestions.classList.remove(
                            "active"
                        );

                        openProfile(
                            person
                        );

                    }
                );


                searchSuggestions.appendChild(
                    button
                );

            }
        );


    searchSuggestions.classList.add(
        "active"
    );

}


homeSearch.addEventListener(
    "input",
    function () {

        const searchTerm =
            homeSearch.value
                .trim()
                .toLowerCase();


        if (searchTerm.length < 2) {

            searchSuggestions.classList.remove(
                "active"
            );

            return;

        }


        const results =
            personas.filter(
                function (person) {

                    const name =
                        (
                            person.name ||
                            ""
                        ).toLowerCase();

                    const suburb =
                        (
                            person.suburb ||
                            ""
                        ).toLowerCase();

                    const interests =
                        (
                            person.interests ||
                            []
                        )
                            .join(" ")
                            .toLowerCase();


                    return (
                        name.includes(
                            searchTerm
                        ) ||
                        suburb.includes(
                            searchTerm
                        ) ||
                        interests.includes(
                            searchTerm
                        )
                    );

                }
            );


        displaySearchSuggestions(
            results
        );

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

            searchSuggestions.classList.remove(
                "active"
            );

        }

    }
);


canvas.addEventListener(
    "mousedown",
    function (event) {

        dragging = true;

        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;

    }
);


window.addEventListener(
    "mouseup",
    function () {

        dragging = false;

    }
);


window.addEventListener(
    "mousemove",
    function (event) {

        if (!dragging) {
            return;
        }


        const differenceX =
            event.clientX -
            lastMouseX;

        const differenceY =
            event.clientY -
            lastMouseY;


        targetRotationY +=
            differenceX *
            0.008;

        targetRotationX +=
            differenceY *
            0.008;


        targetRotationX =
            Math.max(
                -1,
                Math.min(
                    1,
                    targetRotationX
                )
            );


        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;

    }
);


canvas.addEventListener(
    "mousemove",
    function (event) {

        if (dragging) {
            return;
        }


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const hovered =
            clickableProfiles.find(
                function (profile) {

                    const dx =
                        mouseX -
                        profile.x;

                    const dy =
                        mouseY -
                        profile.y;


                    return (
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        ) <
                        profile.radius
                    );

                }
            );


        if (hovered) {

            canvas.style.cursor =
                "pointer";

            const person =
                getPersonaById(
                    hovered.person.personaId
                );


            tooltip.style.display =
                "block";

            tooltip.style.left =
                event.clientX + 15 + "px";

            tooltip.style.top =
                event.clientY + 15 + "px";


            tooltip.textContent =
                person
                    ? person.name
                    : hovered.person.shortName;


        } else {

            canvas.style.cursor =
                "grab";

            tooltip.style.display =
                "none";

        }

    }
);


canvas.addEventListener(
    "mouseleave",
    function () {

        tooltip.style.display =
            "none";

    }
);


canvas.addEventListener(
    "click",
    function (event) {

        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const selected =
            clickableProfiles.find(
                function (profile) {

                    const dx =
                        mouseX -
                        profile.x;

                    const dy =
                        mouseY -
                        profile.y;


                    return (
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        ) <
                        profile.radius
                    );

                }
            );


        if (!selected) {
            return;
        }


        const person =
            getPersonaById(
                selected.person.personaId
            );


        openProfile(
            person
        );

    }
);


canvas.addEventListener(
    "touchstart",
    function (event) {

        if (event.touches.length === 1) {

            dragging = true;

            lastMouseX =
                event.touches[0].clientX;

            lastMouseY =
                event.touches[0].clientY;

        }


        if (event.touches.length === 2) {

            dragging = false;


            const dx =
                event.touches[0].clientX -
                event.touches[1].clientX;

            const dy =
                event.touches[0].clientY -
                event.touches[1].clientY;


            lastTouchDistance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
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
            event.touches.length === 1 &&
            dragging
        ) {

            const touch =
                event.touches[0];


            const differenceX =
                touch.clientX -
                lastMouseX;

            const differenceY =
                touch.clientY -
                lastMouseY;


            targetRotationY +=
                differenceX *
                0.008;

            targetRotationX +=
                differenceY *
                0.008;


            lastMouseX =
                touch.clientX;

            lastMouseY =
                touch.clientY;

        }


        if (
            event.touches.length === 2
        ) {

            const dx =
                event.touches[0].clientX -
                event.touches[1].clientX;

            const dy =
                event.touches[0].clientY -
                event.touches[1].clientY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (lastTouchDistance) {

                const difference =
                    distance -
                    lastTouchDistance;


                sphereZoom +=
                    difference *
                    0.0025;


                sphereZoom =
                    Math.max(
                        0.8,
                        Math.min(
                            1.18,
                            sphereZoom
                        )
                    );

            }


            lastTouchDistance =
                distance;

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

        lastTouchDistance = null;

    }
);


panelClose.addEventListener(
    "click",
    function () {

        profilePanel.classList.remove(
            "open"
        );

    }
);


infoButton.addEventListener(
    "click",
    function () {

        infoPopup.classList.toggle(
            "open"
        );

    }
);


closeInfo.addEventListener(
    "click",
    function () {

        infoPopup.classList.remove(
            "open"
        );

    }
);


window.addEventListener(
    "resize",
    resizeCanvas
);


async function initialiseHomePage() {

    await loadPersonas();

    resizeCanvas();

    drawSphere();

}


initialiseHomePage();