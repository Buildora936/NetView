// ==========================================
// NetView
// notification.js
// ==========================================

import { supabase } from "../core/supabase.js";

import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getProfileById,
    subscribeToNotifications,
    unsubscribe
} from "../core/data.js";


// ==========================================
// Configuration
// ==========================================

const PAGE_SIZE = 50;

const MAX_NOTIFICATIONS = 500;

const DEFAULT_AVATAR =
    "images/default-avatar.png";

const DEFAULT_NOTIFICATION_IMAGE =
    "NetView.png";


// ==========================================
// State
// ==========================================

const state = {

    notifications: [],

    actors: new Map(),

    currentFilter: "all",

    loading: false,

    error: false,

    realtimeChannel: null,

    realtimeReconnectTimer: null,

    initialized: false,

    loadingMore: false

};


// ==========================================
// DOM
// ==========================================

const elements = {};


// ==========================================
// Initialization
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    if (state.initialized) {
        return;
    }

    state.initialized = true;

    cacheElements();

    initializeHeader();

    initializeSidebar();

    initializeSearch();

    initializeFilters();

    initializeActions();

    await loadNotifications();

    initializeRealtime();

}


// ==========================================
// DOM Cache
// ==========================================

function cacheElements() {

    elements.app =
        document.getElementById("app");

    elements.headerRight =
        document.getElementById("headerRight");

    elements.menuButton =
        document.getElementById("menuButton");

    elements.sidebar =
        document.getElementById("sidebar");

    elements.sidebarOverlay =
        document.getElementById("sidebarOverlay");

    elements.sidebarNav =
        document.querySelector(
            ".nv-sidebar-nav"
        );

    elements.searchForm =
        document.getElementById("searchForm");

    elements.searchInput =
        document.getElementById("searchInput");

    elements.markAllButton =
        document.getElementById(
            "mark-all-read-button"
        );

    elements.filterButtons =
        document.querySelectorAll(
            ".notification-filter"
        );

    elements.allCount =
        document.getElementById(
            "all-count"
        );

    elements.unreadCount =
        document.getElementById(
            "unread-count"
        );

    elements.loading =
        document.getElementById(
            "notifications-loading"
        );

    elements.list =
        document.getElementById(
            "notifications-list"
        );

    elements.empty =
        document.getElementById(
            "notifications-empty"
        );

    elements.error =
        document.getElementById(
            "notifications-error"
        );

    elements.retryButton =
        document.getElementById(
            "notifications-retry-button"
        );

    elements.toastContainer =
        document.getElementById(
            "toastContainer"
        );

}


// ==========================================
// Header
// ==========================================

