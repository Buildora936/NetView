// ==========================================
// NetView
// library.js
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

    getWatchHistory,
    clearWatchHistory,

    getWatchLater,
    addWatchLater,
    removeWatchLater,
    hasWatchLater,

    getLikedVideos,
    likeVideo,
    unlikeVideo,
    hasLikedVideo,

    getPlaylists,
    getPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylistItemPosition
} from "../core/data.js";

import {
    showLoader,
    hideLoader
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";


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
// Main
// ==========================================

const mainContent =
    document.getElementById(
        "mainContent"
    );


// ==========================================
// Library Tabs
// ==========================================

const libraryTabs =
    document.getElementById(
        "libraryTabs"
    );

const libraryTabHistory =
    document.getElementById(
        "libraryTabHistory"
    );

const libraryTabWatchLater =
    document.getElementById(
        "libraryTabWatchLater"
    );

const libraryTabLiked =
    document.getElementById(
        "libraryTabLiked"
    );

const libraryTabPlaylists =
    document.getElementById(
        "libraryTabPlaylists"
    );


// ==========================================
// Library Sections
// ==========================================

const libraryHistorySection =
    document.getElementById(
        "libraryHistorySection"
    );

const libraryWatchLaterSection =
    document.getElementById(
        "libraryWatchLaterSection"
    );

const libraryLikedSection =
    document.getElementById(
        "libraryLikedSection"
    );

const libraryPlaylistsSection =
    document.getElementById(
        "libraryPlaylistsSection"
    );


// ==========================================
// Search / Filter / Sort
// ==========================================

const librarySearchInput =
    document.getElementById(
        "librarySearchInput"
    );

const clearLibrarySearch =
    document.getElementById(
        "clearLibrarySearch"
    );

const libraryFilter =
    document.getElementById(
        "libraryFilter"
    );

const librarySort =
    document.getElementById(
        "librarySort"
    );

const librarySearchEmpty =
    document.getElementById(
        "librarySearchEmpty"
    );

const clearSearchEmptyButton =
    document.getElementById(
        "clearSearchEmptyButton"
    );


// ==========================================
// Refresh
// ==========================================

const libraryRefreshButton =
    document.getElementById(
        "libraryRefreshButton"
    );


// ==========================================
// History
// ==========================================

const historyLoading =
    document.getElementById(
        "historyLoading"
    );

const historyGrid =
    document.getElementById(
        "historyGrid"
    );

const historyEmpty =
    document.getElementById(
        "historyEmpty"
    );

const clearHistoryButton =
    document.getElementById(
        "clearHistoryButton"
    );

const historyCount =
    document.getElementById(
        "historyCount"
    );


// ==========================================
// Watch Later
// ==========================================

const watchLaterLoading =
    document.getElementById(
        "watchLaterLoading"
    );

const watchLaterGrid =
    document.getElementById(
        "watchLaterGrid"
    );

const watchLaterEmpty =
    document.getElementById(
        "watchLaterEmpty"
    );

const watchLaterCount =
    document.getElementById(
        "watchLaterCount"
    );


// ==========================================
// Liked
// ==========================================

const likedLoading =
    document.getElementById(
        "likedLoading"
    );

const likedGrid =
    document.getElementById(
        "likedGrid"
    );

const likedEmpty =
    document.getElementById(
        "likedEmpty"
    );

const likedCount =
    document.getElementById(
        "likedCount"
    );


// ==========================================
// Playlists
// ==========================================

const playlistsLoading =
    document.getElementById(
        "playlistsLoading"
    );

const playlistsGrid =
    document.getElementById(
        "playlistsGrid"
    );

const playlistsEmpty =
    document.getElementById(
        "playlistsEmpty"
    );

const playlistsCount =
    document.getElementById(
        "playlistsCount"
    );


// ==========================================
// Error
// ==========================================

const libraryError =
    document.getElementById(
        "libraryError"
    );

const libraryRetryButton =
    document.getElementById(
        "libraryRetryButton"
    );


// ==========================================
// Confirmation Modal
// ==========================================

const libraryConfirmModal =
    document.getElementById(
        "libraryConfirmModal"
    );

const libraryConfirmClose =
    document.getElementById(
        "libraryConfirmClose"
    );

const libraryConfirmCancel =
    document.getElementById(
        "libraryConfirmCancel"
    );

const libraryConfirmAction =
    document.getElementById(
        "libraryConfirmAction"
    );

const libraryConfirmMessage =
    document.getElementById(
        "libraryConfirmMessage"
    );

const libraryConfirmBackdrop =
    libraryConfirmModal?.querySelector(
        ".library-modal-backdrop"
    );


// ==========================================
// Toast
// ==========================================

const libraryToast =
    document.getElementById(
        "libraryToast"
    );

const libraryToastIcon =
    document.getElementById(
        "libraryToastIcon"
    );

const libraryToastMessage =
    document.getElementById(
        "libraryToastMessage"
    );


// ==========================================
// Global State
// ==========================================

let currentUser =
    null;

let currentProfile =
    null;

let sidebarOpen =
    false;

let currentTab =
    "history";

let searchQuery =
    "";

let currentFilter =
    "all";

let currentSort =
    "recent";

let isLoading =
    false;

let historyData =
    [];

let watchLaterData =
    [];

let likedData =
    [];

let playlistsData =
    [];

let filteredHistory =
    [];

let filteredWatchLater =
    [];

let filteredLiked =
    [];

let filteredPlaylists =
    [];

let confirmAction =
    null;

let toastTimer =
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

async function init() {

    try {

        showLoader();

        await checkSession();

        if (!currentUser) {

            navigate(
                "auth.html"
            );

            return;

        }

        await loadProfile();

        updateHeader();

        updateSidebar();

        await loadLibrary();

        addEventListeners();

        activateTab(
            currentTab,
            false
        );

    }

    catch (error) {

        console.error(
            "NetView Library:",
            error
        );

        showLibraryError();

    }

    finally {

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

            currentUser =
                null;

            return;

        }

        currentUser =
            await getUser();

    }

    catch (error) {

        console.error(
            "Session error:",
            error
        );

        currentUser =
            null;

    }

}


// ==========================================
// Profile
// ==========================================

