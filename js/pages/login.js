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
// Détection intelligente de l'appareil
// ==========================================

async function registerDevice(userId) {
    try {
        const ua = navigator.userAgent;

        // 1. Détection intelligente de l'OS avec versions et subtilités
        let os = "Système inconnu";
        if (/windows NT 10.0/.test(ua)) os = "Windows 10/11";
        else if (/windows NT 6.3/.test(ua)) os = "Windows 8.1";
        else if (/windows NT 6.2/.test(ua)) os = "Windows 8";
        else if (/windows NT 6.1/.test(ua)) os = "Windows 7";
        else if (/android/.test(ua)) os = "Android";
        else if (/iphone|ipad|ipod/.test(ua)) os = "iOS";
        else if (/mac os x/.test(ua)) os = "macOS";
        else if (/linux/.test(ua)) os = "Linux";
        else if (/cros/.test(ua)) os = "Chrome OS";

        // 2. Détection intelligente du navigateur réel
        let browser = "Navigateur inconnu";
        if (/edg/i.test(ua)) browser = "Microsoft Edge";
        else if (/opr|opera/i.test(ua)) browser = "Opera";
        else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";
        else if (/firefox/i.test(ua)) browser = "Firefox";
        else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) browser = "Google Chrome";
        else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";

        // 3. Détection intelligente du type d'appareil
        let deviceType = "Ordinateur";
        if (/mobi|android/i.test(ua) && !/ipad|tablet/i.test(ua)) {
            deviceType = "Téléphone mobile";
        } else if (/ipad|tablet|kindle/i.test(ua) || (navigator.maxTouchPoints > 1 && /macintosh/i.test(ua))) {
            deviceType = "Tablette";
        }

        // 4. Construction automatique du nom de l'appareil
        const deviceName = `${deviceType} - ${os} (${browser})`;

        // 5. Enregistrement en base de données Supabase
        const { error } = await supabase
            .from("devices")
            .insert([
                {
                    user_id: userId,
                    device_name: deviceName,
                    browser: browser,
                    operating_system: `${os} (${deviceType})`,
                    last_seen: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error("Erreur lors de l'enregistrement intelligent de l'appareil :", error.message);
        }
    } catch (err) {
        console.error("Erreur technique (registerDevice) :", err);
    }
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

        // Enregistrement intelligent de l'appareil connecté
        const userId = data.user?.id;
        if (userId) {
            await registerDevice(userId);
        }

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