function initializeHeader() {

    if (!elements.headerRight) {
        return;
    }

    elements.headerRight.innerHTML = `

       <button
            id="uploadButton"
            class="nv-icon-button"
            title="Publier">

            <i class="fa-solid fa-plus nv-plus-icon"></i>

        </button>


        <button
            type="button"
            class="nv-icon-button notification-header-button"
            id="notificationHeaderButton"
            aria-label="Notifications"
            title="Notifications"
        >

            <i
                class="fa-regular fa-bell"
                aria-hidden="true"
            ></i>

            <span
                class="notification-header-badge"
                id="notificationHeaderBadge"
                hidden
            >
                0
            </span>

        </button>


        <a
            href="profile.html"
            class="nv-header-profile"
            id="headerProfileButton"
            aria-label="Mon profil"
        >

            <img
                id="headerProfileAvatar"
                src="${DEFAULT_AVATAR}"
                alt="Profil"
            >

        </a>

    `;


    const notificationButton =
        document.getElementById(
            "notificationHeaderButton"
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


    loadHeaderProfile();

}


// ==========================================
// Header Profile
// ==========================================

async function loadHeaderProfile() {

    try {

        const {
            data: {
                user
            }
        } =
            await supabase.auth.getUser();

        if (!user) {
            return;
        }

        const profile =
            await getProfileById(
                user.id
            );

        if (!profile) {
            return;
        }

        const avatar =
            profile.avatar_url ||
            DEFAULT_AVATAR;

        const avatarElement =
            document.getElementById(
                "headerProfileAvatar"
            );

        if (avatarElement) {

            avatarElement.src =
                avatar;

            avatarElement.alt =
                profile.display_name ||
                profile.username ||
                "Profil";

        }

    } catch (error) {

        console.error(
            "Erreur chargement profil header :",
            error
        );

    }

}


// ==========================================
// Sidebar
// ==========================================

function initializeSidebar() {

    if (!elements.sidebarNav) {
        return;
    }

    elements.sidebarNav.innerHTML = `

        <a
            href="index.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-house"
                aria-hidden="true"
            ></i>

            <span>
                Accueil
            </span>

        </a>


        <a
            href="trending.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-fire"
                aria-hidden="true"
            ></i>

            <span>
                Tendances
            </span>

        </a>


        <a
            href="shorts.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-bolt"
                aria-hidden="true"
            ></i>

            <span>
                Shorts
            </span>

        </a>


        <a
            href="lives.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-tower-broadcast"
                aria-hidden="true"
            ></i>

            <span>
                Lives
            </span>

        </a>


        <a
            href="subscriptions.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-layer-group"
                aria-hidden="true"
            ></i>

            <span>
                Abonnements
            </span>

        </a>


        <a
            href="playlist.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-list"
                aria-hidden="true"
            ></i>

            <span>
                Playlists
            </span>

        </a>


        <div
            class="nv-sidebar-divider"
        ></div>


        <a
            href="notification.html"
            class="nv-sidebar-item active"
            aria-current="page"
        >

            <i
                class="fa-solid fa-bell"
                aria-hidden="true"
            ></i>

            <span>
                Notifications
            </span>

            <span
                class="sidebar-notification-badge"
                id="sidebarNotificationBadge"
                hidden
            >
                0
            </span>

        </a>


        <a
            href="settings.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-gear"
                aria-hidden="true"
            ></i>

            <span>
                Paramètres
            </span>

        </a>

    `;


    updateSidebarNotificationBadge(
        0
    );

}


// ==========================================
// Sidebar Menu
// ==========================================

function initializeMenu() {

    if (
        !elements.menuButton ||
        !elements.sidebar
    ) {
        return;
    }

    elements.menuButton.addEventListener(
        "click",
        toggleSidebar
    );


    if (elements.sidebarOverlay) {

        elements.sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }


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


    elements.sidebar.addEventListener(
        "click",
        event => {

            const link =
                event.target.closest(
                    "a"
                );

            if (!link) {
                return;
            }

            if (
                window.innerWidth <= 900
            ) {

                closeSidebar();

            }

        }
    );

}


function toggleSidebar() {

    const isOpen =
        elements.sidebar.classList.contains(
            "open"
        );

    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }

}


function openSidebar() {

    elements.sidebar.classList.add(
        "open"
    );

    if (elements.sidebarOverlay) {

        elements.sidebarOverlay.classList.add(
            "active"
        );

        elements.sidebarOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

    }

    if (elements.menuButton) {

        elements.menuButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }

}


function closeSidebar() {

    if (!elements.sidebar) {
        return;
    }

    elements.sidebar.classList.remove(
        "open"
    );

    if (elements.sidebarOverlay) {

        elements.sidebarOverlay.classList.remove(
            "active"
        );

        elements.sidebarOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

    }

    if (elements.menuButton) {

        elements.menuButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


// ==========================================
// Search
// ==========================================

function initializeSearch() {

    if (!elements.searchForm) {
        return;
    }

    elements.searchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const query =
                String(
                    elements.searchInput?.value ||
                    ""
                ).trim();

            if (!query) {
                return;
            }

            window.location.href =
                `search.html?q=${encodeURIComponent(query)}`;

        }
    );

}


// ==========================================
// Filters
// ==========================================

function initializeFilters() {

    elements.filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const filter =
                        button.dataset.filter ||
                        "all";

                    setFilter(
                        filter
                    );

                }
            );

        }
    );

}


function setFilter(
    filter
) {

    const allowedFilters = [
        "all",
        "unread",
        "mentions",
        "activity",
        "netview"
    ];

    if (
        !allowedFilters.includes(
            filter
        )
    ) {

        filter = "all";

    }

    state.currentFilter =
        filter;


    elements.filterButtons.forEach(
        button => {

            const active =
                button.dataset.filter ===
                filter;

            button.classList.toggle(
                "active",
                active
            );

            button.setAttribute(
                "aria-selected",
                String(active)
            );

        }
    );


    renderNotifications();

}


// ==========================================
// Actions
// ==========================================

function initializeActions() {

    if (elements.markAllButton) {

        elements.markAllButton.addEventListener(
            "click",
            markAllAsRead
        );

    }


    if (elements.retryButton) {

        elements.retryButton.addEventListener(
            "click",
            loadNotifications
        );

    }


    if (elements.list) {

        elements.list.addEventListener(
            "click",
            handleNotificationClick
        );

    }


    initializeMenu();

}


