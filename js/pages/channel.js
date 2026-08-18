// ==========================================
// NetView
// channel.js
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
    getChannelByHandle,
    getVideos,
    getShorts,
    getLives,
    getMyChannels,
    subscribeToChannel
} from "../core/data.js";

import {
    showLoader,
    hideLoader,
    buttonLoading
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";


// ==========================================
// Configuration
// ==========================================

const NETVIEW_DOMAIN =
    "https://net-view-five.vercel.app";


// ==========================================
// DOM - Header
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

const headerRight =
    document.getElementById(
        "headerRight"
    );


// ==========================================
// DOM - Sidebar
// ==========================================

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
// DOM - Main
// ==========================================

const channelLoading =
    document.getElementById(
        "channelLoading"
    );

const channelError =
    document.getElementById(
        "channelError"
    );

const channelErrorMessage =
    document.getElementById(
        "channelErrorMessage"
    );

const channelContent =
    document.getElementById(
        "channelContent"
    );


// ==========================================
// DOM - Channel identity
// ==========================================

const channelBanner =
    document.getElementById(
        "channelBanner"
    );

const channelBannerPlaceholder =
    document.getElementById(
        "channelBannerPlaceholder"
    );

const channelAvatar =
    document.getElementById(
        "channelAvatar"
    );

const channelName =
    document.getElementById(
        "channelName"
    );

const channelHandle =
    document.getElementById(
        "channelHandle"
    );

const channelVerified =
    document.getElementById(
        "channelVerified"
    );

const channelSubscribers =
    document.getElementById(
        "channelSubscribers"
    );

const channelVideos =
    document.getElementById(
        "channelVideos"
    );

const channelViews =
    document.getElementById(
        "channelViews"
    );


// ==========================================
// DOM - Actions
// ==========================================

const subscribeChannelButton =
    document.getElementById(
        "subscribeChannelButton"
    );

const shareChannelButton =
    document.getElementById(
        "shareChannelButton"
    );

const editChannelButton =
    document.getElementById(
        "editChannelButton"
    );


// ==========================================
// DOM - Sections
// ==========================================

const channelHomeSection =
    document.getElementById(
        "channelHomeSection"
    );

const channelVideosSection =
    document.getElementById(
        "channelVideosSection"
    );

const channelShortsSection =
    document.getElementById(
        "channelShortsSection"
    );

const channelLivesSection =
    document.getElementById(
        "channelLivesSection"
    );

const channelAboutSection =
    document.getElementById(
        "channelAboutSection"
    );


// ==========================================
// DOM - Grids
// ==========================================

const channelHomeGrid =
    document.getElementById(
        "channelHomeGrid"
    );

const channelVideosGrid =
    document.getElementById(
        "channelVideosGrid"
    );

const channelShortsGrid =
    document.getElementById(
        "channelShortsGrid"
    );

const channelLivesGrid =
    document.getElementById(
        "channelLivesGrid"
    );


// ==========================================
// DOM - Empty states
// ==========================================

const channelHomeEmpty =
    document.getElementById(
        "channelHomeEmpty"
    );

const channelVideosEmpty =
    document.getElementById(
        "channelVideosEmpty"
    );

const channelShortsEmpty =
    document.getElementById(
        "channelShortsEmpty"
    );

const channelLivesEmpty =
    document.getElementById(
        "channelLivesEmpty"
    );


// ==========================================
// DOM - About
// ==========================================

const channelDescription =
    document.getElementById(
        "channelDescription"
    );

const aboutSubscribers =
    document.getElementById(
        "aboutSubscribers"
    );

const aboutVideos =
    document.getElementById(
        "aboutVideos"
    );

const aboutViews =
    document.getElementById(
        "aboutViews"
    );

const aboutCreatedAt =
    document.getElementById(
        "aboutCreatedAt"
    );

const channelPublicUrl =
    document.getElementById(
        "channelPublicUrl"
    );

const copyChannelUrlButton =
    document.getElementById(
        "copyChannelUrlButton"
    );


// ==========================================
// DOM - Tabs
// ==========================================

const channelTabs =
    document.querySelectorAll(
        ".channel-tab"
    );


// ==========================================
// DOM - Share modal
// ==========================================

const channelShareModal =
    document.getElementById(
        "channelShareModal"
    );

const channelShareBackdrop =
    document.getElementById(
        "channelShareBackdrop"
    );

const channelShareClose =
    document.getElementById(
        "channelShareClose"
    );

const channelShareUrl =
    document.getElementById(
        "channelShareUrl"
    );

const copyShareUrlButton =
    document.getElementById(
        "copyShareUrlButton"
    );


// ==========================================
// DOM - Toast
// ==========================================

const channelToast =
    document.getElementById(
        "channelToast"
    );

const channelToastIcon =
    document.getElementById(
        "channelToastIcon"
    );

const channelToastMessage =
    document.getElementById(
        "channelToastMessage"
    );


// ==========================================
// Global State
// ==========================================

let currentUser =
    null;

let currentProfile =
    null;

let currentChannel =
    null;

let currentVideos =
    [];

let currentShorts =
    [];

let currentLives =
    [];

let sidebarOpen =
    false;

let isSubscribed =
    false;

let isLoadingChannel =
    false;

let isSubscribing =
    false;

let currentTab =
    "home";


// ==========================================
// Initialisation
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


// ==========================================
// INIT
// ==========================================

async function init() {

    try {

        showLoader();

        await checkSession();

        await loadProfile();

        updateHeader();

        updateSidebar();

        setupEvents();

        const handle =
            getChannelHandleFromUrl();

        if (!handle) {

            showChannelError(
                "Aucun identifiant de chaîne n'a été fourni."
            );

            return;

        }

        await loadChannel(
            handle
        );

    }
    catch (error) {

        console.error(
            "Erreur initialisation channel :",
            error
        );

        showChannelError(
            "Une erreur est survenue lors du chargement de la chaîne."
        );

    }
    finally {

        hideLoader();

    }

}


// ==========================================
// URL
// ==========================================

function getChannelHandleFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return String(
        params.get("handle") || ""
    )
        .trim()
        .replace(/^@/, "");

}


