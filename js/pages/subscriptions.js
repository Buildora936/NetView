// ==========================================
// NetView
// subscriptions.js
// ==========================================

import {
    getSession,
    getUser
} from "../core/auth.js";

import {
    getProfile,
    select,
    remove,
    getPublicUrl,
    subscribe,
    unsubscribe
} from "../core/data.js";


// ==========================================
// DOM
// ==========================================

const sidebar =
    document.getElementById("main-sidebar");

const sidebarNav =
    document.getElementById("sidebar-nav");

const sidebarToggle =
    document.getElementById("sidebar-toggle");

const sidebarOverlay =
    document.getElementById("sidebar-overlay");

const globalSearchForm =
    document.getElementById("global-search-form");

const globalSearchInput =
    document.getElementById("global-search-input");

const headerRight =
    document.getElementById("headerRight");

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

const subscriptionChannels =
    document.getElementById("subscription-channels");

const contentGrid =
    document.getElementById(
        "subscription-content-grid"
    );

const liveSection =
    document.getElementById(
        "subscription-live-section"
    );

const liveGrid =
    document.getElementById(
        "subscription-live-grid"
    );

const loadingState =
    document.getElementById(
        "subscriptions-loading"
    );

const emptyState =
    document.getElementById(
        "subscriptions-empty"
    );

const filterEmptyState =
    document.getElementById(
        "subscriptions-filter-empty"
    );

const filterEmptyMessage =
    document.getElementById(
        "subscriptions-filter-empty-message"
    );

const errorState =
    document.getElementById(
        "subscriptions-error"
    );

const errorMessage =
    document.getElementById(
        "subscriptions-error-message"
    );

const retryButton =
    document.getElementById(
        "subscriptions-retry-button"
    );

const viewAllButton =
    document.getElementById(
        "view-all-subscriptions"
    );

const sortSelect =
    document.getElementById(
        "subscription-sort"
    );

const filterButtons =
    document.querySelectorAll(
        ".subscription-filter"
    );


// ==========================================
// State
// ==========================================

let currentUser = null;

let currentProfile = null;

let subscriptions = [];

let subscribedChannelIds = [];

let subscribedChannels = [];

let allContent = [];

let filteredContent = [];

let activeFilter = "all";

let activeSort = "recent";

let realtimeChannels = [];

let isLoading = false;


// ==========================================
// Constants
// ==========================================

const DEFAULT_AVATAR =
    "assets/images/default-avatar.png";

const DEFAULT_THUMBNAIL =
    "assets/images/default-thumbnail.png";


// ==========================================
// Initialization
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    try {

        setupSidebarEvents();

        setupSearch();

        setupFilters();

        setupSort();

        setupRetry();

        setupViewAll();

        showLoading();

        const session =
            await getSession();

        if (!session) {

            showGuestSidebar();

            renderGuestState();

            hideLoading();

            return;
        }

        currentUser =
            await getUser();

        if (!currentUser) {

            showGuestSidebar();

            renderGuestState();

            hideLoading();

            return;
        }

        currentProfile =
            await getProfile();

        showUserSidebar();

        renderHeader();

        await loadSubscriptions();

        setupRealtime();

    } catch (error) {

        console.error(
            "NetView subscriptions init error:",
            error
        );

        showError(
            "Impossible de charger vos abonnements."
        );

    } finally {

        hideLoading();

    }
}


// ==========================================
// Sidebar
// ==========================================

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
            class="active"
            aria-current="page"
        >

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
// Sidebar Events
// ==========================================

