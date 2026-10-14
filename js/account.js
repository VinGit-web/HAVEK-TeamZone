
import { animalPreset, svgAvatar } from "./avatar-renderer.js";

import {
  mbtiDescriptions,
  interestCategories
} from "./profile-options.js";

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

const $ = id => document.getElementById(id);

const categories = {
  australia: [
    ["koala", "Koala"],
    ["kangaroo", "Kangaroo"],
    ["wombat", "Wombat"],
    ["quokka", "Quokka"],
    ["platypus", "Platypus"],
    ["kookaburra", "Kookaburra"],
    ["echidna", "Echidna"],
    ["tasdevil", "Tasmanian devil"],
    ["emu", "Emu"]
  ],

  pets: [
    ["dog", "Dog"],
    ["cat", "Cat"],
    ["rabbit", "Rabbit"],
    ["hamster", "Hamster"],
    ["guineapig", "Guinea pig"],
    ["parrot", "Parrot"]
  ],

  world: [
    ["redpanda", "Red panda"],
    ["penguin", "Penguin"],
    ["fox", "Fox"],
    ["capybara", "Capybara"],
    ["panda", "Panda"]
  ]
};

const avatarFields = [
  "characterName",
  "primaryColor",
  "secondaryColor",
  "expression",
  "pattern",
  "headwear",
  "eyewear",
  "earrings",
  "neckwear",
  "extra",
  "outfit",
  "outfitColor",
  "trimColor",
  "backgroundPreset"
];

let avatar = { ...animalPreset("koala") };

let category = "australia";
let currentUser = null;
let savedProfile = null;
let ready = false;

const selectedInterests = new Set();

/* STATUS */

function status(message, isError = false) {
  const element = $("accountStatus");

  if (!element) return;

  element.textContent = message;
  element.style.color = isError
    ? "#a52b22"
    : "#236c45";
}

function escapeText(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character])
  );
}

/* PERSONALITY */

function describeMbti() {
  const description = $("accountMbtiDescription");
  const select = $("mbti");

  if (!description || !select) return;

  description.textContent =
    mbtiDescriptions[select.value] ||
    "MBTI is optional. You can update it later.";
}

function setupMbti() {
  const select = $("mbti");

  if (!select) return;

  const existing = new Set(
    [...select.options].map(option => option.value)
  );

  Object.keys(mbtiDescriptions).forEach(type => {
    if (existing.has(type)) return;

    const option = document.createElement("option");

    option.value = type;
    option.textContent = type;

    select.append(option);
  });

  select.addEventListener("change", describeMbti);

  describeMbti();
}

/* INTERESTS */

function updateInterestCount() {
  const count = selectedInterests.size;

  $("accountInterestCount").textContent =
    `${count} interest${count === 1 ? "" : "s"} selected`;
}

function renderInterests() {
  const container = $("accountInterestOptions");
  const searchInput = $("accountInterestSearch");

  if (!container || !searchInput) {
    console.error(
      "Missing Account interest HTML elements."
    );
    return;
  }

  const search = searchInput.value
    .trim()
    .toLowerCase();

  container.replaceChildren();

  Object.entries(interestCategories).forEach(
    ([groupName, interests]) => {
      const matches = interests.filter(interest =>
        interest.toLowerCase().includes(search)
      );

      if (!matches.length) return;

      const group = document.createElement("div");
      group.className = "interest-group";

      const heading = document.createElement("h3");
      heading.textContent = groupName;

      const options = document.createElement("div");
      options.className = "interest-group-options";

      matches.forEach(interest => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "interest-chip";
        button.dataset.interest = interest;
        button.textContent = interest;

        const selected = selectedInterests.has(interest);

        button.classList.toggle("selected", selected);

        button.setAttribute(
          "aria-pressed",
          String(selected)
        );

        options.append(button);
      });

      group.append(heading, options);
      container.append(group);
    }
  );

  updateInterestCount();
}

function setupInterests() {
  const container = $("accountInterestOptions");
  const search = $("accountInterestSearch");

  if (!container || !search) {
    console.error("Interest selector cannot initialise.");
    return;
  }

  search.addEventListener("input", renderInterests);

  container.addEventListener("click", event => {
    const button = event.target.closest(
      "button.interest-chip[data-interest]"
    );

    if (!button || !container.contains(button)) return;

    event.preventDefault();

    const interest = button.dataset.interest;

    if (selectedInterests.has(interest)) {
      selectedInterests.delete(interest);
    } else {
      selectedInterests.add(interest);
    }

    const selected = selectedInterests.has(interest);

    button.classList.toggle("selected", selected);

    button.setAttribute(
      "aria-pressed",
      String(selected)
    );

    updateInterestCount();

    console.log(
      "Selected interests:",
      [...selectedInterests]
    );
  });

  renderInterests();
}