// ==========================================
// SESSION
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
            "Erreur session :",
            error
        );

        currentUser =
            null;

    }

}


// ==========================================
// PROFILE
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
            "Erreur profil :",
            error
        );

        currentProfile =
            null;

    }

}


// ==========================================
// CHANNEL
// ==========================================

async function loadChannel(
    handle
) {

    if (isLoadingChannel) {
        return;
    }

    isLoadingChannel =
        true;

    showChannelLoading();

    try {

        const channel =
            await getChannelByHandle(
                handle
            );

        if (!channel) {

            showChannelError(
                "Cette chaîne n'existe pas ou n'est plus disponible."
            );

            return;

        }

        currentChannel =
            channel;

        document.title =
            `${channel.name || "Chaîne"} - NetView`;

        renderChannel();

        await loadChannelContent();

        await checkOwnership();

        await checkSubscription();

        hideChannelLoading();

        showChannelContent();

    }
    catch (error) {

        console.error(
            "Erreur chargement chaîne :",
            error
        );

        showChannelError(
            "Impossible de charger cette chaîne."
        );

    }
    finally {

        isLoadingChannel =
            false;

    }

}


// ==========================================
// CHANNEL LOADING STATE
// ==========================================

function showChannelLoading() {

    if (channelLoading) {
        channelLoading.hidden =
            false;
    }

    if (channelContent) {
        channelContent.hidden =
            true;
    }

    if (channelError) {
        channelError.hidden =
            true;
    }

}


function hideChannelLoading() {

    if (channelLoading) {
        channelLoading.hidden =
            true;
    }

}


function showChannelContent() {

    if (channelContent) {
        channelContent.hidden =
            false;
    }

    if (channelError) {
        channelError.hidden =
            true;
    }

}


function showChannelError(
    message
) {

    if (channelLoading) {
        channelLoading.hidden =
            true;
    }

    if (channelContent) {
        channelContent.hidden =
            true;
    }

    if (channelError) {
        channelError.hidden =
            false;
    }

    if (channelErrorMessage) {

        channelErrorMessage.textContent =
            message;

    }

}


// ==========================================
// RENDER CHANNEL
// ==========================================

