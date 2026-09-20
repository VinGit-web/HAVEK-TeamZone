/* EVENTS PAGE JS */


// GET PAGE ELEMENTS

const listViewButton = document.getElementById("listViewButton");
const mapViewButton = document.getElementById("mapViewButton");

const listView = document.getElementById("listView");
const mapView = document.getElementById("mapView");

const eventDetails = document.getElementById("eventDetails");
const closeEventDetails = document.getElementById("closeEventDetails");

const viewEventButtons = document.querySelectorAll(".view-event");

const bookEventButton = document.getElementById("bookEventButton");
const cancelEventButton = document.getElementById("cancelEventButton");
const attendanceStatus = document.getElementById("attendanceStatus");

// MAP SETUP

const eventMap = L.map("eventMap").setView([-27.4698, 153.0251], 13);

// MAPBOX TILES

L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=" + MAPBOX_TOKEN,
    {
        attribution: "Map data © OpenStreetMap contributors, Imagery © Mapbox",
        maxZoom: 18,
        id: "mapbox/streets-v11",
        tileSize: 512,
        zoomOffset: -1
    }
).addTo(eventMap);

// CUSTOM EVENT MARKER

const sphereMarker = L.icon({
    iconUrl: "images/sphere_marker.jpg",
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -45]
});

// BCC EVENT LOCATIONS API

const locationsURL =
    "https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/brisbane-city-council-events-locations/records?limit=100";

fetch(locationsURL)
    .then(function (response) {

        if (!response.ok) {
            throw new Error("BCC locations API request failed");
        }

        return response.json();

    })
    .then(function (data) {

        console.log("BCC EVENT LOCATIONS:");
        console.log(data);

        // ADD BCC LOCATIONS TO MAP
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

// LIST VIEW

listViewButton.addEventListener("click", function () {

    listView.hidden = false;
    mapView.hidden = true;

    // Close event popup if open
    eventDetails.hidden = true;

});


// MAP VIEW

mapViewButton.addEventListener("click", function () {

    listView.hidden = true;
    mapView.hidden = false;
    eventDetails.hidden = true;

    // Resize Leaflet after the map becomes visible
    setTimeout(function () {
        eventMap.invalidateSize(true);
    }, 300);

});

// OPEN EVENT DETAILS

viewEventButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        eventDetails.hidden = false;

    });

});


// CLOSE EVENT DETAILS

closeEventDetails.addEventListener("click", function () {

    eventDetails.hidden = true;

});


// BOOK EVENT

bookEventButton.addEventListener("click", function () {

    bookEventButton.hidden = true;

    attendanceStatus.hidden = false;
    cancelEventButton.hidden = false;

});


// CANCEL ATTENDANCE

cancelEventButton.addEventListener("click", function () {

    bookEventButton.hidden = false;

    attendanceStatus.hidden = true;
    cancelEventButton.hidden = true;

});