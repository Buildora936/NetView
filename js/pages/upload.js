// ==========================================
// NetView
// upload.js
// ==========================================
import{
    getSession,
    getUser
}from "../core/auth.js";

import {
    getMyChannels
} from "../core/data.js";

import {
    supabase
} from "../core/supabase.js";


// ==========================================
// CONSTANTS
// ==========================================

const VIDEO_BUCKET = "videos";

const DEFAULT_AVATAR =
    "assets/images/default-avatar.png";

const MAX_VIDEO_SIZE =
    5 * 1024 * 1024 * 1024; // 5 GB

const MAX_THUMBNAIL_SIZE =
    10 * 1024 * 1024; // 10 MB

const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
    "video/x-msvideo"
];

const ALLOWED_VIDEO_EXTENSIONS = [
    "mp4",
    "webm",
    "mov",
    "mkv",
    "avi"
];

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// ==========================================
// DOM
// ==========================================

const sidebar =
    document.getElementById("sidebar");

const sidebarNav =
    sidebar?.querySelector(
        ".nv-sidebar-nav"
    );

const sidebarToggle =
    document.getElementById("menuButton");

const sidebarOverlay =
    document.getElementById(
        "sidebarOverlay"
    );

const headerRight =
    document.getElementById(
        "headerRight"
    );

const searchForm =
    document.getElementById(
        "searchForm"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );


// ==========================================
// FORM
// ==========================================

const uploadForm =
    document.getElementById(
        "uploadForm"
    );

const videoInput =
    document.getElementById(
        "videoInput"
    );

const thumbnailInput =
    document.getElementById(
        "thumbnailInput"
    );

const titleInput =
    document.getElementById(
        "title"
    );

const descriptionInput =
    document.getElementById(
        "description"
    );

const channelSelect =
    document.getElementById(
        "channelId"
    );

const categorySelect =
    document.getElementById(
        "categoryId"
    );

const languageSelect =
    document.getElementById(
        "language"
    );

const visibilitySelect =
    document.getElementById(
        "visibility"
    );

const tagsInput =
    document.getElementById(
        "tags"
    );


// ==========================================
// VIDEO PREVIEW
// ==========================================

const videoPreview =
    document.getElementById(
        "videoPreview"
    );

const videoPreviewContainer =
    document.getElementById(
        "videoPreviewContainer"
    );

const thumbnailPreview =
    document.getElementById(
        "thumbnailPreview"
    );

const thumbnailPreviewContainer =
    document.getElementById(
        "thumbnailPreviewContainer"
    );

const videoFileName =
    document.getElementById(
        "videoFileName"
    );

const thumbnailFileName =
    document.getElementById(
        "thumbnailFileName"
    );


// ==========================================
// PROGRESS
// ==========================================

const progressContainer =
    document.getElementById(
        "uploadProgressContainer"
    );

const progressBar =
    document.getElementById(
        "uploadProgress"
    );

const progressText =
    document.getElementById(
        "uploadProgressText"
    );

const progressStatus =
    document.getElementById(
        "uploadProgressStatus"
    );

const submitButton =
    document.getElementById(
        "publishButton"
    );

const errorContainer =
    document.getElementById(
        "uploadError"
    );

const errorMessage =
    document.getElementById(
        "uploadErrorMessage"
    );

const successContainer =
    document.getElementById(
        "uploadSuccess"
    );

const successMessage =
    document.getElementById(
        "uploadSuccessMessage"
    );


// ==========================================
// STATE
// ==========================================

let currentUser = null;

let currentProfile = null;

let channels = [];

let selectedVideo = null;

let selectedThumbnail = null;

let videoObjectUrl = null;

let thumbnailObjectUrl = null;

let isUploading = false;

let createdVideoId = null;

let uploadedVideoPath = null;

let uploadedThumbnailPath = null;


// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    setupSidebarEvents();

    setupSearch();

    setupForm();

    setupVideoInput();

    setupThumbnailInput();

    try {

        const session =
            await getSession();

        if (!session) {

            showGuestHeader();

            showGuestSidebar();

            showAuthenticationRequired();

            return;
        }


        currentUser =
            await getUser();


        if (!currentUser) {

            showGuestHeader();

            showGuestSidebar();

            showAuthenticationRequired();

            return;
        }


        showUserHeader();

        showUserSidebar();


        await loadUserChannels();

        setupDefaultValues();

    } catch (error) {

        console.error(
            "NetView upload initialization error:",
            error
        );

        showError(
            "Impossible d'initialiser la publication."
        );

    }

}


// ==========================================
// HEADER — GUEST
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
            title="S'identifier"
        >

            <i class="fa-regular fa-user"></i>

            <span>
                S'identifier
            </span>

        </button>

    `;


    document
        .getElementById("loginButton")
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "auth.html";

            }
        );
}


// ==========================================
// HEADER — USER
// ==========================================

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
            id="notificationButton"
            aria-label="Notifications"
            title="Notifications"
        >

            <i class="fa-regular fa-bell"></i>

        </button>


        <a
            href="profile.html"
            class="nv-header-profile-avatar"
            aria-label="Mon profil"
            title="${escapeAttribute(
                displayName
            )}"
        >

            <img
                src="${escapeAttribute(
                    avatar
                )}"
                alt="${escapeAttribute(
                    displayName
                )}"
                loading="lazy"
            >

        </a>

    `;


    document
        .getElementById(
            "uploadButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "upload.html";

            }
        );


    document
        .getElementById(
            "notificationButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "notification.html";

            }
        );
}


// ==========================================
// SIDEBAR — GUEST
// ==========================================

function showGuestSidebar() {

    if (!sidebarNav) {
        return;
    }


    sidebarNav.innerHTML = `

        <a
            href="index.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-house"></i>

            <span>
                Accueil
            </span>

        </a>


        <a
            href="shorts.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-bolt"></i>

            <span>
                Shorts
            </span>

        </a>


        <a
            href="lives.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-tower-broadcast"></i>

            <span>
                Lives
            </span>

        </a>


        <a
            href="search.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-compass"></i>

            <span>
                Explorer
            </span>

        </a>


        <a
            href="netview-shop.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-store"></i>

            <span>
                Boutique
            </span>

        </a>


        <hr>


        <a
            href="auth.html"
            class="nv-sidebar-item"
        >

            <i class="fa-regular fa-user"></i>

            <span>
                S'identifier
            </span>

        </a>

    `;
}


