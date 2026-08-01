/**
 * ==================================================
 * SETTINGS PAGE LOGIC - NetView
 * ==================================================
 */

// 1. Imports
import { getSession, getUser, updatePassword, signOut } from '../core/auth.js';
import { getProfile, updateProfile, getUserSettings, updateUserSettings, getDevices } from '../core/data.js';
import { showLoader, hideLoader, showToast, buttonLoading } from '../core/ui.js';
import { navigate } from '../core/navigation.js';

// 2. DOM Elements
const DOM = {
    // Compte
    currentEmail: document.getElementById('currentEmail'),
    displayName: document.getElementById('displayName'),
    username: document.getElementById('username'),
    accountType: document.getElementById('accountType'),
    createdAt: document.getElementById('createdAt'),
    editProfileButton: document.querySelector('a[href="profile.html"]'),

    // Sécurité
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    passwordStrengthBar: document.getElementById('passwordStrengthBar'),
    passwordStrengthText: document.getElementById('passwordStrengthText'),
    passwordMatch: document.getElementById('passwordMatch'),
    toggleCurrentPassword: document.getElementById('toggleCurrentPassword'),
    toggleNewPassword: document.getElementById('toggleNewPassword'),
    toggleConfirmPassword: document.getElementById('toggleConfirmPassword'),
    updatePasswordButton: document.getElementById('updatePasswordButton'),
    passwordError: document.getElementById('passwordError'),

    // Appareils
    devicesList: document.getElementById('devicesList'),
    logoutOthersButton: document.getElementById('logoutOthersButton'),
    devicesMessage: document.getElementById('devicesMessage'),

    // Préférences
    theme: document.getElementById('theme'),
    autoplay: document.getElementById('autoplay'),
    emailNotifications: document.getElementById('emailNotifications'),
    pushNotifications: document.getElementById('pushNotifications'),
    savePreferencesButton: document.getElementById('savePreferencesButton'),
    preferencesMessage: document.getElementById('preferencesMessage'),

    // Zone de danger
    deleteAccountButton: document.getElementById('deleteAccountButton'),
    deleteAccountModal: document.getElementById('deleteAccountModal'),
    deleteConfirmation: document.getElementById('deleteConfirmation'),
    confirmDeleteButton: document.getElementById('confirmDeleteButton'),
    cancelDeleteButton: document.getElementById('cancelDeleteButton'),
    deleteAccountMessage: document.getElementById('deleteAccountMessage'),

    // Loader
    pageLoader: document.getElementById('pageLoader')
};

// 3. Variables globales
let currentUser = null;
let currentProfile = null;
let currentSettings = null;
let currentDevices = [];
let isSavingProfile = false;
let isSavingPassword = false;
let isSavingPreferences = false;
let isDeleting = false;

// 4. Initialisation
async function init() {
    try {
        showLoader();
        await loadSession();
        await Promise.all([
            loadProfile(),
            loadSettings(),
            loadDevices()
        ]);
        fillPage();
        addEventListeners();
    } catch (error) {
        console.error("Erreur lors de l'initialisation des paramètres :", error);
        showToast("Impossible de charger les paramètres.", "error");
    } finally {
        hideLoader();
    }
}

// 12. Vérifications automatiques (Session)
async function loadSession() {
    const session = await getSession();
    if (!session) {
        navigate('login.html');
        return;
    }
    currentUser = await getUser();
    if (!currentUser) {
        navigate('login.html');
    }
}

// 5. Compte - Chargement et Remplissage
async function loadProfile() {
    try {
        currentProfile = await getProfile();
    } catch (error) {
        console.error("Erreur profil:", error);
    }
}

function fillProfile() {
    if (!currentUser && !currentProfile) return;

    if (DOM.currentEmail) DOM.currentEmail.textContent = currentUser?.email || '--';
    if (DOM.displayName) DOM.displayName.textContent = currentProfile?.display_name || currentUser?.user_metadata?.display_name || 'Non défini';
    if (DOM.username) DOM.username.textContent = currentProfile?.username ? `@${currentProfile.username}` : '@--';
    if (DOM.accountType) DOM.accountType.textContent = currentProfile?.account_type || 'Utilisateur';
    if (DOM.createdAt) DOM.createdAt.textContent = currentProfile?.created_at ? formatDate(currentProfile.created_at) : '--';
}

