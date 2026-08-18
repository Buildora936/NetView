/* =========================================================
   NETVIEW — ADD CHANNEL
   js/pages/add-channel.js

   Fonctionnalités :
   - Vérification utilisateur
   - 1 chaîne maximum par compte
   - Validation nom / handle / description
   - Vérification réelle du handle dans Supabase
   - Aperçu avatar / bannière
   - Upload réel vers Supabase Storage
   - Récupération des URLs publiques
   - Création réelle de la chaîne
   - Nettoyage Storage si création échoue
   ========================================================= */

import {
    getUser
} from "../core/auth.js";

import {
    getMyChannels,
    createChannel,
    isChannelHandleAvailable,
   initDeviceRevocationListener
} from "../core/data.js";

import {
    supabase
} from "../core/supabase.js";

  initDeviceRevocationListener();
/* =========================================================
   DOM
   ========================================================= */

const form =
    document.getElementById(
        "addChannelForm"
    );

const nameInput =
    document.getElementById(
        "channelName"
    );

const handleInput =
    document.getElementById(
        "channelHandle"
    );

const descriptionInput =
    document.getElementById(
        "channelDescription"
    );

const avatarInput =
    document.getElementById(
        "channelAvatar"
    );

const bannerInput =
    document.getElementById(
        "channelBanner"
    );

const avatarPreview =
    document.getElementById(
        "avatarPreview"
    );

const bannerPreview =
    document.getElementById(
        "bannerPreview"
    );

const avatarUploadButton =
    document.getElementById(
        "avatarUploadButton"
    );

const avatarRemoveButton =
    document.getElementById(
        "avatarRemoveButton"
    );

const bannerUploadButton =
    document.getElementById(
        "bannerUploadButton"
    );

const bannerRemoveButton =
    document.getElementById(
        "bannerRemoveButton"
    );

const livePreviewBanner =
    document.getElementById(
        "livePreviewBanner"
    );

const livePreviewAvatar =
    document.getElementById(
        "livePreviewAvatar"
    );

const livePreviewName =
    document.getElementById(
        "livePreviewName"
    );

const livePreviewHandle =
    document.getElementById(
        "livePreviewHandle"
    );

const livePreviewDescription =
    document.getElementById(
        "livePreviewDescription"
    );

const handlePreview =
    document.getElementById(
        "handlePreview"
    );

const submitButton =
    document.getElementById(
        "createChannelButton"
    );

const cancelButton =
    document.getElementById(
        "cancelChannelButton"
    );

const nameCounter =
    document.getElementById(
        "channelNameCounter"
    );

const descriptionCounter =
    document.getElementById(
        "channelDescriptionCounter"
    );

const handleStatus =
    document.getElementById(
        "channelHandleStatus"
    );

const formMessage =
    document.getElementById(
        "addChannelMessage"
    );

const loader =
    document.getElementById(
        "addChannelLoader"
    );

const loaderMessage =
    document.getElementById(
        "addChannelLoaderMessage"
    );

const toast =
    document.getElementById(
        "addChannelToast"
    );

const toastIcon =
    document.getElementById(
        "addChannelToastIcon"
    );

const toastMessage =
    document.getElementById(
        "addChannelToastMessage"
    );


/* =========================================================
   STORAGE
   ========================================================= */

const AVATAR_BUCKET =
    "channel-avatars";

const BANNER_BUCKET =
    "channel-banners";


/* =========================================================
   CONSTANTS
   ========================================================= */

const MAX_NAME_LENGTH = 100;

const MAX_HANDLE_LENGTH = 30;

const MAX_DESCRIPTION_LENGTH = 1000;

const HANDLE_MIN_LENGTH = 3;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const MAX_AVATAR_SIZE =
    5 * 1024 * 1024;

const MAX_BANNER_SIZE =
    10 * 1024 * 1024;


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let existingChannels = [];

let isSubmitting = false;

let handleCheckTimer = null;

let handleCheckSequence = 0;

let avatarObjectUrl = null;

let bannerObjectUrl = null;


/*
 * Fichiers réellement envoyés à Storage.
 * On conserve leurs chemins pour pouvoir
 * les supprimer si createChannel() échoue.
 */

let uploadedAvatarPath = null;

