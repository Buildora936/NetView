// ==========================================
// NetView
// trending.js
// ==========================================

// ==========================================
// Imports
// ==========================================

import {
    getSession,
    getUser,
    signOut
} from "../core/auth.js";

import {
    getProfile,
    getTrendingVideos // Fonction dédiée aux tendances dans data.js
} from "../core/data.js";

import {
    showLoader,
    hideLoader
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";


// ==========================================
// Sélection des Éléments DOM
// ==========================================

const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const sidebarNav = sidebar?.querySelector(".nv-sidebar-nav");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const headerRight = document.getElementById("headerRight");
const trendingGrid = document.getElementById("trendingGrid");

// Filtres de tendances (ex: Aujourd'hui, Cette semaine, Musique, Gaming...)
const trendingFiltersContainer = document.querySelector(".nv-trending-filters");


// ==========================================
// Variables Globales
// ==========================================

let currentUser = null;
let currentProfile = null;
let trendingVideos = [];
let sidebarOpen = false;
let currentFilter = "now"; // Filtre par défaut (ex: "now", "music", "gaming")
let isLoading = false;


// ==========================================
// Initialisation
// ==========================================

document.addEventListener("DOMContentLoaded", init);

async function init() {
    try {
        showLoader();
        await checkSession();
        await loadProfile();
        updateHeader();
        updateSidebar();
        await loadTrendingContent();
        addEventListeners();
    } catch (error) {
        console.error("Erreur lors de l'initialisation des tendances :", error);
    } finally {
        hideLoader();
    }
}


// ==========================================
// Gestion de Session & Profil
// ==========================================

async function checkSession() {
    try {
        const session = await getSession();
        if (!session) {
            currentUser = null;
            return;
        }
        currentUser = await getUser();
    } catch (error) {
        console.error(error);
        currentUser = null;
    }
}

async function loadProfile() {
    if (!currentUser) {
        currentProfile = null;
        return;
    }
    try {
        currentProfile = await getProfile(currentUser.id);
    } catch (error) {
        console.error(error);
        currentProfile = null;
    }
}


// ==========================================
// Chargement des Tendances
// ==========================================

async function loadTrendingContent() {
    try {
        isLoading = true;
        showLoader();

        // Appel API adapté pour récupérer les tendances selon le filtre
        const data = await getTrendingVideos({ filter: currentFilter });

        trendingVideos = Array.isArray(data) ? data : [];
        renderTrendingVideos();

    } catch (error) {
        console.error("Erreur chargement tendances:", error);
        trendingVideos = [];
    } finally {
        isLoading = false;
        hideLoader();
    }
}


// ==========================================
// Rendu des Vidéos Tendances
// ==========================================

function renderTrendingVideos() {
    if (!trendingGrid) return;

    trendingGrid.innerHTML = "";

    if (!trendingVideos.length) {
        trendingGrid.innerHTML = `<p class="nv-empty-state">Aucune vidéo tendance pour le moment.</p>`;
        return;
    }

    trendingVideos.forEach((video, index) => {
        const card = createTrendingVideoCard(video, index + 1);
        trendingGrid.appendChild(card);
    });
}

// Carte spécifique avec position/classement (1, 2, 3...) si besoin
function createTrendingVideoCard(video, rank) {
    const article = document.createElement("article");
    article.className = "nv-video-card nv-trending-card";
    article.dataset.id = video.id || "";
    
    article.innerHTML = `
        <div class="nv-trending-rank">${rank}</div>
        <div class="nv-video-thumbnail">
            <img src="${video.thumbnailUrl || video.thumbnail_url || 'default-thumb.jpg'}" alt="${video.title || ''}" loading="lazy">
            <span class="nv-video-duration">${video.duration || '0:00'}</span>
        </div>
        <div class="nv-video-content">
            <div class="nv-video-avatar">
                <img src="${video.channelAvatar || video.avatar_url || 'default-avatar.jpg'}" alt="${video.channelName || ''}" loading="lazy">
            </div>
            <div class="nv-video-info">
                <h3 class="nv-video-title">${video.title || ''}</h3>
                <a href="#" class="nv-video-channel">${video.channelName || video.channel_name || ''}</a>
                <div class="nv-video-meta">
                    <span>${formatViews(video.views || 0)} vues</span>
                    <span>•</span>
                    <span>${video.timeAgo || video.created_at || 'Il y a un moment'}</span>
                </div>
            </div>
        </div>
    `;
    return article;
}


// ==========================================
// Gestion des Événements
// ==========================================

function addEventListeners() {
    // Menu Sidebar
    menuButton?.addEventListener("click", toggleSidebar);
    sidebarOverlay?.addEventListener("click", closeSidebar);

    // Changement de filtre de tendances
    trendingFiltersContainer?.addEventListener("click", async (event) => {
        const button = event.target.closest(".nv-filter-btn");
        if (!button) return;

        currentFilter = button.dataset.filter;

        // Mise à jour visuelle des boutons de filtre
        trendingFiltersContainer.querySelectorAll(".nv-filter-btn").forEach(btn => {
            btn.classList.toggle("active", btn === button);
        });

        await loadTrendingContent();
    });

    // Déconnexion (Sidebar)
    sidebarNav?.addEventListener("click", async (event) => {
        const logout = event.target.closest("#logoutButton");
        if (!logout) return;
        event.preventDefault();
        await signOut();
        navigate("auth.html");
    });
}


// ==========================================
// Sidebar Toggles
// ==========================================

function toggleSidebar() {
    sidebarOpen ? closeSidebar() : openSidebar();
}

function openSidebar() {
    sidebarOpen = true;
    sidebar.classList.add("active");
    sidebarOverlay?.classList.add("active");
}

function closeSidebar() {
    sidebarOpen = false;
    sidebar.classList.remove("active");
    sidebarOverlay?.classList.remove("active");
}


// ==========================================
// Update Sidebar
// ==========================================

function updateSidebar(){

    if(currentUser){

        showUserSidebar();

    }

    else{

        showGuestSidebar();

    }

}


// ==========================================
// Guest Header
// ==========================================

function showGuestHeader(){

    if(!headerRight)
        return;

    headerRight.innerHTML = `

        <button
            id="loginButton"
            class="nv-login-button">

            <i class="fa-regular fa-user"></i>

            <span>

                S'identifier

            </span>

        </button>

    `;

}


// ==========================================
// User Header
// ==========================================

function showUserHeader(){

    if(!headerRight)
        return;

    headerRight.innerHTML = `

        <button
            id="uploadButton"
            class="nv-icon-button"
            title="Publier">

            <i class="fa-solid fa-plus nv-plus-icon"></i>

        </button>

        <button
            id="notificationsButton"
            class="nv-icon-button">

            <i class="fa-regular fa-bell"></i>

            <span
                id="notificationBadge"
                class="nv-badge">

            </span>

        </button>

        <a
            href="settings.html"
            class="nv-avatar-button">

            <img
                id="headerAvatar"
                src="${
                    currentProfile?.avatar_url ||
                    "images/default-avatar.png"
                }"
                alt="Avatar">

        </a>

    `;

}


// ==========================================
// Guest Sidebar
// ==========================================

function showGuestSidebar(){

    if(!sidebarNav)
        return;

    sidebarNav.innerHTML = `

        <a href="index.html">

            <i class="fa-solid fa-house"></i>

            <span>Accueil</span>

        </a>

        <a href="shorts.html">

            <i class="fa-solid fa-bolt"></i>

            <span>Shorts</span>

        </a>

        <a href="lives.html">

            <i class="fa-solid fa-tower-broadcast"></i>

            <span>Lives</span>

        </a>

        <a href="search.html">

            <i class="fa-solid fa-magnifying-glass"></i>

            <span>Explorer</span>

        </a>

        <a href="netview-shop.html">

            <i class="fa-solid fa-store"></i>

            <span>Boutique</span>

        </a>

        <hr>

        <a href="auth.html">

            <i class="fa-regular fa-user"></i>

            <span>S'identifier</span>

        </a>

    `;

}


// ==========================================
// User Sidebar
// ==========================================

function showUserSidebar(){

    if(!sidebarNav)
        return;

    sidebarNav.innerHTML = `

        <a href="index.html">

            <i class="fa-solid fa-house"></i>

            <span>Accueil</span>

        </a>

        <a href="shorts.html">

            <i class="fa-solid fa-bolt"></i>

            <span>Shorts</span>

        </a>

        <a href="subscriptions.html">

            <i class="fa-solid fa-tv"></i>

            <span>Abonnements</span>

        </a>

        <a href="playlist.html">

            <i class="fa-solid fa-list"></i>

            <span>Playlists</span>

        </a>

        <a href="history.html">

            <i class="fa-solid fa-clock-rotate-left"></i>

            <span>Historique</span>

        </a>

        <a href="watch-later.html">

            <i class="fa-regular fa-clock"></i>

            <span>À regarder</span>

        </a>

        <a href="liked-videos.html">

            <i class="fa-solid fa-thumbs-up"></i>

            <span>J'aime</span>

        </a>

        <hr>

        <a href="lives.html">

            <i class="fa-solid fa-tower-broadcast"></i>

            <span>Lives</span>

        </a>

        <a href="netview-shop.html">

            <i class="fa-solid fa-store"></i>

            <span>Boutique</span>

        </a>

        <a href="settings.html">

            <i class="fa-solid fa-gear"></i>

            <span>Paramètres</span>

        </a>

        <a
            href="#"
            id="logoutButton">

            <i class="fa-solid fa-right-from-bracket"></i>

            <span>Déconnexion</span>

        </a>

    `;

}



// ==========================================
-- Utilitaire formatViews (Identique)
// ==========================================

function formatViews(views) {
    views = Number(views) || 0;
    if (views >= 1000000000) return (views / 1000000000).toFixed(1).replace(".0","") + " Md";
    if (views >= 1000000) return (views / 1000000).toFixed(1).replace(".0","") + " M";
    if (views >= 1000) return (views / 1000).toFixed(1).replace(".0","") + " k";
    return views.toString();
}
