/* =========================================================
   NETVIEW — ADD CHANNEL
   js/pages/add-channel.js
   ========================================================= */

import {
    getCurrentUser
} from "../core/auth.js";

import {
    getMyChannels,
    createChannel
} from "../core/data.js";



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
        "channelAvatarPreview"
    );

const bannerPreview =
    document.getElementById(
        "channelBannerPreview"
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



/* =========================================================
   CONSTANTS
   ========================================================= */

const MAX_NAME_LENGTH = 100;

const MAX_HANDLE_LENGTH = 50;

const MAX_DESCRIPTION_LENGTH = 5000;

const HANDLE_MIN_LENGTH = 2;

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

        currentUser =
            await getCurrentUser();

        if (!currentUser) {

            redirectToAuth();

            return;
        }


        existingChannels =
            await getMyChannels();


        /*
         * Règle NetView :
         *
         * 1 compte Creator / NetViewer
         * =
         * 1 seule chaîne.
         */

        if (
            Array.isArray(
                existingChannels
            ) &&
            existingChannels.length > 0
        ) {

            redirectToExistingChannel();

            return;
        }


        initializeCounters();

        initializeInputs();

        initializeEvents();

    } catch (error) {

        console.error(
            "Erreur initialisation add-channel :",
            error
        );

        setFormMessage(
            "Impossible de charger la page de création de chaîne.",
            "error"
        );
    }
}



/* =========================================================
   EVENTS
   ========================================================= */

function initializeEvents() {

    if (form) {

        form.addEventListener(
            "submit",
            handleSubmit
        );
    }


    if (nameInput) {

        nameInput.addEventListener(
            "input",
            handleNameInput
        );
    }


    if (handleInput) {

        handleInput.addEventListener(
            "input",
            handleHandleInput
        );

        handleInput.addEventListener(
            "blur",
            handleHandleBlur
        );
    }


    if (descriptionInput) {

        descriptionInput.addEventListener(
            "input",
            handleDescriptionInput
        );
    }


    if (avatarInput) {

        avatarInput.addEventListener(
            "change",
            handleAvatarChange
        );
    }


    if (bannerInput) {

        bannerInput.addEventListener(
            "change",
            handleBannerChange
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            handleCancel
        );
    }

}



/* =========================================================
   INITIAL VALUES
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

    const length =
        nameInput.value.length;

    nameCounter.textContent =
        `${length}/${MAX_NAME_LENGTH}`;
}


function updateDescriptionCounter() {

    if (
        !descriptionInput ||
        !descriptionCounter
    ) {
        return;
    }

    const length =
        descriptionInput.value.length;

    descriptionCounter.textContent =
        `${length}/${MAX_DESCRIPTION_LENGTH}`;
}



/* =========================================================
   NAME
   ========================================================= */

function handleNameInput() {

    updateNameCounter();

    clearFieldError(
        nameInput
    );

}



/* =========================================================
   HANDLE
   ========================================================= */

function handleHandleInput() {

    if (!handleInput) {
        return;
    }


    const cursorPosition =
        handleInput.selectionStart;


    const original =
        handleInput.value;


    const normalized =
        normalizeHandle(
            original
        );


    handleInput.value =
        normalized;


    if (
        cursorPosition !== null
    ) {

        try {

            handleInput.setSelectionRange(
                normalized.length,
                normalized.length
            );

        } catch {
            /* Rien */
        }
    }


    clearFieldError(
        handleInput
    );


    setHandleStatus(
        "checking",
        "Vérification..."
    );


    clearTimeout(
        handleCheckTimer
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

    await checkHandleAvailability();

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
        .replace(/^@+/, "")
        .normalize("NFD")
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

    if (
        !handle ||
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
            "Ce handle n'est pas valide."
        );

        return false;
    }


    /*
     * On utilise une requête légère directement
     * sur Supabase via la fonction disponible
     * dans data.js si elle existe.
     *
     * Pour éviter de dépendre d'une fonction
     * supplémentaire, on vérifie également
     * contre les chaînes déjà chargées.
     */

    const normalizedExisting =
        existingChannels.some(
            channel =>
                String(
                    channel?.handle || ""
                ).toLowerCase() ===
                handle.toLowerCase()
        );


    if (normalizedExisting) {

        setHandleStatus(
            "error",
            "Ce handle est déjà utilisé."
        );

        return false;
    }


    /*
     * La contrainte UNIQUE de PostgreSQL
     * reste la protection définitive.
     */

    setHandleStatus(
        "success",
        "Handle disponible."
    );

    return true;
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

    } else if (
        type === "success"
    ) {

        handleStatus.classList.add(
            "is-success"
        );

    } else if (
        type === "error"
    ) {

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

    clearFieldError(
        descriptionInput
    );

}



/* =========================================================
   IMAGE — AVATAR
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

        clearPreview(
            avatarPreview
        );

        return;
    }


    previewImage(
        file,
        avatarPreview
    );

    clearFieldError(
        avatarInput
    );

}



/* =========================================================
   IMAGE — BANNER
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

        clearPreview(
            bannerPreview
        );

        return;
    }


    previewImage(
        file,
        bannerPreview
    );

    clearFieldError(
        bannerInput
    );

}



/* =========================================================
   IMAGE VALIDATION
   ========================================================= */