async function loadProfile() {

    if (!currentUser) {

        currentProfile =
            null;

        return;

    }

    try {

        currentProfile =
            await getProfile(
                currentUser.id
            );

    }

    catch (error) {

        console.error(
            "Profile error:",
            error
        );

        currentProfile =
            null;

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

        showGuestHeader();

        return;

    }

    showUserHeader();

}


// ==========================================
// Guest Header
// ==========================================

function showGuestHeader() {

    headerRight.innerHTML = `

        <button
            id="loginButton"
            class="nv-login-button"
            type="button"
        >

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

function showUserHeader() {

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
            ></span>

        </button>


        <a
            href="settings.html"
            class="nv-avatar-button"
            aria-label="Paramètres"
        >

            <img
                id="headerAvatar"
                src="${
                    currentProfile?.avatar_url ||
                    "images/default-avatar.png"
                }"
                alt="Avatar"
            >

        </a>

    `;

}


// ==========================================
// Sidebar
// ==========================================

function updateSidebar() {

    if (!sidebarNav) {

        return;

    }

    if (!currentUser) {

        showGuestSidebar();

        return;

    }

    showUserSidebar();

}


// ==========================================
// Guest Sidebar
// ==========================================

function showGuestSidebar() {

    sidebarNav.innerHTML = `

        <a href="index.html">

            <i class="fa-solid fa-house"></i>

            <span>
                Accueil
            </span>

        </a>


        <a href="shorts.html">

            <i class="fa-solid fa-bolt"></i>

            <span>
                Shorts
            </span>

        </a>


        <a href="lives.html">

            <i class="fa-solid fa-tower-broadcast"></i>

            <span>
                Lives
            </span>

        </a>


        <a href="search.html">

            <i class="fa-solid fa-magnifying-glass"></i>

            <span>
                Explorer
            </span>

        </a>


        <a href="netview-shop.html">

            <i class="fa-solid fa-store"></i>

            <span>
                Boutique
            </span>

        </a>


        <hr>


        <a href="auth.html">

            <i class="fa-regular fa-user"></i>

            <span>
                S'identifier
            </span>

        </a>

    `;

}


// ==========================================
// User Sidebar
// ==========================================

function showUserSidebar() {

    sidebarNav.innerHTML = `

        <a href="index.html">

            <i class="fa-solid fa-house"></i>

            <span>
                Accueil
            </span>

        </a>


        <a href="shorts.html">

            <i class="fa-solid fa-bolt"></i>

            <span>
                Shorts
            </span>

        </a>


        <a href="subscriptions.html">

            <i class="fa-solid fa-tv"></i>

            <span>
                Abonnements
            </span>

        </a>


        <a
            href="library.html"
            class="active"
            aria-current="page"
        >

            <i class="fa-solid fa-book-bookmark"></i>

            <span>
                Bibliothèque
            </span>

        </a>


        <a href="playlist.html">

            <i class="fa-solid fa-list"></i>

            <span>
                Playlists
            </span>

        </a>


        <a href="lives.html">

            <i class="fa-solid fa-tower-broadcast"></i>

            <span>
                Lives
            </span>

        </a>


        <hr>


        <a href="netview-shop.html">

            <i class="fa-solid fa-store"></i>

            <span>
                Boutique
            </span>

        </a>


        <a href="settings.html">

            <i class="fa-solid fa-gear"></i>

            <span>
                Paramètres
            </span>

        </a>

    `;

}


// ==========================================
// Sidebar Toggle
// ==========================================

function toggleSidebar() {

    if (sidebarOpen) {

        closeSidebar();

    }

    else {

        openSidebar();

    }

}


// ==========================================
// Open Sidebar
// ==========================================

