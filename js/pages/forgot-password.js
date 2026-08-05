// ==========================================
// NetView
// forgot-password.js
// ==========================================

import { supabase } from "../core/supabase.js";

import { initDeviceRevocationListener } from "../core/data.js";

// Lancer l'écouteur de déconnexion à distance dès que l'app se charge
initDeviceRevocationListener();

const forgotForm = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const forgotError = document.getElementById("forgotError");
const submitButton = document.getElementById("submitButton");
const submitText = document.getElementById("submitText");
const submitLoader = document.getElementById("submitLoader");
const globalLoader = document.getElementById("globalLoader");
const notification = document.getElementById("notification");

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.style.borderColor = isError ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
    notification.style.color = isError ? "#ef4444" : "#22c55e";
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 4000);
}

function showPageLoader(show) {
    if (show) {
        globalLoader.classList.add("show");
    } else {
        globalLoader.classList.remove("show");
    }
}

forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    forgotError.textContent = "";
    forgotError.classList.remove("show");

    const emailVal = emailInput.value.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
        forgotError.textContent = "Veuillez entrer une adresse e-mail valide.";
        forgotError.classList.add("show");
        emailInput.focus();
        return;
    }

    submitButton.disabled = true;
    submitText.hidden = true;
    submitLoader.hidden = false;

    try {
        // Redirige vers change-password.html avec le jeton de récupération Supabase
        const redirectTo = `${window.location.origin}/change-password.html`;

        const { error } = await supabase.auth.resetPasswordForEmail(emailVal, {
            redirectTo: redirectTo,
        });

        if (error) throw error;

        showNotification("E-mail de réinitialisation envoyé avec succès !");
        emailInput.value = "";

    } catch (error) {
        console.error(error);
        forgotError.textContent = error.message || "Erreur lors de l'envoi de l'e-mail.";
        forgotError.classList.add("show");
    } finally {
        submitButton.disabled = false;
        submitText.hidden = false;
        submitLoader.hidden = true;
    }
});
