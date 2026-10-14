
import { registerUser } from "./auth.js";

const form = document.getElementById("registerForm");
const steps = [...document.querySelectorAll(".register-step")];
const indicators = [...document.querySelectorAll(".progress-step")];

const previousButton = document.getElementById("previousStep");
const nextButton = document.getElementById("nextStep");
const submitButton = document.getElementById("submitRegistration");
const message = document.getElementById("message");

const interestOptions = document.getElementById("interestOptions");
const interestSearch = document.getElementById("interestSearch");
const interestCount = document.getElementById("interestCount");

const selectedInterests = new Set();

let currentStep = 0;

const mbtiDescriptions = {
  ISTJ: "Practical, organised and detail-oriented.",
  ISFJ: "Supportive, thoughtful and dependable.",
  INFJ: "Reflective, values-driven and insightful.",
  INTJ: "Independent, strategic and analytical.",
  ISTP: "Practical, adaptable and observant.",
  ISFP: "Flexible, gentle and experience-oriented.",
  INFP: "Imaginative, idealistic and reflective.",
  INTP: "Curious, analytical and idea-focused.",
  ESTP: "Action-oriented, adaptable and spontaneous.",
  ESFP: "Expressive, sociable and experience-oriented.",
  ENFP: "Enthusiastic, imaginative and possibility-focused.",
  ENTP: "Exploratory, inventive and debate-oriented.",
  ESTJ: "Structured, decisive and practical.",
  ESFJ: "Cooperative, attentive and community-minded.",
  ENFJ: "Encouraging, people-focused and organised.",
  ENTJ: "Strategic, decisive and goal-oriented."
};

const interestCategories = {
  "Creative": [
    "Art", "Painting", "Pottery", "Photography",
    "Music", "Dance", "Ballet"
  ],
  "Sports & Outdoors": [
    "Running", "Walking", "Hiking", "Cycling",
    "Swimming", "Yoga", "Boxing", "Football",
    "Netball", "Fencing", "Horse Back Riding"
  ],
  "Social & Leisure": [
    "Gaming", "Board Games", "Chess", "Anime",
    "Movies", "Reading", "Museums", "Markets",
    "Coffee", "Eating", "Cooking", "Gardening"
  ]
};

const mbtiSelect = document.getElementById("mbti");

Object.entries(mbtiDescriptions).forEach(([type]) => {
  const option = document.createElement("option");
  option.value = type;
  option.textContent = type;
  mbtiSelect.appendChild(option);
});

mbtiSelect.addEventListener("change", () => {
  document.getElementById("mbtiDescription").textContent =
    mbtiDescriptions[mbtiSelect.value] ||
    "MBTI is optional. You can update this later.";
});

function renderInterests() {
  interestOptions.replaceChildren();

  const search = interestSearch.value.trim().toLowerCase();

  Object.entries(interestCategories).forEach(([category, interests]) => {
    const matches = interests.filter(interest =>
      interest.toLowerCase().includes(search)
    );

    if (!matches.length) return;

    const group = document.createElement("div");
    group.className = "interest-group";

    const heading = document.createElement("h3");
    heading.textContent = category;
    group.appendChild(heading);

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

      options.appendChild(button);
    });

    group.appendChild(options);
    interestOptions.appendChild(group);
  });

  interestCount.textContent =
    `${selectedInterests.size} interest${selectedInterests.size === 1 ? "" : "s"} selected`;
}

interestSearch.addEventListener("input", renderInterests);

function showStep(index) {
  currentStep = index;
  message.textContent = "";

  steps.forEach((step, position) => {
    step.classList.toggle("hidden", position !== index);
  });

  indicators.forEach((indicator, position) => {
    indicator.classList.toggle("active", position <= index);
  });

  previousButton.classList.toggle("hidden", index === 0);
  nextButton.classList.toggle("hidden", index === steps.length - 1);
  submitButton.classList.toggle("hidden", index !== steps.length - 1);
}

function validateStep() {
  if (currentStep === 0) {
    const fields = steps[0].querySelectorAll(
      "input[required], select[required]"
    );

    for (const field of fields) {
      if (!field.reportValidity()) return false;
    }

    const password = document.getElementById("password").value;
    const confirmation = document.getElementById("confirmPassword").value;

    if (password !== confirmation) {
      message.textContent = "Your passwords do not match.";
      return false;
    }
  }

  if (currentStep === 1) {
    if (!document.getElementById("persona").reportValidity()) {
      return false;
    }
  }

  if (currentStep === 2 && selectedInterests.size === 0) {
    message.textContent = "Please select at least one interest.";
    return false;
  }

  if (currentStep === 3) {
    if (!document.getElementById("suburb").reportValidity()) {
      return false;
    }
  }

  message.textContent = "";
  return true;
}

nextButton.addEventListener("click", () => {
  if (!validateStep()) return;

  if (currentStep < steps.length - 1) {
    showStep(currentStep + 1);
  }
});

previousButton.addEventListener("click", () => {
  if (currentStep > 0) {
    showStep(currentStep - 1);
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!validateStep()) return;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const profile = {
    username: document.getElementById("username").value.trim(),
    fullName: document.getElementById("fullName").value.trim(),
    birthYear: Number(document.getElementById("birthYear").value),
    gender: document.getElementById("gender").value,
    persona: document.getElementById("persona").value,
    mbti: mbtiSelect.value,
    interests: [...selectedInterests],
    suburb: document.getElementById("suburb").value.trim(),
    preference: document.getElementById("preference").value,
    visibility: document.getElementById("visibility").value,
    searchVisible: document.getElementById("searchVisible").checked,
    showSuburb: document.getElementById("showSuburb").checked
  };

  submitButton.disabled = true;
  submitButton.textContent = "Creating account...";
  message.textContent = "";

  try {
    await registerUser(email, password, profile);
    window.location.replace("index.html");
  } catch (error) {
    console.error(error);
    message.textContent = error.message || "Registration failed.";
    submitButton.disabled = false;
    submitButton.textContent = "Create Account";
  }
});

renderInterests();
showStep(0);