function renderChannel() {

    if (!currentChannel) {
        return;
    }

    const channel =
        currentChannel;


    // ======================================
    // Name
    // ======================================

    if (channelName) {

        channelName.textContent =
            channel.name ||
            "Chaîne";

    }


    // ======================================
    // Handle
    // ======================================

    if (channelHandle) {

        channelHandle.textContent =
            `@${channel.handle || ""}`;

    }


    // ======================================
    // Avatar
    // ======================================

    if (channelAvatar) {

        if (channel.avatar_url) {

            channelAvatar.src =
                channel.avatar_url;

            channelAvatar.onerror =
                () => {

                    channelAvatar.src =
                        "NetView_icone.png";

                };

        }
        else {

            channelAvatar.src =
                "NetView_icone.png";

        }

        channelAvatar.alt =
            `Avatar de ${channel.name || "la chaîne"}`;

    }


    // ======================================
    // Banner
    // ======================================

    if (channelBanner) {

        if (channel.banner_url) {

            channelBanner.style.backgroundImage =
                `url("${escapeCssUrl(channel.banner_url)}")`;

            channelBanner.classList.add(
                "has-banner"
            );

            if (channelBannerPlaceholder) {

                channelBannerPlaceholder.hidden =
                    true;

            }

        }
        else {

            channelBanner.style.backgroundImage =
                "";

            channelBanner.classList.remove(
                "has-banner"
            );

            if (channelBannerPlaceholder) {

                channelBannerPlaceholder.hidden =
                    false;

            }

        }

    }


    // ======================================
    // Verified
    // ======================================

    if (channelVerified) {

        channelVerified.hidden =
            !Boolean(
                channel.verified
            );

    }


    // ======================================
    // Stats
    // ======================================

    const subscribers =
        Number(
            channel.subscribers_count
        ) || 0;

    const videos =
        Number(
            channel.videos_count
        ) || 0;

    const views =
        Number(
            channel.total_views
        ) || 0;


    if (channelSubscribers) {

        channelSubscribers.textContent =
            formatNumber(
                subscribers
            );

    }


    if (channelVideos) {

        channelVideos.textContent =
            formatNumber(
                videos
            );

    }


    if (channelViews) {

        channelViews.textContent =
            formatViews(
                views
            );

    }


    // ======================================
    // About
    // ======================================

    if (channelDescription) {

        channelDescription.textContent =
            channel.description?.trim() ||
            "Aucune description.";

    }


    if (aboutSubscribers) {

        aboutSubscribers.textContent =
            formatNumber(
                subscribers
            );

    }


    if (aboutVideos) {

        aboutVideos.textContent =
            formatNumber(
                videos
            );

    }


    if (aboutViews) {

        aboutViews.textContent =
            formatViews(
                views
            );

    }


    if (aboutCreatedAt) {

        aboutCreatedAt.textContent =
            formatDate(
                channel.created_at
            ) || "—";

    }


    // ======================================
    // Public URL
    // ======================================

    const publicUrl =
        getChannelUrl(
            channel.handle
        );


    if (channelPublicUrl) {

        channelPublicUrl.textContent =
            publicUrl;

    }


    if (channelShareUrl) {

        channelShareUrl.value =
            publicUrl;

    }


    // ======================================
    // Meta description
    // ======================================

    updateMetaDescription(
        channel
    );

}


// ==========================================
// META
// ==========================================

function updateMetaDescription(
    channel
) {

    const description =
        channel.description?.trim() ||
        `Découvrez la chaîne ${channel.name || ""} sur NetView.`;

    let meta =
        document.querySelector(
            'meta[name="description"]'
        );

    if (!meta) {

        meta =
            document.createElement(
                "meta"
            );

        meta.name =
            "description";

        document.head.appendChild(
            meta
        );

    }

    meta.content =
        description;

}


// ==========================================
// CHANNEL URL
// ==========================================

function getChannelUrl(
    handle
) {

    return (
        `${NETVIEW_DOMAIN}/channel.html?handle=` +
        encodeURIComponent(
            String(handle || "")
                .replace(/^@/, "")
        )
    );

}


// ==========================================
// OWNERSHIP
// ==========================================

async function checkOwnership() {

    if (!currentUser || !currentChannel) {

        if (editChannelButton) {
            editChannelButton.hidden =
                true;
        }

        return;

    }

    const isOwner =
        currentChannel.owner_id ===
        currentUser.id;


    if (editChannelButton) {

        editChannelButton.hidden =
            !isOwner;

        if (isOwner) {

            editChannelButton.href =
                `edit-channel.html?id=${encodeURIComponent(
                    currentChannel.id
                )}`;

        }

    }


    // Le propriétaire ne doit pas s'abonner à sa propre chaîne.

    if (subscribeChannelButton) {

        if (isOwner) {

            subscribeChannelButton.hidden =
                true;

        }
        else {

            subscribeChannelButton.hidden =
                false;

        }

    }

}


// ==========================================
// SUBSCRIPTION
// ==========================================

async function checkSubscription() {

    if (!currentUser || !currentChannel) {

        isSubscribed =
            false;

        updateSubscribeButton();

        return;

    }

    // La fonction data.js actuelle ne fournit pas encore
    // de fonction de lecture de l'abonnement.
    //
    // On conserve donc l'état local de la page.
    //
    // L'abonnement est mis à jour immédiatement après
    // une inscription réussie.

    isSubscribed =
        false;

    updateSubscribeButton();

}


// ==========================================
// SUBSCRIBE
// ==========================================