// ==========================================
// Load Notifications
// ==========================================

async function loadNotifications() {

    if (state.loading) {
        return;
    }

    state.loading =
        true;

    state.error =
        false;

    showLoading();

    try {

        const {
            data: {
                user
            },
            error: userError
        } =
            await supabase.auth.getUser();

        if (
            userError ||
            !user
        ) {

            throw new Error(
                "Utilisateur non connecté"
            );

        }


        state.notifications =
            [];


        let page = 1;


        while (
            state.notifications.length <
            MAX_NOTIFICATIONS
        ) {

            const batch =
                await getNotifications({
                    page,
                    limit: PAGE_SIZE
                });


            if (
                !Array.isArray(batch) ||
                batch.length === 0
            ) {

                break;

            }


            state.notifications.push(
                ...batch
            );


            if (
                batch.length <
                PAGE_SIZE
            ) {

                break;

            }


            page++;

        }


        state.notifications =
            deduplicateNotifications(
                state.notifications
            );


        await loadActors();


        renderNotifications();


        await updateCounters();


        hideError();

    } catch (error) {

        console.error(
            "Erreur chargement notifications :",
            error
        );

        state.error =
            true;

        showError();

    } finally {

        state.loading =
            false;

        hideLoading();

    }

}


// ==========================================
// Load Actors
// ==========================================

async function loadActors() {

    const actorIds =
        [
            ...new Set(
                state.notifications
                    .map(
                        notification =>
                            notification.actor_id
                    )
                    .filter(Boolean)
            )
        ];


    await Promise.all(
        actorIds.map(
            async actorId => {

                if (
                    state.actors.has(
                        actorId
                    )
                ) {

                    return;

                }

                try {

                    const profile =
                        await getProfileById(
                            actorId
                        );

                    state.actors.set(
                        actorId,
                        profile
                    );

                } catch (error) {

                    console.error(
                        "Erreur récupération acteur :",
                        error
                    );

                    state.actors.set(
                        actorId,
                        null
                    );

                }

            }
        )
    );

}


// ==========================================
// Render
// ==========================================

function renderNotifications() {

    if (!elements.list) {
        return;
    }


    const filtered =
        getFilteredNotifications();


    elements.list.innerHTML = "";


    if (
        filtered.length === 0
    ) {

        showEmpty();

        updateMarkAllButton();

        return;

    }


    hideEmpty();


    const fragment =
        document.createDocumentFragment();


    filtered.forEach(
        notification => {

            fragment.appendChild(
                createNotificationElement(
                    notification
                )
            );

        }
    );


    elements.list.appendChild(
        fragment
    );


    updateMarkAllButton();

}


// ==========================================
// Filter Notifications
// ==========================================

function getFilteredNotifications() {

    switch (
        state.currentFilter
    ) {

        case "unread":

            return state.notifications.filter(
                notification =>
                    !notification.is_read
            );


        case "mentions":

            return state.notifications.filter(
                notification =>
                    isMentionNotification(
                        notification
                    )
            );


        case "activity":

            return state.notifications.filter(
                notification =>
                    isActivityNotification(
                        notification
                    )
            );


        case "netview":

            return state.notifications.filter(
                notification =>
                    isNetViewNotification(
                        notification
                    )
            );


        case "all":

        default:

            return state.notifications;

    }

}


// ==========================================
// Notification Element
// ==========================================

