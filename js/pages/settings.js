// ==========================================
// NetView
// settings.js
// ==========================================

import {

    getSession,
    getUser,
    updatePassword,
    signOut

} from "../core/auth.js";

import {

    getProfile,
    updateProfile,
    getUserSettings,
    updateUserSettings,
    getDevices

} from "../core/data.js";

import {

    showLoader,
    hideLoader,
    showToast,
    buttonLoading

} from "../core/ui.js";

import {

    navigate

} from "../core/navigation.js";

// ==========================================
// DOM
// ==========================================

// ------------------------------------------
// Compte
// ------------------------------------------

const currentEmail =
document.getElementById("currentEmail");

const displayName =
document.getElementById("displayName");

const username =
document.getElementById("username");

const accountType =
document.getElementById("accountType");

const createdAt =
document.getElementById("createdAt");

const editProfileButton =
document.getElementById("editProfileButton");

// ------------------------------------------
// Sécurité
// ------------------------------------------

const currentPassword =
document.getElementById("currentPassword");

const newPassword =
document.getElementById("newPassword");

const confirmPassword =
document.getElementById("confirmPassword");

const passwordStrengthBar =
document.getElementById("passwordStrengthBar");

const passwordStrengthText =
document.getElementById("passwordStrengthText");

const passwordMatch =
document.getElementById("passwordMatch");

const toggleCurrentPassword =
document.getElementById("toggleCurrentPassword");

const toggleNewPassword =
document.getElementById("toggleNewPassword");

const toggleConfirmPassword =
document.getElementById("toggleConfirmPassword");

const updatePasswordButton =
document.getElementById("updatePasswordButton");

const passwordError =
document.getElementById("passwordError");

// ------------------------------------------
// Appareils connectés
// ------------------------------------------

const devicesList =
document.getElementById("devicesList");

const logoutOthersButton =
document.getElementById("logoutOthersButton");

const devicesMessage =
document.getElementById("devicesMessage");

// ------------------------------------------
// Préférences
// ------------------------------------------

const theme =
document.getElementById("theme");

const autoplay =
document.getElementById("autoplay");

const emailNotifications =
document.getElementById("emailNotifications");

const pushNotifications =
document.getElementById("pushNotifications");

const savePreferencesButton =
document.getElementById("savePreferencesButton");

const preferencesMessage =
document.getElementById("preferencesMessage");

// ------------------------------------------
// Zone de danger
// ------------------------------------------

const deleteAccountButton =
document.getElementById("deleteAccountButton");

const deleteAccountModal =
document.getElementById("deleteAccountModal");

const deleteConfirmation =
document.getElementById("deleteConfirmation");

const confirmDeleteButton =
document.getElementById("confirmDeleteButton");

const cancelDeleteButton =
document.getElementById("cancelDeleteButton");

const deleteAccountMessage =
document.getElementById("deleteAccountMessage");

// ------------------------------------------
// Loader
// ------------------------------------------

const pageLoader =
document.getElementById("pageLoader");

// ==========================================
// Variables globales
// ==========================================

// ------------------------------------------
// Données utilisateur
// ------------------------------------------

let currentUser = null;

let currentProfile = null;

let currentSettings = null;

let currentDevices = [];


// ------------------------------------------
// États des actions
// ------------------------------------------

let isSavingProfile = false;

let isSavingPassword = false;

let isSavingPreferences = false;

let isDeleting = false;
// ==========================================
// Initialisation
// ==========================================

async function init(){

    showLoader();

    try{

        await loadSession();

        await Promise.all([

            loadProfile(),
            loadSettings(),
            loadDevices()

        ]);

        fillPage();

        addEventListeners();

    }

    catch(error){

        console.error(error);

        showToast(

            "Impossible de charger les paramètres.",

            "error"

        );

    }

    finally{

        hideLoader();

    }

}

// ==========================================
// Session
// ==========================================

async function loadSession(){

    const session =
        await getSession();

    if(!session){

        navigate("login.html");

        return;

    }

    currentUser =
        await getUser();

}

// ==========================================
// Profil
// ==========================================

async function loadProfile(){

    currentProfile =
        await getProfile();

}

// ==========================================
// Préférences
// ==========================================

async function loadSettings(){

    currentSettings =
        await getUserSettings();

}

// ==========================================
// Appareils
// ==========================================

async function loadDevices(){

    currentDevices =
        await getDevices();

}

// ==========================================
// Remplissage de la page
// ==========================================