async function handleSubscribe() {

    if (!currentChannel) {
        return;
    }

    if (!currentUser) {

        navigate(
            "auth.html"
        );

        return;

    }

    if (
        currentUser.id ===
        currentChannel.owner_id
    ) {

        return;

    }

    if (isSubscribing) {
        return;
    }

    isSubscribing =
        true;

    const originalHTML =
        subscribeChannelButton?.innerHTML;

    try {

        if (subscribeChannelButton) {

            buttonLoading(
                subscribeChannelButton,
                true
            );

        }

        const result =
            await subscribeToChannel(
                currentChannel.id
            );

        if (result?.error) {

            throw result.error;

        }

        isSubscribed =
            true;

        updateSubscribeButton();

        showToast(
            "Vous êtes maintenant abonné à cette chaîne.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Erreur abonnement :",
            error
        );

        const message =
            getSubscriptionErrorMessage(
                error
            );

        showToast(
            message,
            "error"
        );

        if (
            subscribeChannelButton &&
            originalHTML
        ) {

            subscribeChannelButton.innerHTML =
                originalHTML;

        }

    }
    finally {

        isSubscribing =
            false;

        updateSubscribeButton();

    }

}


// ==========================================
// SUBSCRIBE BUTTON
// ==========================================

function updateSubscribeButton() {

    if (!subscribeChannelButton) {
        return;
    }

    if (!currentUser) {

        subscribeChannelButton.innerHTML = `

            <i class="fa-solid fa-bell"></i>

            <span>
                S'abonner
            </span>

        `;

        subscribeChannelButton.classList.remove(
            "subscribed"
        );

        return;

    }

    if (isSubscribed) {

        subscribeChannelButton.innerHTML = `

            <i class="fa-solid fa-bell"></i>

            <span>
                Abonné
            </span>

        `;

        subscribeChannelButton.classList.add(
            "subscribed"
        );

        subscribeChannelButton.setAttribute(
            "aria-pressed",
            "true"
        );

        return;

    }

    subscribeChannelButton.innerHTML = `

        <i class="fa-solid fa-bell"></i>

        <span>
            S'abonner
        </span>

    `;

    subscribeChannelButton.classList.remove(
        "subscribed"
    );

    subscribeChannelButton.setAttribute(
        "aria-pressed",
        "false"
    );

}


// ==========================================
// CHANNEL CONTENT
// ==========================================

async function loadChannelContent() {

    if (!currentChannel) {
        return;
    }

    await Promise.all([
        loadVideos(),
        loadShorts(),
        loadLives()
    ]);

    renderVideos();
    renderShorts();
    renderLives();

}


// ==========================================
// VIDEOS
// ==========================================

async function loadVideos() {

    try {

        const data =
            await getVideos({
                channelId:
                    currentChannel.id,
                page:
                    1,
                limit:
                    50
            });

        currentVideos =
            normalizeArray(
                data
            );

        currentVideos =
            filterChannelContent(
                currentVideos,
                currentChannel.id
            );

    }
    catch (error) {

        console.error(
            "Erreur chargement vidéos chaîne :",
            error
        );

        currentVideos =
            [];

    }

}


// ==========================================
// SHORTS
// ==========================================

async function loadShorts() {

    try {

        const data =
            await getShorts({
                channelId:
                    currentChannel.id,
                limit:
                    50
            });

        currentShorts =
            normalizeArray(
                data
            );

        currentShorts =
            filterChannelContent(
                currentShorts,
                currentChannel.id
            );

    }
    catch (error) {

        console.error(
            "Erreur chargement Shorts chaîne :",
            error
        );

        currentShorts =
            [];

    }

}


// ==========================================
// LIVES
// ==========================================

async function loadLives() {

    try {

        const data =
            await getLives({
                channelId:
                    currentChannel.id,
                limit:
                    50
            });

        currentLives =
            normalizeArray(
                data
            );

        currentLives =
            filterChannelContent(
                currentLives,
                currentChannel.id
            );

    }
    catch (error) {

        console.error(
            "Erreur chargement Lives chaîne :",
            error
        );

        currentLives =
            [];

    }

}


// ==========================================
// FILTER CHANNEL CONTENT
// ==========================================

function filterChannelContent(
    items,
    channelId
) {

    if (!Array.isArray(items)) {
        return [];
    }

    /*
     * Les fonctions data.js peuvent déjà filtrer côté Supabase.
     * Si elles renvoient des données avec channel_id, on vérifie
     * également côté client.
     */

    return items.filter(
        item => {

            const itemChannelId =
                item?.channel_id ||
                item?.channelId ||
                item?.channels?.id ||
                item?.channel?.id;

            // Si aucun channel_id n'est présent,
            // on conserve l'élément car data.js peut
            // avoir déjà effectué le filtrage côté serveur.

            if (!itemChannelId) {
                return true;
            }

            return (
                itemChannelId ===
                channelId
            );

        }
    );

}