function createNotificationElement(
    notification
) {

    const article =
        document.createElement(
            "article"
        );


    const unread =
        !notification.is_read;


    article.className =
        "notification-item" +
        (
            unread
                ? " is-unread"
                : ""
        );


    article.dataset.notificationId =
        notification.id;


    article.setAttribute(
        "data-read",
        String(
            notification.is_read
        )
    );


    const actor =
        notification.actor_id
            ? state.actors.get(
                notification.actor_id
            )
            : null;


    const actorName =
        getActorName(
            notification,
            actor
        );


    const avatar =
        getNotificationAvatar(
            notification,
            actor
        );


    const icon =
        getNotificationIcon(
            notification.type
        );


    const title =
        notification.title ||
        getDefaultTitle(
            notification.type
        );


    const message =
        notification.message ||
        "";


    const time =
        formatRelativeTime(
            notification.created_at
        );


    const image =
        notification.image_url ||
        null;


    article.innerHTML = `

        <div
            class="notification-item-indicator"
            aria-hidden="true"
        ></div>


        <div
            class="notification-item-avatar-wrapper"
        >

            <img
                class="notification-item-avatar"
                src="${escapeAttribute(avatar)}"
                alt="${escapeAttribute(actorName)}"
                loading="lazy"
                onerror="this.src='${escapeAttribute(DEFAULT_AVATAR)}'"
            >

            <span
                class="notification-type-icon notification-type-${escapeAttribute(
                    normalizeType(notification.type)
                )}"
                aria-hidden="true"
            >

                <i
                    class="${escapeAttribute(icon)}"
                ></i>

            </span>

        </div>


        <div
            class="notification-item-content"
        >

            <div
                class="notification-item-title"
            >

                ${escapeHTML(title)}

            </div>


            <div
                class="notification-item-message"
            >

                ${escapeHTML(message)}

            </div>


            <time
                class="notification-item-time"
                datetime="${escapeAttribute(
                    notification.created_at || ""
                )}"
            >

                ${escapeHTML(time)}

            </time>

        </div>


        ${
            image
                ? `
                    <div
                        class="notification-item-thumbnail"
                    >

                        <img
                            src="${escapeAttribute(image)}"
                            alt=""
                            loading="lazy"
                            onerror="this.parentElement.remove()"
                        >

                    </div>
                `
                : ""
        }


        <div
            class="notification-item-actions"
        >

            ${
                unread
                    ? `
                        <button
                            type="button"
                            class="notification-action-button mark-read-button"
                            data-action="read"
                            aria-label="Marquer comme lu"
                            title="Marquer comme lu"
                        >

                            <i
                                class="fa-solid fa-check"
                                aria-hidden="true"
                            ></i>

                        </button>
                    `
                    : `
                        <span
                            class="notification-read-state"
                            title="Lu"
                            aria-label="Notification lue"
                        >

                            <i
                                class="fa-solid fa-check-double"
                                aria-hidden="true"
                            ></i>

                        </span>
                    `
            }

        </div>

    `;


    return article;

}


// ==========================================
// Notification Click
// ==========================================

async function handleNotificationClick(
    event
) {

    const actionButton =
        event.target.closest(
            "[data-action]"
        );


    if (actionButton) {

        event.preventDefault();

        event.stopPropagation();


        const article =
            actionButton.closest(
                ".notification-item"
            );


        if (!article) {
            return;
        }


        const notificationId =
            article.dataset.notificationId;


        if (
            actionButton.dataset.action ===
            "read"
        ) {

            await markAsRead(
                notificationId
            );

        }

        return;

    }


    const article =
        event.target.closest(
            ".notification-item"
        );


    if (!article) {
        return;
    }


    const notificationId =
        article.dataset.notificationId;


    const notification =
        state.notifications.find(
            item =>
                item.id ===
                notificationId
        );


    if (!notification) {
        return;
    }


    if (
        !notification.is_read
    ) {

        await markAsRead(
            notificationId,
            false
        );

    }


    if (
        notification.action_url
    ) {

        navigateToAction(
            notification.action_url
        );

    }

}


// ==========================================
// Mark One As Read
// ==========================================

async function markAsRead(
    notificationId,
    showToast = true
) {

    if (!notificationId) {
        return;
    }


    const notification =
        state.notifications.find(
            item =>
                item.id ===
                notificationId
        );


    if (
        !notification ||
        notification.is_read
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await markNotificationAsRead(
                notificationId
            );


        if (error) {
            throw error;
        }


        notification.is_read =
            true;

        notification.read_at =
            new Date().toISOString();


        renderNotifications();


        await updateCounters();


        if (showToast) {

            showToastMessage(
                "Notification marquée comme lue."
            );

        }

    } catch (error) {

        console.error(
            "Erreur marquage notification :",
            error
        );


        showToastMessage(
            "Impossible de marquer la notification comme lue.",
            "error"
        );

    }

}


// ==========================================
// Mark All As Read
// ==========================================

async function markAllAsRead() {

    const unreadCount =
        state.notifications.filter(
            notification =>
                !notification.is_read
        ).length;


    if (
        unreadCount === 0
    ) {

        return;

    }


    if (elements.markAllButton) {

        elements.markAllButton.disabled =
            true;

        elements.markAllButton.classList.add(
            "loading"
        );

    }


    try {

        const {
            error
        } =
            await markAllNotificationsAsRead();


        if (error) {
            throw error;
        }


        const now =
            new Date().toISOString();


        state.notifications.forEach(
            notification => {

                if (
                    !notification.is_read
                ) {

                    notification.is_read =
                        true;

                    notification.read_at =
                        now;

                }

            }
        );


        renderNotifications();


        await updateCounters();


        showToastMessage(
            "Toutes les notifications sont maintenant lues."
        );

    } catch (error) {

        console.error(
            "Erreur marquage global :",
            error
        );


        showToastMessage(
            "Impossible de marquer toutes les notifications comme lues.",
            "error"
        );

    } finally {

        if (elements.markAllButton) {

            elements.markAllButton.classList.remove(
                "loading"
            );

            updateMarkAllButton();

        }

    }

}


