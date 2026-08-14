// ==========================================
// NetView
// js/pages/library.js
// Bibliothèque
// Synchronisé avec data.js / auth.js / navigation.js / ui.js
// ==========================================

import {
    getProfile,
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    subscribeToNotifications,
    getVideoById,
    getWatchHistory,
    deleteWatchHistory,
    clearWatchHistory,
    getWatchLater,
    removeFromWatchLater,
    getLikedVideos,
    removeLikedVideo,
    getPlaylists,
    deletePlaylist,
    getDownloads
} from "../core/data.js";

import {
    getUser,
    isAuthenticated
} from "../core/auth.js";

import {
    initNavigation
} from "../core/navigation.js";


// ==========================================
// DOM
// ==========================================

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


// ==========================================
// State
// ==========================================

const state = {
    activeTab: "history",

    history: [],
    watchLater: [],
    liked: [],
    playlists: [],
    downloads: [],

    search: "",
    filter: "all",
    sort: "recent",

    loading: false,

    confirmAction: null,

    notificationChannel: null
};


// ==========================================
// Initialization
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    initLibrary
);


async function initLibrary() {

    try {

        if (typeof initNavigation === "function") {
            await initNavigation();
        }

        const authenticated =
            await isAuthenticated();

        if (!authenticated) {
            redirectToLogin();
            return;
        }

        bindEvents();

        await loadLibrary();

        initNotifications();

    } catch (error) {

        console.error(
            "NetView Library initialization error:",
            error
        );

        showLibraryError();
    }
}


// ==========================================
// Authentication
// ==========================================

function redirectToLogin() {

    const currentUrl =
        window.location.href;

    window.location.href =
        `login.html?redirect=${encodeURIComponent(currentUrl)}`;
}


// ==========================================
// Events
// ==========================================

function bindEvents() {

    // --------------------------------------
    // Tabs
    // --------------------------------------

    $$("[data-library-tab]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const tab =
                        button.dataset.libraryTab;

                    switchTab(tab);
                }
            );

        });


    // --------------------------------------
    // Refresh
    // --------------------------------------

    $("#libraryRefreshButton")
        ?.addEventListener(
            "click",
            async () => {

                await loadLibrary();

                showToast(
                    "Bibliothèque actualisée.",
                    "success"
                );
            }
        );


    // --------------------------------------
    // Search
    // --------------------------------------

    $("#librarySearchInput")
        ?.addEventListener(
            "input",
            event => {

                state.search =
                    event.target.value
                        .trim()
                        .toLowerCase();

                updateClearSearchButton();

                renderActiveSection();
            }
        );


    $("#clearLibrarySearch")
        ?.addEventListener(
            "click",
            clearLibrarySearch
        );


    $("#clearSearchEmptyButton")
        ?.addEventListener(
            "click",
            clearLibrarySearch
        );


    // --------------------------------------
    // Filter
    // --------------------------------------

    $("#libraryFilter")
        ?.addEventListener(
            "change",
            event => {

                state.filter =
                    event.target.value;

                renderActiveSection();
            }
        );


    // --------------------------------------
    // Sort
    // --------------------------------------

    $("#librarySort")
        ?.addEventListener(
            "change",
            event => {

                state.sort =
                    event.target.value;

                renderActiveSection();
            }
        );


    // --------------------------------------
    // Clear history
    // --------------------------------------

    $("#clearHistoryButton")
        ?.addEventListener(
            "click",
            () => {

                openConfirmModal(
                    "Effacer l'historique",
                    "Voulez-vous vraiment supprimer tout votre historique de visionnage ? Cette action est irréversible.",
                    clearHistory
                );
            }
        );


    // --------------------------------------
    // Retry
    // --------------------------------------

    $("#libraryRetryButton")
        ?.addEventListener(
            "click",
            loadLibrary
        );


    // --------------------------------------
    // Confirmation modal
    // --------------------------------------

    $("#libraryConfirmClose")
        ?.addEventListener(
            "click",
            closeConfirmModal
        );

    $("#libraryConfirmCancel")
        ?.addEventListener(
            "click",
            closeConfirmModal
        );

    $("#libraryConfirmAction")
        ?.addEventListener(
            "click",
            async () => {

                if (
                    typeof state.confirmAction !==
                    "function"
                ) {
                    closeConfirmModal();
                    return;
                }

                const action =
                    state.confirmAction;

                closeConfirmModal();

                await action();
            }
        );

    $(".library-modal-backdrop")
        ?.addEventListener(
            "click",
            closeConfirmModal
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {
                closeConfirmModal();
            }
        }
    );


    // --------------------------------------
    // Global search
    // --------------------------------------

    $("#searchForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const query =
                    $("#searchInput")
                        ?.value
                        ?.trim();

                if (!query) {
                    return;
                }

                window.location.href =
                    `search.html?q=${encodeURIComponent(query)}`;
            }
        );
}


