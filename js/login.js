
import { loginUser } from "./auth.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";

    togglePassword.textContent = isHidden ? "Hide" : "Show";
    togglePassword.setAttribute("aria-pressed", String(isHidden));
    togglePassword.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
    );
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        message.textContent = "Please enter your email and password.";
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";
    message.textContent = "";

    try {
        await loginUser(email, password);
        window.location.replace("index.html");
    } catch (error) {
        console.error(error);

        switch (error.code) {
            case "auth/invalid-email":
                message.textContent = "Please enter a valid email address.";
                break;

            case "auth/too-many-requests":
                message.textContent =
                    "Too many attempts. Please try again later.";
                break;

            case "auth/network-request-failed":
                message.textContent =
                    "Network error. Check your connection and try again.";
                break;

            default:
                message.textContent =
                    "Unable to log in. Please check your email and password.";
        }

        loginButton.disabled = false;
        loginButton.textContent = "Log In →";
    }
});
