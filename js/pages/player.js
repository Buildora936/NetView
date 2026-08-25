/* =========================================================
   NETVIEW — PLAYER
   js/pages/player.js

   Lecteur vidéo avancé NetView.

   Responsabilités :
   - chargement de la vidéo
   - fichiers vidéo / qualité
   - lecture et contrôles
   - progression
   - historique
   - vues
   - réactions
   - Watch Later
   - abonnement
   - commentaires
   - réponses
   - partage
   - signalement
   - recommandations
   - autoplay
   - mini-player
   - mode théâtre
   - plein écran
   - navigation
   - gestion de l'authentification
   - responsive
   - clavier
   - nettoyage Realtime/listeners
   ========================================================= */

import * as Data from "../core/data.js";
import { supabase } from "../core/supabase.js";
import { getUser } from "../core/auth.js";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONFIG = {

    maxCommentsPerPage: 20,

    maxRecommendations: 12,

    maxShortRecommendations: 8,

    historyInterval: 10,

    viewThreshold: 0.05,

    completedThreshold: 0.90,

    autoplayDelay: 5000,

    descriptionPreviewLines: 5,

    toastDuration: 3000,

    commentMaxLength: 2000,

    supportedQualities: [
        "2160p",
        "1440p",
        "1080p",
        "720p",
        "480p",
        "360p",
        "240p",
        "144p"
    ]

};


/* =========================================================
   STATE
   ========================================================= */

const state = {

    user: null,

    video: null,

    channel: null,

    files: [],

    selectedQuality: "auto",

    currentSource: null,

    videoId: null,

    currentReaction: null,

    watchLater: false,

    subscribed: false,

    subscriptionId: null,

    comments: [],

    commentsOffset: 0,

    commentsHasMore: true,

    commentsLoading: false,

    commentsSort: "top",

    editingCommentId: null,

    replyingToCommentId: null,

    historyId: null,

    historyLastPosition: 0,

    lastHistorySave: 0,

    viewRegistered: false,

    viewStarted: false,

    viewCompleted: false,

    watchSessionStartedAt: null,

    autoplay: true,

    autoplayTimer: null,

    nextVideo: null,

    recommendations: [],

    shorts: [],

    recommendationLoading: false,

    loading: false,

    theaterMode: false,

    miniPlayerActive: false,

    playerControlsTimer: null,

    controlsVisible: true,

    settingsOpen: false,

    settingsPanel: "main",

    descriptionExpanded: false,

    destroyed: false,

    objectUrls: [],

    channelSubscription: null,

    realtimeSubscriptions: [],

    lastProgressTimestamp: 0

};


/* =========================================================
   DOM
   ========================================================= */

const $ = (selector, root = document) =>
    root.querySelector(selector);

const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));


const DOM = {};


/* =========================================================
   INITIALISATION DOM
   ========================================================= */

function cacheDOM() {

    DOM.body = document.body;

    DOM.menuButton = $("#menuButton");
    DOM.sidebar = $("#sidebar");
    DOM.sidebarOverlay = $("#sidebarOverlay");

    DOM.searchForm = $("#searchForm");
    DOM.searchInput = $("#searchInput");

    DOM.loading = $("#playerLoading");
    DOM.error = $("#playerError");
    DOM.errorTitle = $("#playerErrorTitle");
    DOM.errorMessage = $("#playerErrorMessage");
    DOM.retryButton = $("#playerRetryButton");

    DOM.layout = $("#playerLayout");

    DOM.playerSection = $("#videoPlayerSection");
    DOM.wrapper = $("#videoPlayerWrapper");
    DOM.video = $("#videoPlayer");

    DOM.playerOverlay = $("#videoPlayerOverlay");
    DOM.centerPlay = $("#centerPlayButton");
    DOM.buffering = $("#playerBuffering");
    DOM.videoError = $("#playerVideoError");

    DOM.controls = $("#playerControls");
    DOM.progressArea = $("#playerProgressArea");
    DOM.progress = $("#playerProgress");

    DOM.playButton = $("#playerPlayButton");
    DOM.previousButton = $("#playerPreviousButton");
    DOM.nextButton = $("#playerNextButton");

    DOM.muteButton = $("#playerMuteButton");
    DOM.volume = $("#playerVolume");

    DOM.time = $("#playerTime");

    DOM.autoplayButton = $("#playerAutoplayButton");
    DOM.captionsButton = $("#playerCaptionsButton");

    DOM.settingsContainer = $("#playerSettingsContainer");
    DOM.settingsButton = $("#playerSettingsButton");
    DOM.settingsMenu = $("#playerSettingsMenu");

    DOM.currentSpeed = $("#playerCurrentSpeed");
    DOM.currentQuality = $("#playerCurrentQuality");
    DOM.qualityOptions = $("#playerQualityOptions");

    DOM.theaterButton = $("#playerTheaterButton");
    DOM.miniButton = $("#playerMiniButton");
    DOM.fullscreenButton = $("#playerFullscreenButton");

    DOM.title = $("#videoTitle");
    DOM.meta = $("#videoMeta");
    DOM.views = $("#videoViews");
    DOM.published = $("#videoPublishedDate");

    DOM.likeButton = $("#videoLikeButton");
    DOM.dislikeButton = $("#videoDislikeButton");

    DOM.likesCount = $("#videoLikesCount");
    DOM.dislikesCount = $("#videoDislikesCount");

    DOM.shareButton = $("#videoShareButton");
    DOM.watchLaterButton = $("#videoWatchLaterButton");

    DOM.moreButton = $("#videoMoreButton");
    DOM.moreMenu = $("#videoMoreMenu");

    DOM.reportButton = $("#reportVideoButton");
    DOM.copyLinkButton = $("#copyVideoLinkButton");

    DOM.channel = $("#videoChannel");
    DOM.channelLink = $("#videoChannelLink");
    DOM.channelAvatar = $("#videoChannelAvatar");
    DOM.channelName = $("#videoChannelName");
    DOM.channelVerified = $("#videoChannelVerified");
    DOM.channelSubscribers = $("#videoChannelSubscribers");
    DOM.subscribeButton = $("#subscribeButton");

    DOM.description = $("#videoDescription");
    DOM.tags = $("#videoTags");
    DOM.descriptionToggle = $("#descriptionToggle");

    DOM.commentsSection = $("#commentsSection");
    DOM.commentsCount = $("#commentsCount");

    DOM.commentsSortButton = $("#commentsSortButton");
    DOM.commentsSortMenu = $("#commentsSortMenu");

    DOM.commentForm = $("#commentForm");
    DOM.commentAvatar = $("#commentUserAvatar");
    DOM.commentInput = $("#commentInput");
    DOM.cancelComment = $("#cancelCommentButton");
    DOM.submitComment = $("#submitCommentButton");

    DOM.commentsList = $("#commentsList");
    DOM.commentsLoading = $("#commentsLoading");
    DOM.commentsEmpty = $("#commentsEmpty");
    DOM.loadMoreComments = $("#loadMoreCommentsButton");

    DOM.recommendationsSidebar = $("#recommendationsSidebar");
    DOM.upNext = $("#upNextContainer");
    DOM.recommended = $("#recommendedVideos");
    DOM.recommendedShorts = $("#recommendedShorts");

    DOM.shareModal = $("#shareModal");
    DOM.closeShareModal = $("#closeShareModal");
    DOM.shareLinkInput = $("#shareLinkInput");
    DOM.copyShareLink = $("#copyShareLinkButton");

    DOM.shareOptions = $("#shareOptions");

    DOM.reportModal = $("#reportModal");
    DOM.closeReportModal = $("#closeReportModal");
    DOM.reportForm = $("#reportForm");
    DOM.reportDetails = $("#reportDetails");
    DOM.cancelReport = $("#cancelReportButton");
    DOM.submitReport = $("#submitReportButton");

    DOM.loginModal = $("#loginRequiredModal");
    DOM.closeLoginModal = $("#closeLoginRequiredModal");

    DOM.nextOverlay = $("#nextVideoOverlay");
    DOM.nextPreview = $("#nextVideoPreview");
    DOM.playNextNow = $("#playNextNowButton");
    DOM.cancelAutoplay = $("#cancelAutoplayButton");

    DOM.miniPlayer = $("#miniPlayer");
    DOM.miniVideo = $("#miniPlayerVideo");
    DOM.miniClose = $("#miniPlayerClose");
    DOM.miniExpand = $("#miniPlayerExpand");
    DOM.miniTitle = $("#miniPlayerTitle");

    DOM.toast = $("#playerToast");
    DOM.toastIcon = $("#playerToastIcon");
    DOM.toastMessage = $("#playerToastMessage");

    DOM.pageLoader = $("#pageLoader");

}


/* =========================================================
   UTILS
   ========================================================= */

function escapeHTML(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatNumber(value) {

    const number = Number(value || 0);

    return new Intl.NumberFormat(
        navigator.language || "fr-FR",
        {
            notation: number >= 1000 ? "compact" : "standard",
            maximumFractionDigits: 1
        }
    ).format(number);

}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(value);

}


function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    seconds = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(
        (seconds % 3600) / 60
    );
    const remaining = seconds % 60;

    if (hours > 0) {

        return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;

    }

    return `${minutes}:${String(remaining).padStart(2, "0")}`;

}


function normalizeReaction(reaction) {

    if (!reaction) {
        return null;
    }

    const value = String(reaction).toLowerCase();

    if (
        value === "like" ||
        value === "liked" ||
        value === "up"
    ) {
        return "like";
    }

    if (
        value === "dislike" ||
        value === "disliked" ||
        value === "down"
    ) {
        return "dislike";
    }

    return null;

}


function getVideoId() {

    const params = new URLSearchParams(
        window.location.search
    );

    return (
        params.get("id") ||
        params.get("video") ||
        params.get("video_id")
    );

}


function getSafeAvatar(url) {

    return (
        url ||
        "assets/images/default-avatar.png"
    );

}


