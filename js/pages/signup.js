// ==========================================
// Imports
// ==========================================

import { supabase } from "../core/supabase.js";

import { COUNTRIES }
from "../assets/countries.js";
// ==========================================
// Already Logged
// ==========================================

const {

    data: {

        session

    }

} = await supabase.auth.getSession();

if(session){

    window.location.replace(

        "index.html"

    );

}
// ==========================================
// DOM
// ==========================================
const signupForm =
document.getElementById("signupForm");

const resendEmailButton =
document.getElementById("resendEmailButton");

const resendEmailText =
document.getElementById("resendEmailText");

const resendEmailLoader =
document.getElementById("resendEmailLoader");

const resendEmailMessage =
document.getElementById("resendEmailMessage");

const verifyEmailModal =
document.getElementById("verifyEmailModal");

const verifyEmailAddress =
document.getElementById("verifyEmailAddress");

const closeVerifyModal =
document.getElementById("closeVerifyModal");

const globalLoader =
document.getElementById("globalLoader");

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

{
    code: "AF",
    name: "Afghanistan",
    flag: "🇦🇫"
},

{
    code: "ZA",
    name: "Afrique du Sud",
    flag: "🇿🇦"
},

{
    code: "AL",
    name: "Albanie",
    flag: "🇦🇱"
},

{
    code: "DZ",
    name: "Algérie",
    flag: "🇩🇿"
},

{
    code: "DE",
    name: "Allemagne",
    flag: "🇩🇪"
},

{
    code: "AD",
    name: "Andorre",
    flag: "🇦🇩"
},

{
    code: "AO",
    name: "Angola",
    flag: "🇦🇴"
},

{
    code: "SA",
    name: "Arabie saoudite",
    flag: "🇸🇦"
},

{
    code: "AR",
    name: "Argentine",
    flag: "🇦🇷"
},

{
    code: "AM",
    name: "Arménie",
    flag: "🇦🇲"
},

{
    code: "AU",
    name: "Australie",
    flag: "🇦🇺"
},

{
    code: "AT",
    name: "Autriche",
    flag: "🇦🇹"
},

{
    code: "BS",
    name: "Bahamas",
    flag: "🇧🇸"
},

{
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩"
},

{
    code: "BE",
    name: "Belgique",
    flag: "🇧🇪"
},

{
    code: "BJ",
    name: "Bénin",
    flag: "🇧🇯"
},

{
    code: "BO",
    name: "Bolivie",
    flag: "🇧🇴"
},

{
    code: "BA",
    name: "Bosnie-Herzégovine",
    flag: "🇧🇦"
},

{
    code: "BW",
    name: "Botswana",
    flag: "🇧🇼"
},

{
    code: "BR",
    name: "Brésil",
    flag: "🇧🇷"
},

{
    code: "BG",
    name: "Bulgarie",
    flag: "🇧🇬"
},

{
    code: "BF",
    name: "Burkina Faso",
    flag: "🇧🇫"
},

{
    code: "BI",
    name: "Burundi",
    flag: "🇧🇮"
},

{
    code: "KH",
    name: "Cambodge",
    flag: "🇰🇭"
},

{
    code: "CM",
    name: "Cameroun",
    flag: "🇨🇲"
},

{
    code: "CA",
    name: "Canada",
    flag: "🇨🇦"
},

{
    code: "CV",
    name: "Cap-Vert",
    flag: "🇨🇻"
},

{
    code: "CL",
    name: "Chili",
    flag: "🇨🇱"
},

{
    code: "CN",
    name: "Chine",
    flag: "🇨🇳"
},

{
    code: "CY",
    name: "Chypre",
    flag: "🇨🇾"
},

{
    code: "CO",
    name: "Colombie",
    flag: "🇨🇴"
},

{
    code: "KM",
    name: "Comores",
    flag: "🇰🇲"
},

{
    code: "CG",
    name: "Congo",
    flag: "🇨🇬"
},

{
    code: "KP",
    name: "Corée du Nord",
    flag: "🇰🇵"
},

{
    code: "KR",
    name: "Corée du Sud",
    flag: "🇰🇷"
},

{
    code: "CR",
    name: "Costa Rica",
    flag: "🇨🇷"
},

{
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮"
},

{
    code: "HR",
    name: "Croatie",
    flag: "🇭🇷"
},

{
    code: "CU",
    name: "Cuba",
    flag: "🇨🇺"
},

