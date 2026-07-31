// ==========================================
// NetView
// signup.js
// ==========================================

import {
    signUp,
    resendVerification,
    updateUser,
    getSession,
    refreshUser,
    createProfile
} from "../core/auth.js";

import {
    showLoader,
    hideLoader,
    buttonLoading
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";


// ==========================================
// DOM
// ==========================================

// Formulaire
const signupForm = document.getElementById("signupForm");
const signupButton = document.getElementById("signupButton");
const signupError = document.getElementById("signupError");

// Notification flottante
const notification = document.getElementById("notification");

// Champs
const inputDisplayName = document.getElementById("displayName");
const inputEmail = document.getElementById("email");
const inputPassword = document.getElementById("password");
const inputConfirmPassword = document.getElementById("confirmPassword");
const acceptTerms = document.getElementById("acceptTerms");
const newsletter = document.getElementById("newsletter");

// Mot de passe
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const passwordStrengthBar = document.getElementById("passwordStrengthBar");
const passwordStrengthText = document.getElementById("passwordStrengthText");
const passwordMatch = document.getElementById("passwordMatch");

// Loader
const pageLoader = document.getElementById("pageLoader");

// ==========================================
// Modal confirmation e-mail
// ==========================================

const emailVerificationModal = document.getElementById("emailVerificationModal");
const verificationEmail = document.getElementById("verificationEmail");
const newVerificationEmail = document.getElementById("newVerificationEmail");
const verificationMessage = document.getElementById("verificationMessage");
const changeEmailButton = document.getElementById("changeEmailButton");
const resendEmailButton = document.getElementById("resendEmailButton");
const emailVerifiedButton = document.getElementById("emailVerifiedButton");
const resendCountdown = document.getElementById("resendCountdown");


// ==========================================
// État global
// ==========================================

let currentEmail = "";

let signupData = {
    displayName: "",
    email: "",
    password: "",
    newsletter: false
};

let resendSeconds = 60;
let resendTimer = null;
let verificationInterval = null;
let isSubmitting = false;
let isResending = false;


// ==========================================
// Notification Helper
// ==========================================

function showNotification(message, isError = false) {
    if (!notification) return;
    
    notification.textContent = message;
    notification.style.borderColor = isError ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
    notification.style.color = isError ? "#ef4444" : "#22c55e";
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 4000);
}


// ==========================================
// Password Visibility
// ==========================================

function togglePasswordVisibility(input, button) {
    const isVisible = input.type === "text";

    input.type = isVisible ? "password" : "text";

    button.innerHTML = isVisible
        ? '<i class="fa-regular fa-eye"></i>'
        : '<i class="fa-regular fa-eye-slash"></i>';

    button.setAttribute(
        "aria-label",
        isVisible ? "Afficher le mot de passe" : "Masquer le mot de passe"
    );
}

togglePassword.addEventListener("click", () => {
    togglePasswordVisibility(inputPassword, togglePassword);
});

toggleConfirmPassword.addEventListener("click", () => {
    togglePasswordVisibility(inputConfirmPassword, toggleConfirmPassword);
});


// ==========================================
// Password Strength
// ==========================================

function updatePasswordStrength() {
    const value = inputPassword.value;
    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    passwordStrengthBar.className = "nv-password-strength-bar";

    switch (score) {
        case 0:
        case 1:
            passwordStrengthBar.style.width = "20%";
            passwordStrengthBar.classList.add("weak");
            passwordStrengthText.textContent = "Mot de passe très faible.";
            break;
        case 2:
            passwordStrengthBar.style.width = "40%";
            passwordStrengthBar.classList.add("medium");
            passwordStrengthText.textContent = "Mot de passe faible.";
            break;
        case 3:
            passwordStrengthBar.style.width = "60%";
            passwordStrengthBar.classList.add("good");
            passwordStrengthText.textContent = "Mot de passe correct.";
            break;
        case 4:
            passwordStrengthBar.style.width = "80%";
            passwordStrengthBar.classList.add("strong");
            passwordStrengthText.textContent = "Mot de passe fort.";
            break;
        case 5:
            passwordStrengthBar.style.width = "100%";
            passwordStrengthBar.classList.add("very-strong");
            passwordStrengthText.textContent = "Excellent mot de passe.";
            break;
    }

    checkPasswordMatch();
}


// ==========================================
// Password Confirmation
// ==========================================

