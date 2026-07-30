import {
    signUp,
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
const signupForm = document.getElementById("signupForm");
const displayName = document.getElementById("displayName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const acceptTerms = document.getElementById("acceptTerms");
const newsletter = document.getElementById("newsletter");
const signupButton = document.getElementById("signupButton");
const signupError = document.getElementById("signupError");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

const passwordStrengthBar = document.getElementById("passwordStrengthBar");
const passwordStrengthText = document.getElementById("passwordStrengthText");
const passwordMatch = document.getElementById("passwordMatch");

// ==========================================
// Existing Session Check
// ==========================================
(async () => {
    try {
        const session = await getSession();
        if (session) {
            navigate("profile.html");
        }
    } catch (error) {
        console.error("Erreur de vérification de session :", error);
    }
})();

// ==========================================
// Password Visibility Toggles
// ==========================================
togglePassword.addEventListener("click", () => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    togglePassword.innerHTML = visible 
        ? '<i class="fa-regular fa-eye"></i>' 
        : '<i class="fa-regular fa-eye-slash"></i>';
    togglePassword.setAttribute("aria-label", visible ? "Afficher le mot de passe" : "Masquer le mot de passe");
});

toggleConfirmPassword.addEventListener("click", () => {
    const visible = confirmPassword.type === "text";
    confirmPassword.type = visible ? "password" : "text";
    toggleConfirmPassword.innerHTML = visible 
        ? '<i class="fa-regular fa-eye"></i>' 
        : '<i class="fa-regular fa-eye-slash"></i>';
    toggleConfirmPassword.setAttribute("aria-label", visible ? "Afficher le mot de passe" : "Masquer le mot de passe");
});

// ==========================================
// Password Strength Evaluator
// ==========================================
password.addEventListener("input", () => {
    const val = password.value;
    let strength = 0;
    let message = "Choisissez un mot de passe sécurisé.";
    let color = "#ef4444"; // Rouge par défaut

    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    if (val.length === 0) {
        passwordStrengthBar.style.width = "0%";
        passwordStrengthText.textContent = "Choisissez un mot de passe sécurisé.";
        passwordStrengthText.style.color = "var(--nv-text-secondary)";
        return;
    }

    if (strength <= 1) {
        passwordStrengthBar.style.width = "25%";
        passwordStrengthBar.style.backgroundColor = "#ef4444";
        message = "Mot de passe trop faible";
        color = "#ef4444";
    } else if (strength === 2 || strength === 3) {
        passwordStrengthBar.style.width = "65%";
        passwordStrengthBar.style.backgroundColor = "#f59e0b";
        message = "Mot de passe moyen";
        color = "#f59e0b";
    } else {
        passwordStrengthBar.style.width = "100%";
        passwordStrengthBar.style.backgroundColor = "#10b981";
        message = "Mot de passe sécurisé !";
        color = "#10b981";
    }

    passwordStrengthText.textContent = message;
    passwordStrengthText.style.color = color;

    // Vérifier également la correspondance si le champ de confirmation n'est pas vide
    if (confirmPassword.value) {
        checkPasswordMatch();
    }
});

// ==========================================
// Password Match Evaluator
// ==========================================
function checkPasswordMatch() {
    if (!confirmPassword.value) {
        passwordMatch.textContent = "";
        return;
    }

    if (password.value === confirmPassword.value) {
        passwordMatch.textContent = "Les mots de passe correspondent.";
        passwordMatch.style.color = "#10b981";
    } else {
        passwordMatch.textContent = "Les mots de passe ne correspondent pas.";
        passwordMatch.style.color = "#ef4444";
    }
}

confirmPassword.addEventListener("input", checkPasswordMatch);

// ==========================================
// Remove Error While Typing
// ==========================================
[displayName, email, password, confirmPassword].forEach(input => {
    input.addEventListener("input", () => {
        signupError.textContent = "";
        signupError.classList.remove("show");
    });
});

// ==========================================
// Signup Form Submission
// ==========================================
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    signupError.textContent = "";
    signupError.classList.remove("show");

    // Validation de la correspondance des mots de passe côté JS avant l'envoi
    if (password.value !== confirmPassword.value) {
        signupError.textContent = "Les mots de passe ne correspondent pas.";
        signupError.classList.add("show");
        confirmPassword.focus();
        return;
    }

    if (password.value.length < 8) {
        signupError.textContent = "Le mot de passe doit contenir au moins 8 caractères.";
        signupError.classList.add("show");
        password.focus();
        return;
    }

    buttonLoading(signupButton, true);
    showLoader();

    try {
        // Appel de la fonction signUp (qui intègre Supabase dans votre auth.js)
        // On peut passer des données additionnelles dans 'options.data' (comme le nom affiché)
        const res = await signUp(
            email.value.trim(),
            password.value,
            {
                data: {
                    display_name: displayName.value.trim(),
                    newsletter: newsletter.checked
                }
            }
        );

        hideLoader();
        buttonLoading(signupButton, false);

        if (res && res.error) {
            signupError.textContent = res.error.message;
            signupError.classList.add("show");
            return;
        }

        // Redirection vers profile.html après succès de l'inscription
        navigate("profile.html");

    } catch (err) {
        hideLoader();
        buttonLoading(signupButton, false);
        console.error("Erreur lors de l'inscription :", err);
        signupError.textContent = "Une erreur inattendue est survenue. Veuillez réessayer.";
        signupError.classList.add("show");
    }
});

// ==========================================
// Initial Focus
// ==========================================
window.addEventListener("load", () => {
    displayName.focus();
});
