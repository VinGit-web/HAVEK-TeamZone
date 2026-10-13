
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

/* ELEMENTS */

const form = document.getElementById("accountForm");
const status = document.getElementById("accountStatus");
const saveButton = document.getElementById("saveAccount");

const usernameInput = document.getElementById("username");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const birthYearInput = document.getElementById("birthYear");
const ageOutput = document.getElementById("age");
const genderInput = document.getElementById("gender");

const avatarPreview = document.getElementById("avatarPreview");
const avatarColorInput = document.getElementById("avatarColor");
const animalType = document.getElementById("animalType");

const hatToggle = document.getElementById("acc_hat");
const glassesToggle = document.getElementById("acc_glasses");
const earringsToggle = document.getElementById("acc_earrings");

const chooseAvatarButton = document.getElementById("choose-avatar");
const choosePhotoButton = document.getElementById("choose-photo");

const animalOptions = document.getElementById("animal-options");
const photoOptions = document.getElementById("photo-options");

const profilePhoto = document.getElementById("profilePhoto");
const removePhotoButton = document.getElementById("remove-photo");
const photoMessage = document.getElementById("photo-message");

const showEmailInput = document.getElementById("show_email");
const allowMessagesInput = document.getElementById("allow_messages");
const searchVisibleInput = document.getElementById("search_visible");
const emailNotificationsInput = document.getElementById("email_notifications");

let currentUser = null;
let savedProfile = null;
let selectedMode = "animal";
let uploadedPhotoURL = null;

/* STATUS */

function showStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? "#b42318" : "#267347";
}

/* BIRTH YEAR */

const currentYear = new Date().getFullYear();

for (let year = currentYear; year >= 1950; year--) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    birthYearInput.appendChild(option);
}

function updateAge() {
    if (!birthYearInput.value) {
        ageOutput.textContent = "--";
        return;
    }

    ageOutput.textContent = String(
        currentYear - Number(birthYearInput.value)
    );
}

birthYearInput.addEventListener("change", updateAge);

/* KOALA AVATAR */

const koalaBase = `
    <circle cx="22" cy="30" r="16"/>
    <circle cx="78" cy="30" r="16"/>
    <circle cx="50" cy="55" r="32"/>
`;

const koalaFace = `
    <g>
        <circle cx="38" cy="50" r="6" fill="#fff"/>
        <circle cx="38" cy="50" r="3" fill="#222"/>
    </g>
    <g>
        <circle cx="62" cy="50" r="6" fill="#fff"/>
        <circle cx="62" cy="50" r="3" fill="#222"/>
    </g>
    <ellipse cx="50" cy="64" rx="9" ry="6" fill="#222"/>
    <path
        d="M42 74 Q50 80 58 74"
        stroke="#222"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
    />
`;

const accessories = {
    hat: `
        <ellipse cx="50" cy="20" rx="34" ry="6" fill="#c0392b"/>
        <path d="M28 20 Q50 -6 72 20 Z" fill="#c0392b"/>
        <rect x="30" y="14" width="40" height="6" fill="#e74c3c"/>
    `,

    glasses: `
        <rect x="28" y="44" width="18" height="11" rx="4" fill="#222"/>
        <rect x="54" y="44" width="18" height="11" rx="4" fill="#222"/>
        <rect x="46" y="47" width="8" height="3" fill="#222"/>
    `,

    earrings: `
        <circle cx="22" cy="44" r="3.5" fill="#d4af37"/>
        <circle cx="78" cy="44" r="3.5" fill="#d4af37"/>
    `
};

/* RENDER ANIMAL AVATAR */