// ==========================================
// Load Library
// ==========================================

async function loadLibrary() {

    if (state.loading) {
        return;
    }

    state.loading = true;

    hideLibraryError();

    try {

        await Promise.all([
            loadHistory(),
            loadWatchLater(),
            loadLikedVideos(),
            loadPlaylists(),
            loadDownloads()
        ]);

        updateCounts();

        renderActiveSection();

    } catch (error) {

        console.error(
            "Erreur chargement bibliothèque :",
            error
        );

        showLibraryError();

    } finally {

        state.loading = false;
    }
}


// ==========================================
// History
// ==========================================

async function loadHistory() {

    setLoading(
        "historyLoading",
        true
    );

    try {

        const data =
            await getWatchHistory({
                limit: 100
            });

        state.history =
            Array.isArray(data)
                ? data
                : [];

    } catch (error) {

        console.error(
            "Erreur historique :",
            error
        );

        state.history = [];

        throw error;

    } finally {

        setLoading(
            "historyLoading",
            false
        );
    }
}


// ==========================================
// Watch Later
// ==========================================

async function loadWatchLater() {

    setLoading(
        "watchLaterLoading",
        true
    );

    try {

        const data =
            await getWatchLater({
                limit: 100
            });

        state.watchLater =
            Array.isArray(data)
                ? data
                : [];

    } catch (error) {

        console.error(
            "Erreur à regarder plus tard :",
            error
        );

        state.watchLater = [];

        throw error;

    } finally {

        setLoading(
            "watchLaterLoading",
            false
        );
    }
}


// ==========================================
// Liked Videos
// ==========================================

async function loadLikedVideos() {

    setLoading(
        "likedLoading",
        true
    );

    try {

        const data =
            await getLikedVideos({
                limit: 100
            });

        state.liked =
            Array.isArray(data)
                ? data
                : [];

    } catch (error) {

        console.error(
            "Erreur vidéos aimées :",
            error
        );

        state.liked = [];

        throw error;

    } finally {

        setLoading(
            "likedLoading",
            false
        );
    }
}


// ==========================================
// Playlists
// ==========================================

async function loadPlaylists() {

    setLoading(
        "playlistsLoading",
        true
    );

    try {

        const data =
            await getPlaylists({
                limit: 100
            });

        state.playlists =
            Array.isArray(data)
                ? data
                : [];

    } catch (error) {

        console.error(
            "Erreur playlists :",
            error
        );

        state.playlists = [];

        throw error;

    } finally {

        setLoading(
            "playlistsLoading",
            false
        );
    }
}


// ==========================================
// Downloads
// ==========================================
//
// IMPORTANT :
// Cette section ne permet PAS de télécharger
// des vidéos protégées par défaut.
//
// Elle affiche uniquement les téléchargements
// autorisés par le créateur et enregistrés
// dans la table downloads.
//
// Le bouton de téléchargement réel doit être
// contrôlé côté publication vidéo.
//
// ==========================================

async function loadDownloads() {

    setLoading(
        "downloadsLoading",
        true
    );

    try {

        if (
            typeof getDownloads !==
            "function"
        ) {
            state.downloads = [];
            return;
        }

        const data =
            await getDownloads({
                limit: 100
            });

        state.downloads =
            Array.isArray(data)
                ? data
                : [];

    } catch (error) {

        console.error(
            "Erreur téléchargements :",
            error
        );

        state.downloads = [];

        // Les téléchargements restent
        // indépendants du reste de la bibliothèque.
        // On n'empêche pas l'affichage des autres onglets.

    } finally {

        setLoading(
            "downloadsLoading",
            false
        );
    }
}


// ==========================================
// Tab Switching
// ==========================================

