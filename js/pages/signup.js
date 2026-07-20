// ==========================================
// Imports
// ==========================================

import { supabase } from "../core/supabase.js";


// ==========================================
// DOM
// ==========================================
const signupForm =
document.getElementById("signupForm");

const usernameInput =
document.getElementById("username");

const usernameMessage =
document.getElementById("usernameMessage");

const displayNameInput =
document.getElementById("displayName");

const displayNameMessage =
document.getElementById("displayNameMessage");

const emailInput =
document.getElementById("email");

const emailMessage =
document.getElementById("emailMessage");

const passwordInput =
document.getElementById("password");

const passwordMessage =
document.getElementById("passwordMessage");

const togglePassword =
document.getElementById("togglePassword");

const togglePasswordIcon =
document.getElementById("togglePasswordIcon");

const confirmPasswordInput =
document.getElementById("confirmPassword");

const confirmPasswordMessage =
document.getElementById("confirmPasswordMessage");

const toggleConfirmPassword =
document.getElementById("toggleConfirmPassword");

const toggleConfirmPasswordIcon =
document.getElementById("toggleConfirmPasswordIcon");

const terms =
document.getElementById("terms");

const language =
document.getElementById("language");

const signupButton =
document.getElementById("signupButton");

const signupButtonText =
document.getElementById("signupButtonText");

const signupButtonLoader =
document.getElementById("signupButtonLoader");

const countryInput =
document.getElementById("country");

const countryModal =
document.getElementById("countryModal");

const openCountryModal =
document.getElementById("openCountryModal");

const closeCountryModal =
document.getElementById("closeCountryModal");

const countrySearch =
document.getElementById("countrySearch");

const countryList =
document.getElementById("countryList");

const countries = [

"Afghanistan",
"Afrique du Sud",
"Algérie",
"Allemagne",
"Angola",
"Arabie Saoudite",
"Argentine",
"Australie",
"Autriche",
"Belgique",
"Bénin",
"Brésil",
"Burkina Faso",
"Cameroun",
"Canada",
"Chili",
"Chine",
"Colombie",
"Corée du Sud",
"Côte d'Ivoire",
"Danemark",
"Égypte",
"Espagne",
"États-Unis",
"France",
"Grèce",
"Haïti",
"Inde",
"Italie",
"Jamaïque",
"Japon",
"Kenya",
"Luxembourg",
"Madagascar",
"Mali",
"Maroc",
"Mexique",
"Niger",
"Nigeria",
"Norvège",
"Portugal",
"République Dominicaine",
"Royaume-Uni",
"Russie",
"Sénégal",
"Suisse",
"Togo",
"Tunisie"

];
// ==========================================
// Username
// ==========================================

let usernameTimer = null;


// Nettoyage

function cleanUsername(value){

    return value

        .toLowerCase()

        .replace(/\s+/g,"")

        .replace(/[^a-z0-9._]/g,"");

}
// ==========================================
// Display Name
// ==========================================

function validateDisplayName(){

    let value =
    displayNameInput.value

        .replace(/\s+/g," ")

        .trim();

    displayNameInput.value =
    value;

    if(value.length < 3){

        displayNameMessage.textContent =
        "Minimum 3 caractères.";

        displayNameMessage.className =
        "nv-help display-invalid";

        return false;

    }

    if(value.length > 100){

        displayNameMessage.textContent =
        "Nom trop long.";

        displayNameMessage.className =
        "nv-help display-invalid";

        return false;

    }

    displayNameMessage.textContent =
    "Nom valide.";

    displayNameMessage.className =
    "nv-help display-valid";

    return true;

}

// ==========================================
// Button Loading
// ==========================================

function startSignupLoading(){

    signupButton.disabled = true;

    signupButtonText.hidden = true;

    signupButtonLoader.hidden = false;

}

function stopSignupLoading(){

    signupButton.disabled = false;

    signupButtonText.hidden = false;

    signupButtonLoader.hidden = true;

}
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
        "Veuillez saisir votre adresse e-mail.";

        emailMessage.className =
        "nv-help email-invalid";

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
// Confirm Password
// ==========================================

