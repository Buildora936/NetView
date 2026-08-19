// =========================================================
// NetView
// videos.js
// Jour 21 — Gestion des vidéos
// =========================================================

import {
    getSession,
    getUser
} from "../core/auth.js";

import {
    getProfile,
    getMyChannels,
    select,
    remove,
    subscribe,
    unsubscribe,
    initDeviceRevocationListener
} from "../core/data.js";


// =========================================================
// DEVICE / SESSION
// =========================================================

initDeviceRevocationListener();


// =========================================================
// DOM
// =========================================================

const sidebar =
    document.getElementById("sidebar");

const sidebarNav =
    sidebar?.querySelector(".nv-sidebar-nav");

const sidebarToggle =
    document.getElementById("menuButton");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const headerRight =
    document.getElementById("headerRight");

const searchForm =
    document.getElementById("searchForm");

const searchInput =
    document.getElementById("searchInput");

const videosGrid =
    document.getElementById("videosGrid") ||
    document.getElementById("videos-grid") ||
    document.getElementById("videoGrid");

const loadingState =
    document.getElementById("videosLoading") ||
    document.getElementById("videos-loading");

const emptyState =
    document.getElementById("videosEmpty") ||
    document.getElementById("videos-empty");

const errorState =
    document.getElementById("videosError") ||
    document.getElementById("videos-error");

const errorMessage =
    document.getElementById("videosErrorMessage") ||
    document.getElementById("videos-error-message");

const retryButton =
    document.getElementById("videosRetryButton") ||
    document.getElementById("videos-retry-button");

const searchVideosInput =
    document.getElementById("videoSearch") ||
    document.getElementById("videosSearch") ||
    document.getElementById("video-search");

const sortSelect =
    document.getElementById("videoSort") ||
    document.getElementById("videosSort") ||
    document.getElementById("video-sort");

const filterSelect =
    document.getElementById("videoFilter") ||
    document.getElementById("videosFilter") ||
    document.getElementById("video-filter");

const channelSelect =
    document.getElementById("videoChannel") ||
    document.getElementById("videosChannel") ||
    document.getElementById("video-channel");

const totalVideosElement =
    document.getElementById("totalVideos") ||
    document.getElementById("videosCount");

const publishedVideosElement =
    document.getElementById("publishedVideos") ||
    document.getElementById("publishedCount");

const processingVideosElement =
    document.getElementById("processingVideos") ||
    document.getElementById("processingCount");

const privateVideosElement =
    document.getElementById("privateVideos") ||
    document.getElementById("privateCount");


// =========================================================
// STATE
// =========================================================

let currentUser = null;

let currentProfile = null;

let myChannels = [];

let myChannelIds = [];

let allVideos = [];

let filteredVideos = [];

let realtimeChannels = [];

let activeSearch = "";

let activeSort = "recent";

let activeFilter = "all";

let activeChannel = "all";

let isLoading = false;

let isDeleting = false;


// =========================================================
// CONSTANTS
// =========================================================

const DEFAULT_THUMBNAIL =
    "assets/images/default-thumbnail.png";

const DEFAULT_AVATAR =
    "assets/images/default-avatar.png";

const PAGE_SIZE = 24;


// =========================================================
// INIT
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    setupSidebarEvents();

    setupSearch();

    setupVideoSearch();

    setupSort();

    setupFilter();

    setupChannelFilter();

    setupRetry();

    showLoading();

    try {

        const session =
            await getSession();

        // -------------------------------------------------
        // VISITOR
        // -------------------------------------------------

        if (!session) {

            currentUser = null;

            currentProfile = null;

            showGuestHeader();

            showGuestSidebar();

            renderGuestState();

            return;
        }


        // -------------------------------------------------
        // USER
        // -------------------------------------------------

        currentUser =
            await getUser();

        if (!currentUser) {

            currentUser = null;

            currentProfile = null;

            showGuestHeader();

            showGuestSidebar();

            renderGuestState();

            return;
        }


        // -------------------------------------------------
        // PROFILE
        // -------------------------------------------------

        try {

            currentProfile =
                await getProfile();

        } catch (error) {

            console.warn(
                "NetView: impossible de récupérer le profil.",
                error
            );

            currentProfile = null;
        }


        // -------------------------------------------------
        // HEADER / SIDEBAR
        // -------------------------------------------------

        showUserHeader();

        showUserSidebar();


        // -------------------------------------------------
        // CHANNELS
        // -------------------------------------------------

        await loadMyChannels();


        // -------------------------------------------------
        // VIDEOS
        // -------------------------------------------------

        await loadVideos();


        // -------------------------------------------------
        // REALTIME
        // -------------------------------------------------

        setupRealtime();

    } catch (error) {

        console.error(
            "NetView videos init error:",
            error
        );

        showError(
            "Impossible de charger vos vidéos."
        );

    } finally {

        hideLoading();

    }
}


