// =========================================================
// NetView
// edit-video.js
//
// Jour 20 — Modification vidéo / Short
// =========================================================

import {
    getSession,
    getUser
} from "../core/auth.js";

import {
    getProfile,
    getMyChannels,
    select,
    remove
} from "../core/data.js";

import {
    supabase
} from "../core/supabase.js";


// =========================================================
// CONSTANTS
// =========================================================

const DEFAULT_AVATAR =
    "assets/images/default-avatar.png";

const DEFAULT_THUMBNAIL =
    "NetView.png";

const VIDEO_BUCKET =
    "videos";

const THUMBNAIL_BUCKET =
    "thumbnails";

const MAX_TITLE_LENGTH =
    150;

const MAX_DESCRIPTION_LENGTH =
    5000;

const MAX_TAG_LENGTH =
    100;

const MAX_TAGS =
    30;

const MAX_THUMBNAIL_SIZE =
    10 * 1024 * 1024;


// =========================================================
// DOM
// =========================================================

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

const editForm =
    document.getElementById(
        "editVideoForm"
    ) ||
    document.getElementById(
        "editForm"
    );

const titleInput =
    document.getElementById(
        "videoTitle"
    ) ||
    document.getElementById(
        "shortTitle"
    ) ||
    document.getElementById(
        "title"
    );

const descriptionInput =
    document.getElementById(
        "videoDescription"
    ) ||
    document.getElementById(
        "shortDescription"
    ) ||
    document.getElementById(
        "description"
    );

const categoryInput =
    document.getElementById(
        "videoCategory"
    ) ||
    document.getElementById(
        "category"
    ) ||
    document.getElementById(
        "categoryId"
    );

const languageInput =
    document.getElementById(
        "videoLanguage"
    ) ||
    document.getElementById(
        "language"
    );

const tagsInput =
    document.getElementById(
        "videoTags"
    ) ||
    document.getElementById(
        "tags"
    );

const thumbnailInput =
    document.getElementById(
        "thumbnailFile"
    ) ||
    document.getElementById(
        "thumbnail"
    );

const thumbnailPreview =
    document.getElementById(
        "thumbnailPreview"
    );

const thumbnailPlaceholder =
    document.getElementById(
        "thumbnailPlaceholder"
    );

const selectThumbnailButton =
    document.getElementById(
        "selectThumbnailButton"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    ) ||
    document.getElementById(
        "updateButton"
    ) ||
    document.getElementById(
        "publishButton"
    );

const deleteButton =
    document.getElementById(
        "deleteVideoButton"
    ) ||
    document.getElementById(
        "deleteButton"
    );

const pageLoader =
    document.getElementById(
        "pageLoader"
    );

const loaderText =
    pageLoader?.querySelector(
        "p"
    );

const titleCounter =
    document.getElementById(
        "titleCounter"
    );

const descriptionCounter =
    document.getElementById(
        "descriptionCounter"
    );


// =========================================================
// STATE
// =========================================================

let currentUser =
    null;

let currentProfile =
    null;

let currentContent =
    null;

let currentContentType =
    null;

let currentChannel =
    null;

let myChannels =
    [];

let originalThumbnailUrl =
    null;

let selectedThumbnailFile =
    null;

let isSaving =
    false;

let isDeleting =
    false;


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    setupSidebarEvents();

    setupSearch();

    setupFormEvents();

    setupThumbnailEvents();

    setupCounters();

    try {

        showLoader(
            "Vérification de votre session..."
        );

        // -------------------------------------------------
        // SESSION
        // -------------------------------------------------

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


        // -------------------------------------------------
        // PROFILE
        // -------------------------------------------------

        try {

            currentProfile =
                await getProfile();

        } catch (error) {

            console.warn(
                "NetView edit-video: profil indisponible.",
                error
            );

            currentProfile =
                null;
        }


        showUserHeader();

        showUserSidebar();


        // -------------------------------------------------
        // DETECT CONTENT
        // -------------------------------------------------

        const contentRequest =
            getContentRequest();


        if (!contentRequest) {

            showError(
                "Aucun contenu à modifier n'a été indiqué."
            );

            return;
        }


        currentContentType =
            contentRequest.type;


        // -------------------------------------------------
        // LOAD USER CHANNELS
        // -------------------------------------------------

        try {

            myChannels =
                await getMyChannels();

        } catch (error) {

            console.warn(
                "NetView edit-video: impossible de récupérer les chaînes.",
                error
            );

            myChannels =
                [];
        }


        // -------------------------------------------------
        // LOAD CONTENT
        // -------------------------------------------------

        showLoader(
            currentContentType === "short"
                ? "Chargement du Short..."
                : "Chargement de la vidéo..."
        );


        if (
            currentContentType === "short"
        ) {

            await loadShort(
                contentRequest.id
            );

        } else {

            await loadVideo(
                contentRequest.id
            );

        }


        // -------------------------------------------------
        // PAGE
        // -------------------------------------------------

        populateForm();

        updatePageType();

        updateCounters();

        updateSaveButton();


    } catch (error) {

        console.error(
            "NetView edit-video initialization error:",
            error
        );

        showError(
            "Impossible de charger le contenu à modifier."
        );

    } finally {

        hideLoader();

    }
}


