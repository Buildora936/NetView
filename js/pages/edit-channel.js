// ==========================================================
// NetView
// edit-channel.js
// ==========================================================
import {
    getMyChannels,
    updateChannel,
    getCurrentUser
} from "../core/data.js";

import {
    supabase
} from "../core/supabase.js";


// ==========================================================
// CONFIGURATION
// ==========================================================

const PAGE_URL = "edit-channel.html";
const CHANNEL_URL = "channel.html";

const MAX_NAME_LENGTH = 100;
const MAX_HANDLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 1000;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// ==========================================================
// STATE
// ==========================================================

let currentUser = null;
let currentChannel = null;

let originalValues = null;

let avatarFile = null;
let bannerFile = null;

let avatarObjectUrl = null;
let bannerObjectUrl = null;

let isSaving = false;
let isDirty = false;
let allowNavigation = false;


// ==========================================================
// DOM
// ==========================================================

const loadingSection =
    document.getElementById(
        "editChannelLoading"
    );

const errorSection =
    document.getElementById(
        "editChannelError"
    );

const errorMessage =
    document.getElementById(
        "editChannelErrorMessage"
    );

const retryButton =
    document.getElementById(
        "editChannelRetryButton"
    );

const contentSection =
    document.getElementById(
        "editChannelContent"
    );

const form =
    document.getElementById(
        "editChannelForm"
    );

const channelName =
    document.getElementById(
        "channelName"
    );

const channelHandle =
    document.getElementById(
        "channelHandle"
    );

const channelDescription =
    document.getElementById(
        "channelDescription"
    );

const channelNameCount =
    document.getElementById(
        "channelNameCount"
    );

const channelDescriptionCount =
    document.getElementById(
        "channelDescriptionCount"
    );

const channelHandleStatus =
    document.getElementById(
        "channelHandleStatus"
    );

const channelPublicUrl =
    document.getElementById(
        "channelPublicUrl"
    );

const channelNameError =
    document.getElementById(
        "channelNameError"
    );

const channelHandleError =
    document.getElementById(
        "channelHandleError"
    );

const channelDescriptionError =
    document.getElementById(
        "channelDescriptionError"
    );

const channelBannerPreview =
    document.getElementById(
        "channelBannerPreview"
    );

const channelAvatarPreview =
    document.getElementById(
        "channelAvatarPreview"
    );

const channelBannerInput =
    document.getElementById(
        "channelBannerInput"
    );

const channelAvatarInput =
    document.getElementById(
        "channelAvatarInput"
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

const channelCreatedAt =
    document.getElementById(
        "channelCreatedAt"
    );

const saveChannelButton =
    document.getElementById(
        "saveChannelButton"
    );

const cancelEditButton =
    document.getElementById(
        "cancelEditButton"
    );

const viewChannelButton =
    document.getElementById(
        "viewChannelButton"
    );

const unsavedChangesModal =
    document.getElementById(
        "unsavedChangesModal"
    );

const unsavedChangesClose =
    document.getElementById(
        "unsavedChangesClose"
    );

const stayOnPageButton =
    document.getElementById(
        "stayOnPageButton"
    );

const leaveWithoutSavingButton =
    document.getElementById(
        "leaveWithoutSavingButton"
    );

const toast =
    document.getElementById(
        "editChannelToast"
    );

const toastIcon =
    document.getElementById(
        "editChannelToastIcon"
    );

const toastMessage =
    document.getElementById(
        "editChannelToastMessage"
    );


// ==========================================================
// INITIALISATION
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    bindEvents();

    await loadChannel();

}


// ==========================================================
// EVENTS
// ==========================================================

