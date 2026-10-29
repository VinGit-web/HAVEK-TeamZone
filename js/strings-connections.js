
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    collection,
    doc,
    query,
    where,
    onSnapshot,
    runTransaction,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const openButton = document.getElementById("openAddUser");
const closeButton = document.getElementById("closeAddUser");
const panel = document.getElementById("addUserPanel");
const searchInput = document.getElementById("connectionSearch");
const searchResults = document.getElementById("connectionSearchResults");
const incomingContainer = document.getElementById("incomingRequests");
const outgoingContainer = document.getElementById("outgoingRequests");
const connectedContainer = document.getElementById("connectedUsers");
const statusElement = document.getElementById("connectionStatus");
const requestCount = document.getElementById("requestCount");
const tabs = document.querySelectorAll("[data-connection-tab]");

const views = {
    find: document.getElementById("findPeopleView"),
    requests: document.getElementById("requestsView"),
    connected: document.getElementById("connectedView")
};

let currentUser = null;
let members = [];
let incoming = [];
let outgoing = [];
let activeTab = "find";
let listeners = [];
let busy = false;

function setStatus(message) {
    statusElement.textContent = message;
}

function makeElement(tag, className = "", content = "") {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = content;
    return element;
}

function getName(member) {
    const combined = [
        member.firstName || member.first_name || "",
        member.lastName || member.last_name || ""
    ].join(" ").trim();

    return (
        member.displayName ||
        member.name ||
        member.fullName ||
        member.full_name ||
        combined ||
        member.username ||
        "INTROSPHEER User"
    );
}

function getInitials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");
}

function getMember(uid) {
    return members.find(member => member.id === uid);
}

function getMemberName(uid, fallback = "") {
    const member = getMember(uid);
    return member ? getName(member) : fallback || "INTROSPHEER User";
}

function getMyName() {
    const profile = getMember(currentUser.uid);

    return profile
        ? getName(profile)
        : currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "INTROSPHEER User";
}

function getRequestId(firstUid, secondUid) {
    return [firstUid, secondUid].sort().join("_");
}

function getAllRequests() {
    const requests = new Map();

    [...incoming, ...outgoing].forEach(request => {
        requests.set(request.id, request);
    });

    return [...requests.values()];
}

function getRequestFor(uid) {
    if (!currentUser) return null;

    const id = getRequestId(currentUser.uid, uid);

    return getAllRequests().find(request => request.id === id) || null;
}

function makeCard(name, subtitle, actions = [], profileUid = null) {
    const card = makeElement("div", "connection-user-card");

    const info = makeElement("div", "connection-user-info");
    const avatar = makeElement(
        "div",
        "connection-avatar",
        getInitials(name)
    );

    const details = makeElement("div", "connection-user-details");
    const heading = makeElement("strong", "", name);
    const description = makeElement("small", "", subtitle);

    details.append(heading, description);
    info.append(avatar, details);

    if (profileUid) {
        const link = document.createElement("a");
        link.className = "connection-profile-link";
        link.href = `profile.html?uid=${encodeURIComponent(profileUid)}`;
        link.setAttribute("aria-label", `View ${name}'s shared profile`);
        link.append(info);
        card.append(link);
    } else {
        card.append(info);
    }

    const actionContainer = makeElement(
        "div",
        "connection-card-actions"
    );

    actions.forEach(action => {
        const button = makeElement(
            "button",
            action.secondary
                ? "connection-action secondary"
                : "connection-action",
            action.label
        );

        button.type = "button";
        button.disabled = busy || Boolean(action.disabled);

        if (action.onClick) {
            button.addEventListener("click", action.onClick);
        }

        actionContainer.appendChild(button);
    });

    card.append(actionContainer);

    return card;
}

function showEmpty(container, message) {
    container.replaceChildren(
        makeElement("p", "connection-empty", message)
    );
}

function setBusy(value) {
    busy = value;
    renderAll();
}

function switchTab(name) {
    activeTab = name;

    tabs.forEach(tab => {
        const selected = tab.dataset.connectionTab === name;
        tab.classList.toggle("active", selected);
        tab.setAttribute("aria-pressed", String(selected));
    });

    Object.entries(views).forEach(([key, view]) => {
        view.classList.toggle("hidden", key !== name);
    });
}

function renderSearch() {
    searchResults.replaceChildren();

    if (!currentUser) return;

    const term = searchInput.value.trim().toLowerCase();

    const results = members
        .filter(member => member.id !== currentUser.uid)
        .filter(member => getName(member).toLowerCase().includes(term))
        .sort((a, b) => getName(a).localeCompare(getName(b)))
        .slice(0, 30);

    if (!results.length) {
        showEmpty(searchResults, "No matching members found.");
        return;
    }

    results.forEach(member => {
        const request = getRequestFor(member.id);
        const name = getName(member);

        let subtitle = "INTROSPHEER member";
        let actions = [];

        if (!request || request.status === "declined") {
            actions = [{
                label: "Add +",
                onClick: () => sendRequest(member)
            }];
        } else if (request.status === "accepted") {
            subtitle = "Connected";
            actions = [{
                label: "Connected",
                disabled: true
            }];
        } else if (request.status === "pending") {
            if (request.fromUid === currentUser.uid) {
                subtitle = "Waiting for their response";
                actions = [{
                    label: "Request Sent",
                    disabled: true
                }];
            } else {
                subtitle = "Sent you a connection request";
                actions = [{
                    label: "Accept",
                    onClick: () => respondToRequest(request, "accepted")
                }, {
                    label: "Decline",
                    secondary: true,
                    onClick: () => respondToRequest(request, "declined")
                }];
            }
        }

        searchResults.appendChild(
            makeCard(name, subtitle, actions, member.id)
        );
    });
}