// =========================================================
// CONTENT REQUEST
// =========================================================

function getContentRequest() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    // -----------------------------------------------------
    // SHORT PARAMETER
    // -----------------------------------------------------

    const shortId =
        params.get("short");


    if (shortId) {

        return {
            id: shortId,
            type: "short"
        };

    }


    // -----------------------------------------------------
    // EXPLICIT TYPE
    // -----------------------------------------------------

    const type =
        (
            params.get("type") ||
            ""
        )
            .trim()
            .toLowerCase();


    const id =
        (
            params.get("id") ||
            params.get("video") ||
            ""
        ).trim();


    if (!id) {
        return null;
    }


    if (
        type === "short" ||
        type === "shorts"
    ) {

        return {
            id,
            type: "short"
        };

    }


    return {
        id,
        type: "video"
    };
}


// =========================================================
// LOAD VIDEO
// =========================================================

async function loadVideo(
    videoId
) {

    const result =
        await select(
            "videos",
            "*",
            [
                {
                    method: "eq",
                    column: "id",
                    value: videoId
                }
            ]
        );


    if (result?.error) {
        throw result.error;
    }


    const videos =
        Array.isArray(result?.data)
            ? result.data
            : [];


    if (
        videos.length === 0
    ) {

        throw new Error(
            "Vidéo introuvable."
        );

    }


    currentContent =
        videos[0];


    // -----------------------------------------------------
    // OWNER CHECK
    // -----------------------------------------------------

    await verifyContentOwnership(
        currentContent.channel_id
    );


    // -----------------------------------------------------
    // LOAD TAGS
    // -----------------------------------------------------

    currentContent.tags =
        await loadVideoTags(
            videoId
        );


    originalThumbnailUrl =
        currentContent.thumbnail_url ||
        null;
}


// =========================================================
// LOAD SHORT
// =========================================================

async function loadShort(
    shortId
) {

    const result =
        await select(
            "shorts",
            "*",
            [
                {
                    method: "eq",
                    column: "id",
                    value: shortId
                }
            ]
        );


    if (result?.error) {
        throw result.error;
    }


    const shorts =
        Array.isArray(result?.data)
            ? result.data
            : [];


    if (
        shorts.length === 0
    ) {

        throw new Error(
            "Short introuvable."
        );

    }


    currentContent =
        shorts[0];


    // -----------------------------------------------------
    // OWNER CHECK
    // -----------------------------------------------------

    await verifyContentOwnership(
        currentContent.channel_id
    );


    originalThumbnailUrl =
        currentContent.thumbnail_url ||
        null;
}


// =========================================================
// LOAD TAGS
// =========================================================

async function loadVideoTags(
    videoId
) {

    try {

        const result =
            await select(
                "video_tags",
                "*",
                [
                    {
                        method: "eq",
                        column: "video_id",
                        value: videoId
                    }
                ]
            );


        if (result?.error) {

            console.warn(
                "NetView: impossible de charger les tags.",
                result.error
            );

            return [];
        }


        return (
            Array.isArray(
                result?.data
            )
                ? result.data
                : []
        )
            .map(
                item =>
                    item?.tag
            )
            .filter(
                Boolean
            );

    } catch (error) {

        console.warn(
            "NetView video tags error:",
            error
        );

        return [];
    }
}


// =========================================================
// OWNERSHIP
// =========================================================

async function verifyContentOwnership(
    channelId
) {

    if (!channelId) {

        throw new Error(
            "Ce contenu n'est associé à aucune chaîne."
        );

    }


    // -----------------------------------------------------
    // First: channels already loaded
    // -----------------------------------------------------

    currentChannel =
        myChannels.find(
            channel =>
                channel.id === channelId
        ) ||
        null;


    if (currentChannel) {
        return;
    }


    // -----------------------------------------------------
    // Direct ownership check
    // -----------------------------------------------------

    const result =
        await select(
            "channels",
            "*",
            [
                {
                    method: "eq",
                    column: "id",
                    value: channelId
                },
                {
                    method: "eq",
                    column: "owner_id",
                    value: currentUser.id
                }
            ]
        );


    if (result?.error) {
        throw result.error;
    }


    const channels =
        Array.isArray(result?.data)
            ? result.data
            : [];


    if (
        channels.length === 0
    ) {

        throw new Error(
            "Vous n'êtes pas autorisé à modifier ce contenu."
        );

    }


    currentChannel =
        channels[0];
}


