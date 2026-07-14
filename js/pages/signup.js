// ==========================================
// NetView
// signup.js
// ==========================================

// ==========================================
// Imports
// ==========================================

import {
    signUp
} from "../core/auth.js";

import {
    supabase
} from "../core/supabase.js";

import {
    showLoader,
    hideLoader,
    buttonLoading,
    showSuccess,
    showError
} from "../core/ui.js";


// ==========================================
// Variables
// ==========================================

let submitting = false;


// ==========================================
// DOM Elements
// ==========================================

// Form

const signupForm =
document.getElementById(
    "signupForm"
);

const signupButton =
document.getElementById(
    "signupButton"
);

// Inputs

const usernameInput =
document.getElementById(
    "username"
);

const displayNameInput =
document.getElementById(
    "displayName"
);

const emailInput =
document.getElementById(
    "email"
);

const passwordInput =
document.getElementById(
    "password"
);

const confirmPasswordInput =
document.getElementById(
    "confirmPassword"
);

// Password Toggle

const togglePassword =
document.getElementById(
    "togglePassword"
);

const toggleConfirmPassword =
document.getElementById(
    "toggleConfirmPassword"
);

// Messages

const signupError =
document.getElementById(
    "signupError"
);

const signupSuccess =
document.getElementById(
    "signupSuccess"
);

// Loader

const pageLoader =
document.getElementById(
    "pageLoader"
);
// ==========================================
// Password Toggle
// ==========================================

function togglePasswordVisibility(
    input,
    button
){

    const isHidden =
    input.type === "password";

    input.type =
    isHidden
    ? "text"
    : "password";

    button.innerHTML =
    isHidden
    ? '<i class="fa-regular fa-eye-slash"></i>'
    : '<i class="fa-regular fa-eye"></i>';

}

togglePassword.addEventListener(
    "click",
    ()=>{

        togglePasswordVisibility(
            passwordInput,
            togglePassword
        );

    }
);

toggleConfirmPassword.addEventListener(
    "click",
    ()=>{

        togglePasswordVisibility(
            confirmPasswordInput,
            toggleConfirmPassword
        );

    }
);


// ==========================================
// Validation
// ==========================================

function clearMessages(){

    signupError.textContent = "";

    signupSuccess.textContent = "";

    signupError.style.display = "none";

    signupSuccess.style.display = "none";

}

function showSignupError(message){

    signupError.textContent = message;

    signupError.style.display = "block";

}

function showSignupSuccess(message){

    signupSuccess.textContent = message;

    signupSuccess.style.display = "block";

}

function validateForm(){

    const username =
    usernameInput.value
    .trim()
    .toLowerCase();

    const displayName =
    displayNameInput.value
    .trim();

    const email =
    emailInput.value
    .trim()
    .toLowerCase();

    const password =
    passwordInput.value;

    const confirmPassword =
    confirmPasswordInput.value;

    if(username === ""){

        showSignupError(
            "Veuillez saisir un nom d'utilisateur."
        );

        usernameInput.focus();

        return false;

    }

    if(username.length < 3){

        showSignupError(
            "Le nom d'utilisateur doit contenir au moins 3 caractères."
        );

        usernameInput.focus();

        return false;

    }

    if(username.length > 30){

        showSignupError(
            "Le nom d'utilisateur ne peut pas dépasser 30 caractères."
        );

        usernameInput.focus();

        return false;

    }

    if(!/^[a-z0-9._]+$/.test(username)){

        showSignupError(
            "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points et tirets bas."
        );

        usernameInput.focus();

        return false;

    }

    if(displayName === ""){

        showSignupError(
            "Veuillez saisir votre nom complet."
        );

        displayNameInput.focus();

        return false;

    }

    if(email === ""){

        showSignupError(
            "Veuillez saisir une adresse e-mail."
        );

        emailInput.focus();

        return false;

    }

    if(password.length < 8){

        showSignupError(
            "Le mot de passe doit contenir au moins 8 caractères."
        );

        passwordInput.focus();

        return false;

    }

    if(password !== confirmPassword){

        showSignupError(
            "Les mots de passe ne correspondent pas."
        );

        confirmPasswordInput.focus();

        return false;

    }

    return true;

}


