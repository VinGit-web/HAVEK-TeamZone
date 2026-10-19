
    import { auth, db } from "./firebase.js";

    import {
        collection,
        doc,
        setDoc,
        deleteDoc,
        onSnapshot,
        writeBatch
    } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

    import {
        onAuthStateChanged
    } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

    let bookings = [];
    let bookingsLoaded = false;
    let unsubscribeBookings = null;
    const listeners = new Set();

    function notifyListeners() {
        listeners.forEach(listener => listener(getUserBookings(), bookingsLoaded));
    }

    function bookingCollection() {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("You must be signed in to manage bookings.");
        }

        return collection(db, "users", user.uid, "eventBookings");
    }

    function bookingDocument(eventId) {
        return doc(bookingCollection(), encodeURIComponent(String(eventId)));
    }

    function validEventDate(value) {
        const date = new Date(value);
        return Number.isFinite(date.getTime());
    }

    onAuthStateChanged(auth, user => {
        if (unsubscribeBookings) {
            unsubscribeBookings();
            unsubscribeBookings = null;
        }

        bookings = [];
        bookingsLoaded = false;
        notifyListeners();

        if (!user) {
            bookingsLoaded = true;
            notifyListeners();
            return;
        }

        unsubscribeBookings = onSnapshot(
            bookingCollection(),
            snapshot => {
                bookings = snapshot.docs.map(item => item.data());
                bookingsLoaded = true;
                notifyListeners();
            },
            error => {
                console.error("Unable to load event bookings:", error);
                bookingsLoaded = false;
                notifyListeners();
            }
        );
    });

    export function subscribeToBookings(listener) {
        listeners.add(listener);
        listener(getUserBookings(), bookingsLoaded);

        return () => listeners.delete(listener);
    }

    export function getUserBookings() {
        return bookings.map(booking => ({ ...booking }));
    }

    export function isEventBooked(eventId) {
        return bookings.some(booking => booking.id === String(eventId));
    }

    export function areBookingsLoaded() {
        return bookingsLoaded;
    }


    function profileBookingDocument(eventId) {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("You must be signed in.");
        }

        return doc(
            db,
            "connectionEvents",
            user.uid,
            "bookings",
            encodeURIComponent(String(eventId))
        );
    }

    export async function bookEvent(event) {
        if (!auth.currentUser) {
            throw new Error("Please sign in before booking an event.");
        }

        const id = String(event.id ?? "");

        if (!id || !validEventDate(event.startDate)) {
            throw new Error("This event does not have a valid ID or start date.");
        }

        const booking = {
            id,
            title: String(event.title || "Brisbane Event"),
            startDate: event.startDate,
            endDate: validEventDate(event.endDate)
                ? event.endDate
                : event.startDate,
            venue: String(event.venue || "Venue unavailable"),
            status: "booked"
        };

        const batch = writeBatch(db);

        batch.set(bookingDocument(id), booking);
        batch.set(profileBookingDocument(id), booking);

        await batch.commit();
    }

    export async function cancelEventBooking(eventId) {
        const batch = writeBatch(db);

        batch.delete(bookingDocument(eventId));
        batch.delete(profileBookingDocument(eventId));

        await batch.commit();
    }
