// ==========================================================
// NetView
// upload-short.js
// ==========================================================

import {
    getSession,
    getUser
} from "../core/auth.js";

import {
    getMyChannels
} from "../core/data.js";

import {
    supabase
} from "../core/supabase.js";


// ==========================================================
// DOM
// ==========================================================

const sidebar =
    document.getElementById("sidebar");

const sidebarNav =
    sidebar?.querySelector(".nv-sidebar-nav");

const sidebarToggle =
    document.getElementById("menuButton");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const globalSearchForm =
    document.getElementById("searchForm");

const globalSearchInput =
    document.getElementById("searchInput");

const headerRight =
    document.getElementById("headerRight");

const uploadForm =
    document.getElementById("uploadShortForm") ||
    document.getElementById("uploadForm");

const shortFileInput =
    document.getElementById("shortFile") ||
    document.getElementById("shortVideoFile") ||
    document.getElementById("videoFile");

const selectShortButton =
    document.getElementById("selectShortButton") ||
    document.getElementById("selectVideoButton");

const removeShortButton =
    document.getElementById("removeShortButton") ||
    document.getElementById("removeVideoButton");

const shortDropZone =
    document.getElementById("shortDropZone") ||
    document.getElementById("videoDropZone");

const shortFilePreview =
    document.getElementById("shortFilePreview") ||
    document.getElementById("videoFilePreview");

const shortFileName =
    document.getElementById("shortFileName") ||
    document.getElementById("videoFileName");

const shortFileSize =
    document.getElementById("shortFileSize") ||
    document.getElementById("videoFileSize");

const shortTitle =
    document.getElementById("shortTitle") ||
    document.getElementById("videoTitle");

const shortDescription =
    document.getElementById("shortDescription") ||
    document.getElementById("videoDescription");

const shortCategory =
    document.getElementById("shortCategory") ||
    document.getElementById("videoCategory");

const shortLanguage =
    document.getElementById("shortLanguage") ||
    document.getElementById("videoLanguage");

const shortTags =
    document.getElementById("shortTags") ||
    document.getElementById("videoTags");

const publishButton =
    document.getElementById("publishShortButton") ||
    document.getElementById("publishButton");

const uploadProgressContainer =
    document.getElementById("uploadProgressContainer");

const uploadProgressBar =
    document.getElementById("uploadProgressBar");

const uploadProgressPercent =
    document.getElementById("uploadProgressPercent");

const uploadProgressText =
    document.getElementById("uploadProgressText");

const pageLoader =
    document.getElementById("pageLoader");

const titleCounter =
    document.getElementById("titleCounter");

const descriptionCounter =
    document.getElementById("descriptionCounter");

const channelSelect =
    document.getElementById("shortChannel") ||
    document.getElementById("channelSelect");


// ==========================================================
// STATE
// ==========================================================

let currentUser = null;

let currentProfile = null;

let currentChannels = [];

let selectedChannel = null;

let selectedShortFile = null;

let selectedThumbnailFile = null;

let isUploading = false;

let uploadedShortPath = null;

let uploadedThumbnailPath = null;


// ==========================================================
// CONSTANTS
// ==========================================================

const SHORTS_BUCKET =
    "shorts";

const MAX_VIDEO_SIZE =
    2 * 1024 * 1024 * 1024;

const MAX_THUMBNAIL_SIZE =
    10 * 1024 * 1024;

const MAX_TITLE_LENGTH =
    150;

const MAX_DESCRIPTION_LENGTH =
    5000;

const MAX_TAGS_LENGTH =
    500;

const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska"
];

const ALLOWED_THUMBNAIL_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const DEFAULT_AVATAR =
    "assets/images/default-avatar.png";


// ==========================================================
// INITIALIZATION
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    setupSidebarEvents();

    setupSearch();

    setupFileSelection();

    setupDragAndDrop();

    setupThumbnailSelection();

    setupCounters();

    setupForm();

    setupVisibility();

    showPageLoader();

    try {

        const session =
            await getSession();

        if (!session) {

            redirectToAuth();

            return;
        }


        currentUser =
            await getUser();

        if (!currentUser) {

            redirectToAuth();

            return;
        }


        await loadProfile();

        showUserHeader();

        showUserSidebar();

        await loadChannels();

        await loadCategories();

        updatePublishButton();

    } catch (error) {

        console.error(
            "NetView upload-short initialization error:",
            error
        );

        showError(
            "Impossible de préparer la publication du Short."
        );

    } finally {

        hidePageLoader();

    }
}


