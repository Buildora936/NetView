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
import { initDeviceRevocationListener } from "../core/data.js";

// Lancer l'écouteur de déconnexion à distance dès que l'app se charge
initDeviceRevocationListener();

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
            deleteAccountMessage.textContent = "Suppression du compte en cours...";
            deleteAccountMessage.style.color = "var(--nv-text-muted, #94A3B8)";
        }

        // Appel de la fonction RPC sécurisée Supabase
        const { error: rpcError } = await supabase.rpc("delete_user_account");

        if (rpcError) throw rpcError;

        // Déconnexion locale de la session par sécurité
        await supabase.auth.signOut();

        showNotification("Votre compte a été supprimé avec succès.", false);

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