{
    code: "DK",
    name: "Danemark",
    flag: "🇩🇰"
},

{
    code: "DJ",
    name: "Djibouti",
    flag: "🇩🇯"
},

{
    code: "EG",
    name: "Égypte",
    flag: "🇪🇬"
},

{
    code: "AE",
    name: "Émirats arabes unis",
    flag: "🇦🇪"
},

{
    code: "EC",
    name: "Équateur",
    flag: "🇪🇨"
},

{
    code: "ES",
    name: "Espagne",
    flag: "🇪🇸"
},

{
    code: "EE",
    name: "Estonie",
    flag: "🇪🇪"
},

{
    code: "US",
    name: "États-Unis",
    flag: "🇺🇸"
},

{
    code: "ET",
    name: "Éthiopie",
    flag: "🇪🇹"
},

{
    code: "FI",
    name: "Finlande",
    flag: "🇫🇮"
},

{
    code: "FR",
    name: "France",
    flag: "🇫🇷"
},

{
    code: "GA",
    name: "Gabon",
    flag: "🇬🇦"
},

{
    code: "GM",
    name: "Gambie",
    flag: "🇬🇲"
},

{
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭"
},

{
    code: "GR",
    name: "Grèce",
    flag: "🇬🇷"
},

{
    code: "GT",
    name: "Guatemala",
    flag: "🇬🇹"
},

{
    code: "GN",
    name: "Guinée",
    flag: "🇬🇳"
},

{
    code: "HT",
    name: "Haïti",
    flag: "🇭🇹"
},

{
    code: "HN",
    name: "Honduras",
    flag: "🇭🇳"
},

{
    code: "HU",
    name: "Hongrie",
    flag: "🇭🇺"
},

{
    code: "IN",
    name: "Inde",
    flag: "🇮🇳"
},

{
    code: "ID",
    name: "Indonésie",
    flag: "🇮🇩"
},

{
    code: "IQ",
    name: "Irak",
    flag: "🇮🇶"
},

{
    code: "IR",
    name: "Iran",
    flag: "🇮🇷"
},

{
    code: "IE",
    name: "Irlande",
    flag: "🇮🇪"
},

{
    code: "IS",
    name: "Islande",
    flag: "🇮🇸"
},

{
    code: "IT",
    name: "Italie",
    flag: "🇮🇹"
},

{
    code: "JM",
    name: "Jamaïque",
    flag: "🇯🇲"
},

{
    code: "JP",
    name: "Japon",
    flag: "🇯🇵"
},

{
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪"
},

{
    code: "LA",
    name: "Laos",
    flag: "🇱🇦"
},

{
    code: "LB",
    name: "Liban",
    flag: "🇱🇧"
},

{
    code: "LR",
    name: "Libéria",
    flag: "🇱🇷"
},

{
    code: "LY",
    name: "Libye",
    flag: "🇱🇾"
},

{
    code: "LU",
    name: "Luxembourg",
    flag: "🇱🇺"
},

{
    code: "MG",
    name: "Madagascar",
    flag: "🇲🇬"
},

{
    code: "MY",
    name: "Malaisie",
    flag: "🇲🇾"
},

{
    code: "ML",
    name: "Mali",
    flag: "🇲🇱"
},

{
    code: "MA",
    name: "Maroc",
    flag: "🇲🇦"
},

{
    code: "MU",
    name: "Maurice",
    flag: "🇲🇺"
},

{
    code: "MX",
    name: "Mexique",
    flag: "🇲🇽"
},

{
    code: "MC",
    name: "Monaco",
    flag: "🇲🇨"
},

{
    code: "MZ",
    name: "Mozambique",
    flag: "🇲🇿"
},

{
    code: "NA",
    name: "Namibie",
    flag: "🇳🇦"
},

{
    code: "NP",
    name: "Népal",
    flag: "🇳🇵"
},

{
    code: "NI",
    name: "Nicaragua",
    flag: "🇳🇮"
},

{
    code: "NE",
    name: "Niger",
    flag: "🇳🇪"
},

{
    code: "NG",
    name: "Nigéria",
    flag: "🇳🇬"
},

{
    code: "NO",
    name: "Norvège",
    flag: "🇳🇴"
},

{
    code: "NZ",
    name: "Nouvelle-Zélande",
    flag: "🇳🇿"
},

