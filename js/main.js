const profiles = {
    samuel: {
        key: "samuel",
        initials: "SS",
        name: "Samuel",
        age: 22,
        gender: "Male",
        mbti: "INFP",
        suburb: "South Bank",
        interests: ["Gaming", "Pottery", "Museums", "Reading"],
        about: "Looking to connect with people who share similar interests and experiences.",
        event: "Brisbane Social Meetup",
        connection: "This is you.",
        lat: -8,
        lon: 18,
        main: true
    },

    zach: {
        key: "zach",
        initials: "ZT",
        name: "Zach",
        age: 23,
        gender: "Male",
        mbti: "INFJ",
        suburb: "Toowong",
        interests: ["Horse Riding", "Reading", "Football"],
        about: "Enjoys outdoor activities, reading and meeting people through shared interests.",
        event: "Weekend River Walk",
        connection: "You met Zach through a shared social activity.",
        lat: 15,
        lon: -50
    },

    mike: {
        key: "mike",
        initials: "MS",
        name: "Mike",
        age: 22,
        gender: "Male",
        mbti: "ISTP",
        suburb: "Toowong",
        interests: ["Boxing", "Reading", "Food"],
        about: "Interested in fitness, boxing and exploring events around Brisbane.",
        event: "Beginner Boxing Session",
        connection: "You and Mike share interests in local activities.",
        lat: 25,
        lon: 50
    },

    sally: {
        key: "sally",
        initials: "SA",
        name: "Sally",
        age: 21,
        gender: "Female",
        mbti: "ENFP",
        suburb: "Indooroopilly",
        interests: ["Ballet", "Painting", "Netball"],
        about: "Enjoys creative activities, sport and meeting new people.",
        event: "Community Art Workshop",
        connection: "You connected through a creative community event.",
        lat: -5,
        lon: 65
    },

    holly: {
        key: "holly",
        initials: "HM",
        name: "Holly",
        age: 22,
        gender: "Female",
        mbti: "ISFJ",
        suburb: "Carindale",
        interests: ["Swimming", "Museums", "Gaming"],
        about: "Likes relaxed activities, museums, gaming and exploring Brisbane.",
        event: "Museum Social Afternoon",
        connection: "You and Holly share an interest in museums.",
        lat: -40,
        lon: -35
    },

    priya: {
        key: "priya",
        initials: "PK",
        name: "Priya",
        age: 21,
        gender: "Female",
        mbti: "INTJ",
        suburb: "Mt Gravatt",
        interests: ["Pottery", "Fencing", "Food", "Walking"],
        about: "Enjoys creative workshops and smaller social activities.",
        event: "Beginner Pottery Workshop",
        connection: "You connected through a local creative event.",
        lat: -45,
        lon: 35
    }
};

const lockedProfiles = [
    {
        key: "locked1",
        initials: "🔒",
        name: "Locked",
        locked: true,
        lat: 62,
        lon: 0
    },

    {
        key: "locked2",
        initials: "🔒",
        name: "Locked",
        locked: true,
        lat: 35,
        lon: -82
    },

    {
        key: "locked3",
        initials: "🔒",
        name: "Locked",
        locked: true,
        lat: 38,
        lon: 83
    }
];

const people = [
    profiles.samuel,
    profiles.zach,
    profiles.mike,
    profiles.sally,
    profiles.holly,
    profiles.priya,
    ...lockedProfiles
];

const connections = [
    ["samuel", "zach"],
    ["samuel", "mike"],
    ["samuel", "sally"],
    ["samuel", "holly"],
    ["samuel", "priya"],
    ["zach", "mike"],
    ["priya", "mike"]
];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scene = document.getElementById("scene");
const tooltip = document.getElementById("tooltip");

let width = 0;
let height = 0;
let centerX = 0;
let centerY = 0;
let radius = 290;
let zoom = 1;

let rotationX = -0.05;
let rotationY = 0;

let dragging = false;
let movedDuringDrag = false;
let previousX = 0;
let previousY = 0;

let projectedPeople = [];

function resizeCanvas() {
    const rect = scene.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    width = rect.width;
    height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    centerX = width / 2;
    centerY = Math.max(470, height * 0.64);

    radius = Math.min(width * 0.25, height * 0.39, 310);

    draw();
}

function latLonToXYZ(lat, lon) {
    const latitude = lat * Math.PI / 180;
    const longitude = lon * Math.PI / 180;

    return {
        x: Math.cos(latitude) * Math.sin(longitude),
        y: -Math.sin(latitude),
        z: Math.cos(latitude) * Math.cos(longitude)
    };
}

