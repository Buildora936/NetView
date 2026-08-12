/* ============================================================
   NetView - Notification Page
   File: js/pages/notification.js
   ============================================================ */

import { supabase } from "../core/supabase.js";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const CONFIG = {
    PAGE_SIZE: 30,
    REALTIME_DELAY: 250,
    DATE_LOCALE: "fr-FR",

    MENTION_TYPES: [
        "comment_mentioned",
        "message_mentioned",
        "live_mentioned"
    ],

    ACTIVITY_TYPES: [
        "video_liked",
        "video_commented",
        "comment_replied",
        "short_liked",
        "short_commented",
        "channel_subscribed",
        "product_favorite",
        "product_review"
    ],

    NETVIEW_TYPES: [
        "system",
        "maintenance",
        "announcement",
        "verification_approved",
        "verification_rejected",
        "security_login",
        "security_new_device",
        "payment_success",
        "payment_failed",
        "refund",
        "payout",
        "pro_subscription",
        "pro_expiring"
    ]
};


/* ============================================================
   STATE
   ============================================================ */

const state = {
    user: null,

    notifications: [],

    activeFilter: "all",

    loading: false,

    initialized: false,

    realtimeChannel: null,

    realtimeTimer: null,

    currentPage: 0,

    hasMore: true,

    loadingMore: false
};


/* ============================================================
   DOM
   ============================================================ */

const DOM = {
    list: null,
    loading: null,
    empty: null,
    error: null,

    markAllButton: null,

    filters: [],

    allCount: null,
    unreadCount: null
};


/* ============================================================
   INITIALISATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", initNotificationsPage);


/* ============================================================
   MAIN INIT
   ============================================================ */

async function initNotificationsPage() {
    try {
        cacheDOM();

        bindEvents();

        await getCurrentUser();

        if (!state.user) {
            handleUnauthenticatedUser();
            return;
        }

        state.initialized = true;

        await loadNotifications(true);

        subscribeToRealtime();

    } catch (error) {
        console.error(
            "[NetView Notifications] Initialisation error:",
            error
        );

        showError(
            "Impossible de charger vos notifications."
        );
    }
}


/* ============================================================
   DOM CACHE
   ============================================================ */

function cacheDOM() {
    DOM.list = document.getElementById("notifications-list");

    DOM.loading = document.getElementById(
        "notifications-loading"
    );

    DOM.empty = document.getElementById(
        "notifications-empty"
    );

    DOM.error = document.getElementById(
        "notifications-error"
    );

    DOM.markAllButton = document.getElementById(
        "mark-all-read-button"
    );

    DOM.allCount = document.getElementById(
        "all-count"
    );

    DOM.unreadCount = document.getElementById(
        "unread-count"
    );

    DOM.filters = Array.from(
        document.querySelectorAll(
            ".notification-filter"
        )
    );
}


/* ============================================================
   EVENTS
   ============================================================ */

function bindEvents() {

    DOM.filters.forEach(button => {
        button.addEventListener(
            "click",
            handleFilterClick
        );
    });


    if (DOM.markAllButton) {
        DOM.markAllButton.addEventListener(
            "click",
            markAllAsRead
        );
    }


    /*
     * Gestion du menu/sidebar existant
     */
    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebarOverlay");


    if (
        menuButton &&
        sidebar &&
        overlay
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "is-open"
                );

                overlay.classList.toggle(
                    "is-visible"
                );

                document.body.classList.toggle(
                    "sidebar-open"
                );
            }
        );


        overlay.addEventListener(
            "click",
            closeSidebar
        );
    }


    /*
     * Recherche
     */
    const searchForm =
        document.getElementById("searchForm");

    const searchInput =
        document.getElementById("searchInput");


    if (searchForm) {

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


    /*
     * Infinite scroll
     */
    window.addEventListener(
        "scroll",
        handleScroll,
        {
            passive: true
        }
    );


    /*
     * Page visibility
     */
    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );
}


/* ============================================================
   CURRENT USER
   ============================================================ */

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabase.auth.getUser();


    if (error) {
        throw error;
    }


    state.user =
        data?.user || null;
}


/* ============================================================
   AUTH REDIRECT
   ============================================================ */

function handleUnauthenticatedUser() {

    window.location.href =
        `login.html?redirect=${encodeURIComponent(
            "notification.html"
        )}`;
}


/* ============================================================
   LOAD NOTIFICATIONS
   ============================================================ */

