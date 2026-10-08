/* EVENTS PAGE JS */


// GET PAGE ELEMENTS
window.addEventListener("load", function () {
    setTimeout(function () {
        document.body.classList.add("loaded");
    }, 1200);
});
const listViewButton = document.getElementById("listViewButton");
const mapViewButton = document.getElementById("mapViewButton");

const listView = document.getElementById("listView");
const mapView = document.getElementById("mapView");

const eventDetails = document.getElementById("eventDetails");
const closeEventDetails = document.getElementById("closeEventDetails");

const bookEventButton = document.getElementById("bookEventButton");
const cancelEventButton = document.getElementById("cancelEventButton");
const attendanceStatus = document.getElementById("attendanceStatus");

let selectedEvent = null;

// MAP SETUP

const eventMap = L.map("eventMap").setView([-27.4698, 153.0251], 13);


// MAPBOX TILES

L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}?access_token=" + MAPBOX_TOKEN,
    {
        attribution: "Map data © OpenStreetMap contributors, Imagery © Mapbox",
        maxZoom: 18,
        tileSize: 512,
        zoomOffset: -1
    }
).addTo(eventMap);


// CUSTOM EVENT MARKER

const sphereMarker = L.icon({
    iconUrl: "images/sphere_marker.png",
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -45]
});


// BCC EVENT LOCATIONS API

const LOCATIONS_API =
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events-locations/records?limit=100";

fetch(LOCATIONS_API)
    .then(function (response) {

        if (!response.ok) {
            throw new Error("BCC locations API request failed");
        }

        return response.json();

    })
    .then(function (data) {

        console.log("BCC EVENT LOCATIONS:", data);

        data.results.forEach(function (location) {

            if (location.latitude && location.longitude) {

                L.marker(
                    [location.latitude, location.longitude],
                    { icon: sphereMarker }
                )
                    .addTo(eventMap)
                    .bindPopup(
                        "<strong>" + location.venue_name + "</strong><br>" +
                        location.venue_address
                    );

            }

        });

    })
    .catch(function (error) {

        console.error("Error loading BCC event locations:", error);

    });

// BRISBANE CITY COUNCIL EVENTS API
const EVENTS_API =
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records";

// API PAGINATION
const API_BATCH_SIZE = 100;
const MAX_API_PAGES = 5;
let loadedEvents = [];
let filteredEvents = [];

// EVENT DISPLAY PAGINATION
const EVENTS_PER_PAGE = 8;
let visibleEventCount = EVENTS_PER_PAGE;

const showMoreButton = document.getElementById("showMoreButton");
const eventSearch = document.getElementById("eventSearch");
const eventCategory = document.getElementById("eventCategory");
const eventCost = document.getElementById("eventCost");
const eventDate = document.getElementById("eventDate");
const eventSort = document.getElementById("eventSort");

// Tradeshow persona interests. Account integration can replace this array later.
const demoInterests = ["gaming", "pottery", "ballet", "museums", "reading"];
const interestKeywords = {
    gaming: ["gaming", "board game", "trivia", "video game"],
    pottery: ["pottery", "ceramic", "clay", "craft", "art"],
    ballet: ["ballet", "dance", "performance"],
    museums: ["museum", "exhibition", "gallery", "history"],
    reading: ["book", "reading", "library", "literature", "author"]
};
const categoryKeywords = {
    creative: ["art", "creative", "craft", "pottery", "ceramic", "painting", "music", "dance", "theatre", "exhibition"],
    fitness: ["fitness", "wellness", "yoga", "zumba", "walking", "exercise", "sport", "pilates", "meditation"],
    social: ["community", "social", "festival", "market", "meetup", "network", "concert", "celebration"],
    education: ["workshop", "class", "learning", "library", "book", "lecture", "training", "seminar"]
};

function getEventStart(event) {
    const date = new Date(event.start_datetime || "");
    return Number.isNaN(date.getTime()) ? null : date;
}

function getEventEnd(event) {
    const date = new Date(event.end_datetime || event.start_datetime || "");
    return Number.isNaN(date.getTime()) ? null : date;
}

function getEventText(event) {
    return [event.subject, event.title, event.description, event.event_type, event.venue]
        .filter(Boolean).join(" ").toLowerCase();
}

function getEventCategory(event) {
    const type = event.event_type;
    return Array.isArray(type) ? type.join(", ") : String(type || "Event");
}

function getRecommendationScore(event) {
    const title = String(event.subject || event.title || "").toLowerCase();
    const fullText = getEventText(event);
    return demoInterests.reduce(function (score, interest) {
        return score + (interestKeywords[interest] || [interest]).reduce(function (subtotal, keyword) {
            return subtotal + (title.includes(keyword) ? 10 : fullText.includes(keyword) ? 5 : 0);
        }, 0);
    }, 0);
}

