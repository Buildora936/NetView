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

                    filters.forEach(btn =>
                        btn.classList.remove("active")
                    );
                    button.classList.add("active");

                    applyNotificationFilter();
                    renderNotifications();
                }
            );
        });
    }

    function applyNotificationFilter() {
        let list = [...state.notifications];

        if (state.activeFilter === "unread") {
            list = list.filter(n => !n.is_read);
        } else if (state.activeFilter === "mentions") {
            list = list.filter(n => getNotificationCategory(n) === "mentions");
        } else if (state.activeFilter === "netview") {
            list = list.filter(n => getNotificationCategory(n) === "netview");
        }

        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            list = list.filter(n => {
                const title = String(n.title || "").toLowerCase();
                const msg = String(n.message || "").toLowerCase();
                return title.includes(query) || msg.includes(query);
            });
        }

        state.filteredNotifications = list;
    }

    /* =========================================================
       ACTIONS NOTIFICATIONS
       ========================================================= */

    async function markAsRead(notificationId) {
        const client = getSupabaseClient();
        if (!client || !state.user) return;

        try {
            const { error } = await client
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId)
                .eq("user_id", state.user.id);

            if (error) throw error;

            const notif = state.notifications.find(n => n.id === notificationId);
            if (notif) {
                notif.is_read = true;
            }

            updateNotificationCounters();
            applyNotificationFilter();
            renderNotifications();
        } catch (error) {
            console.error("Erreur marquage notification :", error);
            showToast("Impossible de modifier la notification.", "error");
        }
    }

    async function markAllAsRead() {
        const client = getSupabaseClient();
        if (!client || !state.user) return;

        try {
            const { error } = await client
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", state.user.id)
                .eq("is_read", false);

            if (error) throw error;

            state.notifications.forEach(n => {
                n.is_read = true;
            });

            updateNotificationCounters();
            applyNotificationFilter();
            renderNotifications();
            showToast("Toutes les notifications ont été lues.", "success");
        } catch (error) {
            console.error("Erreur marquage global :", error);
            showToast("Impossible de tout marquer comme lu.", "error");
        }
    }

    async function deleteNotification(notificationId) {
        const client = getSupabaseClient();
        if (!client || !state.user) return;

        try {
            const { error } = await client
                .from("notifications")
                .delete()
                .eq("id", notificationId)
                .eq("user_id", state.user.id);

            if (error) throw error;

            state.notifications = state.notifications.filter(n => n.id !== notificationId);

            updateNotificationCounters();
            applyNotificationFilter();
            renderNotifications();
            showToast("Notification supprimée.", "info");
        } catch (error) {
            console.error("Erreur suppression notification :", error);
            showToast("Impossible de supprimer la notification.", "error");
        }
    }

    /* =========================================================
       AFFICHAGE
       ========================================================= */

    function renderNotifications() {
        const container = $("#notifications-container");
        if (!container) return;

        if (state.loading) {
            container.innerHTML = `
                <div class="nv-loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Chargement des notifications...</p>
                </div>
            `;
            return;
        }

        if (state.filteredNotifications.length === 0) {
            container.innerHTML = `
                <div class="nv-empty-state">
                    <i class="fa-regular fa-bell-slash"></i>
                    <h3>Aucune notification</h3>
                    <p>Vous n'avez aucune notification pour le moment.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = state.filteredNotifications.map(n => {
            const { icon, className } = getNotificationIcon(n.type);
            const timeAgo = formatDate(n.created_at);

            return `
                <div class="notification-item ${n.is_read ? "" : "unread"}" data-id="${escapeHTML(n.id)}">
                    <div class="notification-icon ${className}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-header-row">
                            <h4 class="notification-title">${escapeHTML(n.title || "Notification")}</h4>
                            <span class="notification-time">${escapeHTML(timeAgo)}</span>
                        </div>
                        <p class="notification-message">${escapeHTML(n.message || "")}</p>
                    </div>
                    <div class="notification-actions">
                        ${!n.is_read ? `
                            <button type="button" class="nv-icon-button mark-read-btn" title="Marquer comme lu" data-id="${escapeHTML(n.id)}">
                                <i class="fa-solid fa-check"></i>
                            </button>
                        ` : ""}
                        <button type="button" class="nv-icon-button delete-notif-btn" title="Supprimer" data-id="${escapeHTML(n.id)}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        // Bind item actions
        $$(".mark-read-btn", container).forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                markAsRead(id);
            });
        });

        $$(".delete-notif-btn", container).forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                deleteNotification(id);
            });
        });

        $$(".notification-item", container).forEach(item => {
            item.addEventListener("click", () => {
                const id = item.dataset.id;
                const notif = state.notifications.find(n => n.id === id);
                if (notif && !notif.is_read) {
                    markAsRead(id);
                }
            });
        });
    }

    /* =========================================================
       INITIALISATION
       ========================================================= */

    async function init() {
        const client = getSupabaseClient();
        if (!client) {
            console.error("NetView : Supabase client manquant.");
            state.loading = false;
            renderNotifications();
            return;
        }

        state.user = await getCurrentUser();
        if (state.user) {
            await loadProfile();
        }

        createHeader();
        createSidebar();
        bindSearch();
        bindNotificationFilters();

        const markAllButton = $("#mark-all-read-button");
        if (markAllButton) {
            markAllButton.addEventListener("click", markAllAsRead);
        }

        const searchInput = $("#notification-search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                state.searchQuery = e.target.value;
                applyNotificationFilter();
                renderNotifications();
            });
        }

        await loadNotifications();

        // Realtime subscription if available
        if (client && state.user) {
            client
                .channel("public:notifications")
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${state.user.id}`
                    },
                    (payload) => {
                        if (payload.new) {
                            state.notifications.unshift(payload.new);
                            updateNotificationCounters();
                            applyNotificationFilter();
                            renderNotifications();
                            showToast("Nouvelle notification reçue !", "info");
                        }
                    }
                )
                .subscribe();
        }
    }

    document.addEventListener("DOMContentLoaded", init);

})();