// ==========================================
// Counters
// ==========================================

async function updateCounters() {

    const total =
        state.notifications.length;


    const unread =
        state.notifications.filter(
            notification =>
                !notification.is_read
        ).length;


    updateCountElement(
        elements.allCount,
        total
    );


    updateCountElement(
        elements.unreadCount,
        unread
    );


    updateHeaderNotificationBadge(
        unread
    );


    updateSidebarNotificationBadge(
        unread
    );


    updateMarkAllButton();


    // Synchronisation avec Supabase
    // lorsque la liste locale n'est pas encore complète.
    try {

        const remoteUnread =
            await getUnreadNotificationCount();


        if (
            Number.isFinite(
                remoteUnread
            ) &&
            remoteUnread > unread
        ) {

            updateHeaderNotificationBadge(
                remoteUnread
            );

            updateSidebarNotificationBadge(
                remoteUnread
            );

            updateCountElement(
                elements.unreadCount,
                remoteUnread
            );

        }

    } catch (error) {

        console.warn(
            "Impossible de synchroniser le compteur distant :",
            error
        );

    }

}


function updateCountElement(
    element,
    count
) {

    if (!element) {
        return;
    }


    element.textContent =
        formatCount(count);


    element.hidden =
        count <= 0;

}


function updateHeaderNotificationBadge(
    count
) {

    const badge =
        document.getElementById(
            "notificationHeaderBadge"
        );


    if (!badge) {
        return;
    }


    badge.textContent =
        formatCount(count);


    badge.hidden =
        count <= 0;

}


function updateSidebarNotificationBadge(
    count
) {

    const badge =
        document.getElementById(
            "sidebarNotificationBadge"
        );


    if (!badge) {
        return;
    }


    badge.textContent =
        formatCount(count);


    badge.hidden =
        count <= 0;

}


function updateMarkAllButton() {

    if (!elements.markAllButton) {
        return;
    }


    const unread =
        state.notifications.some(
            notification =>
                !notification.is_read
        );


    elements.markAllButton.disabled =
        !unread;

}


// ==========================================
// Realtime
// ==========================================

function initializeRealtime() {

    if (state.realtimeChannel) {
        return;
    }


    state.realtimeChannel =
        subscribeToNotifications(
            handleRealtimeNotification
        );


    setupRealtimeStatus();

}


// ==========================================
// Realtime Handler
// ==========================================

async function handleRealtimeNotification(
    payload
) {

    if (!payload) {
        return;
    }


    const eventType =
        payload.eventType;


    const notification =
        payload.new;


    const oldNotification =
        payload.old;


    try {

        const {
            data: {
                user
            }
        } =
            await supabase.auth.getUser();


        if (!user) {
            return;
        }


        if (
            eventType ===
            "INSERT"
        ) {

            if (
                !notification ||
                notification.user_id !==
                    user.id
            ) {

                return;

            }


            const exists =
                state.notifications.some(
                    item =>
                        item.id ===
                        notification.id
                );


            if (exists) {
                return;
            }


            state.notifications.unshift(
                notification
            );


            state.notifications =
                deduplicateNotifications(
                    state.notifications
                ).slice(
                    0,
                    MAX_NOTIFICATIONS
                );


            if (
                notification.actor_id
            ) {

                try {

                    const profile =
                        await getProfileById(
                            notification.actor_id
                        );

                    state.actors.set(
                        notification.actor_id,
                        profile
                    );

                } catch (error) {

                    console.error(
                        "Erreur chargement acteur Realtime :",
                        error
                    );

                }

            }


            renderNotifications();

            await updateCounters();


            showRealtimeToast(
                notification
            );


            return;

        }


        if (
            eventType ===
            "UPDATE"
        ) {

            if (
                !notification ||
                notification.user_id !==
                    user.id
            ) {

                return;

            }


            const index =
                state.notifications.findIndex(
                    item =>
                        item.id ===
                        notification.id
                );


            if (index === -1) {

                state.notifications.unshift(
                    notification
                );

            } else {

                state.notifications[
                    index
                ] =
                    {
                        ...state.notifications[
                            index
                        ],
                        ...notification
                    };

            }


            renderNotifications();

            await updateCounters();


            return;

        }


        if (
            eventType ===
            "DELETE"
        ) {

            const id =
                oldNotification?.id;


            if (!id) {
                return;
            }


            state.notifications =
                state.notifications.filter(
                    item =>
                        item.id !== id
                );


            renderNotifications();

            await updateCounters();

        }

    } catch (error) {

        console.error(
            "Erreur notification Realtime :",
            error
        );

    }

}


