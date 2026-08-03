// ==========================================
// NetView
// settings.js (Autonome sans data.js)
// ==========================================

import { supabase } from "./supabase.js";

import {
    getSession,
    getUser,
    updatePassword,
    signOut
} from "../core/auth.js";

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
const devicesContainer = document.getElementById("devicesContainer");
const disconnectAllButton = document.getElementById("disconnectOtherDevicesButton");

// Préférences
const themeSelect = document.getElementById("theme");
const autoplayToggle = document.getElementById("autoplay");
const emailNotificationsToggle = document.getElementById("emailNotifications");
const pushNotificationsToggle = document.getElementById("pushNotifications");
const savePreferencesButton = document.getElementById("savePreferencesButton");

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

        // Chargement direct via Supabase (sans data.js)
        await Promise.all([
            loadProfileData(),
            loadSettingsData(),
            loadDevicesData()
        ]);

        fillPage();
        addEventListeners();
    } catch (error) {
        console.error("Erreur d'initialisation :", error);
        showToast("Impossible de charger les paramètres.", "error");
    } finally {
        hideLoader();
    }
}

// ==========================================
// Session & Appels Directs Supabase
// ==========================================

async function loadSession() {
    const session = await getSession();

    if (!session) {
        navigate("login.html");
        return;
    }

    currentUser = await getUser();
}

async function loadProfileData() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Erreur chargement profil :", error);
    }
    currentProfile = data || null;
}

async function loadSettingsData() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Erreur chargement préférences :", error);
    }
    
    currentSettings = data || {
        theme: "dark",
        autoplay: true,
        email_notifications: true,
        push_notifications: true
    };
}

async function loadDevicesData() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("Erreur chargement appareils :", error);
        currentDevices = [];
    } else {
        currentDevices = data || [];
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
    if (!currentUser) return;

    if (currentEmail) currentEmail.textContent = currentUser.email ?? "";
    if (accountType) accountType.textContent = currentProfile?.role ?? "Utilisateur";

    if (currentProfile) {
        if (displayName) displayName.value = currentProfile.display_name ?? "";
        if (username) username.value = currentProfile.username ?? "";
        
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
}

function fillSettings() {
    if (!currentSettings) return;

    if (themeSelect) themeSelect.value = currentSettings.theme || "dark";
    if (autoplayToggle) autoplayToggle.checked = currentSettings.autoplay ?? true;
    if (emailNotificationsToggle) emailNotificationsToggle.checked = currentSettings.email_notifications ?? true;
    if (pushNotificationsToggle) pushNotificationsToggle.checked = currentSettings.push_notifications ?? true;
}

// ==========================================
// Navigation Profil
// ==========================================

function openProfilePage() {
    navigate("profile.html");
}

// ==========================================
// Mot de passe : Visibilité
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

// ==========================================
// Mot de passe : Force & Correspondance
// ==========================================

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
    if (!newPasswordInput || !confirmPasswordInput || !passwordMatch) {
        return false;
    }

    passwordMatch.textContent = "";
    passwordMatch.className = "nv-password-match";

    if (confirmPasswordInput.value === "") {
        return true;
    }

    if (newPasswordInput.value === confirmPasswordInput.value) {
        passwordMatch.textContent = "Les mots de passe correspondent.";
        passwordMatch.classList.add("success");
        return true;
    }

    passwordMatch.textContent = "Les mots de passe ne correspondent pas.";
    passwordMatch.classList.add("error");
    return false;
}

