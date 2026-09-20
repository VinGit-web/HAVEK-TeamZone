const profiles = {

    samuel: {
        name: "Samuel Smith",
        age: 22,
        gender: "Male",
        mbti: "INFP",
        location: "South Bank",
        initials: "SS",

        interests: [
            "Gaming",
            "Pottery",
            "Ballet",
            "Museums",
            "Reading"
        ],

        about:
            "An introvert who wants to connect with people through shared interests and comfortable real-world experiences.",

        events: [
            {
                name: "Museum Evening",
                location: "South Bank",
                time: "Friday • 6:00 PM"
            },
            {
                name: "Pottery Workshop",
                location: "West End",
                time: "Sunday • 11:00 AM"
            }
        ]
    },


    zach: {
        name: "Zach T",
        age: 23,
        gender: "Male",
        mbti: "INFJ",
        location: "Toowong",
        initials: "ZT",

        interests: [
            "Horse Back Riding",
            "Reading",
            "Football"
        ],

        about:
            "Enjoys reading, football and horse riding. Prefers quieter activities and smaller social groups.",

        events: [
            {
                name: "Quiet Reading Club",
                location: "Toowong",
                time: "Saturday • 2:00 PM"
            }
        ]
    },


    mike: {
        name: "Mike S",
        age: 31,
        gender: "Male",
        mbti: "ISFP",
        location: "Toowong",
        initials: "MS",

        interests: [
            "Boxing",
            "Reading",
            "Eating"
        ],

        about:
            "Enjoys fitness, food and relaxed activities where people can connect naturally.",

        events: [
            {
                name: "Beginner Boxing Social",
                location: "West End",
                time: "Thursday • 6:30 PM"
            }
        ]
    },


    sally: {
        name: "Sally S",
        age: 27,
        gender: "Non-Binary",
        mbti: "ISFJ",
        location: "Indooroopilly",
        initials: "SA",

        interests: [
            "Ballet",
            "Painting",
            "Netball"
        ],

        about:
            "Enjoys creative activities, ballet, painting and social sport.",

        events: [
            {
                name: "Ballet Meetup",
                location: "South Brisbane",
                time: "Wednesday • 5:30 PM"
            }
        ]
    },


    holly: {
        name: "Holly M",
        age: 24,
        gender: "Female",
        mbti: "",
        location: "Carindale",
        initials: "HM",

        interests: [
            "Swimming",
            "Museums",
            "Gaming"
        ],

        about:
            "Enjoys gaming, museums and swimming, especially low-pressure social activities.",

        events: [
            {
                name: "Museum Meetup",
                location: "South Brisbane",
                time: "Saturday • 11:00 AM"
            }
        ]
    },


    priya: {
        name: "Priya K",
        age: 20,
        gender: "Female",
        mbti: "ESFP",
        location: "Mt Gravatt",
        initials: "PK",

        interests: [
            "Pottery",
            "Horse Back Riding",
            "Fencing",
            "Eating"
        ],

        about:
            "Enjoys trying new activities and meeting people through shared experiences.",

        events: [
            {
                name: "Pottery Social",
                location: "West End",
                time: "Sunday • 11:00 AM"
            }
        ]
    }
};

const people = [
    {
        id: "samuel",
        lat: 0,
        lon: 0,
        size: 34,
        color: "#a85cff",
        main: true
    },

    {
        id: "zach",
        lat: 28,
        lon: -55,
        size: 20,
        color: "#48e4bd"
    },

    {
        id: "mike",
        lat: 30,
        lon: 55,
        size: 20,
        color: "#a968ff"
    },

    {
        id: "sally",
        lat: 0,
        lon: 90,
        size: 19,
        color: "#55c9ff"
    },

    {
        id: "holly",
        lat: -32,
        lon: -65,
        size: 19,
        color: "#55c9ff"
    },

    {
        id: "priya",
        lat: -40,
        lon: 45,
        size: 19,
        color: "#f17bc9"
    }
];

const lockedPeople = [

    {
        lat: 58,
        lon: -20
    },

    {
        lat: 15,
        lon: -120
    },

    {
        lat: 25,
        lon: 140
    },

    {
        lat: -25,
        lon: 130
    },

    {
        lat: -58,
        lon: -25
    },

    {
        lat: 52,
        lon: 115
    }

];

