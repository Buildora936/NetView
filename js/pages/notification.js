/* =========================================================
   NetView — notification.js
   Page : notification.html
   ========================================================= */

(() => {
    "use strict";

    /* =========================================================
       CONFIGURATION
       ========================================================= */

    const PAGE = "notifications";

    const NAVIGATION = [
        {
            label: "Accueil",
            href: "index.html",
            icon: "fa-house"
        },
        {
            label: "Shorts",
            href: "shorts.html",
            icon: "fa-clapperboard"
        },
        {
            label: "Abonnements",
            href: "subscriptions.html",
            icon: "fa-layer-group"
        },
        {
            label: "Notifications",
            href: "notification.html",
            icon: "fa-bell",
            badge: true
        },
        {
            label: "Bibliothèque",
            href: "library.html",
            icon: "fa-photo-film"
        },
        {
            label: "Historique",
            href: "library.html#history",
            icon: "fa-clock-rotate-left"
        },
        {
            label: "À regarder plus tard",
            href: "library.html#watch-later",
            icon: "fa-regular fa-clock"
        },
        {
            label: "Playlists",
            href: "playlist.html",
            icon: "fa-list"
        },
        {
            divider: true
        },
        {
            label: "Mes chaînes",
            href: "mes-channel.html",
            icon: "fa-tv"
        },
        {
            label: "Lives",
            href: "lives.html",
            icon: "fa-tower-broadcast"
        },
        {
            label: "NetView Shop",
            href: "netview-shop.html",
            icon: "fa-store"
        },
        {
            divider: true
        },
        {
            label: "Studio",
            href: "studio.html",
            icon: "fa-chart-line"
        },
        {
            label: "Messages",
            href: "messages.html",
            icon: "fa-regular fa-message"
        }
    ];

    /* =========================================================
       ÉTAT
       ========================================================= */

    const state = {
        user: null,
        profile: null,
        notifications: [],
        filteredNotifications: [],
        activeFilter: "all",
        searchQuery: "",
        loading: true
    };

    /* =========================================================
       UTILITAIRES DOM
       ========================================================= */

    const $ = (selector, parent = document) => {
        return parent.querySelector(selector);
    };

    const $$ = (selector, parent = document) => {
        return Array.from(parent.querySelectorAll(selector));
    };

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getInitials(name) {
        if (!name) {
            return "NV";
        }

        const parts = String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const now = new Date();
        const difference = now.getTime() - date.getTime();

        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;

        if (difference < minute) {
            return "À l'instant";
        }

        if (difference < hour) {
            const minutes = Math.floor(difference / minute);
            return `Il y a ${minutes} min`;
        }

        if (difference < day) {
            const hours = Math.floor(difference / hour);
            return `Il y a ${hours} h`;
        }

        if (difference < week) {
            const days = Math.floor(difference / day);

            if (days === 1) {
                return "Hier";
            }

            return `Il y a ${days} j`;
        }

        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "short",
            year: date.getFullYear() !== now.getFullYear()
                ? "numeric"
                : undefined
        }).format(date);
    }

    function showToast(message, type = "info") {
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
            return;
        }

        let toastContainer = $("#notification-toast-container");

        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "notification-toast-container";
            toastContainer.className = "notification-toast-container";
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement("div");

        toast.className = `notification-toast notification-toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        setTimeout(() => {
            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    /* =========================================================
       SUPABASE
       ========================================================= */

    function getSupabaseClient() {
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (window.supabase && typeof window.supabase.from === "function") {
            return window.supabase;
        }

        return null;
    }

    async function getCurrentUser() {
        const client = getSupabaseClient();

        if (!client) {
            console.warn(
                "NetView : client Supabase introuvable."
            );
            return null;
        }

        try {
            const {
                data,
                error
            } = await client.auth.getUser();

            if (error) {
                console.error(
                    "Erreur récupération utilisateur :",
                    error
                );

                return null;
            }

            return data?.user || null;

        } catch (error) {
            console.error(
                "Erreur getCurrentUser :",
                error
            );

            return null;
        }
    }

    async function loadProfile() {
        const client = getSupabaseClient();

        if (!client || !state.user) {
            return null;
        }

        try {
            const {
                data,
                error
            } = await client
                .from("profiles")
                .select(`
                    id,
                    username,
                    display_name,
                    avatar_url,
                    verified,
                    company_verified
                `)
                .eq("id", state.user.id)
                .maybeSingle();

            if (error) {
                console.error(
                    "Erreur profil :",
                    error
                );

                return null;
            }

            state.profile = data || null;

            return state.profile;

        } catch (error) {
            console.error(
                "Erreur loadProfile :",
                error
            );

            return null;
        }
    }

    /* =========================================================
       HEADER
       ========================================================= */

    function createHeader() {
        const oldHeader = $("#site-header");

        if (!oldHeader) {
            return;
        }

        oldHeader.className = "nv-header";
        oldHeader.innerHTML = `
            <div class="nv-header-left">

                <button
                    type="button"
                    id="menuButton"
                    class="nv-icon-button"
                    aria-label="Menu"
                    aria-expanded="false">

                    <i class="fa-solid fa-bars"></i>

                </button>

                <a
                    href="index.html"
                    class="nv-logo"
                    aria-label="NetView - Accueil">

                    <img
                        src="NetView.png"
                        alt="NetView">

                </a>

            </div>

            <div class="nv-header-center">

                <form
                    id="searchForm"
                    class="nv-search-form"
                    role="search">

                    <input
                        id="searchInput"
                        class="nv-search-input"
                        type="search"
                        placeholder="Rechercher"
                        autocomplete="off"
                        aria-label="Rechercher sur NetView">

                    <button
                        class="nv-search-button"
                        type="submit"
                        aria-label="Rechercher">

                        <i class="fa-solid fa-magnifying-glass"></i>

                    </button>

                </form>

            </div>

            <div
                id="headerRight"
                class="nv-header-right">

                ${createHeaderActions()}

            </div>
        `;

        createMobileSearchButton();
        bindHeaderEvents();
        updateHeaderAvatar();
    }

    function createHeaderActions() {
        const avatar =
            state.profile?.avatar_url ||
            "images/default-avatar.png";

        const unreadCount = getUnreadCount();

        return `
            <button
                type="button"
                id="mobileSearchButton"
                class="nv-icon-button nv-mobile-search-button"
                aria-label="Rechercher">

                <i class="fa-solid fa-magnifying-glass"></i>

            </button>

            <a
                href="publish.html"
                class="nv-create-button"
                aria-label="Créer">

                <i class="fa-solid fa-plus"></i>
                <span>Créer</span>

            </a>

            <button
                type="button"
                id="headerNotificationButton"
                class="nv-icon-button nv-notification-button active"
                aria-label="Notifications"
                aria-current="page">

                <i class="fa-regular fa-bell"></i>

                <span
                    id="headerNotificationCount"
                    class="nv-notification-count"
                    ${unreadCount > 0 ? "" : "hidden"}>

                    ${unreadCount}

                </span>

            </button>

            <button
                type="button"
                id="headerProfileButton"
                class="nv-profile-button"
                aria-label="Profil"
                aria-expanded="false">

                <img
                    id="headerAvatar"
                    class="nv-header-avatar"
                    src="${escapeHTML(avatar)}"
                    alt="Profil">

            </button>

        `;
    }

    function createMobileSearchButton() {
        const header = $("#site-header");

        if (!header) {
            return;
        }

        let mobileContainer =
            $("#mobileSearchContainer");

        if (!mobileContainer) {
            mobileContainer =
                document.createElement("div");

            mobileContainer.id =
                "mobileSearchContainer";

            mobileContainer.className =
                "nv-mobile-search-container";

            mobileContainer.hidden = true;

            mobileContainer.innerHTML = `
                <form
                    id="mobileSearchForm"
                    class="nv-mobile-search-form"
                    role="search">

                    <i class="fa-solid fa-magnifying-glass"></i>

                    <input
                        id="mobileSearchInput"
                        type="search"
                        placeholder="Rechercher sur NetView"
                        autocomplete="off">

                    <button
                        type="button"
                        id="mobileSearchClose"
                        aria-label="Fermer">

                        <i class="fa-solid fa-xmark"></i>

                    </button>

                </form>
            `;

            header.appendChild(mobileContainer);
        }
    }

    function updateHeaderAvatar() {
        const avatar = $("#headerAvatar");

        if (!avatar) {
            return;
        }

        avatar.src =
            state.profile?.avatar_url ||
            "images/default-avatar.png";

        avatar.alt =
            state.profile?.display_name ||
            state.profile?.username ||
            "Profil";
    }

    /* =========================================================
       SIDEBAR
       ========================================================= */

    function createSidebar() {
        const sidebar = $("#sidebar");

        if (!sidebar) {
            return;
        }

        sidebar.className = "nv-sidebar";

        sidebar.innerHTML = `
            <nav
                class="nv-sidebar-nav"
                aria-label="Navigation principale">

                ${NAVIGATION.map(item => {

                    if (item.divider) {
                        return `
                            <div
                                class="nv-sidebar-divider"
                                aria-hidden="true">
                            </div>
                        `;
                    }

                    const active =
                        item.href === "notification.html";

                    const iconClass =
                        item.icon.includes(" ")
                            ? item.icon
                            : `fa-solid ${item.icon}`;

                    return `
                        <a
                            href="${item.href}"
                            class="nv-sidebar-item ${active ? "active" : ""}"
                            ${active ? 'aria-current="page"' : ""}>

                            <i class="${iconClass}"></i>

                            <span>
                                ${escapeHTML(item.label)}
                            </span>

                            ${
                                item.badge
                                    ? `
                                        <span
                                            id="sidebarNotificationCount"
                                            class="nv-sidebar-badge"
                                            ${getUnreadCount() > 0 ? "" : "hidden"}>
                                            ${getUnreadCount()}
                                        </span>
                                    `
                                    : ""
                            }

                        </a>
                    `;
                }).join("")}

            </nav>

            <div class="nv-sidebar-footer">

                <a
                    href="settings.html"
                    class="nv-sidebar-item">

                    <i class="fa-solid fa-gear"></i>
                    <span>Paramètres</span>

                </a>

                <a
                    href="help.html"
                    class="nv-sidebar-item">

                    <i class="fa-regular fa-circle-question"></i>
                    <span>Aide</span>

                </a>

            </div>
        `;

        createSidebarOverlay();
    }

    function createSidebarOverlay() {
        let overlay = $("#sidebarOverlay");

        if (!overlay) {
            overlay = document.createElement("div");

            overlay.id =
                "sidebarOverlay";

            overlay.className =
                "nv-sidebar-overlay";

            document.body.appendChild(overlay);
        }

        overlay.addEventListener(
            "click",
            closeSidebar
        );
    }

    /* =========================================================
       MENU
       ========================================================= */

    function openSidebar() {
        const sidebar = $("#sidebar");
        const overlay = $("#sidebarOverlay");
        const menuButton = $("#menuButton");

        sidebar?.classList.add("open");
        overlay?.classList.add("active");

        if (menuButton) {
            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }

        document.body.classList.add(
            "sidebar-open"
        );
    }

    function closeSidebar() {
        const sidebar = $("#sidebar");
        const overlay = $("#sidebarOverlay");
        const menuButton = $("#menuButton");

        sidebar?.classList.remove("open");
        overlay?.classList.remove("active");

        if (menuButton) {
            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        document.body.classList.remove(
            "sidebar-open"
        );
    }

    function toggleSidebar() {
        const sidebar = $("#sidebar");

        if (!sidebar) {
            return;
        }

        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    /* =========================================================
       RECHERCHE NETVIEW
       ========================================================= */

    function performGlobalSearch(value) {
        const query = String(value || "").trim();

        if (!query) {
            return;
        }

        window.location.href =
            `search.html?q=${encodeURIComponent(query)}`;
    }

    function bindSearch() {
        const form = $("#searchForm");
        const input = $("#searchInput");

        if (form) {
            form.addEventListener(
                "submit",
                event => {
                    event.preventDefault();

                    performGlobalSearch(
                        input?.value
                    );
                }
            );
        }

        const mobileForm =
            $("#mobileSearchForm");

        const mobileInput =
            $("#mobileSearchInput");

        if (mobileForm) {
            mobileForm.addEventListener(
                "submit",
                event => {
                    event.preventDefault();

                    performGlobalSearch(
                        mobileInput?.value
                    );
                }
            );
        }
    }

    function openMobileSearch() {
        const container =
            $("#mobileSearchContainer");

        const input =
            $("#mobileSearchInput");

        if (!container) {
            return;
        }

        container.hidden = false;

        requestAnimationFrame(() => {
            container.classList.add("open");
            input?.focus();
        });
    }

    function closeMobileSearch() {
        const container =
            $("#mobileSearchContainer");

        if (!container) {
            return;
        }

        container.classList.remove("open");

        setTimeout(() => {
            container.hidden = true;
        }, 200);
    }

    /* =========================================================
       ÉVÉNEMENTS HEADER
       ========================================================= */

    function bindHeaderEvents() {
        const menuButton =
            $("#menuButton");

        menuButton?.addEventListener(
            "click",
            toggleSidebar
        );

        const mobileSearchButton =
            $("#mobileSearchButton");

        mobileSearchButton?.addEventListener(
            "click",
            openMobileSearch
        );

        const mobileSearchClose =
            $("#mobileSearchClose");

        mobileSearchClose?.addEventListener(
            "click",
            closeMobileSearch
        );

        const notificationButton =
            $("#headerNotificationButton");

        notificationButton?.addEventListener(
            "click",
            () => {
                window.location.href =
                    "notification.html";
            }
        );

        const profileButton =
            $("#headerProfileButton");

        profileButton?.addEventListener(
            "click",
            toggleProfileMenu
        );
    }

    /* =========================================================
       MENU PROFIL
       ========================================================= */

    function toggleProfileMenu(event) {
        event.stopPropagation();

        let menu =
            $("#netview-profile-menu");

        if (!menu) {
            menu =
                createProfileMenu();
        }

        const isOpen =
            menu.classList.contains("open");

        closeProfileMenu();

        if (!isOpen) {
            menu.classList.add("open");

            $("#headerProfileButton")
                ?.setAttribute(
                    "aria-expanded",
                    "true"
                );
        }
    }

    function createProfileMenu() {
        const menu =
            document.createElement("div");

        menu.id =
            "netview-profile-menu";

        menu.className =
            "nv-profile-menu";

        const displayName =
            state.profile?.display_name ||
            state.profile?.username ||
            "Utilisateur";

        const username =
            state.profile?.username
                ? `@${state.profile.username}`
                : "";

        menu.innerHTML = `
            <div class="nv-profile-menu-header">

                <strong>
                    ${escapeHTML(displayName)}
                </strong>

                <span>
                    ${escapeHTML(username)}
                </span>

            </div>

            <div class="nv-profile-menu-divider"></div>

            <a href="profile.html">
                <i class="fa-solid fa-user"></i>
                <span>Mon profil</span>
            </a>

            <a href="settings.html">
                <i class="fa-solid fa-gear"></i>
                <span>Paramètres</span>
            </a>

            <a href="subscriptions.html">
                <i class="fa-solid fa-layer-group"></i>
                <span>Abonnements</span>
            </a>

            <div class="nv-profile-menu-divider"></div>

            <button
                type="button"
                id="profileLogoutButton">

                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Se déconnecter</span>

            </button>
        `;

        document.body.appendChild(menu);

        $("#profileLogoutButton", menu)
            ?.addEventListener(
                "click",
                logout
            );

        return menu;
    }

    function closeProfileMenu() {
        const menu =
            $("#netview-profile-menu");

        menu?.classList.remove("open");

        $("#headerProfileButton")
            ?.setAttribute(
                "aria-expanded",
                "false"
            );
    }

    async function logout() {
        const client =
            getSupabaseClient();

        if (!client) {
            return;
        }

        try {
            const {
                error
            } = await client.auth.signOut();

            if (error) {
                throw error;
            }

            window.location.href =
                "auth.html";

        } catch (error) {
            console.error(
                "Erreur déconnexion :",
                error
            );

            showToast(
                "Impossible de vous déconnecter.",
                "error"
            );
        }
    }

    /* =========================================================
       NOTIFICATIONS
       ========================================================= */

    async function loadNotifications() {
        const client =
            getSupabaseClient();

        state.loading = true;

        if (!client || !state.user) {
            state.notifications = [];
            state.loading = false;
            renderNotifications();
            return;
        }

        try {
            const {
                data,
                error
            } = await client
                .from("notifications")
                .select(`
                    id,
                    user_id,
                    type,
                    title,
                    message,
                    is_read,
                    created_at
                `)
                .eq("user_id", state.user.id)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(100);

            if (error) {
                throw error;
            }

            state.notifications =
                Array.isArray(data)
                    ? data
                    : [];

        } catch (error) {
            console.error(
                "Erreur chargement notifications :",
                error
            );

            state.notifications = [];

            showToast(
                "Impossible de charger les notifications.",
                "error"
            );

        } finally {
            state.loading = false;

            updateNotificationCounters();
            applyNotificationFilter();
            renderNotifications();
        }
    }

    function getUnreadCount() {
        return state.notifications.filter(
            notification =>
                !notification.is_read
        ).length;
    }

    function updateNotificationCounters() {
        const unreadCount =
            getUnreadCount();

        const allCount =
            state.notifications.length;

        const headerCount =
            $("#headerNotificationCount");

        const sidebarCount =
            $("#sidebarNotificationCount");

        const legacyHeaderCount =
            $("#header-notification-count");

        const legacySidebarCount =
            $("#sidebar-notification-count");

        const allCountElement =
            $("#all-count");

        const unreadCountElement =
            $("#unread-count");

        const markAllButton =
            $("#mark-all-read-button");

        updateBadge(
            headerCount,
            unreadCount
        );

        updateBadge(
            sidebarCount,
            unreadCount
        );

        updateBadge(
            legacyHeaderCount,
            unreadCount
        );

        updateBadge(
            legacySidebarCount,
            unreadCount
        );

        updateBadge(
            allCountElement,
            allCount
        );

        updateBadge(
            unreadCountElement,
            unreadCount
        );

        if (markAllButton) {
            markAllButton.disabled =
                unreadCount === 0;
        }
    }

    function updateBadge(element, count) {
        if (!element) {
            return;
        }

        if (count > 0) {
            element.hidden = false;
            element.textContent =
                count > 99
                    ? "99+"
                    : String(count);
        } else {
            element.hidden = true;
            element.textContent = "0";
        }
    }

    /* =========================================================
       TYPE NOTIFICATION
       ========================================================= */

    function getNotificationIcon(type) {
        const normalized =
            String(type || "")
                .toLowerCase();

        if (
            normalized.includes("message") ||
            normalized.includes("chat")
        ) {
            return {
                icon: "fa-message",
                className: "message"
            };
        }

        if (
            normalized.includes("comment")
        ) {
            return {
                icon: "fa-comment",
                className: "comment"
            };
        }

        if (
            normalized.includes("like") ||
            normalized.includes("reaction")
        ) {
            return {
                icon: "fa-heart",
                className: "like"
            };
        }

        if (
            normalized.includes("subscribe") ||
            normalized.includes("subscription")
        ) {
            return {
                icon: "fa-user-plus",
                className: "subscription"
            };
        }

        if (
            normalized.includes("live")
        ) {
            return {
                icon: "fa-tower-broadcast",
                className: "live"
            };
        }

        if (
            normalized.includes("product") ||
            normalized.includes("sale") ||
            normalized.includes("order")
        ) {
            return {
                icon: "fa-store",
                className: "shop"
            };
        }

        if (
            normalized.includes("mention")
        ) {
            return {
                icon: "fa-at",
                className: "mention"
            };
        }

        if (
            normalized.includes("security") ||
            normalized.includes("warning")
        ) {
            return {
                icon: "fa-shield-halved",
                className: "security"
            };
        }

        if (
            normalized.includes("success") ||
            normalized.includes("approved")
        ) {
            return {
                icon: "fa-circle-check",
                className: "success"
            };
        }

        return {
            icon: "fa-bell",
            className: "default"
        };
    }

    function getNotificationCategory(notification) {
        const type =
            String(notification.type || "")
                .toLowerCase();

        if (
            type.includes("mention")
        ) {
            return "mentions";
        }

        if (
            type.includes("netview") ||
            type.includes("system") ||
            type.includes("security") ||
            type.includes("announcement")
        ) {
            return "netview";
        }

        return "activity";
    }

    /* =========================================================
       FILTRES
       ========================================================= */

    function bindNotificationFilters() {
        const filters =
            $$(".notification-filter");

        filters.forEach(button => {
            button.addEventListener(
                "click",
                () => {

                    const filter =
                        button.dataset.filter ||
                        "all";

                    state.activeFilter =
                        filter;

                    filters.forEach(
                        item => {

                            const active =
                                item === button;

                            item.classList.toggle(
                                "active",
                                active
                            );

                            item.setAttribute(
                                "aria-selected",
                                String(active)
                            );
                        }
                    );

                    applyNotificationFilter();
                    renderNotifications();
                }
            );
        });
    }

    function applyNotificationFilter() {
        let result =
            [...state.notifications];

        switch (state.activeFilter) {

            case "unread":
                result =
                    result.filter(
                        notification =>
                            !notification.is_read
                    );
                break;

            case "mentions":
                result =
                    result.filter(
                        notification =>
                            getNotificationCategory(
                                notification
                            ) === "mentions"
                    );
                break;

            case "activity":
                result =
                    result.filter(
                        notification =>
                            getNotificationCategory(
                                notification
                            ) === "activity"
                    );
                break;

            case "netview":
                result =
                    result.filter(
                        notification =>
                            getNotificationCategory(
                                notification
                            ) === "netview"
                    );
                break;

            case "all":
            default:
                break;
        }

        const query =
            state.searchQuery
                .trim()
                .toLowerCase();

        if (query) {
            result =
                result.filter(
                    notification => {

                        const title =
                            String(
                                notification.title || ""
                            ).toLowerCase();

                        const message =
                            String(
                                notification.message || ""
                            ).toLowerCase();

                        const type =
                            String(
                                notification.type || ""
                            ).toLowerCase();

                        return (
                            title.includes(query) ||
                            message.includes(query) ||
                            type.includes(query)
                        );
                    }
                );
        }

        state.filteredNotifications =
            result;
    }

    /* =========================================================
       RENDU
       ========================================================= */

    function renderNotifications() {
        const list =
            $("#notifications-list");

        if (!list) {
            return;
        }

        const loading =
            $("#notifications-loading");

        if (loading) {
            loading.remove();
        }

        if (state.loading) {
            renderLoading(list);
            return;
        }

        if (
            state.filteredNotifications.length === 0
        ) {
            list.innerHTML =
                createEmptyState();

            return;
        }

        list.innerHTML =
            state.filteredNotifications
                .map(
                    createNotificationHTML
                )
                .join("");

        bindNotificationItems();
    }

    function renderLoading(list) {
        list.innerHTML = `
            <div class="notifications-loading">

                ${Array.from(
                    { length: 5 },
                    () => `
                        <article
                            class="notification-skeleton">

                            <div
                                class="skeleton skeleton-avatar">
                            </div>

                            <div
                                class="skeleton-content">

                                <div
                                    class="skeleton skeleton-line skeleton-line-large">
                                </div>

                                <div
                                    class="skeleton skeleton-line skeleton-line-medium">
                                </div>

                                <div
                                    class="skeleton skeleton-line skeleton-line-small">
                                </div>

                            </div>

                            <div
                                class="skeleton skeleton-thumbnail">
                            </div>

                        </article>
                    `
                ).join("")}

            </div>
        `;
    }

    function createNotificationHTML(notification) {
        const type =
            getNotificationIcon(
                notification.type
            );

        const unread =
            !notification.is_read;

        return `
            <article
                class="
                    notification-item
                    ${unread ? "unread" : ""}
                    notification-type-${escapeHTML(type.className)}
                "
                data-notification-id="${escapeHTML(notification.id)}"
                data-read="${notification.is_read ? "true" : "false"}"
                tabindex="0"
                role="article">

                <div
                    class="notification-icon ${escapeHTML(type.className)}">

                    <i
                        class="fa-solid ${escapeHTML(type.icon)}"
                        aria-hidden="true">
                    </i>

                </div>

                <div class="notification-content">

                    <div class="notification-title-row">

                        <h2 class="notification-title">
                            ${escapeHTML(
                                notification.title ||
                                "Notification NetView"
                            )}
                        </h2>

                        ${
                            unread
                                ? `
                                    <span
                                        class="notification-unread-dot"
                                        aria-label="Non lue">
                                    </span>
                                `
                                : ""
                        }

                    </div>

                    <p class="notification-message">
                        ${escapeHTML(
                            notification.message || ""
                        )}
                    </p>

                    <time
                        class="notification-time"
                        datetime="${escapeHTML(
                            notification.created_at || ""
                        )}">

                        ${escapeHTML(
                            formatDate(
                                notification.created_at
                            )
                        )}

                    </time>

                </div>

                <div class="notification-actions">

                    ${
                        unread
                            ? `
                                <button
                                    type="button"
                                    class="notification-action mark-read"
                                    data-action="read"
                                    aria-label="Marquer comme lu"
                                    title="Marquer comme lu">

                                    <i class="fa-solid fa-check"></i>

                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="notification-action mark-unread"
                                    data-action="unread"
                                    aria-label="Marquer comme non lu"
                                    title="Marquer comme non lu">

                                    <i class="fa-regular fa-envelope"></i>

                                </button>
                            `
                    }

                    <button
                        type="button"
                        class="notification-action delete-notification"
                        data-action="delete"
                        aria-label="Supprimer"
                        title="Supprimer">

                        <i class="fa-solid fa-xmark"></i>

                    </button>

                </div>

            </article>
        `;
    }

    function createEmptyState() {
        let icon =
            "fa-bell-slash";

        let title =
            "Aucune notification";

        let message =
            "Vous n'avez aucune notification pour le moment.";

        if (state.activeFilter === "unread") {
            icon = "fa-envelope-open";
            title = "Tout est lu";
            message =
                "Vous n'avez aucune notification non lue.";
        }

        if (state.activeFilter === "mentions") {
            icon = "fa-at";
            title = "Aucune mention";
            message =
                "Vous n'avez reçu aucune mention.";
        }

        if (state.activeFilter === "activity") {
            icon = "fa-bolt";
            title = "Aucune activité";
            message =
                "Aucune nouvelle activité à afficher.";
        }

        if (state.activeFilter === "netview") {
            icon = "fa-circle-info";
            title = "Aucune notification NetView";
            message =
                "Vous n'avez aucune notification de NetView.";
        }

        if (state.searchQuery) {
            icon = "fa-magnifying-glass";
            title = "Aucun résultat";
            message =
                "Aucune notification ne correspond à votre recherche.";
        }

        return `
            <div class="notifications-empty">

                <div class="notifications-empty-icon">
                    <i
                        class="fa-solid ${icon}"
                        aria-hidden="true">
                    </i>
                </div>

                <h2>
                    ${escapeHTML(title)}
                </h2>

                <p>
                    ${escapeHTML(message)}
                </p>

            </div>
        `;
    }

    /* =========================================================
       ACTIONS NOTIFICATIONS
       ========================================================= */

    function bindNotificationItems() {
        const items =
            $$(".notification-item");

        items.forEach(item => {

            item.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".notification-action"
                        )
                    ) {
                        return;
                    }

                    const id =
                        item.dataset.notificationId;

                    if (id) {
                        markNotificationAsRead(
                            id
                        );
                    }
                }
            );

            item.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key !== "Enter" &&
                        event.key !== " "
                    ) {
                        return;
                    }

                    if (
                        event.target.closest(
                            ".notification-action"
                        )
                    ) {
                        return;
                    }

                    event.preventDefault();

                    const id =
                        item.dataset.notificationId;

                    if (id) {
                        markNotificationAsRead(
                            id
                        );
                    }
                }
            );
        });

        $$(".notification-action")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        const item =
                            button.closest(
                                ".notification-item"
                            );

                        if (!item) {
                            return;
                        }

                        const id =
                            item.dataset.notificationId;

                        const action =
                            button.dataset.action;

                        if (!id) {
                            return;
                        }

                        if (action === "read") {
                            markNotificationAsRead(
                                id
                            );
                        }

                        if (action === "unread") {
                            markNotificationAsUnread(
                                id
                            );
                        }

                        if (action === "delete") {
                            deleteNotification(
                                id
                            );
                        }
                    }
                );
            });
    }

    async function markNotificationAsRead(id) {
        const notification =
            state.notifications.find(
                item => item.id === id
            );

        if (!notification) {
            return;
        }

        if (notification.is_read) {
            return;
        }

        notification.is_read = true;

        updateNotificationCounters();

        applyNotificationFilter();
        renderNotifications();

        const client =
            getSupabaseClient();

        if (!client || !state.user) {
            return;
        }

        try {
            const {
                error
            } = await client
                .from("notifications")
                .update({
                    is_read: true
                })
                .eq("id", id)
                .eq("user_id", state.user.id);

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error(
                "Erreur marquage notification :",
                error
            );

            notification.is_read = false;

            updateNotificationCounters();

            applyNotificationFilter();
            renderNotifications();
        }
    }

    async function markNotificationAsUnread(id) {
        const notification =
            state.notifications.find(
                item => item.id === id
            );

        if (!notification) {
            return;
        }

        notification.is_read = false;

        updateNotificationCounters();

        applyNotificationFilter();
        renderNotifications();

        const client =
            getSupabaseClient();

        if (!client || !state.user) {
            return;
        }

        try {
            const {
                error
            } = await client
                .from("notifications")
                .update({
                    is_read: false
                })
                .eq("id", id)
                .eq("user_id", state.user.id);

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error(
                "Erreur notification non lue :",
                error
            );

            notification.is_read = true;

            updateNotificationCounters();

            applyNotificationFilter();
            renderNotifications();
        }
    }

    async function deleteNotification(id) {
        const index =
            state.notifications.findIndex(
                item => item.id === id
            );

        if (index === -1) {
            return;
        }

        const removed =
            state.notifications[index];

        state.notifications.splice(
            index,
            1
        );

        updateNotificationCounters();

        applyNotificationFilter();
        renderNotifications();

        const client =
            getSupabaseClient();

        if (!client || !state.user) {
            return;
        }

        try {
            const {
                error
            } = await client
                .from("notifications")
                .delete()
                .eq("id", id)
                .eq("user_id", state.user.id);

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error(
                "Erreur suppression notification :",
                error
            );

            state.notifications.splice(
                index,
                0,
                removed
            );

            updateNotificationCounters();

            applyNotificationFilter();
            renderNotifications();

            showToast(
                "Impossible de supprimer la notification.",
                "error"
            );
        }
    }

    async function markAllAsRead() {
        const unread =
            state.notifications.filter(
                notification =>
                    !notification.is_read
            );

        if (unread.length === 0) {
            return;
        }

        state.notifications.forEach(
            notification => {
                notification.is_read = true;
            }
        );

        updateNotificationCounters();

        applyNotificationFilter();
        renderNotifications();

        const client =
            getSupabaseClient();

        if (!client || !state.user) {
            return;
        }

        try {
            const {
                error
            } = await client
                .from("notifications")
                .update({
                    is_read: true
                })
                .eq("user_id", state.user.id)
                .eq("is_read", false);

            if (error) {
                throw error;
            }

            showToast(
                "Toutes les notifications sont maintenant lues.",
                "success"
            );

        } catch (error) {
            console.error(
                "Erreur marquage global :",
                error
            );

            await loadNotifications();

            showToast(
                "Impossible de marquer toutes les notifications.",
                "error"
            );
        }
    }

    /* =========================================================
       RECHERCHE DANS LES NOTIFICATIONS
       ========================================================= */

    function createNotificationSearch() {
        const toolbar =
            $(".notifications-toolbar");

        if (!toolbar) {
            return;
        }

        if (
            $("#notification-local-search")
        ) {
            return;
        }

        const searchWrapper =
            document.createElement("div");

        searchWrapper.id =
            "notification-local-search";

        searchWrapper.className =
            "notification-local-search";

        searchWrapper.innerHTML = `
            <i
                class="fa-solid fa-magnifying-glass"
                aria-hidden="true">
            </i>

            <input
                id="notificationSearchInput"
                type="search"
                placeholder="Rechercher dans les notifications"
                autocomplete="off"
                aria-label="Rechercher dans les notifications">

            <button
                type="button"
                id="notificationSearchClear"
                aria-label="Effacer"
                hidden>

                <i class="fa-solid fa-xmark"></i>

            </button>
        `;

        const settingsLink =
            $(".notification-settings-link");

        if (settingsLink) {
            toolbar.insertBefore(
                searchWrapper,
                settingsLink
            );
        } else {
            toolbar.appendChild(
                searchWrapper
            );
        }

        const input =
            $("#notificationSearchInput");

        const clear =
            $("#notificationSearchClear");

        input?.addEventListener(
            "input",
            () => {

                state.searchQuery =
                    input.value || "";

                clear.hidden =
                    !state.searchQuery;

                applyNotificationFilter();
                renderNotifications();
            }
        );

        clear?.addEventListener(
            "click",
            () => {

                input.value = "";
                state.searchQuery = "";
                clear.hidden = true;

                applyNotificationFilter();
                renderNotifications();

                input.focus();
            }
        );
    }

    /* =========================================================
       TEMPS RÉEL SUPABASE
       ========================================================= */

    function subscribeToNotifications() {
        const client =
            getSupabaseClient();

        if (!client || !state.user) {
            return;
        }

        try {
            state.notificationChannel =
                client
                    .channel(
                        `notifications-${state.user.id}`
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

                            if (!payload?.new) {
                                return;
                            }

                            const exists =
                                state.notifications.some(
                                    notification =>
                                        notification.id ===
                                        payload.new.id
                                );

                            if (exists) {
                                return;
                            }

                            state.notifications.unshift(
                                payload.new
                            );

                            updateNotificationCounters();

                            applyNotificationFilter();
                            renderNotifications();

                            showToast(
                                payload.new.title ||
                                "Nouvelle notification",
                                "info"
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

                            if (!payload?.new) {
                                return;
                            }

                            const index =
                                state.notifications.findIndex(
                                    notification =>
                                        notification.id ===
                                        payload.new.id
                                );

                            if (index === -1) {
                                return;
                            }

                            state.notifications[index] =
                                payload.new;

                            updateNotificationCounters();

                            applyNotificationFilter();
                            renderNotifications();
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

                            const id =
                                payload?.old?.id;

                            if (!id) {
                                return;
                            }

                            state.notifications =
                                state.notifications.filter(
                                    notification =>
                                        notification.id !==
                                        id
                                );

                            updateNotificationCounters();

                            applyNotificationFilter();
                            renderNotifications();
                        }
                    )
                    .subscribe();

        } catch (error) {
            console.error(
                "Erreur Realtime notifications :",
                error
            );
        }
    }

    /* =========================================================
       BOUTON TOUT MARQUER COMME LU
       ========================================================= */

    function bindMarkAllButton() {
        const button =
            $("#mark-all-read-button");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            markAllAsRead
        );
    }

    /* =========================================================
       CLIC EXTÉRIEUR
       ========================================================= */

    function bindGlobalEvents() {
        document.addEventListener(
            "click",
            event => {

                const profileButton =
                    $("#headerProfileButton");

                const profileMenu =
                    $("#netview-profile-menu");

                if (
                    profileMenu &&
                    profileButton &&
                    !profileMenu.contains(event.target) &&
                    !profileButton.contains(event.target)
                ) {
                    closeProfileMenu();
                }
            }
        );

        document.addEventListener(
            "keydown",
            event => {

                if (event.key === "Escape") {
                    closeProfileMenu();
                    closeSidebar();
                    closeMobileSearch();
                }
            }
        );

        window.addEventListener(
            "resize",
            () => {

                if (window.innerWidth > 900) {
                    closeSidebar();
                }
            }
        );
    }

    /* =========================================================
       AUTHENTIFICATION
       ========================================================= */

    function redirectToAuth() {
        const currentUrl =
            `${window.location.pathname}${window.location.search}${window.location.hash}`;

        window.location.href =
            `auth.html?redirect=${encodeURIComponent(currentUrl)}`;
    }

    /* =========================================================
       INITIALISATION
       ========================================================= */

    async function init() {
        try {
            state.user =
                await getCurrentUser();

            if (!state.user) {
                redirectToAuth();
                return;
            }

            await loadProfile();

            createHeader();
            createSidebar();

            bindSearch();
            bindNotificationFilters();
            bindMarkAllButton();
            createNotificationSearch();
            bindGlobalEvents();

            await loadNotifications();

            subscribeToNotifications();

        } catch (error) {
            console.error(
                "Erreur initialisation notification.js :",
                error
            );
        }
    }

    /* =========================================================
       VISIBILITÉ DE LA PAGE
       ========================================================= */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "visible" &&
                state.user
            ) {
                loadNotifications();
            }
        }
    );

    /* =========================================================
       EXPOSITION API
       ========================================================= */

    window.NetViewNotifications = {
        reload: loadNotifications,

        markAllAsRead,

        markAsRead:
            markNotificationAsRead,

        markAsUnread:
            markNotificationAsUnread,

        delete:
            deleteNotification,

        getUnreadCount
    };

    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );
    } else {
        init();
    }

})();
