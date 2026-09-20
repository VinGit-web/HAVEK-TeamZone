/* EVENTS PAGE JS */

const listViewButton = document.getElementById("listViewButton");
const mapViewButton = document.getElementById("mapViewButton");

const listView = document.getElementById("listView");
const mapView = document.getElementById("mapView");

const eventDetails = document.getElementById("eventDetails");
const closeEventDetails = document.getElementById("closeEventDetails");

const viewEventButtons = document.querySelectorAll(".view-event");


// LIST VIEW

listViewButton.addEventListener("click", function () {
    listView.hidden = false;
    mapView.hidden = true;
    eventDetails.hidden = true;
});


// MAP VIEW

mapViewButton.addEventListener("click", function () {
    listView.hidden = true;
    mapView.hidden = false;
    eventDetails.hidden = true;
});


// OPEN EVENT DETAILS

viewEventButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        listView.hidden = true;
        mapView.hidden = true;
        eventDetails.hidden = false;

    });

});


// CLOSE EVENT DETAILS

closeEventDetails.addEventListener("click", function () {

    eventDetails.hidden = true;
    listView.hidden = false;

});

// =============================
// BOOK EVENT
// =============================

const bookEventButton = document.getElementById("bookEventButton");
const cancelEventButton = document.getElementById("cancelEventButton");
const attendanceStatus = document.getElementById("attendanceStatus");


bookEventButton.addEventListener("click", function () {

    bookEventButton.hidden = true;

    attendanceStatus.hidden = false;
    cancelEventButton.hidden = false;

});


cancelEventButton.addEventListener("click", function () {

    bookEventButton.hidden = false;

    attendanceStatus.hidden = true;
    cancelEventButton.hidden = true;

});