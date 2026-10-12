
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCc7InObk5uy5KBZt8692_oloOPm_6zRkI",
    authDomain: "introspheer.firebaseapp.com",
    projectId: "introspheer",
    storageBucket: "introspheer.firebasestorage.app",
    messagingSenderId: "440663713411",
    appId: "1:440663713411:web:4d731b6cbca37e6f265db6",
    measurementId: "G-E5WP9F44P0"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