function setupSidebarEvents() {

    if (
        !sidebarToggle ||
        !sidebar ||
        !sidebarOverlay
    ) {
        return;
    }

    sidebarToggle.addEventListener(
        "click",
        toggleSidebar
    );

    sidebarOverlay.addEventListener(
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


function toggleSidebar() {

    const isOpen =
        sidebar.classList.contains(
            "open"
        );

    if (isOpen) {

        closeSidebar();

    } else {

        openSidebar();

    }
}


function openSidebar() {

    sidebar.classList.add("open");

    sidebarOverlay.classList.add(
        "active"
    );

    sidebarToggle.setAttribute(
        "aria-expanded",
        "true"
    );

    sidebarOverlay.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeSidebar() {

    sidebar.classList.remove("open");

    sidebarOverlay.classList.remove(
        "active"
    );

    sidebarToggle.setAttribute(
        "aria-expanded",
        "false"
    );

    sidebarOverlay.setAttribute(
        "aria-hidden",
        "true"
    );
}


// ==========================================
// Search
// ==========================================

function setupSearch() {

    if (!globalSearchForm) {
        return;
    }

    globalSearchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const query =
                globalSearchInput?.value
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
// Guest Header
// ==========================================

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

    if (!headerRight) {
        return;
    }

    const avatar =
        currentProfile?.avatar_url ||
        "images/default-avatar.png";

    const displayName =
        currentProfile?.display_name ||
        currentProfile?.username ||
        currentUser?.email ||
        "Utilisateur";

    headerRight.innerHTML = `

        <!-- PUBLICATION -->

        <button
            type="button"
            class="nv-icon-button"
            id="uploadButton"
            aria-label="Publier"
            title="Publier"
        >

            <i class="fa-solid fa-plus nv-plus-icon"></i>

        </button>


        <!-- NOTIFICATIONS -->

        <button
            type="button"
            class="nv-icon-button"
            id="header-notifications-button"
            aria-label="Notifications"
            title="Notifications"
        >

            <i class="fa-regular fa-bell"></i>

        </button>


        <!-- PROFIL -->

        <a
            href="profile.html"
            class="nv-header-profile-avatar"
            aria-label="Mon profil"
            title="${escapeAttribute(displayName)}"
        >

            <img
                src="${escapeAttribute(avatar)}"
                alt="${escapeAttribute(displayName)}"
                loading="lazy"
            >

        </a>

    `;


    // ==========================================
    // Notifications
    // ==========================================

    const notificationButton =
        document.getElementById(
            "header-notifications-button"
        );

    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "notification.html";

            }
        );

    }


    // ==========================================
    // Upload
    // ==========================================

    const uploadButton =
        document.getElementById(
            "uploadButton"
        );

    if (uploadButton) {

        uploadButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "publish.html";

            }
        );

    }

}

// ==========================================
// Load Subscriptions
// ==========================================

async function loadSubscriptions() {

    if (!currentUser) {
        return;
    }

    clearStates();

    showLoading();

    try {

        const {
            data,
            error
        } = await select(
            "subscriptions",
            "*",
            [
                {
                    method: "eq",
                    column: "user_id",
                    value: currentUser.id
                }
            ]
        );

        if (error) {
            throw error;
        }

        subscriptions =
            data || [];

        subscribedChannelIds =
            subscriptions
                .map(
                    subscription =>
                        subscription.channel_id
                )
                .filter(Boolean);

        if (
            subscribedChannelIds.length === 0
        ) {

            subscribedChannels = [];

            allContent = [];

            renderEmptySubscriptions();

            return;
        }

        await Promise.all([
            loadSubscribedChannels(),
            loadSubscribedContent()
        ]);

        renderChannels();

        renderContent();

        renderLiveContent();

    } catch (error) {

        console.error(
            "Erreur chargement abonnements :",
            error
        );

        showError(
            "Une erreur est survenue lors du chargement de vos abonnements."
        );

    } finally {

        hideLoading();

    }
}


// ==========================================
// Load Channels
// ==========================================

async function loadSubscribedChannels() {

    if (
        subscribedChannelIds.length === 0
    ) {

        subscribedChannels = [];

        return;
    }

    const {
        data,
        error
    } = await select(
        "channels",
        "*",
        [
            {
                method: "in",
                column: "id",
                value: subscribedChannelIds
            }
        ]
    );

    if (error) {
        throw error;
    }

    subscribedChannels =
        data || [];

    subscribedChannels.sort(
        (a, b) => {

            const aIndex =
                subscribedChannelIds.indexOf(
                    a.id
                );

            const bIndex =
                subscribedChannelIds.indexOf(
                    b.id
                );

            return aIndex - bIndex;

        }
    );
}


// ==========================================
// Load Subscribed Videos
// ==========================================

async function loadSubscribedVideos() {

    if (
        subscribedChannelIds.length === 0
    ) {
        return [];
    }

    const {
        data,
        error
    } = await select(
        "videos",
        `
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            )
        `,
        [
            {
                method: "in",
                column: "channel_id",
                value: subscribedChannelIds
            },
            {
                method: "eq",
                column: "status",
                value: "published"
            },
            {
                method: "eq",
                column: "visibility",
                value: "public"
            }
        ]
    );

    if (error) {
        throw error;
    }

    return (data || []).map(
        video => ({

            ...video,

            contentType: "videos",

            channelName:
                video.channels?.name ||
                "Chaîne inconnue",

            channelHandle:
                video.channels?.handle ||
                null,

            channelAvatar:
                video.channels?.avatar_url ||
                DEFAULT_AVATAR,

            channelVerified:
                Boolean(
                    video.channels?.verified
                )

        })
    );
}