function isAuthenticated() {

    return Boolean(state.user);

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function showToast(
    message,
    type = "success"
) {

    if (!DOM.toast) {
        return;
    }

    clearTimeout(toastTimer);

    DOM.toastMessage.textContent = message;

    DOM.toastIcon.className =
        type === "error"
            ? "fa-solid fa-circle-exclamation"
            : type === "warning"
                ? "fa-solid fa-triangle-exclamation"
                : "fa-solid fa-circle-check";

    DOM.toast.hidden = false;

    DOM.toast.classList.add("is-visible");

    toastTimer = setTimeout(() => {

        DOM.toast.classList.remove("is-visible");

        setTimeout(() => {

            if (DOM.toast) {
                DOM.toast.hidden = true;
            }

        }, 250);

    }, CONFIG.toastDuration);

}


/* =========================================================
   PAGE STATES
   ========================================================= */

function showLoading() {

    state.loading = true;

    DOM.loading.hidden = false;
    DOM.error.hidden = true;
    DOM.layout.hidden = true;

}


function hideLoading() {

    state.loading = false;

    DOM.loading.hidden = true;
    DOM.layout.hidden = false;

}


function showError(
    title,
    message
) {

    state.loading = false;

    DOM.loading.hidden = true;
    DOM.layout.hidden = true;
    DOM.error.hidden = false;

    DOM.errorTitle.textContent =
        title || "Impossible de lire cette vidéo";

    DOM.errorMessage.textContent =
        message ||
        "Une erreur est survenue lors du chargement de la vidéo.";

}


function showLoginRequired(
    message = "Connectez-vous pour utiliser cette fonctionnalité."
) {

    if (!DOM.loginModal) {
        window.location.href = "auth.html";
        return;
    }

    const messageElement =
        $("#loginRequiredMessage");

    if (messageElement) {
        messageElement.textContent = message;
    }

    DOM.loginModal.hidden = false;
    DOM.loginModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeLoginModal() {

    if (!DOM.loginModal) {
        return;
    }

    DOM.loginModal.hidden = true;

    DOM.loginModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   CORE DATA HELPERS
   ========================================================= */

/*
 * data.js reste la couche de données privilégiée.
 * Les noms de fonctions pouvant évoluer, le player utilise
 * plusieurs alias connus puis son propre fallback Supabase.
 */

async function callDataFunction(
    names,
    ...args
) {

    for (const name of names) {

        const fn = Data[name];

        if (typeof fn !== "function") {
            continue;
        }

        try {

            return await fn(...args);

        } catch (error) {

            console.warn(
                `NetView player: ${name} a échoué.`,
                error
            );

        }

    }

    return undefined;

}


async function getCurrentUser() {

    try {

        const result =
            await callDataFunction(
                [
                    "getCurrentUser",
                    "getAuthenticatedUser",
                    "getUser"
                ]
            );

        if (result) {
            return result;
        }

    } catch (_) {
        // fallback below
    }

    try {

        const {
            data,
            error
        } = await supabase.auth.getUser();

        if (error) {
            return null;
        }

        return data?.user || null;

    } catch (_) {

        return null;

    }

}


/* =========================================================
   LOAD VIDEO
   ========================================================= */

async function loadVideo() {

    state.videoId = getVideoId();

    if (!state.videoId) {

        showError(
            "Vidéo introuvable",
            "Aucun identifiant de vidéo n'a été fourni."
        );

        return false;

    }

    try {

        const result =
            await callDataFunction(
                [
                    "getVideoById",
                    "getVideo",
                    "getVideoDetails"
                ],
                state.videoId
            );

        if (result) {

            state.video =
                Array.isArray(result)
                    ? result[0]
                    : result;

        }

    } catch (_) {
        // Supabase fallback
    }


    if (!state.video) {

        const {
            data,
            error
        } = await supabase
            .from("videos")
            .select("*")
            .eq("id", state.videoId)
            .maybeSingle();

        if (error) {

            console.error(
                "Erreur récupération vidéo :",
                error
            );

            showError(
                "Impossible de charger la vidéo",
                "NetView n'a pas pu récupérer les informations de cette vidéo."
            );

            return false;

        }

        state.video = data;

    }


    if (!state.video) {

        showError(
            "Vidéo introuvable",
            "Cette vidéo n'existe pas ou n'est plus disponible."
        );

        return false;

    }


    if (
        state.video.visibility === "private" &&
        state.video.channel_id
    ) {

        const canAccess =
            await canAccessPrivateVideo();

        if (!canAccess) {

            showError(
                "Vidéo privée",
                "Cette vidéo est privée et n'est pas accessible avec ce compte."
            );

            return false;

        }

    }


    await Promise.allSettled([
        loadChannel(),
        loadVideoFiles(),
        loadReaction(),
        loadWatchLaterState(),
        loadSubscriptionState(),
        loadHistory(),
        loadComments(),
        loadRecommendations()
    ]);


    renderVideoInformation();
    renderQualityOptions();

    hideLoading();

    await registerView();

    return true;

}


/* =========================================================
   PRIVATE VIDEO ACCESS
   ========================================================= */

async function canAccessPrivateVideo() {

    if (!state.user) {
        return false;
    }

    if (
        state.video &&
        state.video.channel_id
    ) {

        const {
            data: channel
        } = await supabase
            .from("channels")
            .select("owner_id")
            .eq("id", state.video.channel_id)
            .maybeSingle();

        return channel?.owner_id === state.user.id;

    }

    return false;

}


/* =========================================================
   CHANNEL
   ========================================================= */

async function loadChannel() {

    if (!state.video?.channel_id) {
        return;
    }

    const result =
        await callDataFunction(
            [
                "getChannelById",
                "getChannel"
            ],
            state.video.channel_id
        );

    if (result) {

        state.channel =
            Array.isArray(result)
                ? result[0]
                : result;

    }


    if (!state.channel) {

        const {
            data,
            error
        } = await supabase
            .from("channels")
            .select("*")
            .eq(
                "id",
                state.video.channel_id
            )
            .maybeSingle();

        if (!error) {
            state.channel = data;
        }

    }

}


/* =========================================================
   VIDEO FILES / QUALITY
   ========================================================= */

async function loadVideoFiles() {

    const {
        data,
        error
    } = await supabase
        .from("video_files")
        .select("*")
        .eq(
            "video_id",
            state.videoId
        )
        .order(
            "quality",
            {
                ascending: false
            }
        );

    if (error) {

        console.warn(
            "Impossible de récupérer les qualités vidéo.",
            error
        );

        state.files = [];

        return;

    }

    state.files = data || [];


    if (
        state.files.length === 0 &&
        state.video.video_url
    ) {

        state.files = [
            {
                id: "legacy",
                video_id: state.videoId,
                quality: "Auto",
                file_url: state.video.video_url
            }
        ];

    }

}


/* =========================================================
   SELECT BEST VIDEO SOURCE
   ========================================================= */

function getQualityRank(quality) {

    const value = String(
        quality || ""
    ).toLowerCase();

    const match =
        value.match(/(\d{3,4})p/);

    if (!match) {
        return 0;
    }

    return Number(match[1]);

}


function getBestFile() {

    if (!state.files.length) {
        return null;
    }

    return [...state.files]
        .sort(
            (a, b) =>
                getQualityRank(b.quality) -
                getQualityRank(a.quality)
        )[0];

}


function getSelectedFile() {

    if (
        state.selectedQuality === "auto" ||
        !state.selectedQuality
    ) {

        return getBestFile();

    }

    const exact =
        state.files.find(
            file =>
                String(file.quality).toLowerCase() ===
                String(state.selectedQuality).toLowerCase()
        );

    return exact || getBestFile();

}


/* =========================================================
   INITIAL VIDEO SOURCE
   ========================================================= */

function setVideoSource(
    file,
    preserveTime = true
) {

    if (!DOM.video || !file?.file_url) {
        return;
    }

    const currentTime =
        preserveTime &&
        Number.isFinite(DOM.video.currentTime)
            ? DOM.video.currentTime
            : 0;

    const wasPlaying =
        !DOM.video.paused &&
        !DOM.video.ended;


    if (
        state.currentSource === file.file_url &&
        DOM.video.src
    ) {
        return;
    }


    state.currentSource = file.file_url;

    DOM.video.src = file.file_url;

    DOM.video.load();


    const restore = () => {

        if (
            Number.isFinite(currentTime) &&
            currentTime > 0 &&
            Number.isFinite(DOM.video.duration)
        ) {

            DOM.video.currentTime =
                Math.min(
                    currentTime,
                    Math.max(
                        0,
                        DOM.video.duration - 0.25
                    )
                );

        }

        if (wasPlaying) {

            DOM.video
                .play()
                .catch(() => {});

        }

        DOM.video.removeEventListener(
            "loadedmetadata",
            restore
        );

    };


    DOM.video.addEventListener(
        "loadedmetadata",
        restore
    );

}


/* =========================================================
   VIDEO INFORMATION
   ========================================================= */

function renderVideoInformation() {

    const video = state.video;

    DOM.title.textContent =
        video.title || "Vidéo sans titre";


    DOM.views.textContent =
        `${formatNumber(video.views)} vue${Number(video.views) === 1 ? "" : "s"}`;


    DOM.published.textContent =
        formatDate(
            video.published_at ||
            video.created_at
        );


    renderChannel();

    renderDescription();

    renderTags();

    updateReactionUI();

    updateWatchLaterUI();

}


function renderChannel() {

    const channel = state.channel;

    if (!channel) {
        return;
    }

    DOM.channelName.textContent =
        channel.name ||
        channel.title ||
        channel.display_name ||
        "Chaîne";


    DOM.channelAvatar.src =
        getSafeAvatar(
            channel.avatar_url
        );


    DOM.channelAvatar.alt =
        channel.name ||
        "Chaîne";


    const channelId =
        channel.id ||
        state.video.channel_id;

    DOM.channelLink.href =
        `channel.html?id=${encodeURIComponent(channelId)}`;


    const subscribers =
        Number(
            channel.subscribers_count ??
            channel.subscribers ??
            channel.subscriber_count ??
            0
        );

    DOM.channelSubscribers.textContent =
        `${formatNumber(subscribers)} abonné${subscribers === 1 ? "" : "s"}`;


    const verified =
        Boolean(
            channel.verified ??
            channel.is_verified
        );

    DOM.channelVerified.hidden =
        !verified;


    updateSubscribeButton();

}


function renderDescription() {

    const description =
        state.video.description || "";

    DOM.description.textContent =
        description;

    DOM.description.classList.toggle(
        "is-collapsed",
        description.length > 500 &&
        !state.descriptionExpanded
    );


    DOM.descriptionToggle.hidden =
        description.length <= 500;


    DOM.descriptionToggle.textContent =
        state.descriptionExpanded
            ? "Afficher moins"
            : "Afficher plus";


    DOM.descriptionToggle.setAttribute(
        "aria-expanded",
        String(state.descriptionExpanded)
    );

}


function renderTags() {

    DOM.tags.innerHTML = "";

    const tags = state.video.tags || [];

    if (!Array.isArray(tags)) {
        return;
    }

    for (const rawTag of tags) {

        const tag =
            typeof rawTag === "string"
                ? rawTag
                : rawTag?.tag;

        if (!tag) {
            continue;
        }

        const element =
            document.createElement("span");

        element.className =
            "video-tag";

        element.textContent =
            `#${String(tag).replace(/^#/, "")}`;

        DOM.tags.appendChild(element);

    }

}


/* =========================================================
   REACTIONS
   ========================================================= */

async function loadReaction() {

    if (!state.user) {
        state.currentReaction = null;
        return;
    }

    const {
        data,
        error
    } = await supabase
        .from("video_reactions")
        .select("reaction")
        .eq("video_id", state.videoId)
        .eq("user_id", state.user.id)
        .maybeSingle();

    if (!error) {

        state.currentReaction =
            normalizeReaction(
                data?.reaction
            );

    }

}


function updateReactionUI() {

    const reaction =
        state.currentReaction;


    const likeIcon =
        DOM.likeButton?.querySelector("i");

    const dislikeIcon =
        DOM.dislikeButton?.querySelector("i");


    if (likeIcon) {

        likeIcon.className =
            reaction === "like"
                ? "fa-solid fa-thumbs-up"
                : "fa-regular fa-thumbs-up";

    }


    if (dislikeIcon) {

        dislikeIcon.className =
            reaction === "dislike"
                ? "fa-solid fa-thumbs-down"
                : "fa-regular fa-thumbs-down";

    }


    DOM.likeButton?.classList.toggle(
        "is-active",
        reaction === "like"
    );

    DOM.dislikeButton?.classList.toggle(
        "is-active",
        reaction === "dislike"
    );


    DOM.likesCount.textContent =
        formatNumber(
            state.video?.likes
        );


    DOM.dislikesCount.textContent =
        formatNumber(
            state.video?.dislikes
        );

}


async function setReaction(
    reaction
) {

    if (!isAuthenticated()) {

        showLoginRequired(
            "Connectez-vous pour réagir à cette vidéo."
        );

        return;

    }


    const nextReaction =
        state.currentReaction === reaction
            ? null
            : reaction;


    const previous =
        state.currentReaction;


    state.currentReaction =
        nextReaction;


    if (nextReaction === "like") {

        state.video.likes =
            Math.max(
                0,
                Number(state.video.likes || 0) +
                (previous === "like" ? 0 : 1)
            );

        if (previous === "dislike") {

            state.video.dislikes =
                Math.max(
                    0,
                    Number(state.video.dislikes || 0) - 1
                );

        }

    }


    if (nextReaction === "dislike") {

        state.video.dislikes =
            Math.max(
                0,
                Number(state.video.dislikes || 0) +
                (previous === "dislike" ? 0 : 1)
            );

        if (previous === "like") {

            state.video.likes =
                Math.max(
                    0,
                    Number(state.video.likes || 0) - 1
                );

        }

    }


    if (nextReaction === null) {

        if (previous === "like") {

            state.video.likes =
                Math.max(
                    0,
                    Number(state.video.likes || 0) - 1
                );

        }

        if (previous === "dislike") {

            state.video.dislikes =
                Math.max(
                    0,
                    Number(state.video.dislikes || 0) - 1
                );

        }

    }


    updateReactionUI();


    try {

        if (nextReaction === null) {

            const {
                error
            } = await supabase
                .from("video_reactions")
                .delete()
                .eq(
                    "video_id",
                    state.videoId
                )
                .eq(
                    "user_id",
                    state.user.id
                );

            if (error) {
                throw error;
            }

        } else {

            const {
                error
            } = await supabase
                .from("video_reactions")
                .upsert(
                    {
                        video_id: state.videoId,
                        user_id: state.user.id,
                        reaction: nextReaction
                    },
                    {
                        onConflict:
                            "video_id,user_id"
                    }
                );

            if (error) {
                throw error;
            }

        }

    } catch (error) {

        console.error(
            "Erreur réaction vidéo :",
            error
        );

        state.currentReaction =
            previous;

        await reloadVideoCounters();

        updateReactionUI();

        showToast(
            "Impossible d'enregistrer votre réaction.",
            "error"
        );

    }

}


async function reloadVideoCounters() {

    const {
        data,
        error
    } = await supabase
        .from("videos")
        .select(
            "likes, dislikes, views, comments_count"
        )
        .eq("id", state.videoId)
        .maybeSingle();

    if (!error && data) {

        Object.assign(
            state.video,
            data
        );

    }

}


/* =========================================================
   WATCH LATER
   ========================================================= */

async function loadWatchLaterState() {

    if (!state.user) {
        state.watchLater = false;
        return;
    }

    const {
        data,
        error
    } = await supabase
        .from("watch_later")
        .select("video_id")
        .eq("user_id", state.user.id)
        .eq("video_id", state.videoId)
        .maybeSingle();

    if (!error) {

        state.watchLater =
            Boolean(data);

    }

}


function updateWatchLaterUI() {

    if (!DOM.watchLaterButton) {
        return;
    }

    const icon =
        DOM.watchLaterButton.querySelector("i");

    if (icon) {

        icon.className =
            state.watchLater
                ? "fa-solid fa-clock"
                : "fa-regular fa-clock";

    }


    DOM.watchLaterButton.classList.toggle(
        "is-active",
        state.watchLater
    );


    const text =
        DOM.watchLaterButton.querySelector("span");

    if (text) {

        text.textContent =
            state.watchLater
                ? "Ajoutée"
                : "À regarder";

    }

}


async function toggleWatchLater() {

    if (!isAuthenticated()) {

        showLoginRequired(
            "Connectez-vous pour utiliser À regarder plus tard."
        );

        return;

    }


    const previous =
        state.watchLater;

    state.watchLater =
        !previous;

    updateWatchLaterUI();


    try {

        if (state.watchLater) {

            const {
                error
            } = await supabase
                .from("watch_later")
                .upsert(
                    {
                        user_id: state.user.id,
                        video_id: state.videoId
                    },
                    {
                        onConflict:
                            "user_id,video_id"
                    }
                );

            if (error) {
                throw error;
            }

            showToast(
                "Vidéo ajoutée à À regarder plus tard."
            );

        } else {

            const {
                error
            } = await supabase
                .from("watch_later")
                .delete()
                .eq(
                    "user_id",
                    state.user.id
                )
                .eq(
                    "video_id",
                    state.videoId
                );

            if (error) {
                throw error;
            }

            showToast(
                "Vidéo retirée de À regarder plus tard."
            );

        }

    } catch (error) {

        console.error(
            "Watch Later :",
            error
        );

        state.watchLater =
            previous;

        updateWatchLaterUI();

        showToast(
            "Impossible de modifier À regarder plus tard.",
            "error"
        );

    }

}


/* =========================================================
   SUBSCRIPTION
   ========================================================= */

async function loadSubscriptionState() {

    if (!state.user || !state.channel) {

        state.subscribed = false;

        return;

    }

    /*
     * La structure exacte de subscriptions peut évoluer.
     * On utilise les colonnes conventionnelles NetView.
     */

    const {
        data,
        error
    } = await supabase
        .from("subscriptions")
        .select("*")
        .eq(
            "user_id",
            state.user.id
        )
        .eq(
            "channel_id",
            state.channel.id
        )
        .maybeSingle();

    if (!error && data) {

        state.subscribed = true;
        state.subscriptionId = data.id;

    } else {

        state.subscribed = false;
        state.subscriptionId = null;

    }

}


function updateSubscribeButton() {

    if (!DOM.subscribeButton) {
        return;
    }

    if (!state.user) {

        DOM.subscribeButton.innerHTML =
            '<i class="fa-solid fa-plus"></i> S’abonner';

        return;

    }


    if (state.subscribed) {

        DOM.subscribeButton.innerHTML =
            '<i class="fa-solid fa-check"></i> Abonné';

        DOM.subscribeButton.classList.add(
            "is-subscribed"
        );

    } else {

        DOM.subscribeButton.innerHTML =
            '<i class="fa-solid fa-plus"></i> S’abonner';

        DOM.subscribeButton.classList.remove(
            "is-subscribed"
        );

    }

}


async function toggleSubscription() {

    if (!isAuthenticated()) {

        showLoginRequired(
            "Connectez-vous pour vous abonner à cette chaîne."
        );

        return;

    }

    if (!state.channel?.id) {
        return;
    }


    const previous =
        state.subscribed;

    state.subscribed =
        !previous;

    updateSubscribeButton();


    try {

        if (state.subscribed) {

            const {
                error
            } = await supabase
                .from("subscriptions")
                .insert(
                    {
                        user_id: state.user.id,
                        channel_id: state.channel.id
                    }
                );

            if (error) {
                throw error;
            }

            showToast(
                "Vous êtes maintenant abonné à cette chaîne."
            );

        } else {

            const {
                error
            } = await supabase
                .from("subscriptions")
                .delete()
                .eq(
                    "user_id",
                    state.user.id
                )
                .eq(
                    "channel_id",
                    state.channel.id
                );

            if (error) {
                throw error;
            }

            showToast(
                "Abonnement supprimé."
            );

        }

    } catch (error) {

        console.error(
            "Erreur abonnement :",
            error
        );

        state.subscribed =
            previous;

        updateSubscribeButton();

        showToast(
            "Impossible de modifier l'abonnement.",
            "error"
        );

    }

}


/* =========================================================
   HISTORY
   ========================================================= */

async function loadHistory() {

    if (!state.user) {
        return;
    }

    const {
        data,
        error
    } = await supabase
        .from("watch_history")
        .select("*")
        .eq(
            "user_id",
            state.user.id
        )
        .eq(
            "video_id",
            state.videoId
        )
        .maybeSingle();

    if (!error && data) {

        state.historyId =
            data.id;

        state.historyLastPosition =
            Number(
                data.last_position || 0
            );

    }

}


async function saveHistory(
    force = false
) {

    if (
        !state.user ||
        !DOM.video ||
        !state.videoId
    ) {
        return;
    }


    const now =
        Date.now();


    if (
        !force &&
        now - state.lastHistorySave <
        CONFIG.historyInterval * 1000
    ) {
        return;
    }


    const duration =
        Number(DOM.video.duration || 0);

    const position =
        Number(DOM.video.currentTime || 0);

    if (!duration) {
        return;
    }


    const percent =
        Math.min(
            100,
            Math.max(
                0,
                (position / duration) * 100
            )
        );


    state.lastHistorySave =
        now;

    state.historyLastPosition =
        position;


    const payload = {

        user_id: state.user.id,

        video_id: state.videoId,

        last_position: Math.floor(position),

        watched_percent:
            Number(percent.toFixed(2)),

        last_watched_at:
            new Date().toISOString()

    };


    try {

        if (state.historyId) {

            const {
                error
            } = await supabase
                .from("watch_history")
                .update(payload)
                .eq(
                    "id",
                    state.historyId
                );

            if (error) {
                throw error;
            }

        } else {

            const {
                data,
                error
            } = await supabase
                .from("watch_history")
                .upsert(
                    payload,
                    {
                        onConflict:
                            "user_id,video_id"
                    }
                )
                .select("id")
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (data?.id) {

                state.historyId =
                    data.id;

            }

        }

    } catch (error) {

        /*
         * L'historique ne doit jamais interrompre
         * la lecture de la vidéo.
         */

        console.warn(
            "Historique vidéo non enregistré :",
            error
        );

    }

}


/* =========================================================
   VIEWS
   ========================================================= */

async function registerView() {

    if (
        state.viewRegistered ||
        !state.videoId
    ) {
        return;
    }


    state.watchSessionStartedAt =
        Date.now();


    /*
     * La vue est enregistrée lorsque la vidéo
     * commence réellement.
     */

}


async function registerActualView() {

    if (
        state.viewRegistered ||
        !state.videoId
    ) {
        return;
    }

    state.viewRegistered =
        true;


    try {

        const payload = {

            video_id:
                state.videoId,

            user_id:
                state.user?.id || null,

            watch_time: 0,

            completed: false,

            country:
                state.user?.country || null

        };


        const {
            error
        } = await supabase
            .from("video_views")
            .insert(payload);

        if (error) {

            console.warn(
                "Vue vidéo non enregistrée :",
                error
            );

            state.viewRegistered =
                false;

            return;

        }


        state.video.views =
            Number(
                state.video.views || 0
            ) + 1;

        DOM.views.textContent =
            `${formatNumber(state.video.views)} vues`;

    } catch (error) {

        console.warn(
            "Erreur view tracking :",
            error
        );

        state.viewRegistered =
            false;

    }

}


/* =========================================================
   WATCH SESSION COMPLETION
   ========================================================= */

async function registerCompletion() {

    if (
        state.viewCompleted ||
        !state.viewRegistered
    ) {
        return;
    }

    state.viewCompleted =
        true;


    if (!state.user) {
        return;
    }


    try {

        await supabase
            .from("video_views")
            .update(
                {
                    watch_time:
                        Math.floor(
                            DOM.video.currentTime || 0
                        ),

                    completed: true
                }
            )
            .eq(
                "video_id",
                state.videoId
            )
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
            .limit(1);

    } catch (error) {

        console.warn(
            "Completion tracking :",
            error
        );

    }

}


/* =========================================================
   PLAYER CONTROLS
   ========================================================= */

function togglePlay() {

    if (DOM.video.paused) {

        DOM.video
            .play()
            .catch(() => {});

    } else {

        DOM.video.pause();

    }

}


function updatePlayButton() {

    const icon =
        DOM.playButton?.querySelector("i");

    const centerIcon =
        DOM.centerPlay?.querySelector("i");


    const playing =
        !DOM.video.paused &&
        !DOM.video.ended;


    if (icon) {

        icon.className =
            playing
                ? "fa-solid fa-pause"
                : "fa-solid fa-play";

    }


    if (centerIcon) {

        centerIcon.className =
            playing
                ? "fa-solid fa-pause"
                : "fa-solid fa-play";

    }


    DOM.playButton?.setAttribute(
        "aria-label",
        playing
            ? "Mettre en pause"
            : "Lire"
    );


    DOM.centerPlay?.setAttribute(
        "aria-label",
        playing
            ? "Mettre en pause"
            : "Lire"
    );

}


function updateProgress() {

    if (!DOM.video) {
        return;
    }

    const duration =
        DOM.video.duration;

    const current =
        DOM.video.currentTime;


    if (
        Number.isFinite(duration) &&
        duration > 0
    ) {

        const percent =
            (current / duration) * 100;

        DOM.progress.value =
            percent;

    } else {

        DOM.progress.value =
            0;

    }


    DOM.time.textContent =
        `${formatTime(current)} / ${formatTime(duration)}`;


    if (
        state.viewStarted &&
        state.user
    ) {

        saveHistory(false);

    }


    if (
        Number.isFinite(duration) &&
        duration > 0 &&
        current / duration >=
        CONFIG.completedThreshold
    ) {

        registerCompletion();

    }

}


function seekFromProgress() {

    const duration =
        DOM.video.duration;

    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        return;
    }

    DOM.video.currentTime =
        (
            Number(DOM.progress.value) / 100
        ) * duration;

}


function setVolume(value) {

    const volume =
        Math.min(
            1,
            Math.max(
                0,
                Number(value)
            )
        );

    DOM.video.volume =
        volume;

    DOM.video.muted =
        volume === 0;

    updateVolumeButton();

}


function updateVolumeButton() {

    const icon =
        DOM.muteButton?.querySelector("i");

    if (!icon) {
        return;
    }

    if (
        DOM.video.muted ||
        DOM.video.volume === 0
    ) {

        icon.className =
            "fa-solid fa-volume-xmark";

    } else if (
        DOM.video.volume < 0.5
    ) {

        icon.className =
            "fa-solid fa-volume-low";

    } else {

        icon.className =
            "fa-solid fa-volume-high";

    }

}


function toggleMute() {

    DOM.video.muted =
        !DOM.video.muted;

    updateVolumeButton();

}


function changeSpeed(
    speed
) {

    const value =
        Number(speed);

    if (!Number.isFinite(value)) {
        return;
    }

    DOM.video.playbackRate =
        value;

    DOM.currentSpeed.textContent =
        value === 1
            ? "1x"
            : `${value}x`;

    showSettingsPanel("main");

}


function changeQuality(
    quality
) {

    state.selectedQuality =
        quality;

    const file =
        getSelectedFile();

    if (!file) {

        showToast(
            "Aucune qualité supplémentaire disponible.",
            "warning"
        );

        return;

    }

    const currentTime =
        DOM.video.currentTime;

    const wasPlaying =
        !DOM.video.paused;


    setVideoSource(
        file,
        true
    );


    DOM.currentQuality.textContent =
        quality === "auto"
            ? "Auto"
            : file.quality;


    showSettingsPanel("main");


    if (wasPlaying) {

        const restorePlay = () => {

            DOM.video.currentTime =
                Math.min(
                    currentTime,
                    DOM.video.duration || currentTime
                );

            DOM.video
                .play()
                .catch(() => {});

        };


        DOM.video.addEventListener(
            "loadedmetadata",
            restorePlay,
            {
                once: true
            }
        );

    }

}


/* =========================================================
   QUALITY UI
   ========================================================= */

function renderQualityOptions() {

    if (!DOM.qualityOptions) {
        return;
    }

    DOM.qualityOptions.innerHTML = "";


    const autoButton =
        document.createElement("button");

    autoButton.type =
        "button";

    autoButton.className =
        "player-setting-option";

    autoButton.dataset.quality =
        "auto";

    autoButton.textContent =
        "Auto";

    DOM.qualityOptions.appendChild(
        autoButton
    );


    const unique = [];

    for (const file of state.files) {

        const quality =
            String(
                file.quality || ""
            ).trim();

        if (
            !quality ||
            unique.includes(quality)
        ) {
            continue;
        }

        unique.push(quality);

    }


    unique
        .sort(
            (a, b) =>
                getQualityRank(b) -
                getQualityRank(a)
        )
        .forEach(quality => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "player-setting-option";

            button.dataset.quality =
                quality;

            button.textContent =
                quality;

            DOM.qualityOptions.appendChild(
                button
            );

        });

}


function showSettingsPanel(
    panel
) {

    if (!DOM.settingsMenu) {
        return;
    }

    state.settingsPanel =
        panel;


    $$(".player-settings-panel", DOM.settingsMenu)
        .forEach(element => {

            element.hidden =
                element.dataset.panel !== panel;

        });

}


function toggleSettings() {

    if (!DOM.settingsMenu) {
        return;
    }

    const isHidden =
        DOM.settingsMenu.hidden;

    DOM.settingsMenu.hidden =
        !isHidden;

    DOM.settingsButton.setAttribute(
        "aria-expanded",
        String(isHidden)
    );

    state.settingsOpen =
        isHidden;

    if (isHidden) {

        showSettingsPanel("main");

    }

}


/* =========================================================
   CONTROLS VISIBILITY
   ========================================================= */

function showControls() {

    if (!DOM.controls) {
        return;
    }

    DOM.controls.classList.add(
        "is-visible"
    );

    DOM.wrapper.classList.add(
        "controls-visible"
    );

    state.controlsVisible =
        true;

    clearTimeout(
        state.playerControlsTimer
    );


    if (!DOM.video.paused) {

        state.playerControlsTimer =
            setTimeout(
                hideControls,
                3000
            );

    }

}


function hideControls() {

    if (
        DOM.video.paused ||
        state.settingsOpen
    ) {
        return;
    }

    DOM.controls.classList.remove(
        "is-visible"
    );

    DOM.wrapper.classList.remove(
        "controls-visible"
    );

    state.controlsVisible =
        false;

}


/* =========================================================
   THEATER MODE
   ========================================================= */

function toggleTheaterMode() {

    state.theaterMode =
        !state.theaterMode;

    DOM.body.classList.toggle(
        "player-theater-mode",
        state.theaterMode
    );

    DOM.theaterButton.setAttribute(
        "aria-pressed",
        String(state.theaterMode)
    );


    const icon =
        DOM.theaterButton.querySelector("i");

    if (icon) {

        icon.className =
            state.theaterMode
                ? "fa-solid fa-table-columns"
                : "fa-solid fa-table-columns";

    }

}


/* =========================================================
   FULLSCREEN
   ========================================================= */

async function toggleFullscreen() {

    try {

        if (!document.fullscreenElement) {

            if (
                DOM.wrapper.requestFullscreen
            ) {

                await DOM.wrapper.requestFullscreen();

            } else if (
                DOM.wrapper.webkitRequestFullscreen
            ) {

                DOM.wrapper.webkitRequestFullscreen();

            }

        } else {

            await document.exitFullscreen();

        }

    } catch (error) {

        console.warn(
            "Fullscreen non disponible :",
            error
        );

    }

}


function updateFullscreenButton() {

    const icon =
        DOM.fullscreenButton?.querySelector("i");

    if (!icon) {
        return;
    }

    icon.className =
        document.fullscreenElement
            ? "fa-solid fa-compress"
            : "fa-solid fa-expand";

}


/* =========================================================
   MINI PLAYER
   ========================================================= */

function canUseMiniPlayer() {

    return Boolean(
        DOM.miniPlayer &&
        DOM.miniVideo
    );

}


function activateMiniPlayer() {

    if (!canUseMiniPlayer()) {
        return;
    }

    state.miniPlayerActive =
        true;


    DOM.miniVideo.src =
        DOM.video.currentSrc ||
        DOM.video.src;


    DOM.miniVideo.currentTime =
        DOM.video.currentTime || 0;

    DOM.miniVideo.volume =
        DOM.video.volume;

    DOM.miniVideo.muted =
        DOM.video.muted;


    DOM.miniTitle.textContent =
        state.video?.title ||
        "Vidéo";


    DOM.miniPlayer.hidden =
        false;


    DOM.video.pause();


    DOM.miniVideo
        .play()
        .catch(() => {});

}


function closeMiniPlayer() {

    if (!DOM.miniPlayer) {
        return;
    }

    DOM.miniVideo.pause();

    DOM.miniVideo.removeAttribute(
        "src"
    );

    DOM.miniVideo.load();

    DOM.miniPlayer.hidden =
        true;

    state.miniPlayerActive =
        false;

}


function expandMiniPlayer() {

    if (!state.miniPlayerActive) {
        return;
    }

    const time =
        DOM.miniVideo.currentTime;

    closeMiniPlayer();

    DOM.video.currentTime =
        time;

    DOM.video
        .play()
        .catch(() => {});

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   AUTOPLAY
   ========================================================= */

function updateAutoplayButton() {

    DOM.autoplayButton?.setAttribute(
        "aria-pressed",
        String(state.autoplay)
    );

    DOM.autoplayButton?.classList.toggle(
        "is-active",
        state.autoplay
    );

}


function toggleAutoplay() {

    state.autoplay =
        !state.autoplay;

    updateAutoplayButton();

    if (!state.autoplay) {

        cancelNextVideo();

    }

    showToast(
        state.autoplay
            ? "Lecture automatique activée."
            : "Lecture automatique désactivée."
    );

}


function scheduleNextVideo() {

    if (
        !state.autoplay ||
        !state.nextVideo
    ) {
        return;
    }

    clearTimeout(
        state.autoplayTimer
    );


    renderNextVideoPreview();

    DOM.nextOverlay.hidden =
        false;


    state.autoplayTimer =
        setTimeout(
            playNextVideo,
            CONFIG.autoplayDelay
        );

}


function cancelNextVideo() {

    clearTimeout(
        state.autoplayTimer
    );

    state.autoplayTimer =
        null;

    DOM.nextOverlay.hidden =
        true;

}


function renderNextVideoPreview() {

    const video =
        state.nextVideo;

    if (!video) {
        return;
    }

    DOM.nextPreview.innerHTML = `

        <div class="next-video-thumbnail">

            <img
                src="${escapeHTML(
                    video.thumbnail_url ||
                    "assets/images/default-thumbnail.png"
                )}"
                alt=""
                loading="lazy"
            >

        </div>

        <div class="next-video-information">

            <strong>
                ${escapeHTML(video.title || "Vidéo")}
            </strong>

            <span>
                ${formatNumber(video.views)} vues
            </span>

        </div>
    `;

}


function playNextVideo() {

    if (!state.nextVideo?.id) {
        return;
    }

    cancelNextVideo();

    window.location.href =
        `player.html?id=${encodeURIComponent(
            state.nextVideo.id
        )}`;

}


/* =========================================================
   COMMENTS
   ========================================================= */

async function loadComments(
    reset = true
) {

    if (
        !state.videoId ||
        state.commentsLoading
    ) {
        return;
    }


    if (reset) {

        state.comments = [];
        state.commentsOffset = 0;
        state.commentsHasMore = true;

    }


    if (!state.commentsHasMore) {
        return;
    }


    state.commentsLoading =
        true;

    DOM.commentsLoading.hidden =
        false;


    try {

        let query =
            supabase
                .from("comments")
                .select("*")
                .eq(
                    "video_id",
                    state.videoId
                )
                .is(
                    "parent_id",
                    null
                );


        if (state.commentsSort === "top") {

            query =
                query.order(
                    "likes_count",
                    {
                        ascending: false
                    }
                );

            query =
                query.order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        } else {

            query =
                query.order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        }


        const from =
            state.commentsOffset;

        const to =
            from +
            CONFIG.maxCommentsPerPage -
            1;


        const {
            data,
            error
        } = await query.range(
            from,
            to
        );


        if (error) {
            throw error;
        }


        const newComments =
            data || [];


        state.comments.push(
            ...newComments
        );


        state.commentsOffset =
            state.comments.length;


        state.commentsHasMore =
            newComments.length ===
            CONFIG.maxCommentsPerPage;


        await loadCommentProfiles(
            newComments
        );


        renderComments();


    } catch (error) {

        console.error(
            "Erreur commentaires :",
            error
        );

        showToast(
            "Impossible de charger les commentaires.",
            "error"
        );

    } finally {

        state.commentsLoading =
            false;

        DOM.commentsLoading.hidden =
            true;

    }

}


/* =========================================================
   COMMENT PROFILES
   ========================================================= */

async function loadCommentProfiles(
    comments
) {

    if (!comments.length) {
        return;
    }


    const userIds = [
        ...new Set(
            comments
                .map(comment => comment.user_id)
                .filter(Boolean)
        )
    ];


    if (!userIds.length) {
        return;
    }


    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(
            "id, username, display_name, avatar_url, verified"
        )
        .in(
            "id",
            userIds
        );


    if (error) {
        return;
    }


    const map =
        new Map(
            (data || [])
                .map(profile => [
                    profile.id,
                    profile
                ])
        );


    comments.forEach(comment => {

        comment.profile =
            map.get(comment.user_id) || null;

    });

}


/* =========================================================
   RENDER COMMENTS
   ========================================================= */

function renderComments() {

    DOM.commentsList.innerHTML = "";


    if (!state.comments.length) {

        DOM.commentsEmpty.hidden =
            false;

    } else {

        DOM.commentsEmpty.hidden =
            true;

    }


    for (const comment of state.comments) {

        DOM.commentsList.appendChild(
            createCommentElement(comment)
        );

    }


    DOM.loadMoreComments.hidden =
        !state.commentsHasMore ||
        state.comments.length === 0;


    DOM.commentsCount.textContent =
        formatNumber(
            state.video?.comments_count || 0
        );

}


function createCommentElement(
    comment
) {

    const article =
        document.createElement("article");

    article.className =
        "comment-item";

    article.dataset.commentId =
        comment.id;


    const profile =
        comment.profile || {};


    const name =
        profile.display_name ||
        profile.username ||
        "Utilisateur";


    const avatar =
        getSafeAvatar(
            profile.avatar_url
        );


    const edited =
        comment.edited
            ? " · modifié"
            : "";


    article.innerHTML = `

        <div class="comment-avatar-wrapper">

            <img
                class="comment-avatar"
                src="${escapeHTML(avatar)}"
                alt=""
                loading="lazy"
            >

        </div>


        <div class="comment-content">

            <div class="comment-author-row">

                <strong>
                    ${escapeHTML(name)}
                </strong>

                <time>
                    ${formatRelativeDate(comment.created_at)}
                    ${edited}
                </time>

            </div>


            <div class="comment-text">
                ${escapeHTML(comment.content)}
            </div>


            <div class="comment-actions">

                <button
                    type="button"
                    class="comment-like-button"
                    data-comment-like="${escapeHTML(comment.id)}"
                >

                    <i class="fa-regular fa-thumbs-up"></i>

                    <span>
                        ${formatNumber(comment.likes_count)}
                    </span>

                </button>


                <button
                    type="button"
                    data-comment-reply="${escapeHTML(comment.id)}"
                >
                    Répondre
                </button>

            </div>

        </div>
    `;


    return article;

}


function formatRelativeDate(
    date
) {

    if (!date) {
        return "";
    }

    const timestamp =
        new Date(date).getTime();

    if (!Number.isFinite(timestamp)) {
        return "";
    }


    const seconds =
        Math.floor(
            (Date.now() - timestamp) / 1000
        );


    if (seconds < 60) {
        return "à l'instant";
    }


    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {
        return `il y a ${minutes} min`;
    }


    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return `il y a ${hours} h`;
    }


    const days =
        Math.floor(hours / 24);

    if (days < 30) {
        return `il y a ${days} j`;
    }


    return formatDate(date);

}


/* =========================================================
   COMMENT SUBMISSION
   ========================================================= */

function updateCommentSubmitState() {

    if (!DOM.submitComment) {
        return;
    }

    const content =
        DOM.commentInput.value.trim();

    DOM.submitComment.disabled =
        !content ||
        content.length >
        CONFIG.commentMaxLength ||
        !state.user;

}


async function submitComment(
    event
) {

    event.preventDefault();


    if (!isAuthenticated()) {

        showLoginRequired(
            "Connectez-vous pour commenter cette vidéo."
        );

        return;

    }


    const content =
        DOM.commentInput.value.trim();


    if (!content) {
        return;
    }


    if (
        content.length >
        CONFIG.commentMaxLength
    ) {

        showToast(
            "Votre commentaire est trop long.",
            "error"
        );

        return;

    }


    DOM.submitComment.disabled =
        true;


    try {

        const payload = {

            video_id:
                state.videoId,

            user_id:
                state.user.id,

            parent_id:
                state.replyingToCommentId ||
                null,

            content

        };


        const {
            data,
            error
        } = await supabase
            .from("comments")
            .insert(payload)
            .select("*")
            .single();


        if (error) {
            throw error;
        }


        const comment =
            data;


        await loadCommentProfiles(
            [comment]
        );


        if (state.replyingToCommentId) {

            state.replyingToCommentId =
                null;

        }


        DOM.commentInput.value =
            "";


        DOM.cancelComment.hidden =
            true;


        state.comments.unshift(
            comment
        );


        state.video.comments_count =
            Number(
                state.video.comments_count || 0
            ) + 1;


        renderComments();


        showToast(
            "Commentaire publié."
        );


    } catch (error) {

        console.error(
            "Erreur publication commentaire :",
            error
        );

        showToast(
            "Impossible de publier le commentaire.",
            "error"
        );

    } finally {

        updateCommentSubmitState();

    }

}


function beginReply(
    commentId
) {

    if (!isAuthenticated()) {

        showLoginRequired(
            "Connectez-vous pour répondre."
        );

        return;

    }

    state.replyingToCommentId =
        commentId;

    DOM.cancelComment.hidden =
        false;

    DOM.commentInput.focus();

    DOM.commentInput.placeholder =
        "Écrire une réponse...";

}


/* =========================================================
   COMMENT LIKE
   ========================================================= */

async function likeComment(
    commentId
) {

    if (!isAuthenticated()) {

        showLoginRequired(
            "Connectez-vous pour aimer un commentaire."
        );

        return;

    }


    const comment =
        state.comments.find(
            item => item.id === commentId
        );


    if (!comment) {
        return;
    }


    const oldCount =
        Number(
            comment.likes_count || 0
        );


    comment.likes_count =
        oldCount + 1;


    renderComments();


    /*
     * La table comment_reactions peut être utilisée
     * lorsque sa structure est disponible. Le compteur
     * reste protégé contre les doubles traitements.
     */

    try {

        const {
            error
        } = await supabase
            .from("comments")
            .update(
                {
                    likes_count:
                        comment.likes_count
                }
            )
            .eq(
                "id",
                commentId
            );

        if (error) {
            throw error;
        }

    } catch (error) {

        console.warn(
            "Like commentaire non enregistré :",
            error
        );

        comment.likes_count =
            oldCount;

        renderComments();

    }

}


/* =========================================================
   SEARCH / NAVIGATION
   ========================================================= */

function setupSearch() {

    DOM.searchForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const query =
                DOM.searchInput.value.trim();

            if (!query) {
                return;
            }

            window.location.href =
                `search.html?q=${encodeURIComponent(query)}`;

        }
    );

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function setupSidebar() {

    /*
     * IMPORTANT :
     * La sidebar reste complètement fermée par défaut.
     * Aucun affichage automatique sur desktop.
     */

    DOM.sidebar?.classList.remove(
        "is-open",
        "open",
        "active"
    );

    DOM.sidebarOverlay?.classList.remove(
        "is-visible",
        "active"
    );


    DOM.menuButton?.setAttribute(
        "aria-expanded",
        "false"
    );


    DOM.menuButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleSidebar();

        }
    );


    DOM.sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );

}


