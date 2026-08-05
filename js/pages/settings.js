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
// DOM Elements
// ==========================================

// Compte
const currentEmail = document.getElementById("currentEmail");
const displayNameInput = document.getElementById("displayName");
const usernameInput = document.getElementById("username");
const accountType = document.getElementById("accountType");
const createdAt = document.getElementById("createdAt");
const editProfileButton = document.getElementById("editProfileButton");

// Sécurité / Mot de passe
const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordStrengthBar = document.getElementById("passwordStrengthBar");
const passwordStrengthText = document.getElementById("passwordStrengthText");
const passwordMatch = document.getElementById("passwordMatch");
const toggleCurrentPassword = document.getElementById("toggleCurrentPassword");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const updatePasswordButton = document.getElementById("updatePasswordButton");

// Appareils connectés
const devicesContainer = document.getElementById("devicesContainer");
const disconnectOtherDevicesButton = document.getElementById("disconnectOtherDevicesButton");

// Préférences
const themeSelect = document.getElementById("theme");
const autoplayToggle = document.getElementById("autoplay");
const emailNotificationsToggle = document.getElementById("emailNotifications");
const pushNotificationsToggle = document.getElementById("pushNotifications");
const savePreferencesButton = document.getElementById("savePreferencesButton");

// Zone de danger
const deleteAccountButton = document.getElementById("deleteAccountButton");
const deleteAccountModal = document.getElementById("deleteAccountModal");
const deleteConfirmation = document.getElementById("deleteConfirmation");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");

// ==========================================
// Variables globales
// ==========================================
let currentUser = null;
let currentProfile = null;
let currentSettings = null;
let currentDevices = [];

let isSavingPassword = false;
let isSavingPreferences = false;
let isDisconnectingDevice = false;

// ==========================================
// Initialisation
// ==========================================
async function init() {
    showLoader();
    try {
        await loadSession();
        await Promise.all([
            loadProfileData(),
            loadSettingsData(),
            loadDevicesData()
        ]);
        fillPage();
        addEventListeners();
    } catch (error) {
        console.error(error);
        showToast("Impossible de charger les paramètres.", "error");
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
    currentUser = await getUser();
}

async function loadProfileData() {
    currentProfile = await getProfile();
}

async function loadSettingsData() {
    currentSettings = await getUserSettings() || {
        theme: "dark",
        autoplay: true,
        email_notifications: true,
        push_notifications: true
    };
}

async function loadDevicesData() {
    try {
        const devices = await getDevices();
        currentDevices = devices || [];
    } catch (error) {
        console.error("Load devices error:", error);
        currentDevices = [];
    }
}

// ==========================================
// Remplissage de la page
// ==========================================
function fillPage() {
    // Compte (Récupération depuis l'objet utilisateur et profil)
    if (currentEmail) currentEmail.textContent = currentUser?.email ?? "";
    if (displayNameInput) displayNameInput.value = currentProfile?.display_name ?? "";
    if (usernameInput) usernameInput.value = currentProfile?.username ?? "";
    if (accountType) accountType.textContent = currentProfile?.role ?? "Utilisateur";
    
    if (createdAt) {
        createdAt.textContent = currentProfile?.created_at
            ? new Date(currentProfile.created_at).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric"
            })
            : "--";
    }

    // Préférences
    if (themeSelect) themeSelect.value = currentSettings?.theme ?? "dark";
    if (autoplayToggle) autoplayToggle.checked = currentSettings?.autoplay ?? true;
    if (emailNotificationsToggle) emailNotificationsToggle.checked = currentSettings?.email_notifications ?? true;
    if (pushNotificationsToggle) pushNotificationsToggle.checked = currentSettings?.push_notifications ?? true;

    // Appareils
    renderDevices();
}

// ==========================================
// Gestion de la visibilité des mots de passe
// ==========================================
function togglePasswordVisibility(input, button) {
    if (!input || !button) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    button.setAttribute("aria-label", isPassword ? "Masquer le mot de passe" : "Afficher le mot de passe");
}

// ==========================================
// Password Strength
// ==========================================