// ==========================================================
// PROFILE
// ==========================================================

async function loadProfile() {

    try {

        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();

        if (error) {
            throw error;
        }

        currentProfile =
            data || null;

    } catch (error) {

        console.warn(
            "NetView: profil indisponible.",
            error
        );

        currentProfile = null;

    }
}


// ==========================================================
// HEADER
// ==========================================================

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
            <i class="fa-solid fa-plus"></i>
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
                loading="lazy"
            >
        </a>

    `;


    document
        .getElementById("uploadButton")
        ?.addEventListener(
            "click",
            () => {
                window.location.href =
                    "publish.html";
            }
        );


    document
        .getElementById("headerNotificationsButton")
        ?.addEventListener(
            "click",
            () => {
                window.location.href =
                    "notification.html";
            }
        );
}


// ==========================================================
// SIDEBAR
// ==========================================================

function showUserSidebar() {

    if (!sidebarNav) {
        return;
    }

    sidebarNav.innerHTML = `

        <a
            href="index.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-house"></i>
            <span>Accueil</span>
        </a>


        <a
            href="shorts.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-bolt"></i>
            <span>Shorts</span>
        </a>


        <a
            href="subscriptions.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-tv"></i>
            <span>Abonnements</span>
        </a>


        <a
            href="playlist.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-list"></i>
            <span>Playlists</span>
        </a>


        <a
            href="history.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Historique</span>
        </a>


        <a
            href="watch-later.html"
            class="nv-sidebar-item"
        >
            <i class="fa-regular fa-clock"></i>
            <span>À regarder</span>
        </a>


        <a
            href="liked-videos.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-thumbs-up"></i>
            <span>J'aime</span>
        </a>


        <hr>


        <a
            href="lives.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-tower-broadcast"></i>
            <span>Lives</span>
        </a>


        <a
            href="netview-shop.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-store"></i>
            <span>Boutique</span>
        </a>


        <a
            href="settings.html"
            class="nv-sidebar-item"
        >
            <i class="fa-solid fa-gear"></i>
            <span>Paramètres</span>
        </a>

    `;
}


// ==========================================================
// SIDEBAR EVENTS
// ==========================================================

function setupSidebarEvents() {

    sidebarToggle?.addEventListener(
        "click",
        () => {

            const isOpen =
                sidebar?.classList.contains(
                    "open"
                );

            if (isOpen) {
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

    sidebar?.classList.add("open");

    sidebarOverlay?.classList.add(
        "active"
    );

    sidebarToggle?.setAttribute(
        "aria-expanded",
        "true"
    );

    sidebarOverlay?.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeSidebar() {

    sidebar?.classList.remove("open");

    sidebarOverlay?.classList.remove(
        "active"
    );

    sidebarToggle?.setAttribute(
        "aria-expanded",
        "false"
    );

    sidebarOverlay?.setAttribute(
        "aria-hidden",
        "true"
    );
}


// ==========================================================
// SEARCH
// ==========================================================

function setupSearch() {

    globalSearchForm?.addEventListener(
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
                `search.html?q=${encodeURIComponent(
                    query
                )}`;

        }
    );
}


// ==========================================================
// CHANNELS
// ==========================================================

async function loadChannels() {

    currentChannels =
        await getMyChannels();

    if (
        !Array.isArray(currentChannels) ||
        currentChannels.length === 0
    ) {

        showError(
            "Vous devez avoir une chaîne pour publier un Short."
        );

        if (publishButton) {
            publishButton.disabled = true;
        }

        setTimeout(
            () => {
                window.location.href =
                    "add-channel.html";
            },
            1800
        );

        return;
    }


    /*
     * NetView autorise actuellement une seule chaîne
     * pour un compte Pro.
     *
     * Si plusieurs chaînes existent dans la base,
     * le sélecteur reste disponible.
     */

    populateChannelSelect();

    if (
        currentChannels.length === 1
    ) {

        selectedChannel =
            currentChannels[0];

        if (channelSelect) {

            channelSelect.value =
                selectedChannel.id;

            channelSelect.disabled =
                true;

        }

        updateSelectedChannel();

        return;
    }


    if (channelSelect) {

        channelSelect.disabled =
            false;

        selectedChannel =
            currentChannels[0] ||
            null;

        channelSelect.value =
            selectedChannel?.id ||
            "";

        updateSelectedChannel();

    }
}


function populateChannelSelect() {

    if (!channelSelect) {
        return;
    }

    channelSelect.innerHTML = `

        <option value="">
            Sélectionner une chaîne
        </option>

    `;


    currentChannels.forEach(
        channel => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                channel.id;

            option.textContent =
                channel.name ||
                channel.handle ||
                "Ma chaîne";

            channelSelect.appendChild(
                option
            );

        }
    );


    channelSelect.addEventListener(
        "change",
        () => {

            const channelId =
                channelSelect.value;

            selectedChannel =
                currentChannels.find(
                    channel =>
                        channel.id ===
                        channelId
                ) || null;

            updateSelectedChannel();

            updatePublishButton();

        }
    );
}


function updateSelectedChannel() {

    const channelNameElement =
        document.getElementById(
            "selectedChannelName"
        );

    const channelAvatarElement =
        document.getElementById(
            "selectedChannelAvatar"
        );


    if (
        channelNameElement &&
        selectedChannel
    ) {

        channelNameElement.textContent =
            selectedChannel.name ||
            selectedChannel.handle ||
            "Ma chaîne";

    }


    if (
        channelAvatarElement &&
        selectedChannel
    ) {

        channelAvatarElement.src =
            selectedChannel.avatar_url ||
            DEFAULT_AVATAR;

    }
}


// ==========================================================
// CATEGORIES
// ==========================================================

async function loadCategories() {

    if (!shortCategory) {
        return;
    }

    const {
        data,
        error
    } = await supabase
        .from("video_categories")
        .select(
            "id,name"
        )
        .order(
            "name",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "NetView categories error:",
            error
        );

        return;
    }


    shortCategory.innerHTML = `

        <option value="">
            Sélectionner une catégorie
        </option>

    `;


    (data || []).forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category.id;

            option.textContent =
                category.name;

            shortCategory.appendChild(
                option
            );

        }
    );
}


// ==========================================================
// FILE SELECTION
// ==========================================================

function setupFileSelection() {

    selectShortButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            shortFileInput?.click();

        }
    );


    shortFileInput?.addEventListener(
        "change",
        () => {

            const file =
                shortFileInput.files?.[0];

            if (!file) {
                return;
            }

            handleVideoFile(file);

        }
    );


    removeShortButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            removeVideoFile();

        }
    );
}


function handleVideoFile(file) {

    const validation =
        validateVideoFile(file);

    if (!validation.valid) {

        showError(
            validation.message
        );

        clearVideoInput();

        return;
    }


    selectedShortFile =
        file;


    if (shortFileName) {

        shortFileName.textContent =
            file.name;

    }


    if (shortFileSize) {

        shortFileSize.textContent =
            formatFileSize(
                file.size
            );

    }


    shortFilePreview?.classList.remove(
        "hidden"
    );


    shortDropZone?.classList.add(
        "has-file"
    );


    updatePublishButton();

    hideError();
}


function removeVideoFile() {

    selectedShortFile =
        null;

    clearVideoInput();

    shortFilePreview?.classList.add(
        "hidden"
    );

    shortDropZone?.classList.remove(
        "has-file"
    );

    updatePublishButton();
}


function clearVideoInput() {

    if (shortFileInput) {
        shortFileInput.value = "";
    }
}


// ==========================================================
// DRAG & DROP
// ==========================================================

function setupDragAndDrop() {

    if (!shortDropZone) {
        return;
    }


    [
        "dragenter",
        "dragover"
    ].forEach(
        eventName => {

            shortDropZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    shortDropZone.classList.add(
                        "drag-over"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        eventName => {

            shortDropZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    shortDropZone.classList.remove(
                        "drag-over"
                    );

                }
            );

        }
    );


    shortDropZone.addEventListener(
        "drop",
        event => {

            const file =
                event.dataTransfer?.files?.[0];

            if (!file) {
                return;
            }

            handleVideoFile(file);

        }
    );
}


// ==========================================================
// THUMBNAIL
// ==========================================================

function setupThumbnailSelection() {

    const thumbnailInput =
        document.getElementById(
            "thumbnailFile"
        );

    const thumbnailButton =
        document.getElementById(
            "selectThumbnailButton"
        );

    thumbnailButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            thumbnailInput?.click();

        }
    );


    thumbnailInput?.addEventListener(
        "change",
        () => {

            const file =
                thumbnailInput.files?.[0];

            if (!file) {
                return;
            }

            handleThumbnailFile(file);

        }
    );
}


function handleThumbnailFile(file) {

    if (
        !ALLOWED_THUMBNAIL_TYPES.includes(
            file.type
        )
    ) {

        showError(
            "La miniature doit être au format JPG, PNG ou WebP."
        );

        return;
    }


    if (
        file.size >
        MAX_THUMBNAIL_SIZE
    ) {

        showError(
            "La miniature ne doit pas dépasser 10 Mo."
        );

        return;
    }


    selectedThumbnailFile =
        file;


    const preview =
        document.getElementById(
            "thumbnailPreview"
        );

    const placeholder =
        document.getElementById(
            "thumbnailPlaceholder"
        );


    if (preview) {

        preview.src =
            URL.createObjectURL(file);

        preview.classList.remove(
            "hidden"
        );

    }


    placeholder?.classList.add(
        "hidden"
    );


    hideError();
}


// ==========================================================
// COUNTERS
// ==========================================================

function setupCounters() {

    shortTitle?.addEventListener(
        "input",
        updateCounters
    );

    shortDescription?.addEventListener(
        "input",
        updateCounters
    );

    updateCounters();
}


function updateCounters() {

    if (titleCounter) {

        titleCounter.textContent =
            String(
                shortTitle?.value?.length ||
                0
            );

    }


    if (descriptionCounter) {

        descriptionCounter.textContent =
            String(
                shortDescription?.value?.length ||
                0
            );

    }
}


// ==========================================================
// VISIBILITY
// ==========================================================

function setupVisibility() {

    document
        .querySelectorAll(
            'input[name="visibility"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updatePublishButton
                );

            }
        );
}


// ==========================================================
// FORM
// ==========================================================

function setupForm() {

    uploadForm?.addEventListener(
        "submit",
        handleSubmit
    );
}


async function handleSubmit(event) {

    event.preventDefault();

    if (isUploading) {
        return;
    }


    const validation =
        validateForm();

    if (!validation.valid) {

        showError(
            validation.message
        );

        return;
    }


    isUploading = true;

    updatePublishButton();

    showProgress();

    showProgressState(
        0,
        "Préparation du Short..."
    );


    let shortId = null;


    try {

        const session =
            await getSession();

        if (!session) {
            throw new Error(
                "Votre session a expiré."
            );
        }


        currentUser =
            await getUser();

        if (!currentUser) {
            throw new Error(
                "Utilisateur non authentifié."
            );
        }


        const channel =
            getSelectedChannel();

        if (!channel) {
            throw new Error(
                "Aucune chaîne sélectionnée."
            );
        }


        /*
         * Création du dossier utilisateur :
         *
         * shorts/{user_id}/shorts/{uuid}.ext
         */

        const fileExtension =
            getFileExtension(
                selectedShortFile.name
            );


        const uniqueId =
            crypto.randomUUID();


        const videoPath =
            `${currentUser.id}/shorts/${uniqueId}.${fileExtension}`;


        uploadedShortPath =
            videoPath;


        // --------------------------------------------------
        // UPLOAD VIDÉO
        // --------------------------------------------------

        showProgressState(
            10,
            "Importation de la vidéo..."
        );


        const {
            error: uploadError
        } = await supabase
            .storage
            .from(SHORTS_BUCKET)
            .upload(
                videoPath,
                selectedShortFile,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType:
                        selectedShortFile.type ||
                        "video/mp4"
                }
            );


        if (uploadError) {
            throw uploadError;
        }


        showProgressState(
            55,
            "Vidéo importée. Préparation des informations..."
        );


        // --------------------------------------------------
        // MINIATURE
        // --------------------------------------------------

        if (selectedThumbnailFile) {

            const thumbnailExtension =
                getFileExtension(
                    selectedThumbnailFile.name
                );


            const thumbnailPath =
                `${currentUser.id}/thumbnails/${uniqueId}.${thumbnailExtension}`;


            const {
                error: thumbnailError
            } = await supabase
                .storage
                .from(SHORTS_BUCKET)
                .upload(
                    thumbnailPath,
                    selectedThumbnailFile,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType:
                            selectedThumbnailFile.type
                    }
                );


            if (thumbnailError) {
                throw thumbnailError;
            }


            uploadedThumbnailPath =
                thumbnailPath;

        }


        showProgressState(
            70,
            "Création du Short..."
        );


        // --------------------------------------------------
        // INSERT SHORT
        // --------------------------------------------------

        const title =
            shortTitle?.value?.trim() ||
            null;


        const description =
            shortDescription?.value?.trim() ||
            null;


        const categoryId =
            shortCategory?.value ||
            null;


        const language =
            shortLanguage?.value ||
            "fr";


        const visibility =
            getVisibility();


        /*
         * video_url contient volontairement
         * le chemin Storage.
         *
         * Le bucket "shorts" est privé.
         * Nous ne stockons donc PAS une URL publique.
         */

        const {
            data: shortData,
            error: shortError
        } = await supabase
            .from("shorts")
            .insert({
                channel_id:
                    channel.id,

                title,

                description,

                video_url:
                    videoPath,

                thumbnail_url:
                    uploadedThumbnailPath,

                duration:
                    0,

                category_id:
                    categoryId,

                language,

                visibility,

                status:
                    "published",

                views:
                    0,

                likes:
                    0,

                comments_count:
                    0,

                shares_count:
                    0,

                comments_enabled:
                    true,

                published_at:
                    new Date().toISOString()
            })
            .select("id")
            .single();


        if (shortError) {
            throw shortError;
        }


        shortId =
            shortData?.id;


        if (!shortId) {

            throw new Error(
                "Le Short n'a pas pu être créé."
            );

        }


        showProgressState(
            85,
            "Enregistrement des tags..."
        );


        // --------------------------------------------------
        // TAGS
        // --------------------------------------------------

        await saveTags(
            shortId
        );


        showProgressState(
            100,
            "Short publié avec succès."
        );


        showSuccess(
            "Votre Short a été publié."
        );


        setTimeout(
            () => {

                window.location.href =
                    `shorts.html?id=${encodeURIComponent(
                        shortId
                    )}`;

            },
            900
        );


    } catch (error) {

        console.error(
            "NetView upload-short error:",
            error
        );


        /*
         * Si le Short n'a pas encore été créé,
         * on nettoie les fichiers uploadés.
         */

        if (!shortId) {

            await cleanupUploadedFiles();

        }


        showError(
            getFriendlyUploadError(error)
        );


        hideProgress();

    } finally {

        isUploading = false;

        updatePublishButton();

    }
}


// ==========================================================
// TAGS
// ==========================================================

async function saveTags(shortId) {

    if (!shortTags) {
        return;
    }


    const raw =
        shortTags.value
            ?.trim();


    if (!raw) {
        return;
    }


    const tags =
        parseTags(raw);


    if (tags.length === 0) {
        return;
    }


    const rows =
        tags.map(
            tag => ({
                short_id:
                    shortId,

                tag
            })
        );


    const {
        error
    } = await supabase
        .from("short_tags")
        .insert(rows);


    if (error) {
        throw error;
    }
}


function parseTags(value) {

    const uniqueTags =
        new Set();


    value
        .split(",")
        .map(
            tag =>
                tag
                    .trim()
                    .replace(
                        /^#/,
                        ""
                    )
        )
        .filter(Boolean)
        .forEach(
            tag => {

                const normalized =
                    tag
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .slice(
                            0,
                            100
                        );


                if (normalized) {

                    uniqueTags.add(
                        normalized
                    );

                }

            }
        );


    return [
        ...uniqueTags
    ].slice(
        0,
        30
    );
}


// ==========================================================
// VALIDATION
// ==========================================================

function validateForm() {

    if (!currentUser) {

        return {
            valid: false,
            message:
                "Vous devez être connecté."
        };

    }


    if (!selectedChannel) {

        return {
            valid: false,
            message:
                "Sélectionnez une chaîne."
        };

    }


    if (!selectedShortFile) {

        return {
            valid: false,
            message:
                "Sélectionnez un fichier vidéo."
        };

    }


    const title =
        shortTitle?.value?.trim() ||
        "";


    if (!title) {

        return {
            valid: false,
            message:
                "Le titre du Short est obligatoire."
        };

    }


    if (
        title.length >
        MAX_TITLE_LENGTH
    ) {

        return {
            valid: false,
            message:
                "Le titre est trop long."
        };

    }


    const description =
        shortDescription?.value?.trim() ||
        "";


    if (
        description.length >
        MAX_DESCRIPTION_LENGTH
    ) {

        return {
            valid: false,
            message:
                "La description est trop longue."
        };

    }


    const tags =
        shortTags?.value?.trim() ||
        "";


    if (
        tags.length >
        MAX_TAGS_LENGTH
    ) {

        return {
            valid: false,
            message:
                "La liste des tags est trop longue."
        };

    }


    return {
        valid: true
    };
}


function validateVideoFile(file) {

    if (!file) {

        return {
            valid: false,
            message:
                "Aucun fichier sélectionné."
        };

    }


    if (
        !ALLOWED_VIDEO_TYPES.includes(
            file.type
        )
    ) {

        return {
            valid: false,
            message:
                "Format vidéo non pris en charge. Utilisez MP4, WebM, MOV ou MKV."
        };

    }


    if (
        file.size >
        MAX_VIDEO_SIZE
    ) {

        return {
            valid: false,
            message:
                "La vidéo ne doit pas dépasser 2 Go."
        };

    }


    return {
        valid: true
    };
}


// ==========================================================
// SELECTED CHANNEL
// ==========================================================

function getSelectedChannel() {

    if (
        selectedChannel
    ) {

        return selectedChannel;

    }


    const channelId =
        channelSelect?.value;


    if (!channelId) {
        return null;
    }


    return (
        currentChannels.find(
            channel =>
                channel.id ===
                channelId
        ) || null
    );
}


// ==========================================================
// VISIBILITY
// ==========================================================

function getVisibility() {

    const selected =
        document.querySelector(
            'input[name="visibility"]:checked'
        );


    return (
        selected?.value ||
        "public"
    );
}


// ==========================================================
// PUBLISH BUTTON
// ==========================================================

function updatePublishButton() {

    if (!publishButton) {
        return;
    }


    const valid =
        Boolean(
            currentUser &&
            selectedChannel &&
            selectedShortFile &&
            shortTitle?.value?.trim()
        );


    publishButton.disabled =
        isUploading ||
        !valid;


    if (isUploading) {

        publishButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Publication...

        `;

        return;
    }


    publishButton.innerHTML = `

        <i class="fa-solid fa-bolt"></i>

        Publier le Short

    `;
}


