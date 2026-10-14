
import { animalPreset, svgAvatar } from "./avatar-renderer.js";
import { mbtiDescriptions, interestCategories } from "./profile-options.js";
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

const defaults = animalPreset("koala");

let avatar = { ...defaults };
let category = "australia";
let currentUser = null;
let savedProfile = null;
let ready = false;

const selectedInterests = new Set();

const random = items =>
  items[Math.floor(Math.random() * items.length)];

function escapeText(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

function status(message, error = false) {
  const element = $("accountStatus");

  if (!element) return;

  element.textContent = message;
  element.style.color = error ? "#a52b22" : "#236c45";
}

/* PERSONALITY */

const mbtiSelect = $("mbti");

Object.keys(mbtiDescriptions).forEach(type => {
  const option = document.createElement("option");

  option.value = type;
  option.textContent = type;

  mbtiSelect.append(option);
});

function describeMbti() {
  $("accountMbtiDescription").textContent =
    mbtiDescriptions[mbtiSelect.value] ||
    "MBTI is optional. You can update it later.";
}

mbtiSelect.addEventListener("change", describeMbti);

/* INTERESTS */

function renderInterests() {
  const container = $("accountInterestOptions");
  const search = $("accountInterestSearch").value
    .trim()
    .toLowerCase();

  container.replaceChildren();

  Object.entries(interestCategories).forEach(([groupName, interests]) => {
    const matches = interests.filter(interest =>
      interest.toLowerCase().includes(search)
    );

    if (!matches.length) return;

    const group = document.createElement("div");
    group.className = "interest-group";

    const heading = document.createElement("h3");
    heading.textContent = groupName;

    group.append(heading);

    const options = document.createElement("div");
    options.className = "interest-group-options";

    matches.forEach(interest => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "interest-chip";
      button.textContent = interest;

      const selected = selectedInterests.has(interest);

      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));

      button.addEventListener("click", () => {
        if (selectedInterests.has(interest)) {
          selectedInterests.delete(interest);
        } else {
          selectedInterests.add(interest);
        }

        renderInterests();
      });

      options.append(button);
    });

    group.append(options);
    container.append(group);
  });

  const count = selectedInterests.size;

  $("accountInterestCount").textContent =
    `${count} interest${count === 1 ? "" : "s"} selected`;
}

$("accountInterestSearch").addEventListener(
  "input",
  renderInterests
);

/* AVATAR */

function renderAvatar() {
  const markup = svgAvatar(avatar);

  $("avatarPreview").innerHTML = markup;
  $("profileAvatar").innerHTML = markup;
}

function renderAnimalGrid() {
  const container = $("animalGrid");

  container.replaceChildren();

  for (const [id, label] of categories[category]) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = avatar.animal === id ? "selected" : "";

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
      eyewear: value.glasses ? "sunglasses" : "none",
      earrings: value.earrings ? "studs" : "none"
    };
  }

  for (const id of avatarFields) {
    $(id).value = avatar[id] ?? defaults[id];
  }

  category =
    Object.keys(categories).find(key =>
      categories[key].some(([id]) => id === avatar.animal)
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

avatarFields.forEach(id => {
  $(id).addEventListener("input", () => {
    avatar[id] = $(id).value;
    renderAvatar();
  });
});

document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    category = button.dataset.category;

    document.querySelectorAll("[data-category]").forEach(item => {
      item.classList.toggle("selected", item === button);
    });

    renderAnimalGrid();
  });
});

/* ACCOUNT TABS */

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(item => {
      const active = item === button;

      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });

    document.querySelectorAll(".account-panel").forEach(panel => {
      panel.hidden = panel.id !== `panel-${button.dataset.tab}`;
      panel.classList.toggle("active", !panel.hidden);
    });
  });
});

/* AVATAR ACTIONS */