function checkPasswordMatch() {
    passwordMatch.textContent = "";
    passwordMatch.className = "nv-password-match";

    if (inputConfirmPassword.value === "") {
        return true;
    }

    if (inputPassword.value === inputConfirmPassword.value) {
        passwordMatch.textContent = "Les mots de passe correspondent.";
        passwordMatch.classList.add("success");
        return true;
    }

    passwordMatch.textContent = "Les mots de passe ne correspondent pas.";
    passwordMatch.classList.add("error");
    return false;
}


// ==========================================
// Events Input
// ==========================================

inputPassword.addEventListener("input", updatePasswordStrength);
inputConfirmPassword.addEventListener("input", checkPasswordMatch);


// ==========================================
// Signup Form
// ==========================================

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    signupError.textContent = "";
    signupError.classList.remove("show");

    const displayNameVal = inputDisplayName.value.trim();
    const emailVal = inputEmail.value.trim().toLowerCase();
    const passwordVal = inputPassword.value;
    const confirmPasswordVal = inputConfirmPassword.value;

    if (displayNameVal.length < 3) {
        const msg = "Le nom affiché doit contenir au moins 3 caractères.";
        signupError.textContent = msg;
        signupError.classList.add("show");
        showNotification(msg, true);
        inputDisplayName.focus();
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
        const msg = "Adresse e-mail invalide.";
        signupError.textContent = msg;
        signupError.classList.add("show");
        showNotification(msg, true);
        inputEmail.focus();
        return;
    }

    if (passwordVal.length < 8) {
        const msg = "Le mot de passe doit contenir au moins 8 caractères.";
        signupError.textContent = msg;
        signupError.classList.add("show");
        showNotification(msg, true);
        inputPassword.focus();
        return;
    }

    if (passwordVal !== confirmPasswordVal) {
        const msg = "Les mots de passe ne correspondent pas.";
        signupError.textContent = msg;
        signupError.classList.add("show");
        showNotification(msg, true);
        inputConfirmPassword.focus();
        return;
    }

    if (!acceptTerms.checked) {
        const msg = "Vous devez accepter les Conditions d'utilisation.";
        signupError.textContent = msg;
        signupError.classList.add("show");
        showNotification(msg, true);
        acceptTerms.focus();
        return;
    }

    buttonLoading(signupButton, true);
    showLoader();

    try {
        const { data, error } = await signUp(emailVal, passwordVal);

        if (error) {
            throw error;
        }

        signupData = {
            displayName: displayNameVal,
            email: emailVal,
            password: passwordVal,
            newsletter: newsletter.checked
        };

        currentEmail = emailVal;
        verificationEmail.textContent = emailVal;
        newVerificationEmail.value = emailVal;

        hideLoader();
        buttonLoading(signupButton, false);

        showNotification("Compte créé avec succès ! Vérifiez vos e-mails.");
        emailVerificationModal.classList.add("show");

    } catch (error) {
        hideLoader();
        buttonLoading(signupButton, false);

        const msg = error.message || "Impossible de créer le compte.";
        signupError.textContent = msg;
        signupError.classList.add("show");
        showNotification(msg, true);
    }
});


// ==========================================
// Email Verification Modal Functions
// ==========================================

function startResendCountdown() {
    resendSeconds = 60;
    resendEmailButton.disabled = true;

    resendCountdown.textContent = `Vous pourrez renvoyer un e-mail dans ${resendSeconds} s.`;

    clearInterval(resendTimer);

    resendTimer = setInterval(() => {
        resendSeconds--;

        if (resendSeconds <= 0) {
            clearInterval(resendTimer);
            resendEmailButton.disabled = false;
            resendCountdown.textContent = "Vous pouvez maintenant renvoyer un e-mail.";
            return;
        }

        resendCountdown.textContent = `Vous pourrez renvoyer un e-mail dans ${resendSeconds} s.`;
    }, 1000);
}


// ==========================================
// Change Email
// ==========================================

