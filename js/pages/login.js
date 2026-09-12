/* =========================================================
   NetView — Login
   js/pages/login.js
   ========================================================= */

import {
    signIn,
    getSession,
    getUser
} from "../core/auth.js";

import {
    registerCurrentDevice
} from "../core/data.js";

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

let isSubmitting = false;

document.addEventListener(
    "DOMContentLoaded",
    init
);

async function init() {
    setCurrentYear();
    setupPasswordToggle();
    setupForm();

    await checkExistingSession();
}

function setCurrentYear() {
    if (!currentYear) {
        return;
    }

    currentYear.textContent =
        new Date().getFullYear();
}

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
}

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
            const visible =
                passwordInput.type ===
                "password";

            passwordInput.type =
                visible
                    ? "text"
                    : "password";

            togglePassword.setAttribute(
                "aria-pressed",
                String(visible)
            );

            togglePassword.setAttribute(
                "aria-label",
                visible
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
            );

            const icon =
                togglePassword.querySelector(
                    "i"
                );

            if (icon) {
                icon.className =
                    visible
                        ? "fa-regular fa-eye-slash"
                        : "fa-regular fa-eye";
            }
        }
    );
}

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
         * L'utilisateur possède déjà une session.
         * On actualise également son appareil.
         */
        try {
            await registerCurrentDevice();
        } catch (deviceError) {
            console.error(
                "NetView existing-session device registration error:",
                deviceError
            );
        }

        redirectAfterLogin();

    } catch (error) {
        console.error(
            "NetView login session error:",
            error
        );

        hidePageLoader();
    }
}

async function handleSubmit(
    event
) {
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

    isSubmitting = true;

    setSubmittingState(
        true
    );

    showPageLoader();

    try {
        const email =
            normalizeEmail(
                emailInput.value
            );

        const password =
            passwordInput.value;

        await signIn(
            email,
            password
        );

        const user =
            await getUser();

        if (!user?.id) {
            throw new Error(
                "Impossible de récupérer votre compte après la connexion."
            );
        }

        /*
         * IMPORTANT :
         * Enregistrement / mise à jour du terminal
         * dans public.devices.
         */
        try {
            await registerCurrentDevice();
        } catch (deviceError) {
            /*
             * Une erreur d'enregistrement de l'appareil
             * ne doit pas annuler une authentification
             * déjà réussie.
             */
            console.error(
                "NetView device registration error:",
                deviceError
            );
        }

        /*
         * Le système Supabase possède déjà
         * persistSession: true.
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

        setSubmittingState(
            false
        );
    }
}

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

function normalizeEmail(value) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}

function isValidEmail(
    email
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}

function handleLoginError(
    error
) {
    const message =
        getReadableAuthError(
            error
        );

    if (
        message.includes(
            "adresse e-mail"
        ) &&
        !message.includes(
            "mot de passe"
        )
    ) {
        showFieldError(
            "email",
            message
        );

        return;
    }

    if (
        message.includes(
            "mot de passe"
        )
    ) {
        showFieldError(
            "password",
            message
        );

        return;
    }

    window.alert(
        message
    );
}

function getReadableAuthError(
    error
) {
    if (!error) {
        return (
            "Impossible de vous connecter à NetView."
        );
    }

    const raw =
        String(
            error.message ||
            error.error_description ||
            error.details ||
            ""
        );

    const message =
        raw.toLowerCase();

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
            "Votre adresse e-mail n'est pas encore confirmée."
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
            "Trop de tentatives. Veuillez patienter avant de réessayer."
        );
    }

    if (
        message.includes(
            "failed to fetch"
        ) ||
        message.includes(
            "network"
        )
    ) {
        return (
            "Impossible de contacter NetView. Vérifiez votre connexion Internet."
        );
    }

    return (
        "Impossible de vous connecter. Vérifiez vos informations et réessayez."
    );
}

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

    let decoded;

    try {
        decoded =
            decodeURIComponent(
                value
            );
    } catch {
        return false;
    }

    if (
        decoded.startsWith(
            "javascript:"
        ) ||
        decoded.startsWith(
            "data:"
        ) ||
        decoded.startsWith(
            "//"
        ) ||
        decoded.includes(
            "://"
        )
    ) {
        return false;
    }

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
