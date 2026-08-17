// ==========================================================
// NetView
// edit-channel.js
// ==========================================================

import {
    getUser
} from "../core/auth.js";

import {
    getMyChannels,
    updateChannel
} from "../core/data.js";

import {
    supabase
} from "../core/supabase.js";


// ==========================================================
// CONFIGURATION
// ==========================================================

const PAGE_URL =
    "edit-channel.html";

const CHANNEL_URL =
    "channel.html";

const CHANNEL_BUCKET =
    "channels";

const MAX_NAME_LENGTH =
    100;

const MAX_HANDLE_LENGTH =
    30;

const MAX_DESCRIPTION_LENGTH =
    1000;

const HANDLE_MIN_LENGTH =
    3;

const MAX_IMAGE_SIZE =
    5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// ==========================================================
// STATE
// ==========================================================

let currentUser =
    null;

let currentChannel =
    null;

let originalValues =
    null;

let avatarFile =
    null;

let bannerFile =
    null;

let avatarObjectUrl =
    null;

let bannerObjectUrl =
    null;

let isSaving =
    false;

let isDirty =
    false;

let allowNavigation =
    false;

let handleCheckTimer =
    null;

let handleCheckSequence =
    0;


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

    configureInputs();

    bindEvents();

    await loadChannel();

}


// ==========================================================
// CONFIGURE INPUTS
// ==========================================================

function configureInputs() {

    if (channelName) {

        channelName.maxLength =
            MAX_NAME_LENGTH;

    }

    if (channelHandle) {

        channelHandle.maxLength =
            MAX_HANDLE_LENGTH;

        channelHandle.autocomplete =
            "off";

        channelHandle.spellcheck =
            false;

    }

    if (channelDescription) {

        channelDescription.maxLength =
            MAX_DESCRIPTION_LENGTH;

    }

    if (channelAvatarInput) {

        channelAvatarInput.accept =
            ALLOWED_IMAGE_TYPES.join(",");

    }

    if (channelBannerInput) {

        channelBannerInput.accept =
            ALLOWED_IMAGE_TYPES.join(",");

    }

}


// ==========================================================
// EVENTS
// ==========================================================