// =========================================================
// HEADER — GUEST
// =========================================================

function showGuestHeader() {

    if (!headerRight) {
        return;
    }

    headerRight.innerHTML = `

        <button
            type="button"
            id="loginButton"
            class="nv-login-button"
            aria-label="S'identifier"
            title="S'identifier"
        >

            <i class="fa-regular fa-user"></i>

            <span>
                S'identifier
            </span>

        </button>

    `;


    document
        .getElementById("loginButton")
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "auth.html";

            }
        );
}


// =========================================================
// HEADER — USER
// =========================================================

function showUserHeader() {

    if (!headerRight) {
        return;
    }

    const avatar =
        currentProfile?.avatar_url ||
        DEFAULT_AVATAR;

    const displayName =
        currentProfile?.display_name ||
        currentProfile?.username ||
        currentUser?.email ||
        "Utilisateur";


    headerRight.innerHTML = `

        <button
            type="button"
            class="nv-icon-button"
            id="uploadButton"
            aria-label="Publier"
            title="Publier"
        >
            <i class="fa-solid fa-plus nv-plus-icon"></i>
        </button>


        <button
            type="button"
            class="nv-icon-button"
            id="headerNotificationsButton"
            aria-label="Notifications"
            title="Notifications"
        >
            <i class="fa-regular fa-bell"></i>
        </button>


        <a
            href="profile.html"
            class="nv-header-profile-avatar"
            aria-label="Mon profil"
            title="${escapeAttribute(displayName)}"
        >

            <img
                src="${escapeAttribute(avatar)}"
                alt="${escapeAttribute(displayName)}"
            >

        </a>

    `;


    document
        .getElementById(
            "uploadButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "publish.html";

            }
        );


    document
        .getElementById(
            "headerNotificationsButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "notification.html";

            }
        );
}


// =========================================================
// SIDEBAR — GUEST
// =========================================================

function showGuestSidebar() {

    if (!sidebarNav) {
        return;
    }

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


// =========================================================
// SIDEBAR — USER
// =========================================================

function showUserSidebar() {

    if (!sidebarNav) {
        return;
    }

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
            href="subscriptions.html"
        >
            <i class="fa-solid fa-tv"></i>
            <span>Abonnements</span>
        </a>


        <a
            href="videos.html"
            class="active"
            aria-current="page"
        >
            <i class="fa-solid fa-video"></i>
            <span>Mes vidéos</span>
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


// =========================================================
// SIDEBAR EVENTS
// =========================================================

function setupSidebarEvents() {

    sidebarToggle?.addEventListener(
        "click",
        () => {

            if (
                sidebar?.classList.contains("open")
            ) {

                closeSidebar();

            } else {

                openSidebar();

            }

        }
    );


    sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeSidebar();

            }

        }
    );
}


function openSidebar() {

    sidebar?.classList.add(
        "open"
    );

    sidebarOverlay?.classList.add(
        "active"
    );

    sidebarToggle?.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeSidebar() {

    sidebar?.classList.remove(
        "open"
    );

    sidebarOverlay?.classList.remove(
        "active"
    );

    sidebarToggle?.setAttribute(
        "aria-expanded",
        "false"
    );
}


// =========================================================
// GLOBAL SEARCH
// =========================================================

function setupSearch() {

    if (!searchForm) {
        return;
    }

    searchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const query =
                searchInput?.value?.trim();

            if (!query) {
                return;
            }

            window.location.href =
                `search.html?q=${encodeURIComponent(query)}`;

        }
    );
}


// =========================================================
// VIDEO SEARCH
// =========================================================

