// =========================================================
// NetView
// shorts.js
// Jour 26
// =========================================================

import {
    supabase
} from "../core/supabase.js";

import {
    getShort,
    getShorts,
    setShortReaction,
    removeShortReaction,
    getProfile,
    isSubscribedToChannel,
    subscribeToChannel,
    unsubscribeFromChannel,
    addWatchLater
} from "../core/data.js";

import {
    navigate,
    setActiveNav
} from "../core/navigation.js";

import { getUser }"../core/auth.js";
// =========================================================
// STATE
// =========================================================

const state = {

    shorts: [],

    currentIndex: -1,

    currentShort: null,

    currentUser: null,

    profile: null,

    channelSubscribed: false,

    isPlaying: false,

    isMuted: false,

    viewStarted: false,

    viewId: null,

    watchStart: null,

    watchedSeconds: 0,

    lastSavedSecond: 0,

    comments: [],

    commentsLoaded: false,

    commentsChannel: null,

    loading: false,

    changingShort: false,

    touchStartY: 0,

    touchEndY: 0,

    currentCommentId: null,

    currentParentId: null

};


// =========================================================
// DOM
// =========================================================

const dom = {};


// =========================================================
// INIT
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    cacheDOM();

    buildHeader();

    buildSidebar();

    setActiveNav();

    bindGlobalEvents();

    state.currentUser =
        await getUser();

    if (state.currentUser) {

        state.profile =
            await getProfile();

    }

    await loadInitialShort();

    setupRealtime();

}


// =========================================================
// CACHE DOM
// =========================================================

function cacheDOM() {

    dom.headerRight =
        document.getElementById("headerRight");

    dom.sidebar =
        document.getElementById("sidebar");

    dom.main =
        document.getElementById("shortsMain");

    dom.viewport =
        document.getElementById("shortViewport");

    dom.video =
        document.getElementById("shortVideo");

    dom.loading =
        document.getElementById("shortsLoading");

    dom.error =
        document.getElementById("shortsError");

    dom.errorMessage =
        document.getElementById("shortsErrorMessage");

    dom.empty =
        document.getElementById("shortsEmpty");

    dom.shortItem =
        document.getElementById("shortItem");

    dom.channelLink =
        document.getElementById("shortChannelLink");

    dom.channelAvatar =
        document.getElementById("shortChannelAvatar");

    dom.channelName =
        document.getElementById("shortChannelName");

    dom.channelVerified =
        document.getElementById("shortChannelVerified");

    dom.subscribe =
        document.getElementById(
            "shortSubscribeButton"
        );

    dom.title =
        document.getElementById("shortTitle");

    dom.description =
        document.getElementById(
            "shortDescription"
        );

    dom.tags =
        document.getElementById("shortTags");

    dom.like =
        document.getElementById(
            "shortLikeButton"
        );

    dom.likeCount =
        document.getElementById(
            "shortLikeCount"
        );

    dom.commentCount =
        document.getElementById(
            "shortCommentCount"
        );

    dom.commentsButton =
        document.getElementById(
            "shortCommentsButton"
        );

    dom.share =
        document.getElementById(
            "shortShareButton"
        );

    dom.save =
        document.getElementById(
            "shortSaveButton"
        );

    dom.more =
        document.getElementById(
            "shortMoreButton"
        );

    dom.play =
        document.getElementById(
            "shortPlayButton"
        );

    dom.mute =
        document.getElementById(
            "shortMuteButton"
        );

    dom.fullscreen =
        document.getElementById(
            "shortFullscreenButton"
        );

    dom.previous =
        document.getElementById(
            "previousShortButton"
        );

    dom.next =
        document.getElementById(
            "nextShortButton"
        );

    dom.progress =
        document.getElementById(
            "shortProgress"
        );

    dom.commentsPanel =
        document.getElementById(
            "shortCommentsPanel"
        );

    dom.commentsOverlay =
        document.getElementById(
            "shortCommentsOverlay"
        );

    dom.commentsList =
        document.getElementById(
            "shortCommentsList"
        );

    dom.commentsForm =
        document.getElementById(
            "shortCommentForm"
        );

    dom.commentInput =
        document.getElementById(
            "shortCommentInput"
        );

    dom.commentSubmit =
        document.getElementById(
            "submitShortComment"
        );

    dom.commentAvatar =
        document.getElementById(
            "shortCommentAvatar"
        );

    dom.commentsTotal =
        document.getElementById(
            "shortCommentsTotal"
        );

    dom.commentsEmpty =
        document.getElementById(
            "shortCommentsEmpty"
        );

    dom.commentsLoading =
        document.getElementById(
            "shortCommentsLoading"
        );

    dom.closeComments =
        document.getElementById(
            "closeShortComments"
        );

    dom.shareModal =
        document.getElementById(
            "shortShareModal"
        );

    dom.closeShare =
        document.getElementById(
            "closeShortShare"
        );

    dom.copyLink =
        document.getElementById(
            "copyShortLink"
        );

    dom.nativeShare =
        document.getElementById(
            "nativeShortShare"
        );

    dom.toast =
        document.getElementById(
            "nvToast"
        );

    dom.toastMessage =
        document.getElementById(
            "nvToastMessage"
        );

    dom.retry =
        document.getElementById(
            "retryShortButton"
        );

}