function bindEvents() {

    form?.addEventListener(
        "submit",
        handleSubmit
    );


    channelName?.addEventListener(
        "input",
        handleNameInput
    );


    channelHandle?.addEventListener(
        "input",
        handleHandleInput
    );


    channelHandle?.addEventListener(
        "blur",
        handleHandleBlur
    );


    channelDescription?.addEventListener(
        "input",
        handleDescriptionInput
    );


    channelAvatarInput?.addEventListener(
        "change",
        handleAvatarChange
    );


    channelBannerInput?.addEventListener(
        "change",
        handleBannerChange
    );


    retryButton?.addEventListener(
        "click",
        loadChannel
    );


    cancelEditButton?.addEventListener(
        "click",
        handleNavigation
    );


    viewChannelButton?.addEventListener(
        "click",
        handleNavigation
    );


    unsavedChangesClose?.addEventListener(
        "click",
        closeUnsavedModal
    );


    stayOnPageButton?.addEventListener(
        "click",
        closeUnsavedModal
    );


    leaveWithoutSavingButton?.addEventListener(
        "click",
        confirmLeave
    );


    if (unsavedChangesModal) {

        const backdrop =
            unsavedChangesModal.querySelector(
                ".edit-channel-modal-backdrop"
            );

        backdrop?.addEventListener(
            "click",
            closeUnsavedModal
        );

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
            await getUser();


        if (!currentUser) {

            redirectToAuth();

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

        isDirty =
            false;

        allowNavigation =
            false;


    } catch (error) {

        console.error(
            "NetView — Erreur chargement chaîne :",
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

    if (!currentChannel) {
        return;
    }


    channelName.value =
        currentChannel.name || "";


    channelHandle.value =
        normalizeHandle(
            currentChannel.handle || ""
        );


    channelDescription.value =
        currentChannel.description || "";


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


    updateCounters();

    updatePublicUrl();

    updateStatistics();

    renderAvatar(
        currentChannel.avatar_url
    );

    renderBanner(
        currentChannel.banner_url
    );


    originalValues =
        getFormValues();


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
            currentChannel?.avatar_url ||
            null,

        banner_url:
            currentChannel?.banner_url ||
            null

    };

}


// ==========================================================
// NAME
// ==========================================================

function handleNameInput() {

    updateCounters();

    updateDirtyState();

    clearFieldError(
        channelNameError
    );

}


// ==========================================================
// DESCRIPTION
// ==========================================================

function handleDescriptionInput() {

    updateCounters();

    updateDirtyState();

    clearFieldError(
        channelDescriptionError
    );

}


// ==========================================================
// HANDLE INPUT
// ==========================================================

function handleHandleInput() {

    if (!channelHandle) {
        return;
    }


    const normalized =
        normalizeHandle(
            channelHandle.value
        );


    channelHandle.value =
        normalized;


    updatePublicUrl();

    updateDirtyState();

    clearFieldError(
        channelHandleError
    );


    handleCheckSequence++;


    clearTimeout(
        handleCheckTimer
    );


    if (!normalized) {

        setHandleStatus(
            "",
            ""
        );

        return;

    }


    if (
        !isValidHandle(
            normalized
        )
    ) {

        setHandleStatus(
            "error",
            `Le handle doit contenir entre ${HANDLE_MIN_LENGTH} et ${MAX_HANDLE_LENGTH} caractères.`
        );

        return;

    }


    /*
     * Si le handle n'a pas changé,
     * il est automatiquement disponible
     * pour cette chaîne.
     */

    const originalHandle =
        normalizeHandle(
            currentChannel?.handle || ""
        );


    if (
        normalized ===
        originalHandle
    ) {

        setHandleStatus(
            "success",
            "Votre handle actuel."
        );

        return;

    }


    setHandleStatus(
        "checking",
        "Vérification du handle..."
    );


    const sequence =
        handleCheckSequence;


    handleCheckTimer =
        setTimeout(
            async () => {

                if (
                    sequence !==
                    handleCheckSequence
                ) {
                    return;
                }


                await checkHandleAvailability();

            },
            450
        );

}


// ==========================================================
// HANDLE BLUR
// ==========================================================

async function handleHandleBlur() {

    normalizeHandleField();

    await checkHandleAvailability();

}


// ==========================================================
// HANDLE NORMALIZATION
// ==========================================================

function normalizeHandle(value) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /^@+/,
            ""
        )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9_-]+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^[-_]+/,
            ""
        )
        .replace(
            /[-_]+$/,
            ""
        )
        .slice(
            0,
            MAX_HANDLE_LENGTH
        );

}


// ==========================================================
// HANDLE VALIDATION
// ==========================================================

function isValidHandle(handle) {

    if (!handle) {
        return false;
    }


    if (
        handle.length <
        HANDLE_MIN_LENGTH
    ) {
        return false;
    }


    if (
        handle.length >
        MAX_HANDLE_LENGTH
    ) {
        return false;
    }


    return /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/
        .test(
            handle
        );

}


// ==========================================================
// NORMALIZE HANDLE FIELD
// ==========================================================

function normalizeHandleField() {

    if (!channelHandle) {
        return;
    }


    channelHandle.value =
        normalizeHandle(
            channelHandle.value
        );


    updatePublicUrl();

}


// ==========================================================
// REAL HANDLE AVAILABILITY
// ==========================================================

