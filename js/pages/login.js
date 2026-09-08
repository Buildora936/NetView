/* =========================================================
NetView
login.js
Page de connexion
========================================================= */

import {
signIn,
getSession,
getUser
} from "../core/auth.js";

import {
navigate,
initNavigation
} from "../navigation.js";

import {
showError,
showSuccess,
buttonLoading,
showLoader,
hideLoader
} from "../core/ui.js";

// =========================================================
// DOM
// =========================================================

const loginForm =
document.getElementById("loginForm");

const emailInput =
document.getElementById("email");

const passwordInput =
document.getElementById("password");

const rememberInput =
document.getElementById("remember");

const loginButton =
document.getElementById("loginButton");

const togglePasswordButton =
document.getElementById("togglePassword");

const emailError =
document.getElementById("emailError");

const passwordError =
document.getElementById("passwordError");

const currentYear =
document.getElementById("currentYear");

// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
"DOMContentLoaded",
initLogin
);

// =========================================================
// INIT LOGIN
// =========================================================

async function initLogin() {

```
try {

    setCurrentYear();

    initNavigation();

    setupPasswordToggle();

    setupFormValidation();

    setupLoginForm();

    await checkExistingSession();

} catch (error) {

    console.error(
        "NetView Login initialization error:",
        error
    );

    hideLoader();

}
```

}

// =========================================================
// CURRENT YEAR
// =========================================================

function setCurrentYear() {

```
if (!currentYear) {
    return;
}

currentYear.textContent =
    new Date().getFullYear();
```

}

// =========================================================
// EXISTING SESSION
// =========================================================

async function checkExistingSession() {

```
showLoader();

try {

    const session =
        await getSession();

    if (session) {

        navigate(
            getRedirectUrl()
        );

        return;

    }

} catch (error) {

    console.error(
        "Session verification error:",
        error
    );

} finally {

    /*
     * Important :
     * Le loader doit réellement disparaître.
     * Le CSS définit display:flex par défaut,
     * donc on force explicitement display:none.
     */

    hideLoader();

}
```

}

// =========================================================
// LOGIN FORM
// =========================================================

function setupLoginForm() {

```
if (!loginForm) {
    return;
}

loginForm.addEventListener(
    "submit",
    handleLogin
);
```

}

// =========================================================
// LOGIN
// =========================================================

async function handleLogin(event) {

```
event.preventDefault();

clearErrors();

const email =
    emailInput?.value.trim() || "";

const password =
    passwordInput?.value || "";

if (!validateForm(email, password)) {
    return;
}

if (loginButton) {

    buttonLoading(
        loginButton,
        true
    );

}

showLoader();

try {

    const result =
        await signIn(
            email,
            password
        );

    if (result?.error) {

        throw result.error;

    }

    /*
     * Vérification supplémentaire de la session
     * après authentification.
     */

    const session =
        await getSession();

    if (!session) {

        throw new Error(
            "La session n'a pas pu être créée."
        );

    }

    /*
     * Récupération de l'utilisateur.
     * Cela permet de confirmer que Supabase
     * possède bien l'utilisateur connecté.
     */

    const user =
        await getUser();

    if (!user) {

        throw new Error(
            "Utilisateur introuvable après connexion."
        );

    }

    showSuccess(
        "Connexion réussie."
    );

    /*
     * Petite pause afin de laisser le message
     * de succès être visible avant la navigation.
     */

    await wait(300);

    navigate(
        getRedirectUrl()
    );

} catch (error) {

    handleLoginError(
        error
    );

} finally {

    /*
     * Si une navigation a lieu, cette partie peut
     * être exécutée juste avant le changement de page.
     * Dans tous les cas, le loader est explicitement caché.
     */

    hideLoader();

    if (loginButton) {

        buttonLoading(
            loginButton,
            false
        );

    }

}
```

}

// =========================================================
// FORM VALIDATION
// =========================================================

function setupFormValidation() {

```
if (emailInput) {

    emailInput.addEventListener(
        "input",
        () => {

            clearFieldError(
                emailInput,
                emailError
            );

        }
    );

    emailInput.addEventListener(
        "blur",
        () => {

            const email =
                emailInput.value.trim();

            if (
                email &&
                !isValidEmail(email)
            ) {

                setFieldError(
                    emailInput,
                    emailError,
                    "Veuillez saisir une adresse e-mail valide."
                );

            }

        }
    );

}


if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        () => {

            clearFieldError(
                passwordInput,
                passwordError
            );

        }
    );

}
```

}

// =========================================================
// VALIDATE FORM
// =========================================================

function validateForm(
email,
password
) {

```
let valid = true;


if (!email) {

    setFieldError(
        emailInput,
        emailError,
        "Veuillez saisir votre adresse e-mail."
    );

    valid = false;

} else if (!isValidEmail(email)) {

    setFieldError(
        emailInput,
        emailError,
        "Veuillez saisir une adresse e-mail valide."
    );

    valid = false;

}


if (!password) {

    setFieldError(
        passwordInput,
        passwordError,
        "Veuillez saisir votre mot de passe."
    );

    valid = false;

}


if (!valid) {

    const firstInvalid =
        document.querySelector(
            ".login-input[aria-invalid='true']"
        );

    if (firstInvalid) {

        firstInvalid.focus();

    }

}


return valid;
```

}

// =========================================================
// EMAIL VALIDATION
// =========================================================

