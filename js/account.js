
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

const random = a => a[Math.floor(Math.random() * a.length)];

const escapeText = s =>
  String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

function status(message, error = false) {
  $("accountStatus").textContent = message;
  $("accountStatus").style.color = error ? "#a52b22" : "#236c45";
}

function render() {
  $("avatarPreview").innerHTML = svgAvatar(avatar);
  $("profileAvatar").innerHTML = svgAvatar(avatar);
}

function grid() {
  const list = categories[category];

  $("animalGrid").replaceChildren();

  for (const [id, label] of list) {
    const b = document.createElement("button");

    b.type = "button";
    b.className = avatar.animal === id ? "selected" : "";

    b.setAttribute(
      "aria-pressed",
      String(avatar.animal === id)
    );

    b.innerHTML =
      svgAvatar(animalPreset(id)) +
      `<span>${escapeText(label)}</span>`;

    b.addEventListener("click", () => {
      setAvatar(animalPreset(id));
    });

    $("animalGrid").append(b);
  }
}

function setAvatar(a) {
  avatar = {
    ...animalPreset(a?.animal || "koala"),
    ...a
  };

  if (a && a.version !== 2) {
    avatar = {
      ...animalPreset(a.animal || "koala"),
      primaryColor:
        a.color || animalPreset(a.animal || "koala").primaryColor,
      headwear: a.hat ? "cap" : "none",
      eyewear: a.glasses ? "sunglasses" : "none",
      earrings: a.earrings ? "studs" : "none"
    };
  }

  for (const id of ids) {
    $(id).value = avatar[id] ?? defaults[id];
  }

  category =
    Object.keys(categories).find(k =>
      categories[k].some(([id]) => id === avatar.animal)
    ) || "australia";

  document.querySelectorAll("[data-category]").forEach(b => {
    b.classList.toggle(
      "selected",
      b.dataset.category === category
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

document.querySelectorAll("[data-category]").forEach(b => {
  b.addEventListener("click", () => {
    category = b.dataset.category;

    document.querySelectorAll("[data-category]").forEach(x => {
      x.classList.toggle("selected", x === b);
    });

    grid();
  });
});

document.querySelectorAll("[data-tab]").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(x => {
      x.classList.toggle("active", x === b);

      x.setAttribute(
        "aria-selected",
        String(x === b)
      );
    });

    document.querySelectorAll(".account-panel").forEach(p => {
      p.hidden = p.id !== `panel-${b.dataset.tab}`;
      p.classList.toggle("active", !p.hidden);
    });
  });
});

$("randomAvatar").addEventListener("click", () => {
  const animals = Object.values(categories).flat();
  const selectedAnimal = random(animals)[0];

  avatar = {
    ...animalPreset(selectedAnimal),

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

    neckwear: random([
      "none",
      "scarf",
      "bandana",
      "bowtie",
      "necklace"
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
    ]),

    backgroundPreset: random([
      "sunset",
      "sky",
      "forest",
      "lavender",
      "sand",
      "plain"
    ])
  };

  setAvatar(avatar);
});

$("resetAvatar").addEventListener("click", () => {
  setAvatar(animalPreset(avatar.animal));
});

const year = new Date().getFullYear();

for (let y = year; y >= 1900; y--) {
  const o = document.createElement("option");
  o.value = String(y);
  o.textContent = String(y);
  $("birthYear").append(o);
}

$("birthYear").addEventListener("change", () => {
  $("age").textContent = $("birthYear").value
    ? String(year - Number($("birthYear").value))
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

function populate(p) {
  $("username").value = p.username || "";
  $("name").value = p.fullName || "";
  $("email").value = currentUser?.email || "";

  $("birthYear").value = p.birthYear
    ? String(p.birthYear)
    : "";

  $("birthYear").dispatchEvent(new Event("change"));

  $("gender").value = p.gender || "";

  document.querySelector(
    `input[name="visibility"][value="${
      p.visibility === "public" ? "public" : "private"
    }"]`
  ).checked = true;

  for (const [id, key] of [
    ["show_email", "showEmail"],
    ["allow_messages", "allowMessages"],
    ["search_visible", "searchVisible"],
    ["email_notifications", "emailNotifications"]
  ]) {
    $(id).checked = p[key] === true;
  }

  setAvatar(p.avatar || animalPreset("koala"));
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
  } catch (e) {
    console.error("Profile load:", e);

    status(
      `Unable to load profile: ${e.code || e.message}`,
      true
    );
  }
});

$("accountForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!ready || !currentUser) {
    status("Profile is not ready.", true);
    return;
  }

  const username = $("username").value.trim();
  const birthYear = Number($("birthYear").value);

  if (!username || !birthYear) {
    status(
      "Enter a username and select a birth year.",
      true
    );
    return;
  }

  const p = {
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
      mode: "animal",
      version: 2
    },

    createdAt:
      savedProfile?.createdAt || serverTimestamp(),

    updatedAt: serverTimestamp()
  };

  $("saveAccount").disabled = true;
  status("Saving profile...");

  let firestoreSaved = false;

  try {
    const ref = doc(db, "users", currentUser.uid);

    await setDoc(ref, p);
    firestoreSaved = true;

    const snap = await getDoc(ref);
    savedProfile = snap.data();

    try {
      await updateProfile(currentUser, {
        displayName: username
      });

      status("Your profile and avatar have been saved.");
    } catch (err) {
      console.error("Display name:", err);

      status(
        "Firestore profile saved; login display name update failed.",
        true
      );
    }
  } catch (err) {
    console.error("Profile save:", err);

    status(
      firestoreSaved
        ? "Profile saved, but read-back failed: " +
          (err.code || err.message)
        : "Unable to save profile: " +
          (err.code || err.message),
      true
    );
  } finally {
    $("saveAccount").disabled = false;
  }
});

$("accountForm").addEventListener("reset", e => {
  e.preventDefault();

  if (savedProfile) {
    populate(savedProfile);
    status("Unsaved changes discarded.");
  }
});

setAvatar(animalPreset("koala"));