function bindEvents() {

    if (form) {
        form.addEventListener(
            "submit",
            handleSubmit
        );
    }


    if (channelName) {
        channelName.addEventListener(
            "input",
            handleFormInput
        );
    }


    if (channelHandle) {

        channelHandle.addEventListener(
            "input",
            handleHandleInput
        );

        channelHandle.addEventListener(
            "blur",
            normalizeHandleField
        );

    }


    if (channelDescription) {
        channelDescription.addEventListener(
            "input",
            handleFormInput
        );
    }


    if (channelAvatarInput) {

        channelAvatarInput.addEventListener(
            "change",
            handleAvatarChange
        );

    }


    if (channelBannerInput) {

        channelBannerInput.addEventListener(
            "change",
            handleBannerChange
        );

    }


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadChannel
        );

    }


    if (cancelEditButton) {

        cancelEditButton.addEventListener(
            "click",
            handleNavigation
        );

    }


    if (viewChannelButton) {

        viewChannelButton.addEventListener(
            "click",
            handleNavigation
        );

    }


    if (unsavedChangesClose) {

        unsavedChangesClose.addEventListener(
            "click",
            closeUnsavedModal
        );

    }


    if (stayOnPageButton) {

        stayOnPageButton.addEventListener(
            "click",
            closeUnsavedModal
        );

    }


    if (leaveWithoutSavingButton) {

        leaveWithoutSavingButton.addEventListener(
            "click",
            confirmLeave
        );

    }


    if (unsavedChangesModal) {

        const backdrop =
            unsavedChangesModal.querySelector(
                ".edit-channel-modal-backdrop"
            );

        if (backdrop) {

            backdrop.addEventListener(
                "click",
                closeUnsavedModal
            );

        }

    }


    window.addEventListener(
        "beforeunload",
        handleBeforeUnload
    );

}


// ==========================================================
// LOAD CHANNEL
// ==========================================================

async function loadChannel() {

    showLoading();

    clearErrors();

    try {

        currentUser =
            await getCurrentUser();

        if (!currentUser) {

            redirectToLogin();

            return;
        }


        const channels =
            await getMyChannels();


        if (
            !Array.isArray(channels) ||
            channels.length === 0
        ) {

            showError(
                "Vous n'avez pas encore créé de chaîne."
            );

            return;
        }


        // --------------------------------------------------
        // NetView : un compte = une seule chaîne
        // --------------------------------------------------

        currentChannel =
            channels[0];


        if (!currentChannel?.id) {

            showError(
                "Les informations de votre chaîne sont invalides."
            );

            return;
        }


        populateChannel();


        hideLoading();

        showContent();

        isDirty = false;

        allowNavigation = false;

    } catch (error) {

        console.error(
            "Erreur chargement chaîne :",
            error
        );

        showError(
            getErrorMessage(
                error,
                "Impossible de charger votre chaîne."
            )
        );

    }

}


// ==========================================================
// POPULATE
// ==========================================================

function populateChannel() {

    const channel =
        currentChannel;


    channelName.value =
        channel.name || "";


    channelHandle.value =
        normalizeHandle(
            channel.handle || ""
        );


    channelDescription.value =
        channel.description || "";


    updateCounters();


    updatePublicUrl();


    updateStatistics();


    renderBanner(
        channel.banner_url
    );


    renderAvatar(
        channel.avatar_url
    );


    originalValues = getFormValues();


    updateViewChannelLink();

}


// ==========================================================
// FORM VALUES
// ==========================================================

function getFormValues() {

    return {
        name:
            String(
                channelName?.value || ""
            ).trim(),

        handle:
            normalizeHandle(
                channelHandle?.value || ""
            ),

        description:
            String(
                channelDescription?.value || ""
            ).trim(),

        avatar_url:
            currentChannel?.avatar_url || null,

        banner_url:
            currentChannel?.banner_url || null
    };

}


// ==========================================================
// INPUT
// ==========================================================

function handleFormInput() {

    updateCounters();

    updateDirtyState();

    clearFieldErrors();

}


