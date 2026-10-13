
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

const defaults = {
  version: 2,
  mode: "animal",
  animal: "koala",
  characterName: "",
  primaryColor: "#b88860",
  secondaryColor: "#f2d6b3",
  expression: "happy",
  pattern: "none",
  headwear: "none",
  eyewear: "none",
  earrings: "none",
  neckwear: "none",
  extra: "none",
  outfit: "hoodie",
  outfitColor: "#7895b2",
  trimColor: "#ffffff",
  backgroundPreset: "sunset"
};

let avatar = { ...defaults };
let category = "australia";
let currentUser = null;
let savedProfile = null;
let ready = false;

const random = a => a[Math.floor(Math.random() * a.length)];

const safeColor = (s, backup) =>
  /^#[\da-f]{6}$/i.test(s || "") ? s : backup;

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

function shape(a) {
  let ear = "";

  switch (a.animal) {
    case "koala":
      ear = '<circle cx="64" cy="91" r="30"/><circle cx="196" cy="91" r="30"/>';
      break;
    case "rabbit":
      ear = '<ellipse cx="91" cy="59" rx="19" ry="53"/><ellipse cx="169" cy="59" rx="19" ry="53"/>';
      break;
    case "kangaroo":
    case "fox":
    case "cat":
    case "redpanda":
      ear = '<path d="M66 107 63 35 111 81ZM194 107 197 35 149 81Z"/>';
      break;
    case "dog":
      ear = '<ellipse cx="68" cy="111" rx="25" ry="42" transform="rotate(24 68 111)"/><ellipse cx="192" cy="111" rx="25" ry="42" transform="rotate(-24 192 111)"/>';
      break;
    case "platypus":
      ear = '<ellipse cx="64" cy="104" rx="22" ry="15"/><ellipse cx="196" cy="104" rx="22" ry="15"/>';
      break;
    case "echidna":
      ear = '<path d="M57 139 42 75 75 91 81 47 111 86 136 39 151 87 190 53 184 99 219 81 199 144Z"/>';
      break;
    case "penguin":
    case "emu":
    case "kookaburra":
    case "parrot":
      ear = '<path d="M108 84 129 46 151 84Z"/>';
      break;
    case "hamster":
    case "guineapig":
    case "wombat":
    case "quokka":
    case "capybara":
    case "panda":
    case "tasdevil":
      ear = '<circle cx="72" cy="90" r="22"/><circle cx="188" cy="90" r="22"/>';
      break;
    default:
      ear = '<circle cx="70" cy="92" r="20"/><circle cx="190" cy="92" r="20"/>';
  }

  return ear;
}

function face(a) {
  const eye = a.expression === "sleepy"
    ? '<path d="M91 137q12 10 24 0M145 137q12 10 24 0" fill="none" stroke="#283040" stroke-width="5" stroke-linecap="round"/>'
    : a.expression === "excited"
      ? '<path d="M91 140l12-12 12 12m30 0 12-12 12 12" fill="none" stroke="#283040" stroke-width="5" stroke-linecap="round"/>'
      : '<ellipse cx="104" cy="136" rx="5" ry="7" fill="#283040"/><ellipse cx="156" cy="136" rx="5" ry="7" fill="#283040"/>';

  const mouth = a.expression === "curious"
    ? '<circle cx="130" cy="169" r="8" fill="#283040"/>'
    : a.expression === "cheeky"
      ? '<path d="M117 165q13 15 26 0" fill="none" stroke="#283040" stroke-width="4"/><path d="M130 170q9 20 16 0" fill="#e88a99"/>'
      : '<path d="M115 166q15 17 30 0" fill="none" stroke="#283040" stroke-width="4" stroke-linecap="round"/>';

  const bill = [
    "platypus",
    "kookaburra",
    "emu",
    "parrot",
    "penguin"
  ].includes(a.animal)
    ? '<ellipse cx="130" cy="156" rx="25" ry="12" fill="#e6a85c"/>'
    : '<ellipse cx="130" cy="156" rx="9" ry="6" fill="#423c42"/>';

  return `
    <ellipse cx="130" cy="156" rx="45" ry="30" fill="${a.secondaryColor}"/>
    ${eye}
    ${bill}
    ${mouth}
    ${a.pattern === "blush"
      ? '<ellipse cx="78" cy="157" rx="15" ry="7" fill="#e995a2" opacity=".7"/><ellipse cx="182" cy="157" rx="15" ry="7" fill="#e995a2" opacity=".7"/>'
      : ""}
  `;
}