async function loadNotifications(reset = false) {

    if (!state.user) {
        return;
    }


    if (state.loading) {
        return;
    }


    state.loading = true;


    if (reset) {

        state.currentPage = 0;

        state.hasMore = true;

        state.notifications = [];

        showLoading();

        clearError();
    }


    try {

        const from =
            state.currentPage *
            CONFIG.PAGE_SIZE;

        const to =
            from +
            CONFIG.PAGE_SIZE -
            1;


        const {
            data,
            error
        } = await supabase
            .from("notifications")
            .select(`
                id,
                user_id,
                actor_id,
                type,
                title,
                message,
                is_read,
                created_at,
                entity_type,
                entity_id,
                action_url,
                image_url,
                read_at,
                metadata,
                group_key,
                priority,
                expires_at,
                actor:profiles!notifications_actor_id_fkey (
                    id,
                    username,
                    display_name,
                    avatar_url,
                    verified,
                    company_verified
                )
            `)
            .eq(
                "user_id",
                state.user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .range(from, to);


        if (error) {
            throw error;
        }


        const rows =
            Array.isArray(data)
                ? data
                : [];


        /*
         * Supprimer les notifications expirées
         * côté affichage.
         */
        const now =
            Date.now();


        const validRows =
            rows.filter(notification => {

                if (
                    !notification.expires_at
                ) {
                    return true;
                }

                return (
                    new Date(
                        notification.expires_at
                    ).getTime() > now
                );
            });


        if (reset) {

            state.notifications =
                validRows;

        } else {

            state.notifications.push(
                ...validRows
            );
        }


        /*
         * Si moins de PAGE_SIZE résultats
         * sont retournés, il n'y a plus
         * de page.
         */
        state.hasMore =
            rows.length ===
            CONFIG.PAGE_SIZE;


        state.currentPage++;


        renderNotifications();

        await updateCounters();

    } catch (error) {

        console.error(
            "[NetView Notifications] Load error:",
            error
        );


        if (reset) {

            state.notifications = [];

            showError(
                "Impossible de récupérer vos notifications."
            );
        }

    } finally {

        state.loading = false;

        hideLoading();
    }
}


/* ============================================================
   LOAD MORE
   ============================================================ */

async function loadMoreNotifications() {

    if (
        state.loadingMore ||
        state.loading ||
        !state.hasMore
    ) {
        return;
    }


    state.loadingMore = true;


    try {

        await loadNotifications(false);

    } finally {

        state.loadingMore = false;
    }
}


/* ============================================================
   FILTERS
   ============================================================ */

async function handleFilterClick(event) {

    const button =
        event.currentTarget;

    const filter =
        button.dataset.filter;


    if (!filter) {
        return;
    }


    state.activeFilter =
        filter;


    DOM.filters.forEach(
        filterButton => {

            const active =
                filterButton === button;


            filterButton.classList.toggle(
                "active",
                active
            );


            filterButton.setAttribute(
                "aria-selected",
                active
                    ? "true"
                    : "false"
            );
        }
    );


    renderNotifications();
}


/* ============================================================
   FILTER DATA
   ============================================================ */

function getFilteredNotifications() {

    const notifications =
        state.notifications;


    switch (
        state.activeFilter
    ) {

        case "unread":

            return notifications.filter(
                notification =>
                    notification.is_read === false
            );


        case "mentions":

            return notifications.filter(
                notification =>
                    CONFIG.MENTION_TYPES.includes(
                        notification.type
                    )
            );


        case "activity":

            return notifications.filter(
                notification =>
                    CONFIG.ACTIVITY_TYPES.includes(
                        notification.type
                    )
            );


        case "netview":

            return notifications.filter(
                notification =>
                    CONFIG.NETVIEW_TYPES.includes(
                        notification.type
                    )
            );


        case "all":
        default:

            return notifications;
    }
}


/* ============================================================
   RENDER
   ============================================================ */

function renderNotifications() {

    if (!DOM.list) {
        return;
    }


    const filtered =
        getFilteredNotifications();


    /*
     * Ne pas supprimer le skeleton
     * pendant le chargement initial.
     */
    if (
        state.loading &&
        state.notifications.length === 0
    ) {
        return;
    }


    DOM.list.innerHTML = "";


    if (!filtered.length) {

        showEmptyState();

        updateMarkAllButton();

        return;
    }


    hideEmptyState();


    const fragment =
        document.createDocumentFragment();


    filtered.forEach(
        notification => {

            const element =
                createNotificationElement(
                    notification
                );


            fragment.appendChild(
                element
            );
        }
    );


    DOM.list.appendChild(
        fragment
    );


    updateMarkAllButton();
}


/* ============================================================
   CREATE NOTIFICATION
   ============================================================ */

function createNotificationElement(
    notification
) {

    const article =
        document.createElement("article");


    const unread =
        !notification.is_read;


    article.className =
        "notification-item";


    if (unread) {

        article.classList.add(
            "is-unread"
        );
    }


    article.dataset.notificationId =
        notification.id;


    article.dataset.type =
        notification.type;


    article.setAttribute(
        "role",
        "article"
    );


    /*
     * Avatar / image
     */
    const media =
        document.createElement("div");

    media.className =
        "notification-media";


    const image =
        document.createElement("img");


    const imageURL =
        getNotificationImage(
            notification
        );


    image.src =
        imageURL ||
        getDefaultNotificationImage(
            notification.type
        );


    image.alt =
        "";


    image.loading =
        "lazy";


    image.className =
        "notification-image";


    image.addEventListener(
        "error",
        () => {

            image.src =
                getDefaultNotificationImage(
                    notification.type
                );
        },
        {
            once: true
        }
    );


    media.appendChild(
        image
    );


    /*
     * Icon type
     */
    const icon =
        document.createElement("span");


    icon.className =
        `notification-type-icon ${getTypeClass(
            notification.type
        )}`;


    icon.innerHTML =
        `<i class="${getTypeIcon(
            notification.type
        )}" aria-hidden="true"></i>`;


    media.appendChild(
        icon
    );


    /*
     * Content
     */
    const content =
        document.createElement("div");


    content.className =
        "notification-content";


    const title =
        document.createElement("h2");


    title.className =
        "notification-title";


    title.textContent =
        notification.title ||
        getDefaultTitle(
            notification.type
        );


    const message =
        document.createElement("p");


    message.className =
        "notification-message";


    message.textContent =
        notification.message ||
        "";


    const footer =
        document.createElement("div");


    footer.className =
        "notification-meta";


    const time =
        document.createElement("time");


    time.className =
        "notification-time";


    time.dateTime =
        notification.created_at;


    time.textContent =
        formatRelativeDate(
            notification.created_at
        );


    footer.appendChild(
        time
    );


    if (
        notification.priority >
        0
    ) {

        const priority =
            document.createElement(
                "span"
            );


        priority.className =
            "notification-priority";


        priority.innerHTML =
            `<i class="fa-solid fa-star"></i> Important`;


        footer.appendChild(
            priority
        );
    }


    content.appendChild(
        title
    );

    content.appendChild(
        message
    );

    content.appendChild(
        footer
    );


    /*
     * Actions
     */
    const actions =
        document.createElement("div");


    actions.className =
        "notification-actions";


    if (unread) {

        const unreadDot =
            document.createElement(
                "span"
            );


        unreadDot.className =
            "notification-unread-dot";


        unreadDot.title =
            "Non lue";


        unreadDot.setAttribute(
            "aria-label",
            "Notification non lue"
        );


        actions.appendChild(
            unreadDot
        );
    }


    const menuButton =
        document.createElement("button");


    menuButton.type =
        "button";


    menuButton.className =
        "notification-menu-button";


    menuButton.setAttribute(
        "aria-label",
        "Options de notification"
    );


    menuButton.innerHTML =
        `<i class="fa-solid fa-ellipsis"></i>`;


    menuButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleNotificationMenu(
                article,
                notification
            );
        }
    );


    actions.appendChild(
        menuButton
    );


    article.appendChild(
        media
    );

    article.appendChild(
        content
    );

    article.appendChild(
        actions
    );


    /*
     * Click notification
     */
    article.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".notification-menu-button"
                )
            ) {
                return;
            }


            handleNotificationClick(
                notification
            );
        }
    );


    return article;
}


