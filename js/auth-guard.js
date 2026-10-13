
import { auth } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

document.documentElement.style.visibility = "hidden";

onAuthStateChanged(
  auth,
  user => {
    if (!user) {
      const currentPage =
        window.location.pathname.split("/").pop() ||
        "index.html";

      const destination =
        currentPage + window.location.search;

      sessionStorage.setItem(
        "introspheerRedirect",
        destination
      );

      window.location.replace("login.html");
      return;
    }

    document.documentElement.style.visibility = "visible";
  },
  error => {
    console.error("Authentication check failed:", error);

    window.location.replace("login.html");
  }
);