{
    code: "UG",
    name: "Ouganda",
    flag: "🇺🇬"
},

{
    code: "PK",
    name: "Pakistan",
    flag: "🇵🇰"
},

{
    code: "PA",
    name: "Panama",
    flag: "🇵🇦"
},

{
    code: "PY",
    name: "Paraguay",
    flag: "🇵🇾"
},

{
    code: "NL",
    name: "Pays-Bas",
    flag: "🇳🇱"
},

{
    code: "PE",
    name: "Pérou",
    flag: "🇵🇪"
},

{
    code: "PH",
    name: "Philippines",
    flag: "🇵🇭"
},

{
    code: "PL",
    name: "Pologne",
    flag: "🇵🇱"
},

{
    code: "PT",
    name: "Portugal",
    flag: "🇵🇹"
},

{
    code: "QA",
    name: "Qatar",
    flag: "🇶🇦"
},

{
    code: "DO",
    name: "République dominicaine",
    flag: "🇩🇴"
},

{
    code: "RO",
    name: "Roumanie",
    flag: "🇷🇴"
},

{
    code: "GB",
    name: "Royaume-Uni",
    flag: "🇬🇧"
},

{
    code: "RU",
    name: "Russie",
    flag: "🇷🇺"
},

{
    code: "RW",
    name: "Rwanda",
    flag: "🇷🇼"
},

{
    code: "SN",
    name: "Sénégal",
    flag: "🇸🇳"
},

{
    code: "RS",
    name: "Serbie",
    flag: "🇷🇸"
},

{
    code: "SG",
    name: "Singapour",
    flag: "🇸🇬"
},

{
    code: "SO",
    name: "Somalie",
    flag: "🇸🇴"
},

{
    code: "SD",
    name: "Soudan",
    flag: "🇸🇩"
},

{
    code: "LK",
    name: "Sri Lanka",
    flag: "🇱🇰"
},

{
    code: "SE",
    name: "Suède",
    flag: "🇸🇪"
},

{
    code: "CH",
    name: "Suisse",
    flag: "🇨🇭"
},

{
    code: "SY",
    name: "Syrie",
    flag: "🇸🇾"
},

{
    code: "TZ",
    name: "Tanzanie",
    flag: "🇹🇿"
},

{
    code: "TD",
    name: "Tchad",
    flag: "🇹🇩"
},

{
    code: "TH",
    name: "Thaïlande",
    flag: "🇹🇭"
},

{
    code: "TG",
    name: "Togo",
    flag: "🇹🇬"
},

{
    code: "TN",
    name: "Tunisie",
    flag: "🇹🇳"
},

{
    code: "TR",
    name: "Turquie",
    flag: "🇹🇷"
},

{
    code: "UA",
    name: "Ukraine",
    flag: "🇺🇦"
},

{
    code: "UY",
    name: "Uruguay",
    flag: "🇺🇾"
},

{
    code: "VE",
    name: "Venezuela",
    flag: "🇻🇪"
},

{
    code: "VN",
    name: "Viêt Nam",
    flag: "🇻🇳"
},

{
    code: "YE",
    name: "Yémen",
    flag: "🇾🇪"
},

{
    code: "ZM",
    name: "Zambie",
    flag: "🇿🇲"
},

{
    code: "ZW",
    name: "Zimbabwe",
    flag: "🇿🇼"
}

];
// ==========================================
// Username
// ==========================================

let usernameTimer = null;

let signupInProgress = false;

// Nettoyage

function cleanUsername(value){

    return value

        .toLowerCase()

        .replace(/\s+/g,"")

        .replace(/[^a-z0-9._]/g,"");

}

// ==========================================
// Verify Email Modal
// ==========================================

function openVerifyEmailModal(email){

    verifyEmailAddress.textContent =
    email;

    verifyEmailModal.classList.add(
        "active"
    );

}

function closeVerifyEmailModal(){

    verifyEmailModal.classList.remove(
        "active"
    );

}

function startResendLoading(){

    resendEmailButton.disabled = true;

    resendEmailText.hidden = true;

    resendEmailLoader.hidden = false;

}