// ==========================================
// Realtime Status
// ==========================================

function setupRealtimeStatus() {

    if (!state.realtimeChannel) {
        return;
    }


    // Supabase channel exposes on events through
    // the underlying realtime connection.
    //
    // Re-subscription is handled defensively
    // when the channel is closed or errored.

    try {

        state.realtimeChannel.on(
            "system",
            {},
            payload => {

                const status =
                    payload?.status ||
                    payload?.message ||
                    "";


                if (
                    status ===
                        "CHANNEL_ERROR" ||
                    status ===
                        "TIMED_OUT" ||
                    status ===
                        "CLOSED"
                ) {

                    scheduleRealtimeReconnect();

                }

            }
        );

    } catch (error) {

        console.warn(
            "Realtime status listener indisponible :",
            error
        );

    }

}


// ==========================================
// Realtime Reconnect
// ==========================================

function scheduleRealtimeReconnect() {

    if (
        state.realtimeReconnectTimer
    ) {

        return;

    }


    state.realtimeReconnectTimer =
        setTimeout(
            async () => {

                state.realtimeReconnectTimer =
                    null;

                await reconnectRealtime();

            },
            3000
        );

}


async function reconnectRealtime() {

    try {

        if (
            state.realtimeChannel
        ) {

            await unsubscribe(
                state.realtimeChannel
            );

        }

    } catch (error) {

        console.warn(
            "Erreur suppression ancien channel :",
            error
        );

    }


    state.realtimeChannel =
        null;


    initializeRealtime();

}


// ==========================================
// Realtime Toast
// ==========================================

function showRealtimeToast(
    notification
) {

    if (!notification) {
        return;
    }


    const title =
        notification.title ||
        "Nouvelle notification";


    showToastMessage(
        title
    );

}


// ==========================================
// Notification Categories
// ==========================================

function isMentionNotification(
    notification
) {

    const type =
        normalizeType(
            notification.type
        );


    return [
        "mention",
        "comment_mention",
        "message_mention",
        "live_mention",
        "post_mention",
        "short_mention",
        "video_mention"
    ].includes(
        type
    );

}


function isNetViewNotification(
    notification
) {

    const type =
        normalizeType(
            notification.type
        );


    return [
        "system",
        "netview",
        "announcement",
        "security",
        "account",
        "moderation",
        "copyright",
        "payment",
        "billing",
        "maintenance",
        "warning"
    ].includes(
        type
    );

}


function isActivityNotification(
    notification
) {

    if (
        isMentionNotification(
            notification
        )
    ) {

        return false;

    }


    if (
        isNetViewNotification(
            notification
        )
    ) {

        return false;

    }


    const type =
        normalizeType(
            notification.type
        );


    return [
        "like",
        "video_like",
        "short_like",
        "comment_like",
        "comment",
        "reply",
        "follow",
        "subscribe",
        "subscription",
        "new_video",
        "new_short",
        "new_live",
        "live_started",
        "live",
        "product",
        "purchase",
        "sale",
        "message",
        "friend",
        "channel"
    ].includes(
        type
    );

}


// ==========================================
// Notification Icons
// ==========================================