/* ============================================================
   NOTIFICATION CLICK
   ============================================================ */

async function handleNotificationClick(
    notification
) {

    if (
        !notification.is_read
    ) {

        await markAsRead(
            notification.id,
            false
        );
    }


    const url =
        resolveNotificationURL(
            notification
        );


    if (url) {

        window.location.href =
            url;
    }
}


/* ============================================================
   RESOLVE URL
   ============================================================ */

function resolveNotificationURL(
    notification
) {

    /*
     * action_url prioritaire.
     */
    if (
        notification.action_url
    ) {

        return sanitizeInternalURL(
            notification.action_url
        );
    }


    const entityType =
        notification.entity_type;


    const entityId =
        notification.entity_id;


    if (
        !entityType ||
        !entityId
    ) {
        return null;
    }


    switch (entityType) {

        case "video":

            return `player.html?id=${encodeURIComponent(
                entityId
            )}`;


        case "short":

            return `shorts.html?id=${encodeURIComponent(
                entityId
            )}`;


        case "channel":

            return `channel.html?id=${encodeURIComponent(
                entityId
            )}`;


        case "live":

            return `live.html?id=${encodeURIComponent(
                entityId
            )}`;


        case "product":

            return `product.html?id=${encodeURIComponent(
                entityId
            )}`;


        case "conversation":

            return `messages.html?id=${encodeURIComponent(
                entityId
            )}`;


        case "message":

            return `messages.html?message=${encodeURIComponent(
                entityId
            )}`;


        case "order":

            return `checkout.html?order=${encodeURIComponent(
                entityId
            )}`;


        default:

            return null;
    }
}