const connections = [

    ["samuel", "zach", "#a66dff"],

    ["samuel", "mike", "#a66dff"],

    ["samuel", "sally", "#a66dff"],

    ["samuel", "holly", "#a66dff"],

    ["samuel", "priya", "#a66dff"],

    ["zach", "mike", "#42e0c5"],

    ["priya", "mike", "#42e0c5"]

];
const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const scene =
    document.getElementById("scene");

const tooltip =
    document.getElementById("tooltip");

const profilePanel =
    document.getElementById("profilePanel");

const app =
    document.querySelector(".app");
let width;
let height;

let centreX;
let centreY;

let globeRadius;

const pixelRatio =
    Math.min(
        window.devicePixelRatio || 1,
        2
    );
let yaw = 0.15;

let pitch = -0.08;

let zoom = 1;

let dragging = false;

let movedWhileDragging = false;

let lastMouseX = 0;

let lastMouseY = 0;

let clickableNodes = [];


function resizeCanvas() {

    width =
        scene.clientWidth;

    height =
        scene.clientHeight;


    canvas.width =
        width * pixelRatio;

    canvas.height =
        height * pixelRatio;


    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";


    ctx.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
    );


    centreX =
        width / 2;


    centreY =
        height / 2 + 25;


    globeRadius =
        Math.min(
            width,
            height
        ) * 0.35;
}


window.addEventListener(
    "resize",
    resizeCanvas
);


resizeCanvas();

function toRadians(degrees) {

    return degrees * Math.PI / 180;
}

function spherePosition(lat, lon) {

    const latitude =
        toRadians(lat);

    const longitude =
        toRadians(lon);


    return {

        x:
            Math.cos(latitude)
            *
            Math.sin(longitude),

        y:
            -Math.sin(latitude),

        z:
            Math.cos(latitude)
            *
            Math.cos(longitude)

    };
}

function rotatePoint(point) {

    const cosYaw =
        Math.cos(yaw);

    const sinYaw =
        Math.sin(yaw);

    const cosPitch =
        Math.cos(pitch);

    const sinPitch =
        Math.sin(pitch);

    const x =
        point.x * cosYaw
        +
        point.z * sinYaw;


    const z =
        -point.x * sinYaw
        +
        point.z * cosYaw;

    const y =
        point.y * cosPitch
        -
        z * sinPitch;


    const finalZ =
        point.y * sinPitch
        +
        z * cosPitch;


    return {

        x: x,

        y: y,

        z: finalZ

    };
}

function projectPoint(point) {

    const cameraDistance = 3.2;


    const perspective =
        cameraDistance
        /
        (
            cameraDistance
            -
            point.z * 0.65
        );


    const radius =
        globeRadius * zoom;


    return {

        x:
            centreX
            +
            point.x
            *
            radius
            *
            perspective,

        y:
            centreY
            +
            point.y
            *
            radius
            *
            perspective,

        z:
            point.z,

        scale:
            perspective

    };
}

function getScreenPosition(lat, lon) {

    const point =
        spherePosition(
            lat,
            lon
        );


    const rotated =
        rotatePoint(point);


    return projectPoint(rotated);
}