function getNotificationIcon(
    type
) {

    const normalized =
        normalizeType(type);


    const icons = {

        like:
            "fa-solid fa-heart",

        video_like:
            "fa-solid fa-heart",

        short_like:
            "fa-solid fa-heart",

        comment_like:
            "fa-solid fa-heart",

        comment:
            "fa-solid fa-comment",

        reply:
            "fa-solid fa-reply",

        mention:
            "fa-solid fa-at",

        comment_mention:
            "fa-solid fa-at",

        message_mention:
            "fa-solid fa-at",

        follow:
            "fa-solid fa-user-plus",

        subscribe:
            "fa-solid fa-user-plus",

        subscription:
            "fa-solid fa-user-plus",

        new_video:
            "fa-solid fa-video",

        new_short:
            "fa-solid fa-bolt",

        new_live:
            "fa-solid fa-tower-broadcast",

        live:
            "fa-solid fa-tower-broadcast",

        live_started:
            "fa-solid fa-circle",

        product:
            "fa-solid fa-bag-shopping",

        purchase:
            "fa-solid fa-cart-shopping",

        sale:
            "fa-solid fa-chart-line",

        message:
            "fa-solid fa-message",

        channel:
            "fa-solid fa-tv",

        system:
            "fa-solid fa-circle-info",

        netview:
            "fa-solid fa-circle-info",

        announcement:
            "fa-solid fa-bullhorn",

        security:
            "fa-solid fa-shield-halved",

        account:
            "fa-solid fa-user-gear",

        moderation:
            "fa-solid fa-shield",

        copyright:
            "fa-solid fa-copyright",

        payment:
            "fa-solid fa-credit-card",

        billing:
            "fa-solid fa-receipt",

        maintenance:
            "fa-solid fa-screwdriver-wrench",

        warning:
            "fa-solid fa-triangle-exclamation"

    };


    return (
        icons[normalized] ||
        "fa-solid fa-bell"
    );

}


// ==========================================
// Default Titles
// ==========================================

function getDefaultTitle(
    type
) {

    const normalized =
        normalizeType(type);


    const titles = {

        like:
            "Nouvelle mention J'aime",

        video_like:
            "Votre vidéo a reçu un J'aime",

        short_like:
            "Votre Short a reçu un J'aime",

        comment_like:
            "Votre commentaire a reçu un J'aime",

        comment:
            "Nouveau commentaire",

        reply:
            "Nouvelle réponse",

        mention:
            "Vous avez été mentionné",

        comment_mention:
            "Vous avez été mentionné",

        follow:
            "Nouvel abonné",

        subscribe:
            "Nouvel abonnement",

        subscription:
            "Nouvel abonnement",

        new_video:
            "Nouvelle vidéo",

        new_short:
            "Nouveau Short",

        new_live:
            "Nouveau live",

        live_started:
            "Live en cours",

        product:
            "Nouvelle activité produit",

        purchase:
            "Achat confirmé",

        sale:
            "Nouvelle vente",

        message:
            "Nouveau message",

        system:
            "Notification NetView",

        netview:
            "Notification NetView",

        announcement:
            "Annonce NetView",

        security:
            "Alerte de sécurité",

        account:
            "Activité du compte",

        moderation:
            "Notification de modération",

        copyright:
            "Notification de droits d'auteur",

        payment:
            "Notification de paiement",

        billing:
            "Notification de facturation",

        maintenance:
            "Maintenance NetView",

        warning:
            "Avertissement NetView"

    };


    return (
        titles[normalized] ||
        "Nouvelle notification"
    );

}


// ==========================================
// Actor
// ==========================================

function getActorName(
    notification,
    actor
) {

    if (actor) {

        return (
            actor.display_name ||
            actor.username ||
            "Utilisateur NetView"
        );

    }


    if (
        notification.metadata &&
        typeof notification.metadata ===
            "object"
    ) {

        return (
            notification.metadata.actor_name ||
            notification.metadata.username ||
            "Utilisateur NetView"
        );

    }


    return "Utilisateur NetView";

}


function getNotificationAvatar(
    notification,
    actor
) {

    if (
        notification.image_url
    ) {

        return notification.image_url;

    }


    if (actor?.avatar_url) {

        return actor.avatar_url;

    }


    if (
        notification.metadata &&
        typeof notification.metadata ===
            "object"
    ) {

        if (
            notification.metadata.actor_avatar
        ) {

            return notification.metadata.actor_avatar;

        }

        if (
            notification.metadata.avatar_url
        ) {

            return notification.metadata.avatar_url;

        }

    }


    return DEFAULT_AVATAR;

}


// ==========================================
// Navigation
// ==========================================

function navigateToAction(
    actionUrl
) {

    if (!actionUrl) {
        return;
    }


    const value =
        String(actionUrl).trim();


    if (!value) {
        return;
    }


    // URLs internes NetView
    if (
        value.startsWith(
            "/"
        ) &&
        !value.startsWith(
            "//"
        )
    ) {

        window.location.href =
            value;

        return;

    }


    if (
        value.startsWith(
            "./"
        ) ||
        value.startsWith(
            "../"
        )
    ) {

        window.location.href =
            value;

        return;

    }


    if (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        )
    ) {

        try {

            const url =
                new URL(
                    value,
                    window.location.origin
                );


            if (
                url.origin ===
                window.location.origin
            ) {

                window.location.href =
                    url.href;

                return;

            }


            window.open(
                url.href,
                "_blank",
                "noopener,noreferrer"
            );

        } catch (error) {

            console.error(
                "URL notification invalide :",
                error
            );

        }

        return;

    }


    window.location.href =
        value;

}