/* ============================================================
   SANITIZE URL
   ============================================================ */

function sanitizeInternalURL(
    url
) {

    if (!url) {
        return null;
    }


    try {

        const parsed =
            new URL(
                url,
                window.location.origin
            );


        /*
         * Autorise uniquement les URLs
         * du même domaine.
         */
        if (
            parsed.origin !==
            window.location.origin
        ) {
            return null;
        }


        return (
            parsed.pathname +
            parsed.search +
            parsed.hash
        );

    } catch {

        /*
         * Pour les chemins relatifs simples.
         */
        if (
            url.startsWith("/")
        ) {
            return url;
        }


        if (
            url.endsWith(".html") ||
            url.includes(".html?")
        ) {
            return url;
        }


        return null;
    }
}


/* ============================================================
   MARK AS READ
   ============================================================ */

async function markAsRead(
    notificationId,
    rerender = true
) {

    if (
        !state.user ||
        !notificationId
    ) {
        return false;
    }


    try {

        const now =
            new Date().toISOString();


        const {
            error
        } = await supabase
            .from("notifications")
            .update({
                is_read: true,
                read_at: now
            })
            .eq(
                "id",
                notificationId
            )
            .eq(
                "user_id",
                state.user.id
            );


        if (error) {
            throw error;
        }


        const notification =
            state.notifications.find(
                item =>
                    item.id ===
                    notificationId
            );


        if (notification) {

            notification.is_read =
                true;

            notification.read_at =
                now;
        }


        if (rerender) {

            renderNotifications();

            await updateCounters();
        }


        return true;

    } catch (error) {

        console.error(
            "[NetView Notifications] Mark read error:",
            error
        );

        showToast(
            "Impossible de marquer la notification comme lue.",
            "error"
        );

        return false;
    }
}


/* ============================================================
   MARK ALL AS READ
   ============================================================ */

async function markAllAsRead() {

    if (!state.user) {
        return;
    }


    const unreadCount =
        state.notifications.filter(
            notification =>
                !notification.is_read
        ).length;


    if (!unreadCount) {
        return;
    }


    if (DOM.markAllButton) {

        DOM.markAllButton.disabled =
            true;

        DOM.markAllButton.classList.add(
            "is-loading"
        );
    }


    try {

        const now =
            new Date().toISOString();


        const {
            error
        } = await supabase
            .from("notifications")
            .update({
                is_read: true,
                read_at: now
            })
            .eq(
                "user_id",
                state.user.id
            )
            .eq(
                "is_read",
                false
            );


        if (error) {
            throw error;
        }


        state.notifications.forEach(
            notification => {

                notification.is_read =
                    true;

                notification.read_at =
                    now;
            }
        );


        renderNotifications();

        await updateCounters();


        showToast(
            "Toutes les notifications sont maintenant lues.",
            "success"
        );

    } catch (error) {

        console.error(
            "[NetView Notifications] Mark all read error:",
            error
        );


        showToast(
            "Impossible de marquer toutes les notifications comme lues.",
            "error"
        );

    } finally {

        if (DOM.markAllButton) {

            DOM.markAllButton.classList.remove(
                "is-loading"
            );

            updateMarkAllButton();
        }
    }
}


/* ============================================================
   COUNTERS
   ============================================================ */

async function updateCounters() {

    const total =
        state.notifications.length;


    const unread =
        state.notifications.filter(
            notification =>
                !notification.is_read
        ).length;


    updateCounter(
        DOM.allCount,
        total
    );


    updateCounter(
        DOM.unreadCount,
        unread
    );


    updateMarkAllButton();


    /*
     * Badge global éventuellement utilisé
     * par le header/sidebar.
     */
    updateGlobalNotificationBadges(
        unread
    );
}


/* ============================================================
   COUNTER UI
   ============================================================ */