// =========================================================
// HEADER
// =========================================================

function buildHeader() {

    if (!dom.headerRight) {
        return;
    }

    dom.headerRight.innerHTML = `

        <a
            href="upload.html"
            class="nv-icon-button"
            aria-label="Créer"
        >
            <i class="fa-solid fa-plus"></i>
        </a>

        <a
            href="notification.html"
            class="nv-icon-button"
            aria-label="Notifications"
        >
            <i class="fa-regular fa-bell"></i>

            <span
                id="notificationBadge"
                class="nv-notification-badge"
                hidden
            >
                0
            </span>
        </a>

        <a
            href="profile.html"
            class="nv-header-avatar-link"
            aria-label="Profil"
        >

            <img
                id="headerAvatar"
                class="nv-header-avatar"
                src="assets/images/default-avatar.png"
                alt="Profil"
            >

        </a>
    `;


    const avatar =
        document.getElementById(
            "headerAvatar"
        );


    if (
        avatar &&
        state.profile?.avatar_url
    ) {

        avatar.src =
            state.profile.avatar_url;

    }

}


// =========================================================
// SIDEBAR
// =========================================================

function buildSidebar() {

    if (!dom.sidebar) {
        return;
    }

    const nav =
        dom.sidebar.querySelector(
            ".nv-sidebar-nav"
        );

    if (!nav) {
        return;
    }

    nav.innerHTML = `

        <a
            href="index.html"
            class="nv-sidebar-item"
            data-nav="index"
        >
            <i class="fa-solid fa-house"></i>
            <span>Accueil</span>
        </a>

        <a
            href="shorts.html"
            class="nv-sidebar-item"
            data-nav="shorts"
        >
            <i class="fa-solid fa-bolt"></i>
            <span>Shorts</span>
        </a>

        <a
            href="subscriptions.html"
            class="nv-sidebar-item"
            data-nav="subscriptions"
        >
            <i class="fa-solid fa-layer-group"></i>
            <span>Abonnements</span>
        </a>

        <a
            href="trending.html"
            class="nv-sidebar-item"
            data-nav="trending"
        >
            <i class="fa-solid fa-fire"></i>
            <span>Tendances</span>
        </a>

        <div class="nv-sidebar-divider"></div>

        <a
            href="library.html"
            class="nv-sidebar-item"
            data-nav="library"
        >
            <i class="fa-solid fa-photo-film"></i>
            <span>Bibliothèque</span>
        </a>

        <a
            href="playlist.html"
            class="nv-sidebar-item"
            data-nav="playlist"
        >
            <i class="fa-solid fa-list"></i>
            <span>Playlists</span>
        </a>

    `;

}


// =========================================================
// GLOBAL EVENTS
// =========================================================

function bindGlobalEvents() {

    dom.play?.addEventListener(
        "click",
        togglePlay
    );

    dom.video?.addEventListener(
        "click",
        togglePlay
    );

    dom.mute?.addEventListener(
        "click",
        toggleMute
    );

    dom.fullscreen?.addEventListener(
        "click",
        toggleFullscreen
    );

    dom.previous?.addEventListener(
        "click",
        previousShort
    );

    dom.next?.addEventListener(
        "click",
        nextShort
    );

    dom.like?.addEventListener(
        "click",
        toggleLike
    );

    dom.commentsButton?.addEventListener(
        "click",
        openComments
    );

    dom.closeComments?.addEventListener(
        "click",
        closeComments
    );

    dom.commentsOverlay?.addEventListener(
        "click",
        closeComments
    );

    dom.commentsForm?.addEventListener(
        "submit",
        submitComment
    );

    dom.share?.addEventListener(
        "click",
        openShare
    );

    dom.closeShare?.addEventListener(
        "click",
        closeShare
    );

    dom.copyLink?.addEventListener(
        "click",
        copyShortLink
    );

    dom.nativeShare?.addEventListener(
        "click",
        nativeShare
    );

    dom.save?.addEventListener(
        "click",
        saveCurrentShort
    );

    dom.subscribe?.addEventListener(
        "click",
        toggleSubscription
    );

    dom.retry?.addEventListener(
        "click",
        loadInitialShort
    );


    dom.video?.addEventListener(
        "timeupdate",
        handleTimeUpdate
    );

    dom.video?.addEventListener(
        "play",
        () => {

            state.isPlaying = true;

            updatePlayButton();

        }
    );

    dom.video?.addEventListener(
        "pause",
        () => {

            state.isPlaying = false;

            updatePlayButton();

            saveWatchProgress();

        }
    );

    dom.video?.addEventListener(
        "ended",
        handleEnded
    );


    dom.video?.addEventListener(
        "loadedmetadata",
        () => {

            if (
                !state.viewStarted
            ) {

                registerView();

            }

        }
    );


    document.addEventListener(
        "keydown",
        handleKeyboard
    );


    dom.viewport?.addEventListener(
        "touchstart",
        handleTouchStart,
        {
            passive: true
        }
    );


    dom.viewport?.addEventListener(
        "touchend",
        handleTouchEnd,
        {
            passive: true
        }
    );


    window.addEventListener(
        "popstate",
        handleUrlChange
    );


    document.addEventListener(
        "click",
        handleDocumentClick
    );

}