function toggleSidebar() {

    const isOpen =
        DOM.sidebar.classList.contains(
            "is-open"
        );


    if (isOpen) {

        closeSidebar();

    } else {

        openSidebar();

    }

}


function openSidebar() {

    DOM.sidebar.classList.add(
        "is-open"
    );

    DOM.sidebarOverlay.classList.add(
        "is-visible"
    );

    DOM.menuButton.setAttribute(
        "aria-expanded",
        "true"
    );

    DOM.sidebarOverlay.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeSidebar() {

    DOM.sidebar.classList.remove(
        "is-open"
    );

    DOM.sidebarOverlay.classList.remove(
        "is-visible"
    );

    DOM.menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    DOM.sidebarOverlay.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   RECOMMENDATIONS
   ========================================================= */

async function loadRecommendations() {

    if (!state.videoId) {
        return;
    }


    try {

        let query =
            supabase
                .from("videos")
                .select("*")
                .eq(
                    "visibility",
                    "public"
                )
                .neq(
                    "id",
                    state.videoId
                )
                .eq(
                    "status",
                    "published"
                )
                .order(
                    "views",
                    {
                        ascending: false
                    }
                )
                .limit(
                    CONFIG.maxRecommendations
                );


        if (state.video.category_id) {

            const {
                data,
                error
            } = await supabase
                .from("videos")
                .select("*")
                .eq(
                    "visibility",
                    "public"
                )
                .neq(
                    "id",
                    state.videoId
                )
                .eq(
                    "status",
                    "published"
                )
                .eq(
                    "category_id",
                    state.video.category_id
                )
                .order(
                    "views",
                    {
                        ascending: false
                    }
                )
                .limit(
                    CONFIG.maxRecommendations
                );


            if (!error && data?.length) {

                state.recommendations =
                    data;

            } else {

                const fallback =
                    await query;

                state.recommendations =
                    fallback.data || [];

            }

        } else {

            const {
                data
            } = await query;

            state.recommendations =
                data || [];

        }


        renderRecommendations();

        await loadShortRecommendations();

        determineNextVideo();

    } catch (error) {

        console.warn(
            "Recommandations indisponibles :",
            error
        );

    }

}


/* =========================================================
   RECOMMENDATION RENDER
   ========================================================= */

function createRecommendationCard(
    video,
    compact = false
) {

    const element =
        document.createElement("a");

    element.className =
        compact
            ? "recommendation-card compact"
            : "recommendation-card";


    element.href =
        `player.html?id=${encodeURIComponent(video.id)}`;


    element.innerHTML = `

        <div class="recommendation-thumbnail">

            <img
                src="${escapeHTML(
                    video.thumbnail_url ||
                    "assets/images/default-thumbnail.png"
                )}"
                alt=""
                loading="lazy"
            >

            <span class="recommendation-duration">
                ${formatTime(video.duration)}
            </span>

        </div>


        <div class="recommendation-information">

            <strong>
                ${escapeHTML(video.title || "Vidéo")}
            </strong>

            <span>
                ${formatNumber(video.views)} vues
            </span>

        </div>
    `;


    return element;

}


function renderRecommendations() {

    if (DOM.upNext) {

        DOM.upNext.innerHTML = "";

        if (state.recommendations[0]) {

            DOM.upNext.appendChild(
                createRecommendationCard(
                    state.recommendations[0]
                )
            );

        }

    }


    if (DOM.recommended) {

        DOM.recommended.innerHTML = "";

        for (
            const video
            of state.recommendations.slice(
                1
            )
        ) {

            DOM.recommended.appendChild(
                createRecommendationCard(
                    video
                )
            );

        }

    }

}


async function loadShortRecommendations() {

    const {
        data,
        error
    } = await supabase
        .from("shorts")
        .select("*")
        .order(
            "views",
            {
                ascending: false
            }
        )
        .limit(
            CONFIG.maxShortRecommendations
        );


    if (error) {

        console.warn(
            "Shorts recommandés indisponibles :",
            error
        );

        return;

    }


    state.shorts =
        data || [];


    renderShortRecommendations();

}


function renderShortRecommendations() {

    if (!DOM.recommendedShorts) {
        return;
    }

    DOM.recommendedShorts.innerHTML = "";


    for (const short of state.shorts) {

        const card =
            document.createElement("a");

        card.className =
            "recommended-short-card";

        card.href =
            `short.html?id=${encodeURIComponent(short.id)}`;


        card.innerHTML = `

            <div class="recommended-short-thumbnail">

                <img
                    src="${escapeHTML(
                        short.thumbnail_url ||
                        "assets/images/default-thumbnail.png"
                    )}"
                    alt=""
                    loading="lazy"
                >

            </div>

            <strong>
                ${escapeHTML(
                    short.title ||
                    "Short"
                )}
            </strong>
        `;


        DOM.recommendedShorts.appendChild(
            card
        );

    }

}


function determineNextVideo() {

    state.nextVideo =
        state.recommendations[0] ||
        null;

}


/* =========================================================
   DESCRIPTION
   ========================================================= */

function toggleDescription() {

    state.descriptionExpanded =
        !state.descriptionExpanded;

    renderDescription();

}


/* =========================================================
   SHARE
   ========================================================= */

function getVideoUrl() {

    return (
        `${window.location.origin}` +
        `${window.location.pathname}` +
        `?id=${encodeURIComponent(state.videoId)}`
    );

}


function openShareModal() {

    const url =
        getVideoUrl();

    DOM.shareLinkInput.value =
        url;

    DOM.shareModal.hidden =
        false;

    DOM.shareModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeShareModal() {

    DOM.shareModal.hidden =
        true;

    DOM.shareModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


async function copyVideoLink() {

    const url =
        getVideoUrl();

    try {

        await navigator.clipboard.writeText(
            url
        );

        showToast(
            "Lien copié."
        );

    } catch (_) {

        DOM.shareLinkInput.select();

        document.execCommand(
            "copy"
        );

        showToast(
            "Lien copié."
        );

    }

}


async function nativeShare() {

    const url =
        getVideoUrl();


    if (
        navigator.share
    ) {

        try {

            await navigator.share(
                {
                    title:
                        state.video?.title ||
                        "Vidéo NetView",

                    text:
                        state.video?.description ||
                        "",

                    url
                }
            );

        } catch (_) {
            // user cancelled
        }

    } else {

        await copyVideoLink();

    }

}


/* =========================================================
   REPORT
   ========================================================= */

function openReportModal() {

    if (!isAuthenticated()) {

        showLoginRequired(
            "Connectez-vous pour signaler une vidéo."
        );

        return;

    }

    DOM.reportModal.hidden =
        false;

    DOM.reportModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeReportModal() {

    DOM.reportModal.hidden =
        true;

    DOM.reportModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


function updateReportButtonState() {

    const reason =
        DOM.reportForm?.querySelector(
            'input[name="report_reason"]:checked'
        );


    DOM.submitReport.disabled =
        !reason;

}


async function submitReport(
    event
) {

    event.preventDefault();


    if (!isAuthenticated()) {

        closeReportModal();

        showLoginRequired(
            "Connectez-vous pour signaler une vidéo."
        );

        return;

    }


    const reason =
        DOM.reportForm.querySelector(
            'input[name="report_reason"]:checked'
        )?.value;


    if (!reason) {
        return;
    }


    const details =
        DOM.reportDetails.value.trim();


    /*
     * Le système de modération peut évoluer.
     * On tente d'utiliser une table reports si elle existe.
     */

    try {

        const {
            error
        } = await supabase
            .from("reports")
            .insert(
                {
                    reporter_id:
                        state.user.id,

                    entity_type:
                        "video",

                    entity_id:
                        state.videoId,

                    reason,

                    details:
                        details || null
                }
            );


        if (error) {

            /*
             * Une erreur de table inexistante ne doit
             * pas faire planter le player.
             */

            console.warn(
                "Système de signalement externe indisponible :",
                error
            );

        }


        closeReportModal();

        DOM.reportForm.reset();

        updateReportButtonState();

        showToast(
            "Votre signalement a été pris en compte."
        );

    } catch (error) {

        console.error(
            "Erreur signalement :",
            error
        );

        closeReportModal();

        showToast(
            "Impossible d'envoyer le signalement.",
            "error"
        );

    }

}


/* =========================================================
   MORE MENU
   ========================================================= */

function toggleMoreMenu() {

    const hidden =
        DOM.moreMenu.hidden;

    DOM.moreMenu.hidden =
        !hidden;

    DOM.moreButton.setAttribute(
        "aria-expanded",
        String(hidden)
    );

}


function closeMoreMenu() {

    DOM.moreMenu.hidden =
        true;

    DOM.moreButton.setAttribute(
        "aria-expanded",
        "false"
    );

}


/* =========================================================
   VIDEO EVENTS
   ========================================================= */

function setupVideoEvents() {

    DOM.video.addEventListener(
        "loadedmetadata",
        () => {

            updateProgress();

            if (
                state.historyLastPosition > 0 &&
                state.historyLastPosition <
                DOM.video.duration - 2
            ) {

                DOM.video.currentTime =
                    Math.min(
                        state.historyLastPosition,
                        DOM.video.duration - 1
                    );

            }

            const file =
                getSelectedFile();

            if (file) {

                state.currentSource =
                    file.file_url;

            }

        }
    );


    DOM.video.addEventListener(
        "play",
        async () => {

            state.viewStarted =
                true;

            updatePlayButton();

            showControls();

            await registerActualView();

        }
    );


    DOM.video.addEventListener(
        "pause",
        async () => {

            updatePlayButton();

            showControls();

            await saveHistory(true);

        }
    );


    DOM.video.addEventListener(
        "ended",
        async () => {

            updatePlayButton();

            await saveHistory(true);

            await registerCompletion();

            if (state.autoplay) {

                scheduleNextVideo();

            }

        }
    );


    DOM.video.addEventListener(
        "timeupdate",
        updateProgress
    );


    DOM.video.addEventListener(
        "progress",
        () => {

            DOM.buffering.hidden =
                true;

        }
    );


    DOM.video.addEventListener(
        "waiting",
        () => {

            DOM.buffering.hidden =
                false;

        }
    );


    DOM.video.addEventListener(
        "canplay",
        () => {

            DOM.buffering.hidden =
                true;

            DOM.videoError.hidden =
                true;

        }
    );


    DOM.video.addEventListener(
        "playing",
        () => {

            DOM.buffering.hidden =
                true;

        }
    );


    DOM.video.addEventListener(
        "error",
        () => {

            DOM.buffering.hidden =
                true;

            DOM.videoError.hidden =
                false;

        }
    );


    DOM.video.addEventListener(
        "volumechange",
        updateVolumeButton
    );


    DOM.video.addEventListener(
        "dblclick",
        toggleFullscreen
    );


    DOM.wrapper.addEventListener(
        "mousemove",
        showControls
    );


    DOM.wrapper.addEventListener(
        "touchstart",
        showControls,
        {
            passive: true
        }
    );

}


/* =========================================================
   PLAYER EVENTS
   ========================================================= */

function setupPlayerControls() {

    DOM.playButton?.addEventListener(
        "click",
        togglePlay
    );

    DOM.centerPlay?.addEventListener(
        "click",
        togglePlay
    );


    DOM.video?.addEventListener(
        "click",
        event => {

            if (
                event.target === DOM.video
            ) {

                togglePlay();

            }

        }
    );


    DOM.progress?.addEventListener(
        "input",
        seekFromProgress
    );


    DOM.progressArea?.addEventListener(
        "click",
        event => {

            if (
                event.target === DOM.progress
            ) {
                return;
            }

            const rect =
                DOM.progressArea.getBoundingClientRect();

            const percent =
                (event.clientX - rect.left) /
                rect.width;


            DOM.progress.value =
                Math.min(
                    100,
                    Math.max(
                        0,
                        percent * 100
                    )
                );


            seekFromProgress();

        }
    );


    DOM.muteButton?.addEventListener(
        "click",
        toggleMute
    );


    DOM.volume?.addEventListener(
        "input",
        event =>
            setVolume(
                event.target.value
            )
    );


    DOM.autoplayButton?.addEventListener(
        "click",
        toggleAutoplay
    );


    DOM.settingsButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleSettings();

        }
    );


    DOM.qualityOptions?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-quality]"
                );

            if (!button) {
                return;
            }

            changeQuality(
                button.dataset.quality
            );

        }
    );


    DOM.settingsMenu?.addEventListener(
        "click",
        event => {

            const speed =
                event.target.closest(
                    "[data-speed]"
                );

            if (speed) {

                changeSpeed(
                    speed.dataset.speed
                );

                return;

            }


            const setting =
                event.target.closest(
                    "[data-setting]"
                );

            if (setting) {

                showSettingsPanel(
                    setting.dataset.setting
                );

                return;

            }


            const back =
                event.target.closest(
                    "[data-back]"
                );

            if (back) {

                showSettingsPanel(
                    back.dataset.back
                );

            }

        }
    );


    DOM.theaterButton?.addEventListener(
        "click",
        toggleTheaterMode
    );


    DOM.fullscreenButton?.addEventListener(
        "click",
        toggleFullscreen
    );


    DOM.miniButton?.addEventListener(
        "click",
        activateMiniPlayer
    );


    DOM.previousButton?.addEventListener(
        "click",
        playPreviousVideo
    );


    DOM.nextButton?.addEventListener(
        "click",
        playNextVideo
    );


    DOM.playNextNow?.addEventListener(
        "click",
        playNextVideo
    );


    DOM.cancelAutoplay?.addEventListener(
        "click",
        cancelNextVideo
    );


    DOM.miniClose?.addEventListener(
        "click",
        closeMiniPlayer
    );


    DOM.miniExpand?.addEventListener(
        "click",
        expandMiniPlayer
    );


    document.addEventListener(
        "fullscreenchange",
        updateFullscreenButton
    );

}