// =========================================================
// POPULATE FORM
// =========================================================

function populateForm() {

    if (!currentContent) {
        return;
    }


    // -----------------------------------------------------
    // TITLE
    // -----------------------------------------------------

    if (titleInput) {

        titleInput.value =
            currentContent.title ||
            "";

    }


    // -----------------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------------

    if (descriptionInput) {

        descriptionInput.value =
            currentContent.description ||
            "";

    }


    // -----------------------------------------------------
    // CATEGORY
    // -----------------------------------------------------

    if (
        categoryInput &&
        currentContent.category_id
    ) {

        categoryInput.value =
            currentContent.category_id;

    }


    // -----------------------------------------------------
    // LANGUAGE
    // -----------------------------------------------------

    if (
        languageInput &&
        currentContent.language
    ) {

        languageInput.value =
            currentContent.language;

    }


    // -----------------------------------------------------
    // TAGS
    // -----------------------------------------------------

    if (
        tagsInput &&
        currentContentType === "video"
    ) {

        tagsInput.value =
            (
                currentContent.tags ||
                []
            ).join(", ");

    }


    // -----------------------------------------------------
    // VISIBILITY
    // -----------------------------------------------------

    if (
        currentContentType === "video"
    ) {

        setVisibilityValue(
            currentContent.visibility ||
            "public"
        );

    }


    // -----------------------------------------------------
    // THUMBNAIL
    // -----------------------------------------------------

    if (
        currentContent.thumbnail_url
    ) {

        setThumbnailPreview(
            currentContent.thumbnail_url
        );

    } else {

        resetThumbnailPreview();

    }
}


// =========================================================
// PAGE TYPE
// =========================================================

function updatePageType() {

    const isShort =
        currentContentType === "short";


    document.body.dataset.contentType =
        isShort
            ? "short"
            : "video";


    // -----------------------------------------------------
    // TITLE
    // -----------------------------------------------------

    const pageTitles =
        document.querySelectorAll(
            "[data-edit-content-title]"
        );


    pageTitles.forEach(
        element => {

            element.textContent =
                isShort
                    ? "Modifier le Short"
                    : "Modifier la vidéo";

        }
    );


    // -----------------------------------------------------
    // HEADER TITLE
    // -----------------------------------------------------

    const headerTitle =
        document.querySelector(
            ".nv-header-title span"
        );


    if (headerTitle) {

        headerTitle.textContent =
            isShort
                ? "Modifier le Short"
                : "Modifier la vidéo";

    }


    // -----------------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------------

    const pageDescription =
        document.querySelector(
            "[data-edit-content-description]"
        );


    if (pageDescription) {

        pageDescription.textContent =
            isShort
                ? "Modifiez les informations de votre Short."
                : "Modifiez les informations de votre vidéo.";

    }


    // -----------------------------------------------------
    // SHORT-ONLY ELEMENTS
    // -----------------------------------------------------

    document
        .querySelectorAll(
            "[data-video-only]"
        )
        .forEach(
            element => {

                element.hidden =
                    isShort;

            }
        );


    // -----------------------------------------------------
    // SHORT ELEMENTS
    // -----------------------------------------------------

    document
        .querySelectorAll(
            "[data-short-only]"
        )
        .forEach(
            element => {

                element.hidden =
                    !isShort;

            }
        );


    // -----------------------------------------------------
    // DELETE BUTTON
    // -----------------------------------------------------

    if (deleteButton) {

        deleteButton.setAttribute(
            "aria-label",
            isShort
                ? "Supprimer le Short"
                : "Supprimer la vidéo"
        );

    }
}


// =========================================================
// VISIBILITY
// =========================================================

function setVisibilityValue(
    value
) {

    const visibilityInputs =
        document.querySelectorAll(
            'input[name="visibility"]'
        );


    visibilityInputs.forEach(
        input => {

            input.checked =
                input.value === value;

        }
    );


    const visibilitySelect =
        document.getElementById(
            "visibility"
        );


    if (visibilitySelect) {

        visibilitySelect.value =
            value;

    }
}


function getVisibilityValue() {

    const checked =
        document.querySelector(
            'input[name="visibility"]:checked'
        );


    if (checked) {
        return checked.value;
    }


    const selectElement =
        document.getElementById(
            "visibility"
        );


    return (
        selectElement?.value ||
        "public"
    );
}


