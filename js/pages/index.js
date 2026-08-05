// ==========================================
// NetView
// index.js
// ==========================================

import {
    getSession,
    getUser,
    signOut
} from "../core/auth.js";

import {
    getProfile,
    getVideos,
    getShorts,
    getLives,
    getSponsoredProducts,
    select,
    initDeviceRevocationListener
} from "../core/data.js";

import {
    showLoader,
    hideLoader,
    showToast,
    buttonLoading
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";


// Lancer l'écouteur de déconnexion à distance dès que l'app se charge
initDeviceRevocationListener();

// ==========================================
// DOM
// ==========================================

// Header
const header = document.querySelector(".nv-header");
const headerRight = document.getElementById("headerRight");
const menuButton = document.getElementById("menuButton");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchButton = document.querySelector(".nv-search-button");
const uploadButton = document.getElementById("uploadButton");
const notificationsButton = document.getElementById("notificationsButton");
const notificationBadge = document.getElementById("notificationBadge");
const loginButton = document.getElementById("loginButton");
const headerAvatar = document.getElementById("headerAvatar");

// Sidebar
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// Categories
const categoriesBar = document.querySelector(".nv-categories");
const categoriesScroll = document.getElementById("categoriesContainer");

// Main Content
const videosGrid = document.getElementById("videosGrid");
const videosGridTwo = document.getElementById("videosGridTwo");
const videosGridThree = document.getElementById("videosGridThree");
const shortsGrid = document.getElementById("shortsGrid");
const livesContainer = document.getElementById("livesCarousel");
const productsContainer = document.getElementById("sponsoredProducts");

// Empty States
const videosEmpty = document.getElementById("videosEmpty");
const shortsEmpty = document.getElementById("shortsEmpty");
const livesEmpty = document.getElementById("livesEmpty");
const productsEmpty = document.getElementById("productsEmpty");

// Skeletons
const videosSkeleton = document.getElementById("videosSkeleton");
const moreVideosSkeleton = document.getElementById("moreVideosSkeleton");

// Context Menus
const videoContextMenu = document.getElementById("videoContextMenu");
const shortContextMenu = document.getElementById("shortContextMenu");
const liveContextMenu = document.getElementById("liveContextMenu");
const productContextMenu = document.getElementById("productContextMenu");


// ==========================================
// Variables globales
// ==========================================

let currentUser = null;
let currentProfile = null;
let videos = [];
let shorts = [];
let lives = [];
let products = [];
let categories = [];
let sidebarOpen = false;
let currentCategory = "all";
let isLoading = false;
let activeContextMenu = null;


// ==========================================
// Initialisation
// ==========================================

async function init(){
    try{
        isLoading = true;
        showLoader();

        if(videosSkeleton) videosSkeleton.hidden = false;

        await checkSession();
        await loadHomeContent();
        
        fillHeader();
        fillSidebar();

        loadCategories();
        renderAllContent();

        addEventListeners();
    }
    catch(error){
        console.error(error);
        showToast(
            "Impossible de charger la page.",
            "error"
        );
    }
    finally{
        isLoading = false;
        hideLoader();
        if(videosSkeleton) videosSkeleton.hidden = true;
    }
}


// ==========================================
// Session
// ==========================================

async function checkSession(){
    const session = await getSession();

    if(!session){
        currentUser = null;
        currentProfile = null;
        return;
    }

    currentUser = await getUser();

    if(currentUser){
        await loadProfile();
    }
}


// ==========================================
// Profil
// ==========================================

async function loadProfile(){
    if(!currentUser)
        return;

    const { data } = await getProfile();
    currentProfile = data;
}


// ==========================================
// Contenu Accueil
// ==========================================

async function loadHomeContent(){
    try {
        const [
            loadedVideos,
            loadedShorts,
            loadedLives,
            loadedProducts
        ] = await Promise.all([
            getVideos(),
            getShorts(),
            getLives(),
            getSponsoredProducts()
        ]);

        videos = loadedVideos?.data || loadedVideos || [];
        shorts = loadedShorts?.data || loadedShorts || [];
        lives = loadedLives?.data || loadedLives || [];
        products = loadedProducts?.data || loadedProducts || [];
    } catch (e) {
        console.warn("Erreur de chargement des données distantes, utilisation de données par défaut.", e);
        videos = [];
        shorts = [];
        lives = [];
        products = [];
    }
}


// ==========================================
// Header + Sidebar Rendu
// ==========================================

function fillHeader(){
    updateHeader();
}

function fillSidebar(){
    updateSidebar();
}

function toggleSidebar(){
    if(sidebarOpen){
        closeSidebar();
    }
    else{
        openSidebar();
    }
}

function openSidebar(){
    sidebarOpen = true;
    if(sidebar) sidebar.classList.add("active");
    if(sidebarOverlay) sidebarOverlay.classList.add("active");
    document.body.classList.add("nv-sidebar-open");
}

function closeSidebar(){
    sidebarOpen = false;
    if(sidebar) sidebar.classList.remove("active");
    if(sidebarOverlay) sidebarOverlay.classList.remove("active");
    document.body.classList.remove("nv-sidebar-open");
}

function updateHeader(){
    if(currentUser){
        showUserHeader();
    }
    else{
        showGuestHeader();
    }
}

function showGuestHeader(){
    if(!headerRight) return;
    headerRight.innerHTML = `
        <button
            id="loginButton"
            class="nv-login-button">
            S'identifier
        </button>
    `;

    const btn = document.getElementById("loginButton");
    if(btn){
        btn.addEventListener("click", () => {
            navigate("auth.html");
        });
    }
}

function showUserHeader(){
    if(!headerRight) return;
    headerRight.innerHTML = `
        <button
            id="uploadButton"
            class="nv-icon-button"
            title="Publier">
            <i class="fa-solid fa-circle-plus"></i>
        </button>
        <button
            id="notificationsButton"
            class="nv-icon-button">
            <i class="fa-regular fa-bell"></i>
            <span
                id="notificationBadge"
                class="nv-badge">
                0
            </span>
        </button>
        <a
            href="settings.html"
            class="nv-avatar-button">
            <img
                id="headerAvatar"
                src="${currentProfile?.avatar_url || "images/default-avatar.png"}"
                alt="Avatar">
        </a>
    `;

    const upBtn = document.getElementById("uploadButton");
    if(upBtn){
        upBtn.addEventListener("click", () => {
            navigate("studio.html");
        });
    }

    const notifBtn = document.getElementById("notificationsButton");
    if(notifBtn){
        notifBtn.addEventListener("click", () => {
            toggleNotifications();
        });
    }
}

function updateSidebar(){
    if(currentUser){
        showUserSidebar();
    }
    else{
        showGuestSidebar();
    }
}

function showGuestSidebar(){
    if(!sidebar) return;
    sidebar.innerHTML = `
        <nav class="nv-sidebar-nav">
            <a href="index.html" class="nv-sidebar-item active">
                <i class="fa-solid fa-house"></i>
                <span>Accueil</span>
            </a>
            <a href="search.html" class="nv-sidebar-item">
                <i class="fa-solid fa-magnifying-glass"></i>
                <span>Recherche</span>
            </a>
            <a href="trending.html" class="nv-sidebar-item">
                <i class="fa-solid fa-fire"></i>
                <span>Tendances</span>
            </a>
            <a href="shorts.html" class="nv-sidebar-item">
                <i class="fa-solid fa-bolt"></i>
                <span>Shorts</span>
            </a>
            <a href="lives.html" class="nv-sidebar-item">
                <i class="fa-solid fa-tower-broadcast"></i>
                <span>Lives</span>
            </a>
            <hr>
            <a href="netview-shop.html" class="nv-sidebar-item">
                <i class="fa-solid fa-store"></i>
                <span>Boutique</span>
            </a>
            <a href="help.html" class="nv-sidebar-item">
                <i class="fa-solid fa-circle-question"></i>
                <span>Aide</span>
            </a>
        </nav>
    `;
}

function showUserSidebar(){
    if(!sidebar) return;
    sidebar.innerHTML = `
        <nav class="nv-sidebar-nav">
            <a href="index.html" class="nv-sidebar-item active">
                <i class="fa-solid fa-house"></i>
                <span>Accueil</span>
            </a>
            <a href="search.html" class="nv-sidebar-item">
                <i class="fa-solid fa-magnifying-glass"></i>
                <span>Recherche</span>
            </a>
            <a href="trending.html" class="nv-sidebar-item">
                <i class="fa-solid fa-fire"></i>
                <span>Tendances</span>
            </a>
            <a href="shorts.html" class="nv-sidebar-item">
                <i class="fa-solid fa-bolt"></i>
                <span>Shorts</span>
            </a>
            <a href="lives.html" class="nv-sidebar-item">
                <i class="fa-solid fa-tower-broadcast"></i>
                <span>Lives</span>
            </a>
            <a href="subscriptions.html" class="nv-sidebar-item">
                <i class="fa-solid fa-users"></i>
                <span>Abonnements</span>
            </a>
            <a href="library.html" class="nv-sidebar-item">
                <i class="fa-solid fa-photo-film"></i>
                <span>Bibliothèque</span>
            </a>
            <a href="history.html" class="nv-sidebar-item">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>Historique</span>
            </a>
            <a href="playlist.html" class="nv-sidebar-item">
                <i class="fa-solid fa-list"></i>
                <span>Playlists</span>
            </a>
            <a href="notification.html" class="nv-sidebar-item">
                <i class="fa-regular fa-bell"></i>
                <span>Notifications</span>
            </a>
            <hr>
            <a href="studio.html" class="nv-sidebar-item">
                <i class="fa-solid fa-chart-line"></i>
                <span>Studio</span>
            </a>
            <a href="netview-shop.html" class="nv-sidebar-item">
                <i class="fa-solid fa-store"></i>
                <span>Boutique</span>
            </a>
            <a href="settings.html" class="nv-sidebar-item">
                <i class="fa-solid fa-gear"></i>
                <span>Paramètres</span>
            </a>
            <a href="help.html" class="nv-sidebar-item">
                <i class="fa-solid fa-circle-question"></i>
                <span>Aide</span>
            </a>
        </nav>
    `;
}

closeSidebar();


// ==========================================
// Partie 4 — Recherche + Catégories
// ==========================================

function searchVideos(query) {
    const q = query.toLowerCase().trim();
    if (!q) return videos;
    return videos.filter(v => 
        (v.title && v.title.toLowerCase().includes(q)) || 
        (v.channel && v.channel.toLowerCase().includes(q))
    );
}

function submitSearch(e) {
    if(e) e.preventDefault();
    if(!searchInput) return;
    const query = searchInput.value;
    if(query.trim()) {
        navigate(`search.html?q=${encodeURIComponent(query)}`);
    }
}

function clearSearch() {
    if(searchInput) searchInput.value = "";
    filterContent();
}

async function loadCategories() {
    categories = [
        "Gaming", "Musique", "Actualités", "Podcasts", 
        "Technologie", "Sport", "Cuisine", "Animation", "Films"
    ];
    
    if(!categoriesScroll) return;
    
    categoriesScroll.innerHTML = categories.map(cat => `
        <button class="nv-category" data-category="${cat}">${cat}</button>
    `).join("");

    categoriesScroll.querySelectorAll(".nv-category").forEach(btn => {
        btn.addEventListener("click", () => {
            selectCategory(btn.dataset.category, btn);
        });
    });
}

function selectCategory(category, buttonElement) {
    document.querySelectorAll(".nv-categories .nv-category, .nv-categories-scroll .nv-category").forEach(b => {
        b.classList.remove("active");
    });
    if(buttonElement) {
        buttonElement.classList.add("active");
    } else {
        const allBtn = document.querySelector(".nv-categories .nv-category");
        if(allBtn) allBtn.classList.add("active");
    }
    
    currentCategory = category;
    filterContent();
}

function filterContent() {
    let filtered = videos;
    if(currentCategory !== "all") {
        filtered = videos.filter(v => v.category === currentCategory);
    }
    renderVideosList(filtered);
}

function scrollCategoriesLeft() {
    if(categoriesScroll) {
        categoriesScroll.scrollBy({ left: -200, behavior: "smooth" });
    }
}

function scrollCategoriesRight() {
    if(categoriesScroll) {
        categoriesScroll.scrollBy({ left: 200, behavior: "smooth" });
    }
}


// ==========================================
// Partie 5 — Contenu principal & Création cartes
// ==========================================

function renderAllContent() {
    renderVideos();
    renderShorts();
    renderLives();
    renderSponsoredProducts();
}

function renderVideos() {
    renderVideosList(videos);
}

function renderVideosList(list) {
    if (!videosGrid) return;
    
    videosGrid.innerHTML = "";
    if (videosGridTwo) videosGridTwo.innerHTML = "";
    if (videosGridThree) videosGridThree.innerHTML = "";

    if (!list || list.length === 0) {
        if(videosEmpty) videosEmpty.hidden = false;
        return;
    }
    if(videosEmpty) videosEmpty.hidden = true;

    // Répartition sur les 3 grilles de la page d'accueil pour simuler la mise en page
    const chunk1 = list.slice(0, 4);
    const chunk2 = list.slice(4, 8);
    const chunk3 = list.slice(8);

    if(videosGrid) {
        chunk1.forEach(video => videosGrid.appendChild(createVideoCard(video)));
    }
    if(videosGridTwo && chunk2.length > 0) {
        chunk2.forEach(video => videosGridTwo.appendChild(createVideoCard(video)));
    }
    if(videosGridThree && chunk3.length > 0) {
        chunk3.forEach(video => videosGridThree.appendChild(createVideoCard(video)));
    }
}

function createVideoCard(video) {
    const template = document.getElementById("videoCardTemplate");
    if(!template) {
        const div = document.createElement("div");
        div.className = "nv-video-card";
        div.textContent = video.title || "Vidéo";
        return div;
    }

    const clone = template.content.cloneNode(true);
    const article = clone.querySelector(".nv-video-card");

    const img = clone.querySelector(".nv-video-image");
    if(img) img.src = video.thumbnail_url || "images/default-thumb.png";

    const duration = clone.querySelector(".nv-video-duration");
    if(duration) duration.textContent = video.duration || "10:00";

    const avatar = clone.querySelector(".nv-video-avatar img");
    if(avatar) avatar.src = video.channel_avatar || "images/default-avatar.png";

    const title = clone.querySelector(".nv-video-title");
    if(title) {
        title.textContent = video.title || "Titre de la vidéo";
        title.href = `watch.html?id=${video.id || ""}`;
    }

    const channel = clone.querySelector(".nv-video-channel");
    if(channel) {
        channel.textContent = video.channel || "Chaîne";
        channel.href = `channel.html?id=${video.channel_id || ""}`;
    }

    const views = clone.querySelector(".nv-video-views");
    if(views) views.textContent = `${video.views || 0} vues`;

    const date = clone.querySelector(".nv-video-date");
    if(date) date.textContent = video.date || "Récemment";

    const menuBtn = clone.querySelector(".nv-video-menu-button");
    if(menuBtn) {
        menuBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openContextMenu(videoContextMenu, e);
        });
    }

    return clone;
}

function renderShorts() {
    if(!shortsGrid) return;
    shortsGrid.innerHTML = "";
    
    if(!shorts || shorts.length === 0) {
        if(shortsEmpty) shortsEmpty.hidden = false;
        return;
    }
    if(shortsEmpty) shortsEmpty.hidden = true;

    shorts.forEach(short => {
        shortsGrid.appendChild(createShortCard(short));
    });
}

function createShortCard(short) {
    const template = document.getElementById("shortCardTemplate");
    if(!template) {
        const div = document.createElement("div");
        div.className = "nv-short-card";
        return div;
    }
    const clone = template.content.cloneNode(true);
    const img = clone.querySelector(".nv-short-image");
    if(img) img.src = short.thumbnail_url || "images/default-thumb.png";

    const title = clone.querySelector(".nv-short-info h3");
    if(title) title.textContent = short.title || "Short";

    const views = clone.querySelector(".nv-short-info span");
    if(views) views.textContent = `${short.views || 0} vues`;

    return clone;
}

function renderLives() {
    if(!livesContainer) return;
    livesContainer.innerHTML = "";

    if(!lives || lives.length === 0) {
        if(livesEmpty) livesEmpty.hidden = false;
        return;
    }
    if(livesEmpty) livesEmpty.hidden = true;

    lives.forEach(live => {
        livesContainer.appendChild(createLiveCard(live));
    });
}

function createLiveCard(live) {
    const template = document.getElementById("liveCardTemplate");
    if(!template) {
        const div = document.createElement("div");
        div.className = "nv-live-card";
        return div;
    }
    const clone = template.content.cloneNode(true);
    const img = clone.querySelector(".nv-live-image");
    if(img) img.src = live.thumbnail_url || "images/default-thumb.png";

    const title = clone.querySelector(".nv-live-info h3");
    if(title) title.textContent = live.title || "Live";

    const creator = clone.querySelector(".nv-live-info p");
    if(creator) creator.textContent = live.channel || "Créateur";

    const specs = clone.querySelector(".nv-live-info span");
    if(specs) specs.textContent = `${live.viewers || 0} spectateurs`;

    return clone;
}

function renderSponsoredProducts() {
    if(!productsContainer) return;
    productsContainer.innerHTML = "";

    if(!products || products.length === 0) {
        if(productsEmpty) productsEmpty.hidden = false;
        return;
    }
    if(productsEmpty) productsEmpty.hidden = true;

    products.forEach(product => {
        productsContainer.appendChild(createProductCard(product));
    });
}

function createProductCard(product) {
    const template = document.getElementById("productCardTemplate");
    if(!template) {
        const div = document.createElement("div");
        div.className = "nv-product-card";
        return div;
    }
    const clone = template.content.cloneNode(true);
    const img = clone.querySelector(".nv-product-image");
    if(img) img.src = product.image_url || "images/default-thumb.png";

    const title = clone.querySelector(".nv-product-info h3");
    if(title) title.textContent = product.title || "Produit";

    const creator = clone.querySelector(".nv-product-info p");
    if(creator) creator.textContent = product.creator || "Créateur";

    const price = clone.querySelector(".nv-product-info strong");
    if(price) price.textContent = `${product.price || "0,00"} $`;

    return clone;
}


// ==========================================
// Partie 6 — Menus + Notifications
// ==========================================

function openContextMenu(menuElement, event) {
    closeContextMenu();
    if (!menuElement) return;
    
    activeContextMenu = menuElement;
    menuElement.style.top = `${event.clientY}px`;
    menuElement.style.left = `${event.clientX}px`;
    menuElement.classList.add("active");

    document.addEventListener("click", handleOutsideClickForMenu);
}

function closeContextMenu() {
    if (activeContextMenu) {
        activeContextMenu.classList.remove("active");
        activeContextMenu = null;
    }
    document.removeEventListener("click", handleOutsideClickForMenu);
}

function handleOutsideClickForMenu(e) {
    if (activeContextMenu && !activeContextMenu.contains(e.target)) {
        closeContextMenu();
    }
}

function toggleNotifications() {
    showToast("Panneau de notifications ouvert", "info");
}

async function loadNotificationsCount() {
    if (!currentUser) return;
    if (notificationBadge) {
        notificationBadge.textContent = "0";
    }
}


// ==========================================
// Partie 7 — Événements
// ==========================================

function addEventListeners(){
    // Header Menu Button
    if(menuButton){
        menuButton.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // Sidebar Overlay
    if(sidebarOverlay){
        sidebarOverlay.addEventListener("click", () => {
            closeSidebar();
        });
    }

    // Search Form
    if(searchForm){
        searchForm.addEventListener("submit", submitSearch);
    }

    // Categories All Button
    const allCategoryBtn = document.querySelector(".nv-category");
    if(allCategoryBtn){
        allCategoryBtn.addEventListener("click", () => {
            selectCategory("all", allCategoryBtn);
        });
    }

    // Responsive window resize
    window.addEventListener("resize", () => {
        if(window.innerWidth > 1024) {
            closeSidebar();
        }
    });

    // Close menus on Escape
    document.addEventListener("keydown", (e) => {
        if(e.key === "Escape") {
            closeContextMenu();
            closeSidebar();
        }
    });
}


// ==========================================
// Partie 8 — Vérifications automatiques + Nettoyage
// ==========================================

window.addEventListener("beforeunload", () => {
    closeSidebar();
    closeContextMenu();
});

// Lancement automatique au chargement du DOM
document.addEventListener("DOMContentLoaded", init);