function setupVideoSearch() {

    if (!searchVideosInput) {
        return;
    }

    searchVideosInput.addEventListener(
        "input",
        event => {

            activeSearch =
                event.target.value
                    ?.trim()
                    .toLowerCase() ||
                "";

            renderVideos();

        }
    );
}


// =========================================================
// SORT
// =========================================================

function setupSort() {

    if (!sortSelect) {
        return;
    }

    activeSort =
        sortSelect.value ||
        "recent";


    sortSelect.addEventListener(
        "change",
        () => {

            activeSort =
                sortSelect.value ||
                "recent";

            renderVideos();

        }
    );
}


// =========================================================
// FILTER
// =========================================================

function setupFilter() {

    if (!filterSelect) {
        return;
    }

    activeFilter =
        filterSelect.value ||
        "all";


    filterSelect.addEventListener(
        "change",
        () => {

            activeFilter =
                filterSelect.value ||
                "all";

            renderVideos();

        }
    );
}


// =========================================================
// CHANNEL FILTER
// =========================================================

function setupChannelFilter() {

    if (!channelSelect) {
        return;
    }

    channelSelect.addEventListener(
        "change",
        () => {

            activeChannel =
                channelSelect.value ||
                "all";

            renderVideos();

        }
    );
}


// =========================================================
// LOAD CHANNELS
// =========================================================

async function loadMyChannels() {

    if (!currentUser) {
        return;
    }

    try {

        const channels =
            await getMyChannels();

        myChannels =
            Array.isArray(channels)
                ? channels
                : [];


        myChannelIds =
            myChannels
                .map(
                    channel =>
                        channel.id
                )
                .filter(Boolean);


        populateChannelFilter();

    } catch (error) {

        console.error(
            "NetView load channels error:",
            error
        );

        myChannels = [];

        myChannelIds = [];
    }
}


// =========================================================
// CHANNEL FILTER OPTIONS
// =========================================================

function populateChannelFilter() {

    if (!channelSelect) {
        return;
    }


    const currentValue =
        channelSelect.value;


    channelSelect.innerHTML = `

        <option value="all">
            Toutes les chaînes
        </option>

    `;


    myChannels.forEach(
        channel => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                channel.id;

            option.textContent =
                channel.name ||
                channel.title ||
                channel.handle ||
                "Chaîne";

            channelSelect.appendChild(
                option
            );

        }
    );


    if (
        currentValue &&
        [
            ...channelSelect.options
        ].some(
            option =>
                option.value ===
                currentValue
        )
    ) {

        channelSelect.value =
            currentValue;

    }
}


// =========================================================
// LOAD VIDEOS
// =========================================================

async function loadVideos() {

    if (!currentUser) {
        return;
    }


    clearError();

    showLoading();


    try {

        if (
            myChannelIds.length === 0
        ) {

            allVideos = [];

            updateStatistics();

            renderEmptyState();

            return;
        }


        const result =
            await select(
                "videos",
                `
                    *,
                    channels (
                        id,
                        name,
                        handle,
                        avatar_url,
                        verified
                    )
                `,
                [
                    {
                        method: "in",
                        column: "channel_id",
                        value: myChannelIds
                    }
                ]
            );


        if (result?.error) {
            throw result.error;
        }


        allVideos =
            Array.isArray(result?.data)
                ? result.data
                : [];


        updateStatistics();

        renderVideos();

    } catch (error) {

        console.error(
            "NetView load videos error:",
            error
        );

        showError(
            "Impossible de récupérer vos vidéos."
        );

    } finally {

        hideLoading();

    }
}


// =========================================================
// FILTER / SORT
// =========================================================