function openProfilePage(e) {
    e.preventDefault();
    navigate('profile.html');
}

// 6. Mot de passe
function togglePasswordVisibility(inputField, iconElement) {
    if (!inputField || !iconElement) return;
    if (inputField.type === 'password') {
        inputField.type = 'text';
        iconElement.className = 'fa-regular fa-eye-slash';
    } else {
        inputField.type = 'password';
        iconElement.className = 'fa-regular fa-eye';
    }
}

function updatePasswordStrength() {
    if (!DOM.newPassword || !DOM.passwordStrengthBar || !DOM.passwordStrengthText) return;
    const val = DOM.newPassword.value;
    let strength = 0;

    if (val.length >= 8) strength += 1;
    if (/[A-Z]/.test(val)) strength += 1;
    if (/[0-9]/.test(val)) strength += 1;
    if (/[^A-Za-z0-9]/.test(val)) strength += 1;

    let width = '0%';
    let color = 'transparent';
    let text = 'Choisissez un mot de passe sécurisé.';

    if (val.length > 0) {
        if (strength <= 1) {
            width = '25%';
            color = '#ef4444';
            text = 'Mot de passe faible';
        } else if (strength === 2 || strength === 3) {
            width = '65%';
            color = '#f59e0b';
            text = 'Mot de passe moyen';
        } else {
            width = '100%';
            color = '#10b981';
            text = 'Mot de passe fort';
        }
    }

    DOM.passwordStrengthBar.style.width = width;
    DOM.passwordStrengthBar.style.backgroundColor = color;
    DOM.passwordStrengthText.textContent = text;
    updatePasswordMatch();
}

function updatePasswordMatch() {
    if (!DOM.newPassword || !DOM.confirmPassword || !DOM.passwordMatch) return;
    const newPass = DOM.newPassword.value;
    const confirmPass = DOM.confirmPassword.value;

    if (!confirmPass) {
        DOM.passwordMatch.textContent = '';
        return;
    }

    if (newPass === confirmPass) {
        DOM.passwordMatch.textContent = 'Les mots de passe correspondent.';
        DOM.passwordMatch.style.color = '#10b981';
    } else {
        DOM.passwordMatch.textContent = 'Les mots de passe ne correspondent pas.';
        DOM.passwordMatch.style.color = '#ef4444';
    }
}

function validatePassword() {
    resetErrors();
    const current = DOM.currentPassword?.value;
    const newPass = DOM.newPassword?.value;
    const confirm = DOM.confirmPassword?.value;

    if (!current || !newPass || !confirm) {
        showError("Veuillez remplir tous les champs du mot de passe.", DOM.passwordError);
        return false;
    }
    if (newPass.length < 8) {
        showError("Le nouveau mot de passe doit contenir au moins 8 caractères.", DOM.passwordError);
        return false;
    }
    if (newPass !== confirm) {
        showError("Les nouveaux mots de passe ne correspondent pas.", DOM.passwordError);
        return false;
    }
    return true;
}

async function changePassword() {
    if (isSavingPassword || !validatePassword()) return;

    try {
        isSavingPassword = true;
        buttonLoading(DOM.updatePasswordButton, true);

        await updatePassword(DOM.newPassword.value);
        showSuccess("Mot de passe mis à jour avec succès.", DOM.passwordError);
        showToast("Mot de passe mis à jour avec succès.", "success");

        // Reset form
        DOM.currentPassword.value = '';
        DOM.newPassword.value = '';
        DOM.confirmPassword.value = '';
        updatePasswordStrength();
    } catch (error) {
        showError(error.message || "Erreur lors de la mise à jour du mot de passe.", DOM.passwordError);
    } finally {
        isSavingPassword = false;
        buttonLoading(DOM.updatePasswordButton, false);
    }
}

// 7. Appareils
async function loadDevices() {
    try {
        currentDevices = await getDevices() || [];
    } catch (error) {
        console.error("Erreur chargement appareils:", error);
        currentDevices = [];
    }
}

