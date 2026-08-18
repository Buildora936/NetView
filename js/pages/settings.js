// ==========================================
// NetView
// settings.js
// ==========================================

import {
    getSession,
    getUser,
    signOut,
    refreshUser,
    getRole
} from "../core/auth.js";

import {
    getUserSettings,
    updateUserSettings,
    initDeviceRevocationListener
} from "../core/data.js";

import {
    showLoader,
    hideLoader,
    buttonLoading
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";

import { supabase } from "../core/supabase.js";

initDeviceRevocationListener();
// ==========================================
// DOM Elements
// ==========================================

const currentEmail = document.getElementById("currentEmail");
const createdAt = document.getElementById("createdAt");
const accountTypeElement = document.getElementById("account_type");
const editProfileButton = document.getElementById("editProfileButton");
const notification = document.getElementById("notification");

const changePasswordButton = document.getElementById("changePasswordButton");
const viewDevicesButton = document.getElementById("viewDevicesButton");

const themeSelect = document.getElementById("theme");
const autoplayToggle = document.getElementById("autoplay");
const emailNotificationsToggle = document.getElementById("emailNotifications");
const pushNotificationsToggle = document.getElementById("pushNotifications");
const savePreferencesButton = document.getElementById("savePreferencesButton");

const removeAccountButton = document.getElementById("removeAccountButton");


// ==========================================
// Variables globales
// ==========================================
let currentUser = null;
let currentProfile = null;
let currentSettings = null;
let currentAccountType = "user";

let isSavingPreferences = false;


// ==========================================
// NOTIFICATION
// ==========================================

function showNotification(message, isError = false) {
    if (!notification) return;
    notification.textContent = message;
    notification.style.borderColor = isError ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
    notification.style.color = isError ? "#ef4444" : "#22c55e";
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 3500);
}


// ==========================================
// Initialisation
// ==========================================
async function init() {
    showLoader();
    try {
        await loadSession();
        if (!currentUser) return;

        await Promise.all([
            loadProfileData(),
            loadSettingsData(),
            loadAccountType()
        ]);
        
        fillPage();
        addEventListeners();
    } catch (error) {
        console.error(error);
        showNotification("Impossible de charger les paramètres.", true);
    } finally {
        hideLoader();
    }
}

async function loadSession() {
    const session = await getSession();
    if (!session) {
        navigate("login.html");
        return;
    }
    currentUser = await getUser() || session.user;
    if (!currentUser) {
        navigate("login.html");
    }
}

async function loadProfileData() {
    if (!currentUser) return;
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Load profile error:", error);
    }
    currentProfile = profile || null;
}

async function loadSettingsData() {
    currentSettings = await getUserSettings() || {
        theme: "dark",
        autoplay: true,
        email_notifications: true,
        push_notifications: true
    };
}

async function loadAccountType() {
    try {
        const role = await getRole();
        currentAccountType = role || "user";
    } catch (error) {
        console.error("Erreur chargement type de compte :", error);
        currentAccountType = "user";
    }
}


// ==========================================
// Remplissage de la page
// ==========================================
function fillPage() {
    if (currentEmail) currentEmail.textContent = currentUser?.email ?? "";
    
    if (createdAt) {
        createdAt.textContent = currentProfile?.created_at
            ? new Date(currentProfile.created_at).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric"
            })
            : "--";
    }

    if (accountTypeElement) {
        accountTypeElement.textContent = currentAccountType.toUpperCase();
    }

    if (themeSelect) themeSelect.value = currentSettings?.theme ?? "dark";
    if (autoplayToggle) autoplayToggle.checked = currentSettings?.autoplay ?? true;
    if (emailNotificationsToggle) emailNotificationsToggle.checked = currentSettings?.email_notifications ?? true;
    if (pushNotificationsToggle) pushNotificationsToggle.checked = currentSettings?.push_notifications ?? true;
}


// ==========================================
// Préférences
// ==========================================
async function savePreferences() {
    if (isSavingPreferences) return;
    isSavingPreferences = true;

    try {
        showLoader();
        buttonLoading(savePreferencesButton, true);

        const updatedSettings = {
            theme: themeSelect ? themeSelect.value : "dark",
            autoplay: autoplayToggle ? autoplayToggle.checked : true,
            email_notifications: emailNotificationsToggle ? emailNotificationsToggle.checked : true,
            push_notifications: pushNotificationsToggle ? pushNotificationsToggle.checked : true
        };

        const result = await updateUserSettings(updatedSettings);
        if (result && result.error) throw result.error;

        currentSettings = { ...currentSettings, ...updatedSettings };
        applyTheme(updatedSettings.theme);

        showNotification("Préférences enregistrées.", false);
    } catch (error) {
        console.error("Save settings error:", error);
        showNotification(error.message || "Impossible d'enregistrer les préférences.", true);
    } finally {
        hideLoader();
        buttonLoading(savePreferencesButton, false);
        isSavingPreferences = false;
    }
}

function applyTheme(theme) {
    if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
        document.documentElement.setAttribute("data-theme", theme);
    }
}


// ==========================================
// Événements globaux
// ==========================================
function addEventListeners() {
    if (changePasswordButton) {
        changePasswordButton.addEventListener("click", () => {
            navigate("forgot-password.html");
        });
    }
    if (savePreferencesButton) {
        savePreferencesButton.addEventListener("click", savePreferences);
    }
    if (editProfileButton) {
        editProfileButton.addEventListener("click", () => {
            navigate("profile.html");
        });
    }
    if (viewDevicesButton) {
        viewDevicesButton.addEventListener("click", () => {
            navigate("devices_list.html");
        });
    }
    if (removeAccountButton) {
        removeAccountButton.addEventListener("click", () => {
            navigate("remove_account.html");
        });
    }
}


// ==========================================
// Lancement
// ==========================================
init();
