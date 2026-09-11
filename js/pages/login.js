import {
signIn,
getSession,
getUser
} from "../core/auth.js";

import {
getProfile
} from "../core/data.js";

const loginForm =
document.getElementById("loginForm");

const emailInput =
document.getElementById("email");

const passwordInput =
document.getElementById("password");

const togglePasswordButton =
document.getElementById("togglePassword");

const rememberInput =
document.getElementById("remember");

const loginButton =
document.getElementById("loginButton");

const emailError =
document.getElementById("emailError");

const passwordError =
document.getElementById("passwordError");

const pageLoader =
document.getElementById("pageLoader");

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
setupLinks();

```
await checkExistingSession();
```

}

function setCurrentYear() {
if (!currentYear) {
return;
}

```
currentYear.textContent =
    String(new Date().getFullYear());
```

}

function setupForm() {
if (!loginForm) {
return;
}

```
loginForm.addEventListener(
    "submit",
    handleSubmit
);

emailInput?.addEventListener(
    "input",
    () => {
        clearFieldError(emailInput, emailError);
    }
);

passwordInput?.addEventListener(
    "input",
    () => {
        clearFieldError(passwordInput, passwordError);
    }
);
```

}

function setupPasswordToggle() {
if (
!togglePasswordButton ||
!passwordInput
) {
return;
}

```
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
            togglePasswordButton.querySelector("i");

        if (icon) {
            icon.className =
                isPassword
                    ? "fa-regular fa-eye-slash"
                    : "fa-regular fa-eye";
        }

        passwordInput.focus();
    }
);
```

}

function setupLinks() {
document
.querySelectorAll("[data-link]")
.forEach(link => {
link.addEventListener(
"click",
event => {
const target =
link.getAttribute("data-link");

```
                if (!target) {
                    return;
                }

                event.preventDefault();

                window.location.href =
                    target;
            }
        );
    });
```

}

async function checkExistingSession() {
try {
const session =
await getSession();

```
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

    await redirectAuthenticatedUser();
} catch (error) {
    console.error(
        "NetView login session check error:",
        error
    );

    hidePageLoader();
}
```

}

async function handleSubmit(event) {
event.preventDefault();

```
if (isSubmitting) {
    return;
}

clearErrors();

const validation =
    validateForm();

if (!validation.valid) {
    showValidationError(
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

    const user =
        result?.user ||
        result?.data?.user ||
        await getUser();

    if (!user?.id) {
        throw new Error(
            "La connexion a réussi, mais le compte NetView n'a pas pu être récupéré."
        );
    }

    await getProfileSafe();

    /*
     * Supabase est actuellement configuré avec
     * persistSession: true dans supabase.js.
     *
     * Le champ "Rester connecté" reste donc une
     * préférence d'interface tant que le client Supabase
     * n'est pas configuré pour un mode session-only.
     */
    void rememberInput?.checked;

    await redirectAuthenticatedUser();
} catch (error) {
    console.error(
        "NetView login error:",
        error
    );

    hidePageLoader();

    showAuthenticationError(
        error
    );
} finally {
    isSubmitting = false;

    setSubmittingState(false);
}
```

}

async function getProfileSafe() {
try {
const profile =
await getProfile();

```
    if (!profile) {
        console.warn(
            "NetView: aucun profil trouvé pour l'utilisateur connecté."
        );
    }

    return profile;
} catch (error) {
    console.warn(
        "NetView profile retrieval warning:",
        error
    );

    return null;
}
```

}

async function redirectAuthenticatedUser() {
const destination =
getSafeRedirectDestination();

```
window.location.replace(
    destination
);
```

}

function getSafeRedirectDestination() {
const params =
new URLSearchParams(
window.location.search
);

```
const redirect =
    params.get("redirect");

if (
    redirect &&
    isSafeInternalPath(redirect)
) {
    return redirect;
}

return "index.html";
```

}

function isSafeInternalPath(value) {
if (!value) {
return false;
}

```
if (
    value.startsWith("//") ||
    value.includes("://")
) {
    return false;
}

if (
    value.startsWith("javascript:")
) {
    return false;
}

return (
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.endsWith(".html") ||
    value.includes(".html?")
);
```

}

function validateForm() {
const email =
normalizeEmail(
emailInput?.value
);

```
const password =
    passwordInput?.value || "";

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
```

}

function normalizeEmail(value) {
return String(
value || ""
)
.trim()
.toLowerCase();
}

function isValidEmail(email) {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(
email
);
}

function showAuthenticationError(error) {
const message =
normalizeAuthError(error);

```
if (
    isEmailError(message)
) {
    showValidationError(
        "email",
        message
    );

    return;
}

if (
    isPasswordError(message)
) {
    showValidationError(
        "password",
        message
    );

    return;
}

showGlobalError(
    message
);
```

}

function normalizeAuthError(error) {
if (!error) {
return (
"Impossible de vous connecter à NetView."
);
}

```
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
        "network"
    ) ||
    message.includes(
        "failed to fetch"
    )
) {
    return (
        "Impossible de contacter NetView. Vérifiez votre connexion Internet."
    );
}

return (
    "Impossible de vous connecter. Vérifiez vos informations et réessayez."
);
```

}

function isEmailError(message) {
return (
message.includes(
"e-mail"
) &&
!message.includes(
"mot de passe"
)
);
}

function isPasswordError(message) {
return message.includes(
"mot de passe"
);
}

function showValidationError(
field,
message
) {
clearErrors();

```
if (field === "email") {
    showFieldError(
        emailInput,
        emailError,
        message
    );

    return;
}

if (field === "password") {
    showFieldError(
        passwordInput,
        passwordError,
        message
    );
}
```

}

function showFieldError(
input,
errorElement,
message
) {
if (input) {
input.classList.add(
"is-invalid"
);

```
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
```

}

function clearFieldError(
input,
errorElement
) {
if (input) {
input.classList.remove(
"is-invalid"
);

```
    input.setAttribute(
        "aria-invalid",
        "false"
    );
}

if (errorElement) {
    errorElement.textContent =
        "";
}
```

}

function clearErrors() {
clearFieldError(
emailInput,
emailError
);

```
clearFieldError(
    passwordInput,
    passwordError
);
```

}

function showGlobalError(message) {
/*
* login.html actuel ne possède pas de conteneur
* d'erreur global. On utilise donc les champs
* lorsqu'une erreur peut être rattachée à un champ,
* sinon une notification navigateur contrôlée.
*/
window.alert(
message
);
}

function setSubmittingState(submitting) {
if (!loginButton) {
return;
}

```
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
    content.dataset.original =
        content.innerHTML;

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
    content.dataset.original
) {
    content.innerHTML =
        content.dataset.original;

    delete content.dataset.original;
}
```

}

function showPageLoader() {
if (!pageLoader) {
return;
}

```
pageLoader.style.display =
    "flex";

pageLoader.setAttribute(
    "aria-hidden",
    "false"
);
```

}

function hidePageLoader() {
if (!pageLoader) {
return;
}

```
pageLoader.style.display =
    "none";

pageLoader.setAttribute(
    "aria-hidden",
    "true"
);
```

}
