
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const requestCollection = collection(db, "connectionRequests");
const publicCollection = collection(db, "publicProfiles");

let activeUser = null;
let privateProfile = null;
let privatePersona = null;
let publicMembers = new Map();
let incoming = new Map();
let outgoing = new Map();

let unsubscribe = [];
let authGeneration = 0;

const subscribers = new Set();

function notify() {
  const state = getSphereState();

  for (const callback of subscribers) {
    try {
      callback(state);
    } catch (error) {
      console.error("Sphere subscriber failed:", error);
    }
  }
}

function clearListeners() {
  unsubscribe.forEach(stop => stop());
  unsubscribe = [];
}

function requestId(a, b) {
  return [a, b].sort().join("_");
}

function nameOf(profile, fallback = "INTROSPHEER User") {
  return profile?.username ||
    profile?.displayName ||
    fallback;
}

function allRequests() {
  const result = new Map();

  for (const request of incoming.values()) {
    result.set(request.id, request);
  }

  for (const request of outgoing.values()) {
    result.set(request.id, request);
  }

  return [...result.values()];
}

function otherUid(request) {
  if (!activeUser) return null;

  return request.fromUid === activeUser.uid
    ? request.toUid
    : request.fromUid;
}

function getRequestFor(uid) {
  if (!activeUser) return null;

  return allRequests().find(request =>
    request.id === requestId(activeUser.uid, uid)
  ) || null;
}

function getSphereState() {
  const uid = activeUser?.uid || null;

  const me = uid ? {
    id: uid,
    uid,
    name: nameOf(
      privateProfile,
      activeUser?.displayName ||
      activeUser?.email?.split("@")[0] ||
      "You"
    ),
    avatar: privateProfile?.avatar || null,
    age: privateProfile?.birthYear
      ? new Date().getFullYear() - privateProfile.birthYear
      : null,
    gender: privateProfile?.gender || null,
    mbti: privatePersona?.mbti || null,
    interests: privatePersona?.interests || [],
    suburb: privatePersona?.suburb || null,
    about: privatePersona?.persona || null,
    centre: true
  } : null;

  const connections = allRequests()
    .filter(request => request.status === "accepted")
    .map(request => {
      const id = otherUid(request);
      const profile = publicMembers.get(id);

      if (!id || !profile) return null;

      return {
        id,
        uid: id,
        name: nameOf(profile),
        avatar: profile.avatar || null,
        connected: true,

        // Other users' private information is not readable
        // under the existing Firestore rules.
        age: null,
        gender: null,
        mbti: null,
        interests: [],
        suburb: null,
        about: null
      };
    })
    .filter(Boolean);

  return {
    uid,
    me,
    connections,
    requests: allRequests(),
    publicMembers: [...publicMembers.values()]
  };
}

export function subscribeToSphere(callback) {
  subscribers.add(callback);
  callback(getSphereState());

  return () => subscribers.delete(callback);
}

export function getSphereRequest(uid) {
  return getRequestFor(uid);
}

export function isSphereConnected(uid) {
  return getRequestFor(uid)?.status === "accepted";
}

export async function sendSphereRequest(targetUid) {
  if (!activeUser) {
    throw new Error("You must be signed in.");
  }

  if (!targetUid || targetUid === activeUser.uid) {
    throw new Error("Choose another user.");
  }

  const target = publicMembers.get(targetUid);

  if (!target) {
    throw new Error("This user does not have a public profile.");
  }

  const myUid = activeUser.uid;
  const ref = doc(db, "connectionRequests", requestId(myUid, targetUid));

  await runTransaction(db, async transaction => {
    const existing = await transaction.get(ref);

    if (existing.exists()) {
      const data = existing.data();

      if (data.status !== "declined") {
        throw new Error("A connection request already exists.");
      }

      if (data.fromUid !== myUid) {
        throw new Error(
          "You cannot resend a request initiated by the other user."
        );
      }

      transaction.update(ref, {
        status: "pending",
        updatedAt: serverTimestamp()
      });

      return;
    }

    transaction.set(ref, {
      fromUid: myUid,
      toUid: targetUid,
      fromName: nameOf(privateProfile, activeUser.displayName),
      toName: nameOf(target),
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
}

export async function respondToSphereRequest(targetUid, decision) {
  if (!activeUser) {
    throw new Error("You must be signed in.");
  }

  if (!["accepted", "declined"].includes(decision)) {
    throw new Error("Invalid response.");
  }

  const ref = doc(
    db,
    "connectionRequests",
    requestId(activeUser.uid, targetUid)
  );

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error("Request not found.");
    }

    const request = snapshot.data();

    if (
      request.toUid !== activeUser.uid ||
      request.status !== "pending"
    ) {
      throw new Error("This request cannot be updated.");
    }

    transaction.update(ref, {
      status: decision,
      updatedAt: serverTimestamp()
    });
  });
}

async function loadMyProfile(user, generation) {
  try {
    const [profile, persona] = await Promise.all([
      getDoc(doc(db, "users", user.uid)),
      getDoc(doc(db, "userPersonas", user.uid))
    ]);

    if (generation !== authGeneration) return;

    privateProfile = profile.exists() ? profile.data() : null;
    privatePersona = persona.exists() ? persona.data() : null;

    notify();
  } catch (error) {
    console.error("Unable to load Sphere account:", error);
  }
}

function startListening(user) {
  const generation = ++authGeneration;

  clearListeners();

  activeUser = user;
  privateProfile = null;
  privatePersona = null;
  publicMembers.clear();
  incoming.clear();
  outgoing.clear();

  notify();

  if (!user) return;

  loadMyProfile(user, generation);

  unsubscribe.push(
    onSnapshot(publicCollection, snapshot => {
      if (generation !== authGeneration) return;

      publicMembers = new Map(
        snapshot.docs.map(item => [
          item.id,
          { ...item.data(), id: item.id, uid: item.id }
        ])
      );

      notify();
    }, error => {
      console.error("Public profile listener:", error);
    })
  );

  unsubscribe.push(
    onSnapshot(
      query(requestCollection, where("toUid", "==", user.uid)),
      snapshot => {
        if (generation !== authGeneration) return;

        incoming = new Map(
          snapshot.docs.map(item => [
            item.id,
            { ...item.data(), id: item.id }
          ])
        );

        notify();
      },
      error => console.error("Incoming Sphere requests:", error)
    )
  );

  unsubscribe.push(
    onSnapshot(
      query(requestCollection, where("fromUid", "==", user.uid)),
      snapshot => {
        if (generation !== authGeneration) return;

        outgoing = new Map(
          snapshot.docs.map(item => [
            item.id,
            { ...item.data(), id: item.id }
          ])
        );

        notify();
      },
      error => console.error("Outgoing Sphere requests:", error)
    )
  );
}

onAuthStateChanged(auth, startListening);