function outfit(a) {
  if (a.outfit === "none") return "";

  let base = `<path d="M77 214q53-32 106 0l19 46H58Z" fill="${a.outfitColor}" stroke="#343949" stroke-width="3"/>`;

  if (a.outfit === "hoodie") {
    base += `<path d="M99 214q31 33 62 0M106 234l-3 16m54-16 3 16" fill="none" stroke="${a.trimColor}" stroke-width="5"/>`;
  }

  if (["suit", "denim", "coat"].includes(a.outfit)) {
    base += `<path d="M109 210 130 245 151 210 141 210 130 226 119 210Z" fill="${a.trimColor}"/>`;
  }

  if (a.outfit === "jersey") {
    base += '<text x="130" y="252" font-size="25" text-anchor="middle" fill="white" font-weight="bold">07</text>';
  }

  if (a.outfit === "astronaut") {
    base += `<rect x="111" y="229" width="38" height="22" rx="5" fill="${a.trimColor}"/><circle cx="120" cy="240" r="4" fill="#67c3a5"/>`;
  }

  if (a.outfit === "wizard") {
    base += '<path d="M68 217 130 245 192 217 207 260H53Z" fill="#6c57a5"/>';
  }

  if (["tshirt", "sweater"].includes(a.outfit)) {
    base += `<path d="M103 216q27 18 54 0" stroke="${a.trimColor}" stroke-width="6" fill="none"/>`;
  }

  return base;
}