// ==========================================
// RENDER VIDEOS
// ==========================================

function renderVideos() {

    if (channelHomeGrid) {

        channelHomeGrid.innerHTML =
            "";

        currentVideos
            .slice(0, 12)
            .forEach(
                video => {

                    channelHomeGrid.appendChild(
                        createVideoCard(
                            video
                        )
                    );

                }
            );

    }


    if (channelVideosGrid) {

        channelVideosGrid.innerHTML =
            "";

        currentVideos.forEach(
            video => {

                channelVideosGrid.appendChild(
                    createVideoCard(
                        video
                    )
                );

            }
        );

    }


    updateEmptyState(
        channelHomeEmpty,
        currentVideos.length === 0
    );

    updateEmptyState(
        channelVideosEmpty,
        currentVideos.length === 0
    );

}


// ==========================================
// VIDEO CARD
// ==========================================

function createVideoCard(
    video
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "nv-video-card";

    article.dataset.id =
        video.id || "";


    const thumbnail =
        video.thumbnail_url ||
        video.thumbnail_path ||
        "default-thumb.jpg";


    const title =
        video.title ||
        "Vidéo sans titre";


    const views =
        Number(
            video.views ||
            video.view_count ||
            0
        );


    const published =
        video.published_at ||
        video.created_at;


    const duration =
        formatDuration(
            video.duration
        );


    article.innerHTML = `

        <a
            href="player.html?id=${encodeURIComponent(
                video.id || ""
            )}"
            class="nv-video-link-wrapper"
        >

            <div class="nv-video-thumbnail">

                <img
                    src="${escapeHtmlAttribute(
                        thumbnail
                    )}"
                    alt="${escapeHtmlAttribute(
                        title
                    )}"
                    loading="lazy"
                >

                ${
                    duration
                        ? `
                            <span class="nv-video-duration">
                                ${duration}
                            </span>
                        `
                        : ""
                }

            </div>

        </a>


        <div class="nv-video-content">

            <div class="nv-video-avatar">

                <img
                    src="${escapeHtmlAttribute(
                        video.channelAvatar ||
                        currentChannel?.avatar_url ||
                        "NetView_icone.png"
                    )}"
                    alt=""
                    loading="lazy"
                >

            </div>


            <div class="nv-video-info">

                <h3 class="nv-video-title">

                    <a
                        href="player.html?id=${encodeURIComponent(
                            video.id || ""
                        )}"
                    >

                        ${escapeHtml(
                            title
                        )}

                    </a>

                </h3>


                <div class="nv-video-channel">

                    ${escapeHtml(
                        currentChannel?.name ||
                        "NetView"
                    )}

                </div>


                <div class="nv-video-meta">

                    <span>
                        ${formatViews(
                            views
                        )} vues
                    </span>

                    <span>•</span>

                    <span>
                        ${formatDate(
                            published
                        )}
                    </span>

                </div>

            </div>

        </div>

    `;


    return article;

}


// ==========================================
// RENDER SHORTS
// ==========================================

function renderShorts() {

    if (!channelShortsGrid) {
        return;
    }

    channelShortsGrid.innerHTML =
        "";

    currentShorts.forEach(
        short => {

            channelShortsGrid.appendChild(
                createShortCard(
                    short
                )
            );

        }
    );


    updateEmptyState(
        channelShortsEmpty,
        currentShorts.length === 0
    );

}


// ==========================================
// SHORT CARD
// ==========================================

function createShortCard(
    short
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "nv-short-card";

    article.dataset.id =
        short.id || "";


    const thumbnail =
        short.thumbnail_url ||
        short.thumbnail_path ||
        "default-thumb.jpg";


    const title =
        short.title ||
        "Short sans titre";


    const views =
        Number(
            short.views ||
            short.view_count ||
            0
        ) || 0;


    article.innerHTML = `

        <a
            href="player.html?short=${encodeURIComponent(
                short.id || ""
            )}"
        >

            <div class="nv-short-thumbnail">

                <img
                    src="${escapeHtmlAttribute(
                        thumbnail
                    )}"
                    alt="${escapeHtmlAttribute(
                        title
                    )}"
                    loading="lazy"
                >

            </div>


            <div class="nv-short-info">

                <h3>
                    ${escapeHtml(
                        title
                    )}
                </h3>

                <p>
                    ${formatViews(
                        views
                    )} vues
                </p>

            </div>

        </a>

    `;


    return article;

}