function switchTab(tab) {

    const validTabs = [
        "history",
        "watch-later",
        "liked",
        "playlists",
        "downloads"
    ];

    if (!validTabs.includes(tab)) {
        return;
    }

    state.activeTab = tab;

    $$("[data-library-tab]")
        .forEach(button => {

            const active =
                button.dataset.libraryTab === tab;

            button.classList.toggle(
                "active",
                active
            );

            button.setAttribute(
                "aria-selected",
                String(active)
            );
        });


    $$("[data-library-section]")
        .forEach(section => {

            const active =
                section.dataset.librarySection === tab;

            section.hidden =
                !active;
        });


    renderActiveSection();
}


// ==========================================
// Render Active Section
// ==========================================

function renderActiveSection() {

    hideSearchEmpty();

    switch (state.activeTab) {

        case "history":
            renderHistory();
            break;

        case "watch-later":
            renderWatchLater();
            break;

        case "liked":
            renderLiked();
            break;

        case "playlists":
            renderPlaylists();
            break;

        case "downloads":
            renderDownloads();
            break;
    }
}


// ==========================================
// Filter + Search + Sort
// ==========================================

function prepareItems(
    items,
    type
) {

    let result =
        Array.isArray(items)
            ? [...items]
            : [];


    // --------------------------------------
    // Search
    // --------------------------------------

    if (state.search) {

        result =
            result.filter(item => {

                const title =
                    String(
                        item.title ||
                        item.video?.title ||
                        item.videos?.title ||
                        item.name ||
                        ""
                    ).toLowerCase();

                const description =
                    String(
                        item.description ||
                        item.video?.description ||
                        item.videos?.description ||
                        ""
                    ).toLowerCase();

                const channel =
                    String(
                        item.channelName ||
                        item.channel?.name ||
                        item.channels?.name ||
                        ""
                    ).toLowerCase();

                return (
                    title.includes(state.search) ||
                    description.includes(state.search) ||
                    channel.includes(state.search)
                );
            });
    }


    // --------------------------------------
    // Filter
    // --------------------------------------

    if (
        state.filter !== "all" &&
        type !== "playlists"
    ) {

        result =
            result.filter(
                item =>
                    getContentType(item) ===
                    state.filter
            );
    }


    // --------------------------------------
    // Sort
    // --------------------------------------

    result.sort(
        (a, b) => {

            switch (state.sort) {

                case "oldest":

                    return (
                        getDateValue(a) -
                        getDateValue(b)
                    );

                case "title":

                    return getTitle(a)
                        .localeCompare(
                            getTitle(b),
                            "fr",
                            {
                                sensitivity:
                                    "base"
                            }
                        );

                case "channel":

                    return getChannelName(a)
                        .localeCompare(
                            getChannelName(b),
                            "fr",
                            {
                                sensitivity:
                                    "base"
                            }
                        );

                case "recent":
                default:

                    return (
                        getDateValue(b) -
                        getDateValue(a)
                    );
            }
        }
    );

    return result;
}


// ==========================================
// Render History
// ==========================================

function renderHistory() {

    const grid =
        $("#historyGrid");

    if (!grid) {
        return;
    }

    const items =
        prepareItems(
            state.history,
            "history"
        );

    grid.innerHTML = "";

    if (!items.length) {

        $("#historyEmpty").hidden =
            Boolean(state.search);

        if (state.search) {
            showSearchEmpty();
        }

        return;
    }

    $("#historyEmpty").hidden =
        true;

    items.forEach(
        item => {

            grid.appendChild(
                createVideoCard(
                    item,
                    {
                        type: "history",
                        removeAction:
                            () =>
                                removeHistoryItem(item)
                    }
                )
            );
        }
    );
}


// ==========================================
// Render Watch Later
// ==========================================

function renderWatchLater() {

    const grid =
        $("#watchLaterGrid");

    if (!grid) {
        return;
    }

    const items =
        prepareItems(
            state.watchLater,
            "watch-later"
        );

    grid.innerHTML = "";

    if (!items.length) {

        $("#watchLaterEmpty").hidden =
            Boolean(state.search);

        if (state.search) {
            showSearchEmpty();
        }

        return;
    }

    $("#watchLaterEmpty").hidden =
        true;

    items.forEach(
        item => {

            grid.appendChild(
                createVideoCard(
                    item,
                    {
                        type: "watch-later",
                        removeAction:
                            () =>
                                removeWatchLaterItem(item)
                    }
                )
            );
        }
    );
}


