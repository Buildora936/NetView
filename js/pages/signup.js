// ==========================================
// Imports
// ==========================================

import { signUp, resendVerification } from "../core/auth.js";

import {

    showLoader,
    hideLoader,
    buttonLoading,
    showNotification

} from "../core/ui.js";

// ==========================================
// DOM
// ==========================================

// Form

const signupForm =
document.getElementById("signupForm");

// Email

const emailInput =
document.getElementById("email");

const emailMessage =
document.getElementById("emailMessage");

// Password

const passwordInput =
document.getElementById("password");

const passwordMessage =
document.getElementById("passwordMessage");

const togglePassword =
document.getElementById("togglePassword");

const togglePasswordIcon =
document.getElementById("togglePasswordIcon");

// Confirm Password

const confirmPasswordInput =
document.getElementById("confirmPassword");

const confirmPasswordMessage =
document.getElementById("confirmPasswordMessage");

const toggleConfirmPassword =
document.getElementById("toggleConfirmPassword");

const toggleConfirmPasswordIcon =
document.getElementById("toggleConfirmPasswordIcon");

// Terms

const termsCheckbox =
document.getElementById("terms");

// Signup Button

const signupButton =
document.getElementById("signupButton");

const signupButtonText =
document.getElementById("signupButtonText");

const signupButtonLoader =
document.getElementById("signupButtonLoader");

// Verify Email Modal

const verifyEmailModal =
document.getElementById("verifyEmailModal");

const verifyEmailAddress =
document.getElementById("verifyEmailAddress");

const closeVerifyModal =
document.getElementById("closeVerifyModal");

const resendEmailButton =
document.getElementById("resendEmailButton");

const resendEmailText =
document.getElementById("resendEmailText");

const resendEmailLoader =
document.getElementById("resendEmailLoader");

const resendEmailMessage =
document.getElementById("resendEmailMessage");

// Loader

const globalLoader =
document.getElementById("globalLoader");

// Notification

const notification =
document.getElementById("notification");

// ==========================================
// Variables
// ==========================================

let signupInProgress = false;

let resendInProgress = false;

// ==========================================
// Email Validation
// ==========================================

function validateEmail(){

    const email =

    emailInput.value

        .trim()

        .toLowerCase();

    emailInput.value = email;

    if(email.length === 0){

        emailMessage.textContent =
        "Saisissez votre adresse e-mail.";

        emailMessage.className =
        "nv-help";

        return false;

    }

    const emailRegex =

    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailRegex.test(email)){

        emailMessage.textContent =
        "Adresse e-mail invalide.";

        emailMessage.className =
        "nv-help email-invalid";

        return false;

    }

    emailMessage.textContent =
    "Adresse e-mail valide.";

    emailMessage.className =
    "nv-help email-valid";

    return true;

}

// ==========================================
// Password Validation
// ==========================================

function validatePassword(){

    const password =
    passwordInput.value;

    if(password.length === 0){

        passwordMessage.textContent =
        "Saisissez un mot de passe.";

        passwordMessage.className =
        "nv-help";

        return false;

    }

    if(password.length < 8){

        passwordMessage.textContent =
        "Minimum 8 caractères.";

        passwordMessage.className =
        "nv-help password-invalid";

        return false;

    }

    if(!/[A-Z]/.test(password)){

        passwordMessage.textContent =
        "Ajoutez au moins une majuscule.";

        passwordMessage.className =
        "nv-help password-invalid";

        return false;

    }

    if(!/[0-9]/.test(password)){

        passwordMessage.textContent =
        "Ajoutez au moins un chiffre.";

        passwordMessage.className =
        "nv-help password-invalid";

        return false;

    }

    passwordMessage.textContent =
    "Mot de passe sécurisé.";

    passwordMessage.className =
    "nv-help password-valid";

    return true;

}

// ==========================================
// Confirm Password Validation
// ==========================================

function validateConfirmPassword(){

    const password =
    passwordInput.value;

    const confirmPassword =
    confirmPasswordInput.value;

    if(confirmPassword.length === 0){

        confirmPasswordMessage.textContent =
        "Confirmez votre mot de passe.";

        confirmPasswordMessage.className =
        "nv-help";

        return false;

    }

    if(password !== confirmPassword){

        confirmPasswordMessage.textContent =
        "Les mots de passe sont différents.";

        confirmPasswordMessage.className =
        "nv-help confirm-invalid";

        return false;

    }

    confirmPasswordMessage.textContent =
    "Les mots de passe correspondent.";

    confirmPasswordMessage.className =
    "nv-help confirm-valid";

    return true;

}

// ==========================================
// Terms Validation
// ==========================================

function validateTerms(){

    if(!termsCheckbox.checked){

        showNotification(

            "Vous devez accepter les conditions d'utilisation.",

            "error"

        );

        return false;

    }

    return true;

}

// ==========================================
// Form Validation
// ==========================================