// ==========================================
// RENDER LIVES
// ==========================================

function renderLives() {

    if (!channelLivesGrid) {
        return;
    }

    channelLivesGrid.innerHTML =
        "";

    currentLives.forEach(
        live => {

            channelLivesGrid.appendChild(
                createLiveCard(
                    live
                )
            );

        }
    );


    updateEmptyState(
        channelLivesEmpty,
        currentLives.length === 0
    );

}


// ==========================================
// LIVE CARD
// ==========================================

function createLiveCard(
    live
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "nv-live-card";

    article.dataset.id =
        live.id || "";


    const thumbnail =
        live.thumbnail_url ||
        live.thumbnail_path ||
        "default-thumb.jpg";


    const title =
        live.title ||
        "Live sans titre";


    article.innerHTML = `

        <a
            href="live.html?id=${encodeURIComponent(
                live.id || ""
            )}"
        >

            <div class="nv-live-thumbnail">

                <img
                    src="${escapeHtmlAttribute(
                        thumbnail
                    )}"
                    alt="${escapeHtmlAttribute(
                        title
                    )}"
                    loading="lazy"
                >

                <span class="nv-live-badge">
                    LIVE
                </span>

            </div>


            <div class="nv-live-info">

                <h3>
                    ${escapeHtml(
                        title
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        currentChannel?.name ||
                        "NetView"
                    )}
                </p>

            </div>

        </a>

    `;


    return article;

}


// ==========================================
// EMPTY STATE
// ==========================================

function updateEmptyState(
    element,
    shouldShow
) {

    if (!element) {
        return;
    }

    element.hidden =
        !shouldShow;

}


// ==========================================
// TABS
// ==========================================

function setupTabs() {

    channelTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    const target =
                        tab.dataset.channelTab;

                    if (!target) {
                        return;
                    }

                    switchChannelTab(
                        target
                    );

                }
            );

        }
    );

}


// ==========================================
// SWITCH TAB
// ==========================================

function switchChannelTab(
    tabName
) {

    currentTab =
        tabName;


    channelTabs.forEach(
        tab => {

            const active =
                tab.dataset.channelTab ===
                tabName;

            tab.classList.toggle(
                "active",
                active
            );

            tab.setAttribute(
                "aria-selected",
                active
                    ? "true"
                    : "false"
            );

        }
    );


    const sections = [
        channelHomeSection,
        channelVideosSection,
        channelShortsSection,
        channelLivesSection,
        channelAboutSection
    ];


    sections.forEach(
        section => {

            if (!section) {
                return;
            }

            section.hidden =
                section.dataset.channelSection !==
                tabName;

        }
    );


    const newUrl =
        new URL(
            window.location.href
        );

    newUrl.searchParams.set(
        "tab",
        tabName
    );

    window.history.replaceState(
        {},
        "",
        newUrl
    );

}


// ==========================================
// RESTORE TAB
// ==========================================

function restoreTabFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const tab =
        params.get("tab");


    const validTabs = [
        "home",
        "videos",
        "shorts",
        "lives",
        "about"
    ];


    if (
        tab &&
        validTabs.includes(
            tab
        )
    ) {

        switchChannelTab(
            tab
        );

    }
    else {

        switchChannelTab(
            "home"
        );

    }

}


// ==========================================
// SHARE MODAL
// ==========================================

function openShareModal() {

    if (!channelShareModal) {
        return;
    }

    const url =
        getChannelUrl(
            currentChannel?.handle
        );


    if (channelShareUrl) {

        channelShareUrl.value =
            url;

    }


    channelShareModal.hidden =
        false;

    document.body.classList.add(
        "nv-modal-open"
    );


    requestAnimationFrame(
        () => {

            channelShareModal.classList.add(
                "active"
            );

        }
    );


    channelShareClose?.focus();

}


// ==========================================
// CLOSE SHARE
// ==========================================

function closeShareModal() {

    if (!channelShareModal) {
        return;
    }

    channelShareModal.classList.remove(
        "active"
    );

    document.body.classList.remove(
        "nv-modal-open"
    );


    setTimeout(
        () => {

            channelShareModal.hidden =
                true;

        },
        180
    );

}


// ==========================================
// COPY CHANNEL URL
// ==========================================

async function copyChannelUrl() {

    if (!currentChannel) {
        return;
    }

    const url =
        getChannelUrl(
            currentChannel.handle
        );


    const success =
        await copyText(
            url
        );


    if (success) {

        showToast(
            "Lien de la chaîne copié.",
            "success"
        );

    }
    else {

        showToast(
            "Impossible de copier le lien.",
            "error"
        );

    }

}


