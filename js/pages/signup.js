/* =========================================================
   NetView — Signup
   js/pages/signup.js
========================================================= */

import {
    signUp,
    createProfile,
    getSession,
    getUser
} from "../core/auth.js";

import {
    registerCurrentDevice,
    isUsernameAvailable
} from "../core/data.js";

/* =========================================================
   DOM
========================================================= */

const pageLoader = document.getElementById("pageLoader");
const signupForm = document.getElementById("signupForm");
const usernameInput = document.getElementById("username");
const displayNameInput = document.getElementById("displayName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const countryInput = document.getElementById("country");
const languageInput = document.getElementById("language");
const acceptTermsInput = document.getElementById("acceptTerms");
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const passwordStrength = document.getElementById("passwordStrength");
const usernameError = document.getElementById("usernameError");
const displayNameError = document.getElementById("displayNameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const countryError = document.getElementById("countryError");
const termsError = document.getElementById("termsError");
const signupButton = document.getElementById("signupButton");
const currentYear = document.getElementById("currentYear");

/* =========================================================
   STATE
========================================================= */

let isSubmitting = false;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
    setCurrentYear();
    setupForm();
    setupPasswordToggle(
        togglePassword,
        passwordInput,
        "Afficher le mot de passe",
        "Masquer le mot de passe"
    );
    setupPasswordToggle(
        toggleConfirmPassword,
        confirmPasswordInput,
        "Afficher la confirmation du mot de passe",
        "Masquer la confirmation du mot de passe"
    );
    setupPasswordStrength();
    setupNavigationLinks();

    await checkExistingSession();
}

/* =========================================================
   YEAR
========================================================= */

function setCurrentYear() {
    if (!currentYear) {
        return;
    }

    currentYear.textContent = new Date().getFullYear();
}

/* =========================================================
   EXISTING SESSION
========================================================= */

async function checkExistingSession() {
    showPageLoader();

    try {
        const session = await getSession();

        if (!session?.user?.id) {
            hidePageLoader();
            return;
        }

        window.location.replace("index.html");
    } catch (error) {
        console.error("NetView signup session check error:", error);
        hidePageLoader();
    }
}

/* =========================================================
   FORM
========================================================= */

function setupForm() {
    if (!signupForm) {
        return;
    }

    signupForm.addEventListener("submit", handleSubmit);

    usernameInput?.addEventListener("input", () => {
        clearFieldError(usernameInput, usernameError);
    });

    displayNameInput?.addEventListener("input", () => {
        clearFieldError(displayNameInput, displayNameError);
    });

    emailInput?.addEventListener("input", () => {
        clearFieldError(emailInput, emailError);
    });

    passwordInput?.addEventListener("input", () => {
        clearFieldError(passwordInput, passwordError);
        updatePasswordStrength();
        updateConfirmPasswordState();
    });

    confirmPasswordInput?.addEventListener("input", () => {
        clearFieldError(confirmPasswordInput, confirmPasswordError);
        updateConfirmPasswordState();
    });

    countryInput?.addEventListener("input", () => {
        clearFieldError(countryInput, countryError);
    });

    acceptTermsInput?.addEventListener("change", () => {
        clearFieldError(acceptTermsInput, termsError);
    });
}

/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function setupPasswordToggle(button, input, showLabel, hideLabel) {
    if (!button || !input) {
        return;
    }

    button.addEventListener("click", () => {
        const visible = input.type === "password";

        input.type = visible ? "text" : "password";

        button.setAttribute("aria-pressed", String(visible));
        button.setAttribute("aria-label", visible ? hideLabel : showLabel);

        const icon = button.querySelector("i");

        if (icon) {
            icon.className = visible
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye";
        }

        input.focus();
    });
}

/* =========================================================
   PASSWORD STRENGTH
========================================================= */

function setupPasswordStrength() {
    updatePasswordStrength();
}

function updatePasswordStrength() {
    if (!passwordStrength) {
        return;
    }

    const password = passwordInput?.value || "";

    if (!password) {
        passwordStrength.textContent = "";
        passwordStrength.removeAttribute("data-strength");
        return;
    }

    const strength = calculatePasswordStrength(password);

    const labels = {
        weak: "Faible",
        medium: "Moyen",
        strong: "Fort"
    };

    passwordStrength.textContent = `Sécurité du mot de passe : ${labels[strength]}`;
    passwordStrength.setAttribute("data-strength", strength);
}

function calculatePasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) {
        score++;
    }

    if (password.length >= 12) {
        score++;
    }

    if (/[a-z]/.test(password)) {
        score++;
    }

    if (/[A-Z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }

    if (score <= 2) {
        return "weak";
    }

    if (score <= 4) {
        return "medium";
    }

    return "strong";
}

/* =========================================================
   CONFIRM PASSWORD
========================================================= */

