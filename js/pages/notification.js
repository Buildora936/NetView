/* =========================================================
   NetView — notification.js
   Page : notification.html
   ========================================================= */

import { 
    $, 
    $$, 
    escapeHTML, 
    formatDate, 
    showToast 
} from "./utils.js";

import { 
    getSupabaseClient, 
    getCurrentUser, 
    loadProfile, 
    state 
} from "./auth.js";

import { 
    renderHeader, 
    renderSidebar 
} from "./navigation.js";

(() => {
    "use strict";

    /* =========================================================
       ÉTAT LOCAL DE LA PAGE
       ========================================================= */

    const notificationState = {
        notifications: [],
        filteredNotifications: [],
        activeFilter: "all",
        searchQuery: "",
        loading: true
    };

    /* =========================================================
       CHARGEMENT DES NOTIFICATIONS
       ========================================================= */

    async function loadNotifications() {
        const client = getSupabaseClient();
        notificationState.loading = true;
        renderNotifications();

        if (!client || !state.user) {
            notificationState.notifications = [];
            notificationState.loading = false;
            renderNotifications();
            return;
        }

        try {
            const { data, error } = await client
                .from("notifications")
                .select("id, user_id, type, title, message, is_read, created_at")
                .eq("user_id", state.user.id)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;
            notificationState.notifications = Array.isArray(data) ? data : [];
        } catch (err) {
            console.error("Erreur chargement notifications :", err);
            notificationState.notifications = [];
            showToast("Impossible de charger les notifications.", "error");
        } finally {
            notificationState.loading = false;
            updateCounters();
            applyFilter();
            renderNotifications();
        }
    }

    /* =========================================================
       GESTION DES COMPTEURS & BADGES
       ========================================================= */

    function getUnreadCount() {
        return notificationState.notifications.filter(n => !n.is_read).length;
    }

    function updateCounters() {
        const unread = getUnreadCount();
        const total = notificationState.notifications.length;

        const counters = [
            $("#headerNotificationCount"),
            $("#sidebarNotificationCount"),
            $("#unread-count")
        ];

        counters.forEach(el => {
            if (el) {
                el.hidden = unread === 0;
                el.textContent = unread > 99 ? "99+" : String(unread);
            }
        });

        const allCountEl = $("#all-count");
        if (allCountEl) {
            allCountEl.hidden = total === 0;
            allCountEl.textContent = String(total);
        }

        const markAllBtn = $("#mark-all-read-button");
        if (markAllBtn) {
            markAllBtn.disabled = unread === 0;
        }
    }

    /* =========================================================
       ICÔNES ET CATÉGORIES
       ========================================================= */

    function getNotificationIcon(type) {
        const t = String(type || "").toLowerCase();
        if (t.includes("message") || t.includes("chat")) return { icon: "fa-message", className: "message" };
        if (t.includes("comment")) return { icon: "fa-comment", className: "comment" };
        if (t.includes("like") || t.includes("reaction")) return { icon: "fa-heart", className: "like" };
        if (t.includes("subscribe")) return { icon: "fa-user-plus", className: "subscription" };
        if (t.includes("live")) return { icon: "fa-tower-broadcast", className: "live" };
        if (t.includes("product") || t.includes("sale") || t.includes("order")) return { icon: "fa-store", className: "shop" };
        if (t.includes("mention")) return { icon: "fa-at", className: "mention" };
        if (t.includes("security")) return { icon: "fa-shield-halved", className: "security" };
        return { icon: "fa-bell", className: "default" };
    }

    /* =========================================================
       FILTRES ET RECHERCHE
       ========================================================= */

    function bindFilters() {
        $$(".notification-filter").forEach(btn => {
            btn.addEventListener("click", () => {
                $$(".notification-filter").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                notificationState.activeFilter = btn.dataset.filter || "all";
                applyFilter();
                renderNotifications();
            });
        });

        const searchInput = $("#notification-search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                notificationState.searchQuery = e.target.value.trim().toLowerCase();
                applyFilter();
                renderNotifications();
            });
        }
    }

    function applyFilter() {
        let list = [...notificationState.notifications];

        if (notificationState.activeFilter === "unread") {
            list = list.filter(n => !n.is_read);
        } else if (notificationState.activeFilter === "mentions") {
            list = list.filter(n => String(n.type).toLowerCase().includes("mention"));
        } else if (notificationState.activeFilter === "netview") {
            list = list.filter(n => {
                const t = String(n.type).toLowerCase();
                return t.includes("netview") || t.includes("system") || t.includes("security");
            });
        }

        if (notificationState.searchQuery) {
            list = list.filter(n => {
                const title = String(n.title || "").toLowerCase();
                const msg = String(n.message || "").toLowerCase();
                return title.includes(notificationState.searchQuery) || msg.includes(notificationState.searchQuery);
            });
        }

        notificationState.filteredNotifications = list;
    }

    /* =========================================================
       ACTIONS (LECTURE / SUPPRESSION)
       ========================================================= */

    async function markAsRead(id) {
        const client = getSupabaseClient();
        if (!client || !state.user) return;

        try {
            const { error } = await client
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id)
                .eq("user_id", state.user.id);

            if (error) throw error;
            const item = notificationState.notifications.find(n => n.id === id);
            if (item) item.is_read = true;

            updateCounters();
            applyFilter();
            renderNotifications();
        } catch (err) {
            console.error("Erreur action :", err);
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
            notificationState.notifications.forEach(n => n.is_read = true);

            updateCounters();
            applyFilter();
            renderNotifications();
            showToast("Toutes les notifications ont été lues.", "success");
        } catch (err) {
            console.error("Erreur globale :", err);
            showToast("Impossible d'effectuer cette action.", "error");
        }
    }

    async function deleteNotification(id) {
        const client = getSupabaseClient();
        if (!client || !state.user) return;

        try {
            const { error } = await client
                .from("notifications")
                .delete()
                .eq("id", id)
                .eq("user_id", state.user.id);

            if (error) throw error;
            notificationState.notifications = notificationState.notifications.filter(n => n.id !== id);

            updateCounters();
            applyFilter();
            renderNotifications();
            showToast("Notification supprimée.", "info");
        } catch (err) {
            console.error("Erreur suppression :", err);
            showToast("Impossible de supprimer.", "error");
        }
    }

    /* =========================================================
       RENDU HTML DE LA PAGE
       ========================================================= */

    function renderNotifications() {
        const container = $("#notifications-container");
        if (!container) return;

        if (notificationState.loading) {
            container.innerHTML = `
                <div class="nv-loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Chargement des notifications...</p>
                </div>
            `;
            return;
        }

        if (notificationState.filteredNotifications.length === 0) {
            container.innerHTML = `
                <div class="nv-empty-state">
                    <i class="fa-regular fa-bell-slash"></i>
                    <h3>Aucune notification</h3>
                    <p>Vous n'avez aucune notification pour le moment.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notificationState.filteredNotifications.map(n => {
            const { icon, className } = getNotificationIcon(n.type);
            return `
                <div class="notification-item ${n.is_read ? "" : "unread"}" data-id="${escapeHTML(n.id)}">
                    <div class="notification-icon ${className}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-header-row">
                            <h4 class="notification-title">${escapeHTML(n.title || "Notification")}</h4>
                            <span class="notification-time">${escapeHTML(formatDate(n.created_at))}</span>
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

        // Écouteurs d'événements dynamiques
        $$(".mark-read-btn", container).forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                markAsRead(btn.dataset.id);
            });
        });

        $$(".delete-notif-btn", container).forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteNotification(btn.dataset.id);
            });
        });

        $$(".notification-item", container).forEach(item => {
            item.addEventListener("click", () => {
                const id = item.dataset.id;
                const notif = notificationState.notifications.find(n => n.id === id);
                if (notif && !notif.is_read) markAsRead(id);
            });
        });
    }

    /* =========================================================
       INITIALISATION GLOBALE
       ========================================================= */

    async function init() {
        const client = getSupabaseClient();
        if (!client) {
            notificationState.loading = false;
            renderNotifications();
            return;
        }

        state.user = await getCurrentUser();
        if (state.user) {
            await loadProfile();
        }

        // Initialisation de l'interface commune
        renderHeader();
        renderSidebar();
        bindFilters();

        const markAllBtn = $("#mark-all-read-button");
        if (markAllBtn) {
            markAllBtn.addEventListener("click", markAllAsRead);
        }

        await loadNotifications();

        // Écoute Realtime Supabase (si l'utilisateur est connecté)
        if (client && state.user) {
            client.channel("public:notifications")
                .on("postgres_changes", {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${state.user.id}`
                }, payload => {
                    if (payload.new) {
                        notificationState.notifications.unshift(payload.new);
                        updateCounters();
                        applyFilter();
                        renderNotifications();
                        showToast("Nouvelle notification reçue !", "info");
                    }
                })
                .subscribe();
        }
    }

    document.addEventListener("DOMContentLoaded", init);

})();