function stopResendLoading(){

    resendEmailButton.disabled = false;

    resendEmailText.hidden = false;

    resendEmailLoader.hidden = true;

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
// Signup Button
// ==========================================

function startSignupLoading(){

    signupButton.disabled = true;

    signupButton.style.pointerEvents =
    "none";

    signupButtonText.hidden = true;

    signupButtonLoader.hidden = false;

}

function stopSignupLoading(){

    signupButton.disabled = false;

    signupButton.style.pointerEvents =
    "";

    signupButtonText.hidden = false;

    signupButtonLoader.hidden = true;

}

// ==========================================
// Global Loader
// ==========================================

function showLoader(){

    globalLoader.classList.add("active");

    document.body.style.overflow = "hidden";

}

function hideLoader(){

    globalLoader.classList.remove("active");

    document.body.style.overflow = "";

}
// ==========================================
// Error Handler
// ==========================================

function showError(message){

    console.error(message);

    // Temporaire
    alert(message);

}

function showSuccess(message){

    console.log(message);

    // Temporaire
    console.log(message);

}

window.addEventListener("load",()=>{

    showLoader();

    setTimeout(hideLoader,800);

});

function validateUsername(){

    return usernameInput.value.trim().length >= 3;

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

async function resendVerificationEmail(){

    startResendLoading();

    resendEmailMessage.textContent =
    "";

    try{

        await new Promise(

            resolve =>

            setTimeout(resolve,1500)

        );

        resendEmailMessage.textContent =
        "Un nouvel e-mail a été envoyé.";

        resendEmailMessage.className =
        "nv-help email-valid";

    }

    catch{

        resendEmailMessage.textContent =
        "Impossible de renvoyer l'e-mail.";

        resendEmailMessage.className =
        "nv-help email-invalid";

    }

    stopResendLoading();

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
"Erreur réseau.";

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

// ==========================================
// Signup (Supabase Auth)
// ==========================================

async function signUp(){

    if(signupInProgress){

        return;

    }

    if(!validateForm()){

        return;

    }

    signupInProgress = true;

    startSignupLoading();

    try{

        const {

            data,

            error

        } = await supabase.auth.signUp({

            email:

                emailInput.value.trim(),

            password:

                passwordInput.value,

            options:{

                emailRedirectTo:

                `${window.location.origin}/login.html`

            }

        });

        if(error){

            throw error;

        }
        if(!data.user){

    throw new Error(
        "Le compte n'a pas pu être créé."
    );

}

        if(!data.user){

            throw new Error(

                "Impossible de créer le compte."

            );

        }

        await createProfile(

            data.user

        );

        openVerifyEmailModal(

            emailInput.value.trim()

        );
        setTimeout(

    ()=>{

        redirectToLogin();

    },

    10000

);

    }

   catch(error){

    console.error(error);

    stopSignupLoading();

    showError(

        error.message ||

        "Une erreur est survenue."

    );

}

    finally{

        signupInProgress = false;

        stopSignupLoading();

    }

}
// ==========================================
// Create Profile
// ==========================================

async function createProfile(user){

    const {

        error

    } = await supabase

        .from("profiles")

        .insert({

            id:
            user.id,

            username:
            usernameInput.value.trim(),

            display_name:
            displayNameInput.value.trim(),

            email:
            emailInput.value.trim(),

            country:
            countryInput.value.trim(),

            language:
            language.value,

            avatar_url:
            null,

            banner_url:
            null

        });
if(error){

    console.error(error);

    throw new Error(
        "Impossible de créer votre profil."
    );

}

}
// ==========================================
// Redirect
// ==========================================

function redirectToLogin(){

    window.location.href =
    "login.html";

}

function validateCountry(){

    if(countryInput.value.trim() === ""){

        alert("Veuillez sélectionner votre pays.");

        return false;

    }

    return true;

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
if(usernameInput.value.length < 3){

    showError(
        "Nom d'utilisateur invalide."
    );

    return false;

}
    if(countryInput.value === ""){

    showError(
        "Veuillez sélectionner un pays."
    );

    return false;

}
    return (

        validateUsername() &&

        validateDisplayName() &&

        validateEmail() &&

        validatePassword() &&

        validateConfirmPassword() &&

        validateCountry() &&

        checkTerms()

    );

}

function checkTerms(){

    if(!terms.checked){

       showError(
    "Vous devez accepter les conditions d'utilisation."
);

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

resendEmailButton.addEventListener(

    "click",

    resendVerificationEmail

);

closeVerifyModal.addEventListener(

    "click",

    ()=>{

        closeVerifyEmailModal();

        redirectToLogin();

    }

);

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