function validateConfirmPassword(){

    if(confirmPasswordInput.value.length===0){

        confirmPasswordMessage.textContent =
        "Confirmez votre mot de passe.";

        confirmPasswordMessage.className =
        "nv-help";

        return false;

    }

    if(passwordInput.value !== confirmPasswordInput.value){

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

function renderCountries(search=""){

    countryList.innerHTML="";

    countries

    .filter(country=>country
    .toLowerCase()
    .includes(search.toLowerCase()))

    .forEach(country=>{

        const div =
        document.createElement("div");

        div.className =
        "country-item";

        div.textContent =
        country;

        div.onclick=()=>{

            countryInput.value=
            country;

            countryModal.classList.remove("active");

        };

        countryList.appendChild(div);

    });

}
// Vérification

async function checkUsername(){

    const username =
    usernameInput.value;

    if(username.length < 3){

        usernameMessage.textContent =
        "Minimum 3 caractères.";

        usernameMessage.className =
        "nv-help username-invalid";

        return;

    }

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

        usernameMessage.textContent =
        "Impossible de vérifier.";

        usernameMessage.className =
        "nv-help username-invalid";

        return;

    }

    if(data){

        usernameMessage.textContent =
        "Nom déjà utilisé.";

        usernameMessage.className =
        "nv-help username-invalid";

        return;

    }

    usernameMessage.textContent =
    "Nom disponible.";

    usernameMessage.className =
    "nv-help username-valid";

}


// Event

usernameInput.addEventListener("input",()=>{

    usernameInput.value =
    cleanUsername(usernameInput.value);

    clearTimeout(usernameTimer);

    usernameTimer =
    setTimeout(

        checkUsername,

        500

    );

    

});
displayNameInput.addEventListener(

    "input",

    validateDisplayName

);
emailInput.addEventListener(

    "input",

    validateEmail

);
// ==========================================
// Password
// ==========================================

togglePassword.addEventListener("click",()=>{

    const visible =
    passwordInput.type === "text";

    passwordInput.type =
    visible ? "password" : "text";

    togglePasswordIcon.className =
    visible
        ? "fa-regular fa-eye"
        : "fa-regular fa-eye-slash";

});
// ==========================================
// Signup (Supabase Auth)
// ==========================================

async function signUp(){

    console.log("1 - Début signUp");

    if(!validateForm()){

        console.log("2 - Validation échouée");

        return;

    }

    console.log("3 - Validation OK");

    startSignupLoading();

    try{

        console.log("4 - Envoi à Supabase");

        const {

            data,

            error

        } = await supabase.auth.signUp({

            email: emailInput.value.trim(),

            password: passwordInput.value,

            options:{

                emailRedirectTo:
                `${window.location.origin}/login.html`

            }

        });

        console.log("5 - Réponse Supabase");

        if(error){

            throw error;

        }

        console.log("6 - Compte créé");

        await createProfile(data.user);

    }

    catch(error){

        console.error(error);

        alert(error.message);

        stopSignupLoading();

    }

}

async function createProfile(user){

    console.log("Utilisateur :", user);

}
function validatePassword(){

    const password =
    passwordInput.value;

    if(password.length < 8){

        passwordMessage.textContent =
        "Minimum 8 caractères.";

        passwordMessage.className =
        "nv-help password-invalid";

        return false;

    }

    passwordMessage.textContent =
    "Mot de passe valide.";

    passwordMessage.className =
    "nv-help password-valid";

    return true;

}

passwordInput.addEventListener(

    "input",

    validatePassword

);

function validateForm(){

    return (

        checkTerms() &&

        validateEmail() &&

        validatePassword() &&

        validateConfirmPassword() &&

        validateDisplayName()

    );

}

function checkTerms(){

    if(!terms.checked){

        alert("Vous devez accepter les conditions d'utilisation.");

        return false;

    }

    return true;

}
// ==========================================
// Confirm Password Toggle
// ==========================================

toggleConfirmPassword.addEventListener(

    "click",

    ()=>{

        const visible =
        confirmPasswordInput.type === "text";

        confirmPasswordInput.type =
        visible ? "password" : "text";

        toggleConfirmPasswordIcon.className =
        visible

        ? "fa-regular fa-eye"

        : "fa-regular fa-eye-slash";

    }

);
signupForm.addEventListener(

    "submit",

    async(event)=>{

        event.preventDefault();

        await signUp();

    }

);
confirmPasswordInput.addEventListener(

    "input",

    validateConfirmPassword

);

passwordInput.addEventListener(

    "input",

    validateConfirmPassword

);
openCountryModal.onclick=()=>{

    countryModal.classList.add("active");

    countrySearch.value="";

    renderCountries();

};

closeCountryModal.onclick=()=>{

    countryModal.classList.remove("active");

};

countryModal.onclick=(e)=>{

    if(e.target===countryModal){

        countryModal.classList.remove("active");

    }

};

countrySearch.oninput=()=>{

    renderCountries(countrySearch.value);

};