// =========================================================
// INITIAL SHORT
// =========================================================

async function loadInitialShort() {

    showLoading();

    try {

        const id =
            new URLSearchParams(
                window.location.search
            ).get("id");


        if (id) {

            const short =
                await getShort(id);


            if (!short) {

                throw new Error(
                    "Short introuvable."
                );

            }


            state.shorts =
                [short];

            state.currentIndex =
                0;

            await displayShort(
                short,
                false
            );

            await loadAdjacentShorts();

        }

        else {

            state.shorts =
                await getShorts({
                    page: 1,
                    limit: 20
                });


            if (
                !state.shorts.length
            ) {

                showEmpty();

                return;

            }


            state.currentIndex = 0;

            await displayShort(
                state.shorts[0],
                false
            );

        }


        hideLoading();

    }

    catch (error) {

        console.error(
            "Erreur Shorts :",
            error
        );

        showError(
            error.message
        );

    }

}


// =========================================================
// ADJACENT SHORTS
// =========================================================

async function loadAdjacentShorts() {

    try {

        const more =
            await getShorts({
                page: 1,
                limit: 20
            });


        const existing =
            new Set(
                state.shorts.map(
                    short => short.id
                )
            );


        for (
            const short of more
        ) {

            if (
                !existing.has(short.id)
            ) {

                state.shorts.push(
                    short
                );

            }

        }

    }

    catch (error) {

        console.error(
            "Erreur chargement Shorts :",
            error
        );

    }

}


// =========================================================
// DISPLAY SHORT
// =========================================================

async function displayShort(
    short,
    pushUrl = true
) {

    if (!short) {
        return;
    }

    state.changingShort = true;

    await stopCurrentVideo();

    state.currentShort =
        short;

    state.viewStarted =
        false;

    state.viewId =
        null;

    state.watchStart =
        null;

    state.watchedSeconds =
        0;

    state.lastSavedSecond =
        0;


    if (pushUrl) {

        const url =
            `shorts.html?id=${short.id}`;

        window.history.pushState(
            {
                shortId: short.id
            },
            "",
            url
        );

    }


    renderShort(short);

    await loadShortState(short);

    await loadCommentsCount(short);

    resetVideo();

    await autoplay();

    state.changingShort = false;

}


// =========================================================
// RENDER SHORT
// =========================================================

function renderShort(short) {

    dom.viewport.hidden =
        false;

    dom.empty.hidden =
        true;

    dom.error.hidden =
        true;


    const channel =
        short.channels ||
        short.channel ||
        {};


    const avatar =
        channel.avatar_url ||
        "NetView_icone.png";


    dom.channelAvatar.src =
        avatar;

    dom.channelAvatar.alt =
        channel.name ||
        "Chaîne";


    dom.channelLink.href =
        channel.id
            ? `channel.html?id=${channel.id}`
            : "#";


    dom.channelName.textContent =
        channel.name ||
        channel.handle ||
        "Chaîne";


    dom.channelName.href =
        channel.id
            ? `channel.html?id=${channel.id}`
            : "#";


    dom.channelVerified.hidden =
        !channel.verified;


    dom.title.textContent =
        short.title ||
        "";


    dom.description.textContent =
        short.description ||
        "";


    renderTags(
        short
    );


    dom.likeCount.textContent =
        formatNumber(
            short.likes_count || 0
        );


    dom.commentCount.textContent =
        formatNumber(
            short.comments_count || 0
        );


    updateSubscribeButton();

}


// =========================================================
// TAGS
// =========================================================

