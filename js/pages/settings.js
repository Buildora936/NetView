// ==========================================
// NetView - settings.js (Partie 1 : Imports, DOM, Variables)
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
// 1. DOM Elements (Basés sur le HTML exact)
// ==========================================

// Infos Compte (Haut de page)
const currentEmail = document.getElementById("currentEmail");
const displayName = document.getElementById("displayName");
const username = document.getElementById("username");
const accountType = document.getElementById("accountType");
const createdAt = document.getElementById("createdAt");

// Sécurité / Mot de passe
const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const toggleCurrentPassword = document.getElementById("toggleCurrentPassword");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const passwordStrengthBar = document.getElementById("passwordStrengthBar");
const passwordStrengthText = document.getElementById("passwordStrengthText");
const passwordMatch = document.getElementById("passwordMatch");
const passwordError = document.getElementById("passwordError");
const updatePasswordButton = document.getElementById("updatePasswordButton");

// Appareils connectés
const devicesList = document.getElementById("devicesList");
const logoutOthersButton = document.getElementById("logoutOthersButton");
const devicesMessage = document.getElementById("devicesMessage");

// Préférences
const themeSelect = document.getElementById("theme");
const autoplayToggle = document.getElementById("autoplay");
const emailNotificationsToggle = document.getElementById("emailNotifications");
const pushNotificationsToggle = document.getElementById("pushNotifications");
const savePreferencesButton = document.getElementById("savePreferencesButton");
const preferencesMessage = document.getElementById("preferencesMessage");

// Zone de danger / Suppression de compte
const deleteAccountButton = document.getElementById("deleteAccountButton");
const deleteAccountModal = document.getElementById("deleteAccountModal");
const deleteConfirmation = document.getElementById("deleteConfirmation");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const deleteAccountMessage = document.getElementById("deleteAccountMessage");

// Loader global
const pageLoader = document.getElementById("pageLoader");

// ==========================================
// 2. Variables Globales d'État
// ==========================================

let currentUser = null;
let currentProfile = null;
let currentSettings = null;
let currentDevices = [];

let isSavingPassword = false;
let isSavingPreferences = false;
let isDeletingAccount = false;