/* AVATAR */

function renderAvatar() {
  const markup = svgAvatar(avatar);

  if ($("avatarPreview")) {
    $("avatarPreview").innerHTML = markup;
  }

  if ($("profileAvatar")) {
    $("profileAvatar").innerHTML = markup;
  }
}

function renderAnimalGrid() {
  const container = $("animalGrid");

  if (!container) return;

  container.replaceChildren();

  for (const [id, label] of categories[category]) {
    const button = document.createElement("button");

    button.type = "button";

    button.className =
      avatar.animal === id ? "selected" : "";

    button.setAttribute(
      "aria-pressed",
      String(avatar.animal === id)
    );

    button.innerHTML =
      svgAvatar(animalPreset(id)) +
      `<span>${escapeText(label)}</span>`;

    button.addEventListener("click", () => {
      setAvatar(animalPreset(id));
    });

    container.append(button);
  }
}

function setAvatar(value) {
  const animal = value?.animal || "koala";

  avatar = {
    ...animalPreset(animal),
    ...value
  };

  if (value && value.version !== 2) {
    avatar = {
      ...animalPreset(animal),

      primaryColor:
        value.color ||
        animalPreset(animal).primaryColor,

      headwear: value.hat ? "cap" : "none",

      eyewear:
        value.glasses ? "sunglasses" : "none",

      earrings:
        value.earrings ? "studs" : "none"
    };
  }

  const defaults = animalPreset(animal);

  avatarFields.forEach(id => {
    if ($(id)) {
      $(id).value =
        avatar[id] ?? defaults[id] ?? "";
    }
  });

  category =
    Object.keys(categories).find(key =>
      categories[key].some(
        ([id]) => id === avatar.animal
      )
    ) || "australia";

  document.querySelectorAll("[data-category]").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.category === category
    );
  });

  renderAnimalGrid();
  renderAvatar();
}

function setupAvatar() {
  avatarFields.forEach(id => {
    const input = $(id);

    if (!input) return;

    input.addEventListener("input", () => {
      avatar[id] = input.value;
      renderAvatar();
    });
  });

  document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      category = button.dataset.category;

      document.querySelectorAll("[data-category]").forEach(item => {
        item.classList.toggle(
          "selected",
          item === button
        );
      });

      renderAnimalGrid();
    });
  });

  $("randomAvatar")?.addEventListener("click", () => {
    const random = values =>
      values[Math.floor(Math.random() * values.length)];

    const animals = Object.values(categories).flat();

    const animal = random(animals)[0];

    setAvatar({
      ...animalPreset(animal),

      primaryColor: random([
        "#b88860",
        "#9aaacb",
        "#e2a6b7",
        "#94b99b",
        "#d5a46d",
        "#a58cbf"
      ]),

      secondaryColor: random([
        "#f2d6b3",
        "#f8e7d8",
        "#d9e9ee"
      ]),

      expression: random([
        "happy",
        "curious",
        "sleepy",
        "excited",
        "cheeky"
      ]),

      headwear: random([
        "none",
        "beanie",
        "cap",
        "bucket",
        "crown",
        "bow",
        "headphones",
        "flower",
        "party"
      ]),

      eyewear: random([
        "none",
        "round",
        "square",
        "sunglasses",
        "heart",
        "star"
      ]),

      outfit: random([
        "hoodie",
        "tshirt",
        "sweater",
        "denim",
        "suit",
        "jersey",
        "coat",
        "astronaut",
        "wizard"
      ])
    });
  });

  $("resetAvatar")?.addEventListener("click", () => {
    setAvatar(animalPreset(avatar.animal));
  });

  setAvatar(animalPreset("koala"));
}

/* TABS */

function setupTabs() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach(item => {
        const active = item === button;

        item.classList.toggle("active", active);

        item.setAttribute(
          "aria-selected",
          String(active)
        );
      });

      document.querySelectorAll(".account-panel").forEach(panel => {
        panel.hidden =
          panel.id !== `panel-${button.dataset.tab}`;

        panel.classList.toggle(
          "active",
          !panel.hidden
        );
      });
    });
  });
}