async function renderTags(short) {

    dom.tags.innerHTML = "";

    try {

        const {
            data,
            error
        } = await supabase

            .from("short_tags")

            .select("tag")

            .eq(
                "short_id",
                short.id
            )

            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        for (
            const item of data || []
        ) {

            const tag =
                document.createElement(
                    "a"
                );

            tag.className =
                "short-tag";

            tag.href =
                `search.html?q=${encodeURIComponent(
                    item.tag
                )}&type=shorts`;

            tag.textContent =
                `#${item.tag}`;

            dom.tags.appendChild(
                tag
            );

        }

    }

    catch (error) {

        console.error(
            "Erreur tags :",
            error
        );

    }

}


// =========================================================
// SHORT STATE
// =========================================================

async function loadShortState(short) {

    if (!state.currentUser) {

        return;

    }


    try {

        state.channelSubscribed =
            await isSubscribedToChannel(
                short.channel_id
            );

    }

    catch {

        state.channelSubscribed =
            false;

    }


    updateSubscribeButton();

}


// =========================================================
// SUBSCRIPTION
// =========================================================

function updateSubscribeButton() {

    if (!dom.subscribe) {
        return;
    }


    if (
        state.channelSubscribed
    ) {

        dom.subscribe.textContent =
            "Abonné";

        dom.subscribe.classList.add(
            "subscribed"
        );

    }

    else {

        dom.subscribe.textContent =
            "S'abonner";

        dom.subscribe.classList.remove(
            "subscribed"
        );

    }

}


async function toggleSubscription() {

    if (!state.currentUser) {

        navigate(
            "auth.html"
        );

        return;

    }


    const channelId =
        state.currentShort?.channel_id;


    if (!channelId) {
        return;
    }


    try {

        dom.subscribe.disabled =
            true;


        if (
            state.channelSubscribed
        ) {

            await unsubscribeFromChannel(
                channelId
            );

            state.channelSubscribed =
                false;

            showToast(
                "Désabonnement effectué."
            );

        }

        else {

            await subscribeToChannel(
                channelId
            );

            state.channelSubscribed =
                true;

            showToast(
                "Vous êtes maintenant abonné."
            );

        }


        updateSubscribeButton();

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Impossible de modifier l'abonnement."
        );

    }

    finally {

        dom.subscribe.disabled =
            false;

    }

}


// =========================================================
// VIDEO
// =========================================================

function resetVideo() {

    if (!dom.video) {
        return;
    }


    dom.video.pause();

    dom.video.removeAttribute(
        "src"
    );

    dom.video.load();


    /*
     * Le champ vidéo peut être exposé
     * par normalizeShort().
     */

    const url =
        getShortVideoUrl(
            state.currentShort
        );


    if (!url) {

        showError(
            "Fichier vidéo introuvable."
        );

        return;

    }


    dom.video.src =
        url;

    dom.video.muted =
        state.isMuted;

    dom.video.currentTime =
        0;

    dom.progress.style.width =
        "0%";

}


function getShortVideoUrl(short) {

    return (

        short.video_url ||

        short.playback_url ||

        short.file_url ||

        short.url ||

        short.video?.url ||

        short.video_file?.url ||

        null

    );

}


async function autoplay() {

    if (!dom.video?.src) {
        return;
    }


    try {

        await dom.video.play();

        state.isPlaying =
            true;

        state.watchStart =
            Date.now();

        updatePlayButton();

    }

    catch {

        state.isPlaying =
            false;

        updatePlayButton();

    }

}


function togglePlay() {

    if (!dom.video) {
        return;
    }


    if (
        dom.video.paused
    ) {

        dom.video.play()
            .catch(() => {});

    }

    else {

        dom.video.pause();

    }

}


function updatePlayButton() {

    if (!dom.play) {
        return;
    }


    dom.play.innerHTML =
        state.isPlaying

            ? `<i class="fa-solid fa-pause"></i>`

            : `<i class="fa-solid fa-play"></i>`;

}


function toggleMute() {

    if (!dom.video) {
        return;
    }


    state.isMuted =
        !state.isMuted;


    dom.video.muted =
        state.isMuted;


    dom.mute.innerHTML =
        state.isMuted

            ? `<i class="fa-solid fa-volume-xmark"></i>`

            : `<i class="fa-solid fa-volume-high"></i>`;

}


// =========================================================
// FULLSCREEN
// =========================================================

async function toggleFullscreen() {

    const target =
        dom.video ||
        dom.shortItem;


    if (!document.fullscreenElement) {

        try {

            await target.requestFullscreen();

        }

        catch (error) {

            console.error(
                error
            );

        }

    }

    else {

        await document.exitFullscreen();

    }

}


// =========================================================
// WATCH / VIEWS
// =========================================================