// ==========================================
// SIDEBAR — USER
// ==========================================

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

            <span>
                Accueil
            </span>

        </a>


        <a
            href="shorts.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-bolt"></i>

            <span>
                Shorts
            </span>

        </a>


        <a
            href="subscriptions.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-tv"></i>

            <span>
                Abonnements
            </span>

        </a>


        <a
            href="playlist.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-list"></i>

            <span>
                Playlists
            </span>

        </a>


        <a
            href="history.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-clock-rotate-left"></i>

            <span>
                Historique
            </span>

        </a>


        <a
            href="watch-later.html"
            class="nv-sidebar-item"
        >

            <i class="fa-regular fa-clock"></i>

            <span>
                À regarder
            </span>

        </a>


        <a
            href="liked-videos.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-thumbs-up"></i>

            <span>
                J'aime
            </span>

        </a>


        <hr>


        <a
            href="lives.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-tower-broadcast"></i>

            <span>
                Lives
            </span>

        </a>


        <a
            href="netview-shop.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-store"></i>

            <span>
                Boutique
            </span>

        </a>


        <a
            href="settings.html"
            class="nv-sidebar-item"
        >

            <i class="fa-solid fa-gear"></i>

            <span>
                Paramètres
            </span>

        </a>

    `;
}


// ==========================================
// SIDEBAR EVENTS
// ==========================================

function setupSidebarEvents() {

    sidebarToggle?.addEventListener(
        "click",
        () => {

            if (
                sidebar?.classList.contains(
                    "open"
                )
            ) {

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

    sidebar?.classList.add(
        "open"
    );

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

    sidebar?.classList.remove(
        "open"
    );

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


// ==========================================
// SEARCH
// ==========================================

function setupSearch() {

    searchForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const query =
                searchInput?.value?.trim();

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


// ==========================================
// LOAD CHANNELS
// ==========================================

async function loadUserChannels() {

    channels =
        await getMyChannels();


    if (
        !Array.isArray(channels)
    ) {

        channels = [];

    }


    renderChannels();

}


// ==========================================
// CHANNEL SELECT
// ==========================================

function renderChannels() {

    if (!channelSelect) {
        return;
    }


    channelSelect.innerHTML = "";


    if (
        channels.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value = "";

        option.textContent =
            "Aucune chaîne disponible";

        channelSelect.appendChild(
            option
        );

        channelSelect.disabled =
            true;

        return;
    }


    channelSelect.disabled =
        false;


    channels.forEach(
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

}


// ==========================================
// DEFAULT VALUES
// ==========================================

function setupDefaultValues() {

    if (languageSelect) {

        const exists =
            Array.from(
                languageSelect.options
            ).some(
                option =>
                    option.value === "fr"
            );


        if (exists) {

            languageSelect.value =
                "fr";

        }

    }


    if (visibilitySelect) {

        if (
            Array.from(
                visibilitySelect.options
            ).some(
                option =>
                    option.value === "public"
            )
        ) {

            visibilitySelect.value =
                "public";

        }

    }

}


// ==========================================
// FORM EVENTS
// ==========================================

function setupForm() {

    uploadForm?.addEventListener(
        "submit",
        handleSubmit
    );

}


// ==========================================
// VIDEO INPUT
// ==========================================

function setupVideoInput() {

    videoInput?.addEventListener(
        "change",
        handleVideoSelection
    );

}


async function handleVideoSelection(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    clearError();


    const validation =
        validateVideo(file);


    if (!validation.valid) {

        videoInput.value = "";

        showError(
            validation.message
        );

        return;
    }


    selectedVideo =
        file;


    if (videoObjectUrl) {

        URL.revokeObjectURL(
            videoObjectUrl
        );

    }


    videoObjectUrl =
        URL.createObjectURL(
            file
        );


    if (videoPreview) {

        videoPreview.src =
            videoObjectUrl;

        videoPreview.load();

    }


    showElement(
        videoPreviewContainer
    );


    if (videoFileName) {

        videoFileName.textContent =
            file.name;

    }


    updateSubmitState();

}


// ==========================================
// THUMBNAIL INPUT
// ==========================================

function setupThumbnailInput() {

    thumbnailInput?.addEventListener(
        "change",
        handleThumbnailSelection
    );

}


function handleThumbnailSelection(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    clearError();


    const validation =
        validateThumbnail(file);


    if (!validation.valid) {

        thumbnailInput.value = "";

        showError(
            validation.message
        );

        return;
    }


    selectedThumbnail =
        file;


    if (thumbnailObjectUrl) {

        URL.revokeObjectURL(
            thumbnailObjectUrl
        );

    }


    thumbnailObjectUrl =
        URL.createObjectURL(
            file
        );


    if (thumbnailPreview) {

        thumbnailPreview.src =
            thumbnailObjectUrl;

    }


    showElement(
        thumbnailPreviewContainer
    );


    if (thumbnailFileName) {

        thumbnailFileName.textContent =
            file.name;

    }

}


// ==========================================
// VIDEO VALIDATION
// ==========================================

function validateVideo(
    file
) {

    if (
        !file ||
        !file.name
    ) {

        return {
            valid: false,
            message:
                "Veuillez sélectionner une vidéo."
        };

    }


    if (
        file.size <= 0
    ) {

        return {
            valid: false,
            message:
                "Le fichier vidéo est vide."
        };

    }


    if (
        file.size >
        MAX_VIDEO_SIZE
    ) {

        return {
            valid: false,
            message:
                "La vidéo dépasse la taille maximale autorisée de 5 Go."
        };

    }


    const extension =
        getFileExtension(
            file.name
        );


    const typeValid =
        ALLOWED_VIDEO_TYPES.includes(
            file.type
        );


    const extensionValid =
        ALLOWED_VIDEO_EXTENSIONS.includes(
            extension
        );


    if (
        !typeValid &&
        !extensionValid
    ) {

        return {
            valid: false,
            message:
                "Format vidéo non pris en charge. Utilisez MP4, WebM, MOV, MKV ou AVI."
        };

    }


    return {
        valid: true
    };

}


// ==========================================
// THUMBNAIL VALIDATION
// ==========================================

function validateThumbnail(
    file
) {

    if (
        !file ||
        !file.name
    ) {

        return {
            valid: false,
            message:
                "Veuillez sélectionner une miniature."
        };

    }


    if (
        file.size >
        MAX_THUMBNAIL_SIZE
    ) {

        return {
            valid: false,
            message:
                "La miniature dépasse 10 Mo."
        };

    }


    if (
        !ALLOWED_IMAGE_TYPES.includes(
            file.type
        )
    ) {

        return {
            valid: false,
            message:
                "Format de miniature non pris en charge. Utilisez JPG, PNG ou WebP."
        };

    }


    return {
        valid: true
    };

}


// ==========================================
// SUBMIT
// ==========================================

async function handleSubmit(
    event
) {

    event.preventDefault();


    if (isUploading) {
        return;
    }


    clearError();

    hideElement(
        successContainer
    );


    const validation =
        validateForm();


    if (!validation.valid) {

        showError(
            validation.message
        );

        return;
    }


    isUploading = true;

    createdVideoId = null;

    uploadedVideoPath = null;

    uploadedThumbnailPath = null;


    setUploadingState(
        true
    );


    try {

        // --------------------------------------
        // SESSION
        // --------------------------------------

        const session =
            await getSession();


        if (!session) {

            throw new Error(
                "Vous devez être connecté pour publier une vidéo."
            );

        }


        currentUser =
            await getUser();


        if (!currentUser?.id) {

            throw new Error(
                "Impossible de récupérer votre compte NetView."
            );

        }


        // --------------------------------------
        // FORM DATA
        // --------------------------------------

        const formData =
            getFormData();


        // --------------------------------------
        // CREATE VIDEO
        // --------------------------------------

        updateProgress(
            5,
            "Création de la publication..."
        );


        const video =
            await createVideoRecord(
                formData
            );


        createdVideoId =
            video.id;


        // --------------------------------------
        // VIDEO STORAGE
        // --------------------------------------

        updateProgress(
            15,
            "Envoi de la vidéo..."
        );


        uploadedVideoPath =
            await uploadVideoFile(
                video.id,
                selectedVideo
            );


        // --------------------------------------
        // VIDEO FILE
        // --------------------------------------

        updateProgress(
            70,
            "Enregistrement du fichier vidéo..."
        );


        await createVideoFileRecord(
            video.id,
            uploadedVideoPath,
            selectedVideo
        );


        // --------------------------------------
        // THUMBNAIL
        // --------------------------------------

        let thumbnailUrl = null;


        if (selectedThumbnail) {

            updateProgress(
                75,
                "Envoi de la miniature..."
            );


            uploadedThumbnailPath =
                await uploadThumbnail(
                    video.id,
                    selectedThumbnail
                );


            thumbnailUrl =
                uploadedThumbnailPath;

        }


        // --------------------------------------
        // UPDATE THUMBNAIL
        // --------------------------------------

        if (thumbnailUrl) {

            updateProgress(
                85,
                "Mise à jour de la publication..."
            );


            await updateVideoThumbnail(
                video.id,
                thumbnailUrl
            );

        }


        // --------------------------------------
        // TAGS
        // --------------------------------------

        updateProgress(
            90,
            "Enregistrement des tags..."
        );


        await createVideoTags(
            video.id,
            formData.tags
        );


        // --------------------------------------
        // FINALIZE
        // --------------------------------------

        updateProgress(
            96,
            "Finalisation..."
        );


        await finalizeVideo(
            video.id
        );


        updateProgress(
            100,
            "Publication terminée."
        );


        showSuccess(
            "Votre vidéo a été publiée avec succès."
        );


        setTimeout(
            () => {

                window.location.href =
                    `player.html?id=${encodeURIComponent(
                        video.id
                    )}`;

            },
            800
        );


    } catch (error) {

        console.error(
            "NetView upload error:",
            error
        );


        await cleanupUpload();


        showError(
            getErrorMessage(error)
        );


    } finally {

        isUploading =
            false;

        setUploadingState(
            false
        );

    }

}


// ==========================================
// FORM VALIDATION
// ==========================================

function validateForm() {

    if (!selectedVideo) {

        return {
            valid: false,
            message:
                "Veuillez sélectionner une vidéo."
        };

    }


    if (
        !channelSelect?.value
    ) {

        return {
            valid: false,
            message:
                "Veuillez sélectionner une chaîne."
        };

    }


    const channelExists =
        channels.some(
            channel =>
                channel.id ===
                channelSelect.value
        );


    if (!channelExists) {

        return {
            valid: false,
            message:
                "La chaîne sélectionnée n'appartient pas à votre compte."
        };

    }


    const title =
        titleInput?.value?.trim();


    if (!title) {

        return {
            valid: false,
            message:
                "Veuillez saisir un titre."
        };

    }


    if (title.length > 200) {

        return {
            valid: false,
            message:
                "Le titre ne peut pas dépasser 200 caractères."
        };

    }


    if (
        descriptionInput?.value?.length >
        5000
    ) {

        return {
            valid: false,
            message:
                "La description ne peut pas dépasser 5000 caractères."
        };

    }


    return {
        valid: true
    };

}


// ==========================================
// GET FORM DATA
// ==========================================

function getFormData() {

    return {

        channelId:
            channelSelect.value,

        title:
            titleInput.value.trim(),

        description:
            descriptionInput?.value?.trim() ||
            null,

        categoryId:
            categorySelect?.value ||
            null,

        language:
            languageSelect?.value ||
            "fr",

        visibility:
            visibilitySelect?.value ||
            "public",

        tags:
            normalizeTags(
                tagsInput?.value ||
                ""
            )

    };

}


// ==========================================
// NORMALIZE TAGS
// ==========================================

function normalizeTags(
    value
) {

    return [
        ...new Set(

            String(value)
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
                .slice(0, 30)

        )
    ];

}


// ==========================================
// CREATE VIDEO
// ==========================================

async function createVideoRecord(
    formData
) {

    const payload = {

        channel_id:
            formData.channelId,

        title:
            formData.title,

        description:
            formData.description,

        thumbnail_url:
            null,

        visibility:
            formData.visibility,

        status:
            "processing",

        duration:
            0,

        category_id:
            formData.categoryId,

        language:
            formData.language,

        published_at:
            null

    };


    const {
        data,
        error
    } =
        await supabase
            .from("videos")
            .insert(payload)
            .select("*")
            .single();


    if (error) {
        throw error;
    }


    if (!data?.id) {

        throw new Error(
            "La vidéo n'a pas pu être créée."
        );

    }


    return data;

}


// ==========================================
// UPLOAD VIDEO
// ==========================================

async function uploadVideoFile(
    videoId,
    file
) {

    if (
        !currentUser?.id ||
        !videoId ||
        !file
    ) {

        throw new Error(
            "Informations vidéo invalides."
        );

    }


    const extension =
        getFileExtension(
            file.name
        ) || "mp4";


    const path =
        `${currentUser.id}/${videoId}/original.${extension}`;


    const {
        error
    } =
        await supabase
            .storage
            .from(VIDEO_BUCKET)
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type ||
                        "video/mp4"
                }
            );


    if (error) {
        throw error;
    }


    return path;

}


// ==========================================
// CREATE VIDEO FILE
// ==========================================

async function createVideoFileRecord(
    videoId,
    filePath,
    file
) {

    const {
        error
    } =
        await supabase
            .from("video_files")
            .insert({

                video_id:
                    videoId,

                quality:
                    "original",

                file_url:
                    filePath,

                file_size:
                    file.size

            });


    if (error) {
        throw error;
    }

}


// ==========================================
// UPLOAD THUMBNAIL
// ==========================================

async function uploadThumbnail(
    videoId,
    file
) {

    if (
        !currentUser?.id ||
        !videoId ||
        !file
    ) {

        throw new Error(
            "Miniature invalide."
        );

    }


    const extension =
        getFileExtension(
            file.name
        ) || "jpg";


    const path =
        `${currentUser.id}/${videoId}/thumbnail.${extension}`;


    const {
        error
    } =
        await supabase
            .storage
            .from(VIDEO_BUCKET)
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (error) {
        throw error;
    }


    return path;

}


// ==========================================
// UPDATE THUMBNAIL
// ==========================================

async function updateVideoThumbnail(
    videoId,
    thumbnailPath
) {

    const {
        error
    } =
        await supabase
            .from("videos")
            .update({

                thumbnail_url:
                    thumbnailPath,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                videoId
            );


    if (error) {
        throw error;
    }

}


// ==========================================
// CREATE TAGS
// ==========================================

async function createVideoTags(
    videoId,
    tags
) {

    if (
        !Array.isArray(tags) ||
        tags.length === 0
    ) {

        return;
    }


    const rows =
        tags.map(
            tag => ({

                video_id:
                    videoId,

                tag:
                    tag

            })
        );


    const {
        error
    } =
        await supabase
            .from("video_tags")
            .insert(rows);


    if (error) {
        throw error;
    }

}


// ==========================================
// FINALIZE VIDEO
// ==========================================

async function finalizeVideo(
    videoId
) {

    const {
        error
    } =
        await supabase
            .from("videos")
            .update({

                status:
                    "published",

                published_at:
                    new Date().toISOString(),

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                videoId
            );


    if (error) {
        throw error;
    }

}


// ==========================================
// CLEANUP UPLOAD
// ==========================================

async function cleanupUpload() {

    // ------------------------------------------
    // Delete video file
    // ------------------------------------------

    if (
        uploadedVideoPath
    ) {

        try {

            await supabase
                .storage
                .from(VIDEO_BUCKET)
                .remove([
                    uploadedVideoPath
                ]);

        } catch (error) {

            console.warn(
                "NetView video cleanup error:",
                error
            );

        }

    }


    // ------------------------------------------
    // Delete thumbnail
    // ------------------------------------------

    if (
        uploadedThumbnailPath
    ) {

        try {

            await supabase
                .storage
                .from(VIDEO_BUCKET)
                .remove([
                    uploadedThumbnailPath
                ]);

        } catch (error) {

            console.warn(
                "NetView thumbnail cleanup error:",
                error
            );

        }

    }


    // ------------------------------------------
    // Delete database record
    // ------------------------------------------

    if (
        createdVideoId
    ) {

        try {

            await supabase
                .from("videos")
                .delete()
                .eq(
                    "id",
                    createdVideoId
                );

        } catch (error) {

            console.warn(
                "NetView database cleanup error:",
                error
            );

        }

    }


    createdVideoId =
        null;

    uploadedVideoPath =
        null;

    uploadedThumbnailPath =
        null;

}


// ==========================================
// PROGRESS
// ==========================================

function updateProgress(
    percentage,
    message
) {

    const value =
        Math.max(
            0,
            Math.min(
                100,
                Number(percentage)
            )
        );


    if (progressBar) {

        progressBar.style.width =
            `${value}%`;

        progressBar.setAttribute(
            "aria-valuenow",
            String(value)
        );

    }


    if (progressText) {

        progressText.textContent =
            `${Math.round(value)}%`;

    }


    if (progressStatus) {

        progressStatus.textContent =
            message ||
            "Traitement...";

    }


    showElement(
        progressContainer
    );

}


// ==========================================
// UPLOADING STATE
// ==========================================

function setUploadingState(
    uploading
) {

    if (submitButton) {

        submitButton.disabled =
            uploading;

        submitButton.setAttribute(
            "aria-busy",
            String(uploading)
        );


        if (uploading) {

            submitButton.dataset.originalText =
                submitButton.innerHTML;


            submitButton.innerHTML = `

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

                <span>
                    Publication...
                </span>

            `;

        } else if (
            submitButton.dataset.originalText
        ) {

            submitButton.innerHTML =
                submitButton.dataset.originalText;

        }

    }


    if (uploadForm) {

        uploadForm
            .querySelectorAll(
                "input, textarea, select"
            )
            .forEach(
                element => {

                    element.disabled =
                        uploading;

                }
            );

    }

}


// ==========================================
// SUBMIT STATE
// ==========================================

function updateSubmitState() {

    if (!submitButton) {
        return;
    }


    submitButton.disabled =
        !selectedVideo ||
        !currentUser ||
        channels.length === 0 ||
        isUploading;

}


// ==========================================
// AUTHENTICATION REQUIRED
// ==========================================

function showAuthenticationRequired() {

    if (uploadForm) {

        uploadForm.style.display =
            "none";

    }


    showError(
        "Connectez-vous à votre compte NetView pour publier une vidéo."
    );

}


// ==========================================
// ERROR
// ==========================================

function showError(
    message
) {

    if (!errorContainer) {

        alert(message);

        return;

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    showElement(
        errorContainer
    );


    errorContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


function clearError() {

    hideElement(
        errorContainer
    );

    if (errorMessage) {

        errorMessage.textContent =
            "";

    }

}


// ==========================================
// SUCCESS
// ==========================================

function showSuccess(
    message
) {

    if (!successContainer) {
        return;
    }


    if (successMessage) {

        successMessage.textContent =
            message;

    }


    showElement(
        successContainer
    );

}


// ==========================================
// GENERIC ELEMENT HELPERS
// ==========================================

function showElement(
    element
) {

    if (!element) {
        return;
    }


    element.hidden =
        false;

}


function hideElement(
    element
) {

    if (!element) {
        return;
    }


    element.hidden =
        true;

}


// ==========================================
// FILE EXTENSION
// ==========================================

function getFileExtension(
    filename
) {

    const name =
        String(
            filename || ""
        )
        .toLowerCase();


    const index =
        name.lastIndexOf(".");


    if (
        index === -1
    ) {

        return "";

    }


    return name
        .slice(index + 1)
        .replace(
            /[^a-z0-9]/g,
            ""
        );

}


// ==========================================
// ERROR MESSAGE
// ==========================================

function getErrorMessage(
    error
) {

    if (!error) {

        return (
            "Une erreur est survenue pendant la publication."
        );

    }


    const message =
        String(
            error.message ||
            error.error_description ||
            error.details ||
            ""
        );


    if (
        message.includes(
            "Payload too large"
        )
    ) {

        return (
            "La vidéo est trop volumineuse."
        );

    }


    if (
        message.includes(
            "duplicate"
        ) ||
        message.includes(
            "already exists"
        )
    ) {

        return (
            "Un fichier portant ce nom existe déjà."
        );

    }


    if (
        message.includes(
            "row-level security"
        ) ||
        message.includes(
            "RLS"
        )
    ) {

        return (
            "Vous n'avez pas l'autorisation d'effectuer cette opération."
        );

    }


    if (
        message.includes(
            "not found"
        )
    ) {

        return (
            "La ressource demandée est introuvable."
        );

    }


    return (
        message ||
        "Une erreur est survenue pendant la publication."
    );

}


// ==========================================
// HTML SECURITY
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
// PAGE CLEANUP
// ==========================================

window.addEventListener(
    "beforeunload",
    () => {

        if (videoObjectUrl) {

            URL.revokeObjectURL(
                videoObjectUrl
            );

        }


        if (thumbnailObjectUrl) {

            URL.revokeObjectURL(
                thumbnailObjectUrl
            );

        }

    }
);