function openSidebar() {

    sidebarOpen =
        true;

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


// ==========================================
// Close Sidebar
// ==========================================

function closeSidebar() {

    sidebarOpen =
        false;

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
// Load Library
// ==========================================

async function loadLibrary() {

    if (!currentUser) {

        return;

    }

    hideLibraryError();

    isLoading =
        true;

    try {

        await Promise.all([
            loadHistory(),
            loadWatchLater(),
            loadLiked(),
            loadPlaylists()
        ]);

        updateCounts();

        applyAllFilters();

    }

    catch (error) {

        console.error(
            "Library loading error:",
            error
        );

        showLibraryError();

        throw error;

    }

    finally {

        isLoading =
            false;

    }

}


// ==========================================
// Load History
// ==========================================

async function loadHistory() {

    setLoading(
        historyLoading,
        true
    );

    try {

        const data =
            await getWatchHistory({
                page: 1,
                limit: 100
            });

        historyData =
            Array.isArray(data)
                ? data
                : [];

    }

    catch (error) {

        console.error(
            "History error:",
            error
        );

        historyData =
            [];

        throw error;

    }

    finally {

        setLoading(
            historyLoading,
            false
        );

    }

}


// ==========================================
// Load Watch Later
// ==========================================

async function loadWatchLater() {

    setLoading(
        watchLaterLoading,
        true
    );

    try {

        const data =
            await getWatchLater({
                page: 1,
                limit: 100
            });

        watchLaterData =
            Array.isArray(data)
                ? data
                : [];

    }

    catch (error) {

        console.error(
            "Watch later error:",
            error
        );

        watchLaterData =
            [];

        throw error;

    }

    finally {

        setLoading(
            watchLaterLoading,
            false
        );

    }

}


// ==========================================
// Load Liked
// ==========================================

async function loadLiked() {

    setLoading(
        likedLoading,
        true
    );

    try {

        const data =
            await getLikedVideos({
                page: 1,
                limit: 100
            });

        likedData =
            Array.isArray(data)
                ? data
                : [];

    }

    catch (error) {

        console.error(
            "Liked videos error:",
            error
        );

        likedData =
            [];

        throw error;

    }

    finally {

        setLoading(
            likedLoading,
            false
        );

    }

}


// ==========================================
// Load Playlists
// ==========================================

async function loadPlaylists() {

    setLoading(
        playlistsLoading,
        true
    );

    try {

        const data =
            await getPlaylists({
                page: 1,
                limit: 100
            });

        playlistsData =
            Array.isArray(data)
                ? data
                : [];

    }

    catch (error) {

        console.error(
            "Playlists error:",
            error
        );

        playlistsData =
            [];

        throw error;

    }

    finally {

        setLoading(
            playlistsLoading,
            false
        );

    }

}


// ==========================================
// Loading Helper
// ==========================================

function setLoading(
    element,
    value
) {

    if (!element) {

        return;

    }

    element.hidden =
        !value;

}


// ==========================================
// Counts
// ==========================================

function updateCounts() {

    updateCount(
        historyCount,
        historyData.length
    );

    updateCount(
        watchLaterCount,
        watchLaterData.length
    );

    updateCount(
        likedCount,
        likedData.length
    );

    updateCount(
        playlistsCount,
        playlistsData.length
    );

}


function updateCount(
    element,
    count
) {

    if (!element) {

        return;

    }

    if (!count) {

        element.hidden =
            true;

        element.textContent =
            "0";

        return;

    }

    element.hidden =
        false;

    element.textContent =
        formatNumber(count);

}


// ==========================================
// Tabs
// ==========================================

function activateTab(
    tab,
    scroll = true
) {

    const validTabs = [
        "history",
        "watch-later",
        "liked",
        "playlists"
    ];

    if (!validTabs.includes(tab)) {

        tab =
            "history";

    }

    currentTab =
        tab;

    const tabElements = [
        libraryTabHistory,
        libraryTabWatchLater,
        libraryTabLiked,
        libraryTabPlaylists
    ];

    tabElements.forEach(
        element => {

            if (!element) {

                return;

            }

            const isActive =
                element.dataset.libraryTab === tab;

            element.classList.toggle(
                "active",
                isActive
            );

            element.setAttribute(
                "aria-selected",
                String(isActive)
            );

            element.tabIndex =
                isActive
                    ? 0
                    : -1;

        }
    );


    const sections = [
        libraryHistorySection,
        libraryWatchLaterSection,
        libraryLikedSection,
        libraryPlaylistsSection
    ];

    sections.forEach(
        section => {

            if (!section) {

                return;

            }

            const isActive =
                section.dataset.librarySection === tab;

            section.hidden =
                !isActive;

        }
    );


    librarySearchEmpty.hidden =
        true;


    applyCurrentTabFilters();


    if (scroll) {

        const header =
            document.querySelector(
                ".library-header"
            );

        const offset =
            header
                ? header.offsetHeight + 20
                : 20;

        const top =
            Math.max(
                0,
                window.scrollY +
                (
                    libraryTabs?.getBoundingClientRect()
                        .top || 0
                ) -
                offset
            );

        window.scrollTo({
            top,
            behavior: "smooth"
        });

    }

}


// ==========================================
// Apply All Filters
// ==========================================

function applyAllFilters() {

    filteredHistory =
        processVideoCollection(
            historyData
        );

    filteredWatchLater =
        processVideoCollection(
            watchLaterData
        );

    filteredLiked =
        processVideoCollection(
            likedData
        );

    filteredPlaylists =
        processPlaylistCollection(
            playlistsData
        );

    renderHistory(
        filteredHistory
    );

    renderWatchLater(
        filteredWatchLater
    );

    renderLiked(
        filteredLiked
    );

    renderPlaylists(
        filteredPlaylists
    );

    updateSearchEmptyState();

}


// ==========================================
// Apply Current Tab
// ==========================================

function applyCurrentTabFilters() {

    if (currentTab === "history") {

        filteredHistory =
            processVideoCollection(
                historyData
            );

        renderHistory(
            filteredHistory
        );

    }

    else if (
        currentTab === "watch-later"
    ) {

        filteredWatchLater =
            processVideoCollection(
                watchLaterData
            );

        renderWatchLater(
            filteredWatchLater
        );

    }

    else if (
        currentTab === "liked"
    ) {

        filteredLiked =
            processVideoCollection(
                likedData
            );

        renderLiked(
            filteredLiked
        );

    }

    else if (
        currentTab === "playlists"
    ) {

        filteredPlaylists =
            processPlaylistCollection(
                playlistsData
            );

        renderPlaylists(
            filteredPlaylists
        );

    }

    updateSearchEmptyState();

}


// ==========================================
// Process Video Collections
// ==========================================

function processVideoCollection(
    collection
) {

    let result =
        Array.isArray(collection)
            ? [...collection]
            : [];


    const query =
        searchQuery
            .trim()
            .toLowerCase();


    if (query) {

        result =
            result.filter(
                item => {

                    const video =
                        getVideoFromItem(
                            item
                        );

                    if (!video) {

                        return false;

                    }

                    const title =
                        String(
                            video.title || ""
                        ).toLowerCase();

                    const channel =
                        String(
                            getChannelName(
                                video,
                                item
                            )
                        ).toLowerCase();

                    const description =
                        String(
                            video.description || ""
                        ).toLowerCase();

                    return (
                        title.includes(query) ||
                        channel.includes(query) ||
                        description.includes(query)
                    );

                }
            );

    }


    if (
        currentFilter !== "all"
    ) {

        result =
            result.filter(
                item => {

                    return matchesContentFilter(
                        item,
                        currentFilter
                    );

                }
            );

    }


    return sortVideoCollection(
        result
    );

}


// ==========================================
// Process Playlists
// ==========================================

function processPlaylistCollection(
    collection
) {

    let result =
        Array.isArray(collection)
            ? [...collection]
            : [];


    const query =
        searchQuery
            .trim()
            .toLowerCase();


    if (query) {

        result =
            result.filter(
                playlist => {

                    const title =
                        String(
                            playlist.title ||
                            playlist.name ||
                            ""
                        ).toLowerCase();

                    const description =
                        String(
                            playlist.description ||
                            ""
                        ).toLowerCase();

                    return (
                        title.includes(query) ||
                        description.includes(query)
                    );

                }
            );

    }


    return sortPlaylistCollection(
        result
    );

}


// ==========================================
// Get Video
// ==========================================

function getVideoFromItem(
    item
) {

    if (!item) {

        return null;

    }

    if (item.videos) {

        if (Array.isArray(item.videos)) {

            return item.videos[0] || null;

        }

        return item.videos;

    }

    return item;

}


// ==========================================
// Channel
// ==========================================

function getChannel(
    video,
    item = null
) {

    if (
        video?.channels
    ) {

        if (
            Array.isArray(
                video.channels
            )
        ) {

            return (
                video.channels[0] ||
                null
            );

        }

        return video.channels;

    }


    if (
        item?.channels
    ) {

        if (
            Array.isArray(
                item.channels
            )
        ) {

            return (
                item.channels[0] ||
                null
            );

        }

        return item.channels;

    }


    return null;

}


// ==========================================
// Channel Name
// ==========================================

function getChannelName(
    video,
    item = null
) {

    const channel =
        getChannel(
            video,
            item
        );

    return (
        channel?.name ||
        video?.channel_name ||
        video?.channelName ||
        "Chaîne inconnue"
    );

}


// ==========================================
// Content Filter
// ==========================================

function matchesContentFilter(
    item,
    filter
) {

    if (
        filter === "all"
    ) {

        return true;

    }


    const video =
        getVideoFromItem(
            item
        );


    if (!video) {

        return false;

    }


    const type =
        String(
            video.content_type ||
            video.type ||
            item.content_type ||
            item.type ||
            "video"
        ).toLowerCase();


    if (
        filter === "video"
    ) {

        return (
            type === "video"
        );

    }


    if (
        filter === "short"
    ) {

        return (
            type === "short" ||
            type === "shorts"
        );

    }


    if (
        filter === "live"
    ) {

        return (
            type === "live" ||
            type === "lives"
        );

    }


    return true;

}


// ==========================================
// Sort Videos
// ==========================================

function sortVideoCollection(
    collection
) {

    const result =
        [...collection];


    result.sort(
        (a, b) => {

            const videoA =
                getVideoFromItem(a);

            const videoB =
                getVideoFromItem(b);


            if (
                currentSort === "title"
            ) {

                return String(
                    videoA?.title || ""
                ).localeCompare(
                    String(
                        videoB?.title || ""
                    ),
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }


            if (
                currentSort === "channel"
            ) {

                return getChannelName(
                    videoA,
                    a
                ).localeCompare(
                    getChannelName(
                        videoB,
                        b
                    ),
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }


            const dateA =
                getItemDate(a);

            const dateB =
                getItemDate(b);


            if (
                currentSort === "oldest"
            ) {

                return (
                    dateA - dateB
                );

            }


            return (
                dateB - dateA
            );

        }
    );


    return result;

}


// ==========================================
// Sort Playlists
// ==========================================

function sortPlaylistCollection(
    collection
) {

    const result =
        [...collection];


    result.sort(
        (a, b) => {

            if (
                currentSort === "title"
            ) {

                return String(
                    a.title ||
                    a.name ||
                    ""
                ).localeCompare(
                    String(
                        b.title ||
                        b.name ||
                        ""
                    ),
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }


            const dateA =
                getItemDate(a);

            const dateB =
                getItemDate(b);


            if (
                currentSort === "oldest"
            ) {

                return (
                    dateA - dateB
                );

            }


            return (
                dateB - dateA
            );

        }
    );


    return result;

}


// ==========================================
// Date
// ==========================================

function getItemDate(
    item
) {

    if (!item) {

        return 0;

    }


    const candidates = [
        item.last_watched_at,
        item.created_at,
        item.updated_at,
        item.published_at,
        item.watched_at
    ];


    for (
        const value of candidates
    ) {

        if (!value) {

            continue;

        }

        const date =
            new Date(value);

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date.getTime();

        }

    }


    const video =
        getVideoFromItem(
            item
        );


    if (
        video &&
        video.created_at
    ) {

        const date =
            new Date(
                video.created_at
            );

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date.getTime();

        }

    }


    return 0;

}


// ==========================================
// Render History
// ==========================================

function renderHistory(
    data
) {

    if (!historyGrid) {

        return;

    }


    historyGrid.innerHTML =
        "";


    if (!data.length) {

        historyEmpty.hidden =
            false;

        return;

    }


    historyEmpty.hidden =
        true;


    data.forEach(
        item => {

            const card =
                createLibraryVideoCard(
                    item,
                    "history"
                );

            if (card) {

                historyGrid.appendChild(
                    card
                );

            }

        }
    );

}


// ==========================================
// Render Watch Later
// ==========================================

function renderWatchLater(
    data
) {

    if (!watchLaterGrid) {

        return;

    }


    watchLaterGrid.innerHTML =
        "";


    if (!data.length) {

        watchLaterEmpty.hidden =
            false;

        return;

    }


    watchLaterEmpty.hidden =
        true;


    data.forEach(
        item => {

            const card =
                createLibraryVideoCard(
                    item,
                    "watch-later"
                );

            if (card) {

                watchLaterGrid.appendChild(
                    card
                );

            }

        }
    );

}


// ==========================================
// Render Liked
// ==========================================

function renderLiked(
    data
) {

    if (!likedGrid) {

        return;

    }


    likedGrid.innerHTML =
        "";


    if (!data.length) {

        likedEmpty.hidden =
            false;

        return;

    }


    likedEmpty.hidden =
        true;


    data.forEach(
        item => {

            const card =
                createLibraryVideoCard(
                    item,
                    "liked"
                );

            if (card) {

                likedGrid.appendChild(
                    card
                );

            }

        }
    );

}


// ==========================================
// Render Playlists
// ==========================================

function renderPlaylists(
    data
) {

    if (!playlistsGrid) {

        return;

    }


    playlistsGrid.innerHTML =
        "";


    if (!data.length) {

        playlistsEmpty.hidden =
            false;

        return;

    }


    playlistsEmpty.hidden =
        true;


    data.forEach(
        playlist => {

            const card =
                createPlaylistCard(
                    playlist
                );

            if (card) {

                playlistsGrid.appendChild(
                    card
                );

            }

        }
    );

}


// ==========================================
// Video Card
// ==========================================

function createLibraryVideoCard(
    item,
    source
) {

    const video =
        getVideoFromItem(
            item
        );


    if (!video) {

        return null;

    }


    const article =
        document.createElement(
            "article"
        );


    article.className =
        "library-video-card";

    article.dataset.id =
        video.id || "";


    article.dataset.source =
        source;


    const channel =
        getChannel(
            video,
            item
        );


    const thumbnail =
        escapeHtml(
            video.thumbnail_url ||
            "images/default-thumbnail.jpg"
        );


    const title =
        escapeHtml(
            video.title ||
            "Vidéo sans titre"
        );


    const channelName =
        escapeHtml(
            getChannelName(
                video,
                item
            )
        );


    const channelAvatar =
        escapeHtml(
            channel?.avatar_url ||
            "images/default-avatar.png"
        );


    const duration =
        formatDuration(
            video.duration
        );


    const views =
        formatViews(
            video.views || 0
        );


    const date =
        getDisplayDate(
            item,
            video
        );


    const verified =
        channel?.verified
            ? `
                <i
                    class="fa-solid fa-circle-check library-verified"
                    title="Chaîne vérifiée"
                    aria-label="Chaîne vérifiée"
                ></i>
            `
            : "";


    article.innerHTML = `

        <div class="library-video-thumbnail-wrapper">

            <a
                href="player.html?id=${encodeURIComponent(
                    video.id || ""
                )}"
                class="library-video-thumbnail-link"
                aria-label="${title}"
            >

                <img
                    class="library-video-thumbnail"
                    src="${thumbnail}"
                    alt="${title}"
                    loading="lazy"
                >

                ${
                    duration
                        ? `
                            <span class="library-video-duration">
                                ${duration}
                            </span>
                        `
                        : ""
                }

            </a>


            <button
                class="library-video-more"
                type="button"
                aria-label="Actions"
                data-action="video-menu"
                data-video-id="${escapeHtml(
                    video.id || ""
                )}"
            >

                <i class="fa-solid fa-ellipsis-vertical"></i>

            </button>

        </div>


        <div class="library-video-content">

            <a
                href="channel.html?id=${encodeURIComponent(
                    video.channel_id || ""
                )}"
                class="library-video-avatar"
            >

                <img
                    src="${channelAvatar}"
                    alt="${channelName}"
                    loading="lazy"
                >

            </a>


            <div class="library-video-info">

                <h3 class="library-video-title">

                    <a
                        href="player.html?id=${encodeURIComponent(
                            video.id || ""
                        )}"
                    >
                        ${title}
                    </a>

                </h3>


                <a
                    href="channel.html?id=${encodeURIComponent(
                        video.channel_id || ""
                    )}"
                    class="library-video-channel"
                >

                    ${channelName}

                    ${verified}

                </a>


                <div class="library-video-meta">

                    <span>
                        ${views} vues
                    </span>

                    <span>
                        •
                    </span>

                    <span>
                        ${date}
                    </span>

                </div>

            </div>

        </div>

    `;


    return article;

}


// ==========================================
// Playlist Card
// ==========================================

function createPlaylistCard(
    playlist
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "library-playlist-card";


    article.dataset.id =
        playlist.id || "";


    const items =
        Array.isArray(
            playlist.playlist_items
        )
            ? [...playlist.playlist_items]
            : [];


    items.sort(
        (a, b) =>
            Number(
                a.position || 0
            ) -
            Number(
                b.position || 0
            )
    );


    const firstVideo =
        items[0]?.videos ||
        null;


    const secondVideo =
        items[1]?.videos ||
        null;


    const thirdVideo =
        items[2]?.videos ||
        null;


    const fourthVideo =
        items[3]?.videos ||
        null;


    const title =
        escapeHtml(
            playlist.title ||
            playlist.name ||
            "Playlist sans titre"
        );


    const description =
        escapeHtml(
            playlist.description ||
            ""
        );


    const count =
        items.length;


    const cover =
        firstVideo?.thumbnail_url ||
        "images/default-thumbnail.jpg";


    article.innerHTML = `

        <a
            href="playlist.html?id=${encodeURIComponent(
                playlist.id || ""
            )}"
            class="library-playlist-cover"
            aria-label="${title}"
        >

            <div class="library-playlist-main-image">

                <img
                    src="${escapeHtml(
                        cover
                    )}"
                    alt="${title}"
                    loading="lazy"
                >

            </div>


            <div class="library-playlist-stack">

                <div class="library-playlist-stack-item">

                    ${
                        secondVideo?.thumbnail_url
                            ? `
                                <img
                                    src="${escapeHtml(
                                        secondVideo.thumbnail_url
                                    )}"
                                    alt=""
                                    loading="lazy"
                                >
                            `
                            : ""
                    }

                </div>


                <div class="library-playlist-stack-item">

                    ${
                        thirdVideo?.thumbnail_url
                            ? `
                                <img
                                    src="${escapeHtml(
                                        thirdVideo.thumbnail_url
                                    )}"
                                    alt=""
                                    loading="lazy"
                                >
                            `
                            : ""
                    }

                </div>


                <div class="library-playlist-stack-item">

                    ${
                        fourthVideo?.thumbnail_url
                            ? `
                                <img
                                    src="${escapeHtml(
                                        fourthVideo.thumbnail_url
                                    )}"
                                    alt=""
                                    loading="lazy"
                                >
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="library-playlist-count">

                <i class="fa-solid fa-list"></i>

                <span>
                    ${formatNumber(count)}
                </span>

            </div>

        </a>


        <div class="library-playlist-content">

            <h3 class="library-playlist-title">

                <a
                    href="playlist.html?id=${encodeURIComponent(
                        playlist.id || ""
                    )}"
                >
                    ${title}
                </a>

            </h3>


            ${
                description
                    ? `
                        <p class="library-playlist-description">
                            ${description}
                        </p>
                    `
                    : ""
            }


            <div class="library-playlist-meta">

                <span>
                    ${formatNumber(count)}
                    ${
                        count > 1
                            ? "vidéos"
                            : "vidéo"
                    }
                </span>

            </div>


            <div class="library-playlist-actions">

                <a
                    href="playlist.html?id=${encodeURIComponent(
                        playlist.id || ""
                    )}"
                    class="library-playlist-open"
                >

                    <i class="fa-solid fa-play"></i>

                    Ouvrir

                </a>


                <button
                    type="button"
                    class="library-playlist-delete"
                    data-action="delete-playlist"
                    data-playlist-id="${escapeHtml(
                        playlist.id || ""
                    )}"
                    aria-label="Supprimer la playlist"
                >

                    <i class="fa-solid fa-trash-can"></i>

                </button>

            </div>

        </div>

    `;


    return article;

}


// ==========================================
// Display Date
// ==========================================

function getDisplayDate(
    item,
    video
) {

    const value =
        item?.last_watched_at ||
        item?.created_at ||
        item?.watched_at ||
        video?.published_at ||
        video?.created_at;


    if (!value) {

        return "";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ==========================================
// Search
// ==========================================

function handleLibrarySearch(
    value
) {

    searchQuery =
        String(
            value || ""
        ).trim();


    const hasSearch =
        searchQuery.length > 0;


    if (clearLibrarySearch) {

        clearLibrarySearch.hidden =
            !hasSearch;

    }


    applyCurrentTabFilters();

}


// ==========================================
// Clear Search
// ==========================================

function clearSearch() {

    searchQuery =
        "";


    if (librarySearchInput) {

        librarySearchInput.value =
            "";

    }


    if (clearLibrarySearch) {

        clearLibrarySearch.hidden =
            true;

    }


    librarySearchEmpty.hidden =
        true;


    applyCurrentTabFilters();


    librarySearchInput?.focus();

}


// ==========================================
// Search Empty
// ==========================================

function updateSearchEmptyState() {

    if (!librarySearchEmpty) {

        return;

    }


    if (!searchQuery) {

        librarySearchEmpty.hidden =
            true;

        return;

    }


    let currentData = [];


    if (
        currentTab === "history"
    ) {

        currentData =
            filteredHistory;

    }

    else if (
        currentTab === "watch-later"
    ) {

        currentData =
            filteredWatchLater;

    }

    else if (
        currentTab === "liked"
    ) {

        currentData =
            filteredLiked;

    }

    else if (
        currentTab === "playlists"
    ) {

        currentData =
            filteredPlaylists;

    }


    librarySearchEmpty.hidden =
        currentData.length !== 0;

}


// ==========================================
// Filter
// ==========================================

function handleFilterChange() {

    currentFilter =
        libraryFilter?.value ||
        "all";


    applyCurrentTabFilters();

}


// ==========================================
// Sort
// ==========================================

function handleSortChange() {

    currentSort =
        librarySort?.value ||
        "recent";


    applyCurrentTabFilters();

}


// ==========================================
// Refresh
// ==========================================

async function refreshLibrary() {

    if (isLoading) {

        return;

    }


    try {

        setRefreshLoading(
            true
        );

        await loadLibrary();

        showToast(
            "Bibliothèque actualisée.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Impossible d'actualiser la bibliothèque.",
            "error"
        );

    }

    finally {

        setRefreshLoading(
            false
        );

    }

}


// ==========================================
// Refresh Button Loading
// ==========================================

function setRefreshLoading(
    loading
) {

    if (!libraryRefreshButton) {

        return;

    }


    libraryRefreshButton.disabled =
        loading;


    if (loading) {

        libraryRefreshButton.classList.add(
            "loading"
        );

        libraryRefreshButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Actualisation...
            </span>

        `;

    }

    else {

        libraryRefreshButton.classList.remove(
            "loading"
        );

        libraryRefreshButton.innerHTML = `

            <i class="fa-solid fa-rotate"></i>

            <span>
                Actualiser
            </span>

        `;

    }

}


