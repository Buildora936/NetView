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
    getSponsoredProducts

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


// ==========================================
// DOM
// ==========================================


// Header

const header =
document.querySelector(
    ".nv-header"
);

const headerRight =
document.getElementById(
    "headerRight"
);

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
document.querySelector(
    ".nv-search-button"
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


// Sidebar

const sidebar =
document.querySelector(
    ".nv-sidebar"
);

const sidebarOverlay =
document.getElementById(
    "sidebarOverlay"
);


// Categories

const categoriesBar =
document.querySelector(
    ".nv-categories"
);

const categoriesScroll =
document.querySelector(
    ".nv-categories-scroll"
);


// Main Content

const videosGrid =
document.getElementById(
    "videosGrid"
);

const shortsGrid =
document.getElementById(
    "shortsGrid"
);

const livesContainer =
document.getElementById(
    "livesContainer"
);

const productsContainer =
document.getElementById(
    "productsContainer"
);


// Skeletons

const skeletons =
document.querySelectorAll(
    ".nv-skeleton"
);


// Empty States

const emptyStates =
document.querySelectorAll(
    ".nv-empty"
);


// Context Menus

const contextMenus =
document.querySelectorAll(
    ".nv-context-menu"
);


// ==========================================
// Variables globales
// ==========================================

let currentUser = null;

let currentProfile = null;

let videos = [];

let shorts = [];

let lives = [];

let products = [];

let sidebarOpen = false;

let currentCategory = "all";

let isLoading = false;

// ==========================================
// Initialisation
// ==========================================

async function init(){

    try{

        isLoading = true;

        showLoader();

        await checkSession();

        await loadHomeContent();

        fillHeader();

        fillSidebar();

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

    }

}


// ==========================================
// Session
// ==========================================

async function checkSession(){

    const session =
        await getSession();


    if(!session){

        currentUser = null;

        currentProfile = null;

        return;

    }


    currentUser =
        await getUser();


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


    currentProfile =
        await getProfile(
            currentUser.id
        );

}


// ==========================================
// Contenu Accueil
// ==========================================

async function loadHomeContent(){

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


    videos =
        loadedVideos || [];

    shorts =
        loadedShorts || [];

    lives =
        loadedLives || [];

    products =
        loadedProducts || [];

}


// ==========================================
// Header
// ==========================================

function fillHeader(){

    if(currentUser){

        showUserHeader();

    }

    else{

        showGuestHeader();

    }

}


// ==========================================
// Sidebar
// ==========================================

function fillSidebar(){

    if(currentUser){

        showUserSidebar();

    }

    else{

        showGuestSidebar();

    }

}
// ==========================================
// Header + Sidebar
// ==========================================


// ==========================================
// Sidebar
// ==========================================

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

    sidebar.classList.add(
        "active"
    );

    if(sidebarOverlay){

        sidebarOverlay.classList.add(
            "active"
        );

    }

    document.body.classList.add(
        "nv-sidebar-open"
    );

}


function closeSidebar(){

    sidebarOpen = false;

    sidebar.classList.remove(
        "active"
    );

    if(sidebarOverlay){

        sidebarOverlay.classList.remove(
            "active"
        );

    }

    document.body.classList.remove(
        "nv-sidebar-open"
    );

}


// ==========================================
// Header
// ==========================================

function updateHeader(){

    if(currentUser){

        showUserHeader();

    }

    else{

        showGuestHeader();

    }

}


function showGuestHeader(){

    headerRight.innerHTML = `

        <button
            id="loginButton"
            class="nv-login-button">

            S'identifier'

        </button>

    `;


    document
        .getElementById("loginButton")
        .addEventListener(

            "click",

            ()=>{

                navigate(
                    "auth.html"
                );

            }

        );

}


function showUserHeader(){

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
                src="${
                    currentProfile?.avatar_url ||
                    "images/default-avatar.png"
                }"
                alt="Avatar">

        </a>

    `;

}


// ==========================================
// Sidebar
// ==========================================

function updateSidebar(){

    if(currentUser){

        showUserSidebar();

    }

    else{

        showGuestSidebar();

    }

}


function showGuestSidebar(){

    sidebar.innerHTML = `

        <nav class="nv-sidebar-nav">

            <a href="index.html">

                <i class="fa-solid fa-house"></i>

                <span>Accueil</span>

            </a>

            <a href="search.html">

                <i class="fa-solid fa-magnifying-glass"></i>

                <span>Recherche</span>

            </a>

            <a href="trending.html">

                <i class="fa-solid fa-fire"></i>

                <span>Tendances</span>

            </a>

            <a href="shorts.html">

                <i class="fa-solid fa-bolt"></i>

                <span>Shorts</span>

            </a>

            <a href="lives.html">

                <i class="fa-solid fa-tower-broadcast"></i>

                <span>Lives</span>

            </a>

            <a href="netview-shop.html">

                <i class="fa-solid fa-store"></i>

                <span>Boutique</span>

            </a>

            <a href="help.html">

                <i class="fa-solid fa-circle-question"></i>

                <span>Aide</span>

            </a>

        </nav>

    `;

}


function showUserSidebar(){

    sidebar.innerHTML = `

        <nav class="nv-sidebar-nav">

            <a href="index.html">

                <i class="fa-solid fa-house"></i>

                <span>Accueil</span>

            </a>

            <a href="search.html">

                <i class="fa-solid fa-magnifying-glass"></i>

                <span>Recherche</span>

            </a>

            <a href="trending.html">

                <i class="fa-solid fa-fire"></i>

                <span>Tendances</span>

            </a>

            <a href="shorts.html">

                <i class="fa-solid fa-bolt"></i>

                <span>Shorts</span>

            </a>

            <a href="lives.html">

                <i class="fa-solid fa-tower-broadcast"></i>

                <span>Lives</span>

            </a>

            <a href="subscriptions.html">

                <i class="fa-solid fa-users"></i>

                <span>Abonnements</span>

            </a>

            <a href="library.html">

                <i class="fa-solid fa-photo-film"></i>

                <span>Bibliothèque</span>

            </a>

            <a href="history.html">

                <i class="fa-solid fa-clock-rotate-left"></i>

                <span>Historique</span>

            </a>

            <a href="playlist.html">

                <i class="fa-solid fa-list"></i>

                <span>Playlists</span>

            </a>

            <a href="notification.html">

                <i class="fa-regular fa-bell"></i>

                <span>Notifications</span>

            </a>

            <a href="studio.html">

                <i class="fa-solid fa-chart-line"></i>

                <span>Studio</span>

            </a>

            <a href="netview-shop.html">

                <i class="fa-solid fa-store"></i>

                <span>Boutique</span>

            </a>

            <a href="settings.html">

                <i class="fa-solid fa-gear"></i>

                <span>Paramètres</span>

            </a>

            <a href="help.html">

                <i class="fa-solid fa-circle-question"></i>

                <span>Aide</span>

            </a>

        </nav>

    `;

}


// ==========================================
// Sidebar fermée par défaut
// ==========================================

closeSidebar();

// ==========================================
// Événements
// ==========================================

function addEventListeners(){

    // Partie 7

}


// ==========================================
// Lancement
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    init

);