// ==========================================
// COPY SHARE URL
// ==========================================

async function copyShareUrl() {

    const url =
        channelShareUrl?.value ||
        getChannelUrl(
            currentChannel?.handle
        );


    const success =
        await copyText(
            url
        );


    if (success) {

        showToast(
            "Lien copié.",
            "success"
        );

    }
    else {

        showToast(
            "Impossible de copier le lien.",
            "error"
        );

    }

}


// ==========================================
// COPY
// ==========================================

async function copyText(
    text
) {

    if (!text) {
        return false;
    }

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

            return true;

        }

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.focus();

        textarea.select();

        const copied =
            document.execCommand(
                "copy"
            );

        textarea.remove();

        return copied;

    }
    catch (error) {

        console.error(
            "Erreur copie :",
            error
        );

        return false;

    }

}


// ==========================================
// HEADER
// ==========================================

function updateHeader() {

    if (!headerRight) {
        return;
    }

    if (currentUser) {

        showUserHeader();

    }
    else {

        showGuestHeader();

    }

}


// ==========================================
// GUEST HEADER
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
// USER HEADER
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

        </button>


        <a
            href="settings.html"
            class="nv-avatar-button"
            title="Paramètres"
        >

            <img
                src="${escapeHtmlAttribute(
                    currentProfile?.avatar_url ||
                    "NetView_icone.png"
                )}"
                alt="Avatar"
            >

        </a>

    `;

}


// ==========================================
// SIDEBAR
// ==========================================

function updateSidebar() {

    if (!sidebarNav) {
        return;
    }

    if (currentUser) {

        showUserSidebar();

    }
    else {

        showGuestSidebar();

    }

}


// ==========================================
// GUEST SIDEBAR
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
// USER SIDEBAR
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


        <a href="playlist.html">

            <i class="fa-solid fa-list"></i>

            <span>
                Playlists
            </span>

        </a>


        <a href="history.html">

            <i class="fa-solid fa-clock-rotate-left"></i>

            <span>
                Historique
            </span>

        </a>


        <a href="watch-later.html">

            <i class="fa-regular fa-clock"></i>

            <span>
                À regarder
            </span>

        </a>


        <a href="liked-videos.html">

            <i class="fa-solid fa-thumbs-up"></i>

            <span>
                J'aime
            </span>

        </a>


        <hr>


        <a href="lives.html">

            <i class="fa-solid fa-tower-broadcast"></i>

            <span>
                Lives
            </span>

        </a>


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


        <hr>

    `;

}


// ==========================================
// SIDEBAR OPEN
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

    document.body.classList.add(
        "nv-sidebar-open"
    );

}


// ==========================================
// SIDEBAR CLOSE
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

    document.body.classList.remove(
        "nv-sidebar-open"
    );

}


// ==========================================
// SIDEBAR TOGGLE
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
// SEARCH
// ==========================================

function handleSearch(
    event
) {

    event.preventDefault();

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
// EVENTS
// ==========================================

function setupEvents() {

    // ======================================
    // Menu
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
    // Search
    // ======================================

    searchForm?.addEventListener(
        "submit",
        handleSearch
    );


    // ======================================
    // Header delegation
    // ======================================

    headerRight?.addEventListener(
        "click",
        handleHeaderClick
    );


    // ======================================
    // Sidebar delegation
    // ======================================

    sidebarNav?.addEventListener(
        "click",
        handleSidebarClick
    );


    // ======================================
    // Channel actions
    // ======================================

    subscribeChannelButton?.addEventListener(
        "click",
        handleSubscribe
    );


    shareChannelButton?.addEventListener(
        "click",
        openShareModal
    );


    copyChannelUrlButton?.addEventListener(
        "click",
        copyChannelUrl
    );


    // ======================================
    // Tabs
    // ======================================

    setupTabs();


    // ======================================
    // Share modal
    // ======================================

    channelShareClose?.addEventListener(
        "click",
        closeShareModal
    );


    channelShareBackdrop?.addEventListener(
        "click",
        closeShareModal
    );


    copyShareUrlButton?.addEventListener(
        "click",
        copyShareUrl
    );


    // ======================================
    // Keyboard
    // ======================================

    document.addEventListener(
        "keydown",
        handleKeyboard
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
// HEADER CLICK
// ==========================================

function handleHeaderClick(
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

    }

}


// ==========================================
// SIDEBAR CLICK
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

        currentUser =
            null;

        currentProfile =
            null;

        navigate(
            "auth.html"
        );

    }
    catch (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );

        showToast(
            "Impossible de se déconnecter.",
            "error"
        );

    }

}


// ==========================================
// KEYBOARD
// ==========================================