function getProcessedVideos() {

    let result =
        [...allVideos];


    // -----------------------------------------------------
    // STATUS
    // -----------------------------------------------------

    if (
        activeFilter !== "all"
    ) {

        result =
            result.filter(
                video =>
                    normalizeStatus(
                        video.status
                    ) ===
                    activeFilter
            );

    }


    // -----------------------------------------------------
    // CHANNEL
    // -----------------------------------------------------

    if (
        activeChannel !== "all"
    ) {

        result =
            result.filter(
                video =>
                    video.channel_id ===
                    activeChannel
            );

    }


    // -----------------------------------------------------
    // SEARCH
    // -----------------------------------------------------

    if (activeSearch) {

        result =
            result.filter(
                video => {

                    const title =
                        String(
                            video.title ||
                            ""
                        ).toLowerCase();

                    const description =
                        String(
                            video.description ||
                            ""
                        ).toLowerCase();

                    const channelName =
                        String(
                            video.channels?.name ||
                            ""
                        ).toLowerCase();

                    return (
                        title.includes(
                            activeSearch
                        ) ||
                        description.includes(
                            activeSearch
                        ) ||
                        channelName.includes(
                            activeSearch
                        )
                    );

                }
            );

    }


    // -----------------------------------------------------
    // SORT
    // -----------------------------------------------------

    result.sort(
        (a, b) => {

            if (
                activeSort ===
                "popular"
            ) {

                return (
                    Number(
                        b.views || 0
                    ) -
                    Number(
                        a.views || 0
                    )
                );

            }


            if (
                activeSort ===
                "likes"
            ) {

                return (
                    Number(
                        b.likes || 0
                    ) -
                    Number(
                        a.likes || 0
                    )
                );

            }


            if (
                activeSort ===
                "oldest"
            ) {

                return (
                    getDateValue(a) -
                    getDateValue(b)
                );

            }


            if (
                activeSort ===
                "title"
            ) {

                return String(
                    a.title ||
                    ""
                ).localeCompare(
                    String(
                        b.title ||
                        ""
                    ),
                    "fr",
                    {
                        sensitivity: "base"
                    }
                );

            }


            return (
                getDateValue(b) -
                getDateValue(a)
            );

        }
    );


    return result;
}


// =========================================================
// RENDER VIDEOS
// =========================================================

function renderVideos() {

    if (!videosGrid) {
        return;
    }


    filteredVideos =
        getProcessedVideos();


    videosGrid.innerHTML = "";


    if (
        filteredVideos.length === 0
    ) {

        renderFilteredEmptyState();

        return;
    }


    hideElement(
        emptyState
    );


    hideElement(
        errorState
    );


    showElement(
        videosGrid
    );


    const fragment =
        document.createDocumentFragment();


    filteredVideos
        .slice(
            0,
            PAGE_SIZE
        )
        .forEach(
            video => {

                fragment.appendChild(
                    createVideoCard(
                        video
                    )
                );

            }
        );


    videosGrid.appendChild(
        fragment
    );
}


// =========================================================
// VIDEO CARD
// =========================================================