// ==========================================
// Render Liked
// ==========================================

function renderLiked() {

    const grid =
        $("#likedGrid");

    if (!grid) {
        return;
    }

    const items =
        prepareItems(
            state.liked,
            "liked"
        );

    grid.innerHTML = "";

    if (!items.length) {

        $("#likedEmpty").hidden =
            Boolean(state.search);

        if (state.search) {
            showSearchEmpty();
        }

        return;
    }

    $("#likedEmpty").hidden =
        true;

    items.forEach(
        item => {

            grid.appendChild(
                createVideoCard(
                    item,
                    {
                        type: "liked",
                        removeAction:
                            () =>
                                removeLikedItem(item)
                    }
                )
            );
        }
    );
}


// ==========================================
// Render Playlists
// ==========================================

function renderPlaylists() {

    const grid =
        $("#playlistsGrid");

    if (!grid) {
        return;
    }

    let items =
        Array.isArray(state.playlists)
            ? [...state.playlists]
            : [];


    if (state.search) {

        items =
            items.filter(
                playlist => {

                    const text =
                        `${playlist.name || ""} ${
                            playlist.description || ""
                        }`
                            .toLowerCase();

                    return text.includes(
                        state.search
                    );
                }
            );
    }


    items.sort(
        (a, b) =>
            getDateValue(b) -
            getDateValue(a)
    );


    grid.innerHTML = "";

    if (!items.length) {

        $("#playlistsEmpty").hidden =
            Boolean(state.search);

        if (state.search) {
            showSearchEmpty();
        }

        return;
    }

    $("#playlistsEmpty").hidden =
        true;

    items.forEach(
        playlist => {

            grid.appendChild(
                createPlaylistCard(
                    playlist
                )
            );
        }
    );
}


// ==========================================
// Render Downloads
// ==========================================

function renderDownloads() {

    const grid =
        $("#downloadsGrid");

    if (!grid) {
        return;
    }

    const items =
        prepareItems(
            state.downloads,
            "downloads"
        );

    grid.innerHTML = "";

    if (!items.length) {

        $("#downloadsEmpty").hidden =
            Boolean(state.search);

        if (state.search) {
            showSearchEmpty();
        }

        return;
    }

    $("#downloadsEmpty").hidden =
        true;

    items.forEach(
        item => {

            grid.appendChild(
                createDownloadCard(
                    item
                )
            );
        }
    );
}


// ==========================================
// Video Card
// ==========================================