function updatePasswordStrength() {
    if (!newPasswordInput) return;
    const value = newPasswordInput.value;
    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (passwordStrengthBar) {
        passwordStrengthBar.className = "nv-password-strength-bar";
    }

    if (value.length === 0) {
        if (passwordStrengthBar) passwordStrengthBar.style.width = "0%";
        if (passwordStrengthText) passwordStrengthText.textContent = "Choisissez un mot de passe sécurisé.";
        updatePasswordMatch();
        return;
    }

    switch (score) {
        case 0:
        case 1:
            if (passwordStrengthBar) {
                passwordStrengthBar.style.width = "20%";
                passwordStrengthBar.classList.add("weak");
            }
            if (passwordStrengthText) passwordStrengthText.textContent = "Mot de passe très faible.";
            break;
        case 2:
            if (passwordStrengthBar) {
                passwordStrengthBar.style.width = "40%";
                passwordStrengthBar.classList.add("medium");
            }
            if (passwordStrengthText) passwordStrengthText.textContent = "Mot de passe faible.";
            break;
        case 3:
            if (passwordStrengthBar) {
                passwordStrengthBar.style.width = "60%";
                passwordStrengthBar.classList.add("good");
            }
            if (passwordStrengthText) passwordStrengthText.textContent = "Mot de passe correct.";
            break;
        case 4:
            if (passwordStrengthBar) {
                passwordStrengthBar.style.width = "80%";
                passwordStrengthBar.classList.add("strong");
            }
            if (passwordStrengthText) passwordStrengthText.textContent = "Mot de passe fort.";
            break;
        case 5:
            if (passwordStrengthBar) {
                passwordStrengthBar.style.width = "100%";
                passwordStrengthBar.classList.add("very-strong");
            }
            if (passwordStrengthText) passwordStrengthText.textContent = "Excellent mot de passe.";
            break;
    }

    updatePasswordMatch();
}

function updatePasswordMatch() {
    if (!newPasswordInput || !confirmPasswordInput || !passwordMatch) return false;

    passwordMatch.textContent = "";
    passwordMatch.className = "nv-password-match";

    if (confirmPasswordInput.value === "") return true;

    if (newPasswordInput.value === confirmPasswordInput.value) {
        passwordMatch.textContent = "Les mots de passe correspondent.";
        passwordMatch.classList.add("success");
        return true;
    }

    passwordMatch.textContent = "Les mots de passe ne correspondent pas.";
    passwordMatch.classList.add("error");
    return false;
}

function validatePassword() {
    if (!currentPasswordInput || currentPasswordInput.value.trim() === "") {
        showToast("Veuillez saisir votre mot de passe actuel.", "error");
        currentPasswordInput?.focus();
        return false;
    }
    if (!newPasswordInput || newPasswordInput.value.trim() === "") {
        showToast("Veuillez saisir un nouveau mot de passe.", "error");
        newPasswordInput?.focus();
        return false;
    }
    const newPass = newPasswordInput.value;
    if (newPass.length < 8) {
        showToast("Le nouveau mot de passe doit contenir au moins 8 caractères.", "error");
        newPasswordInput.focus();
        return false;
    }
    if (!/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/[0-9]/.test(newPass) || !/[^A-Za-z0-9]/.test(newPass)) {
        showToast("Le mot de passe doit contenir majuscules, minuscules, chiffres et caractères spéciaux.", "error");
        newPasswordInput.focus();
        return false;
    }
    if (newPass !== confirmPasswordInput?.value) {
        showToast("Les mots de passe ne correspondent pas.", "error");
        confirmPasswordInput?.focus();
        return false;
    }
    if (currentPasswordInput.value === newPass) {
        showToast("Le nouveau mot de passe doit être différent de l'ancien.", "error");
        newPasswordInput.focus();
        return false;
    }
    return true;
}