// ==========================================
// Clear History
// ==========================================

function askClearHistory() {

    openConfirmModal(
        "Voulez-vous vraiment effacer tout votre historique ? Cette action est irréversible.",
        async () => {

            try {

                const result =
                    await clearWatchHistory();


                if (
                    result?.error
                ) {

                    throw result.error;

                }


                historyData =
                    [];

                filteredHistory =
                    [];


                updateCounts();

                renderHistory(
                    []
                );


                showToast(
                    "Votre historique a été effacé.",
                    "success"
                );

            }

            catch (error) {

                console.error(
                    error
                );

                showToast(
                    "Impossible d'effacer l'historique.",
                    "error"
                );

            }

        }
    );

}


// ==========================================
// Remove Watch Later
// ==========================================

async function removeFromWatchLater(
    videoId
) {

    if (!videoId) {

        return;

    }


    try {

        const result =
            await removeWatchLater(
                videoId
            );


        if (
            result?.error
        ) {

            throw result.error;

        }


        watchLaterData =
            watchLaterData.filter(
                item => {

                    const video =
                        getVideoFromItem(
                            item
                        );

                    return (
                        video?.id !== videoId
                    );

                }
            );


        updateCounts();

        applyCurrentTabFilters();


        showToast(
            "Vidéo retirée de À regarder plus tard.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Impossible de retirer cette vidéo.",
            "error"
        );

    }

}


