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
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN",
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


// PROTOTYPE EVENT MARKERS

const events = [
    {
        title: "Book Club",
        location: "Brisbane Square Library",
        date: "19 September 2026 · 2:00pm–5:00pm",
        lat: -27.4726,
        lng: 153.0227
    },

    {
        title: "Brisbane City Markets",
        location: "Queen Street Mall",
        date: "23 September 2026 · 8:00am–2:00pm",
        lat: -27.4690,
        lng: 153.0255
    },

    {
        title: "Social River Walk",
        location: "South Bank Parklands",
        date: "26 September 2026 · 9:00am–11:00am",
        lat: -27.4775,
        lng: 153.0220
    },

    {
        title: "Beginner Pottery Workshop",
        location: "West End Community Centre",
        date: "3 October 2026 · 1:00pm–3:00pm",
        lat: -27.4805,
        lng: 153.0120
    }
];


// ADD EVENTS TO MAP

events.forEach(function (event) {

    const marker = L.marker(
        [event.lat, event.lng],
        { icon: sphereMarker }
    ).addTo(eventMap);

    marker.bindPopup(
        "<strong>" + event.title + "</strong>" +
        "<br>" +
        event.date +
        "<br>" +
        event.location
    );

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

    // Close event popup if open
    eventDetails.hidden = true;

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