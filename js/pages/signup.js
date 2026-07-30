// ==========================================
// NetView
// signup.js
// ==========================================

import {

    signUp,
    resendVerification,
    updateUser,
    getSession

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

const signupForm =
document.getElementById("signupForm");

const signupButton =
document.getElementById("signupButton");

const signupError =
document.getElementById("signupError");


// Champs

const displayName =
document.getElementById("displayName");

const email =
document.getElementById("email");

const password =
document.getElementById("password");

const confirmPassword =
document.getElementById("confirmPassword");

const acceptTerms =
document.getElementById("acceptTerms");

const newsletter =
document.getElementById("newsletter");


// Mot de passe

const togglePassword =
document.getElementById("togglePassword");

const toggleConfirmPassword =
document.getElementById("toggleConfirmPassword");

const passwordStrengthBar =
document.getElementById("passwordStrengthBar");

const passwordStrengthText =
document.getElementById("passwordStrengthText");

const passwordMatch =
document.getElementById("passwordMatch");


// Loader

const pageLoader =
document.getElementById("pageLoader");


// ==========================================
// Modal confirmation e-mail
// ==========================================

const emailVerificationModal =
document.getElementById("emailVerificationModal");

const verificationEmail =
document.getElementById("verificationEmail");

const newVerificationEmail =
document.getElementById("newVerificationEmail");

const verificationMessage =
document.getElementById("verificationMessage");

const changeEmailButton =
document.getElementById("changeEmailButton");

const resendEmailButton =
document.getElementById("resendEmailButton");

const emailVerifiedButton =
document.getElementById("emailVerifiedButton");

const resendCountdown =
document.getElementById("resendCountdown");


// ==========================================
// État global
// ==========================================

// E-mail utilisé lors de l'inscription

let currentEmail = "";


// Données conservées tant que
// l'utilisateur n'a pas confirmé
// son adresse e-mail

let signupData = {

    displayName: "",
    email: "",
    password: "",
    newsletter: false

};


// Compte à rebours

let countdown = 60;

let countdownInterval = null;


// Vérification automatique
// de la confirmation

let verificationInterval = null;


// Évite plusieurs soumissions

let isSubmitting = false;


// Évite plusieurs renvois
// d'e-mail

let isResending = false;

// ==========================================
// Password Visibility
// ==========================================

function togglePasswordVisibility(

    input,
    button

){

    const isVisible =
        input.type === "text";

    input.type =
        isVisible
        ? "password"
        : "text";

    button.innerHTML =
        isVisible
        ? '<i class="fa-regular fa-eye"></i>'
        : '<i class="fa-regular fa-eye-slash"></i>';

    button.setAttribute(

        "aria-label",

        isVisible
        ? "Afficher le mot de passe"
        : "Masquer le mot de passe"

    );

}

togglePassword.addEventListener(

    "click",

    ()=>{

        togglePasswordVisibility(

            password,
            togglePassword

        );

    }

);

toggleConfirmPassword.addEventListener(

    "click",

    ()=>{

        togglePasswordVisibility(

            confirmPassword,
            toggleConfirmPassword

        );

    }

);


// ==========================================
// Password Strength
// ==========================================

function updatePasswordStrength(){

    const value =
        password.value;

    let score = 0;

    if(value.length >= 8){

        score++;

    }

    if(/[A-Z]/.test(value)){

        score++;

    }

    if(/[a-z]/.test(value)){

        score++;

    }

    if(/[0-9]/.test(value)){

        score++;

    }

    if(/[^A-Za-z0-9]/.test(value)){

        score++;

    }

    passwordStrengthBar.className =
        "nv-password-strength-bar";

    switch(score){

        case 0:
        case 1:

            passwordStrengthBar.style.width =
                "20%";

            passwordStrengthBar.classList.add(
                "weak"
            );

            passwordStrengthText.textContent =
                "Mot de passe très faible.";

            break;

        case 2:

            passwordStrengthBar.style.width =
                "40%";

            passwordStrengthBar.classList.add(
                "medium"
            );

            passwordStrengthText.textContent =
                "Mot de passe faible.";

            break;

        case 3:

            passwordStrengthBar.style.width =
                "60%";

            passwordStrengthBar.classList.add(
                "good"
            );

            passwordStrengthText.textContent =
                "Mot de passe correct.";

            break;

        case 4:

            passwordStrengthBar.style.width =
                "80%";

            passwordStrengthBar.classList.add(
                "strong"
            );

            passwordStrengthText.textContent =
                "Mot de passe fort.";

            break;

        case 5:

            passwordStrengthBar.style.width =
                "100%";

            passwordStrengthBar.classList.add(
                "very-strong"
            );

            passwordStrengthText.textContent =
                "Excellent mot de passe.";

            break;

    }

    checkPasswordMatch();

}


// ==========================================
// Password Confirmation
// ==========================================

function checkPasswordMatch(){

    passwordMatch.textContent = "";
    passwordMatch.className =
        "nv-password-match";

    if(confirmPassword.value === ""){

        return true;

    }

    if(password.value === confirmPassword.value){

        passwordMatch.textContent =
            "Les mots de passe correspondent.";

        passwordMatch.classList.add(
            "success"
        );

        return true;

    }

    passwordMatch.textContent =
        "Les mots de passe ne correspondent pas.";

    passwordMatch.classList.add(
        "error"
    );

    return false;

}


// ==========================================
// Events
// ==========================================

password.addEventListener(

    "input",

    updatePasswordStrength

);

confirmPassword.addEventListener(

    "input",

    checkPasswordMatch

);
