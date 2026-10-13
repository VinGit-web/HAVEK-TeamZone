
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


/* =====================================================
   ELEMENTS
===================================================== */

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


/* =====================================================
   APPLICATION STATE
===================================================== */

let currentUser = null;
let savedProfile = null;

let profileReady = false;
let selectedMode = "animal";
let uploadedPhotoURL = null;

saveButton.disabled = true;


/* =====================================================
   STATUS MESSAGE
===================================================== */

function showStatus(message, isError = false) {
    status.textContent = message;

    status.style.color = isError
        ? "#b42318"
        : "#267347";
}


/* =====================================================
   DEFAULT PROFILE
===================================================== */

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


/* =====================================================
   BIRTH YEAR AND AGE
===================================================== */

const currentYear = new Date().getFullYear();
const latestEligibleBirthYear = currentYear - 18;

// Only offer birth years that meet the age requirement
// based on the current year.
for (let year = latestEligibleBirthYear; year >= 1950; year--) {
    const option = document.createElement("option");

    option.value = String(year);
    option.textContent = String(year);

    birthYearInput.appendChild(option);
}

function updateAge() {
    const year = Number(birthYearInput.value);

    if (!year) {
        ageOutput.textContent = "--";
        return;
    }

    const estimatedAge = currentYear - year;
    ageOutput.textContent = String(estimatedAge);
}

birthYearInput.addEventListener("change", updateAge);