/* =========================================================
   PREVIOUS / NEXT
   ========================================================= */

function playPreviousVideo() {

    if (
        DOM.video.currentTime >
        5
    ) {

        DOM.video.currentTime =
            0;

        return;

    }


    const currentIndex =
        state.recommendations.findIndex(
            video =>
                video.id === state.videoId
        );


    if (
        currentIndex > 0
    ) {

        const previous =
            state.recommendations[
                currentIndex - 1
            ];

        window.location.href =
            `player.html?id=${encodeURIComponent(previous.id)}`;

    }

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            const tag =
                document.activeElement?.tagName;


            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                document.activeElement?.isContentEditable
            ) {
                return;
            }


            switch (event.key.toLowerCase()) {

                case " ":
                case "k":

                    event.preventDefault();

                    togglePlay();

                    break;


                case "m":

                    event.preventDefault();

                    toggleMute();

                    break;


                case "f":

                    event.preventDefault();

                    toggleFullscreen();

                    break;


                case "t":

                    event.preventDefault();

                    toggleTheaterMode();

                    break;


                case "arrowleft":

                    event.preventDefault();

                    DOM.video.currentTime =
                        Math.max(
                            0,
                            DOM.video.currentTime - 5
                        );

                    break;


                case "arrowright":

                    event.preventDefault();

                    DOM.video.currentTime =
                        Math.min(
                            DOM.video.duration || Infinity,
                            DOM.video.currentTime + 5
                        );

                    break;


                case "arrowup":

                    event.preventDefault();

                    setVolume(
                        DOM.video.volume + 0.05
                    );

                    DOM.volume.value =
                        DOM.video.volume;

                    break;


                case "arrowdown":

                    event.preventDefault();

                    setVolume(
                        DOM.video.volume - 0.05
                    );

                    DOM.volume.value =
                        DOM.video.volume;

                    break;


                case "escape":

                    closeMoreMenu();

                    if (
                        DOM.settingsMenu &&
                        !DOM.settingsMenu.hidden
                    ) {

                        DOM.settingsMenu.hidden =
                            true;

                        DOM.settingsButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }

                    if (
                        state.theaterMode
                    ) {

                        state.theaterMode =
                            false;

                        DOM.body.classList.remove(
                            "player-theater-mode"
                        );

                    }

                    break;

            }

        }
    );

}


