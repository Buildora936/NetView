// ==========================================
// NetView
// change-password.js
// ==========================================

import { supabase } from "../core/supabase.js";
import { initDeviceRevocationListener } from "../core/data.js";

// Lancer l'écouteur de déconnexion à distance dès que l'app se charge
initDeviceRevocationListener();

const changeForm = document.getElementById("changeForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const changeError = document.getElementById("changeError");
const submitButton = document.getElementById("submitButton");
const submitText = document.getElementById("submitText");
const submitLoader = document.getElementById("submitLoader");
const globalLoader = document.getElementById("globalLoader");
const notification = document.getElementById("notification");
const togglePassword = document.getElementById("togglePassword");

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.style.borderColor = isError ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
    notification.style.color = isError ? "#ef4444" : "#22c55e";
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 4000);
}

// Gestion de l'affichage du mot de passe
if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        const isVisible = passwordInput.type === "text";
        passwordInput.type = isVisible ? "password" : "text";
        togglePassword.innerHTML = isVisible ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });
}

changeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    changeError.textContent = "";
    changeError.classList.remove("show");

    const passwordVal = passwordInput.value;
    const confirmVal = confirmPasswordInput.value;

    if (passwordVal.length < 6) {
        changeError.textContent = "Le mot de passe doit contenir au moins 6 caractères.";
        changeError.classList.add("show");
        passwordInput.focus();
        return;
    }

    if (passwordVal !== confirmVal) {
        changeError.textContent = "Les mots de passe ne correspondent pas.";
        changeError.classList.add("show");
        confirmPasswordInput.focus();
        return;
    }

    submitButton.disabled = true;
    submitText.hidden = true;
    submitLoader.hidden = false;
    globalLoader.classList.add("show");

    try {
        const { error } = await supabase.auth.updateUser({
            password: passwordVal
        });

        if (error) throw error;

        showNotification("Mot de passe mis à jour avec succès !");
        
        setTimeout(() => {
            window.location.replace("login.html");
        }, 2000);

    } catch (error) {
        console.error(error);
        changeError.textContent = error.message || "Erreur lors de la mise à jour du mot de passe.";
        changeError.classList.add("show");
        submitButton.disabled = false;
        submitText.hidden = false;
        submitLoader.hidden = true;
        globalLoader.classList.remove("show");
    }
});
