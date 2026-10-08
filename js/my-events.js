
/* INTROSPHEER MY EVENTS */

const myEventsList = document.getElementById("myEventsList");
const upcomingButton = document.getElementById("upcomingEventsButton");
const pastButton = document.getElementById("pastEventsButton");

let currentView = "upcoming";

function displayMyEvents() {
    const now = new Date();
    const bookings = getUserBookings();

    const filteredBookings = bookings.filter(function (event) {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate || event.startDate);

        if (Number.isNaN(start.getTime())) return false;

        if (currentView === "upcoming") {
            return end >= now;
        }

        return end < now;
    });

    // Sort upcoming earliest first, past newest first
    filteredBookings.sort(function (a, b) {
        const difference =
            new Date(a.startDate) - new Date(b.startDate);

        return currentView === "upcoming"
            ? difference
            : -difference;
    });

    myEventsList.innerHTML = "";

    if (filteredBookings.length === 0) {
        const message = document.createElement("p");

        message.textContent = currentView === "upcoming"
            ? "You have no upcoming events booked."
            : "You have no past events.";

        myEventsList.appendChild(message);
        return;
    }

    filteredBookings.forEach(function (event) {
        const card = document.createElement("article");
        card.className = "event-card";

        const content = document.createElement("div");
        content.className = "event-card-content";

        const heading = document.createElement("h2");
        heading.textContent = event.title;

        const date = document.createElement("p");
        date.className = "event-date";
        date.textContent = new Date(event.startDate)
            .toLocaleString("en-AU", {
                dateStyle: "medium",
                timeStyle: "short"
            });

        const venue = document.createElement("p");
        venue.className = "event-venue";
        venue.textContent = event.venue;

        const status = document.createElement("p");
        status.textContent = currentView === "upcoming"
            ? "✓ You're attending"
            : "Previously booked";

        content.append(heading, date, venue, status);

        if (currentView === "upcoming") {
            const cancelButton = document.createElement("button");

            cancelButton.type = "button";
            cancelButton.textContent = "Cancel Attendance";
            cancelButton.className = "cancel-event";

            cancelButton.addEventListener("click", function () {
                if (!confirm("Cancel attendance for this event?")) {
                    return;
                }

                cancelEventBooking(event.id);
                displayMyEvents();
            });

            content.appendChild(cancelButton);
        }

        card.appendChild(content);
        myEventsList.appendChild(card);
    });
}

upcomingButton.addEventListener("click", function () {
    currentView = "upcoming";
    displayMyEvents();
});

pastButton.addEventListener("click", function () {
    currentView = "past";
    displayMyEvents();
});

displayMyEvents();