function handleHandleInput() {

    const cursorPosition =
        channelHandle.selectionStart;

    const oldValue =
        channelHandle.value;

    const normalized =
        normalizeHandle(
            oldValue
        );

    channelHandle.value =
        normalized;

    try {

        channelHandle.setSelectionRange(
            Math.min(
                cursorPosition,
                normalized.length
            ),
            Math.min(
                cursorPosition,
                normalized.length
            )
        );

    } catch {
        // Rien à faire.
    }


    updatePublicUrl();

    updateDirtyState();

    clearFieldError(
        channelHandleError
    );

    channelHandleStatus.textContent = "";

}


// ==========================================================
// HANDLE NORMALIZATION
// ==========================================================

function normalizeHandle(value) {

    return String(value || "")
        .trim()
        .replace(/^@+/, "")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .slice(
            0,
            MAX_HANDLE_LENGTH
        );

}


function normalizeHandleField() {

    channelHandle.value =
        normalizeHandle(
            channelHandle.value
        );

    updatePublicUrl();

}


// ==========================================================
// COUNTERS
// ==========================================================

function updateCounters() {

    if (channelNameCount) {

        const length =
            channelName.value.length;

        channelNameCount.textContent =
            `${length} / ${MAX_NAME_LENGTH}`;

    }


    if (channelDescriptionCount) {

        const length =
            channelDescription.value.length;

        channelDescriptionCount.textContent =
            `${length} / ${MAX_DESCRIPTION_LENGTH}`;

    }

}


// ==========================================================
// PUBLIC URL
// ==========================================================

function updatePublicUrl() {

    if (!channelPublicUrl) {
        return;
    }


    const handle =
        normalizeHandle(
            channelHandle?.value || ""
        );


    const origin =
        window.location.origin;


    channelPublicUrl.textContent =
        handle
            ? `${origin}/@${handle}`
            : `${origin}/@`;

}


// ==========================================================
// CHANNEL LINK
// ==========================================================

function updateViewChannelLink() {

    if (!currentChannel?.id) {
        return;
    }


    const handle =
        normalizeHandle(
            currentChannel.handle || ""
        );


    if (handle) {

        viewChannelButton.href =
            `channel.html?handle=${encodeURIComponent(handle)}`;

        cancelEditButton.href =
            `channel.html?handle=${encodeURIComponent(handle)}`;

    } else {

        viewChannelButton.href =
            `channel.html?id=${encodeURIComponent(currentChannel.id)}`;

        cancelEditButton.href =
            `channel.html?id=${encodeURIComponent(currentChannel.id)}`;

    }

}


// ==========================================================
// STATISTICS
// ==========================================================

function updateStatistics() {

    if (!currentChannel) {
        return;
    }


    if (channelSubscribers) {

        channelSubscribers.textContent =
            formatNumber(
                currentChannel.subscribers_count
            );

    }


    if (channelVideos) {

        channelVideos.textContent =
            formatNumber(
                currentChannel.videos_count
            );

    }


    if (channelViews) {

        channelViews.textContent =
            formatNumber(
                currentChannel.total_views
            );

    }


    if (channelCreatedAt) {

        channelCreatedAt.textContent =
            formatDate(
                currentChannel.created_at
            );

    }

}


// ==========================================================
// AVATAR
// ==========================================================

function handleAvatarChange(event) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    const validation =
        validateImage(
            file
        );


    if (!validation.valid) {

        showToast(
            validation.message,
            "error"
        );

        channelAvatarInput.value = "";

        return;
    }


    avatarFile =
        file;


    if (avatarObjectUrl) {

        URL.revokeObjectURL(
            avatarObjectUrl
        );

    }


    avatarObjectUrl =
        URL.createObjectURL(
            file
        );


    renderAvatar(
        avatarObjectUrl
    );


    updateDirtyState();

}


// ==========================================================
// BANNER
// ==========================================================

function handleBannerChange(event) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    const validation =
        validateImage(
            file
        );


    if (!validation.valid) {

        showToast(
            validation.message,
            "error"
        );

        channelBannerInput.value = "";

        return;
    }


    bannerFile =
        file;


    if (bannerObjectUrl) {

        URL.revokeObjectURL(
            bannerObjectUrl
        );

    }


    bannerObjectUrl =
        URL.createObjectURL(
            file
        );


    renderBanner(
        bannerObjectUrl
    );


    updateDirtyState();

}