// ==========================================
// Load Subscribed Shorts
// ==========================================

async function loadSubscribedShorts() {

    if (
        subscribedChannelIds.length === 0
    ) {
        return [];
    }

    const {
        data,
        error
    } = await select(
        "shorts",
        `
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            )
        `,
        [
            {
                method: "in",
                column: "channel_id",
                value: subscribedChannelIds
            }
        ]
    );

    if (error) {
        throw error;
    }

    return (data || []).map(
        short => ({

            ...short,

            contentType: "shorts",

            channelName:
                short.channels?.name ||
                "Chaîne inconnue",

            channelHandle:
                short.channels?.handle ||
                null,

            channelAvatar:
                short.channels?.avatar_url ||
                DEFAULT_AVATAR,

            channelVerified:
                Boolean(
                    short.channels?.verified
                )

        })
    );
}


// ==========================================
// Load Subscribed Lives
// ==========================================

async function loadSubscribedLives() {

    if (
        subscribedChannelIds.length === 0
    ) {
        return [];
    }

    const {
        data,
        error
    } = await select(
        "lives",
        `
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            )
        `,
        [
            {
                method: "in",
                column: "channel_id",
                value: subscribedChannelIds
            },
            {
                method: "eq",
                column: "status",
                value: "live"
            },
            {
                method: "eq",
                column: "visibility",
                value: "public"
            }
        ]
    );

    if (error) {
        throw error;
    }

    return (data || []).map(
        live => ({

            ...live,

            contentType: "lives",

            channelName:
                live.channels?.name ||
                "Chaîne inconnue",

            channelHandle:
                live.channels?.handle ||
                null,

            channelAvatar:
                live.channels?.avatar_url ||
                DEFAULT_AVATAR,

            channelVerified:
                Boolean(
                    live.channels?.verified
                )

        })
    );
}


// ==========================================
// Load All Content
// ==========================================

async function loadSubscribedContent() {

    const [
        videos,
        shorts,
        lives
    ] = await Promise.all([
        loadSubscribedVideos(),
        loadSubscribedShorts(),
        loadSubscribedLives()
    ]);

    allContent = [
        ...videos,
        ...shorts,
        ...lives
    ];

    sortContent();
}


// ==========================================
// Channels Render
// ==========================================