// ==========================================
// Validation du Mot de passe
// ==========================================

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

    const newPassword = newPasswordInput.value;

    if (newPassword.length < 8) {
        showToast("Le nouveau mot de passe doit contenir au moins 8 caractères.", "error");
        newPasswordInput.focus();
        return false;
    }

    if (!/[A-Z]/.test(newPassword)) {
        showToast("Le mot de passe doit contenir au moins une lettre majuscule.", "error");
        newPasswordInput.focus();
        return false;
    }

    if (!/[a-z]/.test(newPassword)) {
        showToast("Le mot de passe doit contenir au moins une lettre minuscule.", "error");
        newPasswordInput.focus();
        return false;
    }

    if (!/[0-9]/.test(newPassword)) {
        showToast("Le mot de passe doit contenir au moins un chiffre.", "error");
        newPasswordInput.focus();
        return false;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
        showToast("Le mot de passe doit contenir au moins un caractère spécial.", "error");
        newPasswordInput.focus();
        return false;
    }

    if (!confirmPasswordInput || confirmPasswordInput.value.trim() === "") {
        showToast("Veuillez confirmer votre nouveau mot de passe.", "error");
        confirmPasswordInput?.focus();
        return false;
    }

    if (newPassword !== confirmPasswordInput.value) {
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

// ==========================================
// Modification du mot de passe
// ==========================================

async function changePassword() {
    if (isSavingPassword) return;

    if (!validatePassword()) {
        return;
    }

    isSavingPassword = true;

    try {
        showLoader();
        buttonLoading(updatePasswordButton, true);

        const newPassword = newPasswordInput.value;
        const { error } = await updatePassword(newPassword);

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
// Gestion des Appareils
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
        button.addEventListener("click", () => {
            disconnectDevice(device.id);
        });
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

        const { error } = await supabase
            .from("devices")
            .delete()
            .eq("id", deviceId);

        if (error) throw error;

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

async function disconnectOtherDevices() {
    try {
        showLoader();

        const currentDevice = currentDevices.find(device => isCurrentDevice(device));

        if (!currentDevice) {
            showToast("Impossible d'identifier l'appareil actuel.", "error");
            return;
        }

        const { error } = await supabase
            .from("devices")
            .delete()
            .neq("id", currentDevice.id)
            .eq("user_id", currentUser.id);

        if (error) throw error;

        showToast("Tous les autres appareils ont été déconnectés.", "success");
        await loadDevicesData();
        renderDevices();
    } catch (error) {
        console.error(error);
        showToast("Impossible de déconnecter les autres appareils.", "error");
    } finally {
        hideLoader();
    }
}

// ==========================================
// Enregistrement des Préférences
// ==========================================

async function savePreferences() {
    if (isSavingPreferences) return;

    isSavingPreferences = true;

    try {
        showLoader();
        buttonLoading(savePreferencesButton, true);

        const updatedSettings = {
            user_id: currentUser.id,
            theme: themeSelect ? themeSelect.value : "dark",
            autoplay: autoplayToggle ? autoplayToggle.checked : true,
            email_notifications: emailNotificationsToggle ? emailNotificationsToggle.checked : true,
            push_notifications: pushNotificationsToggle ? pushNotificationsToggle.checked : true
        };

        // Utilisation d'un upsert pour insérer ou mettre à jour les préférences directement
        const { error } = await supabase
            .from("user_settings")
            .upsert(updatedSettings, { onConflict: "user_id" });

        if (error) throw error;

        currentSettings = {
            ...currentSettings,
            ...updatedSettings
        };

        if (typeof applyTheme === "function") {
            applyTheme(updatedSettings.theme);
        }

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
// Câblage des écouteurs d'événements
// ==========================================

function addEventListeners() {
    if (toggleCurrentPassword) {
        toggleCurrentPassword.addEventListener("click", () => {
            togglePasswordVisibility(currentPasswordInput, toggleCurrentPassword);
        });
    }

    if (toggleNewPassword) {
        toggleNewPassword.addEventListener("click", () => {
            togglePasswordVisibility(newPasswordInput, toggleNewPassword);
        });
    }

    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener("click", () => {
            togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
        });
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

    if (disconnectAllButton) {
        disconnectAllButton.addEventListener("click", disconnectOtherDevices);
    }

    if (savePreferencesButton) {
        savePreferencesButton.addEventListener("click", savePreferences);
    }

    if (editProfileButton) {
        editProfileButton.addEventListener("click", openProfilePage);
    }
}

// ==========================================
// Démarrage
// ==========================================

init();
