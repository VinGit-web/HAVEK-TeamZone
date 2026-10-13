
import { auth, db } from "./firebase.js";
import { svgAvatar } from "./avatar-renderer.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  getBlob
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js";

const $ = id => document.getElementById(id);
const storage = getStorage();

const viewedUid = new URLSearchParams(location.search).get("uid");

let me = null;
let friendship = null;
let photoEnabled = false;
let photoUrl = null;
let unsubscribeFriendship = null;

function friendshipId(a, b) {
  return [a, b].sort().join("_");
}

function message(text) {
  $("profileMessage").textContent = text;
}

function restrictedPhoto(text) {
  if (photoUrl) URL.revokeObjectURL(photoUrl);

  photoUrl = null;

  const box = document.createElement("div");
  box.className = "restricted-photo";

  const label = document.createElement("span");
  label.textContent = "Photo restricted";

  box.append(label);
  $("viewedPhoto").replaceChildren(box);

  $("photoAccessMessage").textContent = text;
}

async function showPhoto() {
  if (!me || !viewedUid) return;

  if (!photoEnabled) {
    restrictedPhoto(
      "This user has not enabled personal-photo sharing."
    );
    return;
  }

  if (!friendship || friendship.status !== "accepted") {
    restrictedPhoto(
      "Connect as friends to view this photograph."
    );
    return;
  }

  try {
    const blob = await getBlob(
      ref(storage, `profilePhotos/${viewedUid}/original`)
    );

    if (
      !photoEnabled ||
      !friendship ||
      friendship.status !== "accepted"
    ) return;

    if (photoUrl) URL.revokeObjectURL(photoUrl);

    photoUrl = URL.createObjectURL(blob);

    const image = document.createElement("img");
    image.src = photoUrl;
    image.alt = "Friend's personal photograph";

    $("viewedPhoto").replaceChildren(image);

    $("photoAccessMessage").textContent =
      "Visible because you are connected friends.";
  } catch (error) {
    restrictedPhoto(
      error.code === "storage/object-not-found"
        ? "This user has not uploaded a photograph."
        : "The photograph is unavailable."
    );
  }
}

async function sendRequest() {
  if (!me || !viewedUid || me.uid === viewedUid) return;

  $("friendAction").disabled = true;

  try {
    await setDoc(
      doc(db, "friendships", friendshipId(me.uid, viewedUid)),
      {
        members: [me.uid, viewedUid].sort(),
        requesterId: me.uid,
        recipientId: viewedUid,
        status: "pending"
      }
    );

    message("Friend request sent.");
  } catch (error) {
    message(error.message);
    renderFriendship();
  }
}

async function acceptRequest() {
  if (
    !me ||
    !friendship ||
    friendship.recipientId !== me.uid
  ) return;

  $("friendAction").disabled = true;

  try {
    await updateDoc(
      doc(db, "friendships", friendshipId(me.uid, viewedUid)),
      { status: "accepted" }
    );

    message("Friend request accepted.");
  } catch (error) {
    message(error.message);
    renderFriendship();
  }
}

function renderFriendship() {
  const button = $("friendAction");

  button.hidden = false;
  button.disabled = false;

  if (!friendship) {
    $("friendStatus").textContent = "You are not connected.";
    button.textContent = "Add friend";
    button.onclick = sendRequest;
  } else if (friendship.status === "accepted") {
    $("friendStatus").textContent = "You are connected friends.";
    button.textContent = "Friends";
    button.disabled = true;
  } else if (friendship.requesterId === me.uid) {
    $("friendStatus").textContent = "Your friend request is pending.";
    button.textContent = "Request sent";
    button.disabled = true;
  } else if (friendship.recipientId === me.uid) {
    $("friendStatus").textContent =
      "This user has sent you a friend request.";

    button.textContent = "Accept friend request";
    button.onclick = acceptRequest;
  }

  showPhoto();
}

async function loadProfile() {
  const snap = await getDoc(
    doc(db, "publicProfiles", viewedUid)
  );

  if (!snap.exists()) {
    $("viewedUsername").textContent = "Profile unavailable";
    $("viewedVerification").textContent = "Age not verified";
    $("friendAction").disabled = true;
    return false;
  }

  const profile = snap.data();

  $("viewedUsername").textContent =
    profile.username || "INTROSPHEER user";

  if (profile.avatar) {
    $("viewedAvatar").innerHTML = svgAvatar(profile.avatar);
  }

  onSnapshot(
    doc(db, "verificationPublic", viewedUid),
    verificationSnap => {
      const state = verificationSnap.exists()
        ? verificationSnap.data().status
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

onAuthStateChanged(auth, async user => {
  me = user;

  if (!user) {
    location.replace("login.html");
    return;
  }

  if (!viewedUid) {
    $("viewedUsername").textContent = "No profile selected";
    return;
  }

  if (viewedUid === user.uid) {
    location.replace("account.html");
    return;
  }

  try {
    const exists = await loadProfile();

    if (!exists) return;

    unsubscribeFriendship = onSnapshot(
      doc(db, "friendships", friendshipId(user.uid, viewedUid)),
      snap => {
        friendship = snap.exists() ? snap.data() : null;
        renderFriendship();
      },
      error => message(error.message)
    );

    onSnapshot(
      doc(db, "photoSettings", viewedUid),
      snap => {
        photoEnabled =
          snap.exists() &&
          snap.data().friendsCanSeePhoto === true;

        showPhoto();
      },
      error => message(error.message)
    );
  } catch (error) {
    message(error.message);
  }
});

window.addEventListener("pagehide", () => {
  if (unsubscribeFriendship) unsubscribeFriendship();
  if (photoUrl) URL.revokeObjectURL(photoUrl);
});
