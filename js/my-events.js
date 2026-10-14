/* INTROSPHEER MY EVENTS */

const myEventsList = document.getElementById("myEventsList");
const upcomingButton = document.getElementById("upcomingEventsButton");
const pastButton = document.getElementById("pastEventsButton");

// Calendar elements
const upcomingCalendar = document.getElementById("upcomingCalendar");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarSummary = document.getElementById("calendarSummary");
const calendarNextBookingButton = document.getElementById("calendarNextBookingButton");
const calendarDays = document.getElementById("calendarDays");
const selectedDateHeading = document.getElementById("selectedDateHeading");
const selectedDayEvents = document.getElementById("selectedDayEvents");
const calendarPreviousButton = document.getElementById("calendarPreviousButton");
const calendarNextButton = document.getElementById("calendarNextButton");
const calendarTodayButton = document.getElementById("calendarTodayButton");

let currentView = "upcoming";
let displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

/* DATE HELPERS */

// Use local calendar dates rather than toISOString(), which may shift dates in Brisbane.
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getEventStart(event) {
    return new Date(event.startDate);
}

function getEventEnd(event) {
    const start = getEventStart(event);
    const end = new Date(event.endDate || event.startDate);

    // Treat invalid or out-of-order end dates as a single-day event.
    return Number.isNaN(end.getTime()) || end < start ? start : end;
}

function getUpcomingBookings() {
    const now = new Date();

    return getUserBookings().filter(function (event) {
        const start = getEventStart(event);
        return !Number.isNaN(start.getTime()) && getEventEnd(event) >= now;
    }).sort(function (a, b) {
        return getEventStart(a) - getEventStart(b);
    });
}

function getPastBookings() {
    const now = new Date();

    return getUserBookings().filter(function (event) {
        const start = getEventStart(event);
        return !Number.isNaN(start.getTime()) && getEventEnd(event) < now;
    }).sort(function (a, b) {
        return getEventStart(b) - getEventStart(a);
    });
}

// Include an event on each calendar day that overlaps its start/end interval.
// This also handles exhibitions and workshops spanning multiple days.
function getBookingsForDay(bookings, date) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    return bookings.filter(function (event) {
        return getEventStart(event) < nextDay && getEventEnd(event) >= dayStart;
    });
}

function formatEventDate(event) {
    const start = getEventStart(event);
    const end = getEventEnd(event);
    const dateFormat = { day: "numeric", month: "short", year: "numeric" };
    const timeFormat = { hour: "numeric", minute: "2-digit" };

    const startDate = start.toLocaleDateString("en-AU", dateFormat);
    const startTime = start.toLocaleTimeString("en-AU", timeFormat);
    const endTime = end.toLocaleTimeString("en-AU", timeFormat);

    if (getDateKey(start) === getDateKey(end)) {
        return `${startDate}, ${startTime} – ${endTime}`;
    }

    return `${startDate}, ${startTime} – ${end.toLocaleDateString("en-AU", dateFormat)}, ${endTime}`;
}

/* UPCOMING EVENTS CALENDAR */

function renderCalendar() {
    const bookings = getUpcomingBookings();
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const today = new Date();

    calendarMonthLabel.textContent = displayedMonth.toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric"
    });

    // The upcoming calendar starts at the current month. Past events have their own tab.
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    calendarPreviousButton.disabled = displayedMonth <= currentMonth;

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7; // Monday-first calendar
    const nextMonth = new Date(year, month + 1, 1);

    const monthBookings = bookings.filter(function (event) {
        return getEventStart(event) < nextMonth && getEventEnd(event) >= firstDay;
    });

    calendarSummary.textContent = `${monthBookings.length} upcoming ${monthBookings.length === 1 ? "booking" : "bookings"} this month`;

    // If this month is empty, offer a shortcut to the next booked event.
    calendarNextBookingButton.hidden = monthBookings.length > 0 || bookings.length === 0;
    calendarDays.replaceChildren();

    // Blank cells align the first day with the correct weekday.
    for (let i = 0; i < offset; i++) {
        const blank = document.createElement("span");
        blank.className = "my-calendar-blank";
        blank.setAttribute("aria-hidden", "true");
        calendarDays.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayBookings = getBookingsForDay(bookings, date);
        const button = document.createElement("button");
        const number = document.createElement("span");

        button.type = "button";
        button.className = "my-calendar-day";
        button.dataset.date = getDateKey(date);
        button.setAttribute("aria-pressed", String(getDateKey(date) === getDateKey(selectedDate)));
        button.setAttribute("aria-label", `${date.toLocaleDateString("en-AU", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        })}: ${dayBookings.length} ${dayBookings.length === 1 ? "event" : "events"}`);

        if (getDateKey(date) === getDateKey(today)) {
            button.classList.add("is-today");
        }

        if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
            button.classList.add("is-past-day");
        }

        number.className = "my-calendar-day-number";
        number.textContent = day;
        button.appendChild(number);

        if (dayBookings.length > 0) {
            button.classList.add("has-events");

            const indicator = document.createElement("span");
            indicator.className = "my-calendar-event-count";
            indicator.textContent = `${dayBookings.length} ${dayBookings.length === 1 ? "event" : "events"}`;
            indicator.setAttribute("aria-hidden", "true");
            button.appendChild(indicator);
        }

        button.addEventListener("click", function () {
            selectedDate = date;

            // Update the selection without rebuilding buttons and losing keyboard focus.
            calendarDays.querySelectorAll(".my-calendar-day").forEach(function (dayButton) {
                dayButton.setAttribute("aria-pressed", String(dayButton.dataset.date === getDateKey(date)));
            });

            renderSelectedDay();
        });

        calendarDays.appendChild(button);
    }

    // Complete the last week to keep the calendar visually balanced.
    const remainder = (offset + daysInMonth) % 7;
    if (remainder > 0) {
        for (let i = remainder; i < 7; i++) {
            const blank = document.createElement("span");
            blank.className = "my-calendar-blank";
            blank.setAttribute("aria-hidden", "true");
            calendarDays.appendChild(blank);
        }
    }
}