// ==========================================================
// PROGRESS
// ==========================================================

function showProgress() {

    uploadProgressContainer?.classList.remove(
        "hidden"
    );
}


function hideProgress() {

    uploadProgressContainer?.classList.add(
        "hidden"
    );
}


function showProgressState(
    percent,
    text
) {

    const safePercent =
        Math.max(
            0,
            Math.min(
                100,
                Number(percent) || 0
            )
        );


    if (uploadProgressBar) {

        uploadProgressBar.style.width =
            `${safePercent}%`;

    }


    if (uploadProgressPercent) {

        uploadProgressPercent.textContent =
            `${Math.round(
                safePercent
            )}%`;

    }


    if (uploadProgressText) {

        uploadProgressText.textContent =
            text || "";

    }
}


// ==========================================================
// CLEANUP STORAGE
// ==========================================================

async function cleanupUploadedFiles() {

    const paths = [];


    if (uploadedShortPath) {

        paths.push(
            uploadedShortPath
        );

    }


    if (uploadedThumbnailPath) {

        paths.push(
            uploadedThumbnailPath
        );

    }


    if (
        paths.length === 0
    ) {
        return;
    }


    try {

        await supabase
            .storage
            .from(SHORTS_BUCKET)
            .remove(paths);

    } catch (error) {

        console.warn(
            "NetView: impossible de nettoyer les fichiers temporaires.",
            error
        );

    }


    uploadedShortPath =
        null;

    uploadedThumbnailPath =
        null;
}