function rotatePoint(point) {
    let x = point.x;
    let y = point.y;
    let z = point.z;

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);

    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    x = x1;
    z = z1;

    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    const y1 = y * cosX - z * sinX;
    const z2 = y * sinX + z * cosX;

    return {
        x: x,
        y: y1,
        z: z2
    };
}

function project(point) {
    const rotated = rotatePoint(point);
    const currentRadius = radius * zoom;

    return {
        x: centerX + rotated.x * currentRadius,
        y: centerY + rotated.y * currentRadius,
        z: rotated.z
    };
}

function drawSphereGlow() {
    const currentRadius = radius * zoom;

    const glow = ctx.createRadialGradient(
        centerX - currentRadius * 0.25,
        centerY - currentRadius * 0.2,
        currentRadius * 0.05,
        centerX,
        centerY,
        currentRadius
    );

    glow.addColorStop(0, "rgba(96, 54, 180, 0.42)");
    glow.addColorStop(0.55, "rgba(47, 28, 100, 0.28)");
    glow.addColorStop(1, "rgba(20, 13, 55, 0.12)");

    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(145, 76, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(100, 69, 200, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawLatitudeLines() {
    const currentRadius = radius * zoom;

    const latitudes = [-60, -30, 0, 30, 60];

    latitudes.forEach(function (latitude) {
        ctx.beginPath();

        let started = false;

        for (let longitude = -180; longitude <= 180; longitude += 4) {
            const point = project(
                latLonToXYZ(latitude, longitude)
            );

            if (!started) {
                ctx.moveTo(point.x, point.y);
                started = true;
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }

        ctx.strokeStyle = "rgba(123, 80, 220, 0.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(
        centerX,
        centerY,
        currentRadius,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle = "rgba(145, 76, 255, 0.55)";
    ctx.stroke();
}

function drawLongitudeLines() {
    const longitudes = [
        -150,
        -120,
        -90,
        -60,
        -30,
        0,
        30,
        60,
        90,
        120,
        150
    ];

    longitudes.forEach(function (longitude) {
        ctx.beginPath();

        let started = false;

        for (let latitude = -90; latitude <= 90; latitude += 3) {
            const point = project(
                latLonToXYZ(latitude, longitude)
            );

            if (!started) {
                ctx.moveTo(point.x, point.y);
                started = true;
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }

        ctx.strokeStyle = "rgba(123, 80, 220, 0.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

function getPerson(key) {
    return people.find(function (person) {
        return person.key === key;
    });
}

function drawConnections() {
    connections.forEach(function (connection) {
        const personA = getPerson(connection[0]);
        const personB = getPerson(connection[1]);

        if (!personA || !personB) {
            return;
        }

        const pointA = project(
            latLonToXYZ(personA.lat, personA.lon)
        );

        const pointB = project(
            latLonToXYZ(personB.lat, personB.lon)
        );

        const visibility = Math.min(pointA.z, pointB.z);

        if (visibility < -0.35) {
            return;
        }

        const alpha = Math.max(
            0.15,
            Math.min(0.85, (visibility + 1) / 2)
        );

        const gradient = ctx.createLinearGradient(
            pointA.x,
            pointA.y,
            pointB.x,
            pointB.y
        );

        gradient.addColorStop(
            0,
            "rgba(74, 230, 207," + alpha + ")"
        );

        gradient.addColorStop(
            1,
            "rgba(165, 76, 255," + alpha + ")"
        );

        ctx.beginPath();
        ctx.moveTo(pointA.x, pointA.y);

        const middleX =
            (pointA.x + pointB.x) / 2;

        const middleY =
            (pointA.y + pointB.y) / 2 -
            25 * zoom;

        ctx.quadraticCurveTo(
            middleX,
            middleY,
            pointB.x,
            pointB.y
        );

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.7;
        ctx.stroke();
    });
}

function drawPerson(person) {
    const point = project(
        latLonToXYZ(person.lat, person.lon)
    );

    const depth =
        Math.max(0.45, Math.min(1.2, 0.8 + point.z * 0.25));

    let nodeRadius = person.main ? 47 : 27;

    if (person.locked) {
        nodeRadius = 19;
    }

    nodeRadius *= zoom * depth;

    const opacity =
        Math.max(0.28, Math.min(1, 0.65 + point.z * 0.35));

    projectedPeople.push({
        person: person,
        x: point.x,
        y: point.y,
        z: point.z,
        radius: nodeRadius
    });

    ctx.save();

    ctx.globalAlpha = opacity;

    if (person.locked) {
        ctx.shadowColor = "rgba(255,255,255,0.45)";
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.arc(
            point.x,
            point.y,
            nodeRadius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "rgba(55, 57, 72, 0.9)";
        ctx.fill();

        ctx.strokeStyle = "rgba(150, 150, 165, 0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.fillStyle = "#c7c7cf";
        ctx.font =
            Math.max(12, 14 * zoom) +
            "px Arial";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "🔒",
            point.x,
            point.y + 1
        );

        ctx.restore();
        return;
    }

    if (person.key === "zach") {
        ctx.shadowColor = "#4ce4c6";
    } else {
        ctx.shadowColor = "#9b50f2";
    }

    ctx.shadowBlur = person.main ? 20 : 14;

    ctx.beginPath();
    ctx.arc(
        point.x,
        point.y,
        nodeRadius,
        0,
        Math.PI * 2
    );

    if (person.main) {
        ctx.fillStyle = "#4b2d68";
        ctx.strokeStyle = "#a44eff";
    } else if (person.key === "zach") {
        ctx.fillStyle = "#234b55";
        ctx.strokeStyle = "#4ce4c6";
    } else {
        ctx.fillStyle = "#423066";
        ctx.strokeStyle = "#9751e9";
    }

    ctx.lineWidth = person.main ? 4 : 3;

    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold " +
        Math.max(
            11,
            (person.main ? 19 : 12) * zoom
        ) +
        "px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        person.initials,
        point.x,
        point.y
    );

    ctx.fillStyle = "#ffffff";

    ctx.font =
        (person.main ? "bold " : "") +
        Math.max(
            10,
            (person.main ? 15 : 11) * zoom
        ) +
        "px Arial";

    ctx.textBaseline = "top";

    ctx.fillText(
        person.main ? "You" : person.name,
        point.x,
        point.y + nodeRadius + 7
    );

    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    projectedPeople = [];

    drawSphereGlow();
    drawLatitudeLines();
    drawLongitudeLines();
    drawConnections();

    const sortedPeople = [...people].sort(function (a, b) {
        const aPoint = rotatePoint(
            latLonToXYZ(a.lat, a.lon)
        );

        const bPoint = rotatePoint(
            latLonToXYZ(b.lat, b.lon)
        );

        return aPoint.z - bPoint.z;
    });

    sortedPeople.forEach(function (person) {
        drawPerson(person);
    });
}

function findPersonAt(x, y) {
    const sorted = [...projectedPeople].sort(function (a, b) {
        return b.z - a.z;
    });

    return sorted.find(function (item) {
        const dx = x - item.x;
        const dy = y - item.y;

        return Math.sqrt(
            dx * dx + dy * dy
        ) <= item.radius + 8;
    });
}

canvas.addEventListener("mousedown", function (event) {
    dragging = true;
    movedDuringDrag = false;

    previousX = event.clientX;
    previousY = event.clientY;
});

window.addEventListener("mousemove", function (event) {
    if (!dragging) {
        return;
    }

    const dx = event.clientX - previousX;
    const dy = event.clientY - previousY;

    if (
        Math.abs(dx) > 1 ||
        Math.abs(dy) > 1
    ) {
        movedDuringDrag = true;
    }

    rotationY += dx * 0.006;
    rotationX += dy * 0.006;

    rotationX = Math.max(
        -1.2,
        Math.min(1.2, rotationX)
    );

    previousX = event.clientX;
    previousY = event.clientY;

    draw();
});

window.addEventListener("mouseup", function () {
    dragging = false;
});

canvas.addEventListener(
    "wheel",
    function (event) {

        if (!event.ctrlKey) {
            return;
        }

        event.preventDefault();

        const zoomAmount = -event.deltaY * 0.01;

        zoom += zoomAmount;

        zoom = Math.max(
            0.7,
            Math.min(1.4, zoom)
        );

        draw();

    },
    {
        passive: false
    }
);

canvas.addEventListener("mousemove", function (event) {
    if (dragging) {
        tooltip.style.display = "none";
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const found = findPersonAt(x, y);

    if (!found) {
        tooltip.style.display = "none";
        canvas.style.cursor = "grab";
        return;
    }

    canvas.style.cursor = "pointer";

    if (found.person.locked) {
        tooltip.textContent =
            "Keep exploring to unlock this connection";
    } else if (found.person.main) {
        tooltip.textContent = "You";
    } else {
        tooltip.textContent =
            found.person.name +
            " • " +
            found.person.suburb;
    }

    tooltip.style.display = "block";

    tooltip.style.left =
        event.clientX -
        rect.left +
        15 +
        "px";

    tooltip.style.top =
        event.clientY -
        rect.top +
        15 +
        "px";
});

canvas.addEventListener("mouseleave", function () {
    tooltip.style.display = "none";
});

canvas.addEventListener("click", function (event) {
    if (movedDuringDrag) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const found = findPersonAt(x, y);

    if (!found) {
        return;
    }

    if (found.person.locked) {
        return;
    }

    if (found.person.main) {
        return;
    }

    openPersonProfile(found.person.key);
});

const profilePanel =
    document.getElementById("profilePanel");

const panelClose =
    document.getElementById("panelClose");

const avatar =
    document.getElementById("avatar");

const profileName =
    document.getElementById("pname");

const profileLocation =
    document.getElementById("ploc");

const profileAge =
    document.getElementById("pAge");

const profileGender =
    document.getElementById("pGender");

const profileMbti =
    document.getElementById("pMbti");

const profileChips =
    document.getElementById("chips");

const profileAbout =
    document.getElementById("about");

const profileEvents =
    document.getElementById("events");

const profileConnection =
    document.getElementById("connection");

const messageButton =
    document.getElementById("msg");

let currentProfile = null;

function openPersonProfile(key) {
    const person = profiles[key];

    if (!person || person.main) {
        return;
    }

    currentProfile = person;

    avatar.textContent =
        person.initials;

    profileName.textContent =
        person.name;

    profileLocation.textContent =
        person.suburb;

    profileAge.textContent =
        person.age + " years old";

    profileGender.textContent =
        person.gender;

    profileMbti.textContent =
        person.mbti;

    profileAbout.textContent =
        person.about;

    profileEvents.textContent =
        person.event;

    profileConnection.textContent =
        person.connection;

    profileChips.innerHTML = "";

    person.interests.forEach(function (interest) {
        const chip =
            document.createElement("span");

        chip.className =
            "interest-chip";

        chip.textContent =
            interest;

        profileChips.appendChild(chip);
    });

    profilePanel.classList.add("open");
}

panelClose.addEventListener("click", function () {
    profilePanel.classList.remove("open");
});

messageButton.addEventListener("click", function () {
    if (!currentProfile) {
        return;
    }

    window.location.href =
        "chat.html?person=" +
        encodeURIComponent(
            currentProfile.key
        );
});

const searchInput =
    document.getElementById("search");

const searchSuggestions =
    document.getElementById("searchSuggestions");

const searchablePeople =
    Object.values(profiles).filter(function (person) {
        return !person.main;
    });

searchInput.addEventListener("input", function () {
    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();

    if (searchText.length < 2) {
        searchSuggestions.innerHTML = "";
        searchSuggestions.hidden = true;
        return;
    }

    const matches =
        searchablePeople.filter(function (person) {
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
        const noResult =
            document.createElement("div");

        noResult.className =
            "no-search-result";

        noResult.textContent =
            "No people found";

        searchSuggestions.appendChild(
            noResult
        );

        searchSuggestions.hidden = false;

        return;
    }

    matches
        .slice(0, 5)
        .forEach(function (person) {
            const suggestion =
                document.createElement("button");

            suggestion.type = "button";

            suggestion.className =
                "search-suggestion";

            const suggestionAvatar =
                document.createElement("div");

            suggestionAvatar.className =
                "suggestion-avatar";

            suggestionAvatar.textContent =
                person.initials;

            const suggestionInfo =
                document.createElement("div");

            suggestionInfo.className =
                "suggestion-info";

            const name =
                document.createElement("strong");

            name.textContent =
                person.name;

            const interests =
                document.createElement("span");

            interests.textContent =
                person.interests.join(" • ");

            const suburb =
                document.createElement("small");

            suburb.textContent =
                person.suburb;

            suggestionInfo.appendChild(name);
            suggestionInfo.appendChild(interests);
            suggestionInfo.appendChild(suburb);

            suggestion.appendChild(
                suggestionAvatar
            );

            suggestion.appendChild(
                suggestionInfo
            );

            suggestion.addEventListener(
                "click",
                function () {
                    searchInput.value =
                        person.name;

                    searchSuggestions.hidden =
                        true;

                    openPersonProfile(
                        person.key
                    );
                }
            );

            searchSuggestions.appendChild(
                suggestion
            );
        });

    searchSuggestions.hidden = false;
}

searchInput.addEventListener("focus", function () {
    if (
        searchInput.value
            .trim()
            .length >= 2
    ) {
        searchInput.dispatchEvent(
            new Event("input")
        );
    }
});

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

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();