function renderRequests() {
    incomingContainer.replaceChildren();
    outgoingContainer.replaceChildren();

    const incomingPending = incoming.filter(
        request => request.status === "pending"
    );

    const outgoingPending = outgoing.filter(
        request => request.status === "pending"
    );

    requestCount.textContent = String(incomingPending.length);
    requestCount.hidden = incomingPending.length === 0;

    if (!incomingPending.length) {
        showEmpty(incomingContainer, "No incoming requests.");
    } else {
        incomingPending.forEach(request => {
            const name = getMemberName(
                request.fromUid,
                request.fromName
            );

            incomingContainer.appendChild(
                makeCard(name, "Wants to connect with you", [{
                    label: "Accept",
                    onClick: () => respondToRequest(request, "accepted")
                }, {
                    label: "Decline",
                    secondary: true,
                    onClick: () => respondToRequest(request, "declined")
                }], request.fromUid)
            );
        });
    }

    if (!outgoingPending.length) {
        showEmpty(outgoingContainer, "No pending sent requests.");
    } else {
        outgoingPending.forEach(request => {
            const name = getMemberName(
                request.toUid,
                request.toName
            );

            outgoingContainer.appendChild(
                makeCard(name, "Waiting for response", [{
                    label: "Pending",
                    disabled: true
                }], request.toUid)
            );
        });
    }
}

function renderConnected() {
    connectedContainer.replaceChildren();

    const accepted = getAllRequests().filter(
        request => request.status === "accepted"
    );

    if (!accepted.length) {
        showEmpty(
            connectedContainer,
            "Your accepted connections will appear here."
        );
        return;
    }

    accepted.forEach(request => {
        const isSender = request.fromUid === currentUser.uid;
        const otherUid = isSender ? request.toUid : request.fromUid;
        const fallback = isSender ? request.toName : request.fromName;

        connectedContainer.appendChild(
            makeCard(
                getMemberName(otherUid, fallback),
                "Connected on INTROSPHEER",
                [{
                    label: "Connected",
                    disabled: true
                }],
                otherUid
            )
        );
    });
}

function renderAll() {
    if (!currentUser) return;

    renderSearch();
    renderRequests();
    renderConnected();
}

async function sendRequest(member) {
    if (!currentUser || busy || member.id === currentUser.uid) return;

    setBusy(true);
    setStatus("");

    try {
        const requestId = getRequestId(currentUser.uid, member.id);
        const requestRef = doc(db, "connectionRequests", requestId);

        await runTransaction(db, async transaction => {
            const existing = await transaction.get(requestRef);

            if (existing.exists()) {
                const data = existing.data();

                if (data.status !== "declined") {
                    throw new Error("A request or connection already exists.");
                }

                if (data.fromUid !== currentUser.uid) {
                    throw new Error("You cannot resend this request.");
                }

                transaction.update(requestRef, {
                    status: "pending",
                    updatedAt: serverTimestamp()
                });

                return;
            }

            transaction.set(requestRef, {
                fromUid: currentUser.uid,
                toUid: member.id,
                fromName: getMyName(),
                toName: getName(member),
                status: "pending",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        });

        setStatus(`Connection request sent to ${getName(member)}.`);
    } catch (error) {
        console.error(error);
        setStatus(error.message || "Unable to send request.");
    } finally {
        setBusy(false);
    }
}

async function respondToRequest(request, decision) {
    if (!currentUser || busy) return;
    if (request.toUid !== currentUser.uid) return;
    if (request.status !== "pending") return;

    setBusy(true);
    setStatus("");

    try {
        const requestRef = doc(db, "connectionRequests", request.id);

        await updateDoc(requestRef, {
            status: decision,
            updatedAt: serverTimestamp()
        });

        setStatus(
            decision === "accepted"
                ? "Connection accepted."
                : "Connection declined."
        );
    } catch (error) {
        console.error(error);
        setStatus("Unable to update the request. Please try again.");
    } finally {
        setBusy(false);
    }
}

function stopListeners() {
    listeners.forEach(stop => stop());
    listeners = [];
}

function listenToConnections(user) {
    const membersQuery = collection(db, "publicProfiles");

    const incomingQuery = query(
        collection(db, "connectionRequests"),
        where("toUid", "==", user.uid)
    );

    const outgoingQuery = query(
        collection(db, "connectionRequests"),
        where("fromUid", "==", user.uid)
    );

    listeners.push(
        onSnapshot(membersQuery, snapshot => {
            members = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            renderAll();
        }, error => {
            console.error(error);
            setStatus("Unable to load members. Check Firestore permissions.");
        })
    );

    listeners.push(
        onSnapshot(incomingQuery, snapshot => {
            incoming = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            renderAll();
        }, error => {
            console.error(error);
            setStatus("Unable to load incoming requests.");
        })
    );

    listeners.push(
        onSnapshot(outgoingQuery, snapshot => {
            outgoing = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            renderAll();
        }, error => {
            console.error(error);
            setStatus("Unable to load sent requests.");
        })
    );
}

openButton.addEventListener("click", () => {
    panel.classList.remove("hidden");
    switchTab("find");
    searchInput.focus();
});

closeButton.addEventListener("click", () => {
    panel.classList.add("hidden");
});

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        switchTab(tab.dataset.connectionTab);
    });
});

searchInput.addEventListener("input", renderSearch);

onAuthStateChanged(auth, user => {
    stopListeners();

    currentUser = user;
    members = [];
    incoming = [];
    outgoing = [];

    if (!user) {
        panel.classList.add("hidden");
        setStatus("Please log in to manage connections.");
        return;
    }

    setStatus("");
    listenToConnections(user);
});

window.addEventListener("pagehide", stopListeners);
