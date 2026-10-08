
/* INTROSPHEER EVENT STORAGE */

const BOOKING_KEY = "introspheer_bookings";

// Example bookings for the tradeshow
const exampleBookings = [
    {
        id: "demo-pottery",
        title: "Pottery Workshop",
        startDate: "2026-11-20T10:00:00",
        endDate: "2026-11-20T12:00:00",
        venue: "Indooroopilly",
        status: "booked"
    },
    {
        id: "demo-museum",
        title: "Museum Visit",
        startDate: "2026-09-12T14:00:00",
        endDate: "2026-09-12T16:00:00",
        venue: "Brisbane City",
        status: "booked"
    }
];

// Only add example data on the first visit
function initialiseBookings() {
    if (localStorage.getItem(BOOKING_KEY) === null) {
        localStorage.setItem(
            BOOKING_KEY,
            JSON.stringify(exampleBookings)
        );
    }
}

function getUserBookings() {
    return JSON.parse(
        localStorage.getItem(BOOKING_KEY) || "[]"
    );
}

function saveUserBookings(bookings) {
    localStorage.setItem(
        BOOKING_KEY,
        JSON.stringify(bookings)
    );
}

function isEventBooked(eventId) {
    return getUserBookings().some(
        booking => booking.id === eventId
    );
}

function bookEvent(event) {
    const bookings = getUserBookings();

    if (isEventBooked(event.id)) {
        return;
    }

    bookings.push({
        ...event,
        status: "booked"
    });

    saveUserBookings(bookings);
}

function cancelEventBooking(eventId) {
    const bookings = getUserBookings().filter(
        booking => booking.id !== eventId
    );

    saveUserBookings(bookings);
}

// Run when the file loads
initialiseBookings();
