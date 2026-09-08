/* ==========================================
NetView
login.js
js/pages/login.js
========================================== */

import {
signIn,
getSession,
getUser,
getRole
} from "../core/auth.js";

import {
navigate,
initNavigation
} from "../navigation.js";

import {
showError,
showSuccess,
buttonLoading
} from "../core/ui.js";

/* ==========================================
DOM
========================================== */

const form =
document.getElementById("loginForm");

const emailInput =
document.getElementById("email");

const passwordInput =
document.getElementById("password");

const rememberInput =
document.getElementById("remember");

const loginButton =
document.getElementById("loginButton");

const togglePassword =
document.getElementById("togglePassword");

const emailError =
document.getElementById("emailError");

const passwordError =
document.getElementById("passwordError");

const pageLoader =
document.getElementById("pageLoader");

const currentYear =
document.getElementById("currentYear");

/* ==========================================
Initialization
========================================== */

document.addEventListener(
"DOMContentLoaded",
initLogin
);

/* ==========================================
Initialize Login
========================================== */

async function initLogin() {

```
if (currentYear) {
    currentYear.textContent =
        new Date().getFullYear();
}

initNavigation();

hidePageLoader();

setupPasswordToggle();
setupFormValidation();
setupLoginForm();

await checkExistingSession();
```

}

/* ==========================================
Existing Session
========================================== */

async function checkExistingSession() {

```
try {

    showPageLoader();

    const session =
        await getSession();

    if (!session) {

        hidePageLoader();

        return;

    }

    /*
     * Une session existe déjà.
     * On récupère l'utilisateur afin
     * de confirmer que la session est
     * réellement exploitable.
     */

    const user =
        await getUser();

    if (!user) {

        hidePageLoader();

        return;

    }

    /*
     * Le profil utilise uniquement :
     *
     * user
     * pro
     *
     * getRole() lit profiles.account_type.
     */

    const role =
        await getRole();

    if (
        role !== "user" &&
        role !== "pro"
    ) {

        hidePageLoader();

        return;

    }

    redirectAfterLogin();

}

catch (error) {

    console.error(
        "NetView — Vérification session :",
        error
    );

    hidePageLoader();

}
```

}

/* ==========================================
Password Toggle
========================================== */

function setupPasswordToggle() {

```
if (
    !togglePassword ||
    !passwordInput
) {
    return;
}

togglePassword.addEventListener(
    "click",
    () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword
                ? "text"
                : "password";

        togglePassword.setAttribute(
            "aria-pressed",
            String(isPassword)
        );

        togglePassword.setAttribute(
            "aria-label",
            isPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
        );

        const icon =
            togglePassword.querySelector("i");

        if (!icon) {
            return;
        }

        icon.classList.toggle(
            "fa-eye",
            !isPassword
        );

        icon.classList.toggle(
            "fa-eye-slash",
            isPassword
        );

    }
);
```

}

/* ==========================================
Form Setup
========================================== */

function setupLoginForm() {

```
if (!form) {
    return;
}

form.addEventListener(
    "submit",
    handleLogin
);
```

}

/* ==========================================
Login
========================================== */

