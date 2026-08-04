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