/* =====================================================
   KOALA AVATAR
===================================================== */

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

    <ellipse
        cx="50"
        cy="64"
        rx="9"
        ry="6"
        fill="#222"
    />

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
        <ellipse
            cx="50"
            cy="20"
            rx="34"
            ry="6"
            fill="#c0392b"
        />

        <path
            d="M28 20 Q50 -6 72 20 Z"
            fill="#c0392b"
        />

        <rect
            x="30"
            y="14"
            width="40"
            height="6"
            fill="#e74c3c"
        />
    `,

    glasses: `
        <rect
            x="28"
            y="44"
            width="18"
            height="11"
            rx="4"
            fill="#222"
        />

        <rect
            x="54"
            y="44"
            width="18"
            height="11"
            rx="4"
            fill="#222"
        />

        <rect
            x="46"
            y="47"
            width="8"
            height="3"
            fill="#222"
        />
    `,

    earrings: `
        <circle
            cx="22"
            cy="44"
            r="3.5"
            fill="#d4af37"
        />

        <circle
            cx="78"
            cy="44"
            r="3.5"
            fill="#d4af37"
        />
    `
};


/* =====================================================
   RENDER AVATAR
===================================================== */

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
    animalImage.setAttribute(
        "aria-label",
        `${animal} avatar`
    );

    avatarPreview.appendChild(animalImage);
}


/* =====================================================
   AVATAR MODE
===================================================== */

function switchToAnimal() {
    selectedMode = "animal";

    photoOptions.hidden = true;

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

chooseAvatarButton.addEventListener(
    "click",
    switchToAnimal
);

choosePhotoButton.addEventListener(
    "click",
    switchToPhoto
);


/* =====================================================
   PHOTO PREVIEW
===================================================== */

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
        "Photo preview updated. This image is not saved to Firebase.";
}

profilePhoto.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        this.value = "";

        photoMessage.textContent =
            "Please select a valid image.";

        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        this.value = "";

        photoMessage.textContent =
            "Please select an image smaller than 5 MB.";

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


/* =====================================================
   AVATAR CUSTOMISATION EVENTS
===================================================== */

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


/* =====================================================
   POPULATE ACCOUNT FORM
===================================================== */

function populateForm(profile) {
    usernameInput.value = profile.username || "";
    nameInput.value = profile.fullName || "";

    emailInput.value = currentUser?.email || "";

    birthYearInput.value = profile.birthYear
        ? String(profile.birthYear)
        : "";

    genderInput.value = profile.gender || "";

    const visibility =
        profile.visibility === "public"
            ? "public"
            : "private";

    const visibilityInput = document.querySelector(
        `input[name="visibility"][value="${visibility}"]`
    );

    if (visibilityInput) {
        visibilityInput.checked = true;
    }

    showEmailInput.checked = profile.showEmail === true;

    allowMessagesInput.checked =
        profile.allowMessages !== false;

    searchVisibleInput.checked =
        profile.searchVisible !== false;

    emailNotificationsInput.checked =
        profile.emailNotifications !== false;

    const avatar = profile.avatar || {};

    animalType.value = avatar.animal || "koala";

    avatarColorInput.value =
        avatar.color || "#8B5E3C";

    hatToggle.checked = avatar.hat === true;
    glassesToggle.checked = avatar.glasses === true;
    earringsToggle.checked = avatar.earrings === true;

    clearPhoto();

    switchToAnimal();
    updateAge();
}


/* =====================================================
   LOAD PROFILE FROM FIRESTORE
===================================================== */

async function loadProfile(user) {
    profileReady = false;
    saveButton.disabled = true;

    showStatus("Loading profile...");

    // Show email immediately, even if Firestore fails.
    emailInput.value = user.email || "";

    const userReference = doc(
        db,
        "users",
        user.uid
    );

    try {
        const snapshot = await getDoc(userReference);

        // Prevent an old request from updating a new login.
        if (auth.currentUser?.uid !== user.uid) {
            return;
        }

        if (snapshot.exists()) {
            savedProfile = snapshot.data();

            showStatus("");
        } else {
            savedProfile = getDefaultProfile(user);

            showStatus(
                "Welcome! Complete your profile and click Save Changes."
            );
        }

        populateForm(savedProfile);

        profileReady = true;
        saveButton.disabled = false;

    } catch (error) {
        console.error(
            "FIRESTORE PROFILE LOADING ERROR:",
            error
        );

        profileReady = false;
        savedProfile = null;
        saveButton.disabled = true;

        showStatus(
            `Unable to load profile: ${error.code || error.message}`,
            true
        );
    }
}


/* =====================================================
   FIREBASE AUTHENTICATION
===================================================== */

onAuthStateChanged(auth, async user => {
    currentUser = user;

    savedProfile = null;
    profileReady = false;

    saveButton.disabled = true;

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    // Show the email before loading Firestore.
    emailInput.value = user.email || "";

    await loadProfile(user);
});


/* =====================================================
   SAVE PROFILE
===================================================== */

form.addEventListener("submit", async event => {
    event.preventDefault();

     // Check the age requirement before saving.
    const selectedBirthYear = Number(birthYearInput.value);

    if (!selectedBirthYear) {
        showStatus(
            "Please select your year of birth.",
            true
        );

        birthYearInput.focus();
        return;
    }

    const estimatedAge = currentYear - selectedBirthYear;

    if (estimatedAge < 18) {
        showStatus(
            "You must be at least 18 years old.",
            true
        );

        birthYearInput.focus();
        return;
    }

    if (!currentUser) {
        window.location.replace("login.html");
        return;
    }

    if (!profileReady || !savedProfile) {
        showStatus(
            "Your profile has not finished loading. Check the error above.",
            true
        );

        return;
    }

    const username = usernameInput.value.trim();
    const fullName = nameInput.value.trim();

    if (!username) {
        showStatus(
            "Please enter a username.",
            true
        );

        usernameInput.focus();
        return;
    }

    if (username.length > 30) {
        showStatus(
            "Username must be 30 characters or fewer.",
            true
        );

        return;
    }

    if (fullName.length > 80) {
        showStatus(
            "Full name must be 80 characters or fewer.",
            true
        );

        return;
    }

    const visibilityInput = document.querySelector(
        'input[name="visibility"]:checked'
    );

    const visibility = visibilityInput
        ? visibilityInput.value
        : "private";

    const userReference = doc(
        db,
        "users",
        currentUser.uid
    );

    const profile = {
        uid: currentUser.uid,

        username: username,
        fullName: fullName,

        birthYear: Number(birthYearInput.value) || 0,
        gender: genderInput.value,

        visibility: visibility,

        showEmail: showEmailInput.checked,
        allowMessages: allowMessagesInput.checked,
        searchVisible: searchVisibleInput.checked,

        emailNotifications:
            emailNotificationsInput.checked,

        avatar: {
            mode: "animal",

            animal: animalType.value,
            color: avatarColorInput.value,

            hat: hatToggle.checked,
            glasses: glassesToggle.checked,
            earrings: earringsToggle.checked
        },

        createdAt:
            savedProfile.createdAt || serverTimestamp(),

        updatedAt: serverTimestamp()
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    showStatus("Saving profile...");

    try {
        // Save the profile to Firestore.
        await setDoc(userReference, profile);

        // Read back the actual saved document.
        // This preserves the real Firestore createdAt timestamp.
        const savedSnapshot = await getDoc(userReference);

        if (!savedSnapshot.exists()) {
            throw new Error(
                "Profile was not found after saving."
            );
        }

        savedProfile = savedSnapshot.data();

        profileReady = true;

        // Update the Firebase Authentication display name.
        try {
            await updateProfile(currentUser, {
                displayName: username
            });

        } catch (authError) {
            console.error(
                "Authentication display name update failed:",
                authError
            );

            showStatus(
                "Your Firestore profile was saved, but the login display name could not be updated.",
                true
            );

            return;
        }

        showStatus(
            "Your profile has been saved successfully."
        );

        if (selectedMode === "photo") {
            photoMessage.textContent =
                "Your animal avatar was saved. Photo uploads are not enabled yet.";
        }

    } catch (error) {
        console.error(
            "FIRESTORE PROFILE SAVE ERROR:",
            error
        );

        showStatus(
            `Unable to save profile: ${error.code || error.message}`,
            true
        );

    } finally {
        saveButton.disabled = !profileReady;
        saveButton.textContent = "Save Changes";
    }
});


/* =====================================================
   CANCEL UNSAVED CHANGES
===================================================== */

form.addEventListener("reset", event => {
    event.preventDefault();

    if (!profileReady || !savedProfile) {
        showStatus(
            "There is no loaded profile to restore.",
            true
        );

        return;
    }

    populateForm(savedProfile);

    showStatus("Unsaved changes discarded.");
});


/* =====================================================
   CLEAN UP
===================================================== */

window.addEventListener("pagehide", clearPhoto);


/* =====================================================
   INITIAL AVATAR
===================================================== */

renderAvatar();