// ==========================================================
// IMAGE VALIDATION
// ==========================================================

function validateImage(file) {

    if (
        !ALLOWED_IMAGE_TYPES.includes(
            file.type
        )
    ) {

        return {
            valid: false,
            message:
                "Format non autorisé. Utilisez JPG, PNG ou WebP."
        };

    }


    if (
        file.size > MAX_IMAGE_SIZE
    ) {

        return {
            valid: false,
            message:
                "L'image ne doit pas dépasser 5 Mo."
        };

    }


    return {
        valid: true
    };

}


// ==========================================================
// RENDER AVATAR
// ==========================================================

function renderAvatar(url) {

    if (!channelAvatarPreview) {
        return;
    }


    if (!url) {

        channelAvatarPreview.innerHTML = `
            <div class="channel-avatar-placeholder">
                <i class="fa-solid fa-user"></i>
            </div>
        `;

        return;
    }


    channelAvatarPreview.innerHTML = "";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        url;

    image.alt =
        "Photo de profil de la chaîne";

    image.loading =
        "lazy";


    image.onerror =
        () => {

            channelAvatarPreview.innerHTML = `
                <div class="channel-avatar-placeholder">
                    <i class="fa-solid fa-user"></i>
                </div>
            `;

        };


    channelAvatarPreview.appendChild(
        image
    );

}


// ==========================================================
// RENDER BANNER
// ==========================================================

function renderBanner(url) {

    if (!channelBannerPreview) {
        return;
    }


    if (!url) {

        channelBannerPreview.innerHTML = `
            <div class="channel-banner-placeholder">
                <i class="fa-solid fa-image"></i>
                <span>
                    Bannière de la chaîne
                </span>
            </div>
        `;

        return;
    }


    channelBannerPreview.innerHTML = "";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        url;

    image.alt =
        "Bannière de la chaîne";

    image.loading =
        "lazy";


    image.onerror =
        () => {

            channelBannerPreview.innerHTML = `
                <div class="channel-banner-placeholder">
                    <i class="fa-solid fa-image"></i>
                    <span>
                        Bannière de la chaîne
                    </span>
                </div>
            `;

        };


    channelBannerPreview.appendChild(
        image
    );

}


// ==========================================================
// DIRTY STATE
// ==========================================================

function updateDirtyState() {

    if (!originalValues) {
        return;
    }


    const current =
        getFormValues();


    const valuesChanged =
        current.name !==
            originalValues.name ||

        current.handle !==
            originalValues.handle ||

        current.description !==
            originalValues.description;


    isDirty =
        valuesChanged ||
        !!avatarFile ||
        !!bannerFile;

}


// ==========================================================
// SUBMIT
// ==========================================================