/* BIRTH YEAR */

function setupBirthYears() {
  const select = $("birthYear");

  if (!select) return;

  const latestYear = new Date().getFullYear() - 18;

  select.replaceChildren();

  const placeholder = document.createElement("option");

  placeholder.value = "";
  placeholder.textContent = "Select birth year";

  select.append(placeholder);

  for (let year = latestYear; year >= 1900; year--) {
    const option = document.createElement("option");

    option.value = String(year);
    option.textContent = String(year);

    select.append(option);
  }

  select.addEventListener("change", () => {
    const year = Number(select.value);

    if ($("age")) {
      $("age").textContent = year
        ? String(new Date().getFullYear() - year)
        : "--";
    }
  });
}

/* DEFAULT PROFILE */

function profileDefault(user) {
  return {
    uid: user.uid,

    username: user.displayName || "",
    fullName: "",
    birthYear: 0,
    gender: "",

    persona: "",
    mbti: "",
    interests: [],

    suburb: "",
    preference: "none",
    showSuburb: false,

    visibility: "private",

    showEmail: false,
    allowMessages: true,
    searchVisible: true,
    emailNotifications: true,

    avatar: animalPreset("koala")
  };
}

/* POPULATE FORM */

function populate(profile) {
  $("username").value = profile.username || "";

  $("name").value = profile.fullName || "";

  $("email").value = currentUser?.email || "";

  $("birthYear").value = profile.birthYear
    ? String(profile.birthYear)
    : "";

  $("birthYear").dispatchEvent(new Event("change"));

  $("gender").value = profile.gender || "";

  $("persona").value = profile.persona || "";

  $("mbti").value = profile.mbti || "";

  describeMbti();

  selectedInterests.clear();

  if (Array.isArray(profile.interests)) {
    profile.interests.forEach(interest => {
      if (typeof interest === "string") {
        selectedInterests.add(interest);
      }
    });
  }

  $("accountInterestSearch").value = "";

  renderInterests();

  $("suburb").value = profile.suburb || "";

  $("preference").value =
    profile.preference || "none";

  $("showSuburb").checked =
    profile.showSuburb === true;

  const visibility =
    profile.visibility === "public"
      ? "public"
      : "private";

  const radio = document.querySelector(
    `input[name="visibility"][value="${visibility}"]`
  );

  if (radio) radio.checked = true;

  const checkboxFields = [
    ["show_email", "showEmail", false],
    ["allow_messages", "allowMessages", true],
    ["search_visible", "searchVisible", true],
    ["email_notifications", "emailNotifications", true]
  ];

  checkboxFields.forEach(([id, key, defaultValue]) => {
    if (!$(id)) return;

    $(id).checked =
      typeof profile[key] === "boolean"
        ? profile[key]
        : defaultValue;
  });

  setAvatar(
    profile.avatar || animalPreset("koala")
  );
}

/* LOAD ACCOUNT */

async function loadAccount(user) {
  currentUser = user;
  savedProfile = null;
  ready = false;

  $("saveAccount").disabled = true;

  if (!user) {
    location.replace("login.html");
    return;
  }

  $("email").value = user.email || "";

  console.log("Firebase account authenticated.");
  console.log("Loading private account document...");

  try {
    const snapshot = await getDoc(
      doc(db, "users", user.uid)
    );

    if (auth.currentUser?.uid !== user.uid) return;

    console.log("PRIVATE PROFILE LOADED SUCCESSFULLY");

    savedProfile = snapshot.exists()
      ? {
          ...profileDefault(user),
          ...snapshot.data()
        }
      : profileDefault(user);

    populate(savedProfile);

    ready = true;

    $("saveAccount").disabled = false;

    status(
      snapshot.exists()
        ? ""
        : "Complete your profile and click Save Changes."
    );

  } catch (error) {
    console.error(
      "PRIVATE PROFILE LOAD FAILED:",
      error
    );

    status(
      `Unable to load private profile: ${error.message}`,
      true
    );
  }
}

/* SAVE ACCOUNT */