async function checkHandleAvailability() {

    if (
        !currentChannel?.id ||
        !channelHandle
    ) {

        return false;

    }


    const handle =
        normalizeHandle(
            channelHandle.value
        );


    if (!handle) {

        setHandleStatus(
            "error",
            "Le handle est obligatoire."
        );

        return false;

    }


    if (
        !isValidHandle(
            handle
        )
    ) {

        setHandleStatus(
            "error",
            `Le handle doit contenir entre ${HANDLE_MIN_LENGTH} et ${MAX_HANDLE_LENGTH} caractères.`
        );

        return false;

    }


    const currentHandle =
        normalizeHandle(
            currentChannel.handle
        );


    /*
     * Même handle :
     * aucune recherche nécessaire.
     */

    if (
        handle ===
        currentHandle
    ) {

        setHandleStatus(
            "success",
            "Votre handle actuel."
        );

        return true;

    }


    setHandleStatus(
        "checking",
        "Vérification du handle..."
    );


    try {

        /*
         * Vérification DIRECTE dans PostgreSQL.
         *
         * On exclut la chaîne actuellement
         * modifiée.
         */

        const {
            data,
            error
        } =
            await supabase
                .from("channels")
                .select("id,handle")
                .eq(
                    "handle",
                    handle
                )
                .neq(
                    "id",
                    currentChannel.id
                )
                .limit(1);


        if (error) {

            console.error(
                "NetView — Vérification handle :",
                error
            );

            setHandleStatus(
                "error",
                "Impossible de vérifier ce handle."
            );

            return false;

        }


        const exists =
            Array.isArray(data) &&
            data.length > 0;


        if (exists) {

            setHandleStatus(
                "error",
                "Ce handle est déjà utilisé."
            );

            return false;

        }


        setHandleStatus(
            "success",
            "Handle disponible."
        );

        return true;


    } catch (error) {

        console.error(
            "NetView — Erreur vérification handle :",
            error
        );


        setHandleStatus(
            "error",
            "Impossible de vérifier ce handle."
        );


        return false;

    }

}


// ==========================================================
// HANDLE STATUS
// ==========================================================

function setHandleStatus(
    type,
    message
) {

    if (!channelHandleStatus) {
        return;
    }


    channelHandleStatus.textContent =
        message;


    channelHandleStatus.classList.remove(
        "is-checking",
        "is-success",
        "is-error"
    );


    if (type === "checking") {

        channelHandleStatus.classList.add(
            "is-checking"
        );

    }


    if (type === "success") {

        channelHandleStatus.classList.add(
            "is-success"
        );

    }


    if (type === "error") {

        channelHandleStatus.classList.add(
            "is-error"
        );

    }

}


// ==========================================================
// COUNTERS
// ==========================================================

