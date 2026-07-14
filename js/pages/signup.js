// ==========================================
// NetView
// Signup Page
// signup.js
// ==========================================


// ==========================================
// 1. Imports
// ==========================================

import {
    signUp,
    getUser,
    resendVerification
} from "js/core/auth.js";

import {
    supabase
} from "js/core/supabase.js";

import {
    openModal,
    closeModal,
    showLoader,
    hideLoader,
    buttonLoading,
    showToast
} from "js/core/ui.js";

import {
    COUNTRIES
} from "js/assets/countries.js";


// ==========================================
// 2. Variables
// ==========================================

let submitting = false;

let selectedCountry = null;


// ==========================================
// 3. Form
// ==========================================

const signupForm =
document.getElementById("signupForm");

const signupButton =
document.getElementById("signupButton");

const signupError =
document.getElementById("signupError");


// ==========================================
// 4. Inputs
// ==========================================

const usernameInput =
document.getElementById("username");

const displayNameInput =
document.getElementById("displayName");

const emailInput =
document.getElementById("email");

const countryInput =
document.getElementById("country");

const languageInput =
document.getElementById("language");

const passwordInput =
document.getElementById("password");

const confirmPasswordInput =
document.getElementById("confirmPassword");


// ==========================================
// 5. Password
// ==========================================

const togglePassword =
document.getElementById("togglePassword");

const toggleConfirmPassword =
document.getElementById("toggleConfirmPassword");


// ==========================================
// 6. Country Modal
// ==========================================

const selectedCountryButton =
document.getElementById("selectedCountry");

const selectedCountryFlag =
document.getElementById("selectedCountryFlag");

const selectedCountryName =
document.getElementById("selectedCountryName");

const countryModal =
document.getElementById("countryModal");

const closeCountryModal =
document.getElementById("closeCountryModal");

const countrySearch =
document.getElementById("countrySearch");

const countryList =
document.getElementById("countryList");


// ==========================================
// 7. Verification Modal
// ==========================================

const verifyModal =
document.getElementById("verifyModal");

const verifyTitle =
document.getElementById("verifyTitle");

const verifyText =
document.getElementById("verifyText");

const verifyMessage =
document.getElementById("verifyMessage");

const resendButton =
document.getElementById("resendButton");


// ==========================================
// 8. Helpers
// ==========================================

function showError(message){

    signupError.textContent = message;

    signupError.classList.add("show");

}

function clearError(){

    signupError.textContent = "";

    signupError.classList.remove("show");

}

console.log("signup.js loaded");
