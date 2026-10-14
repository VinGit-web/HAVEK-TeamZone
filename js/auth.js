
import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  doc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

export async function registerUser(email, password, profile = null) {
  if (!profile) {
    throw new Error("Please complete your registration profile.");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  const user = credential.user;

  const username = profile.username.trim();
  const fullName = profile.fullName.trim();

  try {
    const batch = writeBatch(db);

    batch.set(doc(db, "users", user.uid), {
      uid: user.uid,
      username,
      fullName,
      birthYear: Number(profile.birthYear),
      gender: profile.gender,
      visibility: profile.visibility,
      showEmail: false,
      allowMessages: true,
      searchVisible: profile.searchVisible,
      emailNotifications: false,
      avatar: {
        version: 2,
        mode: "animal"
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    batch.set(doc(db, "publicProfiles", user.uid), {
      uid: user.uid,
      username,
      avatar: {
        version: 2,
        mode: "animal"
      }
    });

    batch.set(doc(db, "userPersonas", user.uid), {
      uid: user.uid,
      persona: profile.persona,
      mbti: profile.mbti || "",
      interests: profile.interests,
      suburb: profile.suburb.trim(),
      state: "QLD",
      preference: profile.preference,
      showSuburb: profile.showSuburb,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    await updateProfile(user, {
      displayName: username
    });

    return credential;
  } catch (error) {
    console.error("Registration profile setup failed:", error);
    throw new Error(
      "Your login was created, but your profile could not be completed. Please contact the site administrator before trying again."
    );
  }
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