changeEmailButton.addEventListener("click", async () => {
    verificationMessage.textContent = "";

    const newEmail = newVerificationEmail.value.trim().toLowerCase();

    if (!newEmail) {
        verificationMessage.textContent = "Veuillez saisir une adresse e-mail.";
        showNotification("Veuillez saisir une adresse e-mail.", true);
        return;
    }

    if (newEmail === currentEmail) {
        verificationMessage.textContent = "Cette adresse e-mail est déjà utilisée.";
        showNotification("Cette adresse e-mail est déjà utilisée.", true);
        return;
    }

    changeEmailButton.disabled = true;

    try {
        const { error } = await updateUser({ email: newEmail });

        if (error) throw error;

        currentEmail = newEmail;
        signupData.email = newEmail;
        verificationEmail.textContent = newEmail;
        verificationMessage.textContent = "Adresse e-mail mise à jour. Un nouvel e-mail de confirmation a été envoyé.";
        showNotification("Adresse e-mail mise à jour avec succès.");

        await resendVerification(newEmail);
        startResendCountdown();

    } catch (error) {
        const msg = error.message || "Impossible de modifier l'adresse e-mail.";
        verificationMessage.textContent = msg;
        showNotification(msg, true);
    }

    changeEmailButton.disabled = false;
});


// ==========================================
// Resend Verification Email
// ==========================================

resendEmailButton.addEventListener("click", async () => {
    verificationMessage.textContent = "";
    resendEmailButton.disabled = true;

    try {
        const { error } = await resendVerification(currentEmail);

        if (error) throw error;

        verificationMessage.textContent = "Un nouvel e-mail de confirmation a été envoyé.";
        showNotification("E-mail de confirmation renvoyé.");
        startResendCountdown();

    } catch (error) {
        resendEmailButton.disabled = false;
        const msg = error.message || "Impossible de renvoyer l'e-mail.";
        verificationMessage.textContent = msg;
        showNotification(msg, true);
    }
});


// ==========================================
// Prevent Closing Modal on Overlay Click
// ==========================================

const modalOverlay = emailVerificationModal.querySelector(".nv-modal-overlay");
if (modalOverlay) {
    modalOverlay.addEventListener("click", event => {
        event.stopPropagation();
    });
}


// ==========================================
// Email Confirmation Check
// ==========================================

async function checkEmailConfirmation() {
    try {
        const user = await refreshUser();

        if (!user || !user.email_confirmed_at) {
            return false;
        }

        clearInterval(verificationInterval);

        emailVerifiedButton.disabled = true;
        emailVerifiedButton.textContent = "Confirmation détectée...";

        await createProfile({
            display_name: signupData.displayName,
            username: null,
            country: null,
            language: "fr"
        });

        showNotification("E-mail confirmé avec succès !");
        navigate("profile.html");
        return true;

    } catch (error) {
        console.error(error);
        return false;
    }
}

emailVerifiedButton.addEventListener("click", async () => {
    verificationMessage.textContent = "Vérification en cours...";

    const confirmed = await checkEmailConfirmation();

    if (!confirmed) {
        const msg = "Votre adresse e-mail n'est pas encore confirmée.";
        verificationMessage.textContent = msg;
        showNotification(msg, true);
    }
});

function startVerificationWatcher() {
    clearInterval(verificationInterval);
    verificationInterval = setInterval(checkEmailConfirmation, 10000);
}

const observer = new MutationObserver(() => {
    if (emailVerificationModal.classList.contains("show")) {
        startVerificationWatcher();
    }
});

observer.observe(emailVerificationModal, {
    attributes: true,
    attributeFilter: ["class"]
});


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
        console.error(error);
    }
})();


// ==========================================
// Clear Errors While Typing & Sync Modal
// ==========================================

[
    inputDisplayName,
    inputEmail,
    inputPassword,
    inputConfirmPassword
].forEach(input => {
    input.addEventListener("input", () => {
        signupError.textContent = "";
        signupError.classList.remove("show");
    });
});

inputEmail.addEventListener("input", () => {
    if (!emailVerificationModal.classList.contains("show")) return;

    const value = inputEmail.value.trim().toLowerCase();
    currentEmail = value;
    verificationEmail.textContent = value;
    newVerificationEmail.value = value;
});

newVerificationEmail.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        changeEmailButton.click();
    }
});

window.addEventListener("load", () => {
    inputDisplayName.focus();
});

window.addEventListener("beforeunload", () => {
    clearInterval(verificationInterval);
    clearInterval(resendTimer);
});

function resetVerificationMessage() {
    verificationMessage.textContent = "";
}

newVerificationEmail.addEventListener("input", resetVerificationMessage);

inputEmail.addEventListener("blur", () => {
    inputEmail.value = inputEmail.value.trim().toLowerCase();
});

newVerificationEmail.addEventListener("blur", () => {
    newVerificationEmail.value = newVerificationEmail.value.trim().toLowerCase();
});


// ==========================================
// Final Initialization
// ==========================================

updatePasswordStrength();
checkPasswordMatch();

console.info("NetView Signup Ready.");