function matchesCost(event, selection) {
    if (selection === "all") return true;
    const cost = String(event.cost || "").trim().toLowerCase();
    const free = /\bfree\b|\$\s*0(?:\.00)?\b|no cost/.test(cost);
    // Unknown prices must not be mislabelled as paid.
    const paid = !free && /\$\s*[1-9]|\bpaid\b|\bfee\b|\bticket\s*(?:price|cost)/.test(cost);
    return selection === "free" ? free : paid;
}

function matchesDate(event, selection) {
    const start = getEventStart(event);
    if (!start) return false;
    if (selection === "all") return true;
    const now = new Date();
    if (selection === "today") return start.toDateString() === now.toDateString();
    const days = selection === "week" ? 7 : 30;
    const end = new Date(now);
    end.setDate(end.getDate() + days);
    return start >= now && start <= end;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
}

function formatEventDate(value) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? "Date unavailable" :
        date.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

function applyEventFilters() {
    const search = eventSearch.value.trim().toLowerCase();
    const category = eventCategory.value;
    const cost = eventCost.value;
    const date = eventDate.value;
    const sort = eventSort.value;
    const now = new Date();

    filteredEvents = loadedEvents.filter(function (event) {
        const end = getEventEnd(event);
        if (!end || end < now) return false;
        if (!getEventText(event).includes(search)) return false;
        if (category !== "all" && !categoryKeywords[category].some(word => getEventText(event).includes(word))) return false;
        return matchesCost(event, cost) && matchesDate(event, date);
    });

    filteredEvents.sort(function (a, b) {
        if (sort === "alphabetical") {
            return String(a.subject || a.title || "").localeCompare(String(b.subject || b.title || ""));
        }
        if (sort === "recommended") {
            const scoreDiff = getRecommendationScore(b) - getRecommendationScore(a);
            if (scoreDiff !== 0) return scoreDiff;
        }
        return getEventStart(a) - getEventStart(b);
    });

    visibleEventCount = EVENTS_PER_PAGE;
    displayAPIEvents(filteredEvents);
}

[eventCategory, eventCost, eventDate, eventSort].forEach(function (control) {
    control.addEventListener("change", applyEventFilters);
});
eventSearch.addEventListener("input", applyEventFilters);


/* LOAD EVENTS FROM BCC API WITH PAGINATION */