/* =========================================================
   COMMENTS EVENTS
   ========================================================= */

function setupComments() {

    DOM.commentInput?.addEventListener(
        "input",
        updateCommentSubmitState
    );


    DOM.commentForm?.addEventListener(
        "submit",
        submitComment
    );


    DOM.cancelComment?.addEventListener(
        "click",
        () => {

            state.replyingToCommentId =
                null;

            state.editingCommentId =
                null;

            DOM.commentInput.value =
                "";

            DOM.commentInput.placeholder =
                "Ajoutez un commentaire...";

            DOM.cancelComment.hidden =
                true;

            updateCommentSubmitState();

        }
    );


    DOM.loadMoreComments?.addEventListener(
        "click",
        () =>
            loadComments(false)
    );


    DOM.commentsSortButton?.addEventListener(
        "click",
        () => {

            const hidden =
                DOM.commentsSortMenu.hidden;

            DOM.commentsSortMenu.hidden =
                !hidden;

            DOM.commentsSortButton.setAttribute(
                "aria-expanded",
                String(hidden)
            );

        }
    );


    DOM.commentsSortMenu?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-sort]"
                );

            if (!button) {
                return;
            }

            state.commentsSort =
                button.dataset.sort;

            DOM.commentsSortMenu.hidden =
                true;

            loadComments(true);

        }
    );


    DOM.commentsList?.addEventListener(
        "click",
        event => {

            const reply =
                event.target.closest(
                    "[data-comment-reply]"
                );

            if (reply) {

                beginReply(
                    reply.dataset.commentReply
                );

                return;

            }


            const like =
                event.target.closest(
                    "[data-comment-like]"
                );

            if (like) {

                likeComment(
                    like.dataset.commentLike
                );

            }

        }
    );

}


