// ==========================================
// NetView
// index.js
// ==========================================


// ==========================================
// Imports
// ==========================================

import{
    getSession,
    getUser,
    signOut
}from "../core/auth.js";

import{
    getProfile,
    getVideos,
    getShorts,
    getLives,
    getSponsoredProducts,
    getVideoCategories
}from "../core/data.js";

import{
    showLoader,
    hideLoader,
    buttonLoading
}from "../core/ui.js";

import{
    navigate
}from "../core/navigation.js";


// ==========================================
// Header
// ==========================================

const menuButton =
    document.getElementById(
        "menuButton"
    );

const searchForm =
    document.getElementById(
        "searchForm"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const searchButton =
    searchForm?.querySelector(
        ".nv-search-button"
    );

const headerRight =
    document.getElementById(
        "headerRight"
    );

const uploadButton =
    document.getElementById(
        "uploadButton"
    );

const notificationsButton =
    document.getElementById(
        "notificationsButton"
    );

const notificationBadge =
    document.getElementById(
        "notificationBadge"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const headerAvatar =
    document.getElementById(
        "headerAvatar"
    );


// ==========================================
// Sidebar
// ==========================================

const sidebar =
    document.getElementById(
        "sidebar"
    );

const sidebarNav =
    sidebar?.querySelector(
        ".nv-sidebar-nav"
    );

const sidebarOverlay =
    document.getElementById(
        "sidebarOverlay"
    );


// ==========================================
// Categories
// ==========================================

const categoriesContainer =
    document.querySelector(
        ".nv-categories-scroll"
    );


// ==========================================
// Home
// ==========================================

const videosGrid =
    document.getElementById(
        "videosGrid"
    );

const videosFeed =
    document.getElementById(
        "videosFeed"
    );

const videosFeedContinue =
    document.getElementById(
        "videosFeedContinue"
    );

const videosBeforeInfinite =
    document.getElementById(
        "videosBeforeInfinite"
    );

const shortsGrid =
    document.getElementById(
        "shortsGrid"
    );

const shortsGridContinue =
    document.getElementById(
        "shortsGridContinue"
    );

const livesContainer =
    document.getElementById(
        "livesContainer"
    );

const productsContainer =
    document.getElementById(
        "productsContainer"
    );


// ==========================================
// UI
// ==========================================

const infiniteLoader =
    document.getElementById(
        "infiniteLoader"
    );

const skeletonContainer =
    document.getElementById(
        "skeletonContainer"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const contextMenu =
    document.getElementById(
        "contextMenu"
    );

const pageLoader =
    document.querySelector(
        ".nv-page-loader"
    );

const notification =
    document.getElementById(
        "notification"
    );


// ==========================================
// Global Variables
// ==========================================

let currentUser =
    null;

let currentProfile =
    null;

let videos =
    [];

let shorts =
    [];

let lives =
    [];

let products =
    [];

let sidebarOpen =
    false;

let currentCategory =
    "Tous";

let isLoading =
    false;

let hasMoreVideos =
    true;

let currentPage =
    1;

let searchQuery =
    "";

let infiniteScrollObserver =
    null;


// ==========================================
// Initialisation
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


// ==========================================
// Init
// ==========================================
async function init(){

    try{

        showLoader();

        await checkSession();

        await loadProfile();

        fillHeader();

        fillSidebar();

        // ➕ Appel de la fonction pour charger et afficher les catégories
        await loadCategories();

        await loadHomeContent();

        addEventListeners();

    }

    catch(error){

        console.error(error);

    }

    finally{

        hideLoader();

    }

}

// Définition de loadCategories en dehors de init()
async function loadCategories() {
    const categories = await getVideoCategories();
    
    // Ajout de "Tous" au début de la liste
    const allCategories = [{ id: "Tous", name: "Tous" }, ...categories];
    
    renderCategories(allCategories);
}

// ==========================================
// Vérification Session
// ==========================================

async function checkSession(){

    try{

        const session =
            await getSession();

        if(!session){

            currentUser = null;

            return;

        }

        currentUser =
            await getUser();

    }

    catch(error){

        console.error(error);

        currentUser = null;

    }

}


// ==========================================
// Chargement Profil
// ==========================================

async function loadProfile(){

    if(!currentUser){

        currentProfile = null;

        return;

    }

    try{

        currentProfile =
            await getProfile(
                currentUser.id
            );

    }

    catch(error){

        console.error(error);

        currentProfile = null;

    }

}


// ==========================================
// Header
// ==========================================

function fillHeader(){

    updateHeader();

}


// ==========================================
// Sidebar
// ==========================================

function fillSidebar(){

    updateSidebar();

}


// ==========================================
// Toggle Sidebar
// ==========================================

function toggleSidebar(){

    if(sidebarOpen){

        closeSidebar();

    }

    else{

        openSidebar();

    }

}


// ==========================================
// Open Sidebar
// ==========================================

function openSidebar(){

    sidebarOpen = true;

    sidebar.classList.add(
        "active"
    );

    sidebarOverlay?.classList.add(
        "active"
    );

}


// ==========================================
// Close Sidebar
// ==========================================

function closeSidebar(){

    sidebarOpen = false;

    sidebar.classList.remove(
        "active"
    );

    sidebarOverlay?.classList.remove(
        "active"
    );

}


// ==========================================
// Update Header
// ==========================================

function updateHeader(){

    if(currentUser){

        showUserHeader();

    }

    else{

        showGuestHeader();

    }

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

    
    `;

}

// ==========================================
// Redirection vers la page de recherche
// ==========================================

function handleSearchSubmit(event) {
    if (event) {
        event.preventDefault(); // Empêche le rechargement de la page par défaut
    }

    if (!searchInput) return;

    const query = searchInput.value.trim();

    if (query) {
        // Redirige vers search.html avec le paramètre 'q' encodé proprement
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
}
// ==========================================
// Accueil
// Chargement des données
// ==========================================


// ==========================================
// Chargement Accueil
// ==========================================

async function loadHomeContent(){

    try{

        isLoading = true;

        showLoader();

        await Promise.all([

            loadVideos(),

            loadShorts(),

            loadLives(),

            loadSponsoredProducts()

        ]);

        renderVideos();

        renderShorts();

        renderLives();

        renderProducts();

    }

    catch(error){

        console.error(error);

    }

    finally{

        isLoading = false;

        hideLoader();

    }

}


// ==========================================
// Charger les vidéos
// ==========================================

async function loadVideos(){

    try{

        const data =
            await getVideos({

                category:
                    currentCategory,

                page:
                    currentPage,

                search:
                    searchQuery

            });


        videos =
            Array.isArray(data)
            ? data
            : [];


        hasMoreVideos =
            videos.length > 0;

    }

    catch(error){

        console.error(error);

        videos = [];

        hasMoreVideos = false;

    }

}


// ==========================================
// Charger les Shorts
// ==========================================

async function loadShorts(){

    try{

        const data =
            await getShorts({

                category:
                    currentCategory

            });


        shorts =
            Array.isArray(data)
            ? data
            : [];

    }

    catch(error){

        console.error(error);

        shorts = [];

    }

}


// ==========================================
// Charger les Lives
// ==========================================

async function loadLives(){

    try{

        const data =
            await getLives();


        lives =
            Array.isArray(data)
            ? data
            : [];

    }

    catch(error){

        console.error(error);

        lives = [];

    }

}


// ==========================================
// Charger les Produits Sponsorisés
// ==========================================

async function loadSponsoredProducts(){

    try{

        const data =
            await getSponsoredProducts();


        products =
            Array.isArray(data)
            ? data
            : [];

    }

    catch(error){

        console.error(error);

        products = [];

    }

}


// ==========================================
// Rendu du contenu
// ==========================================


function renderVideos(){
    // On cible uniquement les conteneurs réellement présents dans votre HTML principal
    const containers = [
        document.getElementById("videosGrid"),
        document.getElementById("videosBeforeInfinite")
    ];

    containers.forEach(container => {
        if(container){
            container.innerHTML = "";
        }
    });

    if(!videos || !videos.length){
        return;
    }

    videos.forEach(video => {
        const card = createVideoCard(video);

        containers.forEach(container => {
            if(container){
                container.appendChild(card.cloneNode(true));
            }
        });
    });
}

// ==========================================
// Render Shorts
// ==========================================

function renderShorts(){

    const containers = [

        shortsGrid,

        shortsGridContinue

    ];


    containers.forEach(container=>{

        if(!container)
            return;

        container.innerHTML = "";

    });


    if(!shorts.length){

        return;

    }


    shorts.forEach(short=>{

        const card =
            createShortCard(
                short
            );


        containers.forEach(container=>{

            if(container){

                container.appendChild(
                    card.cloneNode(true)
                );

            }

        });

    });

}



// ==========================================
// Render Lives
// ==========================================

function renderLives(){

    if(!livesContainer)
        return;


    livesContainer.innerHTML = "";


    if(!lives.length){

        return;

    }


    lives.forEach(live=>{

        livesContainer.appendChild(

            createLiveCard(
                live
            )

        );

    });

}



// ==========================================
// Render Products
// ==========================================

function renderProducts(){

    if(!productsContainer)
        return;


    productsContainer.innerHTML = "";


    if(!products.length){

        return;

    }


    products.forEach(product=>{

        productsContainer.appendChild(

            createProductCard(
                product
            )

        );

    });

}


// ==========================================
// Création des cartes
// ==========================================

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
// Video Card
// ==========================================


function createVideoCard(video) {
    const article = document.createElement("article");
    article.className = "nv-video-card";
    article.dataset.id = video.id || "";

    const formattedDuration = formatDuration(video.duration);
    
    article.innerHTML = `
        <a href="player.html?id=${video.id || ''}" class="nv-video-link-wrapper">
            <div class="nv-video-thumbnail">
                <img src="${video.thumbnail_url || 'default-thumb.jpg'}" alt="${video.title || ''}" loading="lazy">
                <span class="nv-video-duration">${video.duration || '0:00'}</span>
            </div>
        </a>
        <div class="nv-video-content">
            <div class="nv-video-avatar">
                <img src="${video.channelAvatar || 'images/default-avatar.png'}" alt="${video.channelName || ''}" loading="lazy">
            </div>
            <div class="nv-video-info">
                <h3 class="nv-video-title">
                    <a href="player.html?id=${video.id || ''}">${video.title || ''}</a>
                </h3>
                <a href="#" class="nv-video-channel">${video.channelName || ''}</a>
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

// ==========================================
// Short Card
// ==========================================

function createShortCard(short){

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "nv-short-card";

    article.dataset.id =
        short.id;

    article.innerHTML = `

        <a
            href="player.html?short=${short.id}">

            <div
                class="nv-short-thumbnail">

                <img
                    src="${short.thumbnail_url}"
                    alt="${short.title}">

            </div>

            <div
                class="nv-short-info">

                <h3>

                    ${short.title}

                </h3>

                <p>

                    ${formatViews(short.views)} vues

                </p>

            </div>

        </a>

    `;

    return article;

}


// ==========================================
// Live Card
// ==========================================

function createLiveCard(live){

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "nv-live-card";

    article.dataset.id =
        live.id;

    article.innerHTML = `

        <a
            href="live.html?id=${live.id}">

            <div
                class="nv-live-thumbnail">

                <img
                    src="${live.thumbnail_url}"
                    alt="${live.title}">

                <span
                    class="nv-live-badge">

                    LIVE

                </span>

            </div>

            <div
                class="nv-live-info">

                <h3>

                    ${live.title}

                </h3>

                <p>

                    ${live.channels?.name || 'Chaîne inconnue'}

                </p>

            </div>

        </a>

    `;

    return article;

}


// ==========================================
// Product Card
// ==========================================

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
                <div class="nv-product-overlay-actions">
                    <button class="nv-product-quick-view"><i class="fa-solid fa-eye"></i> Aperçu rapide</button>
                </div>
            </div>

            <div class="nv-product-content">
                <div class="nv-product-category-tag">${product.category || 'Lifestyle'}</div>
                <h3 class="nv-product-title">${product.title || ''}</h3>
                
                <div class="nv-product-rating">
                    <div class="nv-stars">
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star-half-stroke"></i>
                    </div>
                    <span class="nv-rating-count">(${product.reviewsCount || product.reviews_count || '128'})</span>
                </div>

                <div class="nv-product-footer">
                    <div class="nv-product-price-box">
                        <span class="nv-product-price">${product.price || '0,00 €'}</span>
                        ${product.oldPrice || product.old_price ? `<span class="nv-product-old-price">${product.oldPrice || product.old_price}</span>` : ''}
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
// Recherche + Catégories
// ==========================================


// ==========================================
// Charger les catégories
// ==========================================

function renderCategories(categories) {
    if (!categoriesContainer) return;

    categoriesContainer.innerHTML = "";

    categories.forEach(cat => {
        const button = document.createElement("button");
        button.className = `nv-category-chip ${cat.name === currentCategory ? "active" : ""}`;
        button.textContent = cat.name;
        button.dataset.id = cat.id;

        button.addEventListener("click", () => {
            // Gestion de la classe active
            categoriesContainer.querySelectorAll(".nv-category-chip").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            // Mise à jour de la catégorie courante et rechargement des vidéos
            currentCategory = cat.name === "Tous" ? "Tous" : cat.id;
            currentPage = 1;
            loadHomeContent();
        });

        categoriesContainer.appendChild(button);
    });
}

// ==========================================
// Recherche
// ==========================================

async function searchVideos(query){

    searchQuery = query.trim();

    currentPage = 1;

    await loadVideos();

    renderVideos();

}

// ==========================================

// Événements

// ==========================================



function addEventListeners(){



    // ======================================

    // Sidebar

    // ======================================



    menuButton?.addEventListener(

        "click",

        toggleSidebar

    );



    sidebarOverlay?.addEventListener(

        "click",

        closeSidebar

    );





    // ======================================

    // Recherche

    // ======================================



    searchForm?.addEventListener(

        "submit",

        async(event)=>{



            event.preventDefault();



            await searchVideos(

                searchInput.value

            );



        }

    );





    searchInput?.addEventListener(

        "keydown",

        async(event)=>{



            if(event.key !== "Enter")

                return;



            event.preventDefault();



            await searchVideos(

                searchInput.value

            );



        }

    );





    // ======================================

    // Catégories

    // ======================================



    categoriesContainer?.addEventListener(

        "click",

        async(event)=>{



            const button =

                event.target.closest(

                    ".nv-category"

                );



            if(!button)

                return;



            await changeCategory(

                button.dataset.category

            );



        }

    );





    // ======================================

    // Header (délégation)

    // ======================================



    headerRight?.addEventListener(

        "click",

        async(event)=>{



            const login =

                event.target.closest(

                    "#loginButton"

                );



            if(login){



                navigate(

                    "auth.html"

                );



                return;



            }





            const upload =

                event.target.closest(

                    "#uploadButton"

                );



            if(upload){



                navigate(

                    "publish.html"

                );



                return;



            }





            const notifications =

                event.target.closest(

                    "#notificationsButton"

                );



            if(notifications){



                navigate(

                    "notification.html"

                );



                return;



            }



        }

    );





    // ======================================

    // Sidebar (délégation)

    // ======================================



    sidebarNav?.addEventListener(

        "click",

        async(event)=>{



            const logout =

                event.target.closest(

                    "#logoutButton"

                );



            if(!logout)

                return;



            event.preventDefault();



            await signOut();



            navigate(

                "auth.html"

            );



        }

    );





    // ======================================

    // Menus vidéos

    // ======================================



    document.addEventListener(

        "click",

        event=>{



            const menu =

                event.target.closest(

                    ".nv-video-menu"

                );



            if(menu){



                openContextMenu(

                    menu.dataset.video,

                    event.pageX,

                    event.pageY

                );



                return;



            }



            closeContextMenu();



        }

    );





    // ======================================

    // Infinite Scroll

    // ======================================



    window.addEventListener(

        "scroll",

        handleInfiniteScroll

    );





    // ======================================

    // Responsive

    // ======================================



    window.addEventListener(

        "resize",

        ()=>{



            if(window.innerWidth > 900){



                sidebarOverlay

                    ?.classList.remove(

                        "active"

                    );



            }



        }

    );



}





// ==========================================

// Infinite Scroll

// ==========================================



async function handleInfiniteScroll(){



    if(isLoading)

        return;



    if(!hasMoreVideos)

        return;



    const scrollPosition =



        window.innerHeight +



        window.scrollY;





    const pageHeight =



        document.body.offsetHeight;





    if(scrollPosition < pageHeight - 600)

        return;





    isLoading = true;



    currentPage++;



    try{



        const data =

            await getVideos({



                page:

                    currentPage,



                category:

                    currentCategory,



                search:

                    searchQuery



            });



        if(!data || !data.length){



            hasMoreVideos =

                false;



            return;



        }



        videos.push(

            ...data

        );



        renderVideos();



    }



    catch(error){



        console.error(error);



    }



    finally{



        isLoading = false;



    }



}





// ==========================================

// Context Menu

// ==========================================



function openContextMenu(

    videoId,

    x,

    y

){



    if(!contextMenu)

        return;



    contextMenu.dataset.video =

        videoId;



    contextMenu.style.left =

        `${x}px`;



    contextMenu.style.top =

        `${y}px`;



    contextMenu.classList.add(

        "active"

    );



}





function closeContextMenu(){



    contextMenu?.classList.remove(

        "active"

    );



}





// ==========================================

// Utilitaires

// ==========================================





// ==========================================

// Format Vues

// ==========================================



function formatViews(views){



    views =

        Number(views) || 0;



    if(views >= 1000000000){



        return (

            (views / 1000000000)

            .toFixed(1)

            .replace(".0","") +

            " Md"

        );



    }



    if(views >= 1000000){



        return (

            (views / 1000000)

            .toFixed(1)

            .replace(".0","") +

            " M"

        );



    }



    if(views >= 1000){



        return (

            (views / 1000)

            .toFixed(1)

            .replace(".0","") +

            " k"

        );



    }



    return views.toString();



}





// ==========================================

// Format Date

// ==========================================



function formatDate(date){



    if(!date)

        return "";



    const value =

        new Date(date);



    if(isNaN(value))

        return "";



    return value.toLocaleDateString(

        "fr-FR",

        {



            day:"2-digit",



            month:"short",



            year:"numeric"



        }



    );



}


// Dans votre fonction addEventListeners() :

if (searchForm) {
    searchForm.addEventListener("submit", handleSearchSubmit);
}

// Si vous avez aussi un bouton de recherche séparé qui ne déclenche pas le 'submit' du formulaire :
if (searchButton) {
    searchButton.addEventListener("click", handleSearchSubmit);
}
// ==========================================

// Notification

// ==========================================



function showNotification(



    message,



    type="success"



){



    if(!notification)

        return;



    notification.className =

        `notification ${type}`;



    notification.textContent =

        message;



    notification.classList.add(

        "show"

    );



    clearTimeout(

        notification.timer

    );



    notification.timer =

        setTimeout(()=>{



            notification.classList.remove(

                "show"

            );



        },3000);



}

// ==========================================
// Changer de catégorie
// ==========================================

async function changeCategory(category){

    currentCategory =
        category;

    currentPage = 1;

    await loadHomeContent();

    document
        .querySelectorAll(".nv-category")
        .forEach(button=>{

            button.classList.toggle(
                "active",
                button.dataset.category === category
            );

        });

}
// ==========================================
// Empty State
// ==========================================

function showEmptyState(container, message = "Aucun résultat."){
    if(!container)
        return;

    container.innerHTML = `
        <div class="nv-empty-state">
            <i class="fa-regular fa-folder-open"></i>
            <p>${message}</p>
        </div>
    `;
}

function hideEmptyState(container){
    if(!container)
        return;

    container.innerHTML = "";
}

// ==========================================
// Clear Containers
// ==========================================

function clearContainers(){
    [
        videosGrid,
        videosFeed,
        videosFeedContinue,
        videosBeforeInfinite,
        shortsGrid,
        shortsGridContinue,
        livesContainer,
        productsContainer
    ].forEach(container => {
        if(container){
            container.innerHTML = "";
        }
    });
}

// ==========================================
// NetView
// index.js (Suite et fin)
// ==========================================

// ==========================================
// Réinitialisation des données
// ==========================================

function resetData(){
    videos = [];
    shorts = [];
    lives = [];
    products = [];
    currentPage = 1;
    hasMoreVideos = true;
    searchQuery = "";
}

// ==========================================
// Gestionnaire d'événement Resize (Déclaré proprement)
// ==========================================

function handleResize(){
    if(window.innerWidth > 900){
        sidebarOverlay?.classList.remove("active");
    }
}

// ==========================================
// Cleanup
// ==========================================

function destroy(){
    window.removeEventListener(
        "scroll",
        handleInfiniteScroll
    );

    // ✅ Correction : Utilisation de la référence de fonction nommée
    window.removeEventListener(
        "resize",
        handleResize
    );

    closeSidebar();
    closeContextMenu();
    hideLoader();
    clearContainers();
}

// ==========================================
// Before Unload
// ==========================================

window.addEventListener(
    "beforeunload",
    () => {
        destroy();
    }
);
