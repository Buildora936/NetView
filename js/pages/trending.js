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
    getTrendingVideos,
    getTrendingShorts,
    getTrendingProducts,
    getCategories
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
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

// Conteneurs de la page tendances
const trendingVideosContainer = document.getElementById("trendingVideos");
const trendingShortsContainer = document.getElementById("trendingShorts");
const trendingProductsContainer = document.getElementById("trendingProducts");
const moreTrendingVideosContainer = document.getElementById("moreTrendingVideos");

// États et sections
const trendingSkeleton = document.getElementById("trendingSkeleton");
const trendingEmpty = document.getElementById("trendingEmpty");
const categoriesContainer = document.querySelector(".nv-categories-scroll");


// ==========================================
// Variables Globales
// ==========================================

let currentUser = null;
let currentProfile = null;
let trendingVideos = [];
let trendingShorts = [];
let trendingProducts = [];
let sidebarOpen = false;
let currentCategory = "all";
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
        await loadCategoriesList();
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

function updateHeader() {
    if (!currentUser) {
        showGuestHeader();
    } else {
        showUserHeader();
    }
}

function updateSidebar() {
    if (currentUser) {
        showUserSidebar();
    } else {
        showGuestSidebar();
    }
}


// ==========================================
// Chargement des Données de Tendances
// ==========================================

async function loadTrendingContent() {
    try {
        isLoading = true;
        if (trendingSkeleton) trendingSkeleton.hidden = false;

        // Requêtes parallèles pour récupérer tous les blocs de tendances
        const [videosData, shortsData, productsData] = await Promise.all([
            getTrendingVideos({ category: currentCategory }),
            getTrendingShorts({ category: currentCategory }),
            getTrendingProducts()
        ]);

        trendingVideos = Array.isArray(videosData) ? videosData : [];
        trendingShorts = Array.isArray(shortsData) ? shortsData : [];
        trendingProducts = Array.isArray(productsData) ? productsData : [];

        renderAllTrending();

    } catch (error) {
        console.error("Erreur chargement tendances:", error);
        trendingVideos = [];
        trendingShorts = [];
        trendingProducts = [];
        renderAllTrending();
    } finally {
        isLoading = false;
        if (trendingSkeleton) trendingSkeleton.hidden = true;
        hideLoader();
    }
}


// ==========================================
// Rendu Global
// ==========================================

function renderAllTrending() {
    const hasContent = trendingVideos.length > 0 || trendingShorts.length > 0 || trendingProducts.length > 0;

    if (trendingEmpty) {
        trendingEmpty.hidden = hasContent;
    }

    renderTrendingVideos();
    renderTrendingShorts();
    renderTrendingProducts();
    renderMoreTrendingVideos();
}


// ==========================================
// Rendu des Vidéos Tendances (Top 3 ou principal)
// ==========================================

function renderTrendingVideos() {
    if (!trendingVideosContainer) return;
    trendingVideosContainer.innerHTML = "";

    if (!trendingVideos.length) return;

    // Affiche par exemple les 5 premières vidéos principales
    const mainVideos = trendingVideos.slice(0, 5);
    mainVideos.forEach((video, index) => {
        const card = createTrendingVideoCard(video, index + 1);
        trendingVideosContainer.appendChild(card);
    });
}


// ==========================================
// Rendu des Shorts Tendance
// ==========================================

function renderTrendingShorts() {
    if (!trendingShortsContainer) return;
    trendingShortsContainer.innerHTML = "";

    if (!trendingShorts.length) return;

    trendingShorts.forEach(short => {
        const card = createShortCard(short);
        trendingShortsContainer.appendChild(card);
    });
}


// ==========================================
// Rendu des Produits Sponsorisés Tendance
// ==========================================

function renderTrendingProducts() {
    if (!trendingProductsContainer) return;
    trendingProductsContainer.innerHTML = "";

    if (!trendingProducts.length) return;

    trendingProducts.forEach(product => {
        const card = createProductCard(product);
        trendingProductsContainer.appendChild(card);
    });
}


// ==========================================
// Rendu des Vidéos Plus Anciennes / Toutes Tendances (Triées vues/likes)
// ==========================================

function renderMoreTrendingVideos() {
    if (!moreTrendingVideosContainer) return;
    moreTrendingVideosContainer.innerHTML = "";

    if (trendingVideos.length <= 5) return;

    // Le reste des vidéos tendance
    const remainingVideos = trendingVideos.slice(5);
    remainingVideos.forEach((video, index) => {
        const card = createTrendingVideoCard(video, index + 6);
        moreTrendingVideosContainer.appendChild(card);
    });
}


// ==========================================
// Création des Cartes
// ==========================================

