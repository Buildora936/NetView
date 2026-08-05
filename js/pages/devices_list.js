// ==========================================
// NetView
// devices_list.js
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
const devicesContainer = document.getElementById("devicesContainer");
const devicesMessage = document.getElementById("devicesMessage");
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
        await loadDevices();
    } catch (error) {
        console.error(error);
        showNotification("Impossible de charger les appareils connectés.", true);
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
// Chargement et Affichage des Appareils
// ==========================================
async function loadDevices() {
    if (!currentUser || !devicesContainer) return;

    devicesContainer.innerHTML = "";

    const { data: devices, error } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("last_seen", { ascending: false });

    if (error) {
        console.error("Load devices error:", error);
        showNotification("Erreur lors de la récupération des appareils.", true);
        return;
    }

    if (!devices || devices.length === 0) {
        devicesContainer.innerHTML = `
            <div class="nv-settings-item" style="text-align: center; padding: 2rem; color: var(--nv-text-muted, #94A3B8);">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                <p>Aucun appareil enregistré pour le moment.</p>
            </div>
        `;
        return;
    }

    devices.forEach(device => {
        const item = document.createElement("div");
        item.className = "nv-settings-item";
        item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.03); border-radius: 8px; margin-bottom: 0.75rem; gap: 1rem;";

        const lastSeenDate = device.last_seen 
            ? new Date(device.last_seen).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
            : "Inconnue";

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                <i class="fa-solid fa-laptop" style="font-size: 1.5rem; color: var(--nv-primary, #2563EB); flex-shrink: 0;"></i>
                <div style="overflow: hidden;">
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${device.device_name || "Appareil NetView"}</h3>
                    <p style="font-size: 0.85rem; color: var(--nv-text-muted, #94A3B8); margin: 0;">
                        ${device.browser || "Navigateur inconnu"} • ${device.operating_system || "OS inconnu"}
                    </p>
                    <p style="font-size: 0.75rem; color: var(--nv-text-muted, #94A3B8); margin-top: 0.2rem;">
                        Dernière activité : ${lastSeenDate}
                    </p>
                </div>
            </div>
            <button type="button" class="nv-btn nv-btn-danger revoke-device-btn" data-id="${device.id}" style="padding: 0.5rem 0.75rem; font-size: 0.85rem; flex-shrink: 0;">
                <i class="fa-solid fa-trash-can"></i>
                <span class="revoke-text">Supprimer</span>
            </button>
        `;

        devicesContainer.appendChild(item);
    });

    // Attacher les écouteurs sur les boutons de suppression
    document.querySelectorAll(".revoke-device-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const deviceId = e.currentTarget.getAttribute("data-id");
            await removeDevice(deviceId, e.currentTarget);
        });
    });
}

// ==========================================
// Suppression d'un appareil
// ==========================================
async function removeDevice(deviceId, buttonElement) {
    if (!confirm("Voulez-vous vraiment supprimer cet appareil de vos sessions actives ?")) return;

    try {
        buttonLoading(buttonElement, true);

        const { error } = await supabase
            .from("devices")
            .delete()
            .eq("id", deviceId)
            .eq("user_id", currentUser.id);

        if (error) throw error;

        showNotification("Appareil supprimé avec succès.", false);
        await loadDevices();
    } catch (error) {
        console.error("Delete device error:", error);
        showNotification("Impossible de supprimer cet appareil.", true);
        buttonLoading(buttonElement, false);
    }
}

// ==========================================
// Lancement
// ==========================================
init();