function handleKeyboard(
    event
) {

    if (
        event.key ===
        "Escape"
    ) {

        if (
            channelShareModal &&
            !channelShareModal.hidden
        ) {

            closeShareModal();

            return;

        }


        if (sidebarOpen) {

            closeSidebar();

        }

    }

}


// ==========================================
// RESIZE
// ==========================================

function handleResize() {

    if (
        window.innerWidth >
        900
    ) {

        sidebarOverlay?.classList.remove(
            "active"
        );

    }

}


// ==========================================
// TOAST
// ==========================================

function showToast(
    message,
    type = "success"
) {

    if (!channelToast) {
        return;
    }


    if (channelToastMessage) {

        channelToastMessage.textContent =
            message;

    }


    if (channelToastIcon) {

        if (type === "error") {

            channelToastIcon.className =
                "fa-solid fa-circle-exclamation";

        }
        else {

            channelToastIcon.className =
                "fa-solid fa-circle-check";

        }

    }


    channelToast.classList.remove(
        "success",
        "error"
    );

    channelToast.classList.add(
        type
    );


    channelToast.hidden =
        false;


    requestAnimationFrame(
        () => {

            channelToast.classList.add(
                "show"
            );

        }
    );


    clearTimeout(
        channelToast._timer
    );


    channelToast._timer =
        setTimeout(
            () => {

                channelToast.classList.remove(
                    "show"
                );

                setTimeout(
                    () => {

                        channelToast.hidden =
                            true;

                    },
                    200
                );

            },
            3500
        );

}


// ==========================================
// SUBSCRIPTION ERROR
// ==========================================

function getSubscriptionErrorMessage(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    if (
        message.includes(
            "duplicate"
        ) ||
        message.includes(
            "unique"
        )
    ) {

        isSubscribed =
            true;

        updateSubscribeButton();

        return "Vous êtes déjà abonné à cette chaîne.";

    }


    if (
        message.includes(
            "row-level security"
        ) ||
        message.includes(
            "permission"
        )
    ) {

        return "Vous n'avez pas l'autorisation de vous abonner.";

    }


    return (
        error?.message ||
        "Impossible de s'abonner à cette chaîne."
    );

}


// ==========================================
// FORMAT NUMBER
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
// FORMAT VIEWS
// ==========================================

function formatViews(
    value
) {

    const views =
        Number(
            value
        ) || 0;


    if (
        views >=
        1000000000
    ) {

        return (
            (
                views /
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
        views >=
        1000000
    ) {

        return (
            (
                views /
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
        views >=
        1000
    ) {

        return (
            (
                views /
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
        views
    );

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(
    date
) {

    if (!date) {
        return "";
    }


    const value =
        new Date(
            date
        );


    if (
        Number.isNaN(
            value.getTime()
        )
    ) {

        return "";

    }


    return value.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ==========================================
// FORMAT DURATION
// ==========================================

function formatDuration(
    totalSeconds
) {

    if (
        totalSeconds === null ||
        totalSeconds === undefined ||
        totalSeconds === ""
    ) {

        return "";

    }


    const secondsNumber =
        Number(
            totalSeconds
        );


    if (
        Number.isNaN(
            secondsNumber
        ) ||
        secondsNumber < 0
    ) {

        return "";

    }


    const hours =
        Math.floor(
            secondsNumber /
            3600
        );


    const minutes =
        Math.floor(
            (
                secondsNumber %
                3600
            ) /
            60
        );


    const seconds =
        Math.floor(
            secondsNumber %
            60
        );


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
            `${String(
                hours
            ).padStart(
                2,
                "0"
            )}:${mm}:${ss}`
        );

    }


    return `${mm}:${ss}`;

}


// ==========================================
// NORMALIZE ARRAY
// ==========================================

function normalizeArray(
    value
) {

    return Array.isArray(
        value
    )
        ? value
        : [];

}


// ==========================================
// ESCAPE HTML
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
// ESCAPE ATTRIBUTE
// ==========================================

function escapeHtmlAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


// ==========================================
// ESCAPE CSS URL
// ==========================================

function escapeCssUrl(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\)/g,
            "\\)"
        );

}


// ==========================================
// CLEANUP
// ==========================================

function destroy() {

    closeSidebar();

    closeShareModal();

    hideLoader();

    currentChannel =
        null;

    currentVideos =
        [];

    currentShorts =
        [];

    currentLives =
        [];

}


window.addEventListener(
    "beforeunload",
    destroy
);


// ==========================================
// Restore tab after page setup
// ==========================================

window.addEventListener(
    "load",
    () => {

        restoreTabFromUrl();

    }
);