// ==========================================
// Remove Liked
// ==========================================

async function removeFromLiked(
    videoId
) {

    if (!videoId) {

        return;

    }


    try {

        const result =
            await unlikeVideo(
                videoId
            );


        if (
            result?.error
        ) {

            throw result.error;

        }


        likedData =
            likedData.filter(
                item => {

                    const video =
                        getVideoFromItem(
                            item
                        );

                    return (
                        video?.id !== videoId
                    );

                }
            );


        updateCounts();

        applyCurrentTabFilters();


        showToast(
            "Vidéo retirée de vos J'aime.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Impossible de retirer votre J'aime.",
            "error"
        );

    }

}


// ==========================================
// Delete Playlist
// ==========================================

function askDeletePlaylist(
    playlistId
) {

    if (!playlistId) {

        return;

    }


    openConfirmModal(
        "Voulez-vous vraiment supprimer cette playlist ? Cette action est irréversible.",
        async () => {

            try {

                const result =
                    await deletePlaylist(
                        playlistId
                    );


                if (
                    result?.error
                ) {

                    throw result.error;

                }


                playlistsData =
                    playlistsData.filter(
                        playlist =>
                            playlist.id !== playlistId
                    );


                updateCounts();

                applyCurrentTabFilters();


                showToast(
                    "Playlist supprimée.",
                    "success"
                );

            }

            catch (error) {

                console.error(
                    error
                );

                showToast(
                    "Impossible de supprimer la playlist.",
                    "error"
                );

            }

        }
    );

}


