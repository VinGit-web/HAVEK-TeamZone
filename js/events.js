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

// BRISBANE CITY COUNCIL EVENTS API//

const EVENTS_API =
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events/records?limit=4";

let loadedEvents = [];

async function loadEventsFromAPI() {

    try {

        const response = await fetch(EVENTS_API);

        if (!response.ok) {
            throw new Error("API request failed: " + response.status);
        }

        const data = await response.json();

        loadedEvents = data.results || [];

        console.log("Events:", loadedEvents);

        console.log(
            "Venues:",
            loadedEvents.map(function (event) {
                return event.venue;
            })
        );

        displayAPIEvents(loadedEvents);

    } catch (error) {

        console.error("Error loading events:", error);

        listView.innerHTML = `
            <p class="event-load-error">
                Events could not be loaded. Please try again.
            </p>
        `;

    } finally {

        setTimeout(function () {
            document.body.classList.add("loaded");
        }, 500);

    }

}

function displayAPIEvents(events) {

    listView.innerHTML = "";

    events.forEach(function (event, index) {

        const name =
            event.subject ||
            event.title ||
            "Brisbane Event";

        // KEEP THIS AS event.venue //
        const venue =
            event.venue ||
            "Venue unavailable";

        const startDate =
            event.start_date ||
            event.start ||
            "";

        const endDate =
            event.end_date ||
            event.end ||
            "";

        const cost =
            event.cost ||
            "See details";

        const category =
            event.category ||
            "Event";

        const description =
            event.description ||
            "More information available from Brisbane City Council.";


        const card =
            document.createElement("article");

        card.className = "event-card";

        card.innerHTML = `
            <div class="event-card-content">

                <span class="event-category">
                    ${category}
                </span>

                <h2>${name}</h2>

                <p class="event-date">
                    ${startDate}
                    ${endDate ? " – " + endDate : ""}
                </p>

                <p class="event-venue">
                    ${venue}
                </p>

                <p class="event-description">
                    ${description}
                </p>

                <div class="event-card-footer">

                    <span>${cost}</span>

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
                    loadedEvents[index];


                document.getElementById("detailCategory").textContent =
                    event.category || "Event";

                document.getElementById("detailName").textContent =
                    event.subject || event.title || "Brisbane Event";

                document.getElementById("detailDate").textContent =
                    event.start_date || event.start || "Date unavailable";

                // IMPORTANT: venue from Events API
                document.getElementById("detailLocation").textContent =
                    event.venue || "Venue unavailable";

                document.getElementById("detailCost").textContent =
                    event.cost || "See details";

                document.getElementById("detailDescription").textContent =
                    event.description || "No description available";


                eventDetails.hidden = false;

            });

        });
}

// LIST VIEW //

listViewButton.addEventListener("click", function () {

    listView.hidden = false;
    mapView.hidden = true;

    // Close event popup if open
    eventDetails.hidden = true;

});


// MAP VIEW //

mapViewButton.addEventListener("click", function () {

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


// BOOK EVENT //

bookEventButton.addEventListener("click", function () {

    bookEventButton.hidden = true;

    attendanceStatus.hidden = false;
    cancelEventButton.hidden = false;

});


// CANCEL ATTENDANCE //

cancelEventButton.addEventListener("click", function () {

    bookEventButton.hidden = false;

    attendanceStatus.hidden = true;
    cancelEventButton.hidden = true;

});

// LOAD EVENTS FROM API //
loadEventsFromAPI();