function validateImage(
    file,
    maxSize
) {

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
        file.size > maxSize
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
   IMAGE PREVIEW
   ========================================================= */

function previewImage(
    file,
    container
) {

    if (!container) {
        return;
    }


    const url =
        URL.createObjectURL(
            file
        );


    /*
     * Supporte plusieurs structures HTML :
     * - img directement
     * - conteneur contenant une img
     */

    let image =
        container.tagName ===
        "IMG"
            ? container
            : container.querySelector(
                "img"
            );


    if (!image) {

        image =
            document.createElement(
                "img"
            );

        image.alt =
            "Aperçu";


        container.appendChild(
            image
        );
    }


    image.src =
        url;


    container.hidden =
        false;


    image.onload =
        () => {

            URL.revokeObjectURL(
                url
            );

        };

}



/* =========================================================
   CLEAR PREVIEW
   ========================================================= */

function clearPreview(
    container
) {

    if (!container) {
        return;
    }


    const image =
        container.tagName ===
        "IMG"
            ? container
            : container.querySelector(
                "img"
            );


    if (image) {

        image.removeAttribute(
            "src"
        );
    }


    container.hidden =
        true;

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
        validateForm();


    if (!validation.valid) {

        setFormMessage(
            validation.message,
            "error"
        );

        focusInvalidField();

        return;
    }


    /*
     * Nouvelle vérification de session.
     */

    const user =
        await getCurrentUser();


    if (!user) {

        redirectToAuth();

        return;
    }


    /*
     * Nouvelle vérification de la règle
     * 1 compte = 1 chaîne.
     */

    try {

        const channels =
            await getMyChannels();


        if (
            channels &&
            channels.length > 0
        ) {

            redirectToExistingChannel();

            return;
        }


    } catch (error) {

        console.error(
            "Erreur vérification chaîne existante :",
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
         * IMPORTANT :
         *
         * On ne transmet volontairement PAS :
         *
         * owner_id
         * verified
         * subscribers_count
         * videos_count
         * total_views
         *
         * Ces champs appartiennent au système.
         */

        const values = {

            name,

            handle,

            description:
                description || null,

            avatar_url:
                null,

            banner_url:
                null
        };


        const result =
            await createChannel(
                values
            );


        if (
            result?.error
        ) {

            throw result.error;
        }


        const channel =
            result?.data;


        if (!channel) {

            throw new Error(
                "La chaîne n'a pas pu être créée."
            );
        }


        /*
         * Redirection vers la chaîne créée.
         *
         * Le handle est utilisé pour respecter
         * l'URL publique NetView :
         *
         * /@username
         */

        redirectToChannel(
            channel
        );


    } catch (error) {

        console.error(
            "Erreur création chaîne :",
            error
        );


        handleCreationError(
            error
        );


    } finally {

        isSubmitting =
            false;

        setSubmitLoading(
            false
        );
    }

}



/* =========================================================
   FORM VALIDATION
   ========================================================= */

function validateForm() {

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


    if (!isValidHandle(handle)) {

        markFieldError(
            handleInput
        );

        return {
            valid: false,
            message:
                "Le handle doit contenir uniquement des lettres minuscules, chiffres, tirets ou underscores."
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


    const existing =
        existingChannels.some(
            channel =>
                String(
                    channel?.handle || ""
                ).toLowerCase() ===
                handle.toLowerCase()
        );


    if (existing) {

        markFieldError(
            handleInput
        );

        return {
            valid: false,
            message:
                "Ce handle est déjà utilisé."
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
   SUBMIT BUTTON
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


        submitButton.innerHTML =
            `
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
     * PostgreSQL unique violation.
     */

    if (
        error?.code === "23505" ||
        /duplicate key/i.test(
            message
        ) ||
        /unique/i.test(
            message
        )
    ) {

        /*
         * Cela peut être le handle
         * OU owner_id.
         */

        setFormMessage(
            "Cette chaîne ne peut pas être créée : le handle est déjà utilisé ou votre compte possède déjà une chaîne.",
            "error"
        );

        return;
    }


    if (
        /row-level security/i.test(
            message
        ) ||
        /permission denied/i.test(
            message
        )
    ) {

        setFormMessage(
            "La création de la chaîne n'est pas autorisée pour ce compte.",
            "error"
        );

        return;
    }


    if (
        /not authenticated/i.test(
            message
        ) ||
        /jwt/i.test(
            message
        )
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
   FOCUS INVALID FIELD
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

    } else if (
        type === "error"
    ) {

        formMessage.classList.add(
            "is-error"
        );

    } else if (
        type === "info"
    ) {

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
   CANCEL
   ========================================================= */

function handleCancel() {

    /*
     * Pas de history.back() aveugle :
     * l'utilisateur peut arriver directement
     * sur add-channel.html.
     */

    window.location.href =
        "index.html";

}



/* =========================================================
   REDIRECTIONS
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
   DEBUG
   ========================================================= */

window.NetViewAddChannel = {
    normalizeHandle,
    validateForm,
    checkHandleAvailability
};