function updateCounter(
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


/* ============================================================
   MARK ALL BUTTON STATE
   ============================================================ */

function updateMarkAllButton() {

    if (!DOM.markAllButton) {
        return;
    }


    const unread =
        state.notifications.some(
            notification =>
                !notification.is_read
        );


    DOM.markAllButton.disabled =
        !unread;
}


/* ============================================================
   GLOBAL NOTIFICATION BADGES
   ============================================================ */

function updateGlobalNotificationBadges(
    unreadCount
) {

    const badges =
        document.querySelectorAll(
            "[data-notification-count], .notification-badge, #notificationBadge"
        );


    badges.forEach(
        badge => {

            badge.textContent =
                unreadCount > 99
                    ? "99+"
                    : String(unreadCount);


            badge.hidden =
                unreadCount <= 0;
        }
    );
}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function showEmptyState() {

    if (!DOM.empty) {
        createFallbackEmptyState();
        return;
    }


    DOM.empty.hidden =
        false;


    DOM.empty.innerHTML = `
        <div class="notifications-empty-state">
            <div class="notifications-empty-icon">
                <i class="fa-regular fa-bell-slash"></i>
            </div>

            <h2>Aucune notification</h2>

            <p>
                ${
                    state.activeFilter === "all"
                        ? "Vous n'avez aucune notification pour le moment."
                        : "Aucune notification ne correspond à ce filtre."
                }
            </p>
        </div>
    `;
}


/* ============================================================
   FALLBACK EMPTY STATE
   ============================================================ */

function createFallbackEmptyState() {

    if (!DOM.list) {
        return;
    }


    DOM.list.innerHTML = `
        <div class="notifications-empty-state">
            <div class="notifications-empty-icon">
                <i class="fa-regular fa-bell-slash"></i>
            </div>

            <h2>Aucune notification</h2>

            <p>
                ${
                    state.activeFilter === "all"
                        ? "Vous n'avez aucune notification pour le moment."
                        : "Aucune notification ne correspond à ce filtre."
                }
            </p>
        </div>
    `;
}


/* ============================================================
   HIDE EMPTY
   ============================================================ */

function hideEmptyState() {

    if (!DOM.empty) {
        return;
    }


    DOM.empty.hidden =
        true;

    DOM.empty.innerHTML =
        "";
}


/* ============================================================
   ERROR
   ============================================================ */

function showError(
    message
) {

    if (DOM.loading) {

        DOM.loading.hidden =
            true;
    }


    if (DOM.error) {

        DOM.error.hidden =
            false;


        DOM.error.innerHTML = `
            <div class="notifications-error-state">
                <div class="notifications-error-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h2>Une erreur est survenue</h2>

                <p>${escapeHTML(message)}</p>

                <button
                    type="button"
                    class="btn btn-primary"
                    id="notifications-retry"
                >
                    <i class="fa-solid fa-rotate-right"></i>
                    Réessayer
                </button>
            </div>
        `;


        const retry =
            document.getElementById(
                "notifications-retry"
            );


        retry?.addEventListener(
            "click",
            () => {

                clearError();

                loadNotifications(true);
            }
        );


        return;
    }


    if (DOM.list) {

        DOM.list.innerHTML = `
            <div class="notifications-error-state">
                <div class="notifications-error-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h2>Une erreur est survenue</h2>

                <p>${escapeHTML(message)}</p>

                <button
                    type="button"
                    class="btn btn-primary"
                    id="notifications-retry-fallback"
                >
                    <i class="fa-solid fa-rotate-right"></i>
                    Réessayer
                </button>
            </div>
        `;


        document
            .getElementById(
                "notifications-retry-fallback"
            )
            ?.addEventListener(
                "click",
                () => loadNotifications(true)
            );
    }
}


/* ============================================================
   CLEAR ERROR
   ============================================================ */

function clearError() {

    if (!DOM.error) {
        return;
    }


    DOM.error.hidden =
        true;

    DOM.error.innerHTML =
        "";
}


/* ============================================================
   LOADING
   ============================================================ */

function showLoading() {

    if (!DOM.loading) {
        return;
    }


    DOM.loading.hidden =
        false;
}


function hideLoading() {

    if (!DOM.loading) {
        return;
    }


    DOM.loading.hidden =
        true;
}


/* ============================================================
   REALTIME
   ============================================================ */

function subscribeToRealtime() {

    if (!state.user) {
        return;
    }


    unsubscribeFromRealtime();


    state.realtimeChannel =
        supabase
            .channel(
                `netview-notifications-${state.user.id}`
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter:
                        `user_id=eq.${state.user.id}`
                },
                payload => {

                    queueRealtimeRefresh(
                        "insert",
                        payload
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "notifications",
                    filter:
                        `user_id=eq.${state.user.id}`
                },
                payload => {

                    queueRealtimeRefresh(
                        "update",
                        payload
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "notifications",
                    filter:
                        `user_id=eq.${state.user.id}`
                },
                payload => {

                    queueRealtimeRefresh(
                        "delete",
                        payload
                    );
                }
            )
            .subscribe(
                status => {

                    if (
                        status ===
                        "CHANNEL_ERROR"
                    ) {

                        console.warn(
                            "[NetView Notifications] Realtime channel error."
                        );
                    }
                }
            );
}


/* ============================================================
   REALTIME REFRESH
   ============================================================ */

function queueRealtimeRefresh(
    event,
    payload
) {

    clearTimeout(
        state.realtimeTimer
    );


    state.realtimeTimer =
        setTimeout(
            async () => {

                try {

                    /*
                     * Pour UPDATE/DELETE, on peut
                     * synchroniser proprement la page.
                     */
                    await loadNotifications(true);

                } catch (error) {

                    console.error(
                        "[NetView Notifications] Realtime refresh error:",
                        error
                    );
                }

            },
            CONFIG.REALTIME_DELAY
        );
}


/* ============================================================
   UNSUBSCRIBE REALTIME
   ============================================================ */

async function unsubscribeFromRealtime() {

    if (
        !state.realtimeChannel
    ) {
        return;
    }


    try {

        await supabase.removeChannel(
            state.realtimeChannel
        );

    } catch (error) {

        console.warn(
            "[NetView Notifications] Realtime unsubscribe error:",
            error
        );
    }


    state.realtimeChannel =
        null;
}


/* ============================================================
   PAGE VISIBILITY
   ============================================================ */

function handleVisibilityChange() {

    if (
        document.visibilityState ===
        "visible"
    ) {

        if (
            state.initialized
        ) {

            loadNotifications(true);
        }

    } else {

        /*
         * On conserve Realtime actif.
         * Supabase gère la connexion.
         */
    }
}


/* ============================================================
   INFINITE SCROLL
   ============================================================ */

function handleScroll() {

    if (
        state.loading ||
        state.loadingMore ||
        !state.hasMore
    ) {
        return;
    }


    const scrollPosition =
        window.innerHeight +
        window.scrollY;


    const threshold =
        document.documentElement
            .scrollHeight -
        700;


    if (
        scrollPosition >=
        threshold
    ) {

        loadMoreNotifications();
    }
}


/* ============================================================
   NOTIFICATION MENU
   ============================================================ */

function toggleNotificationMenu(
    article,
    notification
) {

    const existing =
        article.querySelector(
            ".notification-context-menu"
        );


    if (existing) {

        existing.remove();

        return;
    }


    /*
     * Fermer les autres menus.
     */
    document
        .querySelectorAll(
            ".notification-context-menu"
        )
        .forEach(
            menu => menu.remove()
        );


    const menu =
        document.createElement("div");


    menu.className =
        "notification-context-menu";


    const readButton =
        document.createElement("button");


    readButton.type =
        "button";


    readButton.innerHTML =
        notification.is_read
            ? `<i class="fa-regular fa-envelope"></i> Marquer comme non lue`
            : `<i class="fa-regular fa-envelope-open"></i> Marquer comme lue`;


    readButton.addEventListener(
        "click",
        async event => {

            event.stopPropagation();


            if (
                notification.is_read
            ) {

                await markAsUnread(
                    notification.id
                );

            } else {

                await markAsRead(
                    notification.id
                );
            }


            menu.remove();
        }
    );


    menu.appendChild(
        readButton
    );


    const deleteButton =
        document.createElement("button");


    deleteButton.type =
        "button";


    deleteButton.className =
        "danger";


    deleteButton.innerHTML =
        `<i class="fa-regular fa-trash-can"></i> Supprimer`;


    deleteButton.addEventListener(
        "click",
        async event => {

            event.stopPropagation();


            await deleteNotification(
                notification.id
            );


            menu.remove();
        }
    );


    menu.appendChild(
        deleteButton
    );


    article.appendChild(
        menu
    );
}


/* ============================================================
   MARK AS UNREAD
   ============================================================ */

async function markAsUnread(
    notificationId
) {

    if (!state.user) {
        return false;
    }


    try {

        const {
            error
        } = await supabase
            .from("notifications")
            .update({
                is_read: false,
                read_at: null
            })
            .eq(
                "id",
                notificationId
            )
            .eq(
                "user_id",
                state.user.id
            );


        if (error) {
            throw error;
        }


        const notification =
            state.notifications.find(
                item =>
                    item.id ===
                    notificationId
            );


        if (notification) {

            notification.is_read =
                false;

            notification.read_at =
                null;
        }


        renderNotifications();

        await updateCounters();


        return true;

    } catch (error) {

        console.error(
            "[NetView Notifications] Mark unread error:",
            error
        );


        showToast(
            "Impossible de modifier cette notification.",
            "error"
        );


        return false;
    }
}


/* ============================================================
   DELETE NOTIFICATION
   ============================================================ */

async function deleteNotification(
    notificationId
) {

    if (!state.user) {
        return false;
    }


    try {

        const {
            error
        } = await supabase
            .from("notifications")
            .delete()
            .eq(
                "id",
                notificationId
            )
            .eq(
                "user_id",
                state.user.id
            );


        if (error) {
            throw error;
        }


        state.notifications =
            state.notifications.filter(
                notification =>
                    notification.id !==
                    notificationId
            );


        renderNotifications();

        await updateCounters();


        showToast(
            "Notification supprimée.",
            "success"
        );


        return true;

    } catch (error) {

        console.error(
            "[NetView Notifications] Delete error:",
            error
        );


        showToast(
            "Impossible de supprimer cette notification.",
            "error"
        );


        return false;
    }
}


/* ============================================================
   IMAGE
   ============================================================ */

function getNotificationImage(
    notification
) {

    if (
        notification.image_url
    ) {
        return notification.image_url;
    }


    if (
        notification.actor?.avatar_url
    ) {
        return notification.actor.avatar_url;
    }


    return null;
}


/* ============================================================
   TYPE ICON
   ============================================================ */

function getTypeIcon(
    type
) {

    const icons = {

        video_published:
            "fa-solid fa-video",

        video_liked:
            "fa-solid fa-thumbs-up",

        video_commented:
            "fa-solid fa-comment",

        comment_replied:
            "fa-solid fa-reply",

        comment_mentioned:
            "fa-solid fa-at",

        short_published:
            "fa-solid fa-bolt",

        short_liked:
            "fa-solid fa-heart",

        short_commented:
            "fa-solid fa-comment",

        live_started:
            "fa-solid fa-tower-broadcast",

        live_scheduled:
            "fa-regular fa-calendar",

        live_ended:
            "fa-solid fa-circle-stop",

        live_mentioned:
            "fa-solid fa-at",

        channel_subscribed:
            "fa-solid fa-user-plus",

        channel_milestone:
            "fa-solid fa-chart-line",

        message_received:
            "fa-solid fa-message",

        message_mentioned:
            "fa-solid fa-at",

        message_reaction:
            "fa-solid fa-face-smile",

        product_purchased:
            "fa-solid fa-bag-shopping",

        product_sale:
            "fa-solid fa-cart-shopping",

        product_review:
            "fa-solid fa-star",

        product_favorite:
            "fa-regular fa-heart",

        payment_success:
            "fa-solid fa-circle-check",

        payment_failed:
            "fa-solid fa-circle-xmark",

        refund:
            "fa-solid fa-arrow-rotate-left",

        payout:
            "fa-solid fa-money-bill-transfer",

        pro_subscription:
            "fa-solid fa-crown",

        pro_expiring:
            "fa-solid fa-clock",

        verification_approved:
            "fa-solid fa-circle-check",

        verification_rejected:
            "fa-solid fa-circle-xmark",

        security_login:
            "fa-solid fa-shield-halved",

        security_new_device:
            "fa-solid fa-mobile-screen-button",

        maintenance:
            "fa-solid fa-screwdriver-wrench",

        announcement:
            "fa-solid fa-bullhorn",

        system:
            "fa-solid fa-circle-info"
    };


    return (
        icons[type] ||
        "fa-solid fa-bell"
    );
}


/* ============================================================
   TYPE CLASS
   ============================================================ */

function getTypeClass(
    type
) {

    if (
        CONFIG.MENTION_TYPES.includes(
            type
        )
    ) {
        return "type-mention";
    }


    if (
        CONFIG.ACTIVITY_TYPES.includes(
            type
        )
    ) {
        return "type-activity";
    }


    if (
        CONFIG.NETVIEW_TYPES.includes(
            type
        )
    ) {
        return "type-netview";
    }


    if (
        type.includes("payment") ||
        type.includes("payout") ||
        type.includes("product")
    ) {
        return "type-commerce";
    }


    if (
        type.includes("security") ||
        type.includes("verification")
    ) {
        return "type-security";
    }


    if (
        type.includes("live")
    ) {
        return "type-live";
    }


    if (
        type.includes("message")
    ) {
        return "type-message";
    }


    return "type-default";
}


/* ============================================================
   DEFAULT IMAGE
   ============================================================ */

function getDefaultNotificationImage(
    type
) {

    const base =
        "NetView_icone.png";


    return base;
}


/* ============================================================
   DEFAULT TITLE
   ============================================================ */

function getDefaultTitle(
    type
) {

    const titles = {

        video_liked:
            "Votre vidéo a reçu un J'aime",

        video_commented:
            "Nouveau commentaire",

        comment_replied:
            "Nouvelle réponse à votre commentaire",

        comment_mentioned:
            "Vous avez été mentionné",

        short_liked:
            "Votre Short a reçu un J'aime",

        short_commented:
            "Nouveau commentaire sur votre Short",

        live_started:
            "Un live vient de commencer",

        live_scheduled:
            "Live programmé",

        channel_subscribed:
            "Nouvel abonnement",

        message_received:
            "Nouveau message",

        message_mentioned:
            "Vous avez été mentionné dans un message",

        product_purchased:
            "Achat confirmé",

        product_sale:
            "Nouvelle vente",

        product_review:
            "Nouvel avis produit",

        payment_success:
            "Paiement confirmé",

        payment_failed:
            "Paiement échoué",

        verification_approved:
            "Vérification approuvée",

        verification_rejected:
            "Vérification refusée",

        security_login:
            "Nouvelle connexion",

        security_new_device:
            "Nouvel appareil détecté",

        announcement:
            "Annonce NetView",

        maintenance:
            "Maintenance NetView",

        system:
            "Notification NetView"
    };


    return (
        titles[type] ||
        "Notification NetView"
    );
}


/* ============================================================
   DATE
   ============================================================ */

function formatRelativeDate(
    date
) {

    if (!date) {
        return "";
    }


    const timestamp =
        new Date(date).getTime();


    if (
        Number.isNaN(timestamp)
    ) {
        return "";
    }


    const now =
        Date.now();


    const difference =
        Math.max(
            0,
            now - timestamp
        );


    const seconds =
        Math.floor(
            difference / 1000
        );


    if (seconds < 60) {

        return "À l'instant";
    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (minutes < 60) {

        return (
            minutes === 1
                ? "Il y a 1 minute"
                : `Il y a ${minutes} minutes`
        );
    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return (
            hours === 1
                ? "Il y a 1 heure"
                : `Il y a ${hours} heures`
        );
    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 7) {

        return (
            days === 1
                ? "Hier"
                : `Il y a ${days} jours`
        );
    }


    return new Intl.DateTimeFormat(
        CONFIG.DATE_LOCALE,
        {
            day: "numeric",
            month: "short",
            year:
                new Date(date).getFullYear() !==
                new Date().getFullYear()
                    ? "numeric"
                    : undefined
        }
    ).format(
        new Date(date)
    );
}


/* ============================================================
   FORMAT COUNT
   ============================================================ */

function formatCount(
    value
) {

    const number =
        Number(value) || 0;


    if (
        number >= 1000000
    ) {

        return (
            (number / 1000000)
                .toFixed(
                    number >= 10000000
                        ? 0
                        : 1
                )
            + " M"
        );
    }


    if (
        number >= 1000
    ) {

        return (
            (number / 1000)
                .toFixed(
                    number >= 10000
                        ? 0
                        : 1
                )
            + " k"
        );
    }


    return String(number);
}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    message,
    type = "info"
) {

    /*
     * Utilise le système Toast NetView
     * s'il existe déjà.
     */

    if (
        typeof window.showToast ===
        "function"
    ) {

        window.showToast(
            message,
            type
        );

        return;
    }


    /*
     * Fallback minimal.
     */

    let container =
        document.querySelector(
            ".nv-toast-container"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.className =
            "nv-toast-container";


        document.body.appendChild(
            container
        );
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `nv-toast nv-toast-${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "is-visible"
            );
        }
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "is-visible"
            );


            setTimeout(
                () => toast.remove(),
                300
            );

        },
        3500
    );
}


/* ============================================================
   SIDEBAR
   ============================================================ */

function closeSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    sidebar?.classList.remove(
        "is-open"
    );


    overlay?.classList.remove(
        "is-visible"
    );


    document.body.classList.remove(
        "sidebar-open"
    );
}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


/* ============================================================
   CLEANUP
   ============================================================ */

window.addEventListener(
    "beforeunload",
    () => {

        clearTimeout(
            state.realtimeTimer
        );


        unsubscribeFromRealtime();
    }
);


/* ============================================================
   EXPORTS
   ============================================================ */

export {
    loadNotifications,
    markAsRead,
    markAllAsRead,
    state
};
