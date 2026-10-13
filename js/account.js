
import { animalPreset, svgAvatar } from "./avatar-renderer.js";
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

const ids = [
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

const random = items =>
  items[Math.floor(Math.random() * items.length)];

const escapeText = value =>
  String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));

function status(message, error = false) {
  $("accountStatus").textContent = message;
  $("accountStatus").style.color = error ? "#a52b22" : "#236c45";
}

function render() {
  $("avatarPreview").innerHTML = svgAvatar(avatar);
  $("profileAvatar").innerHTML = svgAvatar(avatar);
}

function grid() {
  $("animalGrid").replaceChildren();

  for (const [id, label] of categories[category]) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = avatar.animal === id ? "selected" : "";
    button.setAttribute("aria-pressed", String(avatar.animal === id));

    button.innerHTML =
      svgAvatar(animalPreset(id)) +
      `<span>${escapeText(label)}</span>`;

    button.addEventListener("click", () => {
      setAvatar(animalPreset(id));
    });

    $("animalGrid").append(button);
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
        value.color || animalPreset(animal).primaryColor,
      headwear: value.hat ? "cap" : "none",
      eyewear: value.glasses ? "sunglasses" : "none",
      earrings: value.earrings ? "studs" : "none"
    };
  }

  for (const id of ids) {
    $(id).value = avatar[id] ?? defaults[id];
  }

  category = Object.keys(categories).find(key =>
    categories[key].some(([id]) => id === avatar.animal)
  ) || "australia";

  document.querySelectorAll("[data-category]").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.category === category
    );
  });

  grid();
  render();
}

ids.forEach(id => {
  $(id).addEventListener("input", () => {
    avatar[id] = $(id).value;
    render();
  });
});

document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    category = button.dataset.category;

    document.querySelectorAll("[data-category]").forEach(item => {
      item.classList.toggle("selected", item === button);
    });

    grid();
  });
});

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(item => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });

    document.querySelectorAll(".account-panel").forEach(panel => {
      panel.hidden = panel.id !== `panel-${button.dataset.tab}`;
      panel.classList.toggle("active", !panel.hidden);
    });
  });
});

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

function populateBirthYears() {
  const currentYear = new Date().getFullYear();
  const latestYear = currentYear - 18;

  $("birthYear").replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select birth year";

  $("birthYear").append(placeholder);

  for (let y = latestYear; y >= 1900; y--) {
    const option = document.createElement("option");

    option.value = String(y);
    option.textContent = String(y);

    $("birthYear").append(option);
  }
}

populateBirthYears();

$("birthYear").addEventListener("change", () => {
  const selected = Number($("birthYear").value);

  $("age").textContent = selected
    ? String(new Date().getFullYear() - selected)
    : "--";
});

function profileDefault(user) {
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
    avatar: animalPreset("koala")
  };
}

function populate(profile) {
  $("username").value = profile.username || "";
  $("name").value = profile.fullName || "";
  $("email").value = currentUser?.email || "";

  $("birthYear").value = profile.birthYear
    ? String(profile.birthYear)
    : "";

  $("birthYear").dispatchEvent(new Event("change"));

  $("gender").value = profile.gender || "";

  document.querySelector(
    `input[name="visibility"][value="${
      profile.visibility === "public" ? "public" : "private"
    }"]`
  ).checked = true;

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

onAuthStateChanged(auth, async user => {
  currentUser = user;
  ready = false;

  $("saveAccount").disabled = true;

  if (!user) {
    location.replace("login.html");
    return;
  }

  $("email").value = user.email || "";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (auth.currentUser?.uid !== user.uid) return;

    savedProfile = snap.exists()
      ? snap.data()
      : profileDefault(user);

    populate(savedProfile);

    ready = true;
    $("saveAccount").disabled = false;

    status(
      snap.exists()
        ? ""
        : "Complete your profile and click Save Changes."
    );
  } catch (error) {
    status(error.message, true);
  }
});

$("accountForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!ready || !currentUser) return;

  const username = $("username").value.trim();
  const birthYear = Number($("birthYear").value);
  const latestYear = new Date().getFullYear() - 18;

  if (
    !username ||
    !Number.isInteger(birthYear) ||
    birthYear < 1900 ||
    birthYear > latestYear
  ) {
    status("Enter a username and select an eligible birth year.", true);
    return;
  }

  const profile = {
    uid: currentUser.uid,
    username,
    fullName: $("name").value.trim(),
    birthYear,
    gender: $("gender").value,

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

    createdAt: savedProfile?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  $("saveAccount").disabled = true;
  status("Saving profile...");

  try {
    await setDoc(
      doc(db, "users", currentUser.uid),
      profile
    );

    await setDoc(
      doc(db, "publicProfiles", currentUser.uid),
      {
        uid: currentUser.uid,
        username: profile.username,
        avatar: profile.avatar
      }
    );

    const snap = await getDoc(
      doc(db, "users", currentUser.uid)
    );

    savedProfile = snap.data();

    await updateProfile(currentUser, {
      displayName: username
    });

    status("Your profile and avatar have been saved.");
  } catch (error) {
    status(`Save failed: ${error.message}`, true);
  } finally {
    $("saveAccount").disabled = false;
  }
});

$("accountForm").addEventListener("reset", event => {
  event.preventDefault();

  if (savedProfile) {
    populate(savedProfile);
    status("Unsaved changes discarded.");
  }
});

setAvatar(animalPreset("koala"));