function createVideoCard(
    item,
    options = {}
) {

    const video =
        item.video ||
        item.videos ||
        item;

    const videoId =
        video.id ||
        item.video_id ||
        item.videoId;

    const title =
        video.title ||
        item.title ||
        "Vidéo sans titre";

    const thumbnail =
        video.thumbnail_url ||
        video.thumbnail ||
        item.thumbnail_url ||
        item.thumbnail ||
        "images/video-placeholder.jpg";

    const channelName =
        video.channelName ||
        video.channels?.name ||
        item.channelName ||
        item.channels?.name ||
        "Chaîne inconnue";

    const channelHandle =
        video.channelHandle ||
        video.channels?.handle ||
        item.channelHandle ||
        item.channels?.handle ||
        "";

    const channelAvatar =
        video.channelAvatar ||
        video.channels?.avatar_url ||
        item.channelAvatar ||
        item.channels?.avatar_url ||
        "images/default-avatar.png";

    const verified =
        Boolean(
            video.channelVerified ||
            video.channels?.verified ||
            item.channelVerified ||
            item.channels?.verified
        );

    const duration =
        video.duration ||
        item.duration ||
        "";

    const views =
        video.views ??
        item.views ??
        0;

    const date =
        item.watched_at ||
        item.created_at ||
        item.updated_at ||
        video.published_at ||
        video.created_at;


    const card =
        document.createElement("article");

    card.className =
        "library-video-card";

    card.dataset.videoId =
        videoId || "";


    // --------------------------------------
    // Thumbnail
    // --------------------------------------

    const thumbnailWrapper =
        document.createElement("div");

    thumbnailWrapper.className =
        "library-video-thumbnail";


    const image =
        document.createElement("img");

    image.src =
        thumbnail;

    image.alt =
        title;

    image.loading =
        "lazy";

    image.addEventListener(
        "error",
        () => {

            image.src =
                "images/video-placeholder.jpg";
        }
    );


    thumbnailWrapper.appendChild(
        image
    );


    if (duration) {

        const durationElement =
            document.createElement("span");

        durationElement.className =
            "library-video-duration";

        durationElement.textContent =
            formatDuration(duration);

        thumbnailWrapper.appendChild(
            durationElement
        );
    }


    thumbnailWrapper.addEventListener(
        "click",
        () => {

            if (!videoId) {
                return;
            }

            window.location.href =
                `player.html?id=${encodeURIComponent(videoId)}`;
        }
    );


    // --------------------------------------
    // Content
    // --------------------------------------

    const content =
        document.createElement("div");

    content.className =
        "library-video-content";


    const titleElement =
        document.createElement("a");

    titleElement.className =
        "library-video-title";

    titleElement.href =
        videoId
            ? `player.html?id=${encodeURIComponent(videoId)}`
            : "#";

    titleElement.textContent =
        title;


    const channel =
        document.createElement("div");

    channel.className =
        "library-video-channel";


    const avatar =
        document.createElement("img");

    avatar.src =
        channelAvatar;

    avatar.alt =
        channelName;

    avatar.loading =
        "lazy";


    const channelLink =
        document.createElement("a");

    channelLink.href =
        channelHandle
            ? `channel.html?handle=${encodeURIComponent(channelHandle)}`
            : "#";

    channelLink.textContent =
        channelName;


    channel.appendChild(
        avatar
    );

    channel.appendChild(
        channelLink
    );


    if (verified) {

        const badge =
            document.createElement("i");

        badge.className =
            "fa-solid fa-circle-check library-verified";

        badge.title =
            "Chaîne vérifiée";

        channel.appendChild(
            badge
        );
    }


    const metadata =
        document.createElement("div");

    metadata.className =
        "library-video-meta";

    metadata.textContent =
        `${formatNumber(views)} vues • ${formatRelativeDate(date)}`;


    content.appendChild(
        titleElement
    );

    content.appendChild(
        channel
    );

    content.appendChild(
        metadata
    );


    // --------------------------------------
    // Actions
    // --------------------------------------

    const actions =
        document.createElement("div");

    actions.className =
        "library-video-actions";


    if (
        typeof options.removeAction ===
        "function"
    ) {

        const removeButton =
            document.createElement("button");

        removeButton.type =
            "button";

        removeButton.className =
            "library-item-remove";

        removeButton.title =
            "Supprimer de la bibliothèque";

        removeButton.setAttribute(
            "aria-label",
            "Supprimer de la bibliothèque"
        );

        removeButton.innerHTML =
            '<i class="fa-solid fa-trash-can"></i>';

        removeButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                options.removeAction();
            }
        );

        actions.appendChild(
            removeButton
        );
    }


    content.appendChild(
        actions
    );


    card.appendChild(
        thumbnailWrapper
    );

    card.appendChild(
        content
    );


    return card;
}


// ==========================================
// Download Card
// ==========================================

function createDownloadCard(
    item
) {

    const video =
        item.video ||
        item.videos ||
        item;

    const videoId =
        video.id ||
        item.video_id ||
        item.videoId;

    const title =
        video.title ||
        item.title ||
        "Contenu téléchargé";

    const thumbnail =
        video.thumbnail_url ||
        video.thumbnail ||
        item.thumbnail_url ||
        item.thumbnail ||
        "images/video-placeholder.jpg";

    const channelName =
        video.channels?.name ||
        video.channelName ||
        item.channelName ||
        "Chaîne inconnue";

    const createdAt =
        item.downloaded_at ||
        item.created_at ||
        video.created_at;


    const card =
        createVideoCard(
            item,
            {
                type: "downloads"
            }
        );


    card.classList.add(
        "library-download-card"
    );


    const content =
        card.querySelector(
            ".library-video-content"
        );

    if (content) {

        const status =
            document.createElement("div");

        status.className =
            "library-download-status";

        status.innerHTML =
            '<i class="fa-solid fa-circle-check"></i> Disponible hors connexion';

        content.appendChild(
            status
        );
    }


    return card;
}


// ==========================================
// Playlist Card
// ==========================================

