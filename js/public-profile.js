
import { auth, db } from "./firebase.js";
import { supabase } from "./supabase.js";
import { svgAvatar } from "./avatar-renderer.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

const viewedUid = new URLSearchParams(
  window.location.search
).get("uid");

const FUNCTION_URL =
  `${supabase.supabaseUrl}/functions/v1/friend-photo`;

let me = null;
let friendship = null;
let photoEnabled = false;
let photoUrl = null;

let unsubscribeFriendship = null;
let unsubscribePhotoSettings = null;
let unsubscribeVerification = null;

let photoRequestVersion = 0;
let photoController = null;

function friendshipId(a, b) {
  return [a, b].sort().join("_");
}

function message(text) {
  const element = $("profileMessage");

  if (element) element.textContent = text;
}

function cancelPhotoRequest() {
  photoRequestVersion++;

  if (photoController) {
    photoController.abort();
    photoController = null;
  }
}

function clearPhotoUrl() {
  if (photoUrl) {
    URL.revokeObjectURL(photoUrl);
    photoUrl = null;
  }
}

function restrictedPhoto(text) {
  cancelPhotoRequest();
  clearPhotoUrl();

  const box = document.createElement("div");
  box.className = "restricted-photo";

  const label = document.createElement("span");
  label.textContent = "Photo restricted";

  box.append(label);

  $("viewedPhoto")?.replaceChildren(box);

  const accessMessage = $("photoAccessMessage");

  if (accessMessage) {
    accessMessage.textContent = text;
  }
}

async function showPhoto() {
  cancelPhotoRequest();

  if (!me || !viewedUid) {
    restrictedPhoto("Sign in to view photographs.");
    return;
  }

  if (!photoEnabled) {
    restrictedPhoto(
      "This user has not enabled personal-photo sharing."
    );
    return;
  }

  if (
    !friendship ||
    friendship.status !== "accepted" ||
    ![friendship.fromUid, friendship.toUid].includes(me.uid) ||
    ![friendship.fromUid, friendship.toUid].includes(viewedUid)
  ) {
    restrictedPhoto(
      "Connect as friends to view this photograph."
    );
    return;
  }

  const version = photoRequestVersion;
  const controller = new AbortController();

  photoController = controller;

  const accessMessage = $("photoAccessMessage");

  if (accessMessage) {
    accessMessage.textContent = "Loading private photograph...";
  }

  try {
    const token = await me.getIdToken();

    if (version !== photoRequestVersion) return;

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        apikey: supabase.supabaseKey
      },
      body: JSON.stringify({
        ownerUid: viewedUid
      }),
      signal: controller.signal,
      cache: "no-store"
    });

    if (version !== photoRequestVersion) return;

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Your session has expired. Sign in again.");
      }

      if (response.status === 403) {
        throw new Error(
          "You do not currently have permission to view this photograph."
        );
      }

      if (response.status === 404) {
        throw new Error("This user has not uploaded a photograph.");
      }

      throw new Error(
        `The photograph is unavailable (${response.status}).`
      );
    }

    const contentType =
      response.headers.get("Content-Type") || "";

    if (!contentType.startsWith("image/")) {
      throw new Error("The server returned an invalid photograph.");
    }

    const blob = await response.blob();

    if (
      version !== photoRequestVersion ||
      !photoEnabled ||
      friendship?.status !== "accepted"
    ) {
      return;
    }

    const newUrl = URL.createObjectURL(blob);

    clearPhotoUrl();
    photoUrl = newUrl;

    const image = document.createElement("img");

    image.src = newUrl;
    image.alt = "Friend's personal photograph";

    $("viewedPhoto")?.replaceChildren(image);

    if (accessMessage) {
      accessMessage.textContent =
        "Visible because you are connected friends.";
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    if (version !== photoRequestVersion) return;

    console.error("Friend photograph:", error);

    restrictedPhoto(
      error.message || "The photograph is unavailable."
    );
  } finally {
    if (version === photoRequestVersion) {
      photoController = null;
    }
  }
}

async function sendRequest() {
  if (!me || !viewedUid || me.uid === viewedUid) return;
  $("friendAction").disabled = true;
  try {
    const requestRef = doc(db, "connectionRequests", friendshipId(me.uid, viewedUid));
    await runTransaction(db, async transaction => {
      const existing = await transaction.get(requestRef);
      if (existing.exists()) {
        const data = existing.data();
        if (data.status !== "declined" || data.fromUid !== me.uid) {
          throw new Error("A connection request already exists.");
        }
        transaction.update(requestRef, {status: "pending", updatedAt: serverTimestamp()});
      } else {
        transaction.set(requestRef, {
          fromUid: me.uid, toUid: viewedUid,
          fromName: me.displayName || "INTROSPHEER User",
          toName: $("viewedUsername").textContent,
          status: "pending", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      }
    });
    message("Connection request sent.");
  } catch (error) {
    message(error.message || "Unable to send request.");
    renderFriendship();
  }
}

async function acceptRequest() {
  if (!me || !friendship || friendship.status !== "pending" || friendship.toUid !== me.uid) return;
  $("friendAction").disabled = true;
  try {
    const ref = doc(db, "connectionRequests", friendshipId(me.uid, viewedUid));
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists() || snapshot.data().status !== "pending" || snapshot.data().toUid !== me.uid) {
        throw new Error("Request is no longer available.");
      }
      transaction.update(ref, {status: "accepted", updatedAt: serverTimestamp()});
    });
    message("Connection accepted.");
  } catch (error) {
    message(error.message || "Unable to accept request.");
    renderFriendship();
  }
}

