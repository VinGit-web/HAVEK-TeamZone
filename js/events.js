/* EVENTS PAGE JS */

import {
    bookEvent,
    cancelEventBooking,
    isEventBooked,
    subscribeToBookings,
    areBookingsLoaded
} from "./storage.js";
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
const closeEventDetailsButton = document.getElementById("closeEventDetails");
const eventDetailsBackdrop = document.getElementById("eventDetailsBackdrop");
const eventResultsStatus = document.getElementById("eventResultsStatus");
const mapResultsStatus = document.getElementById("mapResultsStatus");

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
// Venue lookup is only used when an event does not include coordinates.
// Map markers themselves now represent matching Events API records.
const LOCATIONS_API =
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events-locations/records?limit=100";

const venueCoordinates = new Map();
const eventMarkers = L.layerGroup().addTo(eventMap);
let activeView = "list";
let returnFocusTo = null;
let partialLoadWarning = false;

function normalizedVenue(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function validCoords(latitude, longitude) {
    if (latitude == null || longitude == null || latitude === "" || longitude === "") return null;
    const lat = Number(latitude);
    const lon = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0) &&
        Math.abs(lat) <= 90 && Math.abs(lon) <= 180
        ? [lat, lon] : null;
}

function getCoordinates(location) {
    if (!location) return null;
    if (Array.isArray(location)) return validCoords(location[0], location[1]);
    if (typeof location !== "object") return null;
    if (location.type === "Point" && Array.isArray(location.coordinates)) {
        return validCoords(location.coordinates[1], location.coordinates[0]);
    }
    return validCoords(location.lat ?? location.latitude, location.lon ?? location.lng ?? location.longitude)
        || getCoordinates(location.geometry)
        || getCoordinates(location.geolocation);
}

function eventCoords(event) {
    const direct = getCoordinates(event.geolocation) || getCoordinates(event.location) ||
        getCoordinates({ latitude: event.latitude, longitude: event.longitude });
    if (direct) return direct;
    const venue = normalizedVenue(event.venue);
    if (!venue) return null;
    if (venueCoordinates.has(venue)) return venueCoordinates.get(venue);
    // BCC event venues can contain an address suffix; compare named venue prefixes.
    for (const [name, coords] of venueCoordinates) {
        if (name.length >= 6 && (venue.startsWith(name + " ") || name.startsWith(venue + " "))) {
            return coords;
        }
    }
    return null;
}

async function loadEventLocations() {
    try {
        const response = await fetch(LOCATIONS_API);
        if (!response.ok) throw new Error(`Venue lookup request failed (${response.status})`);
        const data = await response.json();
        for (const venue of data.results || []) {
            const name = normalizedVenue(venue.venue_name || venue.name);
            const coords = getCoordinates(venue.geolocation) || getCoordinates(venue.location) ||
                validCoords(venue.latitude, venue.longitude);
            if (name && coords) venueCoordinates.set(name, coords);
        }
        if (activeView === "map") renderEventMarkers();
    } catch (error) {
        // Events with their own coordinates can still be shown.
        console.warn("Unable to look up some venue coordinates:", error);
    }
}

function eventPopup(event) {
    const container = element("div", "event-map-popup");
    container.append(
        element("h3", "", event.subject || event.title || "Brisbane Event"),
        element("p", "", formatEventDate(event.start_datetime)),
        element("p", "", event.venue || "Venue unavailable")
    );
    const actions = element("div", "event-popup-actions");

    const details = element("button", "", "View details");
    details.type = "button";
    details.addEventListener("click", () => openEventDetails(event));

    actions.append(details);
    container.append(actions);
    return container;
}

function renderEventMarkers() {
    eventMarkers.clearLayers();
    const bounds = [];
    for (const event of filteredEvents) {
        const coords = eventCoords(event);
        if (!coords) continue;
        L.marker(coords, { icon: sphereMarker })
            .bindPopup(eventPopup(event))
            .addTo(eventMarkers);
        bounds.push(coords);
    }
    const located = bounds.length;
    mapResultsStatus.textContent = located
        ? `Showing ${located} of ${filteredEvents.length} matching events with a mapped location. Select a marker to view or book an event.`
        : "No matching events have a mapped location. Try another filter or use List View.";
    // Default map view centred on Brisbane
    eventMap.setView([-27.4698, 153.0251], 12);
}


// BRISBANE CITY COUNCIL EVENTS API
const EVENTS_API =
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records";

// API PAGINATION
const API_BATCH_SIZE = 100;
const MAX_API_PAGES = 5;
let loadedEvents = [];
let filteredEvents = [];

