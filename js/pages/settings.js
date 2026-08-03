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
const displayName = document.getElementById("displayName");
const username = document.getElementById("username");
const accountType = document.getElementById("accountType");
const createdAt = document.getElementById("createdAt");
const editProfileButton = document.getElementById("editProfileButton");

// Sécurité & Mots de passe
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
const devicesContainer = document.getElementById("devicesContainer") || document.getElementById("devicesList");
const disconnectAllButton = document.getElementById("disconnectOtherDevicesButton") || document.getElementById("logoutOthersButton");
const devicesMessage = document.getElementById("devicesMessage");

// Préférences
const themeSelect = document.getElementById("theme");
const autoplayToggle = document.getElementById("autoplay");
const emailNotificationsToggle = document.getElementById("emailNotifications");
const pushNotificationsToggle = document.getElementById("pushNotifications");
const savePreferencesButton = document.getElementById("savePreferencesButton");
const preferencesMessage = document.getElementById("preferencesMessage");

// Zone de danger
const deleteAccountButton = document.getElementById("deleteAccountButton");
const deleteAccountModal = document.getElementById("deleteAccountModal");
const deleteConfirmation = document.getElementById("deleteConfirmation");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const deleteAccountMessage = document.getElementById("deleteAccountMessage");

// Loader
const pageLoader = document.getElementById("pageLoader");

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
            loadProfile(),
            loadSettings(),
            loadDevices()
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

// ==========================================
// Session
// ==========================================

async function loadSession() {
    const session = await getSession();

    if (!session) {
        navigate("login.html");
        return;
    }

    currentUser = await getUser();
}

// ==========================================
// Profil & Chargement Données
// ==========================================

async function loadProfile() {
    currentProfile = await getProfile();
}

async function loadSettings() {
    try {
        const settings = await getUserSettings();
        currentSettings = settings || {
            theme: "dark",
            autoplay: true,
            email_notifications: true,
            push_notifications: true
        };
    } catch (error) {
        console.error("Load settings error:", error);
        showToast("Impossible de charger vos préférences.", "error");
    }
}

async function loadDevices() {
    try {
        const devices = await getDevices();
        currentDevices = devices || [];
        renderDevices();
    } catch (error) {
        console.error("Load devices error:", error);
        showToast("Impossible de charger les appareils connectés.", "error");
    }
}

// ==========================================
// Remplissage de la page
// ==========================================

function fillPage() {
    fillProfile();
    fillSettings();
    renderDevices();
}

function fillProfile() {
    if (!currentUser || !currentProfile) return;

    if (currentEmail) currentEmail.textContent = currentUser.email ?? "";
    if (displayName) displayName.value = currentProfile.display_name ?? "";
    if (username) username.value = currentProfile.username ?? "";
    if (accountType) accountType.textContent = currentProfile.role ?? "Utilisateur";
    
    if (createdAt) {
        createdAt.textContent = currentProfile.created_at
            ? new Date(currentProfile.created_at).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric"
            })
            : "--";
    }
}

function fillSettings() {
    if (!currentSettings) return;

    if (themeSelect) themeSelect.value = currentSettings.theme || "dark";
    if (autoplayToggle) autoplayToggle.checked = currentSettings.autoplay;
    if (emailNotificationsToggle) emailNotificationsToggle.checked = currentSettings.email_notifications;
    if (pushNotificationsToggle) pushNotificationsToggle.checked = currentSettings.push_notifications;
}

// ==========================================
// Password Visibility & Strength
// ==========================================

function togglePasswordVisibility(input, button) {
    if (!input || !button) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    button.innerHTML = isPassword
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

    button.setAttribute(
        "aria-label",
        isPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
    );
}