function validateForm(){

    if(!validateEmail()){

        showNotification(

            "Adresse e-mail invalide.",

            "error"

        );

        return false;

    }

    if(!validatePassword()){

        showNotification(

            "Mot de passe invalide.",

            "error"

        );

        return false;

    }

    if(!validateConfirmPassword()){

        showNotification(

            "Les mots de passe ne correspondent pas.",

            "error"

        );

        return false;

    }

    if(!validateTerms()){

        return false;

    }

    return true;

}



// Afficher / masquer le mot de passe

togglePassword.addEventListener(

    "click",

    () => {

        const visible =
        passwordInput.type === "text";

        passwordInput.type =
        visible
            ? "password"
            : "text";

        togglePasswordIcon.className =
        visible
            ? "fa-regular fa-eye"
            : "fa-regular fa-eye-slash";

    }

);

// Afficher / masquer la confirmation

toggleConfirmPassword.addEventListener(

    "click",

    () => {

        const visible =
        confirmPasswordInput.type === "text";

        confirmPasswordInput.type =
        visible
            ? "password"
            : "text";

        toggleConfirmPasswordIcon.className =
        visible
            ? "fa-regular fa-eye"
            : "fa-regular fa-eye-slash";

    }

);

// Évènements

passwordInput.addEventListener(

    "input",

    () => {

        validatePassword();

        validateConfirmPassword();

    }

);

confirmPasswordInput.addEventListener(

    "input",

    validateConfirmPassword

);
// ==========================================
// Authentification Supabase
// ==========================================

// Création du compte

async function createAccount(){

    if(signupLoading){

        return;

    }


    signupLoading = true;


    signupButton.disabled = true;


    buttonLoading(
        signupButton,
        true
    );


    try{

        const {

            data,

            error

        } = await signUp(

            emailInput.value.trim(),

            passwordInput.value

        );


        if(error){

            throw error;

        }


        if(!data.user){

            throw new Error(
                "Création du compte impossible."
            );

        }


        openVerifyModal(

            emailInput.value.trim()

        );


    }


    catch(error){


        showNotification(

            error.message ||

            "Une erreur est survenue.",

            "error"

        );


    }


    finally{


        signupLoading = false;


        signupButton.disabled = false;


        buttonLoading(

            signupButton,

            false

        );


    }

}



// ==========================================
// Renvoi de l'e-mail de confirmation
// ==========================================

async function resendVerificationEmail(){

    resendEmailButton.disabled = true;


    try{


        const {

            error

        } = await resendVerification(

            emailInput.value.trim()

        );


        if(error){

            throw error;

        }


        resendEmailMessage.textContent =

        "E-mail de confirmation renvoyé.";


    }


    catch(error){


        resendEmailMessage.textContent =

        error.message ||

        "Impossible de renvoyer l'e-mail.";


    }


    finally{


        resendEmailButton.disabled = false;


    }

}



// ==========================================
// Réinitialisation du formulaire
// ==========================================

function resetSignupForm(){


    signupForm.reset();


    emailMessage.textContent = "";

    passwordMessage.textContent = "";

    confirmPasswordMessage.textContent = "";


}


// ==========================================
// Initialisation et Événements
// ==========================================

// Submit du formulaire

signupForm.addEventListener(

    "submit",

    async(event)=>{

        event.preventDefault();

        await createAccount();

    }

);


// Événements des champs

emailInput.addEventListener(

    "input",

    validateEmail

);


passwordInput.addEventListener(

    "input",

    ()=>{

        validatePassword();

        validateConfirmPassword();

    }

);


confirmPasswordInput.addEventListener(

    "input",

    validateConfirmPassword

);


// Bouton afficher / masquer mot de passe

togglePassword.addEventListener(

    "click",

    ()=>{

        const visible =

        passwordInput.type === "text";


        passwordInput.type =

        visible

        ? "password"

        : "text";


        togglePasswordIcon.className =

        visible

        ? "fa-regular fa-eye"

        : "fa-regular fa-eye-slash";

    }

);


// Bouton afficher / masquer confirmation

toggleConfirmPassword.addEventListener(

    "click",

    ()=>{

        const visible =

        confirmPasswordInput.type === "text";


        confirmPasswordInput.type =

        visible

        ? "password"

        : "text";


        toggleConfirmPasswordIcon.className =

        visible

        ? "fa-regular fa-eye"

        : "fa-regular fa-eye-slash";

    }

);


// Bouton renvoyer l'e-mail

resendEmailButton.addEventListener(

    "click",

    resendVerificationEmail

);


// Bouton fermer le modal

closeVerifyModal.addEventListener(

    "click",

    ()=>{

        verifyEmailModal.classList.remove(
            "active"
        );

    }

);


// Initialisation au chargement

window.addEventListener(

    "load",

    ()=>{

        console.log(
            "Signup Ready"
        );

    }

);