// =========================================================
// FORM EVENTS
// =========================================================

function setupFormEvents() {

    editForm?.addEventListener(
        "submit",
        handleSubmit
    );


    titleInput?.addEventListener(
        "input",
        () => {

            updateCounters();

            updateSaveButton();

        }
    );


    descriptionInput?.addEventListener(
        "input",
        () => {

            updateCounters();

        }
    );


    categoryInput?.addEventListener(
        "change",
        updateSaveButton
    );


    languageInput?.addEventListener(
        "change",
        updateSaveButton
    );


    tagsInput?.addEventListener(
        "input",
        updateSaveButton
    );


    document
        .querySelectorAll(
            'input[name="visibility"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateSaveButton
                );

            }
        );


    document
        .getElementById(
            "visibility"
        )
        ?.addEventListener(
            "change",
            updateSaveButton
        );


    deleteButton?.addEventListener(
        "click",
        handleDelete
    );
}


// =========================================================
// THUMBNAIL EVENTS
// =========================================================

function setupThumbnailEvents() {

    selectThumbnailButton?.addEventListener(
        "click",
        () => {

            thumbnailInput?.click();

        }
    );


    thumbnailInput?.addEventListener(
        "change",
        handleThumbnailSelection
    );
}


// =========================================================
// THUMBNAIL SELECTION
// =========================================================

function handleThumbnailSelection(
    event
) {

    const file =
        event.target?.files?.[0];


    if (!file) {
        return;
    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showError(
            "Le fichier sélectionné n'est pas une image valide."
        );

        thumbnailInput.value =
            "";

        return;
    }


    if (
        file.size >
        MAX_THUMBNAIL_SIZE
    ) {

        showError(
            "La miniature ne doit pas dépasser 10 Mo."
        );

        thumbnailInput.value =
            "";

        return;
    }


    selectedThumbnailFile =
        file;


    const objectUrl =
        URL.createObjectURL(
            file
        );


    setThumbnailPreview(
        objectUrl
    );


    updateSaveButton();
}


// =========================================================
// THUMBNAIL PREVIEW
// =========================================================

function setThumbnailPreview(
    source
) {

    if (
        !thumbnailPreview
    ) {
        return;
    }


    thumbnailPreview.src =
        source;


    thumbnailPreview.classList.remove(
        "hidden"
    );


    thumbnailPreview.hidden =
        false;


    if (
        thumbnailPlaceholder
    ) {

        thumbnailPlaceholder.classList.add(
            "hidden"
        );

        thumbnailPlaceholder.hidden =
            true;

    }
}


function resetThumbnailPreview() {

    if (thumbnailPreview) {

        thumbnailPreview.src =
            "";

        thumbnailPreview.classList.add(
            "hidden"
        );

        thumbnailPreview.hidden =
            true;

    }


    if (thumbnailPlaceholder) {

        thumbnailPlaceholder.classList.remove(
            "hidden"
        );

        thumbnailPlaceholder.hidden =
            false;

    }
}


// =========================================================
// COUNTERS
// =========================================================

function setupCounters() {

    updateCounters();

}


function updateCounters() {

    if (titleCounter) {

        titleCounter.textContent =
            String(
                titleInput?.value?.length ||
                0
            );

    }


    if (descriptionCounter) {

        descriptionCounter.textContent =
            String(
                descriptionInput?.value?.length ||
                0
            );

    }
}


// =========================================================
// SAVE BUTTON
// =========================================================

function updateSaveButton() {

    if (!saveButton) {
        return;
    }


    const title =
        titleInput?.value?.trim() ||
        "";


    const validTitle =
        title.length > 0 &&
        title.length <=
            MAX_TITLE_LENGTH;


    saveButton.disabled =
        !validTitle ||
        isSaving ||
        isDeleting;
}


// =========================================================
// SUBMIT
// =========================================================