function createVideoCard(
    video
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "video-card";


    article.dataset.videoId =
        video.id;


    const title =
        video.title ||
        "Vidéo sans titre";


    const thumbnail =
        video.thumbnail_url ||
        DEFAULT_THUMBNAIL;


    const channelName =
        video.channels?.name ||
        getChannelName(
            video.channel_id
        ) ||
        "Chaîne";


    const avatar =
        video.channels?.avatar_url ||
        DEFAULT_AVATAR;


    const views =
        formatNumber(
            video.views || 0
        );


    const likes =
        formatNumber(
            video.likes || 0
        );


    const duration =
        formatDuration(
            video.duration
        );


    const status =
        normalizeStatus(
            video.status
        );


    const visibility =
        normalizeVisibility(
            video.visibility
        );


    const date =
        formatDate(
            video.published_at ||
            video.created_at
        );


    const verified =
        Boolean(
            video.channels?.verified
        );


    article.innerHTML = `

        <div class="video-card-thumbnail-wrapper">

            <a
                href="${escapeAttribute(
                    getVideoUrl(video)
                )}"
                class="video-card-thumbnail-link"
                aria-label="${escapeAttribute(title)}"
            >

                <div class="video-card-thumbnail">

                    <img
                        src="${escapeAttribute(thumbnail)}"
                        alt="${escapeAttribute(title)}"
                        loading="lazy"
                    >


                    ${
                        duration
                            ? `
                                <span class="video-card-duration">
                                    ${escapeHTML(duration)}
                                </span>
                              `
                            : ""
                    }

                </div>

            </a>


            <button
                type="button"
                class="video-card-menu"
                data-action="menu"
                aria-label="Options"
                title="Options"
            >

                <i class="fa-solid fa-ellipsis-vertical"></i>

            </button>

        </div>


        <div class="video-card-body">

            <div class="video-card-avatar">

                <img
                    src="${escapeAttribute(avatar)}"
                    alt=""
                    loading="lazy"
                    aria-hidden="true"
                >

            </div>


            <div class="video-card-content">

                <a
                    href="${escapeAttribute(
                        getVideoUrl(video)
                    )}"
                    class="video-card-title"
                    title="${escapeAttribute(title)}"
                >
                    ${escapeHTML(title)}
                </a>


                <a
                    href="${escapeAttribute(
                        getChannelUrl(
                            video.channels ||
                            {
                                id:
                                    video.channel_id
                            }
                        )
                    )}"
                    class="video-card-channel"
                >

                    ${escapeHTML(channelName)}

                    ${
                        verified
                            ? `
                                <i
                                    class="fa-solid fa-circle-check"
                                    aria-label="Vérifié"
                                ></i>
                              `
                            : ""
                    }

                </a>


                <div class="video-card-meta">

                    <span>
                        ${escapeHTML(views)} vues
                    </span>

                    <span aria-hidden="true">
                        •
                    </span>

                    <span>
                        ${escapeHTML(date)}
                    </span>

                </div>


                <div class="video-card-status-row">

                    <span
                        class="video-status video-status-${escapeAttribute(status)}"
                    >
                        ${getStatusLabel(status)}
                    </span>


                    <span
                        class="video-visibility video-visibility-${escapeAttribute(visibility)}"
                    >

                        <i class="${getVisibilityIcon(visibility)}"></i>

                        ${getVisibilityLabel(visibility)}

                    </span>


                    <span class="video-card-likes">

                        <i class="fa-regular fa-thumbs-up"></i>

                        ${escapeHTML(likes)}

                    </span>

                </div>

            </div>

        </div>


        <div class="video-card-actions">

            <a
                href="${escapeAttribute(
                    getEditUrl(video)
                )}"
                class="nv-button nv-button-secondary video-edit-button"
            >

                <i class="fa-solid fa-pen"></i>

                Modifier

            </a>


            <a
                href="${escapeAttribute(
                    getVideoUrl(video)
                )}"
                class="nv-button nv-button-primary"
            >

                <i class="fa-solid fa-play"></i>

                Voir

            </a>


            <button
                type="button"
                class="nv-button nv-button-danger video-delete-button"
                data-video-id="${escapeAttribute(video.id)}"
            >

                <i class="fa-solid fa-trash"></i>

                Supprimer

            </button>

        </div>

    `;


    const deleteButton =
        article.querySelector(
            ".video-delete-button"
        );


    deleteButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            handleDeleteVideo(
                video,
                article
            );

        }
    );


    const menuButton =
        article.querySelector(
            ".video-card-menu"
        );


    menuButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openVideoMenu(
                video,
                article,
                menuButton
            );

        }
    );


    return article;
}


// =========================================================
// VIDEO MENU
// =========================================================

function openVideoMenu(
    video,
    article,
    button
) {

    closeVideoMenus();


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "video-card-dropdown";


    menu.innerHTML = `

        <a
            href="${escapeAttribute(
                getEditUrl(video)
            )}"
        >

            <i class="fa-solid fa-pen"></i>

            Modifier

        </a>


        <a
            href="${escapeAttribute(
                getVideoUrl(video)
            )}"
        >

            <i class="fa-solid fa-play"></i>

            Voir la vidéo

        </a>


        <button
            type="button"
            data-menu-delete="true"
        >

            <i class="fa-solid fa-trash"></i>

            Supprimer

        </button>

    `;


    article.appendChild(
        menu
    );


    menu
        .querySelector(
            "[data-menu-delete]"
        )
        ?.addEventListener(
            "click",
            () => {

                closeVideoMenus();

                handleDeleteVideo(
                    video,
                    article
                );

            }
        );


    setTimeout(
        () => {

            document.addEventListener(
                "click",
                handleOutsideMenuClick,
                {
                    once: true
                }
            );

        },
        0
    );


    function handleOutsideMenuClick(
        event
    ) {

        if (
            !menu.contains(
                event.target
            ) &&
            event.target !== button
        ) {

            closeVideoMenus();

        }

    }
}


function closeVideoMenus() {

    document
        .querySelectorAll(
            ".video-card-dropdown"
        )
        .forEach(
            menu => menu.remove()
        );
}


