
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getBlob,
  deleteObject
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js";

const $ = id => document.getElementById(id);
const storage = getStorage();

let user = null;
let previewUrl = null;

function message(text, error = false) {
  $("photoStatus").textContent = text;
  $("photoStatus").style.color = error ? "#a52b22" : "#236c45";
}

function photoRef() {
  return ref(storage, `profilePhotos/${user.uid}/original`);
}

function clearPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);

  previewUrl = null;

  const label = document.createElement("span");
  label.textContent = "Photo not uploaded";

  $("myPhotoPreview").replaceChildren(label);
}

function displayPhoto(blob) {
  clearPreview();

  previewUrl = URL.createObjectURL(blob);

  const image = document.createElement("img");
  image.src = previewUrl;
  image.alt = "Your profile photograph";

  $("myPhotoPreview").replaceChildren(image);
}

async function loadPhoto() {
  if (!user) return;

  try {
    const blob = await getBlob(photoRef());
    displayPhoto(blob);
  } catch (error) {
    clearPreview();

    if (error.code !== "storage/object-not-found") {
      console.error(error);
    }
  }
}

$("profilePhoto").addEventListener("change", () => {
  const file = $("profilePhoto").files[0];

  if (!file) return;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    $("profilePhoto").value = "";
    message("Choose a JPG, PNG or WebP image.", true);
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    $("profilePhoto").value = "";
    message("Maximum file size is 5 MB.", true);
    return;
  }

  displayPhoto(file);
  message("Preview ready. Click Upload photo to save.");
});

$("uploadPhoto").addEventListener("click", async () => {
  if (!user) return;

  const file = $("profilePhoto").files[0];

  if (!file) {
    message("Choose a photograph first.", true);
    return;
  }

  $("uploadPhoto").disabled = true;

  try {
    await uploadBytes(photoRef(), file, {
      contentType: file.type,
      cacheControl: "private,no-store"
    });

    $("profilePhoto").value = "";

    await loadPhoto();

    message("Photograph uploaded.");
  } catch (error) {
    message(error.message, true);
  } finally {
    $("uploadPhoto").disabled = false;
  }
});

$("removePhoto").addEventListener("click", async () => {
  if (!user) return;

  try {
    await deleteObject(photoRef());
    clearPreview();
    $("profilePhoto").value = "";

    message("Photograph removed.");
  } catch (error) {
    if (error.code === "storage/object-not-found") {
      clearPreview();
      message("No photograph is stored.");
      return;
    }

    message(error.message, true);
  }
});

$("friendsCanSeePhoto").addEventListener("change", async () => {
  if (!user) return;

  const enabled = $("friendsCanSeePhoto").checked;

  try {
    await setDoc(
      doc(db, "photoSettings", user.uid),
      {
        ownerId: user.uid,
        friendsCanSeePhoto: enabled
      }
    );

    message("Photo visibility updated.");
  } catch (error) {
    $("friendsCanSeePhoto").checked = !enabled;
    message(error.message, true);
  }
});

const labels = {
  verified: [
    "Age verified",
    "Age eligibility has been independently confirmed."
  ],
  pending: [
    "Verification pending",
    "The independent verification result is pending."
  ],
  expired: [
    "Verification required",
    "A new eligibility check is required."
  ],
  unverified: [
    "Age not verified",
    "This account has not completed independent age verification."
  ]
};

onAuthStateChanged(auth, async currentUser => {
  user = currentUser;

  if (!user) return;

  await loadPhoto();

  try {
    const snap = await getDoc(
      doc(db, "photoSettings", user.uid)
    );

    $("friendsCanSeePhoto").checked =
      snap.exists() &&
      snap.data().friendsCanSeePhoto === true;
  } catch (error) {
    message(error.message, true);
  }

  onSnapshot(
    doc(db, "verificationPublic", user.uid),
    snap => {
      const state = snap.exists()
        ? snap.data().status
        : "unverified";

      const [heading, description] =
        labels[state] || labels.unverified;

      $("verificationStatus").textContent = heading;
      $("verificationDescription").textContent = description;
    },
    error => console.error(error)
  );
});
