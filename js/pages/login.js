// ==========================================
// NetView
// login.js
// ==========================================

import { supabase } from "../core/supabase.js";

// ==========================================
// Elements
// ==========================================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMeCheckbox = document.getElementById("rememberMe");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");
const togglePasswordButton = document.getElementById("togglePassword");
const pageLoader = document.getElementById("pageLoader");

// ==========================================
// Vérification Session Existante
// ==========================================

(async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            window.location.replace("index.html");
        }
    } catch (err) {
        console.error("Erreur de session :", err);
    }
})();

// ==========================================
// Se souvenir de moi (Email sauvegardé)
// ==========================================

const savedEmail = localStorage.getItem("netview_saved_email");
if (savedEmail) {
    emailInput.value = savedEmail;
    rememberMeCheckbox.checked = true;
}

// ==========================================
// Afficher / Masquer le mot de passe
// ==========================================

if (togglePasswordButton) {
    togglePasswordButton.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";

        togglePasswordButton.innerHTML = isPassword
            ? '<i class="fa-regular fa-eye-slash"></i>'
            : '<i class="fa-regular fa-eye"></i>';

        togglePasswordButton.setAttribute(
            "aria-label",
            isPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
        );
    });
}

// ==========================================
// Soumission du Formulaire de Connexion
// ==========================================

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Réinitialisation des erreurs
    loginError.textContent = "";
    loginError.classList.remove("show");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        loginError.textContent = "Veuillez remplir tous les champs.";
        loginError.classList.add("show");
        return;
    }

    // Activation du loader visuel
    loginButton.disabled = true;
    loginButton.style.opacity = "0.7";
    if (pageLoader) pageLoader.style.display = "flex";

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Gestion "Se souvenir de moi"
        if (rememberMeCheckbox.checked) {
            localStorage.setItem("netview_saved_email", email);
        } else {
            localStorage.removeItem("netview_saved_email");
        }

        // Redirection intelligente ou vers l'accueil
        const lastPage = sessionStorage.getItem("netview_last_page");
        if (
            lastPage &&
            !["login.html", "signup.html", "forgot-password.html", "confirm-email.html"].includes(lastPage)
        ) {
            sessionStorage.removeItem("netview_last_page");
            window.location.replace(lastPage);
        } else {
            window.location.replace("index.html");
        }

    } catch (err) {
        console.error("Erreur de connexion :", err);
        
        let message = "Identifiants incorrects ou erreur de connexion.";
        if (err.message.includes("Invalid login credentials")) {
            message = "E-mail ou mot de passe incorrect.";
        } else if (err.message.includes("Email not confirmed")) {
            message = "Veuillez confirmer votre adresse e-mail avant de vous connecter.";
        }

        loginError.textContent = message;
        loginError.classList.add("show");

        // Désactivation du loader en cas d'erreur
        loginButton.disabled = false;
        loginButton.style.opacity = "1";
        if (pageLoader) pageLoader.style.display = "none";
    }
});

// ==========================================
// Effacer l'erreur lors de la frappe
// ==========================================

[emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => {
        if (loginError.classList.contains("show")) {
            loginError.textContent = "";
            loginError.classList.remove("show");
        }
    });
});

// ==========================================
// Sauvegarde de la dernière page visitée
// ==========================================

document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (href && href.endsWith(".html")) {
        sessionStorage.setItem("netview_last_page", href);
    }
});

// ==========================================
// Focus automatique initial
// ==========================================

window.addEventListener("load", () => {
    if (emailInput.value) {
        passwordInput.focus();
    } else {
        emailInput.focus();
    }
});