// ==========================================================
// PAGE LOADER
// ==========================================================

function showPageLoader() {

    pageLoader?.classList.remove(
        "hidden"
    );
}


function hidePageLoader() {

    pageLoader?.classList.add(
        "hidden"
    );
}


// ==========================================================
// ERROR / SUCCESS
// ==========================================================

function showError(message) {

    let element =
        document.getElementById(
            "uploadShortError"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );

        element.id =
            "uploadShortError";

        element.className =
            "upload-message upload-message-error";

        uploadForm?.prepend(
            element
        );

    }


    element.textContent =
        message ||
        "Une erreur est survenue.";

    element.hidden =
        false;


    element.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function hideError() {

    const element =
        document.getElementById(
            "uploadShortError"
        );


    if (element) {
        element.hidden =
            true;
    }
}


function showSuccess(message) {

    let element =
        document.getElementById(
            "uploadShortSuccess"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );

        element.id =
            "uploadShortSuccess";

        element.className =
            "upload-message upload-message-success";

        uploadForm?.prepend(
            element
        );

    }


    element.textContent =
        message ||
        "Opération réussie.";

    element.hidden =
        false;
}


// ==========================================================
// AUTH REDIRECT
// ==========================================================

function redirectToAuth() {

    window.location.href =
        "auth.html?redirect=upload-short.html";
}


