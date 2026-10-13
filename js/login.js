
import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const $ = id => document.getElementById(id);

const loginForm = $("loginForm");
const emailInput = $("email");
const passwordInput = $("password");
const loginButton = $("loginButton");
const loginMessage = $("loginMessage");

function showMessage(text) {
  if (loginMessage) {
    loginMessage.textContent = text;
  }
}

function redirectAfterLogin() {
  const savedDestination =
    sessionStorage.getItem("introspheerRedirect");

  sessionStorage.removeItem("introspheerRedirect");

  const allowedPages = new Set([
    "index.html",
    "events.html",
    "strings.html",
    "chat.html",
    "account.html",
    "profile.html",
    "public-profile.html",
    "about.html"
  ]);

  let destination = "index.html";

  if (savedDestination) {
    try {
      const url = new URL(
        savedDestination,
        window.location.href
      );

      const page = url.pathname.split("/").pop();

      if (
        url.origin === window.location.origin &&
        allowedPages.has(page)
      ) {
        destination = url.href;
      }
    } catch (error) {
      console.warn("Invalid redirect destination:", error);
    }
  }

  window.location.replace(destination);
}

function friendlyError(error) {
  switch (error.code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";

    default:
      return error.message || "Unable to sign in.";
  }
}

onAuthStateChanged(auth, user => {
  if (user) {
    redirectAfterLogin();
  }
});

loginForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("Please enter your email and password.");
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  showMessage("");

  try {
    await setPersistence(auth, browserLocalPersistence);

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    redirectAfterLogin();
  } catch (error) {
    console.error("Login error:", error);

    showMessage(friendlyError(error));

    loginButton.disabled = false;
    loginButton.textContent = "Log In";
  }
});
