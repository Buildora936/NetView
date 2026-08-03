// ==========================================
// NetView
// settings.js
// ==========================================

import { supabase } from "../supabase.js";
import { select, update, remove } from "../data.js";

document.addEventListener("DOMContentLoaded", async () => {
    const pageLoader = document.getElementById("pageLoader");

    try {
        // 1. Vérification de l'authentification et récupération de l'utilisateur
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            window.location.href = "login.html";
            return;
        }

        // 2. Chargement des données du profil
        await loadUserProfile(user);

        // 3. Chargement des préférences utilisateur
        await loadUserPreferences(user);

        // 4. Chargement des appareils connectés
        await loadConnectedDevices(user);

        // 5. Initialisation des écouteurs d'événements
        initPasswordValidation();
        initPasswordToggles();
        initPreferencesListeners(user);
        initDeleteAccountModal(user);

    } catch (err) {
        console.error("Erreur lors de l'initialisation des paramètres :", err);
    } finally {
        // Masquer le loader
        if (pageLoader) {
            pageLoader.style.opacity = "0";
            setTimeout(() => pageLoader.style.display = "none", 300);
        }
    }
});

// ==========================================
// Chargement du profil
// ==========================================
async function loadUserProfile(user) {
    try {
        const { data: profile, error } = await select("profiles", "*", [
            { method: "eq", column: "id", value: user.id }
        ]);

        if (error) throw error;

        const userData = profile && profile.length > 0 ? profile[0] : {};

        document.getElementById("currentEmail").textContent = user.email || "Non renseigné";
        document.getElementById("displayName").textContent = userData.display_name || userData.username || "Utilisateur NetView";
        document.getElementById("username").textContent = `@${userData.username || "username"}`;
        document.getElementById("accountType").textContent = userData.account_type || "Standard";
        
        if (userData.created_at) {
            const date = new Date(userData.created_at);
            document.getElementById("createdAt").textContent = date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            document.getElementById("createdAt").textContent = "Récemment";
        }
    } catch (err) {
        console.error("Erreur chargement profil:", err);
    }
}

// ==========================================
// Chargement et gestion des Préférences
// ==========================================
async function loadUserPreferences(user) {
    try {
        const { data: prefs, error } = await select("user_preferences", "*", [
            { method: "eq", column: "user_id", value: user.id }
        ]);

        if (!error && prefs && prefs.length > 0) {
            const p = prefs[0];
            if (document.getElementById("theme")) document.getElementById("theme").value = p.theme || "dark";
            if (document.getElementById("autoplay")) document.getElementById("autoplay").checked = !!p.autoplay;
            if (document.getElementById("emailNotifications")) document.getElementById("emailNotifications").checked = !!p.email_notifications;
            if (document.getElementById("pushNotifications")) document.getElementById("pushNotifications").checked = !!p.push_notifications;
        }
    } catch (err) {
        console.error("Erreur chargement préférences:", err);
    }
}

function initPreferencesListeners(user) {
    const saveButton = document.getElementById("savePreferencesButton");
    if (!saveButton) return;

    saveButton.addEventListener("click", async () => {
        const theme = document.getElementById("theme")?.value || "dark";
        const autoplay = document.getElementById("autoplay")?.checked || false;
        const emailNotifications = document.getElementById("emailNotifications")?.checked || false;
        const pushNotifications = document.getElementById("pushNotifications")?.checked || false;

        saveButton.disabled = true;
        saveButton.textContent = "Enregistrement...";

        try {
            const { error } = await update("user_preferences", {
                theme,
                autoplay,
                email_notifications: emailNotifications,
                push_notifications: pushNotifications,
                updated_at: new Date()
            }, [
                { method: "eq", column: "user_id", value: user.id }
            ]);

            if (error) throw error;
            showNotification("Préférences enregistrées avec succès !", "success");
        } catch (err) {
            console.error("Erreur sauvegarde préférences:", err);
            showNotification("Erreur lors de l'enregistrement.", "error");
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Enregistrer les préférences";
        }
    });
}

// ==========================================
// Gestion des Appareils Connectés
// ==========================================
async function loadConnectedDevices(user) {
    const devicesContainer = document.getElementById("devicesList");
    const logoutOthersBtn = document.getElementById("logoutOthersButton");
    if (!devicesContainer) return;

    try {
        const { data: devices, error } = await select("devices", "*", [
            { method: "eq", column: "user_id", value: user.id }
        ]);

        if (error) throw error;

        if (!devices || devices.length === 0) {
            devicesContainer.innerHTML = `<p class="nv-settings-label">Aucun autre appareil connecté.</p>`;
            return;
        }

        devicesContainer.innerHTML = devices.map(device => `
            <div class="nv-device-card" data-id="${device.id}">
                <div class="nv-device-main">
                    <div class="nv-device-icon">
                        <i class="fa-solid ${getDeviceIcon(device.device_type)}"></i>
                    </div>
                    <div class="nv-device-details">
                        <h3>
                            ${device.device_name || 'Appareil inconnu'}
                            ${device.is_current ? '<span class="nv-current-device">Actuel</span>' : ''}
                        </h3>
                        <p>${device.location || 'Localisation inconnue'} • <span>${formatDate(device.last_active)}</span></p>
                    </div>
                </div>
                ${!device.is_current ? `<button class="nv-btn nv-btn-outline revoke-device-btn" data-id="${device.id}">Révoquer</button>` : ''}
            </div>
        `).join("");

        // Écouteurs pour révoquer un appareil individuel
        document.querySelectorAll(".revoke-device-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const deviceId = e.target.getAttribute("data-id");
                await removeDevice(deviceId, user.id);
            });
        });

        // Bouton pour déconnecter les autres appareils
        if (logoutOthersBtn) {
            logoutOthersBtn.addEventListener("click", async () => {
                try {
                    // Supprime tous les appareils sauf l'actuel
                    await remove("devices", [
                        { method: "eq", column: "user_id", value: user.id },
                        { method: "eq", column: "is_current", value: false }
                    ]);
                    showNotification("Tous les autres appareils ont été déconnectés.", "success");
                    await loadConnectedDevices(user);
                } catch (err) {
                    console.error("Erreur déconnexion autres appareils:", err);
                    showNotification("Erreur lors de la déconnexion.", "error");
                }
            });
        }

    } catch (err) {
        console.error("Erreur chargement appareils:", err);
    }
}