function updateCounters() {

    if (channelNameCount) {

        channelNameCount.textContent =
            `${channelName?.value.length || 0} / ${MAX_NAME_LENGTH}`;

    }


    if (channelDescriptionCount) {

        channelDescriptionCount.textContent =
            `${channelDescription?.value.length || 0} / ${MAX_DESCRIPTION_LENGTH}`;

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
// CHANNEL LINKS
// ==========================================================

function updateViewChannelLink() {

    if (
        !currentChannel?.id
    ) {
        return;
    }


    const handle =
        normalizeHandle(
            channelHandle?.value ||
            currentChannel.handle ||
            ""
        );


    const url =
        handle
            ? `channel.html?handle=${encodeURIComponent(handle)}`
            : `channel.html?id=${encodeURIComponent(currentChannel.id)}`;


    if (viewChannelButton) {

        viewChannelButton.href =
            url;

    }


    if (cancelEditButton) {

        cancelEditButton.href =
            url;

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
// AVATAR CHANGE
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

        event.target.value =
            "";

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
// BANNER CHANGE
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

        event.target.value =
            "";

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
        file.size >
        MAX_IMAGE_SIZE
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


    channelAvatarPreview.innerHTML =
        "";


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


    channelBannerPreview.innerHTML =
        "";


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


    /*
     * Validation locale.
     */

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


    /*
     * Vérification réelle du handle
     * juste avant l'enregistrement.
     */

    const handleAvailable =
        await checkHandleAvailability();


    if (!handleAvailable) {

        showFieldError(
            channelHandleError,
            "Ce handle n'est pas disponible."
        );

        channelHandle?.focus();

        return;

    }


    /*
     * Vérification de session.
     */

    currentUser =
        await getUser();


    if (!currentUser) {

        redirectToAuth();

        return;

    }


    isSaving =
        true;


    setSaveButtonLoading(
        true
    );


    /*
     * Conserver les anciennes URLs
     * afin de pouvoir supprimer les
     * anciens fichiers après succès.
     */

    const oldAvatarUrl =
        currentChannel.avatar_url ||
        null;

    const oldBannerUrl =
        currentChannel.banner_url ||
        null;


    let uploadedAvatarPath =
        null;

    let uploadedBannerPath =
        null;


    try {

        const values =
            getFormValues();


        let avatarUrl =
            oldAvatarUrl;


        let bannerUrl =
            oldBannerUrl;


        // ==================================================
        // NOUVEL AVATAR
        // ==================================================

        if (avatarFile) {

            const upload =
                await uploadChannelImage(
                    avatarFile,
                    "avatar"
                );


            avatarUrl =
                upload.publicUrl;


            uploadedAvatarPath =
                upload.path;

        }


        // ==================================================
        // NOUVELLE BANNIÈRE
        // ==================================================

        if (bannerFile) {

            const upload =
                await uploadChannelImage(
                    bannerFile,
                    "banner"
                );


            bannerUrl =
                upload.publicUrl;


            uploadedBannerPath =
                upload.path;

        }


        // ==================================================
        // UPDATE DATABASE
        // ==================================================

        const updateValues = {

            name:
                values.name,

            handle:
                values.handle,

            description:
                values.description ||
                null,

            avatar_url:
                avatarUrl,

            banner_url:
                bannerUrl

        };


        const result =
            await updateChannel(
                currentChannel.id,
                updateValues
            );


        if (result?.error) {

            throw result.error;

        }


        const updatedChannel =
            result?.data;


        if (!updatedChannel) {

            throw new Error(
                "La chaîne n'a pas pu être mise à jour."
            );

        }


        /*
         * La modification DB est maintenant
         * confirmée.
         */

        currentChannel = {
            ...currentChannel,
            ...updatedChannel
        };


        /*
         * Suppression des anciens fichiers
         * uniquement après succès DB.
         */

        if (
            avatarFile &&
            oldAvatarUrl
        ) {

            await deleteStorageFileFromUrl(
                oldAvatarUrl
            );

        }


        if (
            bannerFile &&
            oldBannerUrl
        ) {

            await deleteStorageFileFromUrl(
                oldBannerUrl
            );

        }


        avatarFile =
            null;

        bannerFile =
            null;


        if (channelAvatarInput) {

            channelAvatarInput.value =
                "";

        }


        if (channelBannerInput) {

            channelBannerInput.value =
                "";

        }


        originalValues =
            getFormValues();


        isDirty =
            false;


        updateStatistics();

        updatePublicUrl();

        updateViewChannelLink();


        /*
         * Afficher immédiatement les vraies
         * URLs Supabase, et non les object URLs.
         */

        renderAvatar(
            currentChannel.avatar_url
        );

        renderBanner(
            currentChannel.banner_url
        );


        showToast(
            "Votre chaîne a été mise à jour.",
            "success"
        );


    } catch (error) {

        console.error(
            "NetView — Erreur modification chaîne :",
            error
        );


        /*
         * Si le fichier a été envoyé mais que
         * la modification DB échoue, on supprime
         * le nouveau fichier afin d'éviter les
         * fichiers orphelins.
         */

        if (uploadedAvatarPath) {

            await removeStorageFile(
                uploadedAvatarPath
            );

        }


        if (uploadedBannerPath) {

            await removeStorageFile(
                uploadedBannerPath
            );

        }


        showToast(
            getErrorMessage(
                error,
                "Impossible d'enregistrer les modifications."
            ),
            "error"
        );

    } finally {

        isSaving =
            false;

        setSaveButtonLoading(
            false
        );

    }

}


// ==========================================================
// FORM VALIDATION
// ==========================================================

function validateForm() {

    const errors = {};


    const name =
        String(
            channelName?.value || ""
        ).trim();


    const handle =
        normalizeHandle(
            channelHandle?.value || ""
        );


    const description =
        String(
            channelDescription?.value || ""
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
            "Le handle est obligatoire.";

    } else if (
        !isValidHandle(handle)
    ) {

        errors.handle =
            `Le handle doit contenir entre ${HANDLE_MIN_LENGTH} et ${MAX_HANDLE_LENGTH} caractères, avec uniquement des lettres minuscules, chiffres, tirets et underscores.`;

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
            behavior:
                "smooth",

            block:
                "center"
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
// STORAGE UPLOAD
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
     * Structure :
     *
     * channels/
     * └── USER_ID/
     *     ├── avatar-xxxx.webp
     *     └── banner-xxxx.webp
     */

    const path =
        `${currentUser.id}/${filename}`;


    const {
        data,
        error
    } =
        await supabase
            .storage
            .from(
                CHANNEL_BUCKET
            )
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "31536000",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (error) {

        console.error(
            "NetView — Storage upload error:",
            error
        );

        throw new Error(
            "Impossible d'envoyer l'image vers le stockage."
        );

    }


    /*
     * Récupération de l'URL publique.
     *
     * Le bucket "channels" doit être PUBLIC.
     */

    const {
        data:
            publicData
    } =
        supabase
            .storage
            .from(
                CHANNEL_BUCKET
            )
            .getPublicUrl(
                path
            );


    const publicUrl =
        publicData?.publicUrl;


    if (!publicUrl) {

        /*
         * Si l'URL publique ne peut pas être
         * récupérée, supprimer le fichier
         * nouvellement envoyé.
         */

        await removeStorageFile(
            path
        );


        throw new Error(
            "Impossible de récupérer l'URL de l'image."
        );

    }


    return {

        path,

        publicUrl,

        storageData:
            data || null

    };

}


// ==========================================================
// DELETE STORAGE FILE
// ==========================================================

async function removeStorageFile(
    path
) {

    if (!path) {
        return;
    }


    try {

        const {
            error
        } =
            await supabase
                .storage
                .from(
                    CHANNEL_BUCKET
                )
                .remove([
                    path
                ]);


        if (error) {

            console.warn(
                "NetView — Impossible de supprimer le fichier Storage :",
                error
            );

        }

    } catch (error) {

        console.warn(
            "NetView — Erreur suppression Storage :",
            error
        );

    }

}


// ==========================================================
// DELETE FILE FROM PUBLIC URL
// ==========================================================

async function deleteStorageFileFromUrl(
    publicUrl
) {

    if (!publicUrl) {
        return;
    }


    try {

        const marker =
            `/storage/v1/object/public/${CHANNEL_BUCKET}/`;


        const index =
            publicUrl.indexOf(
                marker
            );


        if (index === -1) {

            console.warn(
                "NetView — URL Storage non reconnue :",
                publicUrl
            );

            return;

        }


        const path =
            decodeURIComponent(
                publicUrl.slice(
                    index +
                    marker.length
                )
            );


        if (!path) {
            return;
        }


        await removeStorageFile(
            path
        );


    } catch (error) {

        console.warn(
            "NetView — Impossible d'extraire le chemin Storage :",
            error
        );

    }

}


// ==========================================================
// FILE EXTENSION
// ==========================================================

function getFileExtension(file) {

    const parts =
        String(
            file.name || ""
        ).split(".");


    if (
        parts.length > 1
    ) {

        const extension =
            parts
                .pop()
                .toLowerCase();


        if (
            [
                "jpg",
                "jpeg",
                "png",
                "webp"
            ].includes(
                extension
            )
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


    saveChannelButton.setAttribute(
        "aria-busy",
        loading
            ? "true"
            : "false"
    );


    if (loading) {

        if (
            !saveChannelButton.dataset.originalContent
        ) {

            saveChannelButton.dataset.originalContent =
                saveChannelButton.innerHTML;

        }


        saveChannelButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>
                Enregistrement...
            </span>
        `;

    } else {

        if (
            saveChannelButton.dataset.originalContent
        ) {

            saveChannelButton.innerHTML =
                saveChannelButton.dataset.originalContent;

            delete saveChannelButton.dataset.originalContent;

        } else {

            saveChannelButton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <span>
                    Enregistrer les modifications
                </span>
            `;

        }

    }

}


// ==========================================================
// NAVIGATION
// ==========================================================

function handleNavigation(event) {

    if (
        !isDirty ||
        allowNavigation
    ) {

        return;

    }


    event.preventDefault();


    const target =
        event.currentTarget?.href;


    if (target && unsavedChangesModal) {

        unsavedChangesModal.dataset.target =
            target;

    }


    openUnsavedModal();

}


// ==========================================================
// OPEN MODAL
// ==========================================================

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


    stayOnPageButton?.focus();

}


// ==========================================================
// CLOSE MODAL
// ==========================================================

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


// ==========================================================
// CONFIRM LEAVE
// ==========================================================

function confirmLeave() {

    const target =
        unsavedChangesModal?.dataset.target;


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

function handleBeforeUnload(event) {

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
// LOADING
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
// AUTH REDIRECT
// ==========================================================

function redirectToAuth() {

    allowNavigation =
        true;

    isDirty =
        false;


    const currentPath =
        window.location.pathname +
        window.location.search;


    window.location.replace(
        `auth.html?redirect=${encodeURIComponent(currentPath)}`
    );

}


// ==========================================================
// ERROR MESSAGE
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
            error.details ||
            ""
        ).trim();


    const lower =
        message.toLowerCase();


    /*
     * PostgreSQL UNIQUE
     */

    if (
        error.code === "23505" ||
        lower.includes(
            "duplicate key"
        ) ||
        lower.includes(
            "channels_handle_key"
        ) ||
        lower.includes(
            "channels_handle"
        )
    ) {

        return (
            "Ce handle est déjà utilisé. Choisissez-en un autre."
        );

    }


    /*
     * Storage
     */

    if (
        lower.includes(
            "storage"
        ) ||
        lower.includes(
            "bucket"
        ) ||
        lower.includes(
            "object"
        )
    ) {

        return (
            "Impossible de modifier l'image de la chaîne. Vérifiez les permissions du stockage."
        );

    }


    /*
     * RLS
     */

    if (
        lower.includes(
            "row-level security"
        ) ||
        lower.includes(
            "permission denied"
        ) ||
        lower.includes(
            "violates row-level security"
        )
    ) {

        return (
            "Vous n'avez pas l'autorisation de modifier cette chaîne."
        );

    }


    /*
     * Auth
     */

    if (
        lower.includes(
            "not authenticated"
        ) ||
        lower.includes(
            "jwt"
        ) ||
        lower.includes(
            "unauthorized"
        )
    ) {

        return (
            "Votre session a expiré. Veuillez vous reconnecter."
        );

    }


    return message ||
        fallback;

}


// ==========================================================
// CLEAR ERRORS
// ==========================================================

function clearErrors() {

    clearFieldErrors();


    setHandleStatus(
        "",
        ""
    );

}


// ==========================================================
// TOAST
// ==========================================================

let toastTimer =
    null;


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
            type ===
            "error"
        ) {

            toastIcon.className =
                "fa-solid fa-circle-xmark";

        } else if (
            type ===
            "warning"
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

function formatNumber(value) {

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

function formatDate(value) {

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

    if (handleCheckTimer) {

        clearTimeout(
            handleCheckTimer
        );

    }


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


// ==========================================================
// DEBUG
// ==========================================================

window.NetViewEditChannel = {

    normalizeHandle,

    isValidHandle,

    validateForm,

    checkHandleAvailability,

    uploadChannelImage

};