function fillPage(){

    // Compte

    currentEmail.textContent =
        currentUser?.email ?? "";

    displayName.value =
        currentProfile?.display_name ?? "";

    username.value =
        currentProfile?.username ?? "";

    accountType.textContent =
        currentProfile?.role ?? "Utilisateur";

    createdAt.textContent =
        currentProfile?.created_at ?? "--";


    // Préférences

    theme.value =
        currentSettings?.theme ?? "dark";

    autoplay.checked =
        currentSettings?.autoplay ?? true;

    emailNotifications.checked =
        currentSettings?.email_notifications ?? true;

    pushNotifications.checked =
        currentSettings?.push_notifications ?? true;


    // Appareils

    renderDevices();

}

// ==========================================
// Événements
// ==========================================

function addEventListeners(){

    // Les addEventListener seront ajoutés
    // dans la partie suivante.

}

// ==========================================
// Démarrage
// ==========================================

init();
// ==========================================
// Compte
// ==========================================

// Remplit les informations du compte

function fillProfile(){

    if(!currentUser || !currentProfile){

        return;

    }

    currentEmail.textContent =
        currentUser.email ?? "";

    displayName.value =
        currentProfile.display_name ?? "";

    username.value =
        currentProfile.username ?? "";

    accountType.textContent =
        currentProfile.role ?? "Utilisateur";

    createdAt.textContent =

        currentProfile.created_at

        ? new Date(

            currentProfile.created_at

        ).toLocaleDateString(

            "fr-FR",

            {

                year:"numeric",

                month:"long",

                day:"numeric"

            }

        )

        : "--";

}


// Validation du profil

function validateProfile(){

    const name =
        displayName.value.trim();

    const user =
        username.value.trim();

    if(name.length < 3){

        showToast(

            "Le nom affiché doit contenir au moins 3 caractères.",

            "error"

        );

        displayName.focus();

        return false;

    }

    if(user.length < 3){

        showToast(

            "Le nom d'utilisateur doit contenir au moins 3 caractères.",

            "error"

        );

        username.focus();

        return false;

    }

    return true;

}


// Redirection vers profile.html

function openProfilePage(){

    navigate(

        "profile.html"

    );

}
// ==========================================
// Password Visibility
// ==========================================

// Afficher / masquer un mot de passe

function togglePasswordVisibility(
    input,
    button
){

    if(!input || !button)
        return;


    const isPassword =
        input.type === "password";


    input.type =
        isPassword
        ? "text"
        : "password";


    button.innerHTML =
        isPassword

        ? '<i class="fa-solid fa-eye-slash"></i>'

        : '<i class="fa-solid fa-eye"></i>';


    button.setAttribute(
        "aria-label",
        isPassword
        ? "Masquer le mot de passe"
        : "Afficher le mot de passe"
    );

}


// ==========================================
// DOM Password Toggle Buttons
// ==========================================

const toggleCurrentPassword =
    document.getElementById(
        "toggleCurrentPassword"
    );


const toggleNewPassword =
    document.getElementById(
        "toggleNewPassword"
    );


const toggleConfirmPassword =
    document.getElementById(
        "toggleConfirmPassword"
    );


// Inputs

const currentPasswordInput =
    document.getElementById(
        "currentPassword"
    );


const newPasswordInput =
    document.getElementById(
        "newPassword"
    );


const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );


// ==========================================
// Events Eye Buttons
// ==========================================

if(toggleCurrentPassword){

    toggleCurrentPassword.addEventListener(
        "click",
        ()=>{

            togglePasswordVisibility(
                currentPasswordInput,
                toggleCurrentPassword
            );

        }
    );

}



if(toggleNewPassword){

    toggleNewPassword.addEventListener(
        "click",
        ()=>{

            togglePasswordVisibility(
                newPasswordInput,
                toggleNewPassword
            );

        }
    );

}



if(toggleConfirmPassword){

    toggleConfirmPassword.addEventListener(
        "click",
        ()=>{

            togglePasswordVisibility(
                confirmPasswordInput,
                toggleConfirmPassword
            );

        }
    );

}
// ==========================================
// Password Strength
// ==========================================

const passwordStrengthBar =
    document.getElementById(
        "passwordStrengthBar"
    );


const passwordStrengthText =
    document.getElementById(
        "passwordStrengthText"
    );


const passwordMatch =
    document.getElementById(
        "passwordMatch"
    );


