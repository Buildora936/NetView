/* =========================================================
   NetView — Login
   js/pages/login.js
   ========================================================= */

import {
    signIn,
    getSession,
    getUser
} from "../core/auth.js";

/* =========================================================
   DOM
   ========================================================= */

const pageLoader =
    document.getElementById("pageLoader");

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const rememberInput =
    document.getElementById("remember");

const loginButton =
    document.getElementById("loginButton");

const emailError =
    document.getElementById("emailError");

const passwordError =
    document.getElementById("passwordError");

const currentYear =
    document.getElementById("currentYear");

/* =========================================================
   STATE
   ========================================================= */

let isSubmitting = false;

/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);

async function init() {
    setCurrentYear();
    setupPasswordToggle();
    setupForm();
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

    currentYear.textContent =
        new Date().getFullYear();
}

/* =========================================================
   EXISTING SESSION
   ========================================================= */

async function checkExistingSession() {
    showPageLoader();

    try {
        const session =
            await getSession();

        if (!session?.user?.id) {
            hidePageLoader();
            return;
        }

        const user =
            await getUser();

        if (!user?.id) {
            hidePageLoader();
            return;
        }

        /*
         * L'utilisateur est déjà connecté.
         * On ne le laisse pas rester inutilement
         * sur la page de connexion.
         */
        redirectAfterLogin();

    } catch (error) {
        console.error(
            "NetView login session check error:",
            error
        );

        hidePageLoader();
    }
}

/* =========================================================
   FORM
   ========================================================= */

function setupForm() {
    if (!loginForm) {
        return;
    }

    loginForm.addEventListener(
        "submit",
        handleSubmit
    );

    emailInput?.addEventListener(
        "input",
        () => {
            clearFieldError(
                emailInput,
                emailError
            );
        }
    );

    passwordInput?.addEventListener(
        "input",
        () => {
            clearFieldError(
                passwordInput,
                passwordError
            );
        }
    );

    emailInput?.addEventListener(
        "blur",
        validateEmailField
    );

    passwordInput?.addEventListener(
        "blur",
        validatePasswordField
    );
}

/* =========================================================
   PASSWORD TOGGLE
   ========================================================= */

function setupPasswordToggle() {
    if (
        !togglePassword ||
        !passwordInput
    ) {
        return;
    }

    togglePassword.addEventListener(
        "click",
        () => {
            const showingPassword =
                passwordInput.type === "password";

            passwordInput.type =
                showingPassword
                    ? "text"
                    : "password";

            togglePassword.setAttribute(
                "aria-pressed",
                String(showingPassword)
            );

            togglePassword.setAttribute(
                "aria-label",
                showingPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
            );

            const icon =
                togglePassword.querySelector(
                    "i"
                );

            if (icon) {
                icon.className =
                    showingPassword
                        ? "fa-regular fa-eye-slash"
                        : "fa-regular fa-eye";
            }

            passwordInput.focus();
        }
    );
}

/* =========================================================
   NAVIGATION LINKS
   ========================================================= */