// ==========================================
// Video Menu
// ==========================================

function handleVideoMenu(
    videoId,
    source
) {

    if (!videoId) {

        return;

    }


    if (
        source === "watch-later"
    ) {

        openConfirmModal(
            "Retirer cette vidéo de votre liste À regarder plus tard ?",
            async () => {

                await removeFromWatchLater(
                    videoId
                );

            }
        );

        return;

    }


    if (
        source === "liked"
    ) {

        openConfirmModal(
            "Retirer votre J'aime de cette vidéo ?",
            async () => {

                await removeFromLiked(
                    videoId
                );

            }
        );

        return;

    }


    if (
        source === "history"
    ) {

        showToast(
            "Pour effacer complètement l'historique, utilisez le bouton « Effacer l'historique ».",
            "info"
        );

    }

}


// ==========================================
// Confirmation Modal
// ==========================================

function openConfirmModal(
    message,
    action
) {

    if (!libraryConfirmModal) {

        return;

    }


    confirmAction =
        typeof action === "function"
            ? action
            : null;


    if (libraryConfirmMessage) {

        libraryConfirmMessage.textContent =
            message;

    }


    libraryConfirmModal.hidden =
        false;

    document.body.classList.add(
        "library-modal-open"
    );


    setTimeout(
        () => {

            libraryConfirmAction?.focus();

        },
        0
    );

}


