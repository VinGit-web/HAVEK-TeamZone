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