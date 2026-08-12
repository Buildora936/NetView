// ==========================================
// NetView
// trending.js
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
    getVideoCategories
} from "../core/data.js";

import {
    showLoader,
    hideLoader,
    showToast
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";


// ==========================================
// DOM
// ==========================================

const mainContent =
    document.getElementById("mainContent");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");

const sidebarNav =
    sidebar?.querySelector(".nv-sidebar-nav");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const headerRight =
    document.getElementById("headerRight");

const searchForm =
    document.getElementById("searchForm");

const searchInput =
    document.getElementById("searchInput");

const trendingVideosSection =
    document.getElementById("trendingVideosSection");

const trendingVideosContainer =
    document.getElementById("trendingVideos");

const trendingShortsSection =
    document.getElementById("trendingShortsSection");

const trendingShortsContainer =
    document.getElementById("trendingShorts");

const trendingLivesSection =
    document.getElementById("trendingLivesSection");

const trendingLivesContainer =
    document.getElementById("trendingLives");

const trendingProductsSection =
    document.getElementById("trendingProductsSection");

const trendingProductsContainer =
    document.getElementById("trendingProducts");

const trendingRankingSection =
    document.getElementById("trendingRankingSection");

const trendingRankingContainer =
    document.getElementById("trendingRanking");

const trendingSkeleton =
    document.getElementById("trendingSkeleton");

const trendingEmpty =
    document.getElementById("trendingEmpty");

const pageLoader =
    document.getElementById("pageLoader");

const contextMenu =
    document.getElementById("contextMenu");

const notification =
    document.getElementById("notification");

const categoriesContainer =
    document.querySelector(".nv-categories-scroll");


// ==========================================
// État
// ==========================================

let currentUser = null;
let currentProfile = null;

let trendingVideos = [];
let trendingShorts = [];
let trendingLives = [];
let trendingProducts = [];

let videoCategories = [];

let currentCategory = "all";

let sidebarOpen = false;
let isLoading = false;

let activeVideoId = null;


// ==========================================
// Initialisation
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {
    try {
        showPageLoader();

        await checkSession();
        await loadProfile();

        updateHeader();
        updateSidebar();

        await loadCategoriesList();
        await loadTrendingContent();

        addEventListeners();

    } catch (error) {

        console.error(
            "NetView — erreur initialisation trending :",
            error
        );

        showErrorState();

    } finally {

        hidePageLoader();
    }
}


// ==========================================
// Session
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

        console.error(
            "NetView — erreur session :",
            error
        );

        currentUser = null;
    }
}


// ==========================================
// Profil
// ==========================================

async function loadProfile() {

    if (!currentUser) {
        currentProfile = null;
        return;
    }

    try {

        currentProfile = await getProfile();

    } catch (error) {

        console.error(
            "NetView — erreur profil :",
            error
        );

        currentProfile = null;
    }
}


// ==========================================
// Header
// ==========================================

function updateHeader() {

    if (!headerRight) {
        return;
    }

    if (!currentUser) {
        renderGuestHeader();
    } else {
        renderUserHeader();
    }
}


function renderGuestHeader() {

    headerRight.innerHTML = `
        <button
            type="button"
            id="loginButton"
            class="nv-login-button"
        >
            <i class="fa-regular fa-user"></i>
            <span>S'identifier</span>
        </button>
    `;
}


function renderUserHeader() {

    const avatar =
        currentProfile?.avatar_url ||
        "images/default-avatar.png";

    headerRight.innerHTML = `
        <button
            type="button"
            id="uploadButton"
            class="nv-icon-button"
            title="Publier"
            aria-label="Publier"
        >
            <i class="fa-solid fa-plus"></i>
        </button>

        <button
            type="button"
            id="notificationsButton"
            class="nv-icon-button"
            title="Notifications"
            aria-label="Notifications"
        >
            <i class="fa-regular fa-bell"></i>
            <span
                id="notificationBadge"
                class="nv-badge"
                hidden
            ></span>
        </button>

        <a
            href="settings.html"
            class="nv-avatar-button"
            aria-label="Mon compte"
        >
            <img
                id="headerAvatar"
                src="${escapeAttribute(avatar)}"
                alt="Avatar"
                loading="lazy"
            >
        </a>
    `;

    const uploadButton =
        document.getElementById("uploadButton");

    uploadButton?.addEventListener(
        "click",
        () => navigate("publish.html")
    );

    const notificationsButton =
        document.getElementById(
            "notificationsButton"
        );

    notificationsButton?.addEventListener(
        "click",
        () => navigate("notification.html")
    );
}