function renderDevices() {
    if (!DOM.devicesList) return;
    
    // Garder l'appareil actuel statique ou injecter dynamiquement
    let html = `
        <div class="nv-device-card">
            <div class="nv-device-main">
                <div class="nv-device-icon"><i class="fa-solid fa-desktop"></i></div>
                <div class="nv-device-details">
                    <h3>PC Windows <span class="nv-current-device">Appareil actuel</span></h3>
                    <p>Google Chrome • Windows 11</p>
                    <span>Dernière activité : <strong>À l'instant</strong></span>
                </div>
            </div>
            <button class="nv-btn nv-btn-outline nv-device-disconnect" disabled>Actuel</button>
        </div>
    `;

    currentDevices.forEach(device => {
        if (!device.is_current) {
            html += `
                <div class="nv-device-card">
                    <div class="nv-device-main">
                        <div class="nv-device-icon"><i class="fa-solid fa-laptop"></i></div>
                        <div class="nv-device-details">
                            <h3>${device.name || 'Appareil inconnu'}</h3>
                            <p>${device.browser || 'Navigateur'} • ${device.os || 'OS'}</p>
                            <span>Dernière activité : <strong>${formatDate(device.last_activity)}</strong></span>
                        </div>
                    </div>
                    <button class="nv-btn nv-btn-outline nv-device-disconnect" data-device-id="${device.id}">Déconnecter</button>
                </div>
            `;
        }
    });

    DOM.devicesList.innerHTML = html;

    // Réattacher les écouteurs sur les boutons de déconnexion d'appareils dynamiques
    document.querySelectorAll('.nv-device-disconnect[data-device-id]').forEach(btn => {
        btn.addEventListener('click', () => disconnectDevice(btn.dataset.deviceId));
    });
}

async function disconnectDevice(deviceId) {
    try {
        showLoader();
        // Logique de déconnexion unitaire (API Supabase / Backend)
        currentDevices = currentDevices.filter(d => d.id !== deviceId);
        renderDevices();
        showToast("Appareil déconnecté.", "success");
    } catch (error) {
        showToast("Erreur lors de la déconnexion de l'appareil.", "error");
    } finally {
        hideLoader();
    }
}

async function disconnectOtherDevices() {
    try {
        showLoader();
        // Logique de déconnexion de tous les autres appareils
        currentDevices = currentDevices.filter(d => d.is_current);
        renderDevices();
        showToast("Tous les autres appareils ont été déconnectés.", "success");
    } catch (error) {
        showToast("Erreur.", "error");
    } finally {
        hideLoader();
    }
}

// 8. Préférences
async function loadSettings() {
    try {
        currentSettings = await getUserSettings();
    } catch (error) {
        console.error("Erreur préférences:", error);
    }
}

function fillSettings() {
    if (!currentSettings) return;

    if (DOM.theme) DOM.theme.value = currentSettings.theme || 'system';
    if (DOM.autoplay) DOM.autoplay.checked = !!currentSettings.autoplay;
    if (DOM.emailNotifications) DOM.emailNotifications.checked = !!currentSettings.email_notifications;
    if (DOM.pushNotifications) DOM.pushNotifications.checked = !!currentSettings.push_notifications;
}

async function savePreferences() {
    if (isSavingPreferences) return;

    try {
        isSavingPreferences = true;
        buttonLoading(DOM.savePreferencesButton, true);

        const newSettings = {
            theme: DOM.theme?.value,
            autoplay: DOM.autoplay?.checked,
            email_notifications: DOM.emailNotifications?.checked,
            push_notifications: DOM.pushNotifications?.checked
        };

        await updateUserSettings(newSettings);
        currentSettings = newSettings;
        showSuccess("Préférences enregistrées avec succès.", DOM.preferencesMessage);
        showToast("Préférences enregistrées.", "success");
    } catch (error) {
        showError("Erreur lors de l'enregistrement des préférences.", DOM.preferencesMessage);
    } finally {
        isSavingPreferences = false;
        buttonLoading(DOM.savePreferencesButton, false);
    }
}

// 9. Zone de danger
function openDeleteModal() {
    if (DOM.deleteAccountModal) {
        DOM.deleteAccountModal.classList.add('show');
        if (DOM.deleteConfirmation) DOM.deleteConfirmation.value = '';
        if (DOM.confirmDeleteButton) DOM.confirmDeleteButton.disabled = true;
        clearMessages();
    }
}

function closeDeleteModal() {
    if (DOM.deleteAccountModal) {
        DOM.deleteAccountModal.classList.remove('show');
    }
}