let uploadedBannerPath = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeAddChannel
);


async function initializeAddChannel() {

    try {

        setFormMessage(
            "",
            ""
        );

        initializeInputs();

        initializeCounters();

        initializePreview();

        initializeEvents();

        currentUser =
            await getUser();


        if (!currentUser) {

            redirectToAuth();

            return;
        }


        existingChannels =
            await getMyChannels();


        if (
            Array.isArray(
                existingChannels
            ) &&
            existingChannels.length > 0
        ) {

            redirectToExistingChannel();

            return;
        }

    } catch (error) {

        console.error(
            "NetView — Erreur initialisation add-channel :",
            error
        );

        setFormMessage(
            getReadableError(error),
            "error"
        );
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

function initializeEvents() {

    form?.addEventListener(
        "submit",
        handleSubmit
    );

    nameInput?.addEventListener(
        "input",
        handleNameInput
    );

    handleInput?.addEventListener(
        "input",
        handleHandleInput
    );

    handleInput?.addEventListener(
        "blur",
        handleHandleBlur
    );

    descriptionInput?.addEventListener(
        "input",
        handleDescriptionInput
    );

    avatarInput?.addEventListener(
        "change",
        handleAvatarChange
    );

    bannerInput?.addEventListener(
        "change",
        handleBannerChange
    );

    avatarUploadButton?.addEventListener(
        "click",
        () => avatarInput?.click()
    );

    bannerUploadButton?.addEventListener(
        "click",
        () => bannerInput?.click()
    );

    avatarRemoveButton?.addEventListener(
        "click",
        removeAvatar
    );

    bannerRemoveButton?.addEventListener(
        "click",
        removeBanner
    );

    cancelButton?.addEventListener(
        "click",
        handleCancel
    );
}


/* =========================================================
   INITIAL INPUTS
   ========================================================= */

function initializeInputs() {

    if (nameInput) {

        nameInput.maxLength =
            MAX_NAME_LENGTH;
    }

    if (handleInput) {

        handleInput.maxLength =
            MAX_HANDLE_LENGTH;
    }

    if (descriptionInput) {

        descriptionInput.maxLength =
            MAX_DESCRIPTION_LENGTH;
    }

    if (avatarInput) {

        avatarInput.accept =
            ALLOWED_IMAGE_TYPES.join(",");
    }

    if (bannerInput) {

        bannerInput.accept =
            ALLOWED_IMAGE_TYPES.join(",");
    }
}


/* =========================================================
   INITIAL PREVIEW
   ========================================================= */

function initializePreview() {

    updateNamePreview();

    updateHandlePreview();

    updateDescriptionPreview();

}


/* =========================================================
   COUNTERS
   ========================================================= */

function initializeCounters() {

    updateNameCounter();

    updateDescriptionCounter();

}


function updateNameCounter() {

    if (
        !nameInput ||
        !nameCounter
    ) {
        return;
    }

    nameCounter.textContent =
        `${nameInput.value.length}/${MAX_NAME_LENGTH}`;
}


function updateDescriptionCounter() {

    if (
        !descriptionInput ||
        !descriptionCounter
    ) {
        return;
    }

    descriptionCounter.textContent =
        `${descriptionInput.value.length}/${MAX_DESCRIPTION_LENGTH}`;
}


/* =========================================================
   NAME
   ========================================================= */

function handleNameInput() {

    updateNameCounter();

    updateNamePreview();

    clearFieldError(
        nameInput
    );
}


function updateNamePreview() {

    if (!livePreviewName) {
        return;
    }

    const name =
        normalizeName(
            nameInput?.value
        );

    livePreviewName.textContent =
        name ||
        "Nom de votre chaîne";
}


/* =========================================================
   HANDLE
   ========================================================= */

function handleHandleInput() {

    if (!handleInput) {
        return;
    }

    const normalized =
        normalizeHandle(
            handleInput.value
        );

    handleInput.value =
        normalized;

    updateHandlePreview();

    clearFieldError(
        handleInput
    );

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

    setHandleStatus(
        "checking",
        "Vérification..."
    );

    const sequence =
        ++handleCheckSequence;

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


async function handleHandleBlur() {

    clearTimeout(
        handleCheckTimer
    );

    ++handleCheckSequence;

    await checkHandleAvailability();
}


function updateHandlePreview() {

    const handle =
        normalizeHandle(
            handleInput?.value
        );

    if (handlePreview) {

        handlePreview.textContent =
            handle ||
            "votreidentifiant";
    }

    if (livePreviewHandle) {

        livePreviewHandle.textContent =
            handle
                ? `@${handle}`
                : "@votreidentifiant";
    }
}


/* =========================================================
   HANDLE NORMALIZATION
   ========================================================= */

function normalizeHandle(
    value
) {

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


/* =========================================================
   HANDLE VALIDATION
   ========================================================= */

function isValidHandle(
    handle
) {

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
        .test(handle);
}


/* =========================================================
   HANDLE AVAILABILITY
   ========================================================= */

async function checkHandleAvailability() {

    if (!handleInput) {
        return false;
    }

    const handle =
        normalizeHandle(
            handleInput.value
        );

    handleInput.value =
        handle;

    updateHandlePreview();

    if (!handle) {

        setHandleStatus(
            "",
            ""
        );

        return false;
    }

    if (!isValidHandle(handle)) {

        setHandleStatus(
            "error",
            `Le handle doit contenir entre ${HANDLE_MIN_LENGTH} et ${MAX_HANDLE_LENGTH} caractères.`
        );

        return false;
    }

    const sequence =
        handleCheckSequence;

    setHandleStatus(
        "checking",
        "Vérification de la disponibilité..."
    );

    try {

        const available =
            await isChannelHandleAvailable(
                handle
            );

        if (
            sequence !==
            handleCheckSequence
        ) {
            return false;
        }

        if (!available) {

            setHandleStatus(
                "error",
                "Ce handle est déjà utilisé."
            );

            markFieldError(
                handleInput
            );

            return false;
        }

        clearFieldError(
            handleInput
        );

        setHandleStatus(
            "success",
            "Handle disponible."
        );

        return true;

    } catch (error) {

        console.error(
            "NetView — Vérification handle :",
            error
        );

        setHandleStatus(
            "error",
            "Impossible de vérifier ce handle. Réessayez."
        );

        return false;
    }
}


/* =========================================================
   HANDLE STATUS
   ========================================================= */

function setHandleStatus(
    type,
    message
) {

    if (!handleStatus) {
        return;
    }

    handleStatus.textContent =
        message;

    handleStatus.classList.remove(
        "is-checking",
        "is-success",
        "is-error"
    );

    if (type === "checking") {

        handleStatus.classList.add(
            "is-checking"
        );
    }

    if (type === "success") {

        handleStatus.classList.add(
            "is-success"
        );
    }

    if (type === "error") {

        handleStatus.classList.add(
            "is-error"
        );
    }
}


/* =========================================================
   DESCRIPTION
   ========================================================= */

function handleDescriptionInput() {

    updateDescriptionCounter();

    updateDescriptionPreview();

    clearFieldError(
        descriptionInput
    );
}


function updateDescriptionPreview() {

    if (!livePreviewDescription) {
        return;
    }

    const description =
        normalizeDescription(
            descriptionInput?.value
        );

    livePreviewDescription.textContent =
        description ||
        "La description de votre chaîne apparaîtra ici.";
}


/* =========================================================
   AVATAR — SELECT
   ========================================================= */

function handleAvatarChange(
    event
) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const validation =
        validateImage(
            file,
            MAX_AVATAR_SIZE
        );

    if (!validation.valid) {

        setFormMessage(
            validation.message,
            "error"
        );

        event.target.value = "";

        removeAvatar();

        return;
    }

    previewAvatar(file);

    clearFieldError(
        avatarInput
    );

    clearFormMessage();
}


/* =========================================================
   AVATAR — PREVIEW
   ========================================================= */

function previewAvatar(
    file
) {

    if (avatarObjectUrl) {

        URL.revokeObjectURL(
            avatarObjectUrl
        );
    }

    avatarObjectUrl =
        URL.createObjectURL(
            file
        );


    if (livePreviewAvatar) {

        livePreviewAvatar.innerHTML = "";

        const image =
            document.createElement(
                "img"
            );

        image.src =
            avatarObjectUrl;

        image.alt =
            "Aperçu de la photo de chaîne";

        livePreviewAvatar.appendChild(
            image
        );
    }


    if (avatarPreview) {

        avatarPreview.innerHTML = "";

        const previewImage =
            document.createElement(
                "img"
            );

        previewImage.src =
            avatarObjectUrl;

        previewImage.alt =
            "Aperçu";

        avatarPreview.appendChild(
            previewImage
        );

        avatarPreview.classList.add(
            "has-image"
        );

        avatarPreview.hidden =
            false;
    }


    if (avatarRemoveButton) {

        avatarRemoveButton.hidden =
            false;
    }
}


/* =========================================================
   AVATAR — REMOVE
   ========================================================= */

function removeAvatar() {

    if (avatarObjectUrl) {

        URL.revokeObjectURL(
            avatarObjectUrl
        );

        avatarObjectUrl =
            null;
    }

    if (avatarInput) {

        avatarInput.value =
            "";
    }

    if (avatarPreview) {

        avatarPreview.innerHTML = `
            <i class="fa-solid fa-user"></i>
        `;

        avatarPreview.classList.remove(
            "has-image"
        );

        avatarPreview.hidden =
            false;
    }

    if (livePreviewAvatar) {

        livePreviewAvatar.innerHTML = `
            <i class="fa-solid fa-user"></i>
        `;
    }

    if (avatarRemoveButton) {

        avatarRemoveButton.hidden =
            true;
    }
}


/* =========================================================
   BANNER — SELECT
   ========================================================= */

function handleBannerChange(
    event
) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const validation =
        validateImage(
            file,
            MAX_BANNER_SIZE
        );

    if (!validation.valid) {

        setFormMessage(
            validation.message,
            "error"
        );

        event.target.value = "";

        removeBanner();

        return;
    }

    previewBanner(file);

    clearFieldError(
        bannerInput
    );

    clearFormMessage();
}


/* =========================================================
   BANNER — PREVIEW
   ========================================================= */

function previewBanner(
    file
) {

    if (bannerObjectUrl) {

        URL.revokeObjectURL(
            bannerObjectUrl
        );
    }

    bannerObjectUrl =
        URL.createObjectURL(
            file
        );


    if (bannerPreview) {

        bannerPreview.innerHTML = "";

        const image =
            document.createElement(
                "img"
            );

        image.src =
            bannerObjectUrl;

        image.alt =
            "Aperçu de la bannière";

        bannerPreview.appendChild(
            image
        );

        bannerPreview.classList.add(
            "has-image"
        );

        bannerPreview.hidden =
            false;
    }


    if (livePreviewBanner) {

        livePreviewBanner.style.backgroundImage =
            `url("${bannerObjectUrl}")`;

        livePreviewBanner.classList.add(
            "has-image"
        );
    }


    if (bannerRemoveButton) {

        bannerRemoveButton.hidden =
            false;
    }
}


/* =========================================================
   BANNER — REMOVE
   ========================================================= */

function removeBanner() {

    if (bannerObjectUrl) {

        URL.revokeObjectURL(
            bannerObjectUrl
        );

        bannerObjectUrl =
            null;
    }

    if (bannerInput) {

        bannerInput.value =
            "";
    }

    if (bannerPreview) {

        bannerPreview.innerHTML = `
            <div class="add-channel-banner-placeholder">

                <i class="fa-solid fa-image"></i>

                <span>
                    Aperçu de votre bannière
                </span>

            </div>
        `;

        bannerPreview.classList.remove(
            "has-image"
        );

        bannerPreview.hidden =
            false;
    }

    if (livePreviewBanner) {

        livePreviewBanner.style.backgroundImage =
            "";

        livePreviewBanner.classList.remove(
            "has-image"
        );
    }

    if (bannerRemoveButton) {

        bannerRemoveButton.hidden =
            true;
    }
}


/* =========================================================
   IMAGE VALIDATION
   ========================================================= */

function validateImage(
    file,
    maxSize
) {

    if (!file) {

        return {
            valid: false,
            message:
                "Aucune image sélectionnée."
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
                "Format d'image non pris en charge. Utilisez JPG, PNG ou WebP."
        };
    }

    if (
        file.size >
        maxSize
    ) {

        const maxMB =
            Math.round(
                maxSize /
                1024 /
                1024
            );

        return {
            valid: false,
            message:
                `L'image ne doit pas dépasser ${maxMB} Mo.`
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/* =========================================================
   STORAGE — FILE EXTENSION
   ========================================================= */

function getFileExtension(
    file
) {

    const mimeMap = {

        "image/jpeg": "jpg",

        "image/png": "png",

        "image/webp": "webp"

    };

    return (
        mimeMap[file.type] ||
        "jpg"
    );
}


/* =========================================================
   STORAGE — UPLOAD IMAGE
   ========================================================= */

async function uploadChannelImage(
    file,
    bucket,
    folder,
    userId
) {

    if (!file) {
        return null;
    }

    if (!supabase) {

        throw new Error(
            "Supabase n'est pas disponible."
        );
    }


    const extension =
        getFileExtension(
            file
        );


    /*
     * Nom unique.
     *
     * Exemple :
     * user-id/avatar-uuid.webp
     */

    const filename =
        `${folder}-${crypto.randomUUID()}.${extension}`;


    const path =
        `${userId}/${filename}`;


    const {
        error: uploadError
    } =
        await supabase.storage
            .from(bucket)
            .upload(
                path,
                file,
                {
                    cacheControl: "31536000",
                    upsert: false,
                    contentType: file.type
                }
            );


    if (uploadError) {

        console.error(
            "NetView — Storage upload error :",
            uploadError
        );

        throw uploadError;
    }


    /*
     * URL publique.
     */

    const {
        data: publicData
    } =
        supabase.storage
            .from(bucket)
            .getPublicUrl(
                path
            );


    const publicUrl =
        publicData?.publicUrl;


    if (!publicUrl) {

        /*
         * Si l'URL n'a pas pu être obtenue,
         * on supprime immédiatement le fichier
         * qui vient d'être envoyé.
         */

        await deleteStorageFile(
            bucket,
            path
        );

        throw new Error(
            "Impossible de récupérer l'URL publique de l'image."
        );
    }


    return {
        path,
        url: publicUrl
    };
}


/* =========================================================
   STORAGE — DELETE FILE
   ========================================================= */

async function deleteStorageFile(
    bucket,
    path
) {

    if (
        !bucket ||
        !path ||
        !supabase
    ) {
        return;
    }

    try {

        const {
            error
        } =
            await supabase.storage
                .from(bucket)
                .remove([
                    path
                ]);

        if (error) {

            console.error(
                "NetView — Impossible de supprimer le fichier Storage :",
                error
            );
        }

    } catch (error) {

        console.error(
            "NetView — Erreur suppression Storage :",
            error
        );
    }
}


/* =========================================================
   STORAGE — CLEANUP
   ========================================================= */

async function cleanupUploadedFiles() {

    if (uploadedAvatarPath) {

        await deleteStorageFile(
            AVATAR_BUCKET,
            uploadedAvatarPath
        );

        uploadedAvatarPath =
            null;
    }


    if (uploadedBannerPath) {

        await deleteStorageFile(
            BANNER_BUCKET,
            uploadedBannerPath
        );

        uploadedBannerPath =
            null;
    }
}


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

async function handleSubmit(
    event
) {

    event.preventDefault();


    if (isSubmitting) {
        return;
    }


    clearFormMessage();


    const validation =
        await validateForm();


    if (!validation.valid) {

        setFormMessage(
            validation.message,
            "error"
        );

        focusInvalidField();

        return;
    }


    currentUser =
        await getUser();


    if (!currentUser) {

        redirectToAuth();

        return;
    }


    /*
     * Vérification finale :
     * une seule chaîne par compte.
     */

    try {

        existingChannels =
            await getMyChannels();


        if (
            Array.isArray(
                existingChannels
            ) &&
            existingChannels.length > 0
        ) {

            redirectToExistingChannel();

            return;
        }

    } catch (error) {

        console.error(
            "NetView — Vérification chaîne :",
            error
        );

        setFormMessage(
            "Impossible de vérifier votre compte. Réessayez.",
            "error"
        );

        return;
    }


    isSubmitting =
        true;


    setSubmitLoading(
        true
    );


    showLoader(
        "Préparation des fichiers..."
    );


    try {

        const name =
            normalizeName(
                nameInput?.value
            );

        const handle =
            normalizeHandle(
                handleInput?.value
            );

        const description =
            normalizeDescription(
                descriptionInput?.value
            );


        /*
         * =========================================
         * UPLOAD AVATAR
         * =========================================
         */

        let avatarUrl =
            null;


        const avatarFile =
            avatarInput?.files?.[0];


        if (avatarFile) {

            showLoader(
                "Téléversement de la photo..."
            );


            const avatarResult =
                await uploadChannelImage(
                    avatarFile,
                    AVATAR_BUCKET,
                    "avatar",
                    currentUser.id
                );


            avatarUrl =
                avatarResult.url;


            uploadedAvatarPath =
                avatarResult.path;
        }


        /*
         * =========================================
         * UPLOAD BANNER
         * =========================================
         */

        let bannerUrl =
            null;


        const bannerFile =
            bannerInput?.files?.[0];


        if (bannerFile) {

            showLoader(
                "Téléversement de la bannière..."
            );


            const bannerResult =
                await uploadChannelImage(
                    bannerFile,
                    BANNER_BUCKET,
                    "banner",
                    currentUser.id
                );


            bannerUrl =
                bannerResult.url;


            uploadedBannerPath =
                bannerResult.path;
        }


        /*
         * =========================================
         * CREATE CHANNEL
         * =========================================
         */

        showLoader(
            "Création de votre chaîne..."
        );


        const values = {

            name,

            handle,

            description:
                description ||
                null,

            avatar_url:
                avatarUrl,

            banner_url:
                bannerUrl

        };


        const result =
            await createChannel(
                values
            );


        if (!result) {

            throw new Error(
                "Aucune réponse reçue lors de la création de la chaîne."
            );
        }


        if (result.error) {

            throw result.error;
        }


        const channel =
            result.data;


        if (!channel) {

            throw new Error(
                "La chaîne n'a pas pu être créée."
            );
        }


        /*
         * =========================================
         * SUCCÈS
         * =========================================
         *
         * Les fichiers sont maintenant liés
         * à la chaîne via leurs URLs.
         *
         * On ne les supprime donc plus.
         */

        uploadedAvatarPath =
            null;

        uploadedBannerPath =
            null;


        showToast(
            "Votre chaîne NetView a été créée.",
            "success"
        );


        redirectToChannel(
            channel
        );


    } catch (error) {

        console.error(
            "NetView — Erreur création chaîne :",
            error
        );


        /*
         * IMPORTANT :
         *
         * Si l'upload a réussi mais que
         * createChannel() échoue, les fichiers
         * ne doivent pas rester orphelins.
         */

        await cleanupUploadedFiles();


        handleCreationError(
            error
        );


    } finally {

        isSubmitting =
            false;

        setSubmitLoading(
            false
        );

        hideLoader();
    }
}


/* =========================================================
   FORM VALIDATION
   ========================================================= */

async function validateForm() {

    const name =
        normalizeName(
            nameInput?.value
        );

    const handle =
        normalizeHandle(
            handleInput?.value
        );

    const description =
        normalizeDescription(
            descriptionInput?.value
        );


    if (!name) {

        markFieldError(
            nameInput
        );

        return {
            valid: false,
            message:
                "Le nom de votre chaîne est obligatoire."
        };
    }


    if (
        name.length >
        MAX_NAME_LENGTH
    ) {

        markFieldError(
            nameInput
        );

        return {
            valid: false,
            message:
                `Le nom de la chaîne ne peut pas dépasser ${MAX_NAME_LENGTH} caractères.`
        };
    }


    if (!handle) {

        markFieldError(
            handleInput
        );

        return {
            valid: false,
            message:
                "Le handle de votre chaîne est obligatoire."
        };
    }


    if (
        !isValidHandle(
            handle
        )
    ) {

        markFieldError(
            handleInput
        );

        return {
            valid: false,
            message:
                `Le handle doit contenir entre ${HANDLE_MIN_LENGTH} et ${MAX_HANDLE_LENGTH} caractères, avec uniquement des lettres minuscules, chiffres, tirets ou underscores.`
        };
    }


    if (
        description.length >
        MAX_DESCRIPTION_LENGTH
    ) {

        markFieldError(
            descriptionInput
        );

        return {
            valid: false,
            message:
                `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`
        };
    }


    /*
     * Vérification réelle du handle.
     */

    const available =
        await checkHandleAvailability();


    if (!available) {

        markFieldError(
            handleInput
        );

        return {
            valid: false,
            message:
                "Ce handle est déjà utilisé ou ne peut pas être vérifié."
        };
    }


    return {
        valid: true,
        message: ""
    };
}


/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeName(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .slice(
            0,
            MAX_NAME_LENGTH
        );
}


function normalizeDescription(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .slice(
            0,
            MAX_DESCRIPTION_LENGTH
        );
}


/* =========================================================
   SUBMIT LOADING
   ========================================================= */

function setSubmitLoading(
    loading
) {

    if (!submitButton) {
        return;
    }


    submitButton.disabled =
        loading;


    submitButton.setAttribute(
        "aria-busy",
        loading
            ? "true"
            : "false"
    );


    if (loading) {

        if (
            !submitButton.dataset.originalContent
        ) {

            submitButton.dataset.originalContent =
                submitButton.innerHTML;
        }


        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Création...</span>
        `;

    } else {

        if (
            submitButton.dataset.originalContent
        ) {

            submitButton.innerHTML =
                submitButton.dataset.originalContent;
        }
    }
}


/* =========================================================
   LOADER
   ========================================================= */

function showLoader(
    message
) {

    if (!loader) {
        return;
    }


    if (
        loaderMessage &&
        message
    ) {

        loaderMessage.textContent =
            message;
    }


    loader.hidden =
        false;

    loader.setAttribute(
        "aria-hidden",
        "false"
    );
}


function hideLoader() {

    if (!loader) {
        return;
    }


    loader.hidden =
        true;

    loader.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* =========================================================
   ERROR HANDLING
   ========================================================= */

function handleCreationError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        );


    /*
     * Storage bucket absent
     */

    if (
        /bucket/i.test(message) &&
        (
            /not found/i.test(message) ||
            /does not exist/i.test(message)
        )
    ) {

        setFormMessage(
            "Le stockage des images de chaîne n'est pas correctement configuré dans Supabase.",
            "error"
        );

        return;
    }


    /*
     * Storage / permission
     */

    if (
        /storage/i.test(message) &&
        (
            /permission/i.test(message) ||
            /not authorized/i.test(message) ||
            /row-level security/i.test(message)
        )
    ) {

        setFormMessage(
            "Vous n'êtes pas autorisé à téléverser cette image.",
            "error"
        );

        return;
    }


    /*
     * PostgreSQL UNIQUE
     */

    if (
        error?.code === "23505" ||
        /duplicate key/i.test(message) ||
        /unique/i.test(message)
    ) {

        setFormMessage(
            "Cette chaîne ne peut pas être créée : le handle est déjà utilisé ou votre compte possède déjà une chaîne.",
            "error"
        );

        return;
    }


    /*
     * RLS
     */

    if (
        /row-level security/i.test(message) ||
        /permission denied/i.test(message) ||
        /violates row-level security/i.test(message)
    ) {

        setFormMessage(
            "La création de la chaîne n'est pas autorisée pour ce compte.",
            "error"
        );

        return;
    }


    /*
     * Auth
     */

    if (
        /non connecté/i.test(message) ||
        /not authenticated/i.test(message) ||
        /jwt/i.test(message) ||
        /auth/i.test(message)
    ) {

        redirectToAuth();

        return;
    }


    setFormMessage(
        message ||
        "Une erreur est survenue lors de la création de votre chaîne.",
        "error"
    );
}


/* =========================================================
   FIELD STATES
   ========================================================= */

function markFieldError(
    field
) {

    if (!field) {
        return;
    }


    field.classList.add(
        "is-invalid"
    );


    field.setAttribute(
        "aria-invalid",
        "true"
    );
}


function clearFieldError(
    field
) {

    if (!field) {
        return;
    }


    field.classList.remove(
        "is-invalid"
    );


    field.removeAttribute(
        "aria-invalid"
    );
}


/* =========================================================
   FOCUS INVALID
   ========================================================= */

function focusInvalidField() {

    const invalid =
        document.querySelector(
            ".is-invalid"
        );


    if (invalid) {

        invalid.focus({
            preventScroll: false
        });
    }
}


/* =========================================================
   MESSAGES
   ========================================================= */

function setFormMessage(
    message,
    type = ""
) {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        message;


    formMessage.classList.remove(
        "is-success",
        "is-error",
        "is-info"
    );


    if (type === "success") {

        formMessage.classList.add(
            "is-success"
        );
    }


    if (type === "error") {

        formMessage.classList.add(
            "is-error"
        );
    }


    if (type === "info") {

        formMessage.classList.add(
            "is-info"
        );
    }


    formMessage.hidden =
        !message;
}


function clearFormMessage() {

    setFormMessage(
        "",
        ""
    );
}


/* =========================================================
   TOAST
   ========================================================= */

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


    toastMessage.textContent =
        message;


    toast.classList.remove(
        "is-success",
        "is-error",
        "is-info"
    );


    if (type === "success") {

        toast.classList.add(
            "is-success"
        );

        if (toastIcon) {

            toastIcon.className =
                "fa-solid fa-circle-check";
        }

    } else if (type === "error") {

        toast.classList.add(
            "is-error"
        );

        if (toastIcon) {

            toastIcon.className =
                "fa-solid fa-circle-exclamation";
        }

    } else {

        toast.classList.add(
            "is-info"
        );

        if (toastIcon) {

            toastIcon.className =
                "fa-solid fa-circle-info";
        }
    }


    toast.hidden =
        false;


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            () => {

                toast.hidden =
                    true;

            },
            3500
        );
}


/* =========================================================
   CANCEL
   ========================================================= */

function handleCancel(
    event
) {

    /*
     * Le HTML possède déjà href="index.html".
     * Aucun redirect JavaScript nécessaire.
     */

    if (
        event?.defaultPrevented
    ) {
        return;
    }
}


/* =========================================================
   REDIRECT AUTH
   ========================================================= */

function redirectToAuth() {

    const currentPath =
        window.location.pathname +
        window.location.search;


    const target =
        `auth.html?redirect=${encodeURIComponent(
            currentPath
        )}`;


    window.location.replace(
        target
    );
}


/* =========================================================
   REDIRECT EXISTING CHANNEL
   ========================================================= */

function redirectToExistingChannel() {

    const channel =
        existingChannels?.[0];


    if (
        channel?.handle
    ) {

        window.location.replace(
            `channel.html?handle=${encodeURIComponent(
                channel.handle
            )}`
        );

        return;
    }


    if (
        channel?.id
    ) {

        window.location.replace(
            `channel.html?id=${encodeURIComponent(
                channel.id
            )}`
        );

        return;
    }


    window.location.replace(
        "mes-channel.html"
    );
}


/* =========================================================
   REDIRECT CREATED CHANNEL
   ========================================================= */

function redirectToChannel(
    channel
) {

    if (
        channel?.handle
    ) {

        window.location.replace(
            `channel.html?handle=${encodeURIComponent(
                channel.handle
            )}`
        );

        return;
    }


    if (
        channel?.id
    ) {

        window.location.replace(
            `channel.html?id=${encodeURIComponent(
                channel.id
            )}`
        );

        return;
    }


    window.location.replace(
        "mes-channel.html"
    );
}


/* =========================================================
   READABLE ERROR
   ========================================================= */

function getReadableError(
    error
) {

    if (
        error?.message
    ) {

        return error.message;
    }


    return "Impossible de charger la page de création de chaîne.";
}


/* =========================================================
   CLEANUP OBJECT URL
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (avatarObjectUrl) {

            URL.revokeObjectURL(
                avatarObjectUrl
            );
        }


        if (bannerObjectUrl) {

            URL.revokeObjectURL(
                bannerObjectUrl
            );
        }
    }
);


/* =========================================================
   DEBUG
   ========================================================= */

window.NetViewAddChannel = {

    normalizeHandle,

    normalizeName,

    normalizeDescription,

    isValidHandle,

    validateForm,

    checkHandleAvailability,

    removeAvatar,

    removeBanner,

    uploadChannelImage

};