function updateConfirmPasswordState() {
    if (!confirmPasswordInput) {
        return;
    }

    const password = passwordInput?.value || "";
    const confirmation = confirmPasswordInput.value;

    if (!confirmation) {
        return;
    }

    if (password !== confirmation) {
        confirmPasswordInput.classList.add("is-invalid");
        confirmPasswordInput.setAttribute("aria-invalid", "true");

        if (confirmPasswordError) {
            confirmPasswordError.textContent = "Les mots de passe ne correspondent pas.";
        }

        return;
    }

    clearFieldError(confirmPasswordInput, confirmPasswordError);
}

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigationLinks() {
    document.querySelectorAll("[data-link]").forEach(link => {
        link.addEventListener("click", event => {
            const target = link.getAttribute("data-link");

            if (!target) {
                return;
            }

            event.preventDefault();
            window.location.href = target;
        });
    });
}

/* =========================================================
   SUBMIT
========================================================= */

async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
        return;
    }

    clearAllErrors();

    const validation = validateForm();

    if (!validation.valid) {
        showFieldError(validation.field, validation.message);
        return;
    }

    isSubmitting = true;
    setSubmittingState(true);
    showPageLoader();

    try {
        const username = normalizeUsername(usernameInput.value);
        const displayName = normalizeText(displayNameInput.value);
        const email = normalizeEmail(emailInput.value);
        const password = passwordInput.value;
        const country = normalizeText(countryInput.value);
        const language = normalizeLanguage(languageInput?.value);

        /*
         * Vérification du nom d'utilisateur
         * avant de créer le compte Auth.
         */
        const usernameAvailable = await isUsernameAvailable(username);

        if (!usernameAvailable) {
            throw new SignupFieldError(
                "username",
                "Ce nom d'utilisateur est déjà utilisé."
            );
        }

        /*
         * 1. Création du compte Supabase Auth.
         */
        const authResult = await signUp(email, password);

        const user = authResult?.user || authResult?.data?.user || null;

        if (!user?.id) {
            throw new Error("Le compte n'a pas pu être créé.");
        }

        /*
         * 2. Création du profil NetView.
         *
         * Le compte est toujours créé comme "user".
         * Aucun type "creator", "admin" ou "seller".
         */
        await createProfile({
            username,
            display_name: displayName,
            country,
            language,
            account_type: "user"
        });

        /*
         * 3. Si Supabase fournit immédiatement
         * une session, on peut enregistrer l'appareil.
         */
        let session = null;

        try {
            session = await getSession();
        } catch (sessionError) {
            console.warn("NetView signup session check warning:", sessionError);
        }

        if (session?.user?.id === user.id) {
            try {
                await registerCurrentDevice();
            } catch (deviceError) {
                console.error("NetView signup device registration error:", deviceError);
            }
        }

        /*
         * 4. Redirection vers confirmation email.
         */
        window.location.replace(
            `confirm-email.html?email=${encodeURIComponent(email)}`
        );

    } catch (error) {
        console.error("NetView signup error:", error);

        hidePageLoader();

        if (error instanceof SignupFieldError) {
            showFieldError(error.field, error.message);
            return;
        }

        handleSignupError(error);
    } finally {
        isSubmitting = false;
        setSubmittingState(false);
    }
}

/* =========================================================
   VALIDATION
========================================================= */

function validateForm() {
    const username = normalizeUsername(usernameInput?.value);
    const displayName = normalizeText(displayNameInput?.value);
    const email = normalizeEmail(emailInput?.value);
    const password = passwordInput?.value || "";
    const confirmation = confirmPasswordInput?.value || "";
    const country = normalizeText(countryInput?.value);

    if (!username) {
        return {
            valid: false,
            field: "username",
            message: "Veuillez choisir un nom d'utilisateur."
        };
    }

    if (username.length < 3 || username.length > 30) {
        return {
            valid: false,
            field: "username",
            message: "Le nom d'utilisateur doit contenir entre 3 et 30 caractères."
        };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        return {
            valid: false,
            field: "username",
            message: "Le nom d'utilisateur peut contenir uniquement des lettres, chiffres, points, tirets et underscores."
        };
    }

    if (!displayName) {
        return {
            valid: false,
            field: "displayName",
            message: "Veuillez saisir votre nom affiché."
        };
    }

    if (displayName.length > 80) {
        return {
            valid: false,
            field: "displayName",
            message: "Le nom affiché ne peut pas dépasser 80 caractères."
        };
    }

    if (!email) {
        return {
            valid: false,
            field: "email",
            message: "Veuillez saisir votre adresse e-mail."
        };
    }

    if (!isValidEmail(email)) {
        return {
            valid: false,
            field: "email",
            message: "Veuillez saisir une adresse e-mail valide."
        };
    }

    if (!password) {
        return {
            valid: false,
            field: "password",
            message: "Veuillez choisir un mot de passe."
        };
    }

    if (password.length < 8) {
        return {
            valid: false,
            field: "password",
            message: "Le mot de passe doit contenir au moins 8 caractères."
        };
    }

    if (!confirmation) {
        return {
            valid: false,
            field: "confirmPassword",
            message: "Veuillez confirmer votre mot de passe."
        };
    }

    if (password !== confirmation) {
        return {
            valid: false,
            field: "confirmPassword",
            message: "Les mots de passe ne correspondent pas."
        };
    }

    if (!country) {
        return {
            valid: false,
            field: "country",
            message: "Veuillez saisir votre pays."
        };
    }

    if (!acceptTermsInput?.checked) {
        return {
            valid: false,
            field: "terms",
            message: "Vous devez accepter les conditions d'utilisation et la politique de confidentialité."
        };
    }

    return {
        valid: true
    };
}