// ==========================================
// UI States
// ==========================================

function showLoading() {

    if (elements.loading) {

        elements.loading.style.display =
            "";

        elements.loading.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    if (elements.list) {

        elements.list.setAttribute(
            "aria-busy",
            "true"
        );

    }

}


function hideLoading() {

    if (elements.loading) {

        elements.loading.style.display =
            "none";

        elements.loading.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (elements.list) {

        elements.list.setAttribute(
            "aria-busy",
            "false"
        );

    }

}


function showEmpty() {

    if (elements.empty) {

        elements.empty.hidden =
            false;

    }

}


function hideEmpty() {

    if (elements.empty) {

        elements.empty.hidden =
            true;

    }

}


function showError() {

    if (elements.error) {

        elements.error.hidden =
            false;

    }

}


function hideError() {

    if (elements.error) {

        elements.error.hidden =
            true;

    }

}


// ==========================================
// Toast
// ==========================================

function showToastMessage(
    message,
    type = "success"
) {

    if (
        !elements.toastContainer ||
        !message
    ) {

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `nv-toast nv-toast-${type}`;


    const icon =
        type === "error"
            ? "fa-solid fa-circle-exclamation"
            : "fa-solid fa-circle-check";


    toast.innerHTML = `

        <i
            class="${icon}"
            aria-hidden="true"
        ></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    elements.toastContainer.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        3000
    );

}


// ==========================================
// Time
// ==========================================

function formatRelativeTime(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const now =
        Date.now();


    const difference =
        Math.max(
            0,
            now -
                date.getTime()
        );


    const seconds =
        Math.floor(
            difference /
                1000
        );


    if (
        seconds <
        60
    ) {

        return "À l'instant";

    }


    const minutes =
        Math.floor(
            seconds /
                60
        );


    if (
        minutes <
        60
    ) {

        return (
            `Il y a ${minutes} min`
        );

    }


    const hours =
        Math.floor(
            minutes /
                60
        );


    if (
        hours <
        24
    ) {

        return (
            `Il y a ${hours} h`
        );

    }


    const days =
        Math.floor(
            hours /
                24
        );


    if (
        days <
        7
    ) {

        return (
            `Il y a ${days} j`
        );

    }


    const weeks =
        Math.floor(
            days /
                7
        );


    if (
        weeks <
        5
    ) {

        return (
            `Il y a ${weeks} sem.`
        );

    }


    const months =
        Math.floor(
            days /
                30
        );


    if (
        months <
        12
    ) {

        return (
            `Il y a ${months} mois`
        );

    }


    const years =
        Math.floor(
            days /
                365
        );


    return (
        `Il y a ${years} an` +
        (
            years > 1
                ? "s"
                : ""
        )
    );

}


// ==========================================
// Helpers
// ==========================================

function normalizeType(
    type
) {

    return String(
        type ||
        ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[\s-]+/g,
            "_"
        );

}


function formatCount(
    count
) {

    const number =
        Number(count) || 0;


    if (
        number > 99
    ) {

        return "99+";

    }


    return String(
        number
    );

}


function deduplicateNotifications(
    notifications
) {

    const map =
        new Map();


    notifications.forEach(
        notification => {

            if (
                notification?.id
            ) {

                map.set(
                    notification.id,
                    notification
                );

            }

        }
    );


    return [
        ...map.values()
    ].sort(
        (
            a,
            b
        ) => {

            const dateA =
                new Date(
                    a.created_at ||
                    0
                ).getTime();


            const dateB =
                new Date(
                    b.created_at ||
                    0
                ).getTime();


            return dateB - dateA;

        }
    );

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
// Cleanup
// ==========================================

window.addEventListener(
    "beforeunload",
    async () => {

        if (
            state.realtimeChannel
        ) {

            try {

                await unsubscribe(
                    state.realtimeChannel
                );

            } catch (error) {

                console.warn(
                    "Erreur fermeture Realtime :",
                    error
                );

            }

        }

    }
);


// ==========================================
// Export
// ==========================================

export {

    loadNotifications,

    markAsRead,

    markAllAsRead,

    setFilter

};