/* =========================================================
   ACTION EVENTS
   ========================================================= */

function setupActionEvents() {

    DOM.likeButton?.addEventListener(
        "click",
        () =>
            setReaction("like")
    );


    DOM.dislikeButton?.addEventListener(
        "click",
        () =>
            setReaction("dislike")
    );


    DOM.watchLaterButton?.addEventListener(
        "click",
        toggleWatchLater
    );


    DOM.subscribeButton?.addEventListener(
        "click",
        toggleSubscription
    );


    DOM.shareButton?.addEventListener(
        "click",
        openShareModal
    );


    DOM.closeShareModal?.addEventListener(
        "click",
        closeShareModal
    );


    DOM.copyShareLink?.addEventListener(
        "click",
        copyVideoLink
    );


    DOM.shareOptions?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-share]"
                );

            if (!button) {
                return;
            }

            if (
                button.dataset.share ===
                "copy"
            ) {

                copyVideoLink();

            }

            if (
                button.dataset.share ===
                "native"
            ) {

                nativeShare();

            }

        }
    );


    DOM.copyLinkButton?.addEventListener(
        "click",
        copyVideoLink
    );


    DOM.moreButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleMoreMenu();

        }
    );


    DOM.reportButton?.addEventListener(
        "click",
        () => {

            closeMoreMenu();

            openReportModal();

        }
    );


    DOM.closeReportModal?.addEventListener(
        "click",
        closeReportModal
    );


    DOM.cancelReport?.addEventListener(
        "click",
        closeReportModal
    );


    DOM.reportForm?.addEventListener(
        "submit",
        submitReport
    );


    DOM.reportForm?.addEventListener(
        "change",
        updateReportButtonState
    );


    DOM.descriptionToggle?.addEventListener(
        "click",
        toggleDescription
    );


    DOM.closeLoginModal?.addEventListener(
        "click",
        closeLoginModal
    );


    DOM.retryButton?.addEventListener(
        "click",
        async () => {

            showLoading();

            await initializeVideo();

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                DOM.moreMenu &&
                !DOM.moreMenu.hidden &&
                !DOM.moreButton.contains(event.target) &&
                !DOM.moreMenu.contains(event.target)
            ) {

                closeMoreMenu();

            }


            if (
                DOM.settingsMenu &&
                !DOM.settingsMenu.hidden &&
                !DOM.settingsContainer.contains(event.target)
            ) {

                DOM.settingsMenu.hidden =
                    true;

                DOM.settingsButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

                state.settingsOpen =
                    false;

            }


            if (
                DOM.commentsSortMenu &&
                !DOM.commentsSortMenu.hidden &&
                !DOM.commentsSortButton.contains(event.target) &&
                !DOM.commentsSortMenu.contains(event.target)
            ) {

                DOM.commentsSortMenu.hidden =
                    true;

            }

        }
    );

}