function drawGlobeBackground() {

    const radius =
        globeRadius * zoom;



    ctx.save();


    ctx.shadowColor =
        "#7c4dff";

    ctx.shadowBlur =
        35;


    ctx.beginPath();


    ctx.arc(
        centreX,
        centreY,
        radius,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        "rgba(139, 91, 255, 0.8)";


    ctx.lineWidth = 2;


    ctx.stroke();


    ctx.restore();



    const gradient =
        ctx.createRadialGradient(

            centreX - radius * 0.3,

            centreY - radius * 0.3,

            radius * 0.05,

            centreX,

            centreY,

            radius

        );


    gradient.addColorStop(
        0,
        "rgba(145, 92, 255, 0.28)"
    );


    gradient.addColorStop(
        0.55,
        "rgba(90, 48, 190, 0.13)"
    );


    gradient.addColorStop(
        1,
        "rgba(25, 14, 70, 0.03)"
    );


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
}

function drawGridLine(points) {

    let previous = null;


    points.forEach(point => {

        const screen =
            getScreenPosition(
                point.lat,
                point.lon
            );


        if (previous) {

            ctx.beginPath();


            ctx.moveTo(
                previous.x,
                previous.y
            );


            ctx.lineTo(
                screen.x,
                screen.y
            );


            if (
                screen.z < -0.1
            ) {

                ctx.strokeStyle =
                    "rgba(120, 80, 210, 0.06)";
            }

            else {

                ctx.strokeStyle =
                    "rgba(155, 105, 255, 0.28)";
            }


            ctx.lineWidth =
                0.7;


            ctx.stroke();
        }


        previous =
            screen;
    });
}
 
function drawGrid() {

    for (
        let lat = -60;
        lat <= 60;
        lat += 20
    ) {

        const points = [];


        for (
            let lon = -180;
            lon <= 180;
            lon += 4
        ) {

            points.push({

                lat: lat,

                lon: lon

            });
        }


        drawGridLine(points);
    }

    for (
        let lon = -160;
        lon < 180;
        lon += 20
    ) {

        const points = [];


        for (
            let lat = -89;
            lat <= 89;
            lat += 3
        ) {

            points.push({

                lat: lat,

                lon: lon

            });
        }


        drawGridLine(points);
    }
}

function drawConnection(
    personA,
    personB,
    color
) {

    const pointA =
        spherePosition(
            personA.lat,
            personA.lon
        );


    const pointB =
        spherePosition(
            personB.lat,
            personB.lon
        );


    const dot =
        Math.max(
            -1,

            Math.min(

                1,

                pointA.x * pointB.x
                +
                pointA.y * pointB.y
                +
                pointA.z * pointB.z

            )
        );


    const angle =
        Math.acos(dot);


    const sinAngle =
        Math.sin(angle);


    let previous = null;


    for (
        let step = 0;
        step <= 35;
        step++
    ) {

        const amount =
            step / 35;


        let weightA;

        let weightB;


        if (
            Math.abs(sinAngle) > 0.0001
        ) {

            weightA =
                Math.sin(
                    (1 - amount)
                    *
                    angle
                )
                /
                sinAngle;


            weightB =
                Math.sin(
                    amount
                    *
                    angle
                )
                /
                sinAngle;
        }

        else {

            weightA =
                1 - amount;

            weightB =
                amount;
        }


        const point = {

            x:
                pointA.x * weightA
                +
                pointB.x * weightB,

            y:
                pointA.y * weightA
                +
                pointB.y * weightB,

            z:
                pointA.z * weightA
                +
                pointB.z * weightB

        };


        const rotated =
            rotatePoint(point);


        const screen =
            projectPoint(rotated);


        if (previous) {

            ctx.beginPath();


            ctx.moveTo(
                previous.x,
                previous.y
            );


            ctx.lineTo(
                screen.x,
                screen.y
            );


            const depth =
                (
                    previous.z
                    +
                    screen.z
                )
                /
                2;


            ctx.globalAlpha =
                depth < -0.15
                ?
                0.1
                :
                0.75;


            ctx.strokeStyle =
                color;


            ctx.lineWidth =
                1.4;


            ctx.stroke();
        }


        previous =
            screen;
    }


    ctx.globalAlpha =
        1;
}

function drawProfileNode(person) {

    const position =
        getScreenPosition(
            person.lat,
            person.lon
        );


    const profile =
        profiles[person.id];


    const radius =
        person.size
        *
        (
            0.65
            +
            position.scale * 0.42
        )
        *
        zoom;


    const alpha =
        position.z < -0.2
        ?
        0.22
        :
        Math.min(
            1,
            0.72 + position.z * 0.25
        );


    ctx.save();


    ctx.globalAlpha =
        alpha;

    ctx.shadowColor =
        person.color;


    ctx.shadowBlur =
        position.z > 0
        ?
        radius
        :
        3;


    /* Circle */

    ctx.beginPath();


    ctx.arc(
        position.x,
        position.y,
        radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        person.main
        ?
        "#2c2145"
        :
        "#20243a";


    ctx.fill();


    ctx.lineWidth =
        person.main
        ?
        3
        :
        2.4;


    ctx.strokeStyle =
        person.color;


    ctx.stroke();


    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        `bold ${
            Math.max(
                9,
                radius * 0.45
            )
        }px Arial`;


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.fillText(
        profile.initials,
        position.x,
        position.y
    );


    if (
        position.z > -0.1
    ) {

        ctx.font =
            person.main
            ?
            "bold 14px Arial"
            :
            "11px Arial";


        ctx.textBaseline =
            "top";


        ctx.fillText(

            person.main
            ?
            "You"
            :
            profile.name.split(" ")[0],

            position.x,

            position.y
            +
            radius
            +
            6

        );
    }


    ctx.restore();


    return {

        x: position.x,

        y: position.y,

        z: position.z,

        radius: radius,

        id: person.id,

        locked: false

    };
}

function drawLockedNode(person) {

    const position =
        getScreenPosition(
            person.lat,
            person.lon
        );


    const radius =
        14
        *
        (
            0.65
            +
            position.scale * 0.42
        )
        *
        zoom;


    ctx.save();


    ctx.globalAlpha =
        position.z < -0.2
        ?
        0.16
        :
        0.8;


    ctx.shadowColor =
        "#88839c";


    ctx.shadowBlur =
        position.z > 0
        ?
        15
        :
        2;


    ctx.beginPath();


    ctx.arc(
        position.x,
        position.y,
        radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#151827";


    ctx.fill();


    ctx.lineWidth = 2;


    ctx.strokeStyle =
        "#62667e";


    ctx.stroke();


    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#b3b5c4";


    ctx.font =
        `${Math.max(
            9,
            radius * 0.7
        )}px Arial`;


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


    return {

        x: position.x,

        y: position.y,

        z: position.z,

        radius: radius,

        locked: true

    };
}

function draw() {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    drawGlobeBackground();

    drawGrid();


    const peopleById = {};


    people.forEach(person => {

        peopleById[person.id] =
            person;

    });


    connections.forEach(connection => {

        drawConnection(

            peopleById[connection[0]],

            peopleById[connection[1]],

            connection[2]

        );

    });


    const nodes = [];


    lockedPeople.forEach(person => {

        nodes.push({

            type: "locked",

            data: person,

            depth:
                getScreenPosition(
                    person.lat,
                    person.lon
                ).z

        });

    });


    people.forEach(person => {

        nodes.push({

            type: "profile",

            data: person,

            depth:
                getScreenPosition(
                    person.lat,
                    person.lon
                ).z

        });

    });


    nodes.sort(
        (a, b) =>
            a.depth - b.depth
    );


    clickableNodes = [];


    nodes.forEach(node => {

        if (
            node.type === "locked"
        ) {

            clickableNodes.push(

                drawLockedNode(
                    node.data
                )

            );

        }

        else {

            clickableNodes.push(

                drawProfileNode(
                    node.data
                )

            );

        }

    });


    if (!dragging) {

        yaw += 0.001;

    }


    requestAnimationFrame(draw);
}


draw();

function findNodeAtMouse(
    mouseX,
    mouseY
) {

    return [...clickableNodes]
        .reverse()
        .find(node => {

            const distance =
                Math.hypot(

                    mouseX - node.x,

                    mouseY - node.y

                );


            return (

                distance
                <
                node.radius + 8

                &&

                node.z > -0.35

            );

        });
}

scene.addEventListener(
    "pointerdown",

    event => {

        dragging = true;

        movedWhileDragging = false;


        lastMouseX =
            event.clientX;


        lastMouseY =
            event.clientY;


        scene.classList.add(
            "dragging"
        );


        scene.setPointerCapture(
            event.pointerId
        );

    }
);

scene.addEventListener(
    "pointermove",

    event => {

        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX
            -
            rect.left;


        const mouseY =
            event.clientY
            -
            rect.top;

        if (dragging) {

            const changeX =
                event.clientX
                -
                lastMouseX;


            const changeY =
                event.clientY
                -
                lastMouseY;


            if (
                Math.abs(changeX) > 1
                ||
                Math.abs(changeY) > 1
            ) {

                movedWhileDragging = true;

            }


            yaw +=
                changeX * 0.006;


            pitch +=
                changeY * 0.006;


            pitch =
                Math.max(
                    -1.25,

                    Math.min(
                        1.25,
                        pitch
                    )
                );


            lastMouseX =
                event.clientX;


            lastMouseY =
                event.clientY;


            tooltip.style.display =
                "none";


            return;

        }


        /* Hover */

        const node =
            findNodeAtMouse(
                mouseX,
                mouseY
            );


        if (
            node
            &&
            !node.locked
        ) {

            const profile =
                profiles[node.id];


            tooltip.style.display =
                "block";


            tooltip.style.left =
                mouseX + 15 + "px";


            tooltip.style.top =
                mouseY + 15 + "px";


            tooltip.innerHTML = `

                <strong>
                    ${profile.name}
                </strong>

                <small>
                    ${profile.age}
                    •
                    ${profile.location}

                    ${
                        profile.mbti
                        ?
                        " • " + profile.mbti
                        :
                        ""
                    }
                </small>

            `;

        }

        else if (
            node
            &&
            node.locked
        ) {

            tooltip.style.display =
                "block";


            tooltip.style.left =
                mouseX + 15 + "px";


            tooltip.style.top =
                mouseY + 15 + "px";


            tooltip.innerHTML = `

                <strong>
                    Unknown User
                </strong>

                <small>
                    Meet this connection at an event
                    to unlock their profile.
                </small>

            `;

        }

        else {

            tooltip.style.display =
                "none";

        }

    }
);

scene.addEventListener(
    "pointerup",

    event => {

        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX
            -
            rect.left;


        const mouseY =
            event.clientY
            -
            rect.top;


        if (!movedWhileDragging) {

            const node =
                findNodeAtMouse(
                    mouseX,
                    mouseY
                );


            if (
                node
                &&
                !node.locked
            ) {


                if (
                    node.id === "samuel"
                ) {

                    window.location.href =
                        "account.html";

                }

                else {

                    openProfile(
                        node.id
                    );

                }

            }

        }


        dragging = false;


        scene.classList.remove(
            "dragging"
        );

    }
);

scene.addEventListener(
    "pointerleave",

    () => {

        dragging = false;


        scene.classList.remove(
            "dragging"
        );


        tooltip.style.display =
            "none";

    }
);

scene.addEventListener(
    "wheel",

    event => {

        event.preventDefault();


        zoom -=
            event.deltaY
            *
            0.0007;


        zoom =
            Math.max(

                0.65,

                Math.min(
                    1.4,
                    zoom
                )

            );

    },

    {
        passive: false
    }
);

function openProfile(id) {

    const profile =
        profiles[id];

    document.getElementById(
        "avatar"
    ).textContent =
        profile.initials;

    document.getElementById(
        "pname"
    ).textContent =
        `${profile.name}, ${profile.age}`;

    let locationText =
        "⌖ "
        +
        profile.location;


    if (profile.mbti) {

        locationText +=
            " • "
            +
            profile.mbti;

    }


    document.getElementById(
        "ploc"
    ).textContent =
        locationText;

    document.getElementById(
        "about"
    ).textContent =
        profile.about;

    const interestContainer =
        document.getElementById(
            "chips"
        );


    interestContainer.innerHTML =
        "";


    profile.interests.forEach(
        interest => {

            const chip =
                document.createElement(
                    "span"
                );


            chip.className =
                "interest-chip";


            chip.textContent =
                interest;


            interestContainer.appendChild(
                chip
            );

        }
    );


    const eventContainer =
        document.getElementById(
            "events"
        );


    eventContainer.innerHTML =
        "";


    profile.events.forEach(
        event => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "profile-event";


            card.innerHTML = `

                <strong>
                    ${event.name}
                </strong>

                <small>
                    ⌖ ${event.location}
                </small>

                <small>
                    ${event.time}
                </small>

            `;


            eventContainer.appendChild(
                card
            );

        }
    );


    const samuel =
        profiles.samuel;


    const sharedInterests =
        profile.interests.filter(
            interest =>
                samuel.interests.includes(
                    interest
                )
        );


    const connection =
        document.getElementById(
            "connection"
        );


    if (
        sharedInterests.length > 0
    ) {

        connection.textContent =

            `${sharedInterests.length} shared interest${
                sharedInterests.length === 1
                ?
                ""
                :
                "s"
            } with Samuel: ${
                sharedInterests.join(", ")
            }.`;

    }

    else {

        connection.textContent =
            "This person is part of your unlocked Sphere network.";

    }

    profilePanel.classList.add(
        "open"
    );


    app.classList.add(
        "profile-open"
    );


    setTimeout(
        resizeCanvas,
        10
    );

}

function closeProfile() {

    profilePanel.classList.remove(
        "open"
    );


    app.classList.remove(
        "profile-open"
    );


    setTimeout(
        resizeCanvas,
        10
    );

}


document
    .getElementById("panelClose")
    .addEventListener(
        "click",
        closeProfile
    );

const chatPopup =
    document.getElementById(
        "chatbox"
    );


document
    .getElementById("msg")
    .addEventListener(
        "click",

        () => {

            chatPopup.classList.add(
                "open"
            );

        }
    );


/* Close chat */

document
    .getElementById("closeChat")
    .addEventListener(
        "click",

        () => {

            chatPopup.classList.remove(
                "open"
            );

        }
    );

document
    .querySelectorAll(".chat-person")
    .forEach(

        button => {

            button.addEventListener(
                "click",

                () => {

                    const person =
                        button.dataset.key;


                    openProfile(
                        person
                    );


                    chatPopup.classList.remove(
                        "open"
                    );

                }
            );

        }

    );

const searchInput =
    document.getElementById(
        "search"
    );


searchInput.addEventListener(
    "keydown",

    event => {

        if (
            event.key !== "Enter"
        ) {

            return;

        }


        const search =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!search) {

            return;

        }


        const result =
            Object.keys(
                profiles
            ).find(

                id => {

                    const profile =
                        profiles[id];


                    const searchable =
                        [

                            profile.name,

                            profile.location,

                            profile.mbti,

                            profile.gender,

                            ...profile.interests

                        ]

                        .join(" ")

                        .toLowerCase();


                    return searchable.includes(
                        search
                    );

                }

            );


        if (!result) {

            alert(
                "No matching person found."
            );


            return;

        }


        if (
            result === "samuel"
        ) {

            window.location.href =
                "account.html";


            return;

        }


        openProfile(
            result
        );

    }
);
document
    .getElementById("viewSphere")
    .addEventListener(
        "click",

        () => {

            closeProfile();

        }
    );

const searchInput = document.getElementById("search");
const searchSuggestions = document.getElementById("searchSuggestions");

const searchablePeople = [

    {
        name: "Zach T",
        key: "zach",
        initials: "ZT",
        suburb: "Toowong",
        interests: [
            "Horse Back Riding",
            "Reading",
            "Football"
        ]
    },

    {
        name: "Mike S",
        key: "mike",
        initials: "MS",
        suburb: "Toowong",
        interests: [
            "Boxing",
            "Reading",
            "Eating"
        ]
    },

    {
        name: "Sally S",
        key: "sally",
        initials: "SS",
        suburb: "Indooroopilly",
        interests: [
            "Ballet",
            "Painting",
            "Netball"
        ]
    },

    {
        name: "Holly M",
        key: "holly",
        initials: "HM",
        suburb: "Carindale",
        interests: [
            "Swimming",
            "Museums",
            "Gaming"
        ]
    },

    {
        name: "Priya K",
        key: "priya",
        initials: "PK",
        suburb: "Mt Gravatt",
        interests: [
            "Pottery",
            "Horse Back Riding",
            "Fencing",
            "Eating"
        ]
    }

];

searchInput.addEventListener("input", function () {

    const searchText =
        searchInput.value.trim().toLowerCase();

    if (searchText.length < 2) {

        searchSuggestions.innerHTML = "";
        searchSuggestions.hidden = true;

        return;
    }

    const matches = searchablePeople.filter(function (person) {

        const nameMatch =
            person.name
                .toLowerCase()
                .includes(searchText);


        const suburbMatch =
            person.suburb
                .toLowerCase()
                .includes(searchText);


        const interestMatch =
            person.interests.some(function (interest) {

                return interest
                    .toLowerCase()
                    .includes(searchText);

            });


        return (
            nameMatch ||
            suburbMatch ||
            interestMatch
        );

    });


    showSearchSuggestions(matches);

});

function showSearchSuggestions(matches) {

    searchSuggestions.innerHTML = "";

    if (matches.length === 0) {

        searchSuggestions.innerHTML = `
            <div class="no-search-result">
                No people found
            </div>
        `;

        searchSuggestions.hidden = false;

        return;
    }

    matches.slice(0, 5).forEach(function (person) {

        const suggestion =
            document.createElement("button");


        suggestion.type = "button";

        suggestion.className =
            "search-suggestion";


        suggestion.innerHTML = `

            <div class="suggestion-avatar">
                ${person.initials}
            </div>

            <div class="suggestion-information">

                <strong>
                    ${person.name}
                </strong>

                <span>
                    ${person.interests.join(" • ")}
                </span>

                <small>
                    ${person.suburb}
                </small>

            </div>

        `;

        suggestion.addEventListener("click", function () {

            searchInput.value =
                person.name;


            searchSuggestions.hidden = true;

            if (typeof openPersonProfile === "function") {

                openPersonProfile(person.key);

            }

        });


        searchSuggestions.appendChild(
            suggestion
        );

    });


    searchSuggestions.hidden = false;

}

document.addEventListener("click", function (event) {

    const searchBar =
        document.querySelector(".search-bar");


    if (
        searchBar &&
        !searchBar.contains(event.target)
    ) {

        searchSuggestions.hidden = true;

    }

});

searchInput.addEventListener("focus", function () {

    const searchText =
        searchInput.value.trim();


    if (searchText.length >= 2) {

        searchInput.dispatchEvent(
            new Event("input")
        );

    }

});