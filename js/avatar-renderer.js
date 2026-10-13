
const animalDefaults = {
  koala: ["#92979c", "#e2e4e5", "hoodie", "#75a78a", "forest"],
  kangaroo: ["#b77b4d", "#eac8a4", "jersey", "#d6a83b", "sand"],
  wombat: ["#8d817b", "#d2c3b8", "denim", "#6489b4", "sky"],
  quokka: ["#b98a59", "#f2d5af", "sweater", "#dfa6b8", "sunset"],
  platypus: ["#937257", "#c8a17c", "hoodie", "#5faeaa", "sky"],
  kookaburra: ["#b5a18a", "#f1e4d3", "none", "#7895b2", "forest"],
  echidna: ["#86664e", "#d6b998", "sweater", "#bd876d", "sand"],
  tasdevil: ["#424047", "#f1ede9", "hoodie", "#a277bc", "lavender"],
  emu: ["#867262", "#c5ad93", "jersey", "#84a1be", "sand"],
  dog: ["#d6a16a", "#f4d9b6", "hoodie", "#88acd2", "sky"],
  cat: ["#e5b17d", "#f9e5cd", "sweater", "#b89acd", "lavender"],
  rabbit: ["#e9dfd5", "#f5b7c5", "hoodie", "#dda7bc", "sunset"],
  hamster: ["#d8ad75", "#f9e8cf", "tshirt", "#91bda2", "forest"],
  guineapig: ["#ac7858", "#f5e4ce", "sweater", "#d6a16a", "sand"],
  parrot: ["#68ad77", "#f1ce65", "tshirt", "#e38d76", "forest"],
  redpanda: ["#c9794c", "#f5d6b1", "hoodie", "#7798b5", "forest"],
  penguin: ["#353b48", "#ffffff", "sweater", "#8ba9d5", "sky"],
  fox: ["#d68149", "#f8e7d1", "denim", "#7195b7", "sunset"],
  capybara: ["#a47a58", "#d7b694", "hoodie", "#88a98c", "forest"],
  panda: ["#35363b", "#f6f5f0", "hoodie", "#a8b7d8", "lavender"]
};

export function animalPreset(id) {
  const v = animalDefaults[id] || animalDefaults.koala;

  return {
    version: 2,
    mode: "animal",
    animal: id,
    characterName: "",
    primaryColor: v[0],
    secondaryColor: v[1],
    expression: "happy",
    pattern: "none",
    headwear: "none",
    eyewear: "none",
    earrings: "none",
    neckwear: id === "kookaburra" ? "scarf" : "none",
    extra: "none",
    outfit: v[2],
    outfitColor: v[3],
    trimColor: "#ffffff",
    backgroundPreset: v[4]
  };
}

const P = (d, fill = "currentColor", other = "") =>
  `<path d="${d}" fill="${fill}" ${other}/>`;

