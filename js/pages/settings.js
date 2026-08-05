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
    getUserSettings,
    updateUserSettings
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

// ==========================================
// DOM Elements
// ==========================================

// Compte (Nom affiché, Nom d'utilisateur et Type de compte retirés)
const currentEmail = document.getElementById("currentEmail");
const createdAt = document.getElementById("createdAt");
const editProfileButton = document.getElementById("editProfileButton");
const notification = document.getElementById("notification");

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

// Appareils connectés / Redirection vers devices_list.html
const viewDevicesButton = document.getElementById("viewDevicesButton");

// Préférences
const themeSelect = document.getElementById("theme");
const autoplayToggle = document.getElementById("autoplay");
const emailNotificationsToggle = document.getElementById("emailNotifications");
const pushNotificationsToggle = document.getElementById("pushNotifications");
const savePreferencesButton = document.getElementById("savePreferencesButton");

// Zone de danger / Redirection vers remove_account.html
const removeAccountButton = document.getElementById("removeAccountButton");

// ==========================================
// Variables globales
// ==========================================
let currentUser = null;
let currentProfile = null;
let currentSettings = null;

let isSavingPassword = false;
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
        await Promise.all([
            loadProfileData(),
            loadSettingsData()
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
    currentUser = await getUser();
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

    if (themeSelect) themeSelect.value = currentSettings?.theme ?? "dark";
    if (autoplayToggle) autoplayToggle.checked = currentSettings?.autoplay ?? true;
    if (emailNotificationsToggle) emailNotificationsToggle.checked = currentSettings?.email_notifications ?? true;
    if (pushNotificationsToggle) pushNotificationsToggle.checked = currentSettings?.push_notifications ?? true;
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
        showNotification("Veuillez saisir votre mot de passe actuel.", true);
        currentPasswordInput?.focus();
        return false;
    }
    if (!newPasswordInput || newPasswordInput.value.trim() === "") {
        showNotification("Veuillez saisir un nouveau mot de passe.", true);
        newPasswordInput?.focus();
        return false;
    }
    const newPass = newPasswordInput.value;
    if (newPass.length < 8) {
        showNotification("Le nouveau mot de passe doit contenir au moins 8 caractères.", true);
        newPasswordInput.focus();
        return false;
    }
    if (!/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/[0-9]/.test(newPass) || !/[^A-Za-z0-9]/.test(newPass)) {
        showNotification("Le mot de passe doit contenir majuscules, minuscules, chiffres et caractères spéciaux.", true);
        newPasswordInput.focus();
        return false;
    }
    if (newPass !== confirmPasswordInput?.value) {
        showNotification("Les mots de passe ne correspondent pas.", true);
        confirmPasswordInput?.focus();
        return false;
    }
    if (currentPasswordInput.value === newPass) {
        showNotification("Le nouveau mot de passe doit être différent de l'ancien.", true);
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

        showNotification("Votre mot de passe a été mis à jour avec succès.", false);
    } catch (error) {
        console.error("Password update error:", error);
        showNotification(error.message || "Impossible de modifier le mot de passe.", true);
    } finally {
        hideLoader();
        buttonLoading(updatePasswordButton, false);
        isSavingPassword = false;
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
