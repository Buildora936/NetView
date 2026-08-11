// ==========================================
// NetView
// search.js
// Partie 1 & 2
// Imports + DOM + Variables globales + Logique complète
// ==========================================

// ==========================================
// Core Imports
// ==========================================
import { getSession, getUser, signOut } from "../core/auth.js";
import {
    getProfile,
    searchVideos,
    searchShorts,
    searchChannels,
    searchLives,
    searchProducts
} from "../core/data.js";
import {
    showLoader,
    hideLoader,
    showToast
} from "../core/ui.js";
import { navigate } from "../core/navigation.js";

// ==========================================
// DOM Elements
// ==========================================
// Header
const header = document.querySelector(".nv-header");
const menuButton = document.getElementById("menuButton");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchButton = document.querySelector(".nv-search-button");

// Mobile Search
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");

// Sidebar
const sidebar = document.getElementById("sidebar");
const sidebarNav = document.querySelector(".nv-sidebar-nav");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// Header User
const headerRight = document.querySelector(".nv-header-right");

// Filters
const searchFilters = document.querySelectorAll(".nv-search-filter");

// Results & States
const searchResults = document.getElementById("searchResults");
const searchSkeleton = document.getElementById("searchSkeleton");
const searchEmpty = document.getElementById("searchEmpty");
const searchLoader = document.getElementById("searchLoader");

// Context Menu & Notification
const contextMenu = document.getElementById("contextMenu");
const notification = document.getElementById("notification");

// ==========================================
// Variables Globales
// ==========================================
let currentUser = null;
let currentProfile = null;
let searchQuery = "";
let currentType = "all";
let searchResultsData = [];
let currentPage = 1;
let loading = false;
let hasMore = true;
let sidebarOpen = false;
let isMobile = false;
let searchTimeout = null;
let currentSearchController = null;

// ==========================================
// Responsive Search State
// ==========================================
const mobileBreakpoint = 768;

// ==========================================
// Initialisation
// ==========================================
async function init() {
    await checkSession();
    await loadProfile();
    fillHeader();
    fillSidebar();
    setupSearchBar();
    addEventListeners();
    loadInitialSearch();
}

// ==========================================
// Vérification Session
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

// ==========================================
// Chargement Profil
// ==========================================
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
// Header
// ==========================================
function fillHeader() {
    updateHeader();
}

// ==========================================
// Sidebar
// ==========================================
function fillSidebar() {
    updateSidebar();
}

// ==========================================
// Toggle Sidebar
// ==========================================
function toggleSidebar() {
    if (sidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// ==========================================
// Open Sidebar
// ==========================================
function openSidebar() {
    sidebarOpen = true;
    sidebar.classList.add("active");
    sidebarOverlay?.classList.add("active");
}

// ==========================================
// Close Sidebar
// ==========================================
function closeSidebar() {
    sidebarOpen = false;
    sidebar.classList.remove("active");
    sidebarOverlay?.classList.remove("active");
}

// ==========================================
// Update Header
// ==========================================
function updateHeader() {
    if (currentUser) {
        showUserHeader();
    } else {
        showGuestHeader();
    }
}

// ==========================================
// Update Sidebar
// ==========================================
function updateSidebar() {
    if (currentUser) {
        showUserSidebar();
    } else {
        showGuestSidebar();
    }
}

// ==========================================
// Guest Header
// ==========================================
function showGuestHeader() {
    if (!headerRight) return;

    headerRight.innerHTML = `
        <button
            id="loginButton"
            class="nv-login-button">
            <i class="fa-regular fa-user"></i>
            <span>S'identifier</span>
        </button>
    `;
}

// ==========================================
// User Header
// ==========================================
function showUserHeader() {
    if (!headerRight) return;

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
                src="${currentProfile?.avatar_url || 'images/default-avatar.png'}"
                alt="Avatar">
        </a>
    `;
}

// ==========================================
// Guest Sidebar
// ==========================================
function showGuestSidebar() {
    if (!sidebarNav) return;

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
function showUserSidebar() {
    if (!sidebarNav) return;

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
        <hr>
    
    `;
}

// ==========================================
// Gestion des deux barres de recherche
// Desktop / Mobile
// ==========================================
function setupSearchBar() {
    updateSearchBarVisibility();
    window.addEventListener("resize", updateSearchBarVisibility);
}

function updateSearchBarVisibility() {
    isMobile = window.innerWidth <= mobileBreakpoint;

    if (isMobile) {
        if (searchForm) searchForm.style.display = "none";
        if (mobileSearchForm) mobileSearchForm.style.display = "flex";
    } else {
        if (searchForm) searchForm.style.display = "flex";
        if (mobileSearchForm) mobileSearchForm.style.display = "none";
    }
}

// ==========================================
// Recherche initiale
// ==========================================
function loadInitialSearch() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");

    if (query) {
        searchQuery = query;
        if (searchInput) searchInput.value = query;
        if (mobileSearchInput) mobileSearchInput.value = query;
        executeSearch();
    }
}

// ==========================================
// Recherche principale
// ==========================================
async function executeSearch() {
    if (!searchQuery.trim()) {
        clearResults();
        return;
    }

    if (loading) return;
    loading = true;
    currentPage = 1;
    hasMore = true;
    searchResultsData = [];
    showSearchLoading();

    try {
        let results = [];

        switch (currentType) {
            case "videos":
                results = await searchVideos(searchQuery, currentPage);
                break;
            case "shorts":
                results = await searchShorts(searchQuery, currentPage);
                break;
            case "channels":
                results = await searchChannels(searchQuery, currentPage);
                break;
            case "lives":
                results = await searchLives(searchQuery, currentPage);
                break;
            case "products":
                results = await searchProducts(searchQuery, currentPage);
                break;
            default:
                results = await searchAll();
                break;
        }

        searchResultsData = results || [];
        hideSearchLoading();
        renderSearchResults();
    } catch (error) {
        console.error("Erreur recherche:", error);
        hideSearchLoading();
        showToast("Erreur pendant la recherche", "error");
    } finally {
        loading = false;
    }
}

// ==========================================
// Recherche globale
// ==========================================
async function searchAll() {
    const [videos, shorts, channels, lives, products] = await Promise.all([
        searchVideos(searchQuery, currentPage),
        searchShorts(searchQuery, currentPage),
        searchChannels(searchQuery, currentPage),
        searchLives(searchQuery, currentPage),
        searchProducts(searchQuery, currentPage)
    ]);

    return { videos, shorts, channels, lives, products };
}

// ==========================================
// Chargement visuel
// ==========================================
function showSearchLoading() {
    if (searchSkeleton) searchSkeleton.hidden = false;
    if (searchResults) searchResults.innerHTML = "";
    if (searchEmpty) searchEmpty.hidden = true;
}

function hideSearchLoading() {
    if (searchSkeleton) searchSkeleton.hidden = true;
}

// ==========================================
// Nettoyage résultats
// ==========================================
function clearResults() {
    if (searchResults) searchResults.innerHTML = "";
    if (searchEmpty) searchEmpty.hidden = false;
    if (searchSkeleton) searchSkeleton.hidden = true;
}

// ==========================================
// Filtres de recherche
// ==========================================
function changeFilter(type) {
    currentType = type;
    currentPage = 1;
    hasMore = true;

    searchFilters.forEach(button => {
        button.classList.remove("active");
        if (button.dataset.type === type) {
            button.classList.add("active");
        }
    });

    executeSearch();
}

// ==========================================
// Gestion des événements
// ==========================================
function addEventListeners() {
    // Recherche Header Desktop
    if (searchForm) {
        searchForm.addEventListener("submit", event => {
            event.preventDefault();
            searchQuery = searchInput.value.trim();
            updateUrl();
            executeSearch();
        });
    }

    // Recherche Mobile
    if (mobileSearchForm) {
        mobileSearchForm.addEventListener("submit", event => {
            event.preventDefault();
            searchQuery = mobileSearchInput.value.trim();
            if (searchInput) searchInput.value = searchQuery;
            updateUrl();
            executeSearch();
        });
    }

    // Recherche instantanée
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            autoSearch(searchInput.value);
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener("input", () => {
            autoSearch(mobileSearchInput.value);
        });
    }

    // Boutons filtres
    searchFilters.forEach(button => {
        button.addEventListener("click", () => {
            changeFilter(button.dataset.type);
        });
    });

    // Sidebar
    menuButton?.addEventListener("click", toggleSidebar);
    sidebarOverlay?.addEventListener("click", closeSidebar);

    // Header (délégation)
    headerRight?.addEventListener("click", async (event) => {
        const login = event.target.closest("#loginButton");
        if (login) {
            navigate("auth.html");
            return;
        }

        const upload = event.target.closest("#uploadButton");
        if (upload) {
            navigate("publish.html");
            return;
        }

        const notifications = event.target.closest("#notificationsButton");
        if (notifications) {
            navigate("notification.html");
            return;
        }
    });

    // Sidebar (délégation)
    sidebarNav?.addEventListener("click", async (event) => {
        const logout = event.target.closest("#logoutButton");
        if (!logout) return;

        event.preventDefault();
        await signOut();
        navigate("auth.html");
    });

    // Fermeture menu contextuel
    document.addEventListener("click", event => {
        if (contextMenu && !contextMenu.contains(event.target)) {
            contextMenu.classList.remove("active");
        }
    });

    // Chargement infini
    window.addEventListener("scroll", handleInfiniteScroll);
}

// ==========================================
// Recherche automatique avec délai
// ==========================================
function autoSearch(value) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = value.trim();
        if (searchQuery.length >= 2) {
            updateUrl();
            executeSearch();
        } else if (searchQuery.length === 0) {
            clearResults();
        }
    }, 500);
}

// ==========================================
// Mise à jour URL
// ==========================================
function updateUrl() {
    const url = new URL(window.location);
    if (searchQuery) {
        url.searchParams.set("q", searchQuery);
    } else {
        url.searchParams.delete("q");
    }
    window.history.pushState({}, "", url);
}

// ==========================================
// Scroll infini
// ==========================================
function handleInfiniteScroll() {
    if (loading || !hasMore || !searchQuery) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.body.offsetHeight;

    if (scrollPosition >= pageHeight - 500) {
        loadMoreResults();
    }
}

async function loadMoreResults() {
    if (loading || !hasMore || !searchQuery) return;

    loading = true;
    currentPage++;

    try {
        showInfiniteLoader();
        let results = [];

        switch (currentType) {
            case "videos":
                results = await searchVideos(searchQuery, currentPage);
                break;
            case "shorts":
                results = await searchShorts(searchQuery, currentPage);
                break;
            case "channels":
                results = await searchChannels(searchQuery, currentPage);
                break;
            case "lives":
                results = await searchLives(searchQuery, currentPage);
                break;
            case "products":
                results = await searchProducts(searchQuery, currentPage);
                break;
            default:
                results = await searchAll();
                break;
        }

        if (!results || (Array.isArray(results) && results.length === 0)) {
            hasMore = false;
            return;
        }

        appendSearchResults(results);
    } catch (error) {
        console.error("Erreur pagination:", error);
        showToast("Impossible de charger plus de résultats", "error");
    } finally {
        hideInfiniteLoader();
        loading = false;
    }
}

// ==========================================
// Rendu des résultats
// ==========================================
function renderSearchResults() {
    if (!searchResults) return;

    searchResults.innerHTML = "";
    if (searchEmpty) searchEmpty.hidden = true;

    if (
        !searchResultsData ||
        (typeof searchResultsData === "object" && Object.keys(searchResultsData).length === 0) ||
        (Array.isArray(searchResultsData) && searchResultsData.length === 0)
    ) {
        if (searchEmpty) searchEmpty.hidden = false;
        return;
    }

    switch (currentType) {
        case "videos":
            renderVideos(searchResultsData);
            break;
        case "shorts":
            renderShorts(searchResultsData);
            break;
        case "channels":
            renderChannels(searchResultsData);
            break;
        case "lives":
            renderLives(searchResultsData);
            break;
        case "products":
            renderProducts(searchResultsData);
            break;
        default:
            renderAllResults(searchResultsData);
            break;
    }
}

// ==========================================
// Tout afficher
// ==========================================
function renderAllResults(data) {
    let hasAnyData = false;

    if (data.videos?.length) {
        createSectionTitle("Vidéos");
        renderVideos(data.videos);
        hasAnyData = true;
    }
    if (data.shorts?.length) {
        createSectionTitle("Shorts");
        renderShorts(data.shorts);
        hasAnyData = true;
    }
    if (data.channels?.length) {
        createSectionTitle("Chaînes");
        renderChannels(data.channels);
        hasAnyData = true;
    }
    if (data.lives?.length) {
        createSectionTitle("Lives");
        renderLives(data.lives);
        hasAnyData = true;
    }
    if (data.products?.length) {
        createSectionTitle("Produits");
        renderProducts(data.products);
        hasAnyData = true;
    }

    if (!hasAnyData && searchEmpty) {
        searchEmpty.hidden = false;
    }
}

// ==========================================
// Titres des sections
// ==========================================
function createSectionTitle(title) {
    const h2 = document.createElement("h2");
    h2.className = "nv-search-section-title";
    h2.textContent = title;
    searchResults.appendChild(h2);
}

// ==========================================
// Vidéos
// ==========================================

// ==========================================
// NetView
// index.js (suite et fin)
// ==========================================

// ==========================================
// Format Vues
// ==========================================

function formatViews(views){

    views = Number(views) || 0;

    if(views >= 1000000000){
        return (views / 1000000000).toFixed(1).replace(/\.0$/, '') + ' Md';
    }
    
    if(views >= 1000000){
        return (views / 1000000).toFixed(1).replace(/\.0$/, '') + ' M';
    }
    
    if(views >= 1000){
        return (views / 1000).toFixed(1).replace(/\.0$/, '') + ' k';
    }

    return views.toString();
}

// ==========================================
// Format Date (Temps Relatif)
// ==========================================

function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (isNaN(seconds) || seconds < 0) return '';

    const intervals = {
        année: 31536000,
        mois: 2592000,
        semaine: 604800,
        jour: 86400,
        heure: 3600,
        minute: 60
    };

    if (seconds < intervals.minute) {
        return "À l'instant";
    }

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const count = Math.floor(seconds / secondsInUnit);
        if (count >= 1) {
            const plural = count > 1 && unit !== 'mois' ? 's' : '';
            return `Il y a ${count} ${unit}${plural}`;
        }
    }

    return "À l'instant";
}

// ==========================================
// Utils (Fonction de formatage du temps)
// ==========================================
function formatDuration(totalSeconds) {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) {
        return "00:00";
    }

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

// ==========================================
// Vidéos (Mise à jour avec la structure index.js)
// ==========================================
function renderVideos(videos) {
    if (!videos || videos.length === 0) return;
    const container = document.createElement("div");
    container.className = "nv-search-videos";

    videos.forEach(video => {
        const formattedDuration = formatDuration(video.duration);
        
        container.innerHTML += `
            <article class="nv-search-video-card" data-id="${video.id || ''}">
                <a class="nv-search-video-thumbnail" href="player.html?id=${video.id || ''}">
                    <img src="${video.thumbnail_url || 'default-thumb.jpg'}" alt="${video.title || 'Vidéo'}" loading="lazy">
                    <span class="nv-search-duration">${formattedDuration}</span>
                </a>
                <div class="nv-search-video-content">
                    <div class="nv-search-video-avatar">
                        <img src="${video.channelAvatar || 'images/default-avatar.png'}" alt="${video.channelName || video.channel_name || ''}" loading="lazy">
                    </div>
                    <div class="nv-search-video-info">
                        <h3 class="nv-search-video-title">
                            <a href="player.html?id=${video.id || ''}">${video.title || "Sans titre"}</a>
                        </h3>
                        <a href="#" class="nv-search-video-channel">${video.channelName || video.channel_name || "NetView"}</a>
                        <div class="nv-search-video-meta">
                            <span>${formatViews(video.views || 0)} vues</span>
                            <span>•</span>
                            <span>${formatDate(video.published_at || video.created_at)}</span>
                        </div>
                    </div>
                    <button class="nv-icon-button nv-video-menu-btn nv-video-menu" data-video="${video.id || ''}" aria-label="Action menu">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>
            </article>
        `;
    });

    searchResults.appendChild(container);
}
// ==========================================
// Shorts
// ==========================================
function renderShorts(shorts) {
    if (!shorts || shorts.length === 0) return;
    const container = document.createElement("div");
    container.className = "nv-search-shorts-grid";

    shorts.forEach(short => {
        container.innerHTML += `
            <article class="nv-search-short-card">
                <div class="nv-search-short-thumbnail">
                    <img src="${short.thumbnail_url || ''}" alt="Short">
                </div>
                <div class="nv-search-short-info">
                    <h3>${short.title || "Short"}</h3>
                </div>
            </article>
        `;
    });

    searchResults.appendChild(container);
}

