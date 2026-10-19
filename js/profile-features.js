
import { auth, db } from "./firebase.js";
import { supabase } from "./supabase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const BUCKET = "profile-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const preview = document.getElementById("myPhotoPreview");
const fileInput = document.getElementById("profilePhoto");
const uploadButton = document.getElementById("uploadPhoto");
const removeButton = document.getElementById("removePhoto");
const visibilityInput = document.getElementById("friendsCanSeePhoto");
const photoStatus = document.getElementById("photoStatus");

let currentUser = null;
let currentPhotoPath = null;
let busy = false;

function setStatus(message) {
  if (photoStatus) photoStatus.textContent = message;
}

function setBusy(value) {
  busy = value;

  if (uploadButton) uploadButton.disabled = value;
  if (removeButton) removeButton.disabled = value;
  if (fileInput) fileInput.disabled = value;
  if (visibilityInput) visibilityInput.disabled = value;
}

function clearPreview() {
  if (!preview) return;

  if (preview.tagName === "IMG") {
    preview.removeAttribute("src");
    preview.alt = "No personal photo uploaded";
  } else {
    preview.replaceChildren();
    preview.textContent = "No personal photo uploaded";
  }
}

function displayPhoto(url) {
  if (!preview) return;

  if (preview.tagName === "IMG") {
    preview.src = url;
    preview.alt = "Your personal profile photograph";
  } else {
    const image = document.createElement("img");

    image.src = url;
    image.alt = "Your personal profile photograph";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";

    preview.replaceChildren(image);
  }
}

function possiblePaths(uid) {
  return [
    `${uid}/original.jpg`,
    `${uid}/original.png`,
    `${uid}/original.webp`
  ];
}


async function checkSupabaseAuthentication(user) {
  if (!user) {
    throw new Error("Please sign in first.");
  }

  const tokenResult = await user.getIdTokenResult(true);

  if (tokenResult.claims.role !== "authenticated") {
    console.error(
      "Supabase authentication role is not configured for this Firebase account."
    );

    throw new Error(
      "Photo authentication is not configured. Please contact the website administrator."
    );
  }

  return true;
}


async function findExistingPhoto(uid) {
  for (const path of possiblePaths(uid)) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 120);

    if (!error && data?.signedUrl) {
      return {
        path,
        url: data.signedUrl
      };
    }

    if (error && !/not found|does not exist|404/i.test(error.message)) {
      throw error;
    }
  }

  return null;
}

async function loadPhoto() {
  if (!currentUser) return;

  clearPreview();

  const existing = await findExistingPhoto(currentUser.uid);

  currentPhotoPath = existing?.path || null;

  if (existing) {
    displayPhoto(existing.url);
    setStatus("Your private personal photo is available.");
  } else {
    setStatus("No personal photo uploaded.");
  }

  if (removeButton) {
    removeButton.disabled = !existing;
  }
}

async function loadVisibility() {
  if (!currentUser || !visibilityInput) return;

  const snapshot = await getDoc(
    doc(db, "photoSettings", currentUser.uid)
  );

  visibilityInput.checked =
    snapshot.exists() &&
    snapshot.data().friendsCanSeePhoto === true;
}

async function loadVerification() {
  if (!currentUser) return;

  const snapshot = await getDoc(
    doc(db, "verificationPublic", currentUser.uid)
  );

  const status = snapshot.exists()
    ? snapshot.data().status
    : "unverified";

  const labels = {
    verified: "Age verified",
    pending: "Verification pending",
    expired: "Verification expired",
    unverified: "Age not verified"
  };

  const label = labels[status] || labels.unverified;

  const elements = [
    document.getElementById("verificationStatus"),
    document.getElementById("verificationBadge")
  ];

  for (const element of elements) {
    if (element) element.textContent = label;
  }
}

async function uploadPhoto() {
  if (!currentUser || busy) return;

  const file = fileInput?.files?.[0];

  if (!file) {
    setStatus("Choose a photograph first.");
    return;
  }

  if (!EXTENSIONS[file.type]) {
    setStatus("Choose a JPG, PNG or WebP image.");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    setStatus("The photograph must be 5 MB or smaller.");
    return;
  }

  setBusy(true);
  setStatus("Uploading photograph...");

  try {
    await checkSupabaseAuthentication(currentUser);

    const extension = EXTENSIONS[file.type];
    const path = `${currentUser.uid}/original.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "60",
        upsert: true
      });

    if (error) throw error;

    const oldPaths = possiblePaths(currentUser.uid)
      .filter(candidate => candidate !== path);

    if (oldPaths.length) {
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET)
        .remove(oldPaths);

      if (cleanupError) {
        console.warn(
          "Old photograph cleanup:",
          cleanupError.message
        );
      }
    }

    currentPhotoPath = path;
    fileInput.value = "";

    await loadPhoto();

    setStatus("Your personal photograph was uploaded successfully.");
  } catch (error) {
    console.error(error);
    setStatus(`Upload failed: ${error.message}`);
  } finally {
    setBusy(false);
  }
}

async function removePhoto() {
  if (!currentUser || busy || !currentPhotoPath) return;

  setBusy(true);
  setStatus("Removing photograph...");

  try {
    await checkSupabaseAuthentication(currentUser);

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove(possiblePaths(currentUser.uid));

    if (error) throw error;

    currentPhotoPath = null;
    clearPreview();

    if (fileInput) fileInput.value = "";

    setStatus("Your personal photograph has been removed.");
  } catch (error) {
    console.error(error);
    setStatus(`Removal failed: ${error.message}`);
  } finally {
    setBusy(false);

    if (removeButton) {
      removeButton.disabled = !currentPhotoPath;
    }
  }
}

async function saveVisibility() {
  if (!currentUser || !visibilityInput || busy) return;

  visibilityInput.disabled = true;

  try {
   
        await setDoc(
          doc(db, "photoSettings", currentUser.uid),
        {
          ownerId: currentUser.uid,
          friendsCanSeePhoto: visibilityInput.checked
        },
        { merge: true }
        );

    setStatus("Photo visibility preference saved.");
  } catch (error) {
    console.error(error);
    setStatus(`Could not save visibility: ${error.message}`);
  } finally {
    visibilityInput.disabled = false;
  }
}

uploadButton?.addEventListener("click", uploadPhoto);
removeButton?.addEventListener("click", removePhoto);
visibilityInput?.addEventListener("change", saveVisibility);

onAuthStateChanged(auth, async user => {
  currentUser = user;
  currentPhotoPath = null;

  clearPreview();

  if (!user) {
    setStatus("Sign in to manage your personal photograph.");
    return;
  }

  setStatus("Loading your photograph...");

  try {
    await checkSupabaseAuthentication(user);

    await Promise.all([
      loadPhoto(),
      loadVisibility(),
      loadVerification()
    ]);
  } catch (error) {
    console.error(error);
    setStatus(`Photo setup error: ${error.message}`);
  }
});