function species(a) {
  const c = a.primaryColor;
  const s = a.secondaryColor;

  const oval = (x, y, rx, ry, fill = c) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="#514c53" stroke-width="2.5"/>`;

  const ears = (rx = 22, ry = 26, y = 90) =>
    oval(70, y, rx, ry) + oval(190, y, rx, ry);

  const head = (rx = 76, ry = 73, y = 144) =>
    oval(130, y, rx, ry);

  switch (a.animal) {
    case "koala":
      return (
        ears(33, 36, 91) +
        oval(70, 91, 20, 23, s) +
        oval(190, 91, 20, 23, s) +
        head(75, 73) +
        oval(130, 162, 18, 26, "#34353b")
      );

    case "kangaroo":
      return (
        P(
          "M65 119 66 30 111 90ZM195 119 194 30 149 90Z",
          c,
          'stroke="#514c53" stroke-width="3"'
        ) +
        P(
          "M76 97 78 54 105 95ZM184 97 182 54 155 95Z",
          s
        ) +
        head(70, 76) +
        oval(130, 166, 38, 27, s)
      );

    case "wombat":
      return (
        ears(23, 19, 96) +
        head(83, 68, 148) +
        oval(130, 166, 45, 30, s) +
        oval(130, 151, 12, 9, "#3b3540")
      );

    case "quokka":
      return (
        ears(19, 23, 94) +
        head(71, 72) +
        oval(130, 167, 39, 28, s) +
        oval(130, 151, 9, 7, "#44363b")
      );

    case "platypus":
      return (
        oval(66, 111, 24, 14) +
        oval(194, 111, 24, 14) +
        head(77, 65) +
        oval(130, 166, 45, 17, "#d69c63") +
        P(
          "M89 168Q130 187 171 168",
          "none",
          'stroke="#a86d3c" stroke-width="3"'
        )
      );

    case "kookaburra":
      return (
        P("M104 88 129 46 153 89Z", c) +
        head(67, 75) +
        P(
          "M67 116Q130 86 193 116L180 146Q130 127 80 146Z",
          s
        ) +
        P("M119 152 175 165 119 172Z", "#d6a052")
      );

    case "echidna":
      return (
        P(
          "M54 163 36 118 63 124 50 84 82 100 84 53 110 85 132 42 149 85 184 57 184 101 216 86 201 129 226 147 196 171Z",
          s,
          'stroke="#514c53" stroke-width="3"'
        ) +
        head(70, 63, 151) +
        P(
          "M125 154Q169 147 186 170Q163 183 126 166Z",
          s
        ) +
        oval(182, 168, 5, 4, "#38363c")
      );

    case "tasdevil":
      return (
        ears(22, 25, 92) +
        head(76, 72) +
        P(
          "M76 171Q130 141 184 171L171 184Q130 165 89 184Z",
          s
        ) +
        oval(130, 151, 11, 8, "#25252b")
      );

    case "emu":
      return (
        P(
          "M109 100 116 48 133 75 149 42 157 100Z",
          c
        ) +
        head(53, 78, 143) +
        P("M123 153 177 163 123 170Z", "#9c8068")
      );

    case "dog":
      return (
        oval(59, 126, 22, 44) +
        oval(201, 126, 22, 44) +
        head(74, 72) +
        oval(130, 162, 41, 32, s) +
        oval(130, 151, 12, 9, "#3b3438")
      );

    case "cat":
      return (
        P(
          "M61 116 61 43 113 91ZM199 116 199 43 147 91Z",
          c,
          'stroke="#514c53" stroke-width="3"'
        ) +
        P(
          "M76 90 77 63 101 91ZM184 90 183 63 159 91Z",
          "#e9a6a9"
        ) +
        head(73, 71) +
        P(
          "M93 163l-30-8m30 15-30 4m104-11 30-8m-30 15 30 4",
          "none",
          'stroke="#514c53" stroke-width="2.5"'
        )
      );

    case "rabbit":
      return (
        oval(91, 61, 19, 54) +
        oval(169, 61, 19, 54) +
        oval(91, 61, 9, 42, s) +
        oval(169, 61, 9, 42, s) +
        head(72, 72) +
        oval(130, 164, 35, 24, s)
      );

    case "hamster":
      return (
        ears(22, 24, 95) +
        head(79, 69) +
        oval(82, 160, 24, 20, s) +
        oval(178, 160, 24, 20, s) +
        oval(130, 161, 28, 20, s)
      );

    case "guineapig":
      return (
        ears(18, 19, 101) +
        head(83, 66) +
        P(
          "M65 124Q80 91 110 103Q114 125 95 145Z",
          s
        ) +
        oval(130, 162, 36, 24, s)
      );

    case "parrot":
      return (
        P("M100 88 130 40 158 89Z", c) +
        head(64, 76) +
        oval(91, 146, 15, 26, s) +
        P(
          "M125 149 160 155 137 177 122 169Z",
          "#efb35b"
        )
      );

    case "redpanda":
      return (
        P(
          "M60 111 64 48 111 86ZM200 111 196 48 149 86Z",
          c,
          'stroke="#514c53" stroke-width="3"'
        ) +
        head(74, 70) +
        P(
          "M68 131 104 119 117 145 94 163 73 156ZM192 131 156 119 143 145 166 163 187 156Z",
          s
        ) +
        oval(130, 170, 30, 19, s)
      );

    case "penguin":
      return (
        head(71, 83, 141) +
        oval(130, 164, 49, 54, s) +
        P(
          "M120 151 152 159 120 170Z",
          "#e6a45a"
        )
      );

    case "fox":
      return (
        P(
          "M58 116 59 35 112 89ZM202 116 201 35 148 89Z",
          c,
          'stroke="#514c53" stroke-width="3"'
        ) +
        P(
          "M75 92 77 57 102 91ZM185 92 183 57 158 91Z",
          s
        ) +
        head(73, 70) +
        P(
          "M63 155 111 146 130 166 149 146 197 155 164 191 130 174 96 191Z",
          s
        )
      );

    case "capybara":
      return (
        ears(15, 14, 99) +
        head(83, 67, 148) +
        oval(130, 162, 39, 23, s) +
        oval(130, 153, 11, 7, "#493d38")
      );

    case "panda":
      return (
        ears(25, 27, 91) +
        head(74, 73, 145) +
        oval(101, 137, 18, 22, c) +
        oval(159, 137, 18, 22, c) +
        oval(130, 167, 38, 27, s)
      );

    default:
      return ears() + head();
  }
}

function face(a) {
  const x = a.expression;

  const eyes =
    x === "sleepy"
      ? '<path d="M92 136q12 10 24 0m28 0q12 10 24 0" fill="none" stroke="#252b36" stroke-width="4" stroke-linecap="round"/>'
      : x === "excited"
        ? '<path d="M93 142l11-12 11 12m30 0 11-12 11 12" fill="none" stroke="#252b36" stroke-width="4" stroke-linecap="round"/>'
        : '<ellipse cx="104" cy="137" rx="4.5" ry="6.5" fill="#252b36"/><ellipse cx="156" cy="137" rx="4.5" ry="6.5" fill="#252b36"/>';

  const nose = [
    "platypus",
    "parrot",
    "kookaburra",
    "emu",
    "penguin",
    "echidna"
  ].includes(a.animal)
    ? ""
    : '<ellipse cx="130" cy="155" rx="6" ry="4" fill="#36323a"/>';

  const mouth =
    x === "curious"
      ? '<circle cx="130" cy="174" r="7" fill="#36323a"/>'
      : x === "cheeky"
        ? '<path d="M118 171q12 13 24 0" fill="none" stroke="#36323a" stroke-width="3"/><path d="M130 175q8 12 14 0" fill="#e78b9c"/>'
        : '<path d="M118 171q12 12 24 0" fill="none" stroke="#36323a" stroke-width="3" stroke-linecap="round"/>';

  return eyes + nose + mouth;
}

function outfit(a) {
  if (a.outfit === "none") return "";

  let s = `
    <path
      d="M77 214Q130 184 183 214L203 260H57Z"
      fill="${a.outfitColor}"
      stroke="#454552"
      stroke-width="3"
    />
  `;

  if (a.outfit === "hoodie") {
    s += `
      <path
        d="M100 214Q130 247 160 214M108 233v18m44-18v18"
        fill="none"
        stroke="${a.trimColor}"
        stroke-width="5"
      />
    `;
  }

  if (["suit", "denim", "coat"].includes(a.outfit)) {
    s += `
      <path
        d="M105 210 130 247 155 210 143 211 130 227 117 211Z"
        fill="${a.trimColor}"
      />
    `;
  }

  if (a.outfit === "jersey") {
    s += `
      <text
        x="130"
        y="253"
        text-anchor="middle"
        font-size="23"
        font-weight="bold"
        fill="white"
      >07</text>
    `;
  }

  if (a.outfit === "astronaut") {
    s += `
      <rect
        x="111"
        y="229"
        width="38"
        height="23"
        rx="5"
        fill="${a.trimColor}"
      />
      <circle cx="120" cy="240" r="4" fill="#67c3a5"/>
    `;
  }

  if (a.outfit === "wizard") {
    s += `
      <path
        d="M68 217 130 245 192 217 207 260H53Z"
        fill="#7055aa"
      />
    `;
  }

  if (["tshirt", "sweater"].includes(a.outfit)) {
    s += `
      <path
        d="M103 216q27 18 54 0"
        stroke="${a.trimColor}"
        stroke-width="6"
        fill="none"
      />
    `;
  }

  return s;
}

function accessories(a) {
  let s = "";

  if (a.extra === "wings") {
    s += `
      <path
        d="M80 209Q17 149 40 225Q13 220 48 250M180 209Q243 149 220 225Q247 220 212 250"
        fill="#e2d8fa"
        stroke="#9c89c8"
        stroke-width="3"
      />
    `;
  }

  if (a.extra === "backpack") {
    s += `
      <rect x="45" y="209" width="25" height="42" rx="8" fill="#a76547"/>
      <rect x="190" y="209" width="25" height="42" rx="8" fill="#a76547"/>
    `;
  }

  if (["scarf", "bandana"].includes(a.neckwear)) {
    s += `
      <path d="M87 207q43 23 86 0l-8 20-35 10-35-10Z" fill="#e67e83"/>
      <path d="M151 220 166 254 144 248" fill="#e67e83"/>
    `;
  }

  if (a.neckwear === "bowtie") {
    s += `
      <path d="M130 222 108 211 108 233ZM130 222 152 211 152 233Z" fill="#db6778"/>
      <circle cx="130" cy="222" r="5" fill="#f6c75d"/>
    `;
  }

  if (a.neckwear === "necklace") {
    s += `
      <path
        d="M103 206q27 41 54 0"
        stroke="#e8bc50"
        stroke-width="4"
        fill="none"
      />
      <circle cx="130" cy="232" r="6" fill="#e8bc50"/>
    `;
  }

  if (a.earrings !== "none") {
    s += a.earrings === "hoops"
      ? `
        <circle cx="59" cy="166" r="9" fill="none" stroke="#e8bb4b" stroke-width="4"/>
        <circle cx="201" cy="166" r="9" fill="none" stroke="#e8bb4b" stroke-width="4"/>
      `
      : `
        <circle cx="59" cy="166" r="5" fill="#e8bb4b"/>
        <circle cx="201" cy="166" r="5" fill="#e8bb4b"/>
      `;
  }

  if (a.eyewear !== "none") {
    const lens =
      a.eyewear === "sunglasses" ? "#313e53" : "none";

    const r = ["round", "heart", "star"].includes(a.eyewear)
      ? 14
      : 3;

    s += `
      <rect x="85" y="123" width="38" height="29" rx="${r}" fill="${lens}" stroke="#343949" stroke-width="4"/>
      <rect x="137" y="123" width="38" height="29" rx="${r}" fill="${lens}" stroke="#343949" stroke-width="4"/>
      <path d="M123 135h14M85 132l-18-5m108 5 18-5" stroke="#343949" stroke-width="4" fill="none"/>
    `;
  }

  if (a.headwear === "beanie") {
    s += `
      <path d="M72 100q5-62 58-62t58 62Z" fill="#d67c8c"/>
      <rect x="68" y="92" width="124" height="17" rx="8" fill="#b65e78"/>
      <circle cx="130" cy="38" r="10" fill="#f5c46e"/>
    `;
  }

  if (a.headwear === "cap") {
    s += `
      <path d="M70 96q10-60 60-60t60 60Z" fill="#6597c8"/>
      <path d="M105 94q80-10 107 9-45 16-107 0Z" fill="#4775a4"/>
    `;
  }

  if (a.headwear === "bucket") {
    s += `
      <path d="M82 51h96l10 52H72Z" fill="#d5a46d"/>
      <ellipse cx="130" cy="102" rx="79" ry="12" fill="#bd8e5a"/>
    `;
  }

  if (a.headwear === "crown") {
    s += `
      <path d="M76 97 68 47 101 69 130 33 159 69 192 47 184 97Z" fill="#f5cc60" stroke="#c69b3d" stroke-width="3"/>
      <circle cx="130" cy="77" r="6" fill="#d9638a"/>
    `;
  }

  if (a.headwear === "bow") {
    s += `
      <path d="M126 82 86 60 86 99ZM134 82 174 60 174 99Z" fill="#e78b9b"/>
      <circle cx="130" cy="82" r="9" fill="#ce6479"/>
    `;
  }

  if (a.headwear === "headphones") {
    s += `
      <path d="M62 125q0-84 68-84t68 84" fill="none" stroke="#475a78" stroke-width="12"/>
      <rect x="51" y="114" width="21" height="39" rx="9" fill="#7895b2"/>
      <rect x="188" y="114" width="21" height="39" rx="9" fill="#7895b2"/>
    `;
  }

  if (a.headwear === "flower") {
    s += `
      <g transform="translate(79 81)">
        <circle r="9" fill="#f5ca57"/>
        ${[0, 60, 120, 180, 240, 300].map(d => `
          <ellipse
            transform="rotate(${d})"
            cx="0"
            cy="-15"
            rx="8"
            ry="12"
            fill="#f4a9c4"
          />
        `).join("")}
      </g>
    `;
  }

  if (a.headwear === "party") {
    s += `
      <path d="M103 98 142 25 163 98Z" fill="#9e8de0"/>
      <circle cx="142" cy="25" r="8" fill="#f5c45c"/>
    `;
  }

  if (a.extra === "sparkles") {
    s += `
      <text x="28" y="80" font-size="24" fill="#f2c65b">✦</text>
      <text x="208" y="188" font-size="24" fill="#f2c65b">✦</text>
    `;
  }

  return s;
}

export function svgAvatar(raw) {
  const a = {
    ...animalPreset(raw?.animal || "koala"),
    ...raw
  };

  for (const key of [
    "primaryColor",
    "secondaryColor",
    "outfitColor",
    "trimColor"
  ]) {
    if (!/^#[\da-f]{6}$/i.test(a[key] || "")) {
      a[key] = animalPreset(a.animal)[key];
    }
  }

  const backgrounds = {
    sunset: ["#ffe2c8", "#f3b8ce"],
    sky: ["#d4f1ff", "#a6c8f1"],
    forest: ["#d4eccc", "#9dcaad"],
    lavender: ["#eee1ff", "#c9b8f2"],
    sand: ["#f7e6c9", "#e8caa2"],
    plain: ["#f2f4f8", "#f2f4f8"]
  };

  const [b1, b2] =
    backgrounds[a.backgroundPreset] || backgrounds.sunset;

  const gradientId = "bg-" + [
    a.animal,
    a.backgroundPreset,
    b1,
    b2
  ].join("-").replace(/[^a-zA-Z0-9-]/g, "");

  const pattern =
    a.pattern === "spots"
      ? `
        <circle cx="81" cy="121" r="9" fill="${a.secondaryColor}"/>
        <circle cx="180" cy="108" r="7" fill="${a.secondaryColor}"/>
      `
      : a.pattern === "stripe"
        ? `
          <path
            d="M111 85v18m19-22v22m19-18v18"
            stroke="${a.secondaryColor}"
            stroke-width="7"
            stroke-linecap="round"
          />
        `
        : a.pattern === "blush"
          ? `
            <ellipse cx="79" cy="161" rx="15" ry="7" fill="#e995a2" opacity=".7"/>
            <ellipse cx="181" cy="161" rx="15" ry="7" fill="#e995a2" opacity=".7"/>
          `
          : "";

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 260"
      role="img"
      aria-label="Animal avatar"
    >
      <defs>
        <linearGradient id="${gradientId}" x2="1" y2="1">
          <stop stop-color="${b1}"/>
          <stop offset="1" stop-color="${b2}"/>
        </linearGradient>
      </defs>

      <rect
        width="260"
        height="260"
        rx="30"
        fill="url(#${gradientId})"
      />

      ${species(a)}
      ${pattern}
      ${face(a)}
      ${outfit(a)}
      ${accessories(a)}
    </svg>
  `;
}