function createTrendingVideoCard(video, rank) {
    const article = document.createElement("article");
    article.className = "nv-video-card nv-trending-card";
    article.dataset.id = video.id || "";
    
    const formattedDuration = formatDuration(video.duration);

    article.innerHTML = `
        <div class="nv-trending-rank">${rank}</div>
        <a href="player.html?id=${video.id || ''}" class="nv-video-link-wrapper">
            <div class="nv-video-thumbnail">
                <img src="${video.thumbnailUrl || video.thumbnail_url || 'default-thumb.jpg'}" alt="${video.title || ''}" loading="lazy">
                <span class="nv-video-duration">${formattedDuration}</span>
            </div>
        </a>
        <div class="nv-video-content">
            <div class="nv-video-avatar">
                <img src="${video.channelAvatar || video.avatar_url || 'images/default-avatar.png'}" alt="${video.channelName || ''}" loading="lazy">
            </div>
            <div class="nv-video-info">
                <h3 class="nv-video-title">
                    <a href="player.html?id=${video.id || ''}">${video.title || ''}</a>
                </h3>
                <a href="#" class="nv-video-channel">${video.channelName || video.channel_name || ''}</a>
                <div class="nv-video-meta">
                    <span>${formatViews(video.views || 0)} vues</span>
                    <span>•</span>
                    <span>${formatDate(video.published_at || video.created_at)}</span>
                </div>
            </div>
            <button class="nv-icon-button nv-video-menu-btn nv-video-menu" data-video="${video.id || ''}" aria-label="Action menu">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
        </div>
    `;
    return article;
}

function createShortCard(short) {
    const article = document.createElement("article");
    article.className = "nv-short-card";
    article.dataset.id = short.id;

    article.innerHTML = `
        <a href="player.html?short=${short.id}">
            <div class="nv-short-thumbnail">
                <img src="${short.thumbnail_url || ''}" alt="${short.title || ''}">
            </div>
            <div class="nv-short-info">
                <h3>${short.title || ''}</h3>
                <p>${formatViews(short.views || 0)} vues</p>
            </div>
        </a>
    `;
    return article;
}

function createProductCard(product) {
    const div = document.createElement("div");
    div.innerHTML = `
        <article class="nv-product-card" data-id="${product.id || ''}">
            <div class="nv-product-badge-container">
                ${product.badge ? `<span class="nv-product-badge">${product.badge}</span>` : ''}
                <button class="nv-product-wishlist" aria-label="Ajouter aux favoris">
                    <i class="fa-regular fa-heart"></i>
                </button>
            </div>
            <div class="nv-product-thumbnail">
                <img src="${product.thumbnail_path || product.preview_path || 'default-product.jpg'}" alt="${product.title || ''}" loading="lazy">
            </div>
            <div class="nv-product-content">
                <div class="nv-product-category-tag">${product.category || 'Lifestyle'}</div>
                <h3 class="nv-product-title">${product.title || ''}</h3>
                <div class="nv-product-footer">
                    <div class="nv-product-price-box">
                        <span class="nv-product-price">${product.price || '0,00 €'}</span>
                    </div>
                    <button class="nv-product-buy-btn" aria-label="Acheter le produit">
                        <i class="fa-solid fa-bag-shopping"></i>
                        <span>Acheter</span>
                    </button>
                </div>
            </div>
        </article>
    `;
    return div.firstElementChild;
}


// ==========================================
// Gestion des Catégories
// ==========================================

async function loadCategoriesList() {
    if (!categoriesContainer) return;
    try {
        const categories = await getCategories();
        renderCategories(Array.isArray(categories) ? categories : []);
    } catch (error) {
        console.error("Erreur chargement catégories:", error);
    }
}

function renderCategories(categories) {
    if (!categoriesContainer) return;

    // Garde le bouton "Tous" statique s'il existe déjà ou le recrée proprement
    const allBtn = categoriesContainer.querySelector('[data-category="all"]');
    
    // On nettoie sauf le bouton "Tous"
    categoriesContainer.innerHTML = '';
    
    if (allBtn) {
        categoriesContainer.appendChild(allBtn);
    } else {
        const defaultAll = document.createElement("button");
        defaultAll.type = "button";
        defaultAll.className = "nv-category active";
        defaultAll.dataset.category = "all";
        defaultAll.textContent = "Tous";
        categoriesContainer.appendChild(defaultAll);
    }

    categories.forEach(cat => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `nv-category ${cat.name === currentCategory ? "active" : ""}`;
        button.textContent = cat.name;
        button.dataset.category = cat.id || cat.name;

        categoriesContainer.appendChild(button);
    });
}


// ==========================================
// Gestion des Événements
// ==========================================