async function handleSubmit(
    event
) {

    event.preventDefault();


    if (
        isSaving ||
        isDeleting ||
        !currentContent ||
        !currentContentType
    ) {
        return;
    }


    const title =
        titleInput?.value?.trim() ||
        "";


    const description =
        descriptionInput?.value?.trim() ||
        "";


    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!title) {

        showError(
            "Le titre est obligatoire."
        );

        titleInput?.focus();

        return;
    }


    if (
        title.length >
        MAX_TITLE_LENGTH
    ) {

        showError(
            "Le titre ne peut pas dépasser 150 caractères."
        );

        titleInput?.focus();

        return;
    }


    if (
        description.length >
        MAX_DESCRIPTION_LENGTH
    ) {

        showError(
            "La description ne peut pas dépasser 5000 caractères."
        );

        descriptionInput?.focus();

        return;
    }


    try {

        isSaving =
            true;


        updateSaveButton();


        showLoader(
            currentContentType === "short"
                ? "Enregistrement du Short..."
                : "Enregistrement de la vidéo..."
        );


        // -------------------------------------------------
        // THUMBNAIL
        // -------------------------------------------------

        let thumbnailUrl =
            currentContent.thumbnail_url ||
            null;


        if (selectedThumbnailFile) {

            thumbnailUrl =
                await uploadThumbnail(
                    selectedThumbnailFile
                );

        }


        // -------------------------------------------------
        // SHORT
        // -------------------------------------------------

        if (
            currentContentType === "short"
        ) {

            await updateShort(
                title,
                description,
                thumbnailUrl
            );

        }

        // -------------------------------------------------
        // VIDEO
        // -------------------------------------------------

        else {

            await updateVideo(
                title,
                description,
                thumbnailUrl
            );

        }


        // -------------------------------------------------
        // CLEAN OLD THUMBNAIL
        // -------------------------------------------------

        if (
            selectedThumbnailFile &&
            originalThumbnailUrl &&
            thumbnailUrl !==
                originalThumbnailUrl
        ) {

            await deleteStorageFileFromUrl(
                originalThumbnailUrl,
                THUMBNAIL_BUCKET
            );

        }


        originalThumbnailUrl =
            thumbnailUrl;


        currentContent.thumbnail_url =
            thumbnailUrl;


        selectedThumbnailFile =
            null;


        if (thumbnailInput) {
            thumbnailInput.value =
                "";
        }


        showSuccess(
            currentContentType === "short"
                ? "Short modifié avec succès."
                : "Vidéo modifiée avec succès."
        );


        updatePageUrl();

    } catch (error) {

        console.error(
            "NetView edit-video save error:",
            error
        );


        showError(
            getErrorMessage(
                error,
                "Impossible d'enregistrer les modifications."
            )
        );

    } finally {

        isSaving =
            false;


        hideLoader();

        updateSaveButton();

    }
}


// =========================================================
// UPDATE VIDEO
// =========================================================

async function updateVideo(
    title,
    description,
    thumbnailUrl
) {

    const visibility =
        getVisibilityValue();


    const categoryId =
        categoryInput?.value ||
        null;


    const language =
        languageInput?.value ||
        currentContent.language ||
        "fr";


    const payload = {

        title,
        description:
            description ||
            null,

        thumbnail_url:
            thumbnailUrl,

        visibility:
            visibility || "public",

        category_id:
            categoryId,

        language:
            language || "fr",

        updated_at:
            new Date().toISOString()

    };


    const {
        error
    } =
        await supabase
            .from("videos")
            .update(
                payload
            )
            .eq(
                "id",
                currentContent.id
            )
            .eq(
                "channel_id",
                currentContent.channel_id
            );


    if (error) {
        throw error;
    }


    // -----------------------------------------------------
    // TAGS
    // -----------------------------------------------------

    if (tagsInput) {

        await updateVideoTags();

    }


    currentContent = {

        ...currentContent,

        ...payload

    };
}


// =========================================================
// UPDATE SHORT
// =========================================================

async function updateShort(
    title,
    description,
    thumbnailUrl
) {

    const payload = {

        title,
        description:
            description ||
            null,

        thumbnail_url:
            thumbnailUrl

    };


    const {
        error
    } =
        await supabase
            .from("shorts")
            .update(
                payload
            )
            .eq(
                "id",
                currentContent.id
            )
            .eq(
                "channel_id",
                currentContent.channel_id
            );


    if (error) {
        throw error;
    }


    currentContent = {

        ...currentContent,

        ...payload

    };
}


// =========================================================
// UPDATE VIDEO TAGS
// =========================================================

async function updateVideoTags() {

    if (
        !currentContent?.id
    ) {
        return;
    }


    const tags =
        parseTags(
            tagsInput?.value ||
            ""
        );


    const {
        error: deleteError
    } =
        await supabase
            .from("video_tags")
            .delete()
            .eq(
                "video_id",
                currentContent.id
            );


    if (deleteError) {
        throw deleteError;
    }


    if (
        tags.length === 0
    ) {

        currentContent.tags =
            [];

        return;
    }


    const rows =
        tags.map(
            tag => ({

                video_id:
                    currentContent.id,

                tag

            })
        );


    const {
        error: insertError
    } =
        await supabase
            .from("video_tags")
            .insert(
                rows
            );


    if (insertError) {
        throw insertError;
    }


    currentContent.tags =
        tags;
}


// =========================================================
// TAG PARSER
// =========================================================