function setupNavigationLinks() {
    document
        .querySelectorAll("[data-link]")
        .forEach(link => {
            link.addEventListener(
                "click",
                event => {
                    const target =
                        link.getAttribute(
                            "data-link"
                        );

                    if (!target) {
                        return;
                    }

                    event.preventDefault();

                    window.location.href =
                        target;
                }
            );
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

    const validation =
        validateForm();

    if (!validation.valid) {
        showFieldError(
            validation.field,
            validation.message
        );

        return;
    }

    const email =
        normalizeEmail(
            emailInput.value
        );

    const password =
        passwordInput.value;

    isSubmitting = true;

    setSubmittingState(true);
    showPageLoader();

    try {
        const result =
            await signIn(
                email,
                password
            );

        /*
         * auth.js peut retourner directement
         * la réponse Supabase ou un objet contenant
         * data.user selon son implémentation.
         */
        let user =
            result?.user ||
            result?.data?.user ||
            null;

        /*
         * Sécurité supplémentaire :
         * si signIn() ne renvoie pas l'utilisateur,
         * on le récupère depuis la session courante.
         */
        if (!user?.id) {
            user =
                await getUser();
        }

        if (!user?.id) {
            throw new Error(
                "Utilisateur introuvable après la connexion."
            );
        }

        /*
         * La session est gérée par Supabase.
         * supabase.js utilise déjà persistSession: true.
         */
        void rememberInput?.checked;

        redirectAfterLogin();

    } catch (error) {
        console.error(
            "NetView login error:",
            error
        );

        hidePageLoader();

        handleLoginError(
            error
        );
    } finally {
        isSubmitting = false;

        setSubmittingState(false);
    }
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateForm() {
    const email =
        normalizeEmail(
            emailInput?.value
        );

    const password =
        String(
            passwordInput?.value || ""
        );

    if (!email) {
        return {
            valid: false,
            field: "email",
            message:
                "Veuillez saisir votre adresse e-mail."
        };
    }

    if (!isValidEmail(email)) {
        return {
            valid: false,
            field: "email",
            message:
                "Veuillez saisir une adresse e-mail valide."
        };
    }

    if (!password) {
        return {
            valid: false,
            field: "password",
            message:
                "Veuillez saisir votre mot de passe."
        };
    }

    return {
        valid: true
    };
}

function validateEmailField() {
    const email =
        normalizeEmail(
            emailInput?.value
        );

    if (!email) {
        return;
    }

    if (!isValidEmail(email)) {
        showFieldError(
            "email",
            "Veuillez saisir une adresse e-mail valide."
        );
    }
}

function validatePasswordField() {
    const password =
        String(
            passwordInput?.value || ""
        );

    if (!password) {
        return;
    }

    clearFieldError(
        passwordInput,
        passwordError
    );
}

function normalizeEmail(value) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}

/* =========================================================
   ERRORS
   ========================================================= */

function handleLoginError(error) {
    const message =
        getReadableAuthError(
            error
        );

    const normalized =
        message.toLowerCase();

    if (
        normalized.includes(
            "adresse e-mail"
        )
    ) {
        showFieldError(
            "email",
            message
        );

        return;
    }

    if (
        normalized.includes(
            "mot de passe"
        )
    ) {
        showFieldError(
            "password",
            message
        );

        return;
    }

    /*
     * Le HTML de login.html ne contient pas
     * de conteneur d'erreur global.
     *
     * Pour une erreur générale, on utilise
     * une alerte contrôlée plutôt que de créer
     * un élément inexistant.
     */
    window.alert(
        message
    );
}

function getReadableAuthError(error) {
    if (!error) {
        return (
            "Impossible de vous connecter à NetView."
        );
    }

    const rawMessage =
        String(
            error.message ||
            error.error_description ||
            error.details ||
            ""
        );

    const message =
        rawMessage.toLowerCase();

    if (
        message.includes(
            "invalid login credentials"
        )
    ) {
        return (
            "Adresse e-mail ou mot de passe incorrect."
        );
    }

    if (
        message.includes(
            "email not confirmed"
        ) ||
        message.includes(
            "email_not_confirmed"
        )
    ) {
        return (
            "Votre adresse e-mail n'est pas encore confirmée. Vérifiez votre boîte e-mail avant de vous connecter."
        );
    }

    if (
        message.includes(
            "user not found"
        )
    ) {
        return (
            "Aucun compte NetView ne correspond à cette adresse e-mail."
        );
    }

    if (
        message.includes(
            "too many requests"
        ) ||
        message.includes(
            "rate limit"
        )
    ) {
        return (
            "Trop de tentatives de connexion. Veuillez patienter avant de réessayer."
        );
    }

    if (
        message.includes(
            "failed to fetch"
        ) ||
        message.includes(
            "network"
        ) ||
        message.includes(
            "networkerror"
        )
    ) {
        return (
            "Impossible de contacter NetView. Vérifiez votre connexion Internet."
        );
    }

    if (
        message.includes(
            "invalid email"
        )
    ) {
        return (
            "L'adresse e-mail saisie est invalide."
        );
    }

    if (
        message.includes(
            "password"
        ) &&
        (
            message.includes("invalid") ||
            message.includes("incorrect")
        )
    ) {
        return (
            "Mot de passe incorrect."
        );
    }

    if (
        rawMessage.trim()
    ) {
        return (
            "Impossible de vous connecter. Vérifiez vos informations et réessayez."
        );
    }

    return (
        "Impossible de vous connecter à NetView."
    );
}

/* =========================================================
   FIELD ERRORS
   ========================================================= */

function showFieldError(
    field,
    message
) {
    clearAllErrors();

    if (field === "email") {
        showInputError(
            emailInput,
            emailError,
            message
        );

        return;
    }

    if (field === "password") {
        showInputError(
            passwordInput,
            passwordError,
            message
        );
    }
}

function showInputError(
    input,
    errorElement,
    message
) {
    if (input) {
        input.classList.add(
            "is-invalid"
        );

        input.setAttribute(
            "aria-invalid",
            "true"
        );
    }

    if (errorElement) {
        errorElement.textContent =
            message;
    }

    input?.focus();
}

function clearFieldError(
    input,
    errorElement
) {
    if (input) {
        input.classList.remove(
            "is-invalid"
        );

        input.setAttribute(
            "aria-invalid",
            "false"
        );
    }

    if (errorElement) {
        errorElement.textContent =
            "";
    }
}

function clearAllErrors() {
    clearFieldError(
        emailInput,
        emailError
    );

    clearFieldError(
        passwordInput,
        passwordError
    );
}

/* =========================================================
   SUBMIT STATE
   ========================================================= */

function setSubmittingState(
    submitting
) {
    if (!loginButton) {
        return;
    }

    loginButton.disabled =
        submitting;

    loginButton.setAttribute(
        "aria-busy",
        String(submitting)
    );

    const content =
        loginButton.querySelector(
            ".login-submit-content"
        );

    if (!content) {
        return;
    }

    if (submitting) {
        if (
            !content.dataset.originalHtml
        ) {
            content.dataset.originalHtml =
                content.innerHTML;
        }

        content.innerHTML = `
            <span>
                Connexion...
            </span>
            <i
                class="fa-solid fa-spinner fa-spin"
                aria-hidden="true"
            ></i>
        `;

        return;
    }

    if (
        content.dataset.originalHtml
    ) {
        content.innerHTML =
            content.dataset.originalHtml;

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

    pageLoader.style.display =
        "flex";

    pageLoader.setAttribute(
        "aria-hidden",
        "false"
    );
}

function hidePageLoader() {
    if (!pageLoader) {
        return;
    }

    pageLoader.style.display =
        "none";

    pageLoader.setAttribute(
        "aria-hidden",
        "true"
    );
}

/* =========================================================
   REDIRECTION
   ========================================================= */

function redirectAfterLogin() {
    const destination =
        getSafeRedirect();

    window.location.replace(
        destination
    );
}

function getSafeRedirect() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const redirect =
        params.get("redirect");

    if (
        redirect &&
        isSafeInternalRedirect(
            redirect
        )
    ) {
        return redirect;
    }

    return "index.html";
}

function isSafeInternalRedirect(
    value
) {
    if (!value) {
        return false;
    }

    const decoded =
        decodeURIComponent(
            value
        );

    /*
     * Refuser toutes les destinations
     * externes ou JavaScript.
     */
    if (
        decoded.startsWith(
            "javascript:"
        )
    ) {
        return false;
    }

    if (
        decoded.startsWith(
            "data:"
        )
    ) {
        return false;
    }

    if (
        decoded.startsWith(
            "//"
        )
    ) {
        return false;
    }

    if (
        decoded.includes(
            "://"
        )
    ) {
        return false;
    }

    /*
     * Autoriser uniquement une destination
     * interne NetView.
     */
    return (
        decoded.startsWith(
            "/"
        ) ||
        decoded.startsWith(
            "./"
        ) ||
        decoded.endsWith(
            ".html"
        ) ||
        decoded.includes(
            ".html?"
        )
    );
}
