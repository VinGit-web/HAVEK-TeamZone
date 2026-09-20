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

// PAGE ELEMENTS//
const listViewButton = document.getElementById("listViewButton");
const mapViewButton = document.getElementById("mapViewButton");

const listView = document.getElementById("listView");
const mapView = document.getElementById("mapView");

const eventDetails = document.getElementById("eventDetails");
const closeEventDetails = document.getElementById("closeEventDetails");

const bookEventButton = document.getElementById("bookEventButton");
const cancelEventButton = document.getElementById("cancelEventButton");
const attendanceStatus = document.getElementById("attendanceStatus");
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

        console.log("Brisbane Council API:", data);

        loadedEvents = data.results;

        displayAPIEvents(loadedEvents);

    } catch (error) {

        console.error("Error loading events:", error);

    }
}


function displayAPIEvents(events) {

    // Remove your current hard-coded cards
    listView.innerHTML = "";

    events.forEach(function (event, index) {

        const name =
            event.subject ||
            event.title ||
            event.event_name ||
            "Brisbane Event";

        const location =
            event.location ||
            event.venue ||
            event.address ||
            "Brisbane";

        const startDate =
            event.start_date ||
            event.start_datetime ||
            event.start ||
            "";

        const cost =
            event.cost ||
            event.price ||
            "See details";

        const category =
            event.category ||
            event.event_category ||
            event.type ||
            "Event";

        const description =
            event.description ||
            event.event_description ||
            event.details ||
            "More information available from Brisbane City Council.";


        const card = document.createElement("article");

        card.className = "event-card";

        card.innerHTML = `
            <div class="event-card-content">

                <span class="event-category">
                    ${category}
                </span>

                <h2>${name}</h2>

                <p class="event-date">
                    ${startDate}
                </p>

                <p>${location}</p>

                <p class="event-description">
                    ${description}
                </p>

                <div class="event-card-footer">

                    <span>${cost}</span>

                    <button
                        type="button"
                        class="view-event"
                        data-event="${index}">
                        View Event
                    </button>

                </div>

            </div>
        `;

        listView.appendChild(card);

    });

}

//START LOADING EVENTS//
loadEventsFromAPI();
listViewButton.addEventListener("click", function () {

    listView.hidden = false;
    mapView.hidden = true;

    eventDetails.hidden = true;

});
mapViewButton.addEventListener("click", function () {

    listView.hidden = true;
    mapView.hidden = false;

    eventDetails.hidden = true;

});
closeEventDetails.addEventListener("click", function () {

    eventDetails.hidden = true;

});


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