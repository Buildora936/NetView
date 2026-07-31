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
// ==========================================
// Signup Form
// ==========================================

signupForm.addEventListener(

    "submit",

    async(event)=>{

        event.preventDefault();

        signupError.textContent = "";

        signupError.classList.remove(
            "show"
        );

        // ==========================
        // Validation
        // ==========================

        const displayName =
            displayNameInput.value.trim();

        const email =
            emailInput.value.trim().toLowerCase();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;

        if(displayName.length < 3){

            signupError.textContent =
                "Le nom affiché doit contenir au moins 3 caractères.";

            signupError.classList.add(
                "show"
            );

            displayNameInput.focus();

            return;

        }

        const emailRegex =

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(

            !emailRegex.test(email)

        ){

            signupError.textContent =
                "Adresse e-mail invalide.";

            signupError.classList.add(
                "show"
            );

            emailInput.focus();

            return;

        }

        if(password.length < 8){

            signupError.textContent =
                "Le mot de passe doit contenir au moins 8 caractères.";

            signupError.classList.add(
                "show"
            );

            passwordInput.focus();

            return;

        }

        if(password !== confirmPassword){

            signupError.textContent =
                "Les mots de passe ne correspondent pas.";

            signupError.classList.add(
                "show"
            );

            confirmPasswordInput.focus();

            return;

        }

        if(

            !acceptTerms.checked

        ){

            signupError.textContent =
                "Vous devez accepter les Conditions d'utilisation.";

            signupError.classList.add(
                "show"
            );

            acceptTerms.focus();

            return;

        }

        // ==========================
        // Loader
        // ==========================

        buttonLoading(
            signupButton,
            true
        );

        showLoader();

        // ==========================
        // Signup
        // ==========================

        try{

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

            // Sauvegarde des infos
            // jusqu'à la confirmation

            pendingSignup = {

                displayName,

                email,

                password,

                newsletter:

                    newsletter.checked

            };

            currentEmail =
                email;

            verificationEmail.textContent =
                email;

            newVerificationEmail.value =
                email;

            hideLoader();

            buttonLoading(
                signupButton,
                false
            );

            emailVerificationModal.classList.add(
                "show"
            );

        }

        catch(error){

            hideLoader();

            buttonLoading(
                signupButton,
                false
            );

            signupError.textContent =

                error.message ||

                "Impossible de créer le compte.";

            signupError.classList.add(
                "show"
            );

        }

    }

);
// ==========================================
// Email Verification Modal
// ==========================================

let resendTimer = null;

function startResendCountdown(){

    resendSeconds = 60;

    resendEmailButton.disabled = true;

    resendCountdown.textContent =
        `Vous pourrez renvoyer un e-mail dans ${resendSeconds} s.`;

    clearInterval(resendTimer);

    resendTimer = setInterval(()=>{

        resendSeconds--;

        if(resendSeconds<=0){

            clearInterval(
                resendTimer
            );

            resendEmailButton.disabled = false;

            resendCountdown.textContent =
                "Vous pouvez maintenant renvoyer un e-mail.";

            return;

        }

        resendCountdown.textContent =
            `Vous pourrez renvoyer un e-mail dans ${resendSeconds} s.`;

    },1000);

}

// ==========================================
// Change Email
// ==========================================

changeEmailButton.addEventListener(

    "click",

    async()=>{

        verificationMessage.textContent="";

        const newEmail =
            newVerificationEmail.value
            .trim()
            .toLowerCase();

        if(!newEmail){

            verificationMessage.textContent =
                "Veuillez saisir une adresse e-mail.";

            return;

        }

        if(newEmail===currentEmail){

            verificationMessage.textContent =
                "Cette adresse e-mail est déjà utilisée.";

            return;

        }

        changeEmailButton.disabled = true;

        try{

            const {

                error

            } = await updateUser({

                email:newEmail

            });

            if(error){

                throw error;

            }

            currentEmail = newEmail;

            pendingSignup.email =
                newEmail;

            verificationEmail.textContent =
                newEmail;

            verificationMessage.textContent =
                "Adresse e-mail mise à jour. Un nouvel e-mail de confirmation a été envoyé.";

            await resendVerification(
                newEmail
            );

            startResendCountdown();

        }

        catch(error){

            verificationMessage.textContent =

                error.message ||

                "Impossible de modifier l'adresse e-mail.";

        }

        changeEmailButton.disabled = false;

    }

);

// ==========================================
// Resend Verification Email
// ==========================================

resendEmailButton.addEventListener(

    "click",

    async()=>{

        verificationMessage.textContent="";

        resendEmailButton.disabled = true;

        try{

            const {

                error

            } = await resendVerification(
                currentEmail
            );

            if(error){

                throw error;

            }

            verificationMessage.textContent =
                "Un nouvel e-mail de confirmation a été envoyé.";

            startResendCountdown();

        }

        catch(error){

            resendEmailButton.disabled = false;

            verificationMessage.textContent =

                error.message ||

                "Impossible de renvoyer l'e-mail.";

        }

    }

);

// ==========================================
// Prevent Closing
// ==========================================

emailVerificationModal

.querySelector(".nv-modal-overlay")

.addEventListener(

    "click",

    event=>{

        event.stopPropagation();

    }

);
// ==========================================
// Email Confirmation
// ==========================================

let verificationInterval = null;

// Vérification de l'état du compte
async function checkEmailConfirmation(){

    try{

        const user =
            await refreshUser();

        if(

            !user ||

            !user.email_confirmed_at

        ){

            return false;

        }

        clearInterval(
            verificationInterval
        );

        emailVerifiedButton.disabled =
            true;

        emailVerifiedButton.textContent =
            "Confirmation détectée...";

        await createProfile({

            display_name:
                pendingSignup.displayName,

            username:null,

            country:null,

            language:"fr"

        });

        navigate(
            "profile.html"
        );

        return true;

    }

    catch(error){

        console.error(error);

        return false;

    }

}

// ==========================================
// Button
// ==========================================

emailVerifiedButton.addEventListener(

    "click",

    async()=>{

        verificationMessage.textContent =
            "Vérification en cours...";

        const confirmed =
            await checkEmailConfirmation();

        if(!confirmed){

            verificationMessage.textContent =
                "Votre adresse e-mail n'est pas encore confirmée.";

        }

    }

);

// ==========================================
// Automatic Verification
// ==========================================

function startVerificationWatcher(){

    clearInterval(
        verificationInterval
    );

    verificationInterval = setInterval(
   
        checkEmailConfirmation,
              
        10000
  
    );

}

// ==========================================
// Start Watcher
// ==========================================

const observer = new MutationObserver(()=>{

    if(

        emailVerificationModal.classList.contains(
            "show"
        )

    ){

        startVerificationWatcher();

    }

});

observer.observe(

    emailVerificationModal,

    {

        attributes:true,

        attributeFilter:["class"]

    }

);

// ==========================================
// Cleanup
// ==========================================

window.addEventListener(

    "beforeunload",

    ()=>{

        clearInterval(
            verificationInterval
        );

        clearInterval(
            resendTimer
        );

    }

);
// ==========================================
// Existing Session
// ==========================================

(async()=>{

    try{

        const session =
            await getSession();

        if(session){

            navigate(
                "index.html"
            );

        }

    }

    catch(error){

        console.error(error);

    }

})();

// ==========================================
// Clear Errors While Typing
// ==========================================

[
    displayNameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput
].forEach(input=>{

    input.addEventListener(

        "input",

        ()=>{

            signupError.textContent="";

            signupError.classList.remove(
                "show"
            );

        }

    );

});

// ==========================================
// Modal Email Sync
// ==========================================

emailInput.addEventListener(

    "input",

    ()=>{

        if(

            !emailVerificationModal.classList.contains(
                "show"
            )

        ){

            return;

        }

        const value =
            emailInput.value
            .trim()
            .toLowerCase();

        currentEmail =
            value;

        verificationEmail.textContent =
            value;

        newVerificationEmail.value =
            value;

    }

);

// ==========================================
// Prevent Enter
// ==========================================

newVerificationEmail.addEventListener(

    "keydown",

    event=>{

        if(event.key==="Enter"){

            event.preventDefault();

            changeEmailButton.click();

        }

    }

);

// ==========================================
// Focus
// ==========================================

window.addEventListener(

    "load",

    ()=>{

        displayNameInput.focus();

    }

);

// ==========================================
// Cleanup
// ==========================================

window.addEventListener(

    "beforeunload",

    ()=>{

        clearInterval(
            resendTimer
        );

        clearInterval(
            verificationInterval
        );

    }

);

// ==========================================
// Reset Modal Message
// ==========================================

function resetVerificationMessage(){

    verificationMessage.textContent="";

}

newVerificationEmail.addEventListener(

    "input",

    resetVerificationMessage

);

// ==========================================
// Disable Copy/Paste Spaces
// ==========================================

emailInput.addEventListener(

    "blur",

    ()=>{

        emailInput.value =
            emailInput.value
            .trim()
            .toLowerCase();

    }

);

newVerificationEmail.addEventListener(

    "blur",

    ()=>{

        newVerificationEmail.value =
            newVerificationEmail.value
            .trim()
            .toLowerCase();

    }

);

// ==========================================
// Final Initialization
// ==========================================

passwordStrength();

updatePasswordMatch();

console.info(
    "NetView Signup Ready."
);