function renderSelectedDay() {
    const bookings = getBookingsForDay(getUpcomingBookings(), selectedDate);

    selectedDateHeading.textContent = selectedDate.toLocaleDateString("en-AU", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    selectedDayEvents.replaceChildren();

    if (bookings.length === 0) {
        const message = document.createElement("p");
        message.className = "my-events-empty";
        message.textContent = "No upcoming events booked for this date. Select another day or discover new events.";
        selectedDayEvents.appendChild(message);
        return;
    }

    bookings.forEach(function (event) {
        const card = document.createElement("article");
        card.className = "my-booking-card";

        const heading = document.createElement("h3");
        heading.textContent = event.title || "Brisbane Event";

        const date = document.createElement("p");
        date.className = "my-booking-date";
        date.textContent = formatEventDate(event);

        const venue = document.createElement("p");
        venue.textContent = event.venue || "Venue unavailable";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "my-cancel-event";
        cancelButton.textContent = "Cancel Attendance";

        cancelButton.addEventListener("click", function () {
            if (!confirm("Cancel attendance for this event?")) {
                return;
            }

            cancelEventBooking(event.id);
            displayMyEvents();
        });

        card.append(heading, date, venue, cancelButton);
        selectedDayEvents.appendChild(card);
    });
}

/* PAST EVENTS LIST */

function renderPastEvents() {
    const bookings = getPastBookings();
    myEventsList.replaceChildren();

    if (bookings.length === 0) {
        const message = document.createElement("p");
        message.className = "my-events-empty";
        message.textContent = "You have no past events.";
        myEventsList.appendChild(message);
        return;
    }

    const heading = document.createElement("h2");
    heading.className = "my-past-heading";
    heading.textContent = "Previously attended events";
    myEventsList.appendChild(heading);

    bookings.forEach(function (event) {
        const card = document.createElement("article");
        card.className = "my-past-event";

        const content = document.createElement("div");
        content.className = "my-past-event-details";

        const title = document.createElement("h3");
        title.textContent = event.title || "Brisbane Event";

        const venue = document.createElement("p");
        venue.textContent = event.venue || "Venue unavailable";

        const date = document.createElement("time");
        date.dateTime = getEventStart(event).toISOString();
        date.textContent = getEventStart(event).toLocaleDateString("en-AU", {
            day: "numeric", month: "short", year: "numeric"
        });

        content.append(title, venue);
        card.append(date, content);
        myEventsList.appendChild(card);
    });
}

/* DISPLAY CURRENT VIEW */

function displayMyEvents() {
    const showCalendar = currentView === "upcoming";

    upcomingCalendar.hidden = !showCalendar;
    myEventsList.hidden = showCalendar;

    upcomingButton.setAttribute("aria-pressed", String(showCalendar));
    pastButton.setAttribute("aria-pressed", String(!showCalendar));

    if (showCalendar) {
        renderCalendar();
        renderSelectedDay();
    } else {
        renderPastEvents();
    }
}

upcomingButton.addEventListener("click", function () {
    currentView = "upcoming";
    displayMyEvents();
});

pastButton.addEventListener("click", function () {
    currentView = "past";
    displayMyEvents();
});

calendarPreviousButton.addEventListener("click", function () {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);

    if (previousMonth < currentMonth) return;

    displayedMonth = previousMonth;
    selectedDate = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);
    displayMyEvents();
});

calendarNextButton.addEventListener("click", function () {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
    selectedDate = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);
    displayMyEvents();
});

calendarNextBookingButton.addEventListener("click", function () {
    const nextBooking = getUpcomingBookings()[0];
    if (!nextBooking) return;

    const now = new Date();
    const start = getEventStart(nextBooking);
    const target = start < now ? now : start;

    displayedMonth = new Date(target.getFullYear(), target.getMonth(), 1);
    selectedDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    displayMyEvents();
});

calendarTodayButton.addEventListener("click", function () {
    const today = new Date();
    displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    displayMyEvents();
});

// Keep the calendar up to date when returning from the Discover Events page.
window.addEventListener("pageshow", displayMyEvents);

displayMyEvents();