// EVENT DISPLAY PAGINATION
const EVENTS_PER_PAGE = 9;
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
    if (selection === "all") return true;
    const start = getEventStart(event);
    const end = getEventEnd(event);
    if (!start || !end) return false;
    const now = new Date();
    if (selection === "today") {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // An ongoing multi-day event should be included if it overlaps today.
        return start < tomorrow && end >= todayStart;
    }
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + (selection === "week" ? 7 : 30));
    return start <= windowEnd && end >= now;
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

function formatEventDateRange(event) {
    const start = formatEventDate(event.start_datetime);
    const end = getEventEnd(event);
    const begin = getEventStart(event);
    if (!end || !begin || end.getTime() === begin.getTime()) return start;
    // Avoid huge duplicated date strings for short same-day events.
    if (end.toDateString() === begin.toDateString()) {
        return `${start} – ${end.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
    }
    return `${start} – ${formatEventDate(event.end_datetime)}`;
}

function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = String(content);
    return node;
}

/* BCC eventimage may be a URL or an image object depending on the record. */
function getEventImageUrl(event) {
    const rawSource = event.eventimage ?? event.event_image ?? null;
    const source = Array.isArray(rawSource) ? rawSource[0] : rawSource;
    const candidate = typeof source === "string" ? source :
        (source && typeof source === "object" ?
            (source.url || source.thumbnail || source.href || source.src) : null);
    if (typeof candidate !== "string") return null;
    try {
        const url = new URL(candidate);
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch (_) {
        return null;
    }
}

function makeEventMedia(event) {
    const media = element("div", "event-card-image");
    const imageUrl = getEventImageUrl(event);
    const fallback = element("span", "event-image-placeholder", "Image not provided for this event");
    if (!imageUrl) {
        media.append(fallback);
        return media;
    }
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = ""; // Title follows immediately in the card.
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.replaceWith(fallback), { once: true });
    media.append(image);
    return media;
}

function createEventCard(event) {
    // A button makes the entire card keyboard-accessible without nested buttons.
    const card = element("button", "event-card event-card-button");
    card.type = "button";
    card.setAttribute("aria-label", `View ${event.subject || event.title || "event"} details`);
    card.append(makeEventMedia(event));
    const content = element("div", "event-card-content");
    content.append(
        element("h2", "", event.subject || event.title || "Brisbane Event"),
        element("p", "event-date", formatEventDateRange(event)),
        element("p", "event-venue", event.venue || "Venue unavailable")
    );
    card.append(content);
    card.addEventListener("click", () => openEventDetails(event));
    return card;
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
    eventResultsStatus.textContent =
        `${filteredEvents.length} matching event${filteredEvents.length === 1 ? "" : "s"}` +
        (partialLoadWarning ? " (some API results could not be loaded)" : "");

    displayAPIEvents(filteredEvents);

    // Keep map markers synchronised with the active filters.
    if (activeView === "map") renderEventMarkers();
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

        await openDeepLinkedEvent();

    } catch (error) {

        console.error("Error loading events:", error);

        // Keep already fetched events if a later request fails
        if (allFetchedEvents.length > 0) {
            partialLoadWarning = true;
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
            eventResultsStatus.textContent = "Events unavailable";
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

    // Each whole card is a button so it can be used with mouse or keyboard.
    visibleEvents.forEach(function (event) {
        const card = createEventCard(event);
        listView.appendChild(card);
    });

    // SHOW MORE BUTTON VISIBILITY
    showMoreButton.hidden = listView.hidden || visibleEventCount >= events.length;
}


/* EVENT DETAILS DIALOG */
// List cards and map markers open the same details and booking controls.
function openEventDetails(event, { focusBooking = false } = {}) {
    returnFocusTo = document.activeElement;
    selectedEvent = event;
    document.getElementById("detailCategory").textContent = getEventCategory(event);
    document.getElementById("detailName").textContent = event.subject || event.title || "Brisbane Event";
    document.getElementById("detailDate").textContent = formatEventDateRange(event);
    document.getElementById("detailLocation").textContent = event.venue || "Venue unavailable";
    document.getElementById("detailCost").textContent = event.cost || "Cost information unavailable";
    document.getElementById("detailDescription").textContent = event.description || "No description provided by Brisbane City Council.";

    const image = document.getElementById("detailImage");
    const placeholder = document.getElementById("detailImageFallback");
    const imageUrl = getEventImageUrl(event);
    document.getElementById("detailImageContainer").hidden = false;
    image.hidden = !imageUrl;
    placeholder.hidden = Boolean(imageUrl);
    image.removeAttribute("src");
    if (imageUrl) image.src = imageUrl;
    image.onerror = () => { image.hidden = true; placeholder.hidden = false; };
    updateBookingButtons();
    eventDetailsBackdrop.hidden = false;
    eventDetails.hidden = false;
    document.body.classList.add("event-dialog-open");
    (focusBooking && !bookEventButton.hidden ? bookEventButton : closeEventDetailsButton).focus();
}

function closeEventDetails() {
    if (eventDetails.hidden) return;
    eventDetails.hidden = true;
    eventDetailsBackdrop.hidden = true;
    document.body.classList.remove("event-dialog-open");
    if (returnFocusTo && document.contains(returnFocusTo)) returnFocusTo.focus();
    returnFocusTo = null;
}

closeEventDetailsButton.addEventListener("click", closeEventDetails);
eventDetailsBackdrop.addEventListener("click", closeEventDetails);
document.addEventListener("keydown", event => {
    if (eventDetails.hidden) return;
    if (event.key === "Escape") {
        event.preventDefault();
        closeEventDetails();
        return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...eventDetails.querySelectorAll("button:not([disabled]):not([hidden]), a[href]:not([hidden])")]
        .filter(node => node.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
    }
});


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

    const loaded = areBookingsLoaded();
    const booked = isEventBooked(getEventId(selectedEvent));

    bookEventButton.hidden = booked;
    attendanceStatus.hidden = !booked;
    cancelEventButton.hidden = !booked;

    bookEventButton.disabled = !loaded;
    cancelEventButton.disabled = !loaded;
}



// SHOW MORE EVENTS
showMoreButton.addEventListener("click", function () {

    visibleEventCount += EVENTS_PER_PAGE;

    displayAPIEvents(filteredEvents);

});

// LIST VIEW //
listViewButton.addEventListener("click", function () {
    setActiveView("list");
});


// MAP VIEW //
mapViewButton.addEventListener("click", function () {
    setActiveView("map");
});


// CLOSE EVENT DETAILS //
// Handled by closeEventDetails() in the dialog section above.


/* BOOK EVENT */


bookEventButton.addEventListener("click", async function () {
    if (!selectedEvent || !areBookingsLoaded()) return;

    const confirmed = confirm("Would you like to attend this event?");
    if (!confirmed) return;

    bookEventButton.disabled = true;

    try {
        await bookEvent({
            id: getEventId(selectedEvent),
            title: selectedEvent.subject || selectedEvent.title || "Brisbane Event",
            startDate: selectedEvent.start_datetime,
            endDate: selectedEvent.end_datetime,
            venue: selectedEvent.venue || "Venue unavailable"
        });

        updateBookingButtons();
    } catch (error) {
        console.error("Booking failed:", error);
        alert("Unable to book this event. Please try again.");
    } finally {
        updateBookingButtons();
    }
});


/* CANCEL ATTENDANCE */


cancelEventButton.addEventListener("click", async function () {
    if (!selectedEvent || !areBookingsLoaded()) return;

    const confirmed = confirm("Cancel your attendance for this event?");
    if (!confirmed) return;

    cancelEventButton.disabled = true;

    try {
        await cancelEventBooking(getEventId(selectedEvent));
        updateBookingButtons();
    } catch (error) {
        console.error("Cancellation failed:", error);
        alert("Unable to cancel this booking. Please try again.");
    } finally {
        updateBookingButtons();
    }
});



function setActiveView(view) {
    activeView = view;
    listView.hidden = view !== "list";
    mapView.hidden = view !== "map";
    listViewButton.classList.toggle("active", view === "list");
    mapViewButton.classList.toggle("active", view === "map");
    listViewButton.setAttribute("aria-pressed", String(view === "list"));
    mapViewButton.setAttribute("aria-pressed", String(view === "map"));
    closeEventDetails();
    showMoreButton.hidden = view !== "list" || visibleEventCount >= filteredEvents.length;
    if (view === "map") {
        requestAnimationFrame(() => { eventMap.invalidateSize(true); renderEventMarkers(); });
    }
}

async function openDeepLinkedEvent() {
    const id = new URLSearchParams(window.location.search).get("event");
    if (!id || id.length > 400) return;
    let event = loadedEvents.find(item => getEventId(item) === id);
    // Future Strings links must also work for events beyond the first 500 records.
    if (!event && !id.startsWith("[")) {
        try {
            const response = await fetch(`${EVENTS_API}/${encodeURIComponent(id)}`);
            if (response.ok) event = await response.json();
        } catch (error) {
            console.warn("Couldn't resolve event link:", error);
        }
    }
    if (event) {
        openEventDetails(event);
    } else {
        eventResultsStatus.textContent = "That linked event could not be found in the current dataset.";
    }
}


// LOAD EVENTS FROM API //
loadEventLocations();
loadEventsFromAPI();


subscribeToBookings(() => {
    updateBookingButtons();
});