async function saveAccount(event) {
  event.preventDefault();

  if (!ready || !currentUser || !savedProfile) {
    status("Your account is still loading.", true);
    return;
  }

  const user = currentUser;

  const username = $("username").value.trim();

  const birthYear = Number($("birthYear").value);

  const latestYear = new Date().getFullYear() - 18;

  if (!username || username.length > 30) {
    status(
      "Enter a username of up to 30 characters.",
      true
    );
    return;
  }

  if (
    !Number.isInteger(birthYear) ||
    birthYear < 1900 ||
    birthYear > latestYear
  ) {
    status("Select a valid birth year.", true);
    return;
  }

  if (!$("persona").value) {
    status(
      "Select a personality description.",
      true
    );
    return;
  }

  if (selectedInterests.size === 0) {
    status(
      "Select at least one interest.",
      true
    );
    return;
  }

  const suburb = $("suburb").value.trim();

  if (!suburb) {
    status(
      "Enter your suburb or locality.",
      true
    );
    return;
  }

  const visibilityRadio = document.querySelector(
    'input[name="visibility"]:checked'
  );

  const profile = {
    ...savedProfile,

    uid: user.uid,

    username,

    fullName: $("name").value.trim(),

    birthYear,

    gender: $("gender").value,

    persona: $("persona").value,

    mbti: $("mbti").value,

    interests: [...selectedInterests],

    suburb,

    preference: $("preference").value,

    showSuburb: $("showSuburb").checked,

    visibility:
      visibilityRadio?.value || "private",

    showEmail: $("show_email").checked,

    allowMessages: $("allow_messages").checked,

    searchVisible: $("search_visible").checked,

    emailNotifications:
      $("email_notifications").checked,

    avatar: {
      ...avatar,
      version: 2,
      mode: "animal"
    },

    createdAt:
      savedProfile.createdAt ||
      serverTimestamp(),

    updatedAt: serverTimestamp()
  };

  const saveButton = $("saveAccount");

  saveButton.disabled = true;

  let saveStage = "private profile";

  try {
    if (auth.currentUser?.uid !== user.uid) {
      throw new Error(
        "Your sign-in session has changed."
      );
    }

    /* FIRST WRITE */

    status("Saving private profile...");

    console.log(
      "STEP 1: Saving users/{uid}..."
    );

    await setDoc(
      doc(db, "users", user.uid),
      profile,
      { merge: true }
    );

    console.log(
      "STEP 1 SUCCESS: Private profile saved."
    );

    // The private profile is already saved at this point.
    savedProfile = profile;

    /* SECOND WRITE */

    saveStage = "public profile";

    const publicProfile = {
      uid: user.uid,

      username: profile.username,

      avatar: profile.avatar,

      persona: profile.persona,

      mbti: profile.mbti,

      interests: profile.interests,

      preference: profile.preference,

      visibility: profile.visibility,

      searchVisible: profile.searchVisible,

      showSuburb: profile.showSuburb,

      updatedAt: serverTimestamp()
    };

    if (profile.showSuburb) {
      publicProfile.suburb = profile.suburb;
    }

    status("Saving public profile...");

    console.log(
      "STEP 2: Saving publicProfiles/{uid}..."
    );

    await setDoc(
      doc(db, "publicProfiles", user.uid),
      publicProfile
    );

    console.log(
      "STEP 2 SUCCESS: Public profile saved."
    );

    /* AUTH DISPLAY NAME */

    saveStage = "Firebase Auth display name";

    status("Updating display name...");

    console.log(
      "STEP 3: Updating Firebase Auth display name..."
    );

    await updateProfile(user, {
      displayName: username
    });

    console.log(
      "STEP 3 SUCCESS: Auth display name updated."
    );

    status(
      "Your profile and interests have been saved."
    );

  } catch (error) {
    console.error(
      `SAVE FAILED AT: ${saveStage}`,
      error
    );

    status(
      `Save failed at ${saveStage}: ${error.message}`,
      true
    );

  } finally {
    saveButton.disabled = false;
  }
}

/* CANCEL CHANGES */

function resetAccount(event) {
  event.preventDefault();

  if (!savedProfile) return;

  populate(savedProfile);

  status("Unsaved changes discarded.");
}

/* INITIALISE */

function initialise() {
  setupMbti();

  setupInterests();

  setupAvatar();

  setupTabs();

  setupBirthYears();

  $("accountForm").addEventListener(
    "submit",
    saveAccount
  );

  $("accountForm").addEventListener(
    "reset",
    resetAccount
  );

  $("saveAccount").disabled = true;

  onAuthStateChanged(auth, loadAccount);
}

initialise();
