import { supabase } from '../core/supabase.js';

// Éléments du DOM
const globalLoader = document.getElementById('globalLoader');
const notification = document.getElementById('notification');
const quickAvatarImg = document.getElementById('quickAvatarImg');

const passwordForm = document.getElementById('passwordForm');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
const passwordMessage = document.getElementById('passwordMessage');
const updatePasswordButton = document.getElementById('updatePasswordButton');
const updatePasswordText = document.getElementById('updatePasswordText');
const updatePasswordLoader = document.getElementById('updatePasswordLoader');

const notifToggle = document.getElementById('notifToggle');
const autoplayToggle = document.getElementById('autoplayToggle');
const deleteAccountButton = document.getElementById('deleteAccountButton');

// Afficher une notification toast
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    setTimeout(() => {
        notification.className = 'notification';
    }, 4000);
}

// Masquer le loader global
function hideLoader() {
    if (globalLoader) {
        globalLoader.style.opacity = '0';
        setTimeout(() => globalLoader.style.display = 'none', 300);
    }
}

// Charger les informations utilisateur (notamment l'avatar pour le bouton rapide)
async function loadUserSettings() {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            window.location.href = 'index.html'; // Rediriger si non connecté
            return;
        }

        // Récupérer le profil pour l'avatar
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('avatar_url, preferences')
            .eq('id', user.id)
            .single();

        if (profile) {
            if (profile.avatar_url) {
                quickAvatarImg.src = profile.avatar_url;
            }
            // Charger les préférences si enregistrées
            if (profile.preferences) {
                if (typeof profile.preferences.push_notifications !== 'undefined') {
                    notifToggle.checked = profile.preferences.push_notifications;
                }
                if (typeof profile.preferences.autoplay !== 'undefined') {
                    autoplayToggle.checked = profile.preferences.autoplay;
                }
            }
        }
    } catch (err) {
        console.error('Erreur chargement paramètres:', err);
    } finally {
        hideLoader();
    }
}

// Mise à jour du mot de passe
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    passwordMessage.textContent = '';

    const currentPwd = currentPasswordInput.value;
    const newPwd = newPasswordInput.value;
    const confirmPwd = confirmNewPasswordInput.value;

    if (newPwd !== confirmPwd) {
        passwordMessage.textContent = "Les nouveaux mots de passe ne correspondent pas.";
        passwordMessage.style.color = "var(--nv-error, #EF4444)";
        return;
    }

    if (newPwd.length < 6) {
        passwordMessage.textContent = "Le mot de passe doit contenir au moins 6 caractères.";
        passwordMessage.style.color = "var(--nv-error, #EF4444)";
        return;
    }

    updatePasswordButton.disabled = true;
    updatePasswordText.hidden = true;
    updatePasswordLoader.hidden = false;

    try {
        // Supabase update password (nécessite d'être authentifié)
        const { error } = await supabase.auth.updateUser({
            password: newPwd
        });

        if (error) throw error;

        showNotification("Mot de passe mis à jour avec succès !");
        passwordForm.reset();
    } catch (error) {
        console.error('Erreur MAJ mot de passe:', error);
        passwordMessage.textContent = error.message || "Erreur lors de la mise à jour du mot de passe.";
        passwordMessage.style.color = "var(--nv-error, #EF4444)";
    } finally {
        updatePasswordButton.disabled = false;
        updatePasswordText.hidden = false;
        updatePasswordLoader.hidden = true;
    }
});

// Sauvegarde automatique des préférences aux changements des toggles
async function savePreferences() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const preferences = {
            push_notifications: notifToggle.checked,
            autoplay: autoplayToggle.checked
        };

        await supabase
            .from('profiles')
            .update({ preferences })
            .eq('id', user.id);

        showNotification("Préférences enregistrées");
    } catch (err) {
        console.error("Erreur sauvegarde préférences:", err);
    }
}

notifToggle.addEventListener('change', savePreferences);
autoplayToggle.addEventListener('change', savePreferences);

// Gestion de la suppression du compte
deleteAccountButton.addEventListener('click', async () => {
    const confirmation = confirm("Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible.");
    if (!confirmation) return;

    try {
        globalLoader.style.display = 'flex';
        globalLoader.style.opacity = '1';

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Suppression de la table profiles (la suppression de auth.users s'effectue généralement via une Edge Function ou trigger côté Supabase)
        await supabase.from('profiles').delete().eq('id', user.id);
        
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        showNotification("Impossible de supprimer le compte pour le moment.", "error");
        hideLoader();
    }
});

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', loadUserSettings);
