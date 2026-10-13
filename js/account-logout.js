
import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const logoutButton = document.getElementById("logoutButton");

const accountEmail = document.getElementById("accountEmail");

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  if (accountEmail) {
    accountEmail.textContent = user.email || "Signed-in user";
  }
});

logoutButton?.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  try {
    sessionStorage.removeItem("introspheerRedirect");

    await signOut(auth);

    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout failed:", error);

    logoutButton.disabled = false;
    logoutButton.textContent = "Log Out";

    alert("Unable to log out. Please try again.");
  }
});