async function handleLogin(event) {

```
event.preventDefault();

clearErrors();

const email =
    emailInput
        ? emailInput.value.trim()
        : "";

const password =
    passwordInput
        ? passwordInput.value
        : "";

const remember =
    rememberInput
        ? rememberInput.checked
        : true;


/* ======================================
   Validation
   ====================================== */

const valid =
    validateForm(
        email,
        password
    );

if (!valid) {
    return;
}


/* ======================================
   Prevent Multiple Submissions
   ====================================== */

if (
    loginButton &&
    loginButton.disabled
) {
    return;
}


setLoginLoading(true);

try {

    /*
     * La connexion passe obligatoirement
     * par auth.js.
     *
     * auth.js appelle :
     *
     * supabase.auth.signInWithPassword()
     */

    const result =
        await signIn(
            email,
            password
        );


    if (result?.error) {

        throw result.error;

    }


    /*
     * Supabase peut retourner une session
     * après une connexion réussie.
     */

    const session =
        result?.data?.session ||
        await getSession();

    if (!session) {

        throw new Error(
            "La connexion n'a pas pu être établie."
        );

    }


    /*
     * Vérification de l'utilisateur
     */

    const user =
        await getUser();

    if (!user) {

        throw new Error(
            "Utilisateur introuvable après la connexion."
        );

    }


    /*
     * Vérification du type de compte.
     *
     * NetView accepte uniquement :
     *
     * user
     * pro
     */

    const accountType =
        await getRole();

    if (
        accountType !== "user" &&
        accountType !== "pro"
    ) {

        throw new Error(
            "Le type de compte NetView est invalide."
        );

    }


    /*
     * Remember me
     *
     * La session Supabase est déjà persistante
     * via supabase.js.
     *
     * On ne stocke jamais le mot de passe.
     *
     * La case est donc uniquement conservée
     * comme préférence locale d'interface.
     */

    if (remember) {

        localStorage.setItem(
            "netview_remember_login",
            "true"
        );

    }
    else {

        localStorage.removeItem(
            "netview_remember_login"
        );

    }


    showSuccess(
        "Connexion réussie."
    );


    /*
     * Petit délai afin de laisser le message
     * de succès être visible avant la navigation.
     */

    await wait(250);


    redirectAfterLogin();

}

catch (error) {

    console.error(
        "NetView — Connexion :",
        error
    );

    handleLoginError(error);

    setLoginLoading(false);

    hidePageLoader();

}
```

}

/* ==========================================
Validation
========================================== */

function validateForm(
email,
password
) {

```
let valid = true;


/* ======================================
   Email
   ====================================== */

if (!email) {

    setFieldError(
        emailInput,
        emailError,
        "Veuillez saisir votre adresse e-mail."
    );

    valid = false;

}
else if (!isValidEmail(email)) {

    setFieldError(
        emailInput,
        emailError,
        "Veuillez saisir une adresse e-mail valide."
    );

    valid = false;

}


/* ======================================
   Password
   ====================================== */

if (!password) {

    setFieldError(
        passwordInput,
        passwordError,
        "Veuillez saisir votre mot de passe."
    );

    valid = false;

}


if (!valid) {

    focusFirstInvalidField();

}


return valid;
```

}

/* ==========================================
Email Validation
========================================== */

function isValidEmail(email) {

```
return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
);
```

}

/* ==========================================
Field Error
========================================== */

function setFieldError(
input,
errorElement,
message
) {

```
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
```

}

/* ==========================================
Clear Errors
========================================== */

function clearErrors() {

```
if (emailError) {

    emailError.textContent = "";

}

if (passwordError) {

    passwordError.textContent = "";

}

[
    emailInput,
    passwordInput
].forEach(input => {

    if (!input) {
        return;
    }

    input.classList.remove(
        "is-invalid"
    );

    input.removeAttribute(
        "aria-invalid"
    );

});
```

}

/* ==========================================
Live Validation
========================================== */

function setupFormValidation() {

```
if (emailInput) {

    emailInput.addEventListener(
        "input",
        () => {

            emailInput.classList.remove(
                "is-invalid"
            );

            emailInput.removeAttribute(
                "aria-invalid"
            );

            if (emailError) {

                emailError.textContent =
                    "";

            }

        }
    );

}


if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        () => {

            passwordInput.classList.remove(
                "is-invalid"
            );

            passwordInput.removeAttribute(
                "aria-invalid"
            );

            if (passwordError) {

                passwordError.textContent =
                    "";

            }

        }
    );

}
```

}

/* ==========================================
Focus Invalid Field
========================================== */

function focusFirstInvalidField() {

```
if (
    emailInput &&
    emailInput.classList.contains(
        "is-invalid"
    )
) {

    emailInput.focus();

    return;

}

if (
    passwordInput &&
    passwordInput.classList.contains(
        "is-invalid"
    )
) {

    passwordInput.focus();

}
```

}

/* ==========================================
Login Error Handler
========================================== */