async function changePassword() {
    if (isSavingPassword) return;
    if (!validatePassword()) return;

    isSavingPassword = true;
    try {
        showLoader();
        buttonLoading(updatePasswordButton, true);

        const { error } = await updatePassword(newPasswordInput.value);
        if (error) throw error;

        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";

        if (passwordStrengthBar) {
            passwordStrengthBar.style.width = "0%";
            passwordStrengthBar.className = "nv-password-strength-bar";
        }
        if (passwordStrengthText) passwordStrengthText.textContent = "";
        if (passwordMatch) {
            passwordMatch.textContent = "";
            passwordMatch.className = "nv-password-match";
        }

        showToast("Votre mot de passe a été mis à jour avec succès.", "success");
    } catch (error) {
        console.error("Password update error:", error);
        showToast(error.message || "Impossible de modifier le mot de passe.", "error");
    } finally {
        hideLoader();
        buttonLoading(updatePasswordButton, false);
        isSavingPassword = false;
    }
}

// ==========================================
// Appareils connectés
// ==========================================
function renderDevices() {
    if (!devicesContainer) return;
    devicesContainer.innerHTML = "";

    if (!currentDevices || currentDevices.length === 0) {
        devicesContainer.innerHTML = `<div class="nv-empty">Aucun appareil connecté.</div>`;
        return;
    }

    currentDevices.forEach(device => {
        const card = createDeviceCard(device);
        devicesContainer.appendChild(card);
    });
}

function createDeviceCard(device) {
    const card = document.createElement("div");
    card.className = "nv-device-card";
    const currentBadge = isCurrentDevice(device) ? `<span class="nv-device-badge">Appareil actuel</span>` : "";

    card.innerHTML = `
        <div class="nv-device-icon"><i class="fa-solid fa-desktop"></i></div>
        <div class="nv-device-info">
            <h3>${device.device_name || "Appareil inconnu"} ${currentBadge}</h3>
            <p>Navigateur : ${device.browser || "--"}</p>
            <p>Système : ${device.operating_system || "--"}</p>
            <p>Dernière activité : ${formatDeviceDate(device.last_seen)}</p>
        </div>
        <button class="nv-btn nv-btn-danger nv-device-disconnect" data-device-id="${device.id}">Déconnecter</button>
    `;

    const btn = card.querySelector(".nv-device-disconnect");
    btn.addEventListener("click", () => disconnectDevice(device.id));
    return card;
}

function isCurrentDevice(device) {
    const browser = navigator.userAgent;
    return device.browser && browser.includes(device.browser);
}

function formatDeviceDate(date) {
    if (!date) return "--";
    return new Date(date).toLocaleString("fr-FR");
}

async function disconnectDevice(deviceId) {
    if (isDisconnectingDevice) return;
    isDisconnectingDevice = true;
    try {
        showLoader();
        await getDevices(); 
        showToast("Appareil déconnecté.", "success");
        await loadDevicesData();
        renderDevices();
    } catch (error) {
        console.error(error);
        showToast("Impossible de déconnecter cet appareil.", "error");
    } finally {
        hideLoader();
        isDisconnectingDevice = false;
    }
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

        const { error } = await updateUserSettings(updatedSettings);
        if (error) throw error;

        currentSettings = { ...currentSettings, ...updatedSettings };
        applyTheme(updatedSettings.theme);

        showToast("Préférences enregistrées.", "success");
    } catch (error) {
        console.error("Save settings error:", error);
        showToast(error.message || "Impossible d'enregistrer les préférences.", "error");
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
    if (toggleCurrentPassword) {
        toggleCurrentPassword.addEventListener("click", () => togglePasswordVisibility(currentPasswordInput, toggleCurrentPassword));
    }
    if (toggleNewPassword) {
        toggleNewPassword.addEventListener("click", () => togglePasswordVisibility(newPasswordInput, toggleNewPassword));
    }
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener("click", () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword));
    }
    if (newPasswordInput) {
        newPasswordInput.addEventListener("input", updatePasswordStrength);
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener("input", updatePasswordMatch);
    }
    if (updatePasswordButton) {
        updatePasswordButton.addEventListener("click", changePassword);
    }
    if (savePreferencesButton) {
        savePreferencesButton.addEventListener("click", savePreferences);
    }
    if (editProfileButton) {
        editProfileButton.addEventListener("click", () => {
            navigate("profile.html");
        });
    }
}

// ==========================================
// Lancement
// ==========================================
init();