function addEventListeners() {
    // Menu Sidebar
    menuButton?.addEventListener("click", toggleSidebar);
    sidebarOverlay?.addEventListener("click", closeSidebar);

    // Recherche
    searchForm?.addEventListener("submit", handleSearchSubmit);

    // Changement de catégorie / filtre
    categoriesContainer?.addEventListener("click", async (event) => {
        const button = event.target.closest(".nv-category");
        if (!button) return;

        currentCategory = button.dataset.category;

        categoriesContainer.querySelectorAll(".nv-category").forEach(btn => {
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

function handleSearchSubmit(event) {
    if (event) event.preventDefault();
    if (!searchInput) return;

    const query = searchInput.value.trim();
    if (query) {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
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
// Headers & Sidebars (Templates UI)
// ==========================================

function showGuestHeader() {
    if (!headerRight) return;
    headerRight.innerHTML = `
        <button id="loginButton" class="nv-login-button" onclick="window.location.href='auth.html'">
            <i class="fa-regular fa-user"></i>
            <span>S'identifier</span>
        </button>
    `;
}

function showUserHeader() {
    if (!headerRight) return;
    headerRight.innerHTML = `
        <button id="uploadButton" class="nv-icon-button" title="Publier" onclick="window.location.href='upload.html'">
            <i class="fa-solid fa-plus nv-plus-icon"></i>
        </button>
        <button id="notificationsButton" class="nv-icon-button">
            <i class="fa-regular fa-bell"></i>
            <span id="notificationBadge" class="nv-badge"></span>
        </button>
        <a href="settings.html" class="nv-avatar-button">
            <img id="headerAvatar" src="${currentProfile?.avatar_url || 'images/default-avatar.png'}" alt="Avatar">
        </a>
    `;
}

function showGuestSidebar() {
    if (!sidebarNav) return;
    sidebarNav.innerHTML = `
        <a href="index.html"><i class="fa-solid fa-house"></i><span>Accueil</span></a>
        <a href="shorts.html"><i class="fa-solid fa-bolt"></i><span>Shorts</span></a>
        <a href="trending.html" class="active"><i class="fa-solid fa-fire"></i><span>Tendances</span></a>
        <a href="lives.html"><i class="fa-solid fa-tower-broadcast"></i><span>Lives</span></a>
        <a href="search.html"><i class="fa-solid fa-magnifying-glass"></i><span>Explorer</span></a>
        <a href="netview-shop.html"><i class="fa-solid fa-store"></i><span>Boutique</span></a>
        <hr>
        <a href="auth.html"><i class="fa-regular fa-user"></i><span>S'identifier</span></a>
    `;
}

function showUserSidebar() {
    if (!sidebarNav) return;
    sidebarNav.innerHTML = `
        <a href="index.html"><i class="fa-solid fa-house"></i><span>Accueil</span></a>
        <a href="shorts.html"><i class="fa-solid fa-bolt"></i><span>Shorts</span></a>
        <a href="trending.html" class="active"><i class="fa-solid fa-fire"></i><span>Tendances</span></a>
        <a href="subscriptions.html"><i class="fa-solid fa-tv"></i><span>Abonnements</span></a>
        <a href="playlist.html"><i class="fa-solid fa-list"></i><span>Playlists</span></a>
        <a href="history.html"><i class="fa-solid fa-clock-rotate-left"></i><span>Historique</span></a>
        <a href="watch-later.html"><i class="fa-regular fa-clock"></i><span>À regarder</span></a>
        <a href="liked-videos.html"><i class="fa-solid fa-thumbs-up"></i><span>J'aime</span></a>
        <hr>
        <a href="lives.html"><i class="fa-solid fa-tower-broadcast"></i><span>Lives</span></a>
        <a href="netview-shop.html"><i class="fa-solid fa-store"></i><span>Boutique</span></a>
        <a href="settings.html"><i class="fa-solid fa-gear"></i><span>Paramètres</span></a>
        <a href="#" id="logoutButton"><i class="fa-solid fa-right-from-bracket"></i><span>Déconnexion</span></a>
    `;
}


// ==========================================
// Utilitaires de Formatage
// ==========================================

function formatDuration(totalSeconds) {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
        const paddedHours = String(hours).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
}

function formatViews(views) {
    views = Number(views) || 0;
    if (views >= 1000000000) return (views / 1000000000).toFixed(1).replace(".0","") + " Md";
    if (views >= 1000000) return (views / 1000000).toFixed(1).replace(".0","") + " M";
    if (views >= 1000) return (views / 1000).toFixed(1).replace(".0","") + " k";
    return views.toString();
}

function formatDate(dateString) {
    if (!dateString) return "Il y a un moment";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
}