function parseTags(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return [];

    }


    const unique =
        new Set();


    value
        .split(",")
        .map(
            tag =>
                tag
                    .trim()
                    .replace(
                        /^#+/,
                        ""
                    )
        )
        .filter(
            Boolean
        )
        .forEach(
            tag => {

                if (
                    tag.length >
                    MAX_TAG_LENGTH
                ) {

                    tag =
                        tag.substring(
                            0,
                            MAX_TAG_LENGTH
                        );

                }


                const normalized =
                    tag.toLowerCase();


                if (
                    !unique.has(
                        normalized
                    )
                ) {

                    unique.add(
                        normalized
                    );

                }

            }
        );


    return Array.from(
        unique
    ).slice(
        0,
        MAX_TAGS
    );
}


// =========================================================
// THUMBNAIL UPLOAD
// =========================================================

async function uploadThumbnail(
    file
) {

    if (!currentUser) {

        throw new Error(
            "Utilisateur non authentifié."
        );

    }


    const extension =
        getFileExtension(
            file.name
        );


    const safeExtension =
        extension ||
        getExtensionFromMime(
            file.type
        ) ||
        "jpg";


    const filePath =
        [
            currentUser.id,
            "videos",
            `${currentContent.id}-${Date.now()}.${safeExtension}`
        ].join("/");


    const {
        error
    } =
        await supabase
            .storage
            .from(
                THUMBNAIL_BUCKET
            )
            .upload(
                filePath,
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

        // -------------------------------------------------
        // Fallback: if thumbnail bucket does not exist
        // -------------------------------------------------

        if (
            isBucketNotFoundError(
                error
            )
        ) {

            throw new Error(
                "Le bucket Storage « thumbnails » est introuvable."
            );

        }


        throw error;
    }


    const {
        data
    } =
        supabase
            .storage
            .from(
                THUMBNAIL_BUCKET
            )
            .getPublicUrl(
                filePath
            );


    const publicUrl =
        data?.publicUrl;


    if (!publicUrl) {

        throw new Error(
            "Impossible de récupérer l'URL de la miniature."
        );

    }


    return publicUrl;
}


// =========================================================
// DELETE
// =========================================================

async function handleDelete() {

    if (
        isDeleting ||
        isSaving ||
        !currentContent
    ) {
        return;
    }


    const contentName =
        currentContentType === "short"
            ? "ce Short"
            : "cette vidéo";


    const confirmed =
        window.confirm(
            `Voulez-vous vraiment supprimer ${contentName} ?\n\nCette action est définitive.`
        );


    if (!confirmed) {
        return;
    }


    try {

        isDeleting =
            true;


        updateSaveButton();


        if (deleteButton) {

            deleteButton.disabled =
                true;

            deleteButton.innerHTML = `

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

                <span>
                    Suppression...
                </span>

            `;

        }


        showLoader(
            currentContentType === "short"
                ? "Suppression du Short..."
                : "Suppression de la vidéo..."
        );


        if (
            currentContentType === "short"
        ) {

            await deleteShort();

        } else {

            await deleteVideo();

        }


        // -------------------------------------------------
        // Storage cleanup
        // -------------------------------------------------

        if (
            currentContent.thumbnail_url
        ) {

            await deleteStorageFileFromUrl(
                currentContent.thumbnail_url,
                THUMBNAIL_BUCKET
            );

        }


        showSuccess(
            currentContentType === "short"
                ? "Short supprimé."
                : "Vidéo supprimée."
        );


        setTimeout(
            () => {

                window.location.href =
                    currentContentType === "short"
                        ? "shorts.html"
                        : "studio.html";

            },
            700
        );

    } catch (error) {

        console.error(
            "NetView edit-video delete error:",
            error
        );


        showError(
            getErrorMessage(
                error,
                "Impossible de supprimer le contenu."
            )
        );

    } finally {

        isDeleting =
            false;


        hideLoader();

    }
}


// =========================================================
// DELETE VIDEO
// =========================================================

