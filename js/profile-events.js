
import { auth, db } from "./firebase.js";

import {
    collection,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import {
    isSphereConnected
} from "./sphere-firebase.js";

export function watchProfileEvents(uid, callback) {
    const viewerUid = auth.currentUser?.uid;

    if (!viewerUid || !uid) {
        callback([]);
        return () => {};
    }

    if (uid !== viewerUid && !isSphereConnected(uid)) {
        callback([]);
        return () => {};
    }

    const eventsRef = collection(db, "connectionEvents", uid, "bookings");

    return onSnapshot(
        eventsRef,
        snapshot => {
            const now = Date.now();

            const events = snapshot.docs
                .map(item => item.data())
                .filter(event => {
                    const end = new Date(event.endDate).getTime();
                    return Number.isFinite(end) && end > now;
                })
                .sort((a, b) =>
                    new Date(a.startDate) - new Date(b.startDate)
                );

            callback(events);
        },
        error => {
            console.error("Unable to load profile events:", error);
            callback([]);
        }
    );
}