function renderFriendship() {
  if (!me) return;

  const button = $("friendAction");

  if (!button) return;

  button.hidden = false;
  button.disabled = false;
  button.onclick = null;

  if (!friendship) {
    $("friendStatus").textContent = "You are not connected.";

    button.textContent = "Add friend";
    button.onclick = sendRequest;
  } else if (friendship.status === "accepted") {
    $("friendStatus").textContent =
      "You are connected friends.";

    button.textContent = "Friends";
    button.disabled = true;
  } else if (friendship.fromUid === me.uid) {
    $("friendStatus").textContent =
      "Your friend request is pending.";

    button.textContent = "Request sent";
    button.disabled = true;
  } else if (friendship.toUid === me.uid) {
    $("friendStatus").textContent =
      "This user has sent you a friend request.";

    button.textContent = "Accept friend request";
    button.onclick = acceptRequest;
  } else {
    $("friendStatus").textContent =
      "Friendship status unavailable.";

    button.hidden = true;
  }

  showPhoto();
}

async function loadProfile() {
  const snapshot = await getDoc(
    doc(db, "publicProfiles", viewedUid)
  );

  if (!snapshot.exists()) {
    $("viewedUsername").textContent = "Profile unavailable";
    $("viewedVerification").textContent = "Age not verified";
    $("friendAction").disabled = true;

    return false;
  }

  const profile = snapshot.data();

  $("viewedUsername").textContent =
    profile.username || "INTROSPHEER user";

  if (profile.avatar) {
    $("viewedAvatar").innerHTML = svgAvatar(profile.avatar);
  }

  // Only show fields explicitly stored in the publicProfiles collection.
  // Never read private account documents or expose email, DOB or phone.
  const sharedFields = [
    ["Name", profile.displayName || profile.name],
    ["About", profile.bio || profile.about],
    ["Interests", Array.isArray(profile.interests)
      ? profile.interests.join(", ") : profile.interests]
  ];
  const details = $("sharedProfileDetails");
  details.replaceChildren();
  for (const [label, value] of sharedFields) {
    if (typeof value !== "string" || !value.trim()) continue;
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    details.append(dt, dd);
  }
  $("sharedProfileSection").hidden = !details.childElementCount;

  unsubscribeVerification = onSnapshot(
    doc(db, "verificationPublic", viewedUid),
    verificationSnapshot => {
      const state = verificationSnapshot.exists()
        ? verificationSnapshot.data().status
        : "unverified";

      const labels = {
        verified: "Age verified",
        pending: "Verification pending",
        unverified: "Age not verified",
        expired: "Verification required"
      };

      $("viewedVerification").textContent =
        labels[state] || labels.unverified;
    },
    error => message(error.message)
  );

  return true;
}

function cleanup() {
  cancelPhotoRequest();
  clearPhotoUrl();

  if (unsubscribeFriendship) {
    unsubscribeFriendship();
    unsubscribeFriendship = null;
  }

  if (unsubscribePhotoSettings) {
    unsubscribePhotoSettings();
    unsubscribePhotoSettings = null;
  }

  if (unsubscribeVerification) {
    unsubscribeVerification();
    unsubscribeVerification = null;
  }
}

onAuthStateChanged(auth, async user => {
  cleanup();

  me = user;
  friendship = null;
  photoEnabled = false;

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  if (!viewedUid) {
    $("viewedUsername").textContent = "No profile selected";
    return;
  }

  if (viewedUid === user.uid) {
    window.location.replace("account.html");
    return;
  }

  restrictedPhoto(
    "Connect as friends to view this photograph."
  );

  try {
    const exists = await loadProfile();

    if (!exists || auth.currentUser?.uid !== user.uid) return;

    unsubscribeFriendship = onSnapshot(
      doc(db, "connectionRequests", friendshipId(user.uid, viewedUid)),
      snapshot => {
        friendship = snapshot.exists()
          ? snapshot.data()
          : null;

        renderFriendship();
      },
      error => {
        friendship = null;
        restrictedPhoto("Friendship access unavailable.");
        message(error.message);
      }
    );

    unsubscribePhotoSettings = onSnapshot(
      doc(db, "photoSettings", viewedUid),
      snapshot => {
        photoEnabled =
          snapshot.exists() &&
          snapshot.data().friendsCanSeePhoto === true;

        showPhoto();
      },
      error => {
        photoEnabled = false;
        restrictedPhoto("Photo visibility unavailable.");
        message(error.message);
      }
    );
  } catch (error) {
    console.error(error);
    message(error.message);
  }
});

window.addEventListener("pagehide", cleanup);