// ==========================================
// Chaînes
// ==========================================
function renderChannels(channels) {
    if (!channels || channels.length === 0) return;
    const container = document.createElement("div");
    container.className = "nv-search-channels";

    channels.forEach(channel => {
        container.innerHTML += `
            <article class="nv-search-channel-card">
                <div class="nv-search-channel-avatar">
                    <img src="${channel.avatar_url || 'images/default-avatar.png'}" alt="Avatar">
                </div>
                <div>
                    <h3>${channel.name || "Chaîne"}</h3>
                    <p>${channel.subscribers || 0} abonnés</p>
                </div>
            </article>
        `;
    });

    searchResults.appendChild(container);
}

// ==========================================
// Lives
// ==========================================
function renderLives(lives) {
    if (!lives || lives.length === 0) return;
    const container = document.createElement("div");
    container.className = "nv-search-live-scroll";

    lives.forEach(live => {
        container.innerHTML += `
            <article class="nv-search-live-card">
                <div class="nv-search-live-thumbnail">
                    <img src="${live.thumbnail_url || ''}" alt="Live">
                    <span class="nv-live-badge">LIVE</span>
                </div>
                <div class="nv-search-product-info">
                    <h3>${live.title || "Live"}</h3>
                </div>
            </article>
        `;
    });

    searchResults.appendChild(container);
}

// ==========================================
// Produits
// ==========================================
function renderProducts(products) {
    if (!products || products.length === 0) return;
    const container = document.createElement("div");
    container.className = "nv-search-products-grid";

    products.forEach(product => {
        container.innerHTML += `
            <article class="nv-search-product-card">
                <div class="nv-search-product-image">
                    <img src="${product.image_url || ''}" alt="${product.name || 'Produit'}">
                </div>
                <div class="nv-search-product-info">
                    <h3>${product.name || "Produit"}</h3>
                    <p>${product.price || 0} $</p>
                </div>
            </article>
        `;
    });

    searchResults.appendChild(container);
}

// ==========================================
// Ajout résultats supplémentaires
// ==========================================
function appendSearchResults(data) {
    if (currentType === "all") {
        renderAllResults(data);
        return;
    }

    switch (currentType) {
        case "videos":
            renderVideos(data);
            break;
        case "shorts":
            renderShorts(data);
            break;
        case "channels":
            renderChannels(data);
            break;
        case "lives":
            renderLives(data);
            break;
        case "products":
            renderProducts(data);
            break;
    }
}

// ==========================================
// Loader pagination
// ==========================================
function showInfiniteLoader() {
    if (searchLoader) searchLoader.hidden = false;
}

function hideInfiniteLoader() {
    if (searchLoader) searchLoader.hidden = true;
}

// ==========================================
// Format Date Utilitaire
// ==========================================
function formatDate(dateString) {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// ==========================================
// Nettoyage recherche
// ==========================================
function clearSearch() {
    searchQuery = "";
    currentType = "all";
    currentPage = 1;
    hasMore = true;
    searchResultsData = [];

    if (searchInput) searchInput.value = "";
    if (mobileSearchInput) mobileSearchInput.value = "";
    if (searchResults) searchResults.innerHTML = "";
}

// ==========================================
// Reset filtres
// ==========================================
function resetFilters() {
    searchFilters.forEach(button => {
        button.classList.remove("active");
    });

    const defaultFilter = document.querySelector('[data-type="all"]');
    if (defaultFilter) {
        defaultFilter.classList.add("active");
    }

    currentType = "all";
}

// ==========================================
// Fermeture propre des menus
// ==========================================
function closeContextMenu() {
    if (contextMenu) {
        contextMenu.classList.remove("active");
    }
}

// ==========================================
// Suppression événements
// ==========================================
function removeEventListeners() {
    window.removeEventListener("scroll", handleInfiniteScroll);
    window.removeEventListener("resize", updateSearchBarVisibility);
    clearTimeout(searchTimeout);
}

// ==========================================
// Nettoyage complet page
// ==========================================
function cleanup() {
    removeEventListeners();
    closeContextMenu();
    clearSearch();
    if (currentSearchController) {
        currentSearchController.abort();
        currentSearchController = null;
    }
}

// ==========================================
// Avant fermeture page
// ==========================================
window.addEventListener("beforeunload", cleanup);

// ==========================================
// Lancement
// ==========================================
init();