function isValidEmail(email) {

```
return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
```

}

// =========================================================
// FIELD ERROR
// =========================================================

function setFieldError(
input,
errorElement,
message
) {

```
if (input) {

    input.classList.add(
        "nv-input-error"
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
```

}

// =========================================================
// CLEAR FIELD ERROR
// =========================================================

function clearFieldError(
input,
errorElement
) {

```
if (input) {

    input.classList.remove(
        "nv-input-error"
    );

    input.removeAttribute(
        "aria-invalid"
    );

}

if (errorElement) {

    errorElement.textContent =
        "";

}
```

}

// =========================================================
// CLEAR ALL ERRORS
// =========================================================

function clearErrors() {

```
clearFieldError(
    emailInput,
    emailError
);

clearFieldError(
    passwordInput,
    passwordError
);
```

}

// =========================================================
// PASSWORD VISIBILITY
// =========================================================

function setupPasswordToggle() {

```
if (
    !togglePasswordButton ||
    !passwordInput
) {
    return;
}


togglePasswordButton.addEventListener(
    "click",
    () => {

        const isPassword =
            passwordInput.type === "password";


        passwordInput.type =
            isPassword
                ? "text"
                : "password";


        togglePasswordButton.setAttribute(
            "aria-pressed",
            String(isPassword)
        );


        togglePasswordButton.setAttribute(
            "aria-label",
            isPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
        );


        const icon =
            togglePasswordButton.querySelector(
                "i"
            );


        if (icon) {

            icon.classList.toggle(
                "fa-eye",
                !isPassword
            );

            icon.classList.toggle(
                "fa-eye-slash",
                isPassword
            );

        }

    }
);
```

}

// =========================================================
// LOGIN ERROR HANDLER
// =========================================================

function handleLoginError(error) {

```
console.error(
    "NetView Login Error:",
    error
);


const message =
    getLoginErrorMessage(
        error
    );


if (
    isEmailConfirmationError(
        error
    )
) {

    setFieldError(
        emailInput,
        emailError,
        message
    );

    showError(
        message
    );

    return;

}


if (
    isCredentialError(
        error
    )
) {

    setFieldError(
        passwordInput,
        passwordError,
        message
    );

    showError(
        message
    );

    return;

}


showError(
    message
);
```

}

// =========================================================
// ERROR MESSAGE
// =========================================================

function getLoginErrorMessage(error) {

```
if (!error) {

    return "Impossible de vous connecter. Veuillez réessayer.";

}


const message =
    String(
        error.message || ""
    ).toLowerCase();


const code =
    String(
        error.code || ""
    ).toLowerCase();


/*
 * Email non confirmé
 */

if (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed") ||
    code === "email_not_confirmed"
) {

    return (
        "Votre adresse e-mail n'est pas encore confirmée. " +
        "Veuillez confirmer votre adresse e-mail avant de vous connecter."
    );

}


/*
 * Identifiants incorrects
 */

if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    code === "invalid_credentials"
) {

    return (
        "Adresse e-mail ou mot de passe incorrect."
    );

}


/*
 * Trop de tentatives
 */

if (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    code.includes("rate")
) {

    return (
        "Trop de tentatives. Veuillez patienter quelques instants avant de réessayer."
    );

}


/*
 * Réseau
 */

if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("failed to fetch")
) {

    return (
        "Impossible de contacter NetView. Vérifiez votre connexion Internet puis réessayez."
    );

}


/*
 * Compte désactivé
 */

if (
    message.includes("disabled") ||
    message.includes("banned")
) {

    return (
        "Ce compte ne peut actuellement pas être utilisé."
    );

}


/*
 * Erreur générique
 */

return (
    "Impossible de vous connecter pour le moment. " +
    "Veuillez vérifier vos informations et réessayer."
);
```

}

// =========================================================
// ERROR TYPES
// =========================================================

function isEmailConfirmationError(error) {

```
if (!error) {
    return false;
}

const message =
    String(
        error.message || ""
    ).toLowerCase();

const code =
    String(
        error.code || ""
    ).toLowerCase();

return (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed") ||
    code === "email_not_confirmed"
);
```

}

function isCredentialError(error) {

```
if (!error) {
    return false;
}

const message =
    String(
        error.message || ""
    ).toLowerCase();

const code =
    String(
        error.code || ""
    ).toLowerCase();

return (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    code === "invalid_credentials"
);
```

}

// =========================================================
// REDIRECT
// =========================================================

function getRedirectUrl() {

```
/*
 * Si une page protégée avait demandé une connexion,
 * elle peut transmettre l'URL via ?redirect=...
 *
 * Sinon NetView retourne à l'accueil.
 */

const params =
    new URLSearchParams(
        window.location.search
    );


const redirect =
    params.get(
        "redirect"
    );


if (!redirect) {

    return "index.html";

}


/*
 * Sécurité :
 * uniquement des chemins internes NetView.
 */

if (
    redirect.startsWith("/") &&
    !redirect.startsWith("//")
) {

    return redirect;

}


if (
    !redirect.includes("://") &&
    !redirect.startsWith("//")
) {

    return redirect;

}


return "index.html";
```

}

// =========================================================
// WAIT
// =========================================================

function wait(milliseconds) {

```
return new Promise(
    resolve =>
        setTimeout(
            resolve,
            milliseconds
        )
);
```

}