async function registerView() {

    if (
        state.viewStarted ||
        !state.currentShort
    ) {

        return;

    }


    state.viewStarted =
        true;

    state.watchStart =
        Date.now();


    try {

        const {
            data,
            error
        } = await supabase

            .from("short_views")

            .insert({

                short_id:
                    state.currentShort.id,

                user_id:
                    state.currentUser?.id || null,

                watch_time:
                    0,

                completed:
                    false

            })

            .select("id")

            .single();


        if (error) {
            throw error;
        }


        state.viewId =
            data?.id || null;

    }

    catch (error) {

        console.error(
            "Erreur enregistrement vue :",
            error
        );

    }

}


// =========================================================
// WATCH TIME
// =========================================================

function handleTimeUpdate() {

    if (
        !state.currentShort ||
        !dom.video
    ) {

        return;

    }


    const duration =
        dom.video.duration;


    const current =
        dom.video.currentTime;


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        return;

    }


    const percent =
        Math.min(
            100,
            (current / duration) * 100
        );


    dom.progress.style.width =
        `${percent}%`;


    const second =
        Math.floor(current);


    state.watchedSeconds =
        second;


    if (
        state.viewId &&
        second - state.lastSavedSecond >= 5
    ) {

        state.lastSavedSecond =
            second;

        saveViewProgress(
            second,
            percent
        );

    }

}


async function saveViewProgress(
    seconds,
    percent
) {

    if (!state.viewId) {
        return;
    }


    try {

        await supabase

            .from("short_views")

            .update({

                watch_time:
                    Math.floor(seconds),

                completed:
                    percent >= 90

            })

            .eq(
                "id",
                state.viewId
            );

    }

    catch (error) {

        console.error(
            "Erreur watch time :",
            error
        );

    }

}


async function saveWatchProgress() {

    if (
        !state.viewId ||
        !dom.video
    ) {

        return;

    }


    const duration =
        dom.video.duration;


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        return;

    }


    const percent =
        (
            dom.video.currentTime /
            duration
        ) * 100;


    await saveViewProgress(
        dom.video.currentTime,
        percent
    );

}


// =========================================================
// END
// =========================================================

async function handleEnded() {

    await saveViewProgress(
        dom.video.duration,
        100
    );


    nextShort();

}


// =========================================================
// LIKE
// =========================================================

async function toggleLike() {

    if (!state.currentUser) {

        navigate(
            "auth.html"
        );

        return;

    }


    if (!state.currentShort) {
        return;
    }


    try {

        const current =
            Number(
                state.currentShort.likes_count ||
                0
            );


        /*
         * Si data.js possède déjà
         * l'état réactionnel du Short,
         * setShortReaction / removeShortReaction
         * restent les fonctions centrales.
         */

        const icon =
            dom.like.querySelector("i");


        const active =
            dom.like.classList.contains(
                "active"
            );


        if (active) {

            await removeShortReaction(
                state.currentShort.id
            );

            dom.like.classList.remove(
                "active"
            );

            state.currentShort.likes_count =
                Math.max(
                    current - 1,
                    0
                );

            if (icon) {

                icon.className =
                    "fa-regular fa-thumbs-up";

            }

        }

        else {

            await setShortReaction(
                state.currentShort.id,
                "like"
            );

            dom.like.classList.add(
                "active"
            );

            state.currentShort.likes_count =
                current + 1;

            if (icon) {

                icon.className =
                    "fa-solid fa-thumbs-up";

            }

        }


        dom.likeCount.textContent =
            formatNumber(
                state.currentShort.likes_count
            );

    }

    catch (error) {

        console.error(
            "Erreur réaction Short :",
            error
        );

        showToast(
            "Impossible de modifier votre réaction."
        );

    }

}


// =========================================================
// WATCH LATER
// =========================================================

async function saveCurrentShort() {

    if (!state.currentUser) {

        navigate(
            "auth.html"
        );

        return;

    }


    if (!state.currentShort) {
        return;
    }


    try {

        /*
         * addWatchLater utilise actuellement
         * videoId.
         *
         * Le support Watch Later des Shorts
         * devra utiliser la table Short dédiée
         * si elle existe dans ton SQL.
         */

        showToast(
            "Fonction Watch Later Short à connecter à sa table dédiée."
        );

    }

    catch (error) {

        console.error(
            error
        );

    }

}


// =========================================================
// COMMENTS
// =========================================================

async function openComments() {

    if (!state.currentShort) {
        return;
    }


    dom.commentsPanel.hidden =
        false;

    dom.commentsOverlay.hidden =
        false;


    dom.commentsPanel.setAttribute(
        "aria-hidden",
        "false"
    );


    await loadComments();

}


function closeComments() {

    dom.commentsPanel.hidden =
        true;

    dom.commentsOverlay.hidden =
        true;


    dom.commentsPanel.setAttribute(
        "aria-hidden",
        "true"
    );

}