async function removeDevice(deviceId, userId) {
    try {
        const { error } = await remove("devices", [
            { method: "eq", column: "id", value: deviceId },
            { method: "eq", column: "user_id", value: userId }
        ]);

        if (error) throw error;
        showNotification("Appareil révoqué avec succès.", "success");
        
        // Recharger la liste
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await loadConnectedDevices(user);
    } catch (err) {
        console.error("Erreur révocation appareil:", err);
        showNotification("Impossible de révoquer cet appareil.", "error");
    }
}

// ==========================================
// Sécurité & Mot de passe
// ==========================================
function initPasswordValidation() {
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const strengthBar = document.getElementById("passwordStrengthBar");
    const strengthText = document.getElementById("passwordStrengthText");
    const matchText = document.getElementById("passwordMatch");

    if (!newPasswordInput) return;

    newPasswordInput.addEventListener("input", () => {
        const val = newPasswordInput.value;
        let strength = 0;

        if (val.length >= 8) strength += 25;
        if (/[A-Z]/.test(val)) strength += 25;
        if (/[0-9]/.test(val)) strength += 25;
        if (/[^A-Za-z0-9]/.test(val)) strength += 25;

        if (strengthBar) strengthBar.style.width = `${strength}%`;
        
        if (strength <= 25) {
            if (strengthBar) strengthBar.style.backgroundColor = "#ef4444";
            if (strengthText) strengthText.textContent = "Faible";
        } else if (strength <= 75) {
            if (strengthBar) strengthBar.style.backgroundColor = "#f59e0b";
            if (strengthText) strengthText.textContent = "Moyen";
        } else {
            if (strengthBar) strengthBar.style.backgroundColor = "#10b981";
            if (strengthText) strengthText.textContent = "Fort";
        }
    });

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener("input", () => {
            if (confirmPasswordInput.value === newPasswordInput.value) {
                matchText.textContent = "Les mots de passe correspondent.";
                matchText.style.color = "#10b981";
            } else {
                matchText.textContent = "Les mots de passe ne correspondent pas.";
                matchText.style.color = "#ef4444";
            }
        });
    }
}

function initPasswordToggles() {
    document.querySelectorAll(".nv-password-toggle").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetId = btn.getAttribute("data-target") || btn.previousElementSibling?.id;
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else {
                input.type = "password";
                btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    });
}

// ==========================================
// Suppression de compte (Zone de danger)
// ==========================================
function initDeleteAccountModal(user) {
    const deleteBtn = document.getElementById("deleteAccountButton");
    const modal = document.getElementById("deleteAccountModal");
    const cancelBtn = document.getElementById("cancelDeleteButton");
    const confirmInput = document.getElementById("deleteConfirmation");
    const confirmBtn = document.getElementById("confirmDeleteButton");

    if (!deleteBtn || !modal) return;

    deleteBtn.addEventListener("click", () => {
        modal.classList.add("show");
    });

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            modal.classList.remove("show");
            if (confirmInput) confirmInput.value = "";
        });
    }

    if (confirmInput && confirmBtn) {
        confirmInput.addEventListener("input", () => {
            confirmBtn.disabled = confirmInput.value.trim() !== "SUPPRIMER";
        });

        confirmBtn.addEventListener("click", async () => {
            try {
                confirmBtn.disabled = true;
                confirmBtn.textContent = "Suppression...";

                // Suppression logique ou appel RPC/Edge function pour supprimer l'utilisateur Supabase
                const { error } = await remove("profiles", [
                    { method: "eq", column: "id", value: user.id }
                ]);

                if (error) throw error;

                await supabase.auth.signOut();
                window.location.href = "login.html";
            } catch (err) {
                console.error("Erreur lors de la suppression du compte :", err);
                showNotification("Erreur lors de la suppression du compte.", "error");
                confirmBtn.disabled = false;
                confirmBtn.textContent = "Supprimer définitivement";
            }
        });
    }
}

// ==========================================
// Fonctions utilitaires
// ==========================================
function getDeviceIcon(type) {
    switch ((type || "").toLowerCase()) {
        case "mobile": return "fa-mobile-screen-button";
        case "tablet": return "fa-tablet-screen-button";
        default: return "fa-desktop";
    }
}

function formatDate(dateString) {
    if (!dateString) return "Récemment";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function showNotification(message, type = "success") {
    // Système de notification simple (ajustable selon vos composants globaux)
    const notif = document.createElement("div");
    notif.className = `nv-notification nv-notification-${type}`;
    notif.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 10000;
        padding: 12px 20px; border-radius: 12px; font-size: 0.9rem;
        background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
        color: #fff; backdrop-filter: blur(8px); box-path: 0 10px 25px rgba(0,0,0,0.3);
        animation: fadeUp 0.3s ease;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = "0";
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}