async function deleteVideo() {

    // -----------------------------------------------------
    // Tags
    // -----------------------------------------------------

    const {
        error: tagError
    } =
        await supabase
            .from("video_tags")
            .delete()
            .eq(
                "video_id",
                currentContent.id
            );


    if (tagError) {
        throw tagError;
    }


    // -----------------------------------------------------
    // Video files
    // -----------------------------------------------------

    const filesResult =
        await supabase
            .from("video_files")
            .select(
                "id,file_url"
            )
            .eq(
                "video_id",
                currentContent.id
            );


    if (
        filesResult.error
    ) {

        throw filesResult.error;

    }


    const videoFiles =
        filesResult.data ||
        [];


    // -----------------------------------------------------
    // Delete database video_files
    // -----------------------------------------------------

    const {
        error: filesDeleteError
    } =
        await supabase
            .from("video_files")
            .delete()
            .eq(
                "video_id",
                currentContent.id
            );


    if (filesDeleteError) {
        throw filesDeleteError;
    }


    // -----------------------------------------------------
    // Delete Storage files
    // -----------------------------------------------------

    for (
        const file
        of videoFiles
    ) {

        if (
            file?.file_url
        ) {

            await deleteStorageFileFromUrl(
                file.file_url,
                VIDEO_BUCKET
            );

        }

    }


    // -----------------------------------------------------
    // Delete video
    // -----------------------------------------------------

    const {
        error
    } =
        await supabase
            .from("videos")
            .delete()
            .eq(
                "id",
                currentContent.id
            )
            .eq(
                "channel_id",
                currentContent.channel_id
            );


    if (error) {
        throw error;
    }
}


// =========================================================
// DELETE SHORT
// =========================================================

async function deleteShort() {

    const {
        error
    } =
        await supabase
            .from("shorts")
            .delete()
            .eq(
                "id",
                currentContent.id
            )
            .eq(
                "channel_id",
                currentContent.channel_id
            );


    if (error) {
        throw error;
    }
}


// =========================================================
// STORAGE DELETE
// =========================================================

async function deleteStorageFileFromUrl(
    url,
    bucket
) {

    if (
        !url ||
        typeof url !== "string"
    ) {
        return;
    }


    try {

        const path =
            extractStoragePath(
                url,
                bucket
            );


        if (!path) {
            return;
        }


        const {
            error
        } =
            await supabase
                .storage
                .from(
                    bucket
                )
                .remove([
                    path
                ]);


        if (error) {

            console.warn(
                "NetView Storage cleanup error:",
                error
            );

        }

    } catch (error) {

        console.warn(
            "NetView Storage URL parsing error:",
            error
        );

    }
}


// =========================================================
// EXTRACT STORAGE PATH
// =========================================================

function extractStoragePath(
    url,
    bucket
) {

    try {

        const parsed =
            new URL(
                url,
                window.location.origin
            );


        const pathname =
            decodeURIComponent(
                parsed.pathname
            );


        const markers = [

            `/storage/v1/object/public/${bucket}/`,

            `/storage/v1/object/authenticated/${bucket}/`,

            `/storage/v1/object/sign/${bucket}/`

        ];


        for (
            const marker
            of markers
        ) {

            const index =
                pathname.indexOf(
                    marker
                );


            if (
                index !== -1
            ) {

                return pathname
                    .substring(
                        index +
                        marker.length
                    );

            }

        }


        return null;

    } catch {

        return null;
    }
}


// =========================================================
// UPDATE URL
// =========================================================

function updatePageUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    if (
        currentContentType ===
        "short"
    ) {

        params.delete(
            "video"
        );

        params.set(
            "short",
            currentContent.id
        );

        params.set(
            "type",
            "short"
        );

    } else {

        params.delete(
            "short"
        );

        params.set(
            "video",
            currentContent.id
        );

        params.set(
            "type",
            "video"
        );

    }


    const newUrl =
        `${window.location.pathname}?${params.toString()}`;


    window.history.replaceState(
        {},
        "",
        newUrl
    );
}


// =========================================================
// HEADER
// =========================================================

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

            <i
                class="fa-solid fa-plus nv-plus-icon"
            ></i>

        </button>


        <button
            type="button"
            class="nv-icon-button"
            id="headerNotificationsButton"
            aria-label="Notifications"
            title="Notifications"
        >

            <i
                class="fa-regular fa-bell"
            ></i>

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
                    "publish.html";

            }
        );


    document
        .getElementById(
            "headerNotificationsButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "notification.html";

            }
        );
}


// =========================================================
// SIDEBAR
// =========================================================

function showUserSidebar() {

    if (!sidebarNav) {
        return;
    }


    sidebarNav.innerHTML = `

        <a
            href="index.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-house"
            ></i>

            <span>
                Accueil
            </span>

        </a>


        <a
            href="shorts.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-bolt"
            ></i>

            <span>
                Shorts
            </span>

        </a>


        <a
            href="subscriptions.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-tv"
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
            ></i>

            <span>
                Playlists
            </span>

        </a>


        <a
            href="history.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-clock-rotate-left"
            ></i>

            <span>
                Historique
            </span>

        </a>


        <hr>


        <a
            href="studio.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-chart-line"
            ></i>

            <span>
                Studio
            </span>

        </a>


        <a
            href="upload.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-cloud-arrow-up"
            ></i>

            <span>
                Publier
            </span>

        </a>


        <a
            href="settings.html"
            class="nv-sidebar-item"
        >

            <i
                class="fa-solid fa-gear"
            ></i>

            <span>
                Paramètres
            </span>

        </a>

    `;
}