async function loadComments() {

    if (!state.currentShort) {
        return;
    }


    dom.commentsLoading.hidden =
        false;


    dom.commentsEmpty.hidden =
        true;


    try {

        const {
            data,
            error
        } = await supabase

            .from("short_comments")

            .select(`
                id,
                short_id,
                user_id,
                parent_id,
                content,
                edited,
                is_deleted,
                likes_count,
                replies_count,
                created_at,
                updated_at,
                profiles:user_id (
                    id,
                    username,
                    display_name,
                    avatar_url,
                    verified
                )
            `)

            .eq(
                "short_id",
                state.currentShort.id
            )

            .eq(
                "is_deleted",
                false
            )

            .is(
                "parent_id",
                null
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        state.comments =
            data || [];


        renderComments();


    }

    catch (error) {

        console.error(
            "Erreur commentaires :",
            error
        );

        showToast(
            "Impossible de charger les commentaires."
        );

    }

    finally {

        dom.commentsLoading.hidden =
            true;

    }

}


// =========================================================
// RENDER COMMENTS
// =========================================================

function renderComments() {

    /*
     * Supprimer uniquement les anciens
     * commentaires générés.
     */

    dom.commentsList
        .querySelectorAll(
            ".short-comment"
        )
        .forEach(
            element => element.remove()
        );


    dom.commentsTotal.textContent =
        formatNumber(
            state.currentShort?.comments_count ||
            state.comments.length
        );


    if (
        !state.comments.length
    ) {

        dom.commentsEmpty.hidden =
            false;

        return;

    }


    dom.commentsEmpty.hidden =
        true;


    for (
        const comment of state.comments
    ) {

        dom.commentsList.appendChild(
            createCommentElement(
                comment
            )
        );

    }

}


// =========================================================
// CREATE COMMENT
// =========================================================

function createCommentElement(
    comment
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "short-comment";


    article.dataset.commentId =
        comment.id;


    const profile =
        comment.profiles ||
        {};


    article.innerHTML = `

        <img
            class="short-comment-avatar"
            src="${
                escapeAttribute(
                    profile.avatar_url ||
                    "NetView_icone.png"
                )
            }"
            alt=""
        >

        <div class="short-comment-body">

            <div class="short-comment-author">

                <strong>
                    ${escapeHtml(
                        profile.display_name ||
                        profile.username ||
                        "Utilisateur"
                    )}
                </strong>

                ${
                    profile.verified
                        ? `
                            <i
                                class="fa-solid fa-circle-check"
                                aria-label="Vérifié"
                            ></i>
                        `
                        : ""
                }

                <time>
                    ${formatDate(
                        comment.created_at
                    )}
                </time>

            </div>

            <p class="short-comment-content">
                ${escapeHtml(
                    comment.content
                )}
            </p>

            <div class="short-comment-toolbar">

                <button
                    type="button"
                    data-comment-action="reply"
                    data-comment-id="${comment.id}"
                >
                    Répondre
                </button>

            </div>

        </div>

    `;


    return article;

}


// =========================================================
// SUBMIT COMMENT
// =========================================================

async function submitComment(
    event
) {

    event.preventDefault();


    if (!state.currentUser) {

        navigate(
            "auth.html"
        );

        return;

    }


    if (!state.currentShort) {
        return;
    }


    const content =
        dom.commentInput.value.trim();


    if (!content) {
        return;
    }


    dom.commentSubmit.disabled =
        true;


    try {

        const {
            data,
            error
        } = await supabase

            .from("short_comments")

            .insert({

                short_id:
                    state.currentShort.id,

                user_id:
                    state.currentUser.id,

                parent_id:
                    state.currentParentId,

                content

            })

            .select(`
                id,
                short_id,
                user_id,
                parent_id,
                content,
                edited,
                is_deleted,
                likes_count,
                replies_count,
                created_at,
                updated_at,
                profiles:user_id (
                    id,
                    username,
                    display_name,
                    avatar_url,
                    verified
                )
            `)

            .single();


        if (error) {
            throw error;
        }


        dom.commentInput.value =
            "";

        state.currentParentId =
            null;


        /*
         * Realtime ajoutera également le commentaire
         * aux autres clients.
         */

        if (data) {

            addCommentIfMissing(
                data
            );

        }


        state.currentShort.comments_count =
            Number(
                state.currentShort.comments_count ||
                0
            ) + 1;


        dom.commentCount.textContent =
            formatNumber(
                state.currentShort.comments_count
            );


        renderComments();


        showToast(
            "Commentaire publié."
        );

    }

    catch (error) {

        console.error(
            "Erreur publication commentaire :",
            error
        );

        showToast(
            "Impossible de publier le commentaire."
        );

    }

    finally {

        dom.commentSubmit.disabled =
            false;

    }

}


// =========================================================
// COMMENT EVENTS
// =========================================================

function handleDocumentClick(
    event
) {

    const button =
        event.target.closest(
            "[data-comment-action]"
        );


    if (!button) {
        return;
    }


    const action =
        button.dataset.commentAction;


    const commentId =
        button.dataset.commentId;


    if (
        action === "reply"
    ) {

        state.currentParentId =
            commentId;


        dom.commentInput.focus();

        dom.commentInput.placeholder =
            "Répondre au commentaire...";

    }

}


// =========================================================
// COMMENT REALTIME
// =========================================================

function setupRealtime() {

    state.commentsChannel =
        supabase

            .channel(
                `short-comments-${Date.now()}`
            )

            .on(

                "postgres_changes",

                {
                    event: "*",
                    schema: "public",
                    table: "short_comments"
                },

                payload => {

                    handleCommentRealtime(
                        payload
                    );

                }

            )

            .subscribe();

}


function handleCommentRealtime(
    payload
) {

    const row =
        payload.new ||
        payload.old;


    if (
        !row ||
        row.short_id !==
            state.currentShort?.id
    ) {

        return;

    }


    if (
        payload.eventType ===
        "INSERT"
    ) {

        /*
         * Les réponses ne sont pas
         * affichées dans la liste principale.
         */

        if (
            !row.parent_id
        ) {

            fetchComment(
                row.id
            );

        }


        state.currentShort.comments_count =
            Number(
                state.currentShort.comments_count ||
                0
            ) + 1;


        dom.commentCount.textContent =
            formatNumber(
                state.currentShort.comments_count
            );

    }


    if (
        payload.eventType ===
        "DELETE"
    ) {

        const element =
            document.querySelector(
                `[data-comment-id="${row.id}"]`
            );


        element?.remove();

    }

}


// =========================================================
// FETCH COMMENT
// =========================================================

async function fetchComment(
    commentId
) {

    const {
        data,
        error
    } = await supabase

        .from("short_comments")

        .select(`
            id,
            short_id,
            user_id,
            parent_id,
            content,
            edited,
            is_deleted,
            likes_count,
            replies_count,
            created_at,
            updated_at,
            profiles:user_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)

        .eq(
            "id",
            commentId
        )

        .maybeSingle();


    if (error || !data) {
        return;
    }


    addCommentIfMissing(
        data
    );


    renderComments();

}


function addCommentIfMissing(
    comment
) {

    const exists =
        state.comments.some(
            item =>
                item.id === comment.id
        );


    if (!exists) {

        state.comments.unshift(
            comment
        );

    }

}


// =========================================================
// COMMENT COUNT
// =========================================================

async function loadCommentsCount(
    short
) {

    if (
        typeof short.comments_count ===
        "number"
    ) {

        dom.commentCount.textContent =
            formatNumber(
                short.comments_count
            );

        return;

    }


    const {
        count
    } = await supabase

        .from("short_comments")

        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )

        .eq(
            "short_id",
            short.id
        )

        .eq(
            "is_deleted",
            false
        );


    const total =
        count || 0;


    short.comments_count =
        total;


    dom.commentCount.textContent =
        formatNumber(
            total
        );

}


// =========================================================
// SHARE
// =========================================================

function openShare() {

    dom.shareModal.hidden =
        false;

}


function closeShare() {

    dom.shareModal.hidden =
        true;

}


async function nativeShare() {

    const url =
        window.location.href;


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    state.currentShort?.title ||
                    "Short NetView",

                url

            });

        }

        catch {

            // utilisateur a annulé

        }

    }

    else {

        await copyShortLink();

    }

}


async function copyShortLink() {

    try {

        await navigator.clipboard.writeText(
            window.location.href
        );


        showToast(
            "Lien copié."
        );

    }

    catch {

        showToast(
            "Impossible de copier le lien."
        );

    }

}


// =========================================================
// NAVIGATION
// =========================================================

async function nextShort() {

    if (
        state.changingShort
    ) {

        return;

    }


    let nextIndex =
        state.currentIndex + 1;


    if (
        nextIndex >=
        state.shorts.length
    ) {

        await loadMoreShorts();

    }


    if (
        nextIndex >=
        state.shorts.length
    ) {

        showToast(
            "Aucun autre Short disponible."
        );

        return;

    }


    state.currentIndex =
        nextIndex;


    await displayShort(
        state.shorts[
            state.currentIndex
        ],
        true
    );

}


async function previousShort() {

    if (
        state.changingShort
    ) {

        return;

    }


    const previousIndex =
        state.currentIndex - 1;


    if (
        previousIndex < 0
    ) {

        showToast(
            "Premier Short."
        );

        return;

    }


    state.currentIndex =
        previousIndex;


    await displayShort(
        state.shorts[
            state.currentIndex
        ],
        true
    );

}


async function loadMoreShorts() {

    const page =
        Math.floor(
            state.shorts.length / 20
        ) + 1;


    try {

        const more =
            await getShorts({

                page,

                limit: 20

            });


        const existing =
            new Set(
                state.shorts.map(
                    short => short.id
                )
            );


        for (
            const short of more
        ) {

            if (
                !existing.has(short.id)
            ) {

                state.shorts.push(
                    short
                );

            }

        }

    }

    catch (error) {

        console.error(
            "Erreur pagination Shorts :",
            error
        );

    }

}


// =========================================================
// URL
// =========================================================

async function handleUrlChange() {

    const id =
        new URLSearchParams(
            window.location.search
        ).get("id");


    if (!id) {
        return;
    }


    const existingIndex =
        state.shorts.findIndex(
            short =>
                short.id === id
        );


    if (
        existingIndex !== -1
    ) {

        state.currentIndex =
            existingIndex;


        await displayShort(
            state.shorts[
                existingIndex
            ],
            false
        );

        return;

    }


    try {

        const short =
            await getShort(id);


        if (!short) {
            return;
        }


        state.shorts.push(
            short
        );

        state.currentIndex =
            state.shorts.length - 1;


        await displayShort(
            short,
            false
        );

    }

    catch (error) {

        console.error(
            error
        );

    }

}


// =========================================================
// KEYBOARD
// =========================================================

function handleKeyboard(
    event
) {

    if (
        event.target.tagName ===
            "INPUT" ||
        event.target.tagName ===
            "TEXTAREA"
    ) {

        return;

    }


    switch (
        event.key
    ) {

        case "ArrowDown":
        case "PageDown":

            event.preventDefault();

            nextShort();

            break;


        case "ArrowUp":
        case "PageUp":

            event.preventDefault();

            previousShort();

            break;


        case " ":

            event.preventDefault();

            togglePlay();

            break;


        case "m":

        case "M":

            toggleMute();

            break;

    }

}


// =========================================================
// TOUCH
// =========================================================

function handleTouchStart(
    event
) {

    state.touchStartY =
        event.changedTouches[0].clientY;

}


function handleTouchEnd(
    event
) {

    state.touchEndY =
        event.changedTouches[0].clientY;


    const difference =
        state.touchStartY -
        state.touchEndY;


    const threshold =
        70;


    if (
        Math.abs(difference) <
        threshold
    ) {

        return;

    }


    if (
        difference > 0
    ) {

        nextShort();

    }

    else {

        previousShort();

    }

}


// =========================================================
// STOP VIDEO
// =========================================================

async function stopCurrentVideo() {

    if (!dom.video) {
        return;
    }


    if (
        !dom.video.paused
    ) {

        await saveWatchProgress();

        dom.video.pause();

    }


    state.isPlaying =
        false;

}


// =========================================================
// UI STATES
// =========================================================

function showLoading() {

    dom.loading.hidden =
        false;

    dom.viewport.hidden =
        true;

    dom.empty.hidden =
        true;

    dom.error.hidden =
        true;

}


function hideLoading() {

    dom.loading.hidden =
        true;

}


function showEmpty() {

    dom.loading.hidden =
        true;

    dom.viewport.hidden =
        true;

    dom.empty.hidden =
        false;

}


function showError(
    message
) {

    dom.loading.hidden =
        true;

    dom.viewport.hidden =
        true;

    dom.empty.hidden =
        true;

    dom.error.hidden =
        false;


    dom.errorMessage.textContent =
        message ||
        "Une erreur est survenue.";

}


// =========================================================
// TOAST
// =========================================================

let toastTimer = null;


function showToast(
    message
) {

    if (!dom.toast) {
        return;
    }


    dom.toastMessage.textContent =
        message;


    dom.toast.hidden =
        false;


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                dom.toast.hidden =
                    true;

            },
            2500
        );

}


// =========================================================
// FORMAT
// =========================================================

function formatNumber(
    value
) {

    const number =
        Number(value || 0);


    return new Intl.NumberFormat(
        "fr-FR",
        {
            notation: number >= 1000
                ? "compact"
                : "standard",

            maximumFractionDigits: 1
        }
    ).format(
        number
    );

}


function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    const seconds =
        Math.floor(
            (
                Date.now() -
                date.getTime()
            ) / 1000
        );


    if (
        seconds < 60
    ) {

        return "à l'instant";

    }


    if (
        seconds < 3600
    ) {

        return `il y a ${
            Math.floor(seconds / 60)
        } min`;

    }


    if (
        seconds < 86400
    ) {

        return `il y a ${
            Math.floor(seconds / 3600)
        } h`;

    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(
        date
    );

}


// =========================================================
// SECURITY
// =========================================================

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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}