function renderChannels() {

    if (!subscriptionChannels) {
        return;
    }

    subscriptionChannels.innerHTML = "";

    if (
        subscribedChannels.length === 0
    ) {
        return;
    }

    subscribedChannels.forEach(
        channel => {

            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "subscription-channel";

            article.dataset.channelId =
                channel.id;

            const avatar =
                channel.avatar_url ||
                DEFAULT_AVATAR;

            const name =
                channel.name ||
                "Chaîne";

            const handle =
                channel.handle
                    ? `@${channel.handle}`
                    : "";

            article.innerHTML = `

                <a
                    href="${getChannelUrl(channel)}"
                    class="subscription-channel-link"
                    aria-label="${escapeAttribute(name)}"
                >

                    <div
                        class="subscription-channel-avatar"
                    >

                        <img
                            src="${escapeAttribute(avatar)}"
                            alt="${escapeAttribute(name)}"
                            loading="lazy"
                        >

                    </div>

                    <div
                        class="subscription-channel-info"
                    >

                        <span
                            class="subscription-channel-name"
                        >
                            ${escapeHTML(name)}

                            ${
                                channel.verified
                                    ? `
                                        <i
                                            class="fa-solid fa-circle-check"
                                            aria-label="Compte vérifié"
                                        ></i>
                                      `
                                    : ""
                            }

                        </span>

                        ${
                            handle
                                ? `
                                    <span
                                        class="subscription-channel-handle"
                                    >
                                        ${escapeHTML(handle)}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </a>

                <button
                    type="button"
                    class="subscription-channel-unsubscribe"
                    data-channel-id="${escapeAttribute(channel.id)}"
                    aria-label="Se désabonner de ${escapeAttribute(name)}"
                    title="Se désabonner"
                >

                    <i class="fa-solid fa-check"></i>

                    <span>
                        Abonné
                    </span>

                </button>

            `;

            const unsubscribeButton =
                article.querySelector(
                    ".subscription-channel-unsubscribe"
                );

            unsubscribeButton?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    handleUnsubscribe(
                        channel.id,
                        article
                    );

                }
            );

            subscriptionChannels.appendChild(
                article
            );

        }
    );
}


// ==========================================
// Content Render
// ==========================================

function renderContent() {

    if (!contentGrid) {
        return;
    }

    sortContent();

    filteredContent =
        getFilteredContent();

    contentGrid.innerHTML = "";

    hideElement(
        filterEmptyState
    );

    if (
        filteredContent.length === 0
    ) {

        showElement(
            filterEmptyState
        );

        updateFilterEmptyMessage();

        return;
    }

    filteredContent.forEach(
        content => {

            contentGrid.appendChild(
                createContentCard(content)
            );

        }
    );
}


// ==========================================
// Content Card
// ==========================================

function createContentCard(
    content
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "subscription-content-card";

    article.dataset.contentId =
        content.id;

    article.dataset.contentType =
        content.contentType;

    const title =
        content.title ||
        "Sans titre";

    const thumbnail =
        getThumbnail(content);

    const channelName =
        content.channelName ||
        "Chaîne inconnue";

    const avatar =
        content.channelAvatar ||
        DEFAULT_AVATAR;

    const verified =
        content.channelVerified;

    const views =
        formatNumber(
            content.views ??
            content.total_views ??
            0
        );

    const date =
        getContentDate(content);

    const duration =
        formatDuration(
            content.duration
        );

    const url =
        getContentUrl(content);

    article.innerHTML = `

        <a
            href="${escapeAttribute(url)}"
            class="subscription-content-thumbnail-link"
            aria-label="${escapeAttribute(title)}"
        >

            <div
                class="subscription-content-thumbnail"
            >

                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

                ${
                    duration
                        ? `
                            <span
                                class="subscription-content-duration"
                            >
                                ${escapeHTML(duration)}
                            </span>
                          `
                        : ""
                }

                ${
                    content.contentType === "lives"
                        ? `
                            <span
                                class="subscription-content-live-badge"
                            >
                                <span></span>
                                EN DIRECT
                            </span>
                          `
                        : ""
                }

            </div>

        </a>


        <div
            class="subscription-content-details"
        >

            <a
                href="${escapeAttribute(url)}"
                class="subscription-content-title"
                title="${escapeAttribute(title)}"
            >
                ${escapeHTML(title)}
            </a>


            <a
                href="${getChannelUrl(content.channels || {
                    id: content.channel_id,
                    handle: content.channelHandle
                })}"
                class="subscription-content-channel"
            >

                <img
                    src="${escapeAttribute(avatar)}"
                    alt=""
                    loading="lazy"
                    aria-hidden="true"
                >

                <span>
                    ${escapeHTML(channelName)}
                </span>

                ${
                    verified
                        ? `
                            <i
                                class="fa-solid fa-circle-check"
                                aria-label="Compte vérifié"
                            ></i>
                          `
                        : ""
                }

            </a>


            <div
                class="subscription-content-meta"
            >

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

        </div>

    `;

    return article;
}


// ==========================================
// Live Render
// ==========================================

function renderLiveContent() {

    if (
        !liveSection ||
        !liveGrid
    ) {
        return;
    }

    const liveContents =
        allContent.filter(
            item =>
                item.contentType === "lives"
        );

    liveGrid.innerHTML = "";

    if (
        liveContents.length === 0
    ) {

        hideElement(liveSection);

        return;
    }

    showElement(liveSection);

    liveContents.forEach(
        live => {

            liveGrid.appendChild(
                createLiveCard(live)
            );

        }
    );
}


function createLiveCard(
    live
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "subscription-live-card";

    const title =
        live.title ||
        "Live sans titre";

    const thumbnail =
        getThumbnail(live);

    const url =
        getContentUrl(live);

    const viewers =
        formatNumber(
            live.current_viewers ??
            live.viewers ??
            0
        );

    article.innerHTML = `

        <a
            href="${escapeAttribute(url)}"
            class="subscription-live-thumbnail-link"
        >

            <div
                class="subscription-live-thumbnail"
            >

                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                >

                <span
                    class="subscription-live-badge"
                >
                    <span></span>
                    EN DIRECT
                </span>

            </div>

        </a>


        <div
            class="subscription-live-details"
        >

            <a
                href="${escapeAttribute(url)}"
                class="subscription-live-title"
            >
                ${escapeHTML(title)}
            </a>

            <span
                class="subscription-live-viewers"
            >
                ${escapeHTML(formatNumber(viewers))}
                spectateurs
            </span>

        </div>

    `;

    return article;
}


// ==========================================
// Filters
// ==========================================

function setupFilters() {

    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const filter =
                        button.dataset.filter ||
                        "all";

                    setActiveFilter(
                        filter
                    );

                }
            );

        }
    );
}


function setActiveFilter(
    filter
) {

    activeFilter =
        filter;

    filterButtons.forEach(
        button => {

            const isActive =
                button.dataset.filter ===
                filter;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-selected",
                String(isActive)
            );

        }
    );

    updateContentSubtitle();

    renderContent();
}


function getFilteredContent() {

    if (
        activeFilter === "all"
    ) {

        return [
            ...allContent
        ];

    }

    return allContent.filter(
        content =>
            content.contentType ===
            activeFilter
    );
}


// ==========================================
// Sort
// ==========================================

function setupSort() {

    if (!sortSelect) {
        return;
    }

    sortSelect.addEventListener(
        "change",
        () => {

            activeSort =
                sortSelect.value ||
                "recent";

            sortContent();

            renderContent();

        }
    );
}


function sortContent() {

    allContent.sort(
        (a, b) => {

            if (
                activeSort ===
                "popular"
            ) {

                const viewsA =
                    Number(
                        a.views ??
                        a.total_views ??
                        a.current_viewers ??
                        0
                    );

                const viewsB =
                    Number(
                        b.views ??
                        b.total_views ??
                        b.current_viewers ??
                        0
                    );

                return viewsB - viewsA;
            }

            const dateA =
                new Date(
                    getRawDate(a)
                ).getTime() || 0;

            const dateB =
                new Date(
                    getRawDate(b)
                ).getTime() || 0;

            if (
                activeSort ===
                "oldest"
            ) {

                return dateA - dateB;

            }

            return dateB - dateA;

        }
    );
}


// ==========================================
// Content Subtitle
// ==========================================

function updateContentSubtitle() {

    const subtitle =
        document.getElementById(
            "subscription-content-subtitle"
        );

    if (!subtitle) {
        return;
    }

    const labels = {

        all:
            "Les contenus les plus récents de vos chaînes",

        videos:
            "Les dernières vidéos de vos chaînes",

        shorts:
            "Les derniers Shorts de vos chaînes",

        lives:
            "Les lives de vos chaînes"

    };

    subtitle.textContent =
        labels[activeFilter] ||
        labels.all;
}


// ==========================================
// Empty Filter Message
// ==========================================

function updateFilterEmptyMessage() {

    if (!filterEmptyMessage) {
        return;
    }

    const messages = {

        all:
            "Aucun contenu n'est disponible pour vos abonnements pour le moment.",

        videos:
            "Aucune vidéo récente de vos chaînes.",

        shorts:
            "Aucun Short récent de vos chaînes.",

        lives:
            "Aucun de vos créateurs n'est actuellement en direct."

    };

    filterEmptyMessage.textContent =
        messages[activeFilter] ||
        messages.all;
}


// ==========================================
// Unsubscribe
// ==========================================

async function handleUnsubscribe(
    channelId,
    article
) {

    if (
        !currentUser ||
        !channelId
    ) {
        return;
    }

    const button =
        article?.querySelector(
            ".subscription-channel-unsubscribe"
        );

    if (button) {

        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>...</span>
        `;

    }

    try {

        const {
            error
        } = await remove(
            "subscriptions",
            [
                {
                    method: "eq",
                    column: "user_id",
                    value: currentUser.id
                },
                {
                    method: "eq",
                    column: "channel_id",
                    value: channelId
                }
            ]
        );

        if (error) {
            throw error;
        }

        subscriptions =
            subscriptions.filter(
                subscription =>
                    subscription.channel_id !==
                    channelId
            );

        subscribedChannelIds =
            subscribedChannelIds.filter(
                id =>
                    id !== channelId
            );

        subscribedChannels =
            subscribedChannels.filter(
                channel =>
                    channel.id !== channelId
            );

        allContent =
            allContent.filter(
                content =>
                    content.channel_id !==
                    channelId
            );

        article?.remove();

        renderContent();

        renderLiveContent();

        if (
            subscribedChannels.length === 0
        ) {

            renderEmptySubscriptions();

        }

    } catch (error) {

        console.error(
            "Erreur désabonnement :",
            error
        );

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <span>Abonné</span>
            `;

        }

        alert(
            "Impossible de se désabonner de cette chaîne."
        );

    }
}


// ==========================================
// Realtime
// ==========================================

function setupRealtime() {

    cleanupRealtime();

    const subscriptionChannel =
        subscribe(
            "netview-user-subscriptions",
            "subscriptions",
            async payload => {

                if (
                    !payload?.new &&
                    !payload?.old
                ) {
                    return;
                }

                const changed =
                    payload.new ||
                    payload.old;

                if (
                    changed?.user_id !==
                    currentUser?.id
                ) {
                    return;
                }

                await loadSubscriptions();

            }
        );

    const videosChannel =
        subscribe(
            "netview-subscriptions-videos",
            "videos",
            async payload => {

                const changed =
                    payload.new ||
                    payload.old;

                if (
                    changed &&
                    subscribedChannelIds.includes(
                        changed.channel_id
                    )
                ) {

                    await loadSubscriptions();

                }

            }
        );

    const shortsChannel =
        subscribe(
            "netview-subscriptions-shorts",
            "shorts",
            async payload => {

                const changed =
                    payload.new ||
                    payload.old;

                if (
                    changed &&
                    subscribedChannelIds.includes(
                        changed.channel_id
                    )
                ) {

                    await loadSubscriptions();

                }

            }
        );

    const livesChannel =
        subscribe(
            "netview-subscriptions-lives",
            "lives",
            async payload => {

                const changed =
                    payload.new ||
                    payload.old;

                if (
                    changed &&
                    subscribedChannelIds.includes(
                        changed.channel_id
                    )
                ) {

                    await loadSubscriptions();

                }

            }
        );

    realtimeChannels = [
        subscriptionChannel,
        videosChannel,
        shortsChannel,
        livesChannel
    ].filter(Boolean);
}


async function cleanupRealtime() {

    if (
        !realtimeChannels.length
    ) {
        return;
    }

    for (
        const channel
        of realtimeChannels
    ) {

        try {

            await unsubscribe(
                channel
            );

        } catch (error) {

            console.warn(
                "Erreur nettoyage Realtime :",
                error
            );

        }

    }

    realtimeChannels = [];
}


// ==========================================
// View All
// ==========================================

function setupViewAll() {

    if (!viewAllButton) {
        return;
    }

    viewAllButton.addEventListener(
        "click",
        () => {

            activeFilter = "all";

            setActiveFilter("all");

            document
                .getElementById(
                    "subscription-content-section"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        }
    );
}


// ==========================================
// Guest State
// ==========================================

function renderGuestState() {

    hideElement(
        subscriptionChannels
    );

    hideElement(
        filterEmptyState
    );

    hideElement(
        errorState
    );

    showElement(
        emptyState
    );

    const title =
        document.getElementById(
            "subscriptions-empty-title"
        );

    const paragraph =
        emptyState?.querySelector("p");

    if (title) {

        title.textContent =
            "Connectez-vous pour voir vos abonnements";

    }

    if (paragraph) {

        paragraph.textContent =
            "Connectez-vous à votre compte NetView pour retrouver les chaînes que vous suivez et leurs dernières publications.";

    }
}


// ==========================================
// Empty Subscriptions
// ==========================================

function renderEmptySubscriptions() {

    hideElement(
        subscriptionChannels
    );

    hideElement(
        contentGrid
    );

    hideElement(
        liveSection
    );

    hideElement(
        filterEmptyState
    );

    hideElement(
        errorState
    );

    showElement(
        emptyState
    );
}


// ==========================================
// Error State
// ==========================================

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
        filterEmptyState
    );

    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

    showElement(
        errorState
    );
}


// ==========================================
// Retry
// ==========================================

function setupRetry() {

    if (!retryButton) {
        return;
    }

    retryButton.addEventListener(
        "click",
        async () => {

            hideElement(
                errorState
            );

            showLoading();

            try {

                if (!currentUser) {

                    currentUser =
                        await getUser();

                }

                if (!currentUser) {

                    renderGuestState();

                    return;
                }

                currentProfile =
                    await getProfile();

                showUserSidebar();

                renderHeader();

                await loadSubscriptions();

                setupRealtime();

            } catch (error) {

                console.error(
                    "Erreur retry subscriptions :",
                    error
                );

                showError(
                    "Impossible de recharger vos abonnements."
                );

            } finally {

                hideLoading();

            }

        }
    );
}


// ==========================================
// Loading
// ==========================================

function showLoading() {

    isLoading = true;

    showElement(
        loadingState
    );

    hideElement(
        emptyState
    );

    hideElement(
        filterEmptyState
    );

    hideElement(
        errorState
    );
}


function hideLoading() {

    isLoading = false;

    hideElement(
        loadingState
    );
}


// ==========================================
// State Helpers
// ==========================================

function clearStates() {

    hideElement(
        emptyState
    );

    hideElement(
        filterEmptyState
    );

    hideElement(
        errorState
    );
}


function showElement(
    element
) {

    if (!element) {
        return;
    }

    element.hidden = false;
}


function hideElement(
    element
) {

    if (!element) {
        return;
    }

    element.hidden = true;
}


// ==========================================
// URLs
// ==========================================

function getChannelUrl(
    channel
) {

    if (!channel) {
        return "channel.html";
    }

    if (channel.handle) {

        return `channel.html?handle=${encodeURIComponent(
            channel.handle
        )}`;

    }

    if (channel.id) {

        return `channel.html?id=${encodeURIComponent(
            channel.id
        )}`;

    }

    return "channel.html";
}


function getContentUrl(
    content
) {

    if (!content) {
        return "index.html";
    }

    if (
        content.contentType ===
        "shorts"
    ) {

        return `player.html?short=${encodeURIComponent(
            content.id
        )}`;

    }

    if (
        content.contentType ===
        "lives"
    ) {

        return `live.html?id=${encodeURIComponent(
            content.id
        )}`;

    }

    return `player.html?id=${encodeURIComponent(
        content.id
    )}`;
}


// ==========================================
// Thumbnail
// ==========================================

function getThumbnail(
    content
) {

    if (!content) {
        return DEFAULT_THUMBNAIL;
    }

    const candidates = [

        content.thumbnail_url,

        content.thumbnail,

        content.thumbnail_path,

        content.cover_url,

        content.image_url

    ];

    const found =
        candidates.find(
            value =>
                typeof value === "string" &&
                value.trim()
        );

    return found ||
        DEFAULT_THUMBNAIL;
}


// ==========================================
// Dates
// ==========================================

function getRawDate(
    content
) {

    return (
        content?.published_at ||
        content?.started_at ||
        content?.created_at ||
        content?.updated_at ||
        null
    );
}


function getContentDate(
    content
) {

    const raw =
        getRawDate(content);

    if (!raw) {
        return "";
    }

    const date =
        new Date(raw);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const diff =
        Date.now() -
        date.getTime();

    const seconds =
        Math.floor(
            diff / 1000
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
            months / 12
        );

    return `il y a ${years} an${
        years > 1 ? "s" : ""
    }`;
}


// ==========================================
// Number Formatting
// ==========================================

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

        return `${(
            number / 1000
        ).toFixed(
            number >= 10000 ? 0 : 1
        )} k`;

    }

    if (number < 1000000000) {

        return `${(
            number / 1000000
        ).toFixed(
            number >= 10000000 ? 0 : 1
        )} M`;

    }

    return `${(
        number / 1000000000
    ).toFixed(1)} Md`;
}


// ==========================================
// Duration
// ==========================================

function formatDuration(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    let seconds =
        Number(value);

    if (
        !Number.isFinite(seconds) ||
        seconds <= 0
    ) {
        return "";
    }

    seconds =
        Math.floor(seconds);

    const hours =
        Math.floor(
            seconds / 3600
        );

    const minutes =
        Math.floor(
            (seconds % 3600) /
            60
        );

    const remainingSeconds =
        seconds % 60;

    if (hours > 0) {

        return [
            hours,
            String(minutes).padStart(
                2,
                "0"
            ),
            String(
                remainingSeconds
            ).padStart(
                2,
                "0"
            )
        ].join(":");

    }

    return [
        minutes,
        String(
            remainingSeconds
        ).padStart(
            2,
            "0"
        )
    ].join(":");
}


// ==========================================
// HTML Security
// ==========================================

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


// ==========================================
// Page Cleanup
// ==========================================

window.addEventListener(
    "beforeunload",
    () => {

        cleanupRealtime();

    }
);