function handleLoginError(error) {

```
const message =
    getFriendlyAuthError(error);


/*
 * Erreur email
 */

if (
    message.field === "email"
) {

    setFieldError(
        emailInput,
        emailError,
        message.text
    );

    if (emailInput) {
        emailInput.focus();
    }

    return;

}


/*
 * Erreur password
 */

if (
    message.field === "password"
) {

    setFieldError(
        passwordInput,
        passwordError,
        message.text
    );

    if (passwordInput) {
        passwordInput.focus();
    }

    return;

}


/*
 * Erreur générale
 */

showError({
    message: message.text
});
```

}

/* ==========================================
Friendly Supabase Errors
========================================== */

function getFriendlyAuthError(error) {

```
const raw =
    String(
        error?.message ||
        ""
    ).toLowerCase();


/*
 * Email non confirmé
 */

if (
    raw.includes("email not confirmed") ||
    raw.includes("email_not_confirmed")
) {

    return {
        field: "email",
        text:
            "Votre adresse e-mail n'est pas encore confirmée. Vérifiez votre boîte e-mail avant de vous connecter."
    };

}


/*
 * Identifiants incorrects
 */

if (
    raw.includes("invalid login credentials") ||
    raw.includes("invalid credentials") ||
    raw.includes("invalid email or password")
) {

    return {
        field: "password",
        text:
            "Adresse e-mail ou mot de passe incorrect."
    };

}


/*
 * Trop de tentatives
 */

if (
    raw.includes("rate limit") ||
    raw.includes("too many requests")
) {

    return {
        field: null,
        text:
            "Trop de tentatives. Veuillez patienter quelques instants avant de réessayer."
    };

}


/*
 * Réseau
 */

if (
    raw.includes("network") ||
    raw.includes("fetch") ||
    raw.includes("failed to fetch") ||
    raw.includes("connection")
) {

    return {
        field: null,
        text:
            "Impossible de contacter NetView. Vérifiez votre connexion Internet puis réessayez."
    };

}


/*
 * Erreur générique
 */

return {
    field: null,
    text:
        "Impossible de vous connecter pour le moment. Vérifiez vos informations puis réessayez."
};
```

}

/* ==========================================
Loading State
========================================== */

function setLoginLoading(state) {

```
if (loginButton) {

    buttonLoading(
        loginButton,
        state
    );

}

if (state) {

    showPageLoader();

}
else {

    hidePageLoader();

}
```

}

/* ==========================================
Page Loader
========================================== */

function showPageLoader() {

```
if (!pageLoader) {
    return;
}

pageLoader.style.display =
    "flex";

pageLoader.setAttribute(
    "aria-hidden",
    "false"
);
```

}

function hidePageLoader() {

```
if (!pageLoader) {
    return;
}

/*
 * Important :
 * login.css définit display:flex.
 *
 * On force donc réellement
 * display:none ici.
 */

pageLoader.style.display =
    "none";

pageLoader.setAttribute(
    "aria-hidden",
    "true"
);
```

}

/* ==========================================
Redirect
========================================== */

function redirectAfterLogin() {

```
const redirect =
    getRedirectUrl();


if (
    redirect &&
    isSafeRedirect(redirect)
) {

    navigate(
        redirect
    );

    return;

}


navigate(
    "index.html"
);
```

}

/* ==========================================
Redirect URL
========================================== */

function getRedirectUrl() {

```
const params =
    new URLSearchParams(
        window.location.search
    );


const redirect =
    params.get(
        "redirect"
    );


if (!redirect) {

    return null;

}


return decodeURIComponent(
    redirect
);
```

}

/* ==========================================
Safe Redirect
========================================== */

function isSafeRedirect(url) {

```
if (!url) {
    return false;
}


/*
 * Empêche les redirections externes.
 */

if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//")
) {

    return false;

}


/*
 * Empêche javascript:
 * data:
 * et autres schémas.
 */

if (
    /^[a-z][a-z0-9+.-]*:/i.test(url)
) {

    return false;

}


return true;
```

}

/* ==========================================
Utility
========================================== */

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
