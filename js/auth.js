
import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

export async function registerUser(email, password) {
  return await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
}

export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
}

export async function logoutUser() {
  return await signOut(auth);
}

export function checkAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