async function handleSubmit(event) {

    event.preventDefault();


    if (isSaving) {
        return;
    }


    clearErrors();


    const validation =
        validateForm();


    if (!validation.valid) {

        showValidationErrors(
            validation.errors
        );

        return;
    }


    if (!currentChannel?.id) {

        showToast(
            "Chaîne introuvable.",
            "error"
        );

        return;
    }


    isSaving = true;

    setSaveButtonLoading(
        true
    );


    try {

        const values =
            getFormValues();


        let avatarUrl =
            currentChannel.avatar_url ||
            null;

        let bannerUrl =
            currentChannel.banner_url ||
            null;


        // --------------------------------------------------
        // Avatar
        // --------------------------------------------------

        if (avatarFile) {

            avatarUrl =
                await uploadChannelImage(
                    avatarFile,
                    "avatar"
                );

        }


        // --------------------------------------------------
        // Bannière
        // --------------------------------------------------

        if (bannerFile) {

            bannerUrl =
                await uploadChannelImage(
                    bannerFile,
                    "banner"
                );

        }


        // --------------------------------------------------
        // IMPORTANT :
        // On ne transmet QUE les champs modifiables.
        //
        // verified
        // subscribers_count
        // videos_count
        // total_views
        // owner_id
        // created_at
        //
        // ne sont jamais envoyés.
        // --------------------------------------------------

        const updateValues = {

            name:
                values.name,

            handle:
                values.handle,

            description:
                values.description || null,

            avatar_url:
                avatarUrl,

            banner_url:
                bannerUrl

        };


        const {
            data,
            error
        } =
            await updateChannel(
                currentChannel.id,
                updateValues
            );


        if (error) {

            throw error;

        }


        if (!data) {

            throw new Error(
                "La chaîne n'a pas pu être mise à jour."
            );

        }


        currentChannel =
            {
                ...currentChannel,
                ...data
            };


        avatarFile =
            null;

        bannerFile =
            null;


        if (channelAvatarInput) {
            channelAvatarInput.value = "";
        }


        if (channelBannerInput) {
            channelBannerInput.value = "";
        }


        originalValues =
            getFormValues();


        isDirty =
            false;


        updateStatistics();

        updatePublicUrl();

        updateViewChannelLink();


        showToast(
            "Votre chaîne a été mise à jour.",
            "success"
        );


    } catch (error) {

        console.error(
            "Erreur modification chaîne :",
            error
        );


        showToast(
            getErrorMessage(
                error,
                "Impossible d'enregistrer les modifications."
            ),
            "error"
        );

    } finally {

        isSaving = false;

        setSaveButtonLoading(
            false
        );

    }

}


// ==========================================================
// VALIDATION
// ==========================================================

function validateForm() {

    const errors = {};


    const name =
        String(
            channelName.value || ""
        ).trim();


    const handle =
        normalizeHandle(
            channelHandle.value
        );


    const description =
        String(
            channelDescription.value || ""
        ).trim();


    if (!name) {

        errors.name =
            "Le nom de la chaîne est obligatoire.";

    } else if (
        name.length < 2
    ) {

        errors.name =
            "Le nom de la chaîne doit contenir au moins 2 caractères.";

    } else if (
        name.length >
        MAX_NAME_LENGTH
    ) {

        errors.name =
            `Le nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères.`;

    }


    if (!handle) {

        errors.handle =
            "L'identifiant de la chaîne est obligatoire.";

    } else if (
        handle.length < 3
    ) {

        errors.handle =
            "L'identifiant doit contenir au moins 3 caractères.";

    } else if (
        handle.length >
        MAX_HANDLE_LENGTH
    ) {

        errors.handle =
            `L'identifiant ne peut pas dépasser ${MAX_HANDLE_LENGTH} caractères.`;

    } else if (
        !/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(
            handle
        )
    ) {

        errors.handle =
            "L'identifiant contient des caractères non autorisés.";

    }


    if (
        description.length >
        MAX_DESCRIPTION_LENGTH
    ) {

        errors.description =
            `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`;

    }


    return {
        valid:
            Object.keys(errors).length === 0,
        errors
    };

}


// ==========================================================
// SHOW VALIDATION ERRORS
// ==========================================================