// ==========================================================
// FRIENDLY ERRORS
// ==========================================================

function getFriendlyUploadError(error) {

    const message =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    if (
        message.includes(
            "row-level security"
        ) ||
        message.includes(
            "violates row-level security"
        )
    ) {

        return (
            "Publication refusée par les règles de sécurité."
        );

    }


    if (
        message.includes(
            "duplicate"
        )
    ) {

        return (
            "Ce fichier existe déjà."
        );

    }


    if (
        message.includes(
            "payload too large"
        ) ||
        message.includes(
            "file too large"
        )
    ) {

        return (
            "Le fichier est trop volumineux."
        );

    }


    if (
        message.includes(
            "network"
        ) ||
        message.includes(
            "fetch"
        )
    ) {

        return (
            "Une erreur réseau est survenue. Vérifiez votre connexion."
        );

    }


    return (
        error?.message ||
        "Impossible de publier le Short."
    );
}


// ==========================================================
// FILE HELPERS
// ==========================================================

function getFileExtension(
    filename
) {

    const cleanName =
        String(
            filename || ""
        )
            .split("?")[0]
            .split("#")[0];


    const parts =
        cleanName.split(".");


    if (
        parts.length < 2
    ) {

        return "mp4";

    }


    const extension =
        parts
            .pop()
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            );


    return extension ||
        "mp4";
}


function formatFileSize(
    bytes
) {

    const size =
        Number(bytes);


    if (
        !Number.isFinite(size) ||
        size <= 0
    ) {

        return "0 octet";

    }


    const units = [
        "octets",
        "Ko",
        "Mo",
        "Go",
        "To"
    ];


    let value =
        size;

    let index =
        0;


    while (
        value >= 1024 &&
        index < units.length - 1
    ) {

        value /=
            1024;

        index++;

    }


    const decimals =
        index === 0
            ? 0
            : value >= 100
                ? 0
                : 1;


    return (
        `${value.toFixed(
            decimals
        )} ${units[index]}`
    );
}


// ==========================================================
// HTML SECURITY
// ==========================================================

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


// ==========================================================
// BEFORE UNLOAD
// ==========================================================

window.addEventListener(
    "beforeunload",
    event => {

        if (!isUploading) {
            return;
        }

        event.preventDefault();

        event.returnValue =
            "";

    }
);