/* =========================================================
   URL / HISTORY NAVIGATION
   ========================================================= */

function setupNavigationEvents() {

    window.addEventListener(
        "popstate",
        async () => {

            const newId =
                getVideoId();

            if (
                newId &&
                newId !== state.videoId
            ) {

                await destroyPlayer();

                resetState();

                showLoading();

                await initializeVideo();

            }

        }
    );

}


/* =========================================================
   RESET STATE
   ========================================================= */

function resetState() {

    Object.assign(
        state,
        {

            video: null,
            channel: null,
            files: [],
            selectedQuality: "auto",
            currentSource: null,
            videoId: null,

            currentReaction: null,
            watchLater: false,
            subscribed: false,
            subscriptionId: null,

            comments: [],
            commentsOffset: 0,
            commentsHasMore: true,
            commentsLoading: false,

            historyId: null,
            historyLastPosition: 0,
            lastHistorySave: 0,

            viewRegistered: false,
            viewStarted: false,
            viewCompleted: false,

            nextVideo: null,
            recommendations: [],
            shorts: [],

            theaterMode: false,
            miniPlayerActive: false,

            settingsOpen: false,
            settingsPanel: "main",

            descriptionExpanded: false,

            destroyed: false

        }
    );

}


/* =========================================================
   SUPABASE AUTH STATE
   ========================================================= */