function showValidationErrors(errors) {

    if (errors.name) {

        showFieldError(
            channelNameError,
            errors.name
        );

    }


    if (errors.handle) {

        showFieldError(
            channelHandleError,
            errors.handle
        );

    }


    if (errors.description) {

        showFieldError(
            channelDescriptionError,
            errors.description
        );

    }


    const firstError =
        errors.name
            ? channelName
            : errors.handle
                ? channelHandle
                : channelDescription;


    if (firstError) {

        firstError.focus({
            preventScroll: true
        });


        firstError.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


// ==========================================================
// FIELD ERRORS
// ==========================================================

function showFieldError(
    element,
    message
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;

    element.hidden =
        false;

}


function clearFieldError(
    element
) {

    if (!element) {
        return;
    }


    element.textContent =
        "";

    element.hidden =
        true;

}


function clearFieldErrors() {

    clearFieldError(
        channelNameError
    );

    clearFieldError(
        channelHandleError
    );

    clearFieldError(
        channelDescriptionError
    );

}


// ==========================================================
// UPLOAD STORAGE
// ==========================================================

async function uploadChannelImage(
    file,
    type
) {

    if (!currentUser?.id) {

        throw new Error(
            "Utilisateur non connecté."
        );

    }


    const extension =
        getFileExtension(
            file
        );


    const filename =
        `${type}-${Date.now()}-${crypto.randomUUID()}.${extension}`;


    /*
     * Bucket attendu :
     *
     * channels
     *
     * Chemin :
     *
     * user_id/avatar-...
     * user_id/banner-...
     *
     * Le fichier est placé dans le dossier
     * du propriétaire.
     */

    const path =
        `${currentUser.id}/${filename}`;


    const {
        error
    } =
        await supabase
            .storage
            .from("channels")
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

        console.error(
            "Erreur upload image chaîne :",
            error
        );

        throw new Error(
            "Impossible d'envoyer l'image."
        );

    }


    const {
        data
    } =
        supabase
            .storage
            .from("channels")
            .getPublicUrl(
                path
            );


    const publicUrl =
        data?.publicUrl;


    if (!publicUrl) {

        throw new Error(
            "Impossible de récupérer l'URL de l'image."
        );

    }


    return publicUrl;

}


// ==========================================================
// FILE EXTENSION
// ==========================================================

function getFileExtension(file) {

    const parts =
        String(
            file.name || ""
        )
            .split(".");

    if (
        parts.length > 1
    ) {

        const extension =
            parts.pop()
                .toLowerCase();

        if (
            ["jpg", "jpeg", "png", "webp"]
                .includes(extension)
        ) {

            return extension;

        }

    }


    if (
        file.type ===
        "image/png"
    ) {

        return "png";

    }


    if (
        file.type ===
        "image/webp"
    ) {

        return "webp";

    }


    return "jpg";

}


// ==========================================================
// SAVE BUTTON
// ==========================================================

function setSaveButtonLoading(
    loading
) {

    if (!saveChannelButton) {
        return;
    }


    saveChannelButton.disabled =
        loading;


    if (loading) {

        saveChannelButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>
                Enregistrement...
            </span>
        `;

    } else {

        saveChannelButton.innerHTML = `
            <i class="fa-solid fa-check"></i>
            <span>
                Enregistrer les modifications
            </span>
        `;

    }

}


// ==========================================================
// NAVIGATION
// ==========================================================

function handleNavigation(
    event
) {

    if (!isDirty || allowNavigation) {
        return;
    }


    event.preventDefault();


    const target =
        event.currentTarget?.href;


    if (target) {

        unsavedChangesModal.dataset.target =
            target;

    }


    openUnsavedModal();

}


function openUnsavedModal() {

    if (!unsavedChangesModal) {
        return;
    }


    unsavedChangesModal.hidden =
        false;


    document.body.classList.add(
        "modal-open"
    );


    requestAnimationFrame(
        () => {

            unsavedChangesModal.classList.add(
                "is-visible"
            );

        }
    );


    if (stayOnPageButton) {

        stayOnPageButton.focus();

    }

}


function closeUnsavedModal() {

    if (!unsavedChangesModal) {
        return;
    }


    unsavedChangesModal.classList.remove(
        "is-visible"
    );


    setTimeout(
        () => {

            unsavedChangesModal.hidden =
                true;

            document.body.classList.remove(
                "modal-open"
            );

        },
        180
    );

}


function confirmLeave() {

    const target =
        unsavedChangesModal.dataset.target;


    allowNavigation =
        true;


    isDirty =
        false;


    closeUnsavedModal();


    if (target) {

        window.location.href =
            target;

    } else {

        window.history.back();

    }

}


// ==========================================================
// BEFORE UNLOAD
// ==========================================================

function handleBeforeUnload(
    event
) {

    if (
        !isDirty ||
        allowNavigation
    ) {

        return;

    }


    event.preventDefault();

    event.returnValue =
        "";

}


// ==========================================================
// LOADING / ERROR / CONTENT
// ==========================================================

function showLoading() {

    if (loadingSection) {

        loadingSection.hidden =
            false;

    }


    if (errorSection) {

        errorSection.hidden =
            true;

    }


    if (contentSection) {

        contentSection.hidden =
            true;

    }

}


function hideLoading() {

    if (loadingSection) {

        loadingSection.hidden =
            true;

    }

}


function showContent() {

    if (contentSection) {

        contentSection.hidden =
            false;

    }


    if (errorSection) {

        errorSection.hidden =
            true;

    }

}


function showError(message) {

    hideLoading();


    if (contentSection) {

        contentSection.hidden =
            true;

    }


    if (errorSection) {

        errorSection.hidden =
            false;

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

}


// ==========================================================
// LOGIN
// ==========================================================

function redirectToLogin() {

    allowNavigation =
        true;

    isDirty =
        false;


    window.location.href =
        `login.html?redirect=${encodeURIComponent(PAGE_URL)}`;

}


// ==========================================================
// ERROR HANDLING
// ==========================================================

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
            error.error_description ||
            ""
        ).trim();


    if (!message) {
        return fallback;
    }


    const lower =
        message.toLowerCase();


    if (
        lower.includes(
            "duplicate key"
        ) ||
        lower.includes(
            "channels_handle_key"
        )
    ) {

        return (
            "Cet identifiant de chaîne est déjà utilisé."
        );

    }


    if (
        lower.includes(
            "row-level security"
        ) ||
        lower.includes(
            "permission denied"
        )
    ) {

        return (
            "Vous n'avez pas l'autorisation de modifier cette chaîne."
        );

    }


    return message;

}


// ==========================================================
// GENERAL ERROR CLEAR
// ==========================================================

function clearErrors() {

    clearFieldErrors();


    if (channelHandleStatus) {

        channelHandleStatus.textContent =
            "";

    }

}


// ==========================================================
// TOAST
// ==========================================================

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    if (
        !toast ||
        !toastMessage
    ) {

        return;

    }


    if (toastTimer) {

        clearTimeout(
            toastTimer
        );

    }


    toastMessage.textContent =
        message;


    toast.classList.remove(
        "success",
        "error",
        "warning"
    );


    toast.classList.add(
        type
    );


    if (toastIcon) {

        if (
            type === "error"
        ) {

            toastIcon.className =
                "fa-solid fa-circle-xmark";

        } else if (
            type === "warning"
        ) {

            toastIcon.className =
                "fa-solid fa-triangle-exclamation";

        } else {

            toastIcon.className =
                "fa-solid fa-circle-check";

        }

    }


    toast.hidden =
        false;


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "is-visible"
            );

        }
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "is-visible"
                );

                setTimeout(
                    () => {

                        toast.hidden =
                            true;

                    },
                    180
                );

            },
            4000
        );

}


// ==========================================================
// FORMAT NUMBER
// ==========================================================

function formatNumber(
    value
) {

    const number =
        Number(
            value || 0
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "0";

    }


    return new Intl.NumberFormat(
        "fr-FR"
    ).format(
        number
    );

}


// ==========================================================
// FORMAT DATE
// ==========================================================

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    ).format(
        date
    );

}


// ==========================================================
// CLEANUP
// ==========================================================

window.addEventListener(
    "pagehide",
    cleanup
);


function cleanup() {

    if (avatarObjectUrl) {

        URL.revokeObjectURL(
            avatarObjectUrl
        );

        avatarObjectUrl =
            null;

    }


    if (bannerObjectUrl) {

        URL.revokeObjectURL(
            bannerObjectUrl
        );

        bannerObjectUrl =
            null;

    }

}