function createPlaylistCard(
    playlist
) {

    const card =
        document.createElement("article");

    card.className =
        "library-playlist-card";


    const playlistId =
        playlist.id;


    const link =
        document.createElement("a");

    link.href =
        `playlist.html?id=${encodeURIComponent(playlistId)}`;

    link.className =
        "library-playlist-card-link";


    const cover =
        document.createElement("div");

    cover.className =
        "library-playlist-cover";


    const image =
        document.createElement("img");

    image.src =
        playlist.thumbnail_url ||
        playlist.cover_url ||
        "images/playlist-placeholder.jpg";

    image.alt =
        playlist.name ||
        "Playlist";

    image.loading =
        "lazy";


    image.addEventListener(
        "error",
        () => {

            image.src =
                "images/playlist-placeholder.jpg";
        }
    );


    const count =
        document.createElement("span");

    count.className =
        "library-playlist-count";

    const videoCount =
        playlist.video_count ??
        playlist.items_count ??
        0;

    count.innerHTML =
        `<i class="fa-solid fa-list"></i> ${formatNumber(videoCount)}`;


    cover.appendChild(
        image
    );

    cover.appendChild(
        count
    );


    const info =
        document.createElement("div");

    info.className =
        "library-playlist-info";


    const title =
        document.createElement("h3");

    title.className =
        "library-playlist-title";

    title.textContent =
        playlist.name ||
        "Playlist sans titre";


    const description =
        document.createElement("p");

    description.className =
        "library-playlist-description";

    description.textContent =
        playlist.description ||
        "Aucune description";


    info.appendChild(
        title
    );

    info.appendChild(
        description
    );


    link.appendChild(
        cover
    );

    link.appendChild(
        info
    );


    const actions =
        document.createElement("div");

    actions.className =
        "library-playlist-actions";


    const deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.className =
        "library-item-remove";

    deleteButton.title =
        "Supprimer la playlist";

    deleteButton.innerHTML =
        '<i class="fa-solid fa-trash-can"></i>';


    deleteButton.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            openConfirmModal(
                "Supprimer la playlist",
                `Voulez-vous vraiment supprimer « ${playlist.name || "cette playlist"} » ?`,
                () =>
                    removePlaylist(
                        playlist
                    )
            );
        }
    );


    actions.appendChild(
        deleteButton
    );


    card.appendChild(
        link
    );

    card.appendChild(
        actions
    );


    return card;
}


// ==========================================
// Remove History Item
// ==========================================

async function removeHistoryItem(
    item
) {

    const historyId =
        item.id ||
        item.history_id;

    if (!historyId) {
        return;
    }

    try {

        const result =
            await deleteWatchHistory(
                historyId
            );

        if (result?.error) {
            throw result.error;
        }

        state.history =
            state.history.filter(
                entry =>
                    (
                        entry.id ||
                        entry.history_id
                    ) !== historyId
            );

        updateCounts();

        renderHistory();

        showToast(
            "Élément supprimé de l'historique.",
            "success"
        );

    } catch (error) {

        console.error(
            "Erreur suppression historique :",
            error
        );

        showToast(
            "Impossible de supprimer cet élément.",
            "error"
        );
    }
}


// ==========================================
// Clear History
// ==========================================

async function clearHistory() {

    try {

        const result =
            await clearWatchHistory();

        if (result?.error) {
            throw result.error;
        }

        state.history = [];

        updateCounts();

        renderHistory();

        showToast(
            "Historique effacé.",
            "success"
        );

    } catch (error) {

        console.error(
            "Erreur effacement historique :",
            error
        );

        showToast(
            "Impossible d'effacer l'historique.",
            "error"
        );
    }
}


// ==========================================
// Remove Watch Later
// ==========================================

async function removeWatchLaterItem(
    item
) {

    const videoId =
        item.video_id ||
        item.video?.id ||
        item.videos?.id ||
        item.id;

    if (!videoId) {
        return;
    }

    try {

        const result =
            await removeFromWatchLater(
                videoId
            );

        if (result?.error) {
            throw result.error;
        }

        state.watchLater =
            state.watchLater.filter(
                entry =>
                    (
                        entry.video_id ||
                        entry.video?.id ||
                        entry.videos?.id ||
                        entry.id
                    ) !== videoId
            );

        updateCounts();

        renderWatchLater();

        showToast(
            "Vidéo retirée de À regarder plus tard.",
            "success"
        );

    } catch (error) {

        console.error(
            "Erreur suppression watch later :",
            error
        );

        showToast(
            "Impossible de retirer cette vidéo.",
            "error"
        );
    }
}