async function loadEventsFromAPI() {

    let allFetchedEvents = [];

    try {
        for (let page = 0; page < MAX_API_PAGES; page++) {

            const offset = page * API_BATCH_SIZE;

            const url =
                `${EVENTS_API}?limit=${API_BATCH_SIZE}&offset=${offset}`;

            console.log(`Fetching events: offset ${offset}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    "API request failed: " + response.status
                );
            }

            const data = await response.json();
            const batch = data.results || [];

            allFetchedEvents.push(...batch);

            console.log(
                `Loaded ${allFetchedEvents.length} events`
            );

            // Stop when all available records have been fetched
            if (
                batch.length === 0 ||
                allFetchedEvents.length >= data.total_count
            ) {
                break;
            }
        }

        // Remove duplicate events using stable record identifiers
        const uniqueEvents = new Map();

        allFetchedEvents.forEach(function (event) {
            const id = getEventId(event);
            uniqueEvents.set(id, event);
        });

        loadedEvents = Array.from(uniqueEvents.values());

        console.log(
            "Total unique events loaded:",
            loadedEvents.length
        );

        // Reapply existing filters and recommendation sorting
        visibleEventCount = EVENTS_PER_PAGE;

        if (typeof applyEventFilters === "function") {
            applyEventFilters();
        } else {
            displayAPIEvents(loadedEvents);
        }

    } catch (error) {

        console.error("Error loading events:", error);

        // Keep already fetched events if a later request fails
        if (allFetchedEvents.length > 0) {
            loadedEvents = allFetchedEvents;

            visibleEventCount = EVENTS_PER_PAGE;

            if (typeof applyEventFilters === "function") {
                applyEventFilters();
            } else {
                displayAPIEvents(loadedEvents);
            }

        } else {
            listView.innerHTML = `
                <p class="event-load-error">
                    Events could not be loaded. Please try again.
                </p>
            `;
        }

    } finally {

        document.body.classList.add("loaded");

    }
}


function displayAPIEvents(events) {

    listView.innerHTML = "";

    const visibleEvents = events.slice(0, visibleEventCount);

    if (events.length === 0) {
        const message = document.createElement("p");
        message.className = "event-empty-message";
        message.textContent = "No matching upcoming events. Try changing your filters.";
        listView.appendChild(message);
    }

    visibleEvents.forEach(function (event, index) {

        const name =
            event.subject ||
            event.title ||
            "Brisbane Event";

        // KEEP THIS AS event.venue //
        const venue =
            event.venue ||
            "Venue unavailable";

        const startDate = formatEventDate(event.start_datetime);
        const endDate = event.end_datetime ? formatEventDate(event.end_datetime) : "";

        const cost =
            event.cost ||
            "See details";

        const category = getEventCategory(event);

        const description =
            event.description ||
            "More information available from Brisbane City Council.";


        const card =
            document.createElement("article");

        card.className = "event-card";

        card.innerHTML = `
            <div class="event-card-content">

                <span class="event-category">
                    ${escapeHTML(category)}
                </span>

                <h2>${escapeHTML(name)}</h2>

                <p class="event-date">
                    ${escapeHTML(startDate)}
                    ${endDate ? " – " + escapeHTML(endDate) : ""}
                </p>

                <p class="event-venue">
                    ${escapeHTML(venue)}
                </p>

                <p class="event-description">
                    ${escapeHTML(description)}
                </p>

                <div class="event-card-footer">

                    <span>${escapeHTML(cost)}</span>

                    <button
                        type="button"
                        class="view-event"
                        data-event-index="${index}"
                    >
                        View Event
                    </button>

                </div>

            </div>
        `;

        listView.appendChild(card);
    });

    // Add click events AFTER API cards exist //

    document
        .querySelectorAll(".view-event")
        .forEach(function (button) {

            button.addEventListener("click", function () {

                const index =
                    Number(button.dataset.eventIndex);

                const event =
                    events[index];

                selectedEvent = event;


                document.getElementById("detailCategory").textContent =
                    getEventCategory(event);

                document.getElementById("detailName").textContent =
                    event.subject || event.title || "Brisbane Event";

                document.getElementById("detailDate").textContent =
                    formatEventDate(event.start_datetime);

                // IMPORTANT: venue from Events API
                document.getElementById("detailLocation").textContent =
                    event.venue || "Venue unavailable";

                document.getElementById("detailCost").textContent =
                    event.cost || "See details";

                document.getElementById("detailDescription").textContent =
                    event.description || "No description available";


                eventDetails.hidden = false;

                updateBookingButtons();

            });

        });

    // SHOW MORE BUTTON VISIBILITY
    showMoreButton.hidden = listView.hidden || visibleEventCount >= events.length;
}


/* EVENT BOOKING HELPERS */

// Create a consistent ID for each BCC event
function getEventId(event) {
    if (event.recordid != null) {
        return String(event.recordid);
    }

    // Fallback for API records without an ID
    return JSON.stringify([
        event.subject || event.title,
        event.start_datetime,
        event.venue
    ]);
}

function updateBookingButtons() {
    if (!selectedEvent) return;

    const booked = isEventBooked(
        getEventId(selectedEvent)
    );

    bookEventButton.hidden = booked;
    attendanceStatus.hidden = !booked;
    cancelEventButton.hidden = !booked;
}


// SHOW MORE EVENTS
showMoreButton.addEventListener("click", function () {

    visibleEventCount += EVENTS_PER_PAGE;

    displayAPIEvents(filteredEvents);

});

// LIST VIEW //

listViewButton.addEventListener("click", function () {

    showMoreButton.hidden = visibleEventCount >= filteredEvents.length;

    listView.hidden = false;
    mapView.hidden = true;

    // Close event popup if open
    eventDetails.hidden = true;

});


// MAP VIEW //

mapViewButton.addEventListener("click", function () {

    showMoreButton.hidden = true;

    listView.hidden = true;
    mapView.hidden = false;
    eventDetails.hidden = true;

    // Resize Leaflet after the map becomes visible
    setTimeout(function () {
        eventMap.invalidateSize(true);
    }, 300);

});

// CLOSE EVENT DETAILS //

closeEventDetails.addEventListener("click", function () {

    eventDetails.hidden = true;

});


/* BOOK EVENT */

bookEventButton.addEventListener("click", function () {
    if (!selectedEvent) return;

    const confirmed = confirm(
        "Would you like to attend this event?"
    );

    if (!confirmed) return;

    bookEvent({
        id: getEventId(selectedEvent),
        title: selectedEvent.subject ||
            selectedEvent.title ||
            "Brisbane Event",
        startDate: selectedEvent.start_datetime,
        endDate: selectedEvent.end_datetime,
        venue: selectedEvent.venue ||
            "Venue unavailable"
    });

    updateBookingButtons();
});


/* CANCEL ATTENDANCE */

cancelEventButton.addEventListener("click", function () {
    if (!selectedEvent) return;

    const confirmed = confirm(
        "Cancel your attendance for this event?"
    );

    if (!confirmed) return;

    cancelEventBooking(
        getEventId(selectedEvent)
    );

    updateBookingButtons();
});


// LOAD EVENTS FROM API //
loadEventsFromAPI();