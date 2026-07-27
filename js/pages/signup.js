// ==========================================
// Imports
// ==========================================

import { supabase } from "../core/supabase.js";

import {

    signUp,
    resendVerification

} from "../core/auth.js";

import {

    showLoader,
    hideLoader,
    buttonLoading,
    showNotification

} from "../core/ui.js";

import {

    countries

} from "../assets/countries.js";
// ==========================================
// DOM
// ==========================================

// Form

const signupForm =
document.getElementById("signupForm");

// Username

const usernameInput =
document.getElementById("username");

const usernameMessage =
document.getElementById("usernameMessage");

// Display Name

const displayNameInput =
document.getElementById("displayName");

const displayNameMessage =
document.getElementById("displayNameMessage");

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

// Country

const countryInput =
document.getElementById("country");

const openCountryModal =
document.getElementById("openCountryModal");

const countryModal =
document.getElementById("countryModal");

const closeCountryModal =
document.getElementById("closeCountryModal");

const countrySearch =
document.getElementById("countrySearch");

const countryList =
document.getElementById("countryList");

// Language

const languageSelect =
document.getElementById("language");


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
// Country
// ==========================================

const openCountryModal =
document.getElementById("openCountryModal");

const closeCountryModal =
document.getElementById("closeCountryModal");

const countrySearch =
document.getElementById("countrySearch");

const countryList =
document.getElementById("countryList");


// ==========================================
// Terms
// ==========================================

const terms =
document.getElementById("terms");

// ==========================================
// Variables
// ==========================================

let signupInProgress = false;

let usernameTimer = null;

let lastUsername = "";

let usernameAvailable = false;
// ==========================================
// Username
// ==========================================

// Nettoyage

function cleanUsername(value){

    return value

        .toLowerCase()

        .trim()

        .replace(/\s+/g,"")

        .replace(/[^a-z0-9._]/g,"");

}

// Vérification locale

function validateUsername(){

    const username =
    cleanUsername(
        usernameInput.value
    );

    usernameInput.value =
    username;

    if(username.length === 0){

        usernameMessage.textContent =
        "Choisissez un nom d'utilisateur.";

        usernameMessage.className =
        "nv-help";

        usernameAvailable = false;

        return false;

    }

    if(username.length < 3){

        usernameMessage.textContent =
        "Minimum 3 caractères.";

        usernameMessage.className =
        "nv-help username-invalid";

        usernameAvailable = false;

        return false;

    }

    if(username.length > 30){

        usernameMessage.textContent =
        "Maximum 30 caractères.";

        usernameMessage.className =
        "nv-help username-invalid";

        usernameAvailable = false;

        return false;

    }

    return true;

}

// Vérification Supabase

async function checkUsername(){

    if(!validateUsername()){

        return;

    }

    const username =
    usernameInput.value;

    if(username === lastUsername){

        return;

    }

    lastUsername =
    username;

    usernameMessage.textContent =
    "Vérification...";

    usernameMessage.className =
    "nv-help username-check";

    const {

        data,

        error

    } = await supabase

        .from("profiles")

        .select("username")

        .eq("username",username)

        .maybeSingle();

    if(error){

        usernameAvailable = false;

        usernameMessage.textContent =
        "Erreur de vérification.";

        usernameMessage.className =
        "nv-help username-invalid";

        return;

    }

    if(data){

        usernameAvailable = false;

        usernameMessage.textContent =
        "Nom d'utilisateur déjà utilisé.";

        usernameMessage.className =
        "nv-help username-invalid";

        return;

    }

    usernameAvailable = true;

    usernameMessage.textContent =
    "Nom d'utilisateur disponible.";

    usernameMessage.className =
    "nv-help username-valid";

}

// Évènement

usernameInput.addEventListener(

    "input",

    ()=>{

        usernameInput.value =
        cleanUsername(
            usernameInput.value
        );

        usernameAvailable = false;

        clearTimeout(
            usernameTimer
        );

        usernameTimer =
        setTimeout(

            checkUsername,

            500

        );

    }

);
// ==========================================
// Display Name
// ==========================================

function validateDisplayName(){

    const value =

    displayNameInput.value

        .replace(/\s+/g," ")

        .trim();

    displayNameInput.value = value;

    if(value.length === 0){

        displayNameMessage.textContent =
        "Saisissez un nom affiché.";

        displayNameMessage.className =
        "nv-help";

        return false;

    }

    if(value.length < 3){

        displayNameMessage.textContent =
        "Minimum 3 caractères.";

        displayNameMessage.className =
        "nv-help display-invalid";

        return false;

    }

    if(value.length > 100){

        displayNameMessage.textContent =
        "Maximum 100 caractères.";

        displayNameMessage.className =
        "nv-help display-invalid";

        return false;

    }

    displayNameMessage.textContent =
    "Nom affiché valide.";

    displayNameMessage.className =
    "nv-help display-valid";

    return true;

}

displayNameInput.addEventListener(

    "input",

    validateDisplayName

);
// ==========================================
// Email
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

emailInput.addEventListener(

    "input",

    validateEmail

);

// ==========================================
// Country Validation
// ==========================================

function validateCountry(){

    if(
        countryInput.value.trim() === ""
    ){

        return false;

    }

    return true;

}
// ==========================================
// Terms Validation
// ==========================================

function checkTerms(){

    if(!termsCheckbox.checked){

        showNotification(
            "Vous devez accepter les conditions d'utilisation."
        );

        return false;

    }

    return true;

}
// ==========================================
// Render Countries
// ==========================================

function renderCountries(search=""){

    countryList.innerHTML="";


    countries

    .filter(country =>

        country

        .toLowerCase()

        .includes(
            search.toLowerCase()
        )

    )

    .forEach(country=>{


        const item =
        document.createElement("div");


        item.className =
        "country-item";


        item.textContent =
        country;


        item.onclick = ()=>{


            countryInput.value =
            country;


            countryModal.classList.remove(
                "active"
            );


        };


        countryList.appendChild(item);


    });


}
// ==========================================
// Password
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


// Afficher / masquer mot de passe

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


passwordInput.addEventListener(

    "input",

    ()=>{

        validatePassword();

        validateConfirmPassword();

    }

);
// ==========================================
// Confirm Password
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


// Afficher / masquer confirmation

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


confirmPasswordInput.addEventListener(

    "input",

    validateConfirmPassword

);
// ==========================================
// Country Events
// ==========================================

openCountryModal.onclick = ()=>{


    countryModal.classList.add(
        "active"
    );


    countrySearch.value =
    "";


    renderCountries();


};


closeCountryModal.onclick = ()=>{


    countryModal.classList.remove(
        "active"
    );


};


countryModal.onclick = (event)=>{


    if(
        event.target === countryModal
    ){

        countryModal.classList.remove(
            "active"
        );

    }


};


countrySearch.oninput = ()=>{


    renderCountries(
        countrySearch.value
    );


};