// ==========================================
// Remove Liked Video
// ==========================================

async function removeLikedItem(
    item
) {

    const videoId =
        item.video_id ||
        item.video?.id ||
        item.videos?.id ||
        item.id;

    if (!videoId) {
        return;
    }

    try {

        const result =
            await removeLikedVideo(
                videoId
            );

        if (result?.error) {
            throw result.error;
        }

        state.liked =
            state.liked.filter(
                entry =>
                    (
                        entry.video_id ||
                        entry.video?.id ||
                        entry.videos?.id ||
                        entry.id
                    ) !== videoId
            );

        updateCounts();

        renderLiked();

        showToast(
            "Vidéo retirée de vos vidéos aimées.",
            "success"
        );

    } catch (error) {

        console.error(
            "Erreur suppression vidéo aimée :",
            error
        );

        showToast(
            "Impossible de retirer cette vidéo.",
            "error"
        );
    }
}


// ==========================================
// Remove Playlist
// ==========================================

async function removePlaylist(
    playlist
) {

    if (!playlist?.id) {
        return;
    }

    try {

        const result =
            await deletePlaylist(
                playlist.id
            );

        if (result?.error) {
            throw result.error;
        }

        state.playlists =
            state.playlists.filter(
                item =>
                    item.id !==
                    playlist.id
            );

        updateCounts();

        renderPlaylists();

        showToast(
            "Playlist supprimée.",
            "success"
        );

    } catch (error) {

        console.error(
            "Erreur suppression playlist :",
            error
        );

        showToast(
            "Impossible de supprimer la playlist.",
            "error"
        );
    }
}


// ==========================================
// Counts
// ==========================================

function updateCounts() {

    updateCount(
        "historyCount",
        state.history.length
    );

    updateCount(
        "watchLaterCount",
        state.watchLater.length
    );

    updateCount(
        "likedCount",
        state.liked.length
    );

    updateCount(
        "playlistsCount",
        state.playlists.length
    );

    updateCount(
        "downloadsCount",
        state.downloads.length
    );
}


function updateCount(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        formatNumber(value);

    element.hidden =
        value <= 0;
}


// ==========================================
// Notifications Realtime
// ==========================================

function initNotifications() {

    try {

        state.notificationChannel =
            subscribeToNotifications(
                async payload => {

                    console.log(
                        "Notification bibliothèque :",
                        payload
                    );

                    await updateHeaderNotificationCount();
                }
            );

    } catch (error) {

        console.warn(
            "Realtime notifications indisponible :",
            error
        );
    }
}


async function updateHeaderNotificationCount() {

    try {

        const count =
            await getUnreadNotificationCount();

        const elements =
            $$(
                "[data-notification-count]"
            );

        elements.forEach(
            element => {

                element.textContent =
                    formatNumber(count);

                element.hidden =
                    count <= 0;
            }
        );

    } catch (error) {

        console.warn(
            "Erreur compteur notifications :",
            error
        );
    }
}


// ==========================================
// Search
// ==========================================

function clearLibrarySearch() {

    state.search = "";

    const input =
        $("#librarySearchInput");

    if (input) {
        input.value = "";
    }

    updateClearSearchButton();

    hideSearchEmpty();

    renderActiveSection();
}


function updateClearSearchButton() {

    const button =
        $("#clearLibrarySearch");

    if (!button) {
        return;
    }

    button.hidden =
        !state.search;
}


function showSearchEmpty() {

    const element =
        $("#librarySearchEmpty");

    if (element) {
        element.hidden = false;
    }
}


function hideSearchEmpty() {

    const element =
        $("#librarySearchEmpty");

    if (element) {
        element.hidden = true;
    }
}


// ==========================================
// Loading
// ==========================================

function setLoading(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.hidden =
            !value;
    }
}


// ==========================================
// Error
// ==========================================

function showLibraryError() {

    const error =
        $("#libraryError");

    if (error) {
        error.hidden = false;
    }

    $$("[data-library-section]")
        .forEach(
            section => {
                section.hidden = true;
            }
        );
}


function hideLibraryError() {

    const error =
        $("#libraryError");

    if (error) {
        error.hidden = true;
    }
}