// ==========================================
// Close Modal
// ==========================================

function closeConfirmModal() {

    if (!libraryConfirmModal) {

        return;

    }


    libraryConfirmModal.hidden =
        true;

    document.body.classList.remove(
        "library-modal-open"
    );


    confirmAction =
        null;

}


// ==========================================
// Confirm Action
// ==========================================

async function executeConfirmAction() {

    if (
        typeof confirmAction !==
        "function"
    ) {

        closeConfirmModal();

        return;

    }


    const action =
        confirmAction;


    closeConfirmModal();


    try {

        await action();

    }

    catch (error) {

        console.error(
            error
        );

    }

}


// ==========================================
// Toast
// ==========================================

function showToast(
    message,
    type = "success"
) {

    if (
        !libraryToast ||
        !libraryToastMessage
    ) {

        return;

    }


    clearTimeout(
        toastTimer
    );


    libraryToastMessage.textContent =
        message;


    libraryToast.classList.remove(
        "success",
        "error",
        "info",
        "warning"
    );


    libraryToast.classList.add(
        type
    );


    if (libraryToastIcon) {

        if (
            type === "error"
        ) {

            libraryToastIcon.className =
                "fa-solid fa-circle-exclamation";

        }

        else if (
            type === "warning"
        ) {

            libraryToastIcon.className =
                "fa-solid fa-triangle-exclamation";

        }

        else if (
            type === "info"
        ) {

            libraryToastIcon.className =
                "fa-solid fa-circle-info";

        }

        else {

            libraryToastIcon.className =
                "fa-solid fa-circle-check";

        }

    }


    libraryToast.hidden =
        false;


    requestAnimationFrame(
        () => {

            libraryToast.classList.add(
                "show"
            );

        }
    );


    toastTimer =
        setTimeout(
            () => {

                libraryToast.classList.remove(
                    "show"
                );

                setTimeout(
                    () => {

                        libraryToast.hidden =
                            true;

                    },
                    250
                );

            },
            3500
        );

}


// ==========================================
// Error State
// ==========================================

function showLibraryError() {

    if (libraryError) {

        libraryError.hidden =
            false;

    }


    if (mainContent) {

        mainContent.classList.add(
            "has-library-error"
        );

    }

}


function hideLibraryError() {

    if (libraryError) {

        libraryError.hidden =
            true;

    }


    if (mainContent) {

        mainContent.classList.remove(
            "has-library-error"
        );

    }

}


// ==========================================
// Retry
// ==========================================