// =========================================================
// DELETE VIDEO
// =========================================================

async function handleDeleteVideo(
    video,
    article
) {

    if (
        !video?.id ||
        !currentUser ||
        isDeleting
    ) {
        return;
    }


    const title =
        video.title ||
        "cette vidéo";


    const confirmed =
        window.confirm(
            `Voulez-vous vraiment supprimer "${title}" ?\n\nCette action supprimera également les données associées à la vidéo.`
        );


    if (!confirmed) {
        return;
    }


    isDeleting = true;


    const deleteButton =
        article?.querySelector(
            ".video-delete-button"
        );


    if (deleteButton) {

        deleteButton.disabled =
            true;

        deleteButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Suppression...

        `;

    }


    try {

        const result =
            await remove(
                "videos",
                [
                    {
                        method: "eq",
                        column: "id",
                        value: video.id
                    },
                    {
                        method: "eq",
                        column: "channel_id",
                        value: video.channel_id
                    }
                ]
            );


        if (result?.error) {
            throw result.error;
        }


        allVideos =
            allVideos.filter(
                item =>
                    item.id !==
                    video.id
            );


        updateStatistics();

        renderVideos();


    } catch (error) {

        console.error(
            "NetView delete video error:",
            error
        );


        if (deleteButton) {

            deleteButton.disabled =
                false;

            deleteButton.innerHTML = `

                <i class="fa-solid fa-trash"></i>

                Supprimer

            `;

        }


        window.alert(
            "Impossible de supprimer cette vidéo."
        );

    } finally {

        isDeleting = false;

    }
}


// =========================================================
// STATISTICS
// =========================================================

function updateStatistics() {

    const total =
        allVideos.length;


    const published =
        allVideos.filter(
            video =>
                normalizeStatus(
                    video.status
                ) ===
                "published"
        ).length;


    const processing =
        allVideos.filter(
            video =>
                normalizeStatus(
                    video.status
                ) ===
                "processing"
        ).length;


    const privateVideos =
        allVideos.filter(
            video =>
                normalizeVisibility(
                    video.visibility
                ) ===
                "private"
        ).length;


    setText(
        totalVideosElement,
        total
    );

    setText(
        publishedVideosElement,
        published
    );

    setText(
        processingVideosElement,
        processing
    );

    setText(
        privateVideosElement,
        privateVideos
    );
}


// =========================================================
// EMPTY STATES
// =========================================================

function renderGuestState() {

    hideElement(
        loadingState
    );

    hideElement(
        videosGrid
    );

    showElement(
        emptyState
    );


    const title =
        emptyState?.querySelector(
            "h2, h3, .empty-title"
        );


    const text =
        emptyState?.querySelector(
            "p"
        );


    if (title) {

        title.textContent =
            "Connectez-vous pour voir vos vidéos";

    }


    if (text) {

        text.textContent =
            "Connectez-vous à votre compte NetView pour gérer vos vidéos.";

    }
}


function renderEmptyState() {

    hideElement(
        videosGrid
    );

    hideElement(
        errorState
    );

    showElement(
        emptyState
    );


    const title =
        emptyState?.querySelector(
            "h2, h3, .empty-title"
        );


    const text =
        emptyState?.querySelector(
            "p"
        );


    if (title) {

        title.textContent =
            "Aucune vidéo";

    }


    if (text) {

        text.textContent =
            "Vous n'avez encore publié aucune vidéo.";

    }
}


function renderFilteredEmptyState() {

    hideElement(
        videosGrid
    );

    hideElement(
        errorState
    );

    showElement(
        emptyState
    );


    const title =
        emptyState?.querySelector(
            "h2, h3, .empty-title"
        );


    const text =
        emptyState?.querySelector(
            "p"
        );


    if (title) {

        title.textContent =
            "Aucune vidéo trouvée";

    }


    if (text) {

        text.textContent =
            "Aucune vidéo ne correspond aux filtres ou à la recherche.";

    }
}


// =========================================================
// ERROR
// =========================================================

function showError(
    message
) {

    hideElement(
        loadingState
    );

    hideElement(
        emptyState
    );

    hideElement(
        videosGrid
    );


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    showElement(
        errorState
    );
}


function clearError() {

    hideElement(
        errorState
    );
}


// =========================================================
// RETRY
// =========================================================

function setupRetry() {

    retryButton?.addEventListener(
        "click",
        async () => {

            hideElement(
                errorState
            );

            showLoading();


            try {

                currentUser =
                    await getUser();


                if (!currentUser) {

                    showGuestHeader();

                    showGuestSidebar();

                    renderGuestState();

                    return;
                }


                currentProfile =
                    await getProfile();


                showUserHeader();

                showUserSidebar();


                await loadMyChannels();

                await loadVideos();

            } catch (error) {

                console.error(
                    "NetView videos retry error:",
                    error
                );


                showError(
                    "Impossible de recharger vos vidéos."
                );

            } finally {

                hideLoading();

            }

        }
    );
}


// =========================================================
// REALTIME
// =========================================================

function setupRealtime() {

    cleanupRealtime();


    if (
        !currentUser ||
        myChannelIds.length === 0
    ) {
        return;
    }


    const videosChannel =
        subscribe(
            "netview-my-videos",
            "videos",
            async payload => {

                const changed =
                    payload?.new ||
                    payload?.old;


                if (!changed) {
                    return;
                }


                if (
                    !myChannelIds.includes(
                        changed.channel_id
                    )
                ) {
                    return;
                }


                await loadVideos();

            }
        );


    if (videosChannel) {

        realtimeChannels.push(
            videosChannel
        );

    }
}


async function cleanupRealtime() {

    if (
        realtimeChannels.length === 0
    ) {
        return;
    }


    const channels =
        [
            ...realtimeChannels
        ];


    realtimeChannels = [];


    for (
        const channel
        of channels
    ) {

        try {

            await unsubscribe(
                channel
            );

        } catch (error) {

            console.warn(
                "NetView Realtime cleanup error:",
                error
            );

        }

    }
}


// =========================================================
// VIDEO URL
// =========================================================

function getVideoUrl(
    video
) {

    if (!video?.id) {
        return "player.html";
    }


    return (
        `player.html?id=${encodeURIComponent(
            video.id
        )}`
    );
}


// =========================================================
// EDIT URL
// =========================================================

function getEditUrl(
    video
) {

    if (!video?.id) {
        return "edit-video.html";
    }


    return (
        `edit-video.html?id=${encodeURIComponent(
            video.id
        )}`
    );
}


// =========================================================
// CHANNEL URL
// =========================================================

function getChannelUrl(
    channel
) {

    if (!channel) {
        return "channel.html";
    }


    if (channel.handle) {

        return (
            `channel.html?handle=${encodeURIComponent(
                channel.handle
            )}`
        );

    }


    if (channel.id) {

        return (
            `channel.html?id=${encodeURIComponent(
                channel.id
            )}`
        );

    }


    return "channel.html";
}


// =========================================================
// CHANNEL NAME
// =========================================================

function getChannelName(
    channelId
) {

    const channel =
        myChannels.find(
            item =>
                item.id ===
                channelId
        );


    if (!channel) {
        return "";
    }


    return (
        channel.name ||
        channel.title ||
        channel.handle ||
        ""
    );
}


// =========================================================
// STATUS
// =========================================================

function normalizeStatus(
    status
) {

    const value =
        String(
            status ||
            "processing"
        )
            .toLowerCase()
            .trim();


    if (
        [
            "published",
            "publish",
            "public"
        ].includes(value)
    ) {

        return "published";

    }


    if (
        [
            "processing",
            "pending",
            "uploading"
        ].includes(value)
    ) {

        return "processing";

    }


    if (
        [
            "failed",
            "error"
        ].includes(value)
    ) {

        return "failed";

    }


    if (
        [
            "draft",
            "drafts"
        ].includes(value)
    ) {

        return "draft";

    }


    return value;
}


function getStatusLabel(
    status
) {

    const labels = {

        published:
            "Publiée",

        processing:
            "Traitement",

        failed:
            "Échec",

        draft:
            "Brouillon"

    };


    return (
        labels[status] ||
        status ||
        "Traitement"
    );
}


// =========================================================
// VISIBILITY
// =========================================================

function normalizeVisibility(
    visibility
) {

    const value =
        String(
            visibility ||
            "public"
        )
            .toLowerCase()
            .trim();


    if (
        [
            "public",
            "publicly"
        ].includes(value)
    ) {

        return "public";

    }


    if (
        [
            "unlisted",
            "nonlisted"
        ].includes(value)
    ) {

        return "unlisted";

    }


    if (
        [
            "private"
        ].includes(value)
    ) {

        return "private";

    }


    return value;
}


function getVisibilityLabel(
    visibility
) {

    const labels = {

        public:
            "Publique",

        unlisted:
            "Non répertoriée",

        private:
            "Privée"

    };


    return (
        labels[visibility] ||
        visibility
    );
}


function getVisibilityIcon(
    visibility
) {

    const icons = {

        public:
            "fa-solid fa-earth-americas",

        unlisted:
            "fa-solid fa-link",

        private:
            "fa-solid fa-lock"

    };


    return (
        icons[visibility] ||
        "fa-solid fa-eye"
    );
}


// =========================================================
// DATE
// =========================================================

function getDateValue(
    video
) {

    const value =
        video?.published_at ||
        video?.created_at ||
        video?.updated_at;


    if (!value) {
        return 0;
    }


    const timestamp =
        new Date(
            value
        ).getTime();


    return Number.isFinite(
        timestamp
    )
        ? timestamp
        : 0;
}


function formatDate(
    value
) {

    if (!value) {
        return "Date inconnue";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date inconnue";

    }


    const diff =
        Date.now() -
        date.getTime();


    if (diff < 0) {
        return "À venir";
    }


    const seconds =
        Math.floor(
            diff / 1000
        );


    if (seconds < 60) {
        return "À l'instant";
    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (minutes < 60) {

        return `Il y a ${minutes} min`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `Il y a ${hours} h`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 30) {

        return `Il y a ${days} j`;

    }


    const months =
        Math.floor(
            days / 30
        );


    if (months < 12) {

        return `Il y a ${months} mois`;

    }


    const years =
        Math.floor(
            months / 12
        );


    return (
        `Il y a ${years} an${
            years > 1
                ? "s"
                : ""
        }`
    );
}


// =========================================================
// NUMBER
// =========================================================

function formatNumber(
    value
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "0";

    }


    if (number < 1000) {

        return String(
            Math.floor(number)
        );

    }


    if (number < 1000000) {

        return (
            `${(
                number / 1000
            ).toFixed(
                number >= 10000
                    ? 0
                    : 1
            )} k`
        );

    }


    if (number < 1000000000) {

        return (
            `${(
                number / 1000000
            ).toFixed(
                number >= 10000000
                    ? 0
                    : 1
            )} M`
        );

    }


    return (
        `${(
            number / 1000000000
        ).toFixed(1)} Md`
    );
}


// =========================================================
// DURATION
// =========================================================

function formatDuration(
    value
) {

    const seconds =
        Number(value);


    if (
        !Number.isFinite(seconds) ||
        seconds <= 0
    ) {

        return "";

    }


    const total =
        Math.floor(seconds);


    const hours =
        Math.floor(
            total / 3600
        );


    const minutes =
        Math.floor(
            (total % 3600) / 60
        );


    const remaining =
        total % 60;


    if (hours > 0) {

        return [
            hours,
            String(minutes).padStart(
                2,
                "0"
            ),
            String(remaining).padStart(
                2,
                "0"
            )
        ].join(":");

    }


    return [
        minutes,
        String(remaining).padStart(
            2,
            "0"
        )
    ].join(":");
}


// =========================================================
// DOM HELPERS
// =========================================================

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        String(
            value ?? ""
        );
}


function showElement(
    element
) {

    if (!element) {
        return;
    }


    element.hidden =
        false;

    element.classList.remove(
        "hidden"
    );
}


function hideElement(
    element
) {

    if (!element) {
        return;
    }


    element.hidden =
        true;

    element.classList.add(
        "hidden"
    );
}


// =========================================================
// LOADING
// =========================================================

function showLoading() {

    isLoading = true;


    showElement(
        loadingState
    );

}


function hideLoading() {

    isLoading = false;


    hideElement(
        loadingState
    );
}


// =========================================================
// HTML SECURITY
// =========================================================

function escapeHTML(
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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );
}


// =========================================================
// PAGE CLEANUP
// =========================================================

window.addEventListener(
    "beforeunload",
    () => {

        cleanupRealtime();

    }
);