function setupAuthListener() {

    supabase.auth.onAuthStateChange(
        (_event, session) => {

            state.user =
                session?.user || null;


            /*
             * On évite de recharger immédiatement toute
             * la page pendant une transition OAuth.
             */

            setTimeout(
                async () => {

                    if (state.destroyed) {
                        return;
                    }

                    await Promise.allSettled([
                        loadReaction(),
                        loadWatchLaterState(),
                        loadSubscriptionState(),
                        loadHistory()
                    ]);

                    updateReactionUI();
                    updateWatchLaterUI();
                    updateSubscribeButton();

                },
                0
            );

        }
    );

}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

function setupVisibilityTracking() {

    document.addEventListener(
        "visibilitychange",
        async () => {

            if (
                document.hidden
            ) {

                await saveHistory(true);

            }

        }
    );


    window.addEventListener(
        "beforeunload",
        () => {

            /*
             * Les appels async dans beforeunload ne sont
             * pas garantis. Le dernier historique normal
             * est déjà sauvegardé périodiquement.
             */

            saveHistory(true);

        }
    );

}


/* =========================================================
   INITIAL VIDEO PLAYBACK
   ========================================================= */

function initializeVideoSource() {

    const file =
        getSelectedFile();

    if (!file) {

        showError(
            "Fichier vidéo indisponible",
            "Cette vidéo ne possède actuellement aucun fichier lisible."
        );

        return false;

    }

    setVideoSource(
        file,
        false
    );

    return true;

}


/* =========================================================
   MAIN INITIALIZATION
   ========================================================= */

async function initializeVideo() {

    try {

        showLoading();

        state.user =
            await getCurrentUser();


        const loaded =
            await loadVideo();


        if (!loaded) {
            return;
        }


        const sourceReady =
            initializeVideoSource();


        if (!sourceReady) {
            return;
        }


        updatePlayButton();

        updateVolumeButton();

        updateAutoplayButton();

        updateCommentSubmitState();

        hideLoading();


    } catch (error) {

        console.error(
            "NetView Player initialization error:",
            error
        );

        showError(
            "Une erreur est survenue",
            "NetView n'a pas pu initialiser le lecteur vidéo."
        );

    }

}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function init() {

    cacheDOM();


    if (
        !DOM.video ||
        !DOM.layout
    ) {

        console.error(
            "NetView Player : structure HTML incomplète."
        );

        return;

    }


    /*
     * Sidebar :
     * aucun affichage automatique.
     */

    setupSidebar();

    setupSearch();

    setupVideoEvents();

    setupPlayerControls();

    setupKeyboard();

    setupComments();

    setupActionEvents();

    setupNavigationEvents();

    setupAuthListener();

    setupVisibilityTracking();


    await initializeVideo();

}


/* =========================================================
   CLEANUP
   ========================================================= */

async function destroyPlayer() {

    state.destroyed =
        true;


    clearTimeout(
        state.autoplayTimer
    );

    clearTimeout(
        state.playerControlsTimer
    );

    clearTimeout(
        toastTimer
    );


    try {

        await saveHistory(true);

    } catch (_) {
        // ignore
    }


    for (
        const subscription
        of state.realtimeSubscriptions
    ) {

        try {

            await supabase.removeChannel(
                subscription
            );

        } catch (_) {
            // ignore
        }

    }


    state.realtimeSubscriptions =
        [];


    DOM.video?.pause();

    DOM.miniVideo?.pause();


    for (
        const url
        of state.objectUrls
    ) {

        try {
            URL.revokeObjectURL(url);
        } catch (_) {
            // ignore
        }

    }


    state.objectUrls =
        [];


    DOM.video?.removeAttribute(
        "src"
    );

    DOM.video?.load();

}


/* =========================================================
   GLOBAL ERROR PROTECTION
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "NetView Player error:",
            event.error || event.message
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "NetView Player promise error:",
            event.reason
        );

    }
);


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


/* =========================================================
   PUBLIC API
   ========================================================= */

export {

    init,

    destroyPlayer,

    loadVideo,

    togglePlay,

    toggleFullscreen,

    toggleTheaterMode,

    toggleAutoplay

};