function renderAvatar() {
    if (selectedMode !== "animal") {
        return;
    }

    const color = avatarColorInput.value;
    const animal = animalType.value;

    if (animal === "koala") {
        let markup = `
            <svg
                viewBox="0 0 100 100"
                width="100"
                height="100"
                fill="${color}"
                role="img"
                aria-label="Koala avatar"
            >
        `;

        markup += koalaBase;

        if (earringsToggle.checked) {
            markup += accessories.earrings;
        }

        markup += koalaFace;

        if (glassesToggle.checked) {
            markup += accessories.glasses;
        }

        if (hatToggle.checked) {
            markup += accessories.hat;
        }

        markup += "</svg>";

        avatarPreview.innerHTML = markup;
        return;
    }

    const animals = {
        cat: "🐱",
        dog: "🐶",
        rabbit: "🐰"
    };

    avatarPreview.replaceChildren();

    const animalImage = document.createElement("span");

    animalImage.textContent = animals[animal] || "🐨";
    animalImage.style.fontSize = "76px";

    animalImage.setAttribute("role", "img");
    animalImage.setAttribute("aria-label", `${animal} avatar`);

    avatarPreview.appendChild(animalImage);
}

/* SWITCH AVATAR MODE */

function switchToAnimal() {
    selectedMode = "animal";

    animalOptions.hidden = false;
    photoOptions.hidden = true;

    photoMessage.textContent = "";

    renderAvatar();
}

function switchToPhoto() {
    selectedMode = "photo";

    animalOptions.hidden = true;
    photoOptions.hidden = false;

    if (uploadedPhotoURL) {
        showUploadedPhoto();
    } else {
        avatarPreview.replaceChildren();

        photoMessage.textContent =
            "Choose an image from your device. Photos are preview-only.";
    }
}

chooseAvatarButton.addEventListener("click", switchToAnimal);
choosePhotoButton.addEventListener("click", switchToPhoto);

/* PHOTO PREVIEW */

function clearPhoto() {
    if (uploadedPhotoURL) {
        URL.revokeObjectURL(uploadedPhotoURL);
        uploadedPhotoURL = null;
    }

    profilePhoto.value = "";
}

function showUploadedPhoto() {
    avatarPreview.replaceChildren();

    if (!uploadedPhotoURL) {
        return;
    }

    const image = document.createElement("img");

    image.src = uploadedPhotoURL;
    image.alt = "Selected profile photo preview";

    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";
    image.style.borderRadius = "50%";

    avatarPreview.appendChild(image);

    photoMessage.textContent =
        "Photo preview updated. This image will not be uploaded to Firebase.";
}

profilePhoto.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        this.value = "";
        photoMessage.textContent = "Please select a valid image.";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        this.value = "";
        photoMessage.textContent = "Please select an image smaller than 5 MB.";
        return;
    }

    clearPhoto();

    uploadedPhotoURL = URL.createObjectURL(file);

    switchToPhoto();
});

removePhotoButton.addEventListener("click", () => {
    clearPhoto();
    switchToAnimal();

    photoMessage.textContent = "Photo preview removed.";
});

/* AVATAR CONTROLS */

[
    avatarColorInput,
    animalType,
    hatToggle,
    glassesToggle,
    earringsToggle
].forEach(control => {
    control.addEventListener("input", renderAvatar);
    control.addEventListener("change", renderAvatar);
});

/* DEFAULT PROFILE */

function getDefaultProfile(user) {
    return {
        uid: user.uid,
        username: user.displayName || "",
        fullName: "",
        birthYear: 0,
        gender: "",
        visibility: "private",
        showEmail: false,
        allowMessages: true,
        searchVisible: true,
        emailNotifications: true,
        avatar: {
            mode: "animal",
            animal: "koala",
            color: "#8B5E3C",
            hat: false,
            glasses: false,
            earrings: false
        }
    };
}

/* POPULATE FORM */

