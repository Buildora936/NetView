// ==========================================
// Imports
// ==========================================

import {
    signUp
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

const signupForm =
document.getElementById("signupForm");

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

const signupButton =
document.getElementById("signupButton");

const signupError =
document.getElementById("signupError");

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


// Modal

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


// Loader

const pageLoader =
document.getElementById("pageLoader");


// ==========================================
// Variables
// ==========================================

let passwordScore = 0;

let resendSeconds = 60;

let resendInterval = null;

let signupData = null;


// ==========================================
// Password Visibility
// ==========================================

function togglePasswordVisibility(
    input,
    button
){

    const visible =
    input.type === "text";

    input.type =
    visible
    ? "password"
    : "text";

    button.innerHTML =
    visible

    ? '<i class="fa-regular fa-eye"></i>'

    : '<i class="fa-regular fa-eye-slash"></i>';

    button.setAttribute(

        "aria-label",

        visible

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

    passwordScore = score;

    passwordStrengthBar.className =
    "nv-password-strength-bar";

    switch(score){

        case 0:
        case 1:

            passwordStrengthBar.style.width = "20%";

            passwordStrengthBar.classList.add("weak");

            passwordStrengthText.textContent =
            "Mot de passe très faible.";

        break;

        case 2:

            passwordStrengthBar.style.width = "40%";

            passwordStrengthBar.classList.add("medium");

            passwordStrengthText.textContent =
            "Mot de passe faible.";

        break;

        case 3:

            passwordStrengthBar.style.width = "60%";

            passwordStrengthBar.classList.add("good");

            passwordStrengthText.textContent =
            "Mot de passe correct.";

        break;

        case 4:

            passwordStrengthBar.style.width = "80%";

            passwordStrengthBar.classList.add("strong");

            passwordStrengthText.textContent =
            "Mot de passe fort.";

        break;

        case 5:

            passwordStrengthBar.style.width = "100%";

            passwordStrengthBar.classList.add("very-strong");

            passwordStrengthText.textContent =
            "Excellent mot de passe.";

        break;

    }

}

password.addEventListener(

    "input",

    updatePasswordStrength

);


// ==========================================
// Password Confirmation
// ==========================================

function updatePasswordMatch(){

    if(

        confirmPassword.value === ""

    ){

        passwordMatch.textContent = "";

        passwordMatch.className =
        "nv-password-match";

        return;

    }

    if(

        password.value ===
        confirmPassword.value

    ){

        passwordMatch.textContent =
        "Les mots de passe correspondent.";

        passwordMatch.className =
        "nv-password-match success";

    }

    else{

        passwordMatch.textContent =
        "Les mots de passe sont différents.";

        passwordMatch.className =
        "nv-password-match error";

    }

}

password.addEventListener(

    "input",

    updatePasswordMatch

);

confirmPassword.addEventListener(

    "input",

    updatePasswordMatch

);