async function retryLibrary() {

    if (isLoading) {

        return;

    }


    try {

        hideLibraryError();

        showLoader();

        await loadLibrary();

        showToast(
            "Bibliothèque chargée.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showLibraryError();

        showToast(
            "Le chargement a échoué.",
            "error"
        );

    }

    finally {

        hideLoader();

    }

}


// ==========================================
// Global Search
// ==========================================

function handleGlobalSearch(
    event
) {

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
// Header Events
// ==========================================

async function handleHeaderClick(
    event
) {

    const login =
        event.target.closest(
            "#loginButton"
        );


    if (login) {

        navigate(
            "auth.html"
        );

        return;

    }


    const upload =
        event.target.closest(
            "#uploadButton"
        );


    if (upload) {

        navigate(
            "publish.html"
        );

        return;

    }


    const notifications =
        event.target.closest(
            "#notificationsButton"
        );


    if (notifications) {

        navigate(
            "notification.html"
        );

        return;

    }

}


// ==========================================
// Sidebar Events
// ==========================================

async function handleSidebarClick(
    event
) {

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

        navigate(
            "auth.html"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Impossible de se déconnecter.",
            "error"
        );

    }

}


// ==========================================
// Keyboard Tabs
// ==========================================

function handleTabKeyboard(
    event
) {

    const tabs = [
        libraryTabHistory,
        libraryTabWatchLater,
        libraryTabLiked,
        libraryTabPlaylists
    ].filter(Boolean);


    if (!tabs.length) {

        return;

    }


    const currentIndex =
        tabs.indexOf(
            event.currentTarget
        );


    if (
        currentIndex === -1
    ) {

        return;

    }


    let nextIndex =
        currentIndex;


    if (
        event.key === "ArrowRight"
    ) {

        nextIndex =
            (
                currentIndex + 1
            ) %
            tabs.length;

    }

    else if (
        event.key === "ArrowLeft"
    ) {

        nextIndex =
            (
                currentIndex - 1 +
                tabs.length
            ) %
            tabs.length;

    }

    else if (
        event.key === "Home"
    ) {

        nextIndex =
            0;

    }

    else if (
        event.key === "End"
    ) {

        nextIndex =
            tabs.length - 1;

    }

    else {

        return;

    }


    event.preventDefault();


    const nextTab =
        tabs[nextIndex];


    activateTab(
        nextTab.dataset.libraryTab
    );


    nextTab.focus();

}


// ==========================================
// Event Listeners
// ==========================================

function addEventListeners() {

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
    // Global Search
    // ======================================

    searchForm?.addEventListener(
        "submit",
        handleGlobalSearch
    );


    searchButton?.addEventListener(
        "click",
        handleGlobalSearch
    );


    // ======================================
    // Header
    // ======================================

    headerRight?.addEventListener(
        "click",
        handleHeaderClick
    );


    // ======================================
    // Sidebar
    // ======================================

    sidebarNav?.addEventListener(
        "click",
        handleSidebarClick
    );


    // ======================================
    // Tabs
    // ======================================

    libraryTabs?.addEventListener(
        "click",
        event => {

            const tab =
                event.target.closest(
                    ".library-tab"
                );


            if (!tab) {

                return;

            }


            activateTab(
                tab.dataset.libraryTab
            );

        }
    );


    [
        libraryTabHistory,
        libraryTabWatchLater,
        libraryTabLiked,
        libraryTabPlaylists
    ].forEach(
        tab => {

            tab?.addEventListener(
                "keydown",
                handleTabKeyboard
            );

        }
    );


    // ======================================
    // Library Search
    // ======================================

    librarySearchInput?.addEventListener(
        "input",
        event => {

            handleLibrarySearch(
                event.target.value
            );

        }
    );


    clearLibrarySearch?.addEventListener(
        "click",
        clearSearch
    );


    clearSearchEmptyButton?.addEventListener(
        "click",
        clearSearch
    );


    // ======================================
    // Filter
    // ======================================

    libraryFilter?.addEventListener(
        "change",
        handleFilterChange
    );


    // ======================================
    // Sort
    // ======================================

    librarySort?.addEventListener(
        "change",
        handleSortChange
    );


    // ======================================
    // Refresh
    // ======================================

    libraryRefreshButton?.addEventListener(
        "click",
        refreshLibrary
    );


    // ======================================
    // Clear History
    // ======================================

    clearHistoryButton?.addEventListener(
        "click",
        askClearHistory
    );


    // ======================================
    // Retry
    // ======================================

    libraryRetryButton?.addEventListener(
        "click",
        retryLibrary
    );


    // ======================================
    // Confirmation Modal
    // ======================================

    libraryConfirmClose?.addEventListener(
        "click",
        closeConfirmModal
    );


    libraryConfirmCancel?.addEventListener(
        "click",
        closeConfirmModal
    );


    libraryConfirmBackdrop?.addEventListener(
        "click",
        closeConfirmModal
    );


    libraryConfirmAction?.addEventListener(
        "click",
        executeConfirmAction
    );


    // ======================================
    // Dynamic Library Actions
    // ======================================

    document.addEventListener(
        "click",
        event => {

            const videoMenu =
                event.target.closest(
                    '[data-action="video-menu"]'
                );


            if (videoMenu) {

                event.stopPropagation();

                handleVideoMenu(
                    videoMenu.dataset.videoId,
                    videoMenu.closest(
                        ".library-video-card"
                    )?.dataset.source
                );

                return;

            }


            const deletePlaylist =
                event.target.closest(
                    '[data-action="delete-playlist"]'
                );


            if (deletePlaylist) {

                event.stopPropagation();

                askDeletePlaylist(
                    deletePlaylist.dataset.playlistId
                );

            }

        }
    );


    // ======================================
    // Escape
    // ======================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                if (
                    libraryConfirmModal &&
                    !libraryConfirmModal.hidden
                ) {

                    closeConfirmModal();

                    return;

                }


                if (sidebarOpen) {

                    closeSidebar();

                }

            }

        }
    );


    // ======================================
    // Resize
    // ======================================

    window.addEventListener(
        "resize",
        handleResize
    );

}


// ==========================================
// Resize
// ==========================================

function handleResize() {

    if (
        window.innerWidth > 900
    ) {

        sidebarOverlay?.classList.remove(
            "active"
        );

    }

}


// ==========================================
// Format Duration
// ==========================================

function formatDuration(
    totalSeconds
) {

    if (
        totalSeconds === null ||
        totalSeconds === undefined ||
        totalSeconds === "" ||
        Number.isNaN(
            Number(totalSeconds)
        ) ||
        Number(totalSeconds) < 0
    ) {

        return "";

    }


    const total =
        Math.floor(
            Number(totalSeconds)
        );


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
        String(
            minutes
        ).padStart(
            2,
            "0"
        );


    const ss =
        String(
            seconds
        ).padStart(
            2,
            "0"
        );


    if (hours > 0) {

        return (
            String(
                hours
            ).padStart(
                2,
                "0"
            ) +
            ":" +
            mm +
            ":" +
            ss
        );

    }


    return (
        mm +
        ":" +
        ss
    );

}


// ==========================================
// Format Views
// ==========================================

function formatViews(
    views
) {

    const value =
        Number(
            views
        ) || 0;


    if (
        value >= 1000000000
    ) {

        return (
            (
                value /
                1000000000
            )
                .toFixed(1)
                .replace(
                    ".0",
                    ""
                ) +
            " Md"
        );

    }


    if (
        value >= 1000000
    ) {

        return (
            (
                value /
                1000000
            )
                .toFixed(1)
                .replace(
                    ".0",
                    ""
                ) +
            " M"
        );

    }


    if (
        value >= 1000
    ) {

        return (
            (
                value /
                1000
            )
                .toFixed(1)
                .replace(
                    ".0",
                    ""
                ) +
            " k"
        );

    }


    return String(
        value
    );

}


// ==========================================
// Format Number
// ==========================================

function formatNumber(
    value
) {

    const number =
        Number(
            value
        ) || 0;


    return new Intl.NumberFormat(
        "fr-FR"
    ).format(
        number
    );

}


// ==========================================
// Escape HTML
// ==========================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// Cleanup
// ==========================================

function destroy() {

    window.removeEventListener(
        "resize",
        handleResize
    );


    closeSidebar();

    closeConfirmModal();

    hideLoader();

}


// ==========================================
// Before Unload
// ==========================================

window.addEventListener(
    "beforeunload",
    destroy
);