function populateForm(profile) {
    usernameInput.value = profile.username || "";
    nameInput.value = profile.fullName || "";

    emailInput.value = currentUser?.email || "";

    birthYearInput.value = profile.birthYear
        ? String(profile.birthYear)
        : "";

    genderInput.value = profile.gender || "";

    const visibility = profile.visibility === "public"
        ? "public"
        : "private";

    document.querySelector(
        `input[name="visibility"][value="${visibility}"]`
    ).checked = true;

    showEmailInput.checked = profile.showEmail === true;
    allowMessagesInput.checked = profile.allowMessages !== false;
    searchVisibleInput.checked = profile.searchVisible !== false;

    emailNotificationsInput.checked =
        profile.emailNotifications !== false;

    const avatar = profile.avatar || {};

    animalType.value = avatar.animal || "koala";
    avatarColorInput.value = avatar.color || "#8B5E3C";

    hatToggle.checked = avatar.hat === true;
    glassesToggle.checked = avatar.glasses === true;
    earringsToggle.checked = avatar.earrings === true;

    clearPhoto();
    switchToAnimal();
    updateAge();
}

/* LOAD PROFILE FROM FIRESTORE */

async function loadProfile(user) {
    showStatus("Loading profile...");

    const userReference = doc(db, "users", user.uid);

    try {
        const snapshot = await getDoc(userReference);

        if (auth.currentUser?.uid !== user.uid) {
            return;
        }

        savedProfile = snapshot.exists()
            ? snapshot.data()
            : getDefaultProfile(user);

        populateForm(savedProfile);

        showStatus(
            snapshot.exists()
                ? ""
                : "Complete your profile and click Save Changes."
        );
    } catch (error) {
        console.error("Unable to load account:", error);

        showStatus(
            "Unable to load your profile. Please refresh and try again.",
            true
        );
    }
}

/* AUTHENTICATION */

onAuthStateChanged(auth, user => {
    currentUser = user;
    savedProfile = null;

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    loadProfile(user);
});

/* SAVE PROFILE */

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser || !savedProfile) {
        showStatus("Your profile is still loading.", true);
        return;
    }

    const username = usernameInput.value.trim();
    const fullName = nameInput.value.trim();

    if (!username) {
        showStatus("Please enter a username.", true);
        usernameInput.focus();
        return;
    }

    if (username.length > 30 || fullName.length > 80) {
        showStatus("Please check the character limits.", true);
        return;
    }

    const visibility = document.querySelector(
        'input[name="visibility"]:checked'
    ).value;

    const profile = {
        uid: currentUser.uid,
        username,
        fullName,
        birthYear: Number(birthYearInput.value) || 0,
        gender: genderInput.value,
        visibility,
        showEmail: showEmailInput.checked,
        allowMessages: allowMessagesInput.checked,
        searchVisible: searchVisibleInput.checked,
        emailNotifications: emailNotificationsInput.checked,
        avatar: {
            mode: "animal",
            animal: animalType.value,
            color: avatarColorInput.value,
            hat: hatToggle.checked,
            glasses: glassesToggle.checked,
            earrings: earringsToggle.checked
        },
        createdAt: savedProfile.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    showStatus("Saving profile...");

    try {
        const userReference = doc(
            db,
            "users",
            currentUser.uid
        );

        await setDoc(userReference, profile);

        savedProfile = {
            ...profile,
            createdAt: savedProfile.createdAt || new Date()
        };

        try {
            await updateProfile(currentUser, {
                displayName: username
            });
        } catch (authError) {
            console.error(
                "Profile saved, but Authentication display name was not updated:",
                authError
            );

            showStatus(
                "Profile saved, but the login display name could not be updated.",
                true
            );

            return;
        }

        showStatus("Your profile has been saved successfully.");

        if (selectedMode === "photo") {
            photoMessage.textContent =
                "Your animal avatar was saved. Photo uploads are not enabled yet.";
        }
    } catch (error) {
        console.error("Unable to save profile:", error);

        showStatus(
            "Unable to save your profile. Check your Firestore rules.",
            true
        );
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
});

/* CANCEL UNSAVED CHANGES */

form.addEventListener("reset", event => {
    event.preventDefault();

    if (!savedProfile) {
        return;
    }

    populateForm(savedProfile);
    showStatus("Unsaved changes discarded.");
});

/* CLEAN UP TEMPORARY PHOTO */

window.addEventListener("pagehide", clearPhoto);

/* INITIAL AVATAR */

renderAvatar();