// ==========================================
// Confirmation Modal
// ==========================================

function openConfirmModal(
    title,
    message,
    action
) {

    const modal =
        $("#libraryConfirmModal");

    if (!modal) {
        return;
    }

    $("#libraryConfirmTitle")
        .textContent =
        title;

    $("#libraryConfirmMessage")
        .textContent =
        message;

    state.confirmAction =
        action;

    modal.hidden =
        false;

    document.body.classList.add(
        "library-modal-open"
    );

    $("#libraryConfirmAction")
        ?.focus();
}


function closeConfirmModal() {

    const modal =
        $("#libraryConfirmModal");

    if (!modal) {
        return;
    }

    modal.hidden =
        true;

    state.confirmAction =
        null;

    document.body.classList.remove(
        "library-modal-open"
    );
}


// ==========================================
// Toast
// ==========================================

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    const toast =
        $("#libraryToast");

    const messageElement =
        $("#libraryToastMessage");

    const icon =
        $("#libraryToastIcon");

    if (
        !toast ||
        !messageElement
    ) {
        return;
    }

    messageElement.textContent =
        message;


    if (icon) {

        icon.className =
            type === "error"
                ? "fa-solid fa-circle-exclamation"
                : "fa-solid fa-circle-check";
    }


    toast.dataset.type =
        type;

    toast.hidden =
        false;


    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {

                toast.hidden =
                    true;

            },
            3500
        );
}


// ==========================================
// Utilities
// ==========================================

function getTitle(
    item
) {

    return String(
        item.title ||
        item.video?.title ||
        item.videos?.title ||
        item.name ||
        ""
    );
}


function getChannelName(
    item
) {

    return String(
        item.channelName ||
        item.channel?.name ||
        item.channels?.name ||
        item.video?.channels?.name ||
        item.videos?.channels?.name ||
        ""
    );
}


function getDateValue(
    item
) {

    const value =
        item.watched_at ||
        item.downloaded_at ||
        item.created_at ||
        item.updated_at ||
        item.published_at ||
        item.video?.published_at ||
        item.videos?.published_at;

    const timestamp =
        value
            ? new Date(value).getTime()
            : 0;

    return Number.isFinite(timestamp)
        ? timestamp
        : 0;
}


function getContentType(
    item
) {

    const type =
        item.content_type ||
        item.type ||
        item.video_type ||
        item.media_type;

    if (
        type === "short" ||
        type === "shorts"
    ) {
        return "short";
    }

    if (
        type === "live" ||
        type === "stream"
    ) {
        return "live";
    }

    return "video";
}


function formatNumber(
    value
) {

    const number =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "fr-FR",
        {
            notation:
                number >= 1000
                    ? "compact"
                    : "standard",
            maximumFractionDigits: 1
        }
    ).format(number);
}


function formatRelativeDate(
    value
) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const seconds =
        Math.floor(
            (
                Date.now() -
                date.getTime()
            ) / 1000
        );

    if (seconds < 60) {
        return "à l'instant";
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (minutes < 60) {
        return `il y a ${minutes} min`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {
        return `il y a ${hours} h`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    if (days < 30) {
        return `il y a ${days} j`;
    }

    const months =
        Math.floor(
            days / 30
        );

    if (months < 12) {
        return `il y a ${months} mois`;
    }

    const years =
        Math.floor(
            days / 365
        );

    return `il y a ${years} an${years > 1 ? "s" : ""}`;
}


function formatDuration(
    duration
) {

    if (
        typeof duration ===
        "number"
    ) {

        const seconds =
            Math.max(
                0,
                Math.floor(duration)
            );

        const hours =
            Math.floor(
                seconds / 3600
            );

        const minutes =
            Math.floor(
                (
                    seconds % 3600
                ) / 60
            );

        const secs =
            seconds % 60;

        if (hours > 0) {

            return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        }

        return `${minutes}:${String(secs).padStart(2, "0")}`;
    }

    return String(
        duration || ""
    );
}


// ==========================================
// Cleanup
// ==========================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            state.notificationChannel
        ) {

            import("../core/supabase.js")
                .then(
                    ({ supabase }) => {

                        supabase.removeChannel(
                            state.notificationChannel
                        );
                    }
                )
                .catch(
                    () => {}
                );
        }
    }
);