function validateDeleteWord() {
    if (!DOM.deleteConfirmation || !DOM.confirmDeleteButton) return;
    const value = DOM.deleteConfirmation.value.trim();
    if (value === 'SUPPRIMER') {
        DOM.confirmDeleteButton.disabled = false;
    } else {
        DOM.confirmDeleteButton.disabled = true;
    }
}

async function deleteAccount() {
    if (isDeleting || DOM.deleteConfirmation?.value.trim() !== 'SUPPRIMER') return;

    try {
        isDeleting = true;
        buttonLoading(DOM.confirmDeleteButton, true);

        // Appel API suppression de compte
        // await deleteUserAccount();
        await signOut();
        showToast("Votre compte a été supprimé.", "success");
        navigate('login.html');
    } catch (error) {
        showError("Erreur lors de la suppression du compte.", DOM.deleteAccountMessage);
        isDeleting = false;
        buttonLoading(DOM.confirmDeleteButton, false);
    }
}

// Remplissage global de la page
function fillPage() {
    fillProfile();
    renderDevices();
    fillSettings();
}

// 10. Utilitaires
function formatDate(dateString) {
    if (!dateString) return '--';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

function clearMessages() {
    if (DOM.passwordError) DOM.passwordError.textContent = '';
    if (DOM.devicesMessage) DOM.devicesMessage.textContent = '';
    if (DOM.preferencesMessage) DOM.preferencesMessage.textContent = '';
    if (DOM.deleteAccountMessage) DOM.deleteAccountMessage.textContent = '';
}

function resetErrors() {
    if (DOM.passwordError) DOM.passwordError.textContent = '';
}

function showError(message, element) {
    if (element) {
        element.textContent = message;
        element.style.color = '#ef4444';
    }
}

function showSuccess(message, element) {
    if (element) {
        element.textContent = message;
        element.style.color = '#10b981';
    }
}

// 11. Événements
function addEventListeners() {
    // Compte
    if (DOM.editProfileButton) {
        DOM.editProfileButton.addEventListener('click', openProfilePage);
    }

    // Sécurité - Mot de passe
    if (DOM.newPassword) {
        DOM.newPassword.addEventListener('input', updatePasswordStrength);
    }
    if (DOM.confirmPassword) {
        DOM.confirmPassword.addEventListener('input', updatePasswordMatch);
    }
    if (DOM.toggleCurrentPassword && DOM.currentPassword) {
        DOM.toggleCurrentPassword.addEventListener('click', () => togglePasswordVisibility(DOM.currentPassword, DOM.toggleCurrentPassword.querySelector('i')));
    }
    if (DOM.toggleNewPassword && DOM.newPassword) {
        DOM.toggleNewPassword.addEventListener('click', () => togglePasswordVisibility(DOM.newPassword, DOM.toggleNewPassword.querySelector('i')));
    }
    if (DOM.toggleConfirmPassword && DOM.confirmPassword) {
        DOM.toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility(DOM.confirmPassword, DOM.toggleConfirmPassword.querySelector('i')));
    }
    if (DOM.updatePasswordButton) {
        DOM.updatePasswordButton.addEventListener('click', changePassword);
    }

    // Préférences
    if (DOM.savePreferencesButton) {
        DOM.savePreferencesButton.addEventListener('click', savePreferences);
    }

    // Appareils
    if (DOM.logoutOthersButton) {
        DOM.logoutOthersButton.addEventListener('click', disconnectOtherDevices);
    }

    // Zone de danger & Modal
    if (DOM.deleteAccountButton) {
        DOM.deleteAccountButton.addEventListener('click', openDeleteModal);
    }
    if (DOM.cancelDeleteButton) {
        DOM.cancelDeleteButton.addEventListener('click', closeDeleteModal);
    }
    if (DOM.deleteAccountModal) {
        const overlay = DOM.deleteAccountModal.querySelector('.nv-modal-overlay');
        if (overlay) overlay.addEventListener('click', closeDeleteModal);
    }
    if (DOM.deleteConfirmation) {
        DOM.deleteConfirmation.addEventListener('input', validateDeleteWord);
    }
    if (DOM.confirmDeleteButton) {
        DOM.confirmDeleteButton.addEventListener('click', deleteAccount);
    }
}

// 13. Nettoyage et Lancement
window.addEventListener('DOMContentLoaded', init);

window.addEventListener('beforeunload', () => {
    closeDeleteModal();
});