// ==========================================
// Update Password Strength
// ==========================================

function updatePasswordStrength(){

    if(!newPasswordInput)
        return;


    const password =
        newPasswordInput.value;


    let score = 0;


    if(password.length >= 8){

        score++;

    }


    if(/[A-Z]/.test(password)){

        score++;

    }


    if(/[a-z]/.test(password)){

        score++;

    }


    if(/[0-9]/.test(password)){

        score++;

    }


    if(/[^A-Za-z0-9]/.test(password)){

        score++;

    }



    if(passwordStrengthBar){

        passwordStrengthBar.style.width =
            "0%";

        passwordStrengthBar.className =
            "nv-password-strength-bar";

    }



    if(passwordStrengthText){

        passwordStrengthText.textContent =
            "";

    }



    switch(score){


        case 0:

        case 1:


            if(passwordStrengthBar){

                passwordStrengthBar.style.width =
                    "20%";

                passwordStrengthBar.classList.add(
                    "weak"
                );

            }


            if(passwordStrengthText){

                passwordStrengthText.textContent =
                    "Mot de passe très faible.";

            }


            break;



        case 2:


            if(passwordStrengthBar){

                passwordStrengthBar.style.width =
                    "40%";

                passwordStrengthBar.classList.add(
                    "medium"
                );

            }


            if(passwordStrengthText){

                passwordStrengthText.textContent =
                    "Mot de passe faible.";

            }


            break;



        case 3:


            if(passwordStrengthBar){

                passwordStrengthBar.style.width =
                    "60%";

                passwordStrengthBar.classList.add(
                    "good"
                );

            }


            if(passwordStrengthText){

                passwordStrengthText.textContent =
                    "Mot de passe correct.";

            }


            break;



        case 4:


            if(passwordStrengthBar){

                passwordStrengthBar.style.width =
                    "80%";

                passwordStrengthBar.classList.add(
                    "strong"
                );

            }


            if(passwordStrengthText){

                passwordStrengthText.textContent =
                    "Mot de passe fort.";

            }


            break;



        case 5:


            if(passwordStrengthBar){

                passwordStrengthBar.style.width =
                    "100%";

                passwordStrengthBar.classList.add(
                    "very-strong"
                );

            }


            if(passwordStrengthText){

                passwordStrengthText.textContent =
                    "Excellent mot de passe.";

            }


            break;


    }


    updatePasswordMatch();

}


// ==========================================
// Update Password Match
// ==========================================

function updatePasswordMatch(){

    if(
        !newPasswordInput ||
        !confirmPasswordInput ||
        !passwordMatch
    ){

        return false;

    }


    passwordMatch.textContent = "";

    passwordMatch.className =
        "nv-password-match";



    if(
        confirmPasswordInput.value === ""
    ){

        return true;

    }



    if(
        newPasswordInput.value ===
        confirmPasswordInput.value
    ){

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

if(newPasswordInput){

    newPasswordInput.addEventListener(
        "input",
        updatePasswordStrength
    );

}



if(confirmPasswordInput){

    confirmPasswordInput.addEventListener(
        "input",
        updatePasswordMatch
    );

}
// ==========================================
// Validate Password
// ==========================================

function validatePassword(){

    // Vérification champ mot de passe actuel

    if(
        !currentPasswordInput ||
        currentPasswordInput.value.trim() === ""
    ){

        showToast(
            "Veuillez saisir votre mot de passe actuel.",
            "error"
        );

        currentPasswordInput?.focus();

        return false;

    }



    // Vérification nouveau mot de passe

    if(
        !newPasswordInput ||
        newPasswordInput.value.trim() === ""
    ){

        showToast(
            "Veuillez saisir un nouveau mot de passe.",
            "error"
        );

        newPasswordInput?.focus();

        return false;

    }



    const newPassword =
        newPasswordInput.value;



    // Longueur minimale

    if(
        newPassword.length < 8
    ){

        showToast(
            "Le nouveau mot de passe doit contenir au moins 8 caractères.",
            "error"
        );


        newPasswordInput.focus();


        return false;

    }



    // Vérification majuscule

    if(
        !/[A-Z]/.test(newPassword)
    ){

        showToast(
            "Le mot de passe doit contenir au moins une lettre majuscule.",
            "error"
        );


        newPasswordInput.focus();


        return false;

    }



    // Vérification minuscule

    if(
        !/[a-z]/.test(newPassword)
    ){

        showToast(
            "Le mot de passe doit contenir au moins une lettre minuscule.",
            "error"
        );


        newPasswordInput.focus();


        return false;

    }



    // Vérification chiffre

    if(
        !/[0-9]/.test(newPassword)
    ){

        showToast(
            "Le mot de passe doit contenir au moins un chiffre.",
            "error"
        );


        newPasswordInput.focus();


        return false;

    }



    // Vérification caractère spécial

    if(
        !/[^A-Za-z0-9]/.test(newPassword)
    ){

        showToast(
            "Le mot de passe doit contenir au moins un caractère spécial.",
            "error"
        );


        newPasswordInput.focus();


        return false;

    }



    // Confirmation

    if(
        !confirmPasswordInput ||
        confirmPasswordInput.value.trim() === ""
    ){

        showToast(
            "Veuillez confirmer votre nouveau mot de passe.",
            "error"
        );


        confirmPasswordInput?.focus();


        return false;

    }



    if(
        newPassword !==
        confirmPasswordInput.value
    ){

        showToast(
            "Les mots de passe ne correspondent pas.",
            "error"
        );


        confirmPasswordInput.focus();


        return false;

    }



    // Ancien et nouveau identiques

    if(
        currentPasswordInput.value ===
        newPasswordInput.value
    ){

        showToast(
            "Le nouveau mot de passe doit être différent de l'ancien.",
            "error"
        );


        newPasswordInput.focus();


        return false;

    }



    return true;

}
// ==========================================
// Change Password
// ==========================================

const updatePasswordButton =
    document.getElementById(
        "updatePasswordButton"
    );


let isSavingPassword = false;


// ==========================================
// Change Password Function
// ==========================================

async function changePassword(){

    if(isSavingPassword)
        return;


    // Validation

    if(
        !validatePassword()
    ){

        return;

    }



    isSavingPassword = true;



    try{


        // Loader global

        showLoader();



        // Bouton loading

        buttonLoading(
            updatePasswordButton,
            true
        );



        const newPassword =
            newPasswordInput.value;



        // Mise à jour Supabase Auth

        const {

            error

        } = await updatePassword(
            newPassword
        );



        if(error){

            throw error;

        }



        // Nettoyage champs

        currentPasswordInput.value =
            "";

        newPasswordInput.value =
            "";

        confirmPasswordInput.value =
            "";



        // Reset indicateurs

        if(passwordStrengthBar){

            passwordStrengthBar.style.width =
                "0%";

            passwordStrengthBar.className =
                "nv-password-strength-bar";

        }



        if(passwordStrengthText){

            passwordStrengthText.textContent =
                "";

        }



        if(passwordMatch){

            passwordMatch.textContent =
                "";

            passwordMatch.className =
                "nv-password-match";

        }



        // Succès

        showToast(
            "Votre mot de passe a été mis à jour avec succès.",
            "success"
        );



    }


    catch(error){


        console.error(
            "Password update error:",
            error
        );



        let message =
            "Impossible de modifier le mot de passe.";



        if(error.message){

            message =
                error.message;

        }



        showToast(
            message,
            "error"
        );


    }


    finally{


        hideLoader();



        buttonLoading(
            updatePasswordButton,
            false
        );



        isSavingPassword =
            false;


    }


}


// ==========================================
// Button Event
// ==========================================

if(updatePasswordButton){

    updatePasswordButton.addEventListener(

        "click",

        changePassword

    );

}
// ==========================================
// Devices Management
// ==========================================


const devicesContainer =
    document.getElementById(
        "devicesContainer"
    );


const disconnectAllButton =
    document.getElementById(
        "disconnectOtherDevicesButton"
    );


let isDisconnectingDevice = false;


// ==========================================
// Load Devices
// ==========================================

async function loadDevices(){

    try{

        showLoader();


        const devices =
            await getDevices();


        currentDevices =
            devices || [];


        renderDevices();


    }


    catch(error){


        console.error(
            "Load devices error:",
            error
        );


        showToast(
            "Impossible de charger les appareils connectés.",
            "error"
        );


    }


    finally{


        hideLoader();


    }

}


// ==========================================
// Render Devices
// ==========================================

function renderDevices(){

    if(!devicesContainer)
        return;



    devicesContainer.innerHTML = "";



    if(
        !currentDevices ||
        currentDevices.length === 0
    ){

        devicesContainer.innerHTML = `

            <div class="nv-empty">

                Aucun appareil connecté.

            </div>

        `;


        return;

    }



    currentDevices.forEach(
        device=>{


            const card =
                createDeviceCard(
                    device
                );


            devicesContainer.appendChild(
                card
            );


        }
    );

}



// ==========================================
// Create Device Card
// ==========================================

function createDeviceCard(device){


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "nv-device-card";



    const current =
        renderCurrentDeviceBadge(
            device
        );



    card.innerHTML = `

        <div class="nv-device-icon">

            <i class="fa-solid fa-desktop"></i>

        </div>


        <div class="nv-device-info">


            <h3>

                ${device.device_name || "Appareil inconnu"}

                ${current}

            </h3>


            <p>

                Navigateur :
                ${device.browser || "--"}

            </p>


            <p>

                Système :
                ${device.operating_system || "--"}

            </p>


            <p>

                Dernière activité :
                ${formatDeviceDate(device.last_seen)}

            </p>


        </div>



        <button

            class="nv-btn nv-btn-danger nv-device-disconnect"

            data-device-id="${device.id}"

        >

            Déconnecter

        </button>


    `;



    const button =
        card.querySelector(
            ".nv-device-disconnect"
        );



    button.addEventListener(
        "click",
        ()=>{

            disconnectDevice(
                device.id
            );

        }
    );



    return card;

}



// ==========================================
// Current Device Badge
// ==========================================

function renderCurrentDeviceBadge(device){


    if(
        isCurrentDevice(device)
    ){

        return `

            <span class="nv-device-badge">

                Appareil actuel

            </span>

        `;

    }


    return "";

}



// ==========================================
// Detect Current Device
// ==========================================

function isCurrentDevice(device){


    const browser =
        navigator.userAgent;


    return (

        device.browser &&
        browser.includes(
            device.browser
        )

    );

}



// ==========================================
// Format Date
// ==========================================

function formatDeviceDate(date){


    if(!date)
        return "--";



    return new Date(date)
        .toLocaleString(
            "fr-FR"
        );

}



// ==========================================
// Disconnect One Device
// ==========================================

async function disconnectDevice(
    deviceId
){


    if(isDisconnectingDevice)
        return;



    try{


        isDisconnectingDevice =
            true;



        showLoader();



        const {

            error

        } = await supabase

        .from("devices")

        .delete()

        .eq(
            "id",
            deviceId
        );



        if(error){

            throw error;

        }



        showToast(
            "Appareil déconnecté.",
            "success"
        );



        await loadDevices();



    }


    catch(error){


        console.error(
            error
        );


        showToast(
            "Impossible de déconnecter cet appareil.",
            "error"
        );


    }


    finally{


        hideLoader();


        isDisconnectingDevice =
            false;


    }


}



// ==========================================
// Disconnect Other Devices
// ==========================================

async function disconnectOtherDevices(){


    try{


        showLoader();



        const currentDevice =
            currentDevices.find(
                device =>
                isCurrentDevice(device)
            );



        if(!currentDevice){


            showToast(
                "Impossible d'identifier l'appareil actuel.",
                "error"
            );


            return;

        }



        const {

            error

        } = await supabase

        .from("devices")

        .delete()

        .neq(

            "id",

            currentDevice.id

        )

        .eq(

            "user_id",

            currentUser.id

        );



        if(error){

            throw error;

        }



        showToast(
            "Tous les autres appareils ont été déconnectés.",
            "success"
        );



        await loadDevices();



    }


    catch(error){


        console.error(
            error
        );


        showToast(
            "Impossible de déconnecter les autres appareils.",
            "error"
        );


    }


    finally{


        hideLoader();


    }


}



// ==========================================
// Button Event
// ==========================================

if(disconnectAllButton){

    disconnectAllButton.addEventListener(
        "click",
        disconnectOtherDevices
    );

}
// ==========================================
// Preferences / User Settings
// ==========================================


const themeSelect =
    document.getElementById(
        "theme"
    );


const autoplayToggle =
    document.getElementById(
        "autoplay"
    );


const emailNotificationsToggle =
    document.getElementById(
        "emailNotifications"
    );


const pushNotificationsToggle =
    document.getElementById(
        "pushNotifications"
    );


const savePreferencesButton =
    document.getElementById(
        "savePreferencesButton"
    );


let isSavingPreferences = false;


// ==========================================
// Load Settings
// ==========================================

async function loadSettings(){

    try{


        const settings =
            await getUserSettings();



        currentSettings =
            settings || {

                theme:"dark",

                autoplay:true,

                email_notifications:true,

                push_notifications:true

            };



        fillSettings();



    }


    catch(error){


        console.error(
            "Load settings error:",
            error
        );


        showToast(
            "Impossible de charger vos préférences.",
            "error"
        );


    }

}



// ==========================================
// Fill Settings
// ==========================================

function fillSettings(){


    if(!currentSettings)
        return;



    // Theme

    if(themeSelect){

        themeSelect.value =
            currentSettings.theme ||
            "dark";

    }



    // Autoplay

    if(autoplayToggle){

        autoplayToggle.checked =
            currentSettings.autoplay;

    }



    // Email notifications

    if(emailNotificationsToggle){

        emailNotificationsToggle.checked =
            currentSettings.email_notifications;

    }



    // Push notifications

    if(pushNotificationsToggle){

        pushNotificationsToggle.checked =
            currentSettings.push_notifications;

    }


}



// ==========================================
// Save Preferences
// ==========================================

async function savePreferences(){


    if(isSavingPreferences)
        return;



    isSavingPreferences =
        true;



    try{


        showLoader();



        buttonLoading(

            savePreferencesButton,

            true

        );



        const updatedSettings = {


            theme:

                themeSelect

                ? themeSelect.value

                : "dark",



            autoplay:

                autoplayToggle

                ? autoplayToggle.checked

                : true,



            email_notifications:

                emailNotificationsToggle

                ? emailNotificationsToggle.checked

                : true,



            push_notifications:

                pushNotificationsToggle

                ? pushNotificationsToggle.checked

                : true


        };



        const {

            error

        } = await updateUserSettings(

            updatedSettings

        );



        if(error){

            throw error;

        }



        currentSettings =
            {

                ...currentSettings,

                ...updatedSettings

            };



        applyTheme(
            updatedSettings.theme
        );



        showToast(

            "Préférences enregistrées.",

            "success"

        );


    }


    catch(error){


        console.error(

            "Save settings error:",

            error

        );



        showToast(

            error.message ||

            "Impossible d'enregistrer les préférences.",

            "error"

        );


    }


    finally{


        hideLoader();



        buttonLoading(

            savePreferencesButton,

            false

        );



        isSavingPreferences =
            false;


    }


}



// ==========================================
// Theme Management
// ==========================================

function applyTheme(theme){


    if(theme === "system"){


        const darkMode =

            window.matchMedia(

                "(prefers-color-scheme: dark)"

            ).matches;



        document.documentElement.dataset.theme =

            darkMode

            ? "dark"

            : "light";


        return;

    }



    document.documentElement.dataset.theme =

        theme;


}



// ==========================================
// Save Button Event
// ==========================================

if(savePreferencesButton){

    savePreferencesButton.addEventListener(

        "click",

        savePreferences

    );

}



// ==========================================
// Live Theme Preview
// ==========================================

if(themeSelect){

    themeSelect.addEventListener(

        "change",

        ()=>{

            applyTheme(

                themeSelect.value

            );

        }

    );

}
// ==========================================
// Danger Zone / Delete Account
// ==========================================


const deleteAccountButton =
    document.getElementById(
        "deleteAccountButton"
    );


const deleteModal =
    document.getElementById(
        "deleteAccountModal"
    );


const closeDeleteModalButton =
    document.getElementById(
        "closeDeleteModalButton"
    );


const cancelDeleteButton =
    document.getElementById(
        "cancelDeleteButton"
    );


const confirmDeleteButton =
    document.getElementById(
        "confirmDeleteButton"
    );


const deleteWordInput =
    document.getElementById(
        "deleteWordInput"
    );


const deleteError =
    document.getElementById(
        "deleteError"
    );


let isDeleting = false;


// ==========================================
// Open Delete Modal
// ==========================================

function openDeleteModal(){


    if(!deleteModal)
        return;



    deleteModal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";



    if(deleteWordInput){

        deleteWordInput.value =
            "";

        deleteWordInput.focus();

    }



    if(confirmDeleteButton){

        confirmDeleteButton.disabled =
            true;

    }



    if(deleteError){

        deleteError.textContent =
            "";

    }


}



// ==========================================
// Close Delete Modal
// ==========================================

function closeDeleteModal(){


    if(!deleteModal)
        return;



    deleteModal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";



    if(deleteWordInput){

        deleteWordInput.value =
            "";

    }



    if(deleteError){

        deleteError.textContent =
            "";

    }


}



// ==========================================
// Validate Delete Word
// ==========================================

function validateDeleteWord(){


    if(!deleteWordInput)
        return false;



    const value =
        deleteWordInput.value.trim();



    const valid =
        value === "SUPPRIMER";



    if(confirmDeleteButton){

        confirmDeleteButton.disabled =
            !valid;

    }



    return valid;

}



// ==========================================
// Delete Account
// ==========================================

async function deleteAccount(){


    if(isDeleting)
        return;



    if(!validateDeleteWord()){


        showToast(

            "Veuillez saisir SUPPRIMER pour confirmer.",

            "error"

        );


        return;

    }



    isDeleting =
        true;



    try{


        showLoader();



        buttonLoading(

            confirmDeleteButton,

            true

        );



        /*
            Suppression côté Supabase

            Les tables liées :

            profiles
            user_roles
            user_settings
            devices
            autres tables ON DELETE CASCADE

            seront supprimées automatiquement.

        */



        const {

            error

        } = await deleteUserAccount();



        if(error){

            throw error;

        }



        showToast(

            "Votre compte a été supprimé définitivement.",

            "success"

        );



        await signOut();



        navigate(
            "index.html"
        );



    }


    catch(error){


        console.error(

            "Delete account error:",

            error

        );



        showToast(

            error.message ||

            "Impossible de supprimer votre compte.",

            "error"

        );


    }


    finally{


        hideLoader();



        buttonLoading(

            confirmDeleteButton,

            false

        );



        isDeleting =
            false;


    }


}



// ==========================================
// Events
// ==========================================


if(deleteAccountButton){

    deleteAccountButton.addEventListener(

        "click",

        openDeleteModal

    );

}



if(closeDeleteModalButton){

    closeDeleteModalButton.addEventListener(

        "click",

        closeDeleteModal

    );

}



if(cancelDeleteButton){

    cancelDeleteButton.addEventListener(

        "click",

        closeDeleteModal

    );

}



if(deleteWordInput){

    deleteWordInput.addEventListener(

        "input",

        validateDeleteWord

    );

}



if(confirmDeleteButton){

    confirmDeleteButton.addEventListener(

        "click",

        deleteAccount

    );

}



// Fermer en cliquant sur overlay

if(deleteModal){

    const overlay =

        deleteModal.querySelector(
            ".nv-modal-overlay"
        );


    if(overlay){

        overlay.addEventListener(

            "click",

            closeDeleteModal

        );

    }

}
// ==========================================
// Utilitaires
// ==========================================


// ==========================================
// Format Date
// ==========================================

function formatDate(date){

    if(!date)
        return "--";


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day:"2-digit",
            month:"long",
            year:"numeric",
            hour:"2-digit",
            minute:"2-digit"
        }

    ).format(
        new Date(date)
    );

}



// ==========================================
// Clear Messages
// ==========================================

function clearMessages(){

    document
    .querySelectorAll(
        ".nv-error-message, .nv-success-message"
    )
    .forEach(element=>{

        element.textContent="";

        element.classList.remove(
            "show"
        );

    });


}



// ==========================================
// Reset Errors
// ==========================================

function resetErrors(){

    document
    .querySelectorAll(
        ".error"
    )
    .forEach(error=>{

        error.textContent="";

        error.classList.remove(
            "show"
        );

    });


    document
    .querySelectorAll(
        ".nv-input-error"
    )
    .forEach(input=>{

        input.classList.remove(
            "nv-input-error"
        );

    });


}



// ==========================================
// Show Error
// ==========================================

function showError(
    message,
    element = null
){

    if(element){

        element.textContent =
            message;

        element.classList.add(
            "show"
        );

        return;

    }


    showToast(
        message,
        "error"
    );

}



// ==========================================
// Show Success
// ==========================================

function showSuccess(
    message
){

    showToast(
        message,
        "success"
    );

}
// ==========================================
// Événements
// ==========================================

function addEventListeners(){



// ==========================================
// Compte
// ==========================================

const editProfileButton =
document.getElementById(
    "editProfileButton"
);


if(editProfileButton){

    editProfileButton.addEventListener(
        "click",
        ()=>{

            navigate(
                "profile.html"
            );

        }
    );

}



// ==========================================
// Sécurité - Mot de passe
// ==========================================

const currentPassword =
document.getElementById(
    "currentPassword"
);

const newPassword =
document.getElementById(
    "newPassword"
);

const confirmNewPassword =
document.getElementById(
    "confirmNewPassword"
);


if(newPassword){

    newPassword.addEventListener(
        "input",
        ()=>{

            updatePasswordStrength();

            updatePasswordMatch();

        }
    );

}


if(confirmNewPassword){

    confirmNewPassword.addEventListener(
        "input",
        ()=>{

            updatePasswordMatch();

        }
    );

}



// ==========================================
// Yeux mot de passe
// ==========================================

const toggleCurrentPassword =
document.getElementById(
    "toggleCurrentPassword"
);


const toggleNewPassword =
document.getElementById(
    "toggleNewPassword"
);


const toggleConfirmPassword =
document.getElementById(
    "toggleConfirmPassword"
);



if(toggleCurrentPassword){

    toggleCurrentPassword.addEventListener(
        "click",
        ()=>{

            togglePasswordVisibility(
                currentPassword,
                toggleCurrentPassword
            );

        }
    );

}



if(toggleNewPassword){

    toggleNewPassword.addEventListener(
        "click",
        ()=>{

            togglePasswordVisibility(
                newPassword,
                toggleNewPassword
            );

        }
    );

}



if(toggleConfirmPassword){

    toggleConfirmPassword.addEventListener(
        "click",
        ()=>{

            togglePasswordVisibility(
                confirmNewPassword,
                toggleConfirmPassword
            );

        }
    );

}



// Bouton mise à jour

const updatePasswordButton =
document.getElementById(
    "updatePasswordButton"
);


if(updatePasswordButton){

    updatePasswordButton.addEventListener(
        "click",
        changePassword
    );

}



// ==========================================
// Préférences
// ==========================================

const savePreferencesButton =
document.getElementById(
    "savePreferencesButton"
);



if(savePreferencesButton){

    savePreferencesButton.addEventListener(
        "click",
        savePreferences
    );

}



// ==========================================
// Appareils
// ==========================================


// Déconnexion appareil

document
.querySelectorAll(
    ".disconnect-device"
)
.forEach(button=>{


    button.addEventListener(
        "click",
        ()=>{

            const deviceId =
            button.dataset.deviceId;


            disconnectDevice(
                deviceId
            );

        }
    );


});



// Déconnexion autres appareils

const disconnectOtherButton =
document.getElementById(
    "disconnectOtherDevicesButton"
);



if(disconnectOtherButton){

    disconnectOtherButton.addEventListener(
        "click",
        disconnectOtherDevices
    );

}



// ==========================================
// Zone de danger
// ==========================================


const openDeleteButton =
document.getElementById(
    "openDeleteModalButton"
);


if(openDeleteButton){

    openDeleteButton.addEventListener(
        "click",
        openDeleteModal
    );

}



const closeDeleteButton =
document.getElementById(
    "closeDeleteModalButton"
);



if(closeDeleteButton){

    closeDeleteButton.addEventListener(
        "click",
        closeDeleteModal
    );

}




const deleteWordInput =
document.getElementById(
    "deleteConfirmInput"
);



if(deleteWordInput){

    deleteWordInput.addEventListener(
        "input",
        ()=>{

            validateDeleteWord();

        }
    );

}




const confirmDeleteButton =
document.getElementById(
    "confirmDeleteButton"
);



if(confirmDeleteButton){

    confirmDeleteButton.addEventListener(
        "click",
        deleteAccount
    );

}



}
// ==========================================
// Vérifications automatiques
// ==========================================


// ==========================================
// Vérifier session
// ==========================================

async function loadSession(){


    try{


        const session =
        await getSession();



        if(!session){


            navigate(
                "login.html"
            );


            return false;

        }



        currentUser =
        session.user;



        return true;


    }


    catch(error){


        console.error(
            error
        );


        navigate(
            "login.html"
        );


        return false;


    }


}



// ==========================================
// Initialisation complète
// ==========================================

async function init(){



    const authenticated =
    await loadSession();



    if(!authenticated)
        return;



    try{


        showLoader();



        await loadProfile();



        await loadSettings();



        await loadDevices();



        fillPage();



        addEventListeners();



        hideLoader();



    }


    catch(error){


        console.error(
            error
        );


        showError(
            "Impossible de charger vos paramètres."
        );


        hideLoader();


    }



}



// ==========================================
// Démarrage automatique
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    ()=>{


        init();


    }

);