// =========================================================
// SIDEBAR EVENTS
// =========================================================

function setupSidebarEvents() {

    sidebarToggle?.addEventListener(
        "click",
        () => {

            const open =
                sidebar?.classList.contains(
                    "open"
                );


            if (open) {

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
                event.key ===
                "Escape"
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


// =========================================================
// SEARCH
// =========================================================

function setupSearch() {

    const form =
        document.getElementById(
            "searchForm"
        );


    const input =
        document.getElementById(
            "searchInput"
        );


    form?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const query =
                input?.value?.trim() ||
                "";


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


// =========================================================
// LOADER
// =========================================================

function showLoader(
    message
) {

    if (!pageLoader) {
        return;
    }


    if (loaderText) {

        loaderText.textContent =
            message ||
            "Chargement...";

    }


    pageLoader.classList.remove(
        "hidden"
    );


    pageLoader.hidden =
        false;
}


function hideLoader() {

    if (!pageLoader) {
        return;
    }


    pageLoader.classList.add(
        "hidden"
    );


    pageLoader.hidden =
        true;
}


// =========================================================
// ERROR
// =========================================================

function showError(
    message
) {

    hideLoader();


    const errorElement =
        document.getElementById(
            "editError"
        ) ||
        document.getElementById(
            "errorMessage"
        );


    if (errorElement) {

        errorElement.textContent =
            message;

        errorElement.hidden =
            false;

        errorElement.classList.remove(
            "hidden"
        );


        errorElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return;
    }


    window.alert(
        message
    );
}


// =========================================================
// SUCCESS
// =========================================================

function showSuccess(
    message
) {

    const successElement =
        document.getElementById(
            "editSuccess"
        ) ||
        document.getElementById(
            "successMessage"
        );


    if (successElement) {

        successElement.textContent =
            message;

        successElement.hidden =
            false;

        successElement.classList.remove(
            "hidden"
        );


        return;
    }


    // -----------------------------------------------------
    // If the global NetView toast exists
    // -----------------------------------------------------

    if (
        typeof window.showToast ===
        "function"
    ) {

        window.showToast(
            message,
            "success"
        );

        return;
    }


    // -----------------------------------------------------
    // Native fallback
    // -----------------------------------------------------

    console.info(
        `NetView: ${message}`
    );
}


// =========================================================
// AUTH REDIRECT
// =========================================================

function redirectToAuth() {

    const currentUrl =
        window.location.href;


    window.location.href =
        `auth.html?redirect=${encodeURIComponent(
            currentUrl
        )}`;
}


// =========================================================
// FILE HELPERS
// =========================================================

function getFileExtension(
    filename
) {

    if (
        typeof filename !==
        "string"
    ) {
        return "";
    }


    const parts =
        filename
            .toLowerCase()
            .split(".");


    if (
        parts.length < 2
    ) {
        return "";
    }


    return parts.pop();
}


function getExtensionFromMime(
    mime
) {

    const extensions = {

        "image/jpeg":
            "jpg",

        "image/png":
            "png",

        "image/webp":
            "webp",

        "image/gif":
            "gif"

    };


    return (
        extensions[mime] ||
        ""
    );
}


// =========================================================
// STORAGE ERROR
// =========================================================

function isBucketNotFoundError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    return (
        message.includes(
            "bucket not found"
        ) ||
        message.includes(
            "not found"
        )
    );
}


// =========================================================
// ERROR MESSAGE
// =========================================================

function getErrorMessage(
    error,
    fallback
) {

    if (!error) {
        return fallback;
    }


    const message =
        String(
            error.message ||
            ""
        ).trim();


    if (!message) {
        return fallback;
    }


    if (
        message.includes(
            "row-level security"
        )
    ) {

        return (
            "Modification refusée par les règles de sécurité NetView."
        );

    }


    if (
        message.includes(
            "duplicate key"
        )
    ) {

        return (
            "Une donnée identique existe déjà."
        );

    }


    if (
        message.includes(
            "foreign key"
        )
    ) {

        return (
            "Une relation associée à ce contenu est invalide."
        );

    }


    return message;
}


// =========================================================
// HTML SECURITY
// =========================================================

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


// =========================================================
// PAGE CLEANUP
// =========================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            thumbnailPreview?.src?.startsWith(
                "blob:"
            )
        ) {

            URL.revokeObjectURL(
                thumbnailPreview.src
            );

        }

    }
);
