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
