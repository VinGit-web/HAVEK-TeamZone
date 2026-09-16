console.log("main.js loaded")
// EVENTS JS

// View event details functionality
const viewEventButton = document.querySelector(".view-event");
const eventDetails = document.querySelector(".event-details");

viewEventButton.addEventListener("click", function () {
    eventDetails.hidden = false;
});