// ==========================================
// NetView
// pages/trending.js
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
    getSponsoredProducts,
    getVideoCategories
} from "../core/data.js";

import {
    showLoader,
    hideLoader
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";


// ==========================================
// DOM
// ==========================================

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

const trendingVideosContainer =
    document.getElementById("trendingVideos");

const trendingShortsContainer =
    document.getElementById("trendingShorts");

const trendingProductsContainer =
    document.getElementById("trendingProducts");

const moreTrendingVideosContainer =
    document.getElementById("moreTrendingVideos");

const trendingSkeleton =
    document.getElementById("trendingSkeleton");

const trendingEmpty =
    document.getElementById("trendingEmpty");

const categoriesContainer =
    document.querySelector(".nv-categories-scroll");


// ==========================================
// État
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

document.addEventListener(
    "DOMContentLoaded",
    init
);


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

        console.error(
            "Erreur initialisation tendances :",
            error
        );

    } finally {

        hideLoader();
    }
}


// ==========================================
// Session
// ==========================================

async function checkSession() {

    try {

        const session =
            await getSession();

        if (!session) {
            currentUser = null;
            return;
        }

        currentUser =
            await getUser();

    } catch (error) {

        console.error(
            "Erreur vérification session :",
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

        /*
         * getProfile() récupère lui-même
         * l'utilisateur connecté.
         */
        currentProfile =
            await getProfile();

    } catch (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );

        currentProfile = null;
    }
}


// ==========================================
// Header
// ==========================================

function updateHeader() {

    if (!currentUser) {
        showGuestHeader();
        return;
    }

    showUserHeader();
}


function showGuestHeader() {

    if (!headerRight) return;

    headerRight.innerHTML = `
        <button
            id="loginButton"
            class="nv-login-button"
            type="button"
        >
            <i class="fa-regular fa-user"></i>
            <span>S'identifier</span>
        </button>
    `;

    const loginButton =
        document.getElementById("loginButton");

    loginButton?.addEventListener(
        "click",
        () => navigate("auth.html")
    );
}


function showUserHeader() {

    if (!headerRight) return;

    const avatar =
        currentProfile?.avatar_url ||
        "images/default-avatar.png";

    headerRight.innerHTML = `
        <button
            id="uploadButton"
            class="nv-icon-button"
            type="button"
            title="Publier"
            aria-label="Publier"
        >
            <i class="fa-solid fa-plus nv-plus-icon"></i>
        </button>

        <button
            id="notificationsButton"
            class="nv-icon-button"
            type="button"
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
            aria-label="Paramètres du compte"
        >
            <img
                id="headerAvatar"
                src="${escapeAttribute(avatar)}"
                alt="Avatar"
            >
        </a>
    `;

    document
        .getElementById("uploadButton")
        ?.addEventListener(
            "click",
            () => navigate("publish.html")
        );
}


// ==========================================
// Sidebar
// ==========================================

function updateSidebar() {

    if (currentUser) {
        showUserSidebar();
    } else {
        showGuestSidebar();
    }
}


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

        <a
            href="trending.html"
            class="active"
        >
            <i class="fa-solid fa-fire"></i>
            <span>Tendances</span>
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

        <a
            href="trending.html"
            class="active"
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
// Chargement des tendances
// ==========================================

async function loadTrendingContent() {

    if (isLoading) return;

    try {

        isLoading = true;

        if (trendingSkeleton) {
            trendingSkeleton.hidden = false;
        }

        const [
            videosData,
            shortsData,
            productsData
        ] = await Promise.all([
            loadTrendingVideos(),
            loadTrendingShorts(),
            loadTrendingProducts()
        ]);

        trendingVideos =
            Array.isArray(videosData)
                ? videosData
                : [];

        trendingShorts =
            Array.isArray(shortsData)
                ? shortsData
                : [];

        trendingProducts =
            Array.isArray(productsData)
                ? productsData
                : [];

        renderAllTrending();

    } catch (error) {

        console.error(
            "Erreur chargement tendances :",
            error
        );

        trendingVideos = [];
        trendingShorts = [];
        trendingProducts = [];

        renderAllTrending();

    } finally {

        isLoading = false;

        if (trendingSkeleton) {
            trendingSkeleton.hidden = true;
        }
    }
}


// ==========================================
// Vidéos tendance
// ==========================================

async function loadTrendingVideos() {

    const videos =
        await getVideos({
            page: 1
        });

    if (!Array.isArray(videos)) {
        return [];
    }

    let filtered =
        [...videos];

    /*
     * getVideos() récupère déjà uniquement :
     *
     * status = published
     * visibility = public
     *
     * On filtre ensuite la catégorie
     * côté interface.
     */
    if (
        currentCategory &&
        currentCategory !== "all"
    ) {

        filtered =
            filtered.filter(video => {

                const categoryId =
                    video.video_category_id ||
                    video.category_id;

                const categoryName =
                    video.categoryName ||
                    video.category ||
                    "";

                return (
                    String(categoryId) ===
                    String(currentCategory)
                ) ||
                String(categoryName).toLowerCase() ===
                    String(currentCategory).toLowerCase()
                );
            });
    }

    /*
     * Classement tendance :
     *
     * 1. vues
     * 2. likes
     * 3. date de publication
     *
     * Le score favorise les contenus
     * qui ont à la fois de l'engagement
     * et de la popularité.
     */
    filtered.sort((a, b) => {

        const scoreA =
            calculateTrendingScore(a);

        const scoreB =
            calculateTrendingScore(b);

        return scoreB - scoreA;
    });

    return filtered;
}


function calculateTrendingScore(video) {

    const views =
        Number(
            video.views ??
            video.views_count ??
            0
        );

    const likes =
        Number(
            video.likes ??
            video.likes_count ??
            0
        );

    const comments =
        Number(
            video.comments ??
            video.comments_count ??
            0
        );

    const shares =
        Number(
            video.shares ??
            video.shares_count ??
            0
        );

    const publishedAt =
        video.published_at ||
        video.created_at;

    let freshness = 0;

    if (publishedAt) {

        const ageHours =
            Math.max(
                1,
                (
                    Date.now() -
                    new Date(publishedAt).getTime()
                ) / 3600000
            );

        /*
         * Les contenus récents ont
         * un bonus de fraîcheur.
         */
        freshness =
            10000 /
            Math.pow(ageHours, 0.35);
    }

    return (
        Math.log10(views + 1) * 100 +
        Math.log10(likes + 1) * 50 +
        Math.log10(comments + 1) * 30 +
        Math.log10(shares + 1) * 40 +
        freshness
    );
}


// ==========================================
// Shorts tendance
// ==========================================

async function loadTrendingShorts() {

    const options = {};

    if (
        currentCategory &&
        currentCategory !== "all"
    ) {

        options.category =
            currentCategory;
    }

    try {

        const shorts =
            await getShorts(options);

        if (!Array.isArray(shorts)) {
            return [];
        }

        return [...shorts].sort(
            (a, b) =>
                calculateShortScore(b) -
                calculateShortScore(a)
        );

    } catch (error) {

        console.error(
            "Erreur chargement Shorts tendance :",
            error
        );

        return [];
    }
}


function calculateShortScore(short) {

    const views =
        Number(
            short.views ??
            short.views_count ??
            0
        );

    const likes =
        Number(
            short.likes ??
            short.likes_count ??
            0
        );

    const comments =
        Number(
            short.comments ??
            short.comments_count ??
            0
        );

    return (
        Math.log10(views + 1) * 100 +
        Math.log10(likes + 1) * 60 +
        Math.log10(comments + 1) * 30
    );
}


// ==========================================
// Produits tendance
// ==========================================

async function loadTrendingProducts() {

    try {

        const products =
            await getSponsoredProducts();

        if (!Array.isArray(products)) {
            return [];
        }

        /*
         * getSponsoredProducts() retourne
         * les produits sponsorisés publiés.
         *
         * On conserve les plus récents.
         */
        return [...products]
            .sort((a, b) => {

                const dateA =
                    new Date(
                        a.created_at || 0
                    ).getTime();

                const dateB =
                    new Date(
                        b.created_at || 0
                    ).getTime();

                return dateB - dateA;
            });

    } catch (error) {

        console.error(
            "Erreur produits tendance :",
            error
        );

        return [];
    }
}


// ==========================================
// Rendu global
// ==========================================

function renderAllTrending() {

    const hasContent =
        trendingVideos.length > 0 ||
        trendingShorts.length > 0 ||
        trendingProducts.length > 0;

    if (trendingEmpty) {
        trendingEmpty.hidden =
            hasContent;
    }

    renderTrendingVideos();
    renderTrendingShorts();
    renderTrendingProducts();
    renderMoreTrendingVideos();
}


// ==========================================
// Vidéos principales
// ==========================================

function renderTrendingVideos() {

    if (!trendingVideosContainer) {
        return;
    }

    trendingVideosContainer.innerHTML = "";

    if (!trendingVideos.length) {
        return;
    }

    const mainVideos =
        trendingVideos.slice(0, 5);

    mainVideos.forEach(
        (video, index) => {

            const card =
                createTrendingVideoCard(
                    video,
                    index + 1
                );

            trendingVideosContainer
                .appendChild(card);
        }
    );
}


// ==========================================
// Shorts
// ==========================================

function renderTrendingShorts() {

    if (!trendingShortsContainer) {
        return;
    }

    trendingShortsContainer.innerHTML = "";

    if (!trendingShorts.length) {
        return;
    }

    trendingShorts.forEach(short => {

        const card =
            createShortCard(short);

        trendingShortsContainer
            .appendChild(card);
    });
}


// ==========================================
// Produits
// ==========================================

function renderTrendingProducts() {

    if (!trendingProductsContainer) {
        return;
    }

    trendingProductsContainer.innerHTML = "";

    if (!trendingProducts.length) {
        return;
    }

    trendingProducts.forEach(product => {

        const card =
            createProductCard(product);

        trendingProductsContainer
            .appendChild(card);
    });
}


// ==========================================
// Plus de vidéos
// ==========================================

function renderMoreTrendingVideos() {

    if (!moreTrendingVideosContainer) {
        return;
    }

    moreTrendingVideosContainer.innerHTML = "";

    if (trendingVideos.length <= 5) {
        return;
    }

    const remainingVideos =
        trendingVideos.slice(5);

    remainingVideos.forEach(
        (video, index) => {

            const card =
                createTrendingVideoCard(
                    video,
                    index + 6
                );

            moreTrendingVideosContainer
                .appendChild(card);
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
        video.id || "";

    const videoId =
        video.id || "";

    const title =
        video.title || "Vidéo sans titre";

    const thumbnail =
        video.thumbnailUrl ||
        video.thumbnail_url ||
        "images/default-thumbnail.jpg";

    const avatar =
        video.channelAvatar ||
        video.avatar_url ||
        "images/default-avatar.png";

    const channelName =
        video.channelName ||
        video.channel_name ||
        "Chaîne inconnue";

    const duration =
        formatDuration(
            video.duration
        );

    const views =
        video.views ??
        video.views_count ??
        0;

    const publishedAt =
        video.published_at ||
        video.created_at;

    article.innerHTML = `
        <div class="nv-trending-rank">
            ${rank}
        </div>

        <a
            href="player.html?id=${encodeURIComponent(videoId)}"
            class="nv-video-link-wrapper"
        >
            <div class="nv-video-thumbnail">

                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

                <span class="nv-video-duration">
                    ${escapeHTML(duration)}
                </span>

            </div>
        </a>

        <div class="nv-video-content">

            <div class="nv-video-avatar">

                <img
                    src="${escapeAttribute(avatar)}"
                    alt="${escapeAttribute(channelName)}"
                    loading="lazy"
                >

            </div>

            <div class="nv-video-info">

                <h3 class="nv-video-title">

                    <a
                        href="player.html?id=${encodeURIComponent(videoId)}"
                    >
                        ${escapeHTML(title)}
                    </a>

                </h3>

                <a
                    href="channel.html?handle=${encodeURIComponent(
                        video.channelHandle || ""
                    )}"
                    class="nv-video-channel"
                >
                    ${escapeHTML(channelName)}
                </a>

                <div class="nv-video-meta">

                    <span>
                        ${escapeHTML(
                            formatViews(views)
                        )} vues
                    </span>

                    <span>•</span>

                    <span>
                        ${escapeHTML(
                            formatDate(publishedAt)
                        )}
                    </span>

                </div>

            </div>

            <button
                class="nv-icon-button nv-video-menu-btn nv-video-menu"
                type="button"
                data-video="${escapeAttribute(videoId)}"
                aria-label="Actions"
            >
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

        </div>
    `;

    return article;
}


// ==========================================
// Carte Short
// ==========================================

function createShortCard(short) {

    const article =
        document.createElement("article");

    article.className =
        "nv-short-card";

    article.dataset.id =
        short.id || "";

    const shortId =
        short.id || "";

    const title =
        short.title ||
        "Short sans titre";

    const thumbnail =
        short.thumbnail_url ||
        short.thumbnailUrl ||
        "images/default-thumbnail.jpg";

    const views =
        short.views ??
        short.views_count ??
        0;

    article.innerHTML = `
        <a
            href="player.html?short=${encodeURIComponent(shortId)}"
        >

            <div class="nv-short-thumbnail">

                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

            </div>

            <div class="nv-short-info">

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <p>
                    ${escapeHTML(
                        formatViews(views)
                    )} vues
                </p>

            </div>

        </a>
    `;

    return article;
}


// ==========================================
// Carte produit
// ==========================================

function createProductCard(product) {

    const article =
        document.createElement("article");

    article.className =
        "nv-product-card";

    article.dataset.id =
        product.id || "";

    const title =
        product.title ||
        "Produit";

    const image =
        product.thumbnail_path ||
        product.preview_path ||
        product.image_url ||
        "images/default-product.jpg";

    const badge =
        product.badge ||
        "";

    const category =
        product.category ||
        product.category_name ||
        product.product_categories?.name ||
        "Produit";

    const price =
        formatProductPrice(
            product.price
        );

    article.innerHTML = `
        <div class="nv-product-badge-container">

            ${
                badge
                    ? `
                        <span class="nv-product-badge">
                            ${escapeHTML(badge)}
                        </span>
                    `
                    : ""
            }

            <button
                class="nv-product-wishlist"
                type="button"
                aria-label="Ajouter aux favoris"
            >
                <i class="fa-regular fa-heart"></i>
            </button>

        </div>

        <a
            href="product.html?id=${encodeURIComponent(
                product.id || ""
            )}"
        >

            <div class="nv-product-thumbnail">

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

            </div>

        </a>

        <div class="nv-product-content">

            <div class="nv-product-category-tag">
                ${escapeHTML(category)}
            </div>

            <h3 class="nv-product-title">
                ${escapeHTML(title)}
            </h3>

            <div class="nv-product-footer">

                <div class="nv-product-price-box">

                    <span class="nv-product-price">
                        ${escapeHTML(price)}
                    </span>

                </div>

                <button
                    class="nv-product-buy-btn"
                    type="button"
                    data-product="${escapeAttribute(
                        product.id || ""
                    )}"
                    aria-label="Acheter le produit"
                >
                    <i class="fa-solid fa-bag-shopping"></i>
                    <span>Acheter</span>
                </button>

            </div>

        </div>
    `;

    return article;
}


// ==========================================
// Catégories
// ==========================================

async function loadCategoriesList() {

    if (!categoriesContainer) {
        return;
    }

    try {

        const categories =
            await getVideoCategories();

        renderCategories(
            Array.isArray(categories)
                ? categories
                : []
        );

    } catch (error) {

        console.error(
            "Erreur chargement catégories :",
            error
        );
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
        "nv-category";

    if (currentCategory === "all") {
        allButton.classList.add("active");
    }

    allButton.dataset.category = "all";
    allButton.textContent = "Tous";

    categoriesContainer
        .appendChild(allButton);


    categories.forEach(category => {

        if (!category) return;

        const id =
            category.id ||
            category.name;

        const name =
            category.name ||
            "Catégorie";

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "nv-category";

        if (
            String(currentCategory) ===
            String(id)
        ) {
            button.classList.add("active");
        }

        button.dataset.category =
            id;

        button.textContent =
            name;

        categoriesContainer
            .appendChild(button);
    });
}


// ==========================================
// Événements
// ==========================================

function addEventListeners() {

    menuButton?.addEventListener(
        "click",
        toggleSidebar
    );

    sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );

    searchForm?.addEventListener(
        "submit",
        handleSearchSubmit
    );


    categoriesContainer?.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    ".nv-category"
                );

            if (!button) return;

            const category =
                button.dataset.category;

            if (!category) return;

            if (
                category ===
                currentCategory
            ) {
                return;
            }

            currentCategory =
                category;

            categoriesContainer
                .querySelectorAll(
                    ".nv-category"
                )
                .forEach(item => {

                    item.classList.toggle(
                        "active",
                        item === button
                    );
                });

            await loadTrendingContent();
        }
    );


    sidebarNav?.addEventListener(
        "click",
        async event => {

            const logout =
                event.target.closest(
                    "#logoutButton"
                );

            if (!logout) {
                return;
            }

            event.preventDefault();

            try {

                await signOut();

                currentUser = null;
                currentProfile = null;

                navigate("auth.html");

            } catch (error) {

                console.error(
                    "Erreur déconnexion :",
                    error
                );
            }
        }
    );


    /*
     * Actions produits.
     */
    document.addEventListener(
        "click",
        event => {

            const buyButton =
                event.target.closest(
                    ".nv-product-buy-btn"
                );

            if (buyButton) {

                const productId =
                    buyButton.dataset.product;

                if (productId) {

                    navigate(
                        `product.html?id=${encodeURIComponent(
                            productId
                        )}`
                    );
                }

                return;
            }


            const wishlistButton =
                event.target.closest(
                    ".nv-product-wishlist"
                );

            if (wishlistButton) {

                if (!currentUser) {

                    navigate("auth.html");
                    return;
                }

                /*
                 * Le système de favoris produit
                 * sera connecté au module marketplace.
                 */
                wishlistButton.classList.toggle(
                    "active"
                );

                const icon =
                    wishlistButton.querySelector(
                        "i"
                    );

                icon?.classList.toggle(
                    "fa-regular"
                );

                icon?.classList.toggle(
                    "fa-solid"
                );
            }
        }
    );
}


// ==========================================
// Recherche
// ==========================================

function handleSearchSubmit(event) {

    event?.preventDefault();

    if (!searchInput) {
        return;
    }

    const query =
        searchInput.value.trim();

    if (!query) {
        return;
    }

    navigate(
        `search.html?q=${encodeURIComponent(
            query
        )}`
    );
}


// ==========================================
// Sidebar
// ==========================================

function toggleSidebar() {

    if (sidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}


function openSidebar() {

    sidebarOpen = true;

    sidebar?.classList.add(
        "active"
    );

    sidebarOverlay?.classList.add(
        "active"
    );

    menuButton?.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeSidebar() {

    sidebarOpen = false;

    sidebar?.classList.remove(
        "active"
    );

    sidebarOverlay?.classList.remove(
        "active"
    );

    menuButton?.setAttribute(
        "aria-expanded",
        "false"
    );
}


// ==========================================
// Formatage durée
// ==========================================

function formatDuration(
    totalSeconds
) {

    if (
        totalSeconds === null ||
        totalSeconds === undefined ||
        totalSeconds === ""
    ) {
        return "00:00";
    }

    /*
     * PostgreSQL peut retourner
     * certaines durées sous forme
     * de nombre ou de chaîne.
     */
    const numeric =
        Number(totalSeconds);

    if (
        !Number.isFinite(numeric) ||
        numeric < 0
    ) {
        return "00:00";
    }

    const total =
        Math.floor(numeric);

    const hours =
        Math.floor(
            total / 3600
        );

    const minutes =
        Math.floor(
            (total % 3600) / 60
        );

    const seconds =
        total % 60;

    const mm =
        String(minutes)
            .padStart(2, "0");

    const ss =
        String(seconds)
            .padStart(2, "0");

    if (hours > 0) {

        const hh =
            String(hours)
                .padStart(2, "0");

        return `${hh}:${mm}:${ss}`;
    }

    return `${mm}:${ss}`;
}


// ==========================================
// Formatage vues
// ==========================================

function formatViews(views) {

    const value =
        Number(views) || 0;

    if (value >= 1_000_000_000) {

        return (
            value / 1_000_000_000
        )
            .toFixed(1)
            .replace(".0", "") +
            " Md";
    }

    if (value >= 1_000_000) {

        return (
            value / 1_000_000
        )
            .toFixed(1)
            .replace(".0", "") +
            " M";
    }

    if (value >= 1_000) {

        return (
            value / 1_000
        )
            .toFixed(1)
            .replace(".0", "") +
            " k";
    }

    return String(value);
}


// ==========================================
// Formatage date
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "Il y a un moment";
    }

    const date =
        new Date(dateString);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Il y a un moment";
    }

    const now =
        new Date();

    const diffTime =
        Math.max(
            0,
            now.getTime() -
            date.getTime()
        );

    const diffMinutes =
        Math.floor(
            diffTime /
            (1000 * 60)
        );

    const diffHours =
        Math.floor(
            diffTime /
            (1000 * 60 * 60)
        );

    const diffDays =
        Math.floor(
            diffTime /
            (1000 * 60 * 60 * 24)
        );

    if (diffMinutes < 1) {
        return "À l'instant";
    }

    if (diffMinutes < 60) {
        return `Il y a ${diffMinutes} min`;
    }

    if (diffHours < 24) {
        return `Il y a ${diffHours} h`;
    }

    if (diffDays === 1) {
        return "Hier";
    }

    if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
    }

    if (diffDays < 30) {

        const weeks =
            Math.floor(
                diffDays / 7
            );

        return `Il y a ${weeks} semaine${
            weeks > 1 ? "s" : ""
        }`;
    }

    if (diffDays < 365) {

        const months =
            Math.floor(
                diffDays / 30
            );

        return `Il y a ${months} mois`;
    }

    const years =
        Math.floor(
            diffDays / 365
        );

    return `Il y a ${years} an${
        years > 1 ? "s" : ""
    }`;
}


// ==========================================
// Formatage prix
// ==========================================

function formatProductPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "0,00 €";
    }

    const numeric =
        Number(price);

    if (
        !Number.isFinite(numeric)
    ) {
        return String(price);
    }

    return new Intl.NumberFormat(
        "fr-FR",
        {
            style: "currency",
            currency: "EUR"
        }
    ).format(numeric);
}


// ==========================================
// Sécurité HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value);
}
