// ==========================================
// NetView
// login.js
// ==========================================

import {
    signIn,
    getSession
} from "../core/auth.js";

import {
    navigate
} from "../core/navigation.js";

import {
    showLoader,
    hideLoader,
    buttonLoading
} from "../core/ui.js";

// ==========================================
// Elements
// ==========================================

const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");
const togglePassword = document.getElementById("togglePassword");

// ==========================================
// Existing Session Check
// ==========================================

(async () => {
    try {
        const session = await getSession();
        if (session) {
            navigate("index.html");
        }
    } catch (error) {
        console.error("Erreur de vérification de session :", error);
    }
})();

// ==========================================
// Remember Me - Load saved email
// ==========================================

const savedEmail = localStorage.getItem("netview_saved_email");
if (savedEmail) {
    email.value = savedEmail;
    rememberMe.checked = true;
}

// ==========================================
// Password Visibility Toggle
// ==========================================

if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        const visible = password.type === "text";
        password.type = visible ? "password" : "text";

        togglePassword.innerHTML = visible
            ? '<i class="fa-regular fa-eye"></i>'
            : '<i class="fa-regular fa-eye-slash"></i>';

        togglePassword.setAttribute(
            "aria-label",
            visible ? "Afficher le mot de passe" : "Masquer le mot de passe"
        );
    });
}

// ==========================================
// Login Form Submission
// ==========================================

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginError.textContent = "";
    loginError.classList.remove("show");

    buttonLoading(loginButton, true);
    showLoader();

    try {
        const res = await signIn(
            email.value.trim(),
            password.value
        );

        hideLoader();
        buttonLoading(loginButton, false);

        if (res && res.error) {
            loginError.textContent = res.error.message || "Identifiants incorrects.";
            loginError.classList.add("show");
            return;
        }

        // ==========================
        // Remember Me - Save/Remove
        // ==========================

        if (rememberMe.checked) {
            localStorage.setItem("netview_saved_email", email.value.trim());
        } else {
            localStorage.removeItem("netview_saved_email");
        }

        // ==========================
        // Intelligent Redirect
        // ==========================

        const lastPage = sessionStorage.getItem("netview_last_page");

        if (
            lastPage &&
            ![
                "auth.html",
                "login.html",
                "signup.html",
                "forgot-password.html",
                "confirm-email.html"
            ].includes(lastPage)
        ) {
            sessionStorage.removeItem("netview_last_page");
            navigate(lastPage);
            return;
        }

        // Redirection par défaut vers l'accueil
        navigate("index.html");

    } catch (err) {
        console.error("Erreur lors de la connexion :", err);
        hideLoader();
        buttonLoading(loginButton, false);

        loginError.textContent = "Une erreur est survenue. Veuillez réessayer.";
        loginError.classList.add("show");
    }
});

// ==========================================
// Save Last Page on Click
// ==========================================

document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (href && href.endsWith(".html")) {
        sessionStorage.setItem("netview_last_page", href);
    }
});

// ==========================================
// Remove Error While Typing
// ==========================================

[email, password].forEach((input) => {
    input.addEventListener("input", () => {
        loginError.textContent = "";
        loginError.classList.remove("show");
    });
});

// ==========================================
// Autofocus Management
// ==========================================

window.addEventListener("load", () => {
    if (email.value) {
        password.focus();
    } else {
        email.focus();
    }
});