$("randomAvatar").addEventListener("click", () => {
  const animals = Object.values(categories).flat();
  const selected = random(animals)[0];

  setAvatar({
    ...animalPreset(selected),

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

$("resetAvatar").addEventListener("click", () => {
  setAvatar(animalPreset(avatar.animal));
});

/* BIRTH YEAR */

function populateBirthYears() {
  const currentYear = new Date().getFullYear();
  const latestYear = currentYear - 18;

  const select = $("birthYear");
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
}

populateBirthYears();

$("birthYear").addEventListener("change", () => {
  const year = Number($("birthYear").value);

  $("age").textContent = year
    ? String(new Date().getFullYear() - year)
    : "--";
});

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

/* LOAD PROFILE INTO FORM */

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
      selectedInterests.add(interest);
    });
  }

  $("accountInterestSearch").value = "";
  renderInterests();

  $("suburb").value = profile.suburb || "";
  $("preference").value = profile.preference || "none";
  $("showSuburb").checked = profile.showSuburb === true;

  const visibility =
    profile.visibility === "public" ? "public" : "private";

  const visibilityRadio = document.querySelector(
    `input[name="visibility"][value="${visibility}"]`
  );

  if (visibilityRadio) visibilityRadio.checked = true;

  for (const [id, key] of [
    ["show_email", "showEmail"],
    ["allow_messages", "allowMessages"],
    ["search_visible", "searchVisible"],
    ["email_notifications", "emailNotifications"]
  ]) {
    $(id).checked = profile[key] === true;
  }

  setAvatar(profile.avatar || animalPreset("koala"));
}

/* FIREBASE AUTHENTICATION */

onAuthStateChanged(auth, async user => {
  currentUser = user;
  savedProfile = null;
  ready = false;

  $("saveAccount").disabled = true;

  if (!user) {
    location.replace("login.html");
    return;
  }

  $("email").value = user.email || "";

  try {
    const snapshot = await getDoc(
      doc(db, "users", user.uid)
    );

    if (auth.currentUser?.uid !== user.uid) return;

    savedProfile = snapshot.exists()
      ? snapshot.data()
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
    console.error(error);
    status(error.message, true);
  }
});

/* SAVE ACCOUNT */

$("accountForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!ready || !currentUser) return;

  const user = currentUser;
  const username = $("username").value.trim();
  const birthYear = Number($("birthYear").value);

  const latestYear = new Date().getFullYear() - 18;

  if (
    !username ||
    !Number.isInteger(birthYear) ||
    birthYear < 1900 ||
    birthYear > latestYear
  ) {
    status(
      "Enter a username and select an eligible birth year.",
      true
    );
    return;
  }

  if (!$("persona").value) {
    status("Select a personality description.", true);
    return;
  }

  if (selectedInterests.size === 0) {
    status("Select at least one interest.", true);
    return;
  }

  if (!$("suburb").value.trim()) {
    status("Enter your suburb or locality.", true);
    return;
  }

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

    suburb: $("suburb").value.trim(),
    preference: $("preference").value,
    showSuburb: $("showSuburb").checked,

    visibility: document.querySelector(
      'input[name="visibility"]:checked'
    ).value,

    showEmail: $("show_email").checked,
    allowMessages: $("allow_messages").checked,
    searchVisible: $("search_visible").checked,
    emailNotifications: $("email_notifications").checked,

    avatar: {
      ...avatar,
      version: 2,
      mode: "animal"
    },

    createdAt:
      savedProfile?.createdAt || serverTimestamp(),

    updatedAt: serverTimestamp()
  };

  $("saveAccount").disabled = true;
  status("Saving profile...");

  try {
    if (auth.currentUser?.uid !== user.uid) {
      throw new Error("Your sign-in session has changed.");
    }

    await setDoc(
      doc(db, "users", user.uid),
      profile,
      { merge: true }
    );

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

    // Replace the public document so disabling suburb
    // visibility also removes a previously published suburb.
    await setDoc(
      doc(db, "publicProfiles", user.uid),
      publicProfile
    );

    await updateProfile(user, {
      displayName: username
    });

    savedProfile = profile;

    status("Your profile and avatar have been saved.");
  } catch (error) {
    console.error(error);
    status(`Save failed: ${error.message}`, true);
  } finally {
    $("saveAccount").disabled = false;
  }
});

/* DISCARD UNSAVED CHANGES */

$("accountForm").addEventListener("reset", event => {
  event.preventDefault();

  if (!savedProfile) return;

  populate(savedProfile);
  status("Unsaved changes discarded.");
});

/* INITIAL DISPLAY */

setAvatar(animalPreset("koala"));
renderInterests();
describeMbti();