function accessories(a) {
  let s = "";

  if (a.extra === "wings") {
    s += '<path d="M80 209Q17 149 40 225Q13 220 48 250M180 209Q243 149 220 225Q247 220 212 250" fill="#e2d8fa" stroke="#9c89c8" stroke-width="3"/>';
  }

  if (a.extra === "backpack") {
    s += '<rect x="45" y="209" width="25" height="42" rx="8" fill="#a76547"/><rect x="190" y="209" width="25" height="42" rx="8" fill="#a76547"/>';
  }

  if (["scarf", "bandana"].includes(a.neckwear)) {
    s += '<path d="M87 207q43 23 86 0l-8 20-35 10-35-10Z" fill="#e67e83"/><path d="M151 220 166 254 144 248" fill="#e67e83"/>';
  }

  if (a.neckwear === "bowtie") {
    s += '<path d="M130 222 108 211 108 233ZM130 222 152 211 152 233Z" fill="#db6778"/><circle cx="130" cy="222" r="5" fill="#f6c75d"/>';
  }

  if (a.neckwear === "necklace") {
    s += '<path d="M103 206q27 41 54 0" stroke="#e8bc50" stroke-width="4" fill="none"/><circle cx="130" cy="232" r="6" fill="#e8bc50"/>';
  }

  if (a.earrings !== "none") {
    s += a.earrings === "hoops"
      ? '<circle cx="59" cy="166" r="9" fill="none" stroke="#e8bb4b" stroke-width="4"/><circle cx="201" cy="166" r="9" fill="none" stroke="#e8bb4b" stroke-width="4"/>'
      : '<circle cx="59" cy="166" r="5" fill="#e8bb4b"/><circle cx="201" cy="166" r="5" fill="#e8bb4b"/>';
  }

  if (a.eyewear !== "none") {
    const lens = a.eyewear === "sunglasses" ? "#313e53" : "none";
    const radius = ["round", "heart", "star"].includes(a.eyewear) ? 14 : 3;

    s += `
      <rect x="85" y="123" width="38" height="29" rx="${radius}" fill="${lens}" stroke="#343949" stroke-width="4"/>
      <rect x="137" y="123" width="38" height="29" rx="${radius}" fill="${lens}" stroke="#343949" stroke-width="4"/>
      <path d="M123 135h14M85 132l-18-5m108 5 18-5" stroke="#343949" stroke-width="4" fill="none"/>
    `;
  }

  if (a.headwear === "beanie") {
    s += '<path d="M72 100q5-62 58-62t58 62Z" fill="#d67c8c"/><rect x="68" y="92" width="124" height="17" rx="8" fill="#b65e78"/><circle cx="130" cy="38" r="10" fill="#f5c46e"/>';
  }

  if (a.headwear === "cap") {
    s += '<path d="M70 96q10-60 60-60t60 60Z" fill="#6597c8"/><path d="M105 94q80-10 107 9-45 16-107 0Z" fill="#4775a4"/>';
  }

  if (a.headwear === "bucket") {
    s += '<path d="M82 51h96l10 52H72Z" fill="#d5a46d"/><ellipse cx="130" cy="102" rx="79" ry="12" fill="#bd8e5a"/>';
  }

  if (a.headwear === "crown") {
    s += '<path d="M76 97 68 47 101 69 130 33 159 69 192 47 184 97Z" fill="#f5cc60" stroke="#c69b3d" stroke-width="3"/><circle cx="130" cy="77" r="6" fill="#d9638a"/>';
  }

  if (a.headwear === "bow") {
    s += '<path d="M126 82 86 60 86 99ZM134 82 174 60 174 99Z" fill="#e78b9b"/><circle cx="130" cy="82" r="9" fill="#ce6479"/>';
  }

  if (a.headwear === "headphones") {
    s += '<path d="M62 125q0-84 68-84t68 84" fill="none" stroke="#475a78" stroke-width="12"/><rect x="51" y="114" width="21" height="39" rx="9" fill="#7895b2"/><rect x="188" y="114" width="21" height="39" rx="9" fill="#7895b2"/>';
  }

  if (a.headwear === "flower") {
    s += '<g transform="translate(79 81)"><circle r="9" fill="#f5ca57"/>'
      + [0, 60, 120, 180, 240, 300].map(d =>
        `<ellipse transform="rotate(${d})" cx="0" cy="-15" rx="8" ry="12" fill="#f4a9c4"/>`
      ).join("")
      + "</g>";
  }

  if (a.headwear === "party") {
    s += '<path d="M103 98 142 25 163 98Z" fill="#9e8de0"/><circle cx="142" cy="25" r="8" fill="#f5c45c"/>';
  }

  if (a.extra === "sparkles") {
    s += '<text x="28" y="80" font-size="24" fill="#f2c65b">✦</text><text x="208" y="188" font-size="24" fill="#f2c65b">✦</text>';
  }

  return s;
}