function updatePasswordStrength() {
    if (!newPasswordInput) return;

    const password = newPasswordInput.value;
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (passwordStrengthBar) {
        passwordStrengthBar.style.width = "0%";
        passwordStrengthBar.className = "nv-password-strength-bar";
    }

    if (passwordStrengthText) {
        passwordStrengthText.textContent = "";
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
    if (!/[A-Z]/.test(newPass)) {
        showToast("Le mot de passe doit contenir au moins une lettre majuscule.", "error");
        newPasswordInput.focus();
        return false;
    }
    if (!/[a-z]/.test(newPass)) {
        showToast("Le mot de passe doit contenir au moins une lettre minuscule.", "error");
        newPasswordInput.focus();
        return false;
    }
    if (!/[0-9]/.test(newPass)) {
        showToast("Le mot de passe doit contenir au moins un chiffre.", "error");
        newPasswordInput.focus();
        return false;
    }
    if (!/[^A-Za-z0-9]/.test(newPass)) {
        showToast("Le mot de passe doit contenir au moins un caractère spécial.", "error");
        newPasswordInput.focus();
        return false;
    }

    if (!confirmPasswordInput || confirmPasswordInput.value.trim() === "") {
        showToast("Veuillez confirmer votre nouveau mot de passe.", "error");
        confirmPasswordInput?.focus();
        return false;
    }

    if (newPass !== confirmPasswordInput.value) {
        showToast("Les mots de passe ne correspondent pas.", "error");
        confirmPasswordInput.focus();
        return false;
    }

    if (currentPasswordInput.value === newPasswordInput.value) {
        showToast("Le nouveau mot de passe doit être différent de l'ancien.", "error");
        newPasswordInput.focus();
        return false;
    }

    return true;
}

async function changePassword() {
    if (isSavingPassword || !validatePassword()) return;

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
// Devices Management
// ==========================================

function renderDevices() {
    if (!devicesContainer) return;

    devicesContainer.innerHTML = "";

    if (!currentDevices || currentDevices.length === 0) {
        devicesContainer.innerHTML = `
            <div class="nv-empty">
                Aucun appareil connecté.
            </div>
        `;
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

    const current = renderCurrentDeviceBadge(device);

    card.innerHTML = `
        <div class="nv-device-icon">
            <i class="fa-solid fa-desktop"></i>
        </div>
        <div class="nv-device-info">
            <h3>
                ${device.device_name || "Appareil inconnu"}
                ${current}
            </h3>
            <p>Navigateur : ${device.browser || "--"}</p>
            <p>Système : ${device.operating_system || "--"}</p>
            <p>Dernière activité : ${formatDeviceDate(device.last_seen)}</p>
        </div>
        <button class="nv-btn nv-btn-danger nv-device-disconnect" data-device-id="${device.id}">
            Déconnecter
        </button>
    `;

    const button = card.querySelector(".nv-device-disconnect");
    if (button) {
        button.addEventListener("click", () => disconnectDevice(device.id));
    }

    return card;
}

function renderCurrentDeviceBadge(device) {
    if (isCurrentDevice(device)) {
        return `
            <span class="nv-device-badge">
                Appareil actuel
            </span>
        `;
    }
    return "";
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

    try {
        isDisconnectingDevice = true;
        showLoader();

        currentDevices = currentDevices.filter(d => d.id !== deviceId);
        renderDevices();

        showToast("Appareil déconnecté.", "success");
    } catch (error) {
        console.error(error);
        showToast("Impossible de déconnecter cet appareil.", "error");
    } finally {
        hideLoader();
        isDisconnectingDevice = false;
    }
}

async function disconnectOtherDevices() {
    try {
        showLoader();
        const currentDevice = currentDevices.find(device => isCurrentDevice(device));

        if (!currentDevice) {
            showToast("Impossible d'identifier l'appareil actuel.", "error");
            return;
        }

        currentDevices = [currentDevice];
        renderDevices();

        showToast("Tous les autres appareils ont été déconnectés.", "success");
    } catch (error) {
        console.error(error);
        showToast("Impossible de déconnecter les autres appareils.", "error");
    } finally {
        hideLoader();
    }
}

// ==========================================
// Preferences Save
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

        currentSettings = {
            ...currentSettings,
            ...updatedSettings
        };

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

// ==========================================
// Event Listeners
// ==========================================

function addEventListeners() {
    // Profil / Navigation
    if (editProfileButton) {
        editProfileButton.addEventListener("click", (e) => {
            e.preventDefault();
            navigate("profile.html");
        });
    }

    // Visibilité Mots de passe
    if (toggleCurrentPassword && currentPasswordInput) {
        toggleCurrentPassword.addEventListener("click", () => togglePasswordVisibility(currentPasswordInput, toggleCurrentPassword));
    }
    if (toggleNewPassword && newPasswordInput) {
        toggleNewPassword.addEventListener("click", () => togglePasswordVisibility(newPasswordInput, toggleNewPassword));
    }
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener("click", () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword));
    }

    // Force et correspondance MDP
    if (newPasswordInput) {
        newPasswordInput.addEventListener("input", updatePasswordStrength);
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener("input", updatePasswordMatch);
    }

    // Bouton mise à jour MDP
    if (updatePasswordButton) {
        updatePasswordButton.addEventListener("click", changePassword);
    }

    // Déconnexion autres appareils
    if (disconnectAllButton) {
        disconnectAllButton.addEventListener("click", disconnectOtherDevices);
    }

    // Enregistrement préférences
    if (savePreferencesButton) {
        savePreferencesButton.addEventListener("click", savePreferences);
    }
}

// ==========================================
// Démarrage de l'application
// ==========================================

init();
