// ==========================================
// NetView
// remove_account.js
// ==========================================

import {
    getSession,
    getUser
} from "../core/auth.js";

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
const deleteConfirmationInput = document.getElementById("deleteConfirmation");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");
const deleteAccountMessage = document.getElementById("deleteAccountMessage");
const notification = document.getElementById("notification");

// ==========================================
// Variables globales
// ==========================================
let currentUser = null;

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
        addEventListeners();
    } catch (error) {
        console.error(error);
        showNotification("Impossible de charger la page de suppression.", true);
        navigate("settings.html");
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

// ==========================================
// Gestion des Événements
// ==========================================
function addEventListeners() {
    if (deleteConfirmationInput) {
        deleteConfirmationInput.addEventListener("input", (e) => {
            const value = e.target.value.trim();
            if (value === "SUPPRIMER") {
                confirmDeleteButton.removeAttribute("disabled");
            } else {
                confirmDeleteButton.setAttribute("disabled", "true");
            }
        });
    }

    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener("click", deleteAccount);
    }
}

// ==========================================
// Suppression Définitive du Compte
// ==========================================
async function deleteAccount() {
    if (!currentUser) return;

    const confirmationText = deleteConfirmationInput ? deleteConfirmationInput.value.trim() : "";
    if (confirmationText !== "SUPPRIMER") {
        showNotification("Veuillez saisir exactement le mot SUPPRIMER.", true);
        return;
    }

    if (!confirm("Êtes-vous absolument sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.")) {
        return;
    }

    try {
        showLoader();
        buttonLoading(confirmDeleteButton, true);
        if (deleteAccountMessage) {
            deleteAccountMessage.textContent = "Suppression du profil et des données en cours...";
            deleteAccountMessage.style.color = "var(--nv-text-muted, #94A3B8)";
        }

        // 1. Supprimer l'entrée dans la table 'profiles' (les cascades s'occuperont du reste en base de données si configuré)
        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", currentUser.id);

        if (profileError) {
            console.error("Profile deletion error:", profileError);
            // On continue quand même pour essayer de déconnecter l'utilisateur
        }

        // 2. Déconnecter la session Supabase Auth
        const { error: authError } = await supabase.auth.signOut();
        if (authError) {
            console.error("Auth sign out error:", authError);
        }

        showNotification("Votre compte a été supprimé avec succès.", false);

        // 3. Redirection vers l'accueil ou la page de connexion après un court délai
        setTimeout(() => {
            navigate("login.html");
        }, 1500);

    } catch (error) {
        console.error("Delete account error:", error);
        showNotification(error.message || "Impossible de supprimer le compte.", true);
        hideLoader();
        buttonLoading(confirmDeleteButton, false);
        if (deleteAccountMessage) {
            deleteAccountMessage.textContent = "Une erreur est survenue lors de la suppression.";
            deleteAccountMessage.style.color = "#ef4444";
        }
    }
}

// ==========================================
// Lancement
// ==========================================
init();