function svgAvatar(raw) {
  const a = { ...defaults, ...raw };

  for (const key of ["primaryColor", "secondaryColor", "outfitColor", "trimColor"]) {
    a[key] = safeColor(a[key], defaults[key]);
  }

  const bgs = {
    sunset: ["#ffe2c8", "#f3b8ce"],
    sky: ["#d4f1ff", "#a6c8f1"],
    forest: ["#d4eccc", "#9dcaad"],
    lavender: ["#eee1ff", "#c9b8f2"],
    sand: ["#f7e6c9", "#e8caa2"],
    plain: ["#f2f4f8", "#f2f4f8"]
  };

  const [b1, b2] = bgs[a.backgroundPreset] || bgs.sunset;

  const pattern = a.pattern === "spots"
    ? `<circle cx="81" cy="121" r="9" fill="${a.secondaryColor}"/><circle cx="180" cy="108" r="7" fill="${a.secondaryColor}"/>`
    : a.pattern === "stripe"
      ? `<path d="M111 85v18m19-22v22m19-18v18" stroke="${a.secondaryColor}" stroke-width="7" stroke-linecap="round"/>`
      : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" role="img" aria-label="${escapeText(a.animal)} character">
      <defs>
        <linearGradient id="avatarBg" x2="1" y2="1">
          <stop stop-color="${b1}"/>
          <stop offset="1" stop-color="${b2}"/>
        </linearGradient>
      </defs>
      <rect width="260" height="260" rx="30" fill="url(#avatarBg)"/>
      <g fill="${a.primaryColor}" stroke="#514c53" stroke-width="3">
        ${shape(a)}
        <ellipse cx="130" cy="146" rx="76" ry="75"/>
      </g>
      ${pattern}
      ${face(a)}
      ${outfit(a)}
      ${accessories(a)}
    </svg>
  `;
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
    b.setAttribute("aria-pressed", String(avatar.animal === id));
    b.innerHTML = svgAvatar({ ...defaults, animal: id }) + `<span>${escapeText(label)}</span>`;

    b.addEventListener("click", () => {
      avatar.animal = id;
      grid();
      render();
    });

    $("animalGrid").append(b);
  }
}

function setAvatar(a) {
  avatar = { ...defaults, ...a };

  if (a && a.version !== 2) {
    avatar = {
      ...defaults,
      animal: a.animal || "koala",
      primaryColor: a.color || defaults.primaryColor,
      headwear: a.hat ? "cap" : "none",
      eyewear: a.glasses ? "sunglasses" : "none",
      earrings: a.earrings ? "studs" : "none"
    };
  }

  for (const id of ids) {
    $(id).value = avatar[id] ?? defaults[id];
  }

  category = Object.keys(categories).find(k =>
    categories[k].some(([id]) => id === avatar.animal)
  ) || "australia";

  document.querySelectorAll("[data-category]").forEach(b => {
    b.classList.toggle("selected", b.dataset.category === category);
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
      x.setAttribute("aria-selected", String(x === b));
    });

    document.querySelectorAll(".account-panel").forEach(p => {
      p.hidden = p.id !== `panel-${b.dataset.tab}`;
      p.classList.toggle("active", !p.hidden);
    });
  });
});

$("randomAvatar").addEventListener("click", () => {
  const animals = Object.values(categories).flat();

  avatar = {
    ...defaults,
    animal: random(animals)[0],
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

$("resetAvatar").addEventListener("click", () => setAvatar(defaults));

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
    avatar: { ...defaults }
  };
}

function populate(p) {
  $("username").value = p.username || "";
  $("name").value = p.fullName || "";
  $("email").value = currentUser?.email || "";
  $("birthYear").value = p.birthYear ? String(p.birthYear) : "";
  $("birthYear").dispatchEvent(new Event("change"));
  $("gender").value = p.gender || "";

  document.querySelector(
    `input[name="visibility"][value="${p.visibility === "public" ? "public" : "private"}"]`
  ).checked = true;

  for (const [id, key] of [
    ["show_email", "showEmail"],
    ["allow_messages", "allowMessages"],
    ["search_visible", "searchVisible"],
    ["email_notifications", "emailNotifications"]
  ]) {
    $(id).checked = p[key] === true;
  }

  setAvatar(p.avatar || defaults);
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
    status(`Unable to load profile: ${e.code || e.message}`, true);
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
    status("Enter a username and select a birth year.", true);
    return;
  }

  const p = {
    uid: currentUser.uid,
    username,
    fullName: $("name").value.trim(),
    birthYear,
    gender: $("gender").value,
    visibility: document.querySelector('input[name="visibility"]:checked').value,
    showEmail: $("show_email").checked,
    allowMessages: $("allow_messages").checked,
    searchVisible: $("search_visible").checked,
    emailNotifications: $("email_notifications").checked,
    avatar: {
      ...avatar,
      mode: "animal",
      version: 2
    },
    createdAt: savedProfile?.createdAt || serverTimestamp(),
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
        ? "Profile saved, but read-back failed: " + (err.code || err.message)
        : "Unable to save profile: " + (err.code || err.message),
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

setAvatar(defaults);
