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

import { initDeviceRevocationListener } from "./data.js";

// Lancer l'écouteur de déconnexion à distance dès que l'app se charge
initDeviceRevocationListener();

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
// Cache pour éviter de refaire des requêtes pour la même IP
const locationCache = {};

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
// Géolocalisation par IP
// ==========================================
async function getLocationFromIP(ip) {
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
        return "Réseau local";
    }

    if (locationCache[ip]) {
        return locationCache[ip];
    }

    try {
        // Utilisation de l'API gratuite ipapi.co
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        if (!response.ok) throw new Error("Erreur réseau géolocalisation");
        
        const data = await response.json();
        if (data.error) {
            return "Emplacement inconnu";
        }

        const city = data.city || "";
        const country = data.country_name || "";
        
        let location = [city, country].filter(Boolean).join(", ");
        if (!location) location = "Emplacement inconnu";

        locationCache[ip] = location;
        return location;
    } catch (error) {
        console.error("Geoloc error for IP:", ip, error);
        return "Emplacement inconnu";
    }
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

    for (const device of devices) {
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

        // Traduction de l'IP en emplacement (asynchrone)
        const locationText = await getLocationFromIP(device.ip_address);

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                <i class="fa-solid fa-laptop" style="font-size: 1.5rem; color: var(--nv-primary, #2563EB); flex-shrink: 0;"></i>
                <div style="overflow: hidden;">
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${device.device_name || "Appareil NetView"}</h3>
                    <p style="font-size: 0.85rem; color: var(--nv-text-muted, #94A3B8); margin: 0;">
                        ${device.browser || "Navigateur inconnu"} • ${device.operating_system || "OS inconnu"}
                    </p>
                    <p style="font-size: 0.8rem; color: var(--nv-primary, #2563EB); margin-top: 0.2rem; display: flex; align-items: center; gap: 0.3rem;">
                        <i class="fa-solid fa-location-dot" style="font-size: 0.75rem;"></i>
                        <span>${locationText}</span> ${device.ip_address ? `(${device.ip_address})` : ""}
                    </p>
                    <p style="font-size: 0.75rem; color: var(--nv-text-muted, #94A3B8); margin-top: 0.1rem;">
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
    }

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