// ==========================================
// Username Check
// ==========================================

async function usernameExists(username){

    const {

        data,

        error

    } = await supabase

    .from("profiles")

    .select("id")

    .eq(
        "username",
        username
    )

    .limit(1);

    if(error){

        throw error;

    }

    return data.length > 0;

}
// ==========================================
// Signup (Supabase Auth)
// ==========================================

async function createAccount(){

    if(submitting){

        return;

    }

    clearMessages();

    if(!validateForm()){

        return;

    }

    const username =
    usernameInput.value
    .trim()
    .toLowerCase();

    const displayName =
    displayNameInput.value
    .trim();

    const email =
    emailInput.value
    .trim()
    .toLowerCase();

    const password =
    passwordInput.value;

    try{

        submitting = true;

        showLoader();

        buttonLoading(
            signupButton,
            true
        );

        const exists =
        await usernameExists(
            username
        );

        if(exists){

            showSignupError(
                "Ce nom d'utilisateur est déjà utilisé."
            );

            usernameInput.focus();

            return;

        }

        const {

            data,

            error

        } = await signUp(

            email,

            password

        );

        if(error){

            throw error;

        }

        if(!data.user){

            throw new Error(
                "Impossible de créer le compte."
            );

        }

        await updateProfile(

            data.user.id,

            username,

            displayName

        );

        showSignupSuccess(email);

    }

    catch(error){

        console.error(error);

        let message =
        "Impossible de créer le compte.";

        if(

            error.message?.includes(
                "User already registered"
            )

        ){

            message =
            "Cette adresse e-mail est déjà utilisée.";

        }
        else if(error.message){

            message =
            error.message;

        }

        showSignupError(
            message
        );

    }

    finally{

        submitting = false;

        hideLoader();

        buttonLoading(
            signupButton,
            false
        );

    }

}


// ==========================================
// Update NetView Profile
// ==========================================

async function updateProfile(

    userId,

    username,

    displayName

){

    const {

        error

    } = await supabase

    .from("profiles")

    .update({

        username,

        display_name:
        displayName

    })

    .eq(

        "id",

        userId

    );

    if(error){

        throw error;

    }

}


// ==========================================
// Success Message
// ==========================================

function showSignupSuccess(email){

    signupForm.style.display =
    "none";

    signupSuccess.style.display =
    "block";

    signupSuccess.innerHTML =

    `
    <i class="fa-solid fa-circle-check"></i>

    <h2>

        Compte créé avec succès

    </h2>

    <p>

        Un e-mail de confirmation a été envoyé à

        <strong>${email}</strong>.

    </p>

    <p>

        Cliquez sur le lien reçu pour activer votre compte NetView.

    </p>

    <p>

        Après confirmation, vous pourrez vous connecter.

    </p>
    `;

}
// ==========================================
// Events
// ==========================================

// Signup

signupForm.addEventListener(

    "submit",

    async(event)=>{

        event.preventDefault();

        await createAccount();

    }

);

// Clear Messages

[
    usernameInput,
    displayNameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput

].forEach(input=>{

    input.addEventListener(

        "input",

        ()=>{

            clearMessages();

        }

    );

});

// Enter Key

document.addEventListener(

    "keydown",

    event=>{

        if(

            event.key === "Enter" &&

            document.activeElement !== signupButton

        ){

            if(

                document.activeElement.tagName === "INPUT"

            ){

                event.preventDefault();

                signupForm.requestSubmit();

            }

        }

    }

);


// ==========================================
// Initialization
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        clearMessages();

        passwordInput.type =
        "password";

        confirmPasswordInput.type =
        "password";

        console.log(
            "NetView Signup Ready"
        );

    }

);