// ==========================================
// Sidebar
// ==========================================

function updateSidebar() {

    if (!sidebarNav) {
        return;
    }

    if (currentUser) {
        renderUserSidebar();
    } else {
        renderGuestSidebar();
    }
}


function renderGuestSidebar() {

    sidebarNav.innerHTML = `
        <a href="index.html">
            <i class="fa-solid fa-house"></i>
            <span>Accueil</span>
        </a>

        <a href="shorts.html">
            <i class="fa-solid fa-bolt"></i>
            <span>Shorts</span>
        </a>

        <a
            href="trending.html"
            class="active"
            aria-current="page"
        >
            <i class="fa-solid fa-fire"></i>
            <span>Tendances</span>
        </a>

        <a href="lives.html">
            <i class="fa-solid fa-tower-broadcast"></i>
            <span>Lives</span>
        </a>

        <a href="search.html">
            <i class="fa-solid fa-compass"></i>
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


function renderUserSidebar() {

    sidebarNav.innerHTML = `
        <a href="index.html">
            <i class="fa-solid fa-house"></i>
            <span>Accueil</span>
        </a>

        <a href="shorts.html">
            <i class="fa-solid fa-bolt"></i>
            <span>Shorts</span>
        </a>

        <a
            href="trending.html"
            class="active"
            aria-current="page"
        >
            <i class="fa-solid fa-fire"></i>
            <span>Tendances</span>
        </a>

        <a href="subscriptions.html">
            <i class="fa-solid fa-tv"></i>
            <span>Abonnements</span>
        </a>

        <a href="playlist.html">
            <i class="fa-solid fa-list"></i>
            <span>Playlists</span>
        </a>

        <a href="settings.html">
            <i class="fa-solid fa-gear"></i>
            <span>Paramètres</span>
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

        <a
            href="#"
            id="logoutButton"
        >
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Déconnexion</span>
        </a>
    `;
}


// ==========================================
// Catégories
// ==========================================

async function loadCategoriesList() {

    if (!categoriesContainer) {
        return;
    }

    try {

        videoCategories =
            await getVideoCategories();

        renderCategories(videoCategories);

    } catch (error) {

        console.error(
            "NetView — erreur catégories :",
            error
        );

        renderCategories([]);
    }
}


function renderCategories(categories) {

    if (!categoriesContainer) {
        return;
    }

    categoriesContainer.innerHTML = "";

    const allButton =
        document.createElement("button");

    allButton.type = "button";
    allButton.className =
        "nv-category active";

    allButton.dataset.category = "all";
    allButton.textContent = "Tous";

    categoriesContainer.appendChild(
        allButton
    );

    const uniqueCategories = [];
    const usedNames = new Set();

    for (const category of categories || []) {

        const name =
            String(
                category?.name || ""
            ).trim();

        if (!name) {
            continue;
        }

        const key = name.toLowerCase();

        if (usedNames.has(key)) {
            continue;
        }

        usedNames.add(key);

        uniqueCategories.push({
            ...category,
            name
        });
    }

    uniqueCategories.forEach(
        category => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "nv-category";

            button.dataset.category =
                category.id ||
                category.name;

            button.dataset.categoryName =
                category.name;

            button.textContent =
                category.name;

            if (
                currentCategory !== "all" &&
                (
                    String(category.id) ===
                        String(currentCategory) ||
                    category.name ===
                        currentCategory
                )
            ) {
                button.classList.add("active");
            }

            categoriesContainer.appendChild(
                button
            );
        }
    );

    updateCategoryButtons();
}


function updateCategoryButtons() {

    if (!categoriesContainer) {
        return;
    }

    categoriesContainer
        .querySelectorAll(".nv-category")
        .forEach(button => {

            const category =
                button.dataset.category;

            const categoryName =
                button.dataset.categoryName;

            const active =
                currentCategory === "all"
                    ? category === "all"
                    : (
                        category ===
                            String(currentCategory) ||
                        categoryName ===
                            currentCategory
                    );

            button.classList.toggle(
                "active",
                active
            );
        });
}


// ==========================================
// Chargement des tendances
// ==========================================

async function loadTrendingContent() {

    if (isLoading) {
        return;
    }

    try {

        isLoading = true;

        showTrendingSkeleton();

        const [
            videosData,
            shortsData,
            livesData,
            productsData
        ] = await Promise.all([
            getVideos(),
            getShorts(),
            getLives(),
            getSponsoredProducts()
        ]);

        trendingVideos =
            prepareTrendingVideos(
                Array.isArray(videosData)
                    ? videosData
                    : []
            );

        trendingShorts =
            prepareTrendingShorts(
                Array.isArray(shortsData)
                    ? shortsData
                    : []
            );

        trendingLives =
            prepareTrendingLives(
                Array.isArray(livesData)
                    ? livesData
                    : []
            );

        trendingProducts =
            prepareTrendingProducts(
                Array.isArray(productsData)
                    ? productsData
                    : []
            );

        renderAllTrending();

    } catch (error) {

        console.error(
            "NetView — erreur chargement tendances :",
            error
        );

        trendingVideos = [];
        trendingShorts = [];
        trendingLives = [];
        trendingProducts = [];

        renderAllTrending();

    } finally {

        isLoading = false;

        hideTrendingSkeleton();
    }
}


// ==========================================
// Préparation vidéos
// ==========================================

function prepareTrendingVideos(videos) {

    let result = videos.filter(
        video =>
            video &&
            video.id &&
            isPublicPublishedVideo(video)
    );

    if (currentCategory !== "all") {

        result = result.filter(
            video =>
                matchesCategory(
                    video,
                    currentCategory
                )
        );
    }

    return result
        .map(video => ({
            ...video,
            trendingScore:
                calculateVideoScore(video)
        }))
        .sort(
            (a, b) =>
                b.trendingScore -
                a.trendingScore
        );
}


function isPublicPublishedVideo(video) {

    const status =
        video.status;

    const visibility =
        video.visibility;

    if (
        status &&
        status !== "published"
    ) {
        return false;
    }

    if (
        visibility &&
        visibility !== "public"
    ) {
        return false;
    }

    return true;
}


function calculateVideoScore(video) {

    const views =
        toNumber(
            video.views ??
            video.view_count ??
            video.views_count
        );

    const likes =
        toNumber(
            video.likes ??
            video.likes_count ??
            video.like_count
        );

    const comments =
        toNumber(
            video.comments ??
            video.comments_count ??
            video.comment_count
        );

    const publishedDate =
        video.published_at ||
        video.created_at;

    const ageHours =
        getAgeHours(publishedDate);

    const freshness =
        Math.max(
            0,
            168 - ageHours
        );

    return (
        views * 1 +
        likes * 8 +
        comments * 12 +
        freshness * 100
    );
}


// ==========================================
// Préparation Shorts
// ==========================================

function prepareTrendingShorts(shorts) {

    let result = shorts.filter(
        short =>
            short &&
            short.id
    );

    if (currentCategory !== "all") {

        result = result.filter(
            short =>
                matchesCategory(
                    short,
                    currentCategory
                )
        );
    }

    return result
        .map(short => ({
            ...short,
            trendingScore:
                calculateShortScore(short)
        }))
        .sort(
            (a, b) =>
                b.trendingScore -
                a.trendingScore
        );
}


// ==========================================
// Préparation Lives
// ==========================================

function prepareTrendingLives(lives) {

    let result = lives.filter(
        live =>
            live &&
            live.id
    );

    if (currentCategory !== "all") {

        result = result.filter(
            live =>
                matchesCategory(
                    live,
                    currentCategory
                )
        );
    }

    return result
        .map(live => ({
            ...live,
            trendingScore:
                calculateLiveScore(live)
        }))
        .sort(
            (a, b) =>
                b.trendingScore -
                a.trendingScore
        );
}


// ==========================================
// Préparation Produits
// ==========================================

function prepareTrendingProducts(products) {

    return products
        .filter(
            product =>
                product &&
                product.id
        )
        .sort(
            (a, b) =>
                getDateValue(
                    b.created_at
                ) -
                getDateValue(
                    a.created_at
                )
        );
}


// ==========================================
// Catégorie
// ==========================================

function matchesCategory(
    item,
    category
) {

    if (
        !category ||
        category === "all"
    ) {
        return true;
    }

    const wanted =
        String(category)
            .trim()
            .toLowerCase();

    const values = [
        item.category,
        item.category_id,
        item.category_name,
        item.categoryName,
        item.video_category_id,
        item.video_category_name,
        item.video_categories?.id,
        item.video_categories?.name
    ];

    return values.some(
        value =>
            value !== null &&
            value !== undefined &&
            String(value)
                .trim()
                .toLowerCase() === wanted
    );
}


// ==========================================
// Rendu global
// ==========================================

function renderAllTrending() {

    const hasContent =
        trendingVideos.length > 0 ||
        trendingShorts.length > 0 ||
        trendingLives.length > 0 ||
        trendingProducts.length > 0;

    if (trendingEmpty) {
        trendingEmpty.hidden =
            hasContent;
    }

    renderTrendingVideos();
    renderTrendingShorts();
    renderTrendingLives();
    renderTrendingProducts();
    renderTrendingRanking();

    toggleSections();
}


// ==========================================
// Sections
// ==========================================

function toggleSections() {

    toggleSection(
        trendingVideosSection,
        trendingVideos.length > 0
    );

    toggleSection(
        trendingShortsSection,
        trendingShorts.length > 0
    );

    toggleSection(
        trendingLivesSection,
        trendingLives.length > 0
    );

    toggleSection(
        trendingProductsSection,
        trendingProducts.length > 0
    );

    toggleSection(
        trendingRankingSection,
        trendingVideos.length > 0
    );
}


function toggleSection(
    section,
    visible
) {

    if (!section) {
        return;
    }

    section.hidden = !visible;
}


// ==========================================
// Vidéos
// ==========================================

function renderTrendingVideos() {

    if (!trendingVideosContainer) {
        return;
    }

    trendingVideosContainer.innerHTML = "";

    const videos =
        trendingVideos.slice(0, 12);

    videos.forEach(
        (video, index) => {

            const card =
                createTrendingVideoCard(
                    video,
                    index + 1
                );

            trendingVideosContainer.appendChild(
                card
            );
        }
    );
}


// ==========================================
// Carte vidéo
// ==========================================

function createTrendingVideoCard(
    video,
    rank
) {

    const article =
        document.createElement("article");

    article.className =
        "nv-video-card nv-trending-card";

    article.dataset.id =
        video.id;

    const title =
        video.title ||
        "Vidéo sans titre";

    const thumbnail =
        video.thumbnail_url ||
        video.thumbnailUrl ||
        "images/default-thumbnail.jpg";

    const avatar =
        video.channelAvatar ||
        video.channels?.avatar_url ||
        video.avatar_url ||
        "images/default-avatar.png";

    const channelName =
        video.channelName ||
        video.channels?.name ||
        video.channel_name ||
        "Chaîne NetView";

    const channelHandle =
        video.channelHandle ||
        video.channels?.handle ||
        video.handle ||
        "";

    const views =
        toNumber(
            video.views ??
            video.view_count ??
            video.views_count
        );

    const likes =
        toNumber(
            video.likes ??
            video.likes_count ??
            video.like_count
        );

    const duration =
        formatDuration(
            video.duration
        );

    const publishedAt =
        video.published_at ||
        video.created_at;

    article.innerHTML = `
        <div class="nv-trending-rank">
            ${rank}
        </div>

        <a
            href="player.html?id=${encodeURIComponent(video.id)}"
            class="nv-video-link-wrapper"
            aria-label="${escapeAttribute(title)}"
        >
            <div class="nv-video-thumbnail">

                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

                ${
                    duration
                        ? `
                            <span class="nv-video-duration">
                                ${duration}
                            </span>
                        `
                        : ""
                }

            </div>
        </a>

        <div class="nv-video-content">

            <a
                href="${getChannelUrl(video)}"
                class="nv-video-avatar"
                aria-label="${escapeAttribute(channelName)}"
            >
                <img
                    src="${escapeAttribute(avatar)}"
                    alt="${escapeAttribute(channelName)}"
                    loading="lazy"
                >
            </a>

            <div class="nv-video-info">

                <h3 class="nv-video-title">
                    <a
                        href="player.html?id=${encodeURIComponent(video.id)}"
                    >
                        ${escapeHTML(title)}
                    </a>
                </h3>

                <a
                    href="${getChannelUrl(video)}"
                    class="nv-video-channel"
                >
                    ${escapeHTML(channelName)}
                    ${
                        video.channelVerified ||
                        video.channels?.verified ||
                        video.verified
                            ? `
                                <i
                                    class="fa-solid fa-circle-check"
                                    aria-label="Vérifié"
                                ></i>
                            `
                            : ""
                    }
                </a>

                <div class="nv-video-meta">

                    <span>
                        ${formatViews(views)} vues
                    </span>

                    ${
                        likes > 0
                            ? `
                                <span>•</span>
                                <span>
                                    ${formatViews(likes)} j'aime
                                </span>
                            `
                            : ""
                    }

                    <span>•</span>

                    <span>
                        ${formatDate(publishedAt)}
                    </span>

                </div>

            </div>

            <button
                type="button"
                class="nv-icon-button nv-video-menu-btn nv-video-menu"
                data-video="${escapeAttribute(video.id)}"
                aria-label="Plus d'options"
                title="Plus d'options"
            >
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

        </div>
    `;

    const menuButton =
        article.querySelector(
            ".nv-video-menu-btn"
        );

    menuButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            activeVideoId =
                video.id;

            openContextMenu(
                event,
                video
            );
        }
    );

    return article;
}


// ==========================================
// Shorts
// ==========================================

function renderTrendingShorts() {

    if (!trendingShortsContainer) {
        return;
    }

    trendingShortsContainer.innerHTML = "";

    trendingShorts
        .slice(0, 12)
        .forEach(short => {

            trendingShortsContainer.appendChild(
                createShortCard(short)
            );
        });
}


function createShortCard(short) {

    const article =
        document.createElement("article");

    article.className =
        "nv-short-card";

    article.dataset.id =
        short.id;

    const title =
        short.title ||
        "Short sans titre";

    const thumbnail =
        short.thumbnail_url ||
        short.thumbnailUrl ||
        short.video_thumbnail_url ||
        "images/default-thumbnail.jpg";

    const avatar =
        short.channelAvatar ||
        short.channels?.avatar_url ||
        short.avatar_url ||
        "images/default-avatar.png";

    const channelName =
        short.channelName ||
        short.channels?.name ||
        short.channel_name ||
        "Chaîne NetView";

    const views =
        toNumber(
            short.views ??
            short.view_count ??
            short.views_count
        );

    article.innerHTML = `
        <a
            href="player.html?short=${encodeURIComponent(short.id)}"
            class="nv-short-link"
        >

            <div class="nv-short-thumbnail">

                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

            </div>

            <div class="nv-short-info">

                <div class="nv-short-avatar">
                    <img
                        src="${escapeAttribute(avatar)}"
                        alt="${escapeAttribute(channelName)}"
                        loading="lazy"
                    >
                </div>

                <div>

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <p>
                        ${escapeHTML(channelName)}
                    </p>

                    <p>
                        ${formatViews(views)} vues
                    </p>

                </div>

            </div>

        </a>
    `;

    return article;
}


// ==========================================
// Lives
// ==========================================

function renderTrendingLives() {

    if (!trendingLivesContainer) {
        return;
    }

    trendingLivesContainer.innerHTML = "";

    trendingLives
        .slice(0, 12)
        .forEach(live => {

            trendingLivesContainer.appendChild(
                createLiveCard(live)
            );
        });
}


function createLiveCard(live) {

    const article =
        document.createElement("article");

    article.className =
        "nv-live-card";

    article.dataset.id =
        live.id;

    const title =
        live.title ||
        "Live sans titre";

    const thumbnail =
        live.thumbnail_url ||
        live.thumbnailUrl ||
        live.cover_url ||
        "images/default-thumbnail.jpg";

    const avatar =
        live.channelAvatar ||
        live.channels?.avatar_url ||
        live.avatar_url ||
        "images/default-avatar.png";

    const channelName =
        live.channelName ||
        live.channels?.name ||
        live.channel_name ||
        "Chaîne NetView";

    const viewers =
        toNumber(
            live.viewers_count ??
            live.viewer_count ??
            live.current_viewers ??
            live.viewers
        );

    article.innerHTML = `
        <a
            href="live.html?id=${encodeURIComponent(live.id)}"
            class="nv-live-link"
        >

            <div class="nv-live-thumbnail">

                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

                <span class="nv-live-badge">
                    <i class="fa-solid fa-circle"></i>
                    EN DIRECT
                </span>

            </div>

            <div class="nv-live-content">

                <img
                    class="nv-live-avatar"
                    src="${escapeAttribute(avatar)}"
                    alt="${escapeAttribute(channelName)}"
                    loading="lazy"
                >

                <div class="nv-live-info">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <p>
                        ${escapeHTML(channelName)}
                    </p>

                    <span>
                        ${formatViews(viewers)}
                        spectateurs
                    </span>

                </div>

            </div>

        </a>
    `;

    return article;
}


// ==========================================
// Produits sponsorisés
// ==========================================

function renderTrendingProducts() {

    if (!trendingProductsContainer) {
        return;
    }

    trendingProductsContainer.innerHTML = "";

    trendingProducts
        .slice(0, 12)
        .forEach(product => {

            trendingProductsContainer.appendChild(
                createProductCard(product)
            );
        });
}


function createProductCard(product) {

    const article =
        document.createElement("article");

    article.className =
        "nv-product-card";

    article.dataset.id =
        product.id;

    const title =
        product.title ||
        "Produit";

    const image =
        product.thumbnail_path ||
        product.preview_path ||
        product.image_url ||
        product.thumbnail_url ||
        "images/default-product.jpg";

    const storeName =
        product.stores?.name ||
        product.store_name ||
        "Boutique NetView";

    const category =
        product.product_categories?.name ||
        product.category ||
        "";

    const price =
        formatPrice(
            product.price
        );

    article.innerHTML = `
        <a
            href="product.html?id=${encodeURIComponent(product.id)}"
            class="nv-product-link"
        >

            <div class="nv-product-thumbnail">

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

                <span class="nv-product-sponsored">
                    Sponsorisé
                </span>

            </div>

            <div class="nv-product-content">

                ${
                    category
                        ? `
                            <span
                                class="nv-product-category-tag"
                            >
                                ${escapeHTML(category)}
                            </span>
                        `
                        : ""
                }

                <h3 class="nv-product-title">
                    ${escapeHTML(title)}
                </h3>

                <p class="nv-product-store">
                    ${escapeHTML(storeName)}
                </p>

                <div class="nv-product-footer">

                    <strong class="nv-product-price">
                        ${price}
                    </strong>

                    <span
                        class="nv-product-buy-btn"
                    >
                        <i class="fa-solid fa-bag-shopping"></i>
                        Acheter
                    </span>

                </div>

            </div>

        </a>
    `;

    return article;
}


// ==========================================
// Classement
// ==========================================

function renderTrendingRanking() {

    if (!trendingRankingContainer) {
        return;
    }

    trendingRankingContainer.innerHTML = "";

    const ranking =
        trendingVideos.slice(0, 10);

    ranking.forEach(
        (video, index) => {

            const item =
                createRankingItem(
                    video,
                    index + 1
                );

            trendingRankingContainer.appendChild(
                item
            );
        }
    );
}


function createRankingItem(
    video,
    rank
) {

    const item =
        document.createElement("article");

    item.className =
        "nv-ranking-item";

    item.dataset.id =
        video.id;

    const title =
        video.title ||
        "Vidéo sans titre";

    const thumbnail =
        video.thumbnail_url ||
        video.thumbnailUrl ||
        "images/default-thumbnail.jpg";

    const avatar =
        video.channelAvatar ||
        video.channels?.avatar_url ||
        video.avatar_url ||
        "images/default-avatar.png";

    const channelName =
        video.channelName ||
        video.channels?.name ||
        video.channel_name ||
        "Chaîne NetView";

    const views =
        toNumber(
            video.views ??
            video.view_count ??
            video.views_count
        );

    item.innerHTML = `
        <a
            href="player.html?id=${encodeURIComponent(video.id)}"
            class="nv-ranking-link"
        >

            <span class="nv-ranking-position">
                ${rank}
            </span>

            <div class="nv-ranking-thumbnail">
                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >
            </div>

            <div class="nv-ranking-info">

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <div class="nv-ranking-channel">

                    <img
                        src="${escapeAttribute(avatar)}"
                        alt="${escapeAttribute(channelName)}"
                        loading="lazy"
                    >

                    <span>
                        ${escapeHTML(channelName)}
                    </span>

                </div>

                <span class="nv-ranking-views">
                    ${formatViews(views)} vues
                </span>

            </div>

        </a>
    `;

    return item;
}


// ==========================================
// Menu contextuel vidéo
// ==========================================

function openContextMenu(
    event,
    video
) {

    if (!contextMenu) {
        return;
    }

    const videoId =
        video?.id;

    if (!videoId) {
        return;
    }

    contextMenu.innerHTML = `
        <button
            type="button"
            data-action="watch"
        >
            <i class="fa-solid fa-play"></i>
            Regarder
        </button>

        <button
            type="button"
            data-action="share"
        >
            <i class="fa-solid fa-share"></i>
            Partager
        </button>

        <button
            type="button"
            data-action="channel"
        >
            <i class="fa-solid fa-user"></i>
            Voir la chaîne
        </button>
    `;

    contextMenu.hidden = false;

    const x =