/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeLanguage(value) {
    const language = String(value || "fr").trim().toLowerCase();
    return language === "en" ? "en" : "fr";
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================================================
   FIELD ERRORS
========================================================= */

function showFieldError(field, message) {
    clearAllErrors();

    switch (field) {
        case "username":
            showInputError(usernameInput, usernameError, message);
            break;

        case "displayName":
            showInputError(displayNameInput, displayNameError, message);
            break;

        case "email":
            showInputError(emailInput, emailError, message);
            break;

        case "password":
            showInputError(passwordInput, passwordError, message);
            break;

        case "confirmPassword":
            showInputError(confirmPasswordInput, confirmPasswordError, message);
            break;

        case "country":
            showInputError(countryInput, countryError, message);
            break;

        case "terms":
            showInputError(acceptTermsInput, termsError, message);
            break;
    }
}

function showInputError(input, errorElement, message) {
    if (input) {
        input.classList.add("is-invalid");
        input.setAttribute("aria-invalid", "true");
    }

    if (errorElement) {
        errorElement.textContent = message;
    }

    input?.focus();
}

function clearFieldError(input, errorElement) {
    if (input) {
        input.classList.remove("is-invalid");
        input.setAttribute("aria-invalid", "false");
    }

    if (errorElement) {
        errorElement.textContent = "";
    }
}

function clearAllErrors() {
    clearFieldError(usernameInput, usernameError);
    clearFieldError(displayNameInput, displayNameError);
    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);
    clearFieldError(confirmPasswordInput, confirmPasswordError);
    clearFieldError(countryInput, countryError);
    clearFieldError(acceptTermsInput, termsError);
}

/* =========================================================
   SIGNUP ERRORS
========================================================= */

function handleSignupError(error) {
    const message = getReadableSignupError(error);
    window.alert(message);
}

function getReadableSignupError(error) {
    if (!error) {
        return "Impossible de créer votre compte NetView.";
    }

    const raw = String(
        error.message ||
        error.error_description ||
        error.details ||
        ""
    );

    const message = raw.toLowerCase();

    if (message.includes("user already registered") || message.includes("email already registered")) {
        return "Un compte existe déjà avec cette adresse e-mail.";
    }

    if (message.includes("invalid email")) {
        return "L'adresse e-mail saisie est invalide.";
    }

    if (message.includes("password") && (message.includes("at least") || message.includes("weak"))) {
        return "Le mot de passe choisi n'est pas suffisamment sécurisé.";
    }

    if (message.includes("rate limit") || message.includes("too many requests")) {
        return "Trop de tentatives. Veuillez patienter avant de réessayer.";
    }

    if (message.includes("failed to fetch") || message.includes("network")) {
        return "Impossible de contacter NetView. Vérifiez votre connexion Internet.";
    }

    return "Impossible de créer votre compte. Vérifiez les informations saisies et réessayez.";
}

/* =========================================================
   SUBMIT STATE
========================================================= */

function setSubmittingState(submitting) {
    if (!signupButton) {
        return;
    }

    signupButton.disabled = submitting;
    signupButton.setAttribute("aria-busy", String(submitting));

    const content = signupButton.querySelector(".signup-submit-content");

    if (!content) {
        return;
    }

    if (submitting) {
        if (!content.dataset.originalHtml) {
            content.dataset.originalHtml = content.innerHTML;
        }

        content.innerHTML = `
            <span>
                Création du compte...
            </span>
            <i
                class="fa-solid fa-spinner fa-spin"
                aria-hidden="true"
            ></i>
        `;

        return;
    }

    if (content.dataset.originalHtml) {
        content.innerHTML = content.dataset.originalHtml;
        delete content.dataset.originalHtml;
    }
}

/* =========================================================
   PAGE LOADER
========================================================= */

function showPageLoader() {
    if (!pageLoader) {
        return;
    }

    pageLoader.style.display = "flex";
    pageLoader.setAttribute("aria-hidden", "false");
}

function hidePageLoader() {
    if (!pageLoader) {
        return;
    }

    pageLoader.style.display = "none";
    pageLoader.setAttribute("aria-hidden", "true");
}

/* =========================================================
   FIELD ERROR CLASS
========================================================= */

class SignupFieldError extends Error {
    constructor(field, message) {
        super(message);

        this.name = "SignupFieldError";
        this.field = field;
        this.message = message;
    }
}
