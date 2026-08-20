/* =========================================================
   NetView — Playlist
   js/pages/playlist.js

   Jour 23

   Dépendances :
   - core/supabase.js
   - core/auth.js
   - core/data.js
   - core/navigation.js
   - core/ui.js
   - core/utils.js

   Fonctionnalités :
   - Chargement d'une playlist
   - Playlist publique / privée
   - Propriétaire
   - Vidéos et métadonnées
   - Lecture complète
   - Lecture aléatoire
   - Tri
   - Réorganisation
   - Suppression d'une vidéo
   - Suppression de playlist
   - Partage
   - Copie du lien
   - Menu contextuel
   - Responsive
   - Gestion des états
   - Authentification
   - Synchronisation avec data.js
   ========================================================= */ User

import { getUser } from "../core/auth.js";

import {
    getPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeVideoFromPlaylist,
    updatePlaylistItemPosition
} from "../core/data.js";

import {
    initNavigation
} from "../core/navigation.js";

import {
    showToast
} from "../core/ui.js";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONFIG = {
    MAX_DESCRIPTION_LENGTH: 5000,
    TOAST_DURATION: 3000,
    DRAG_THRESHOLD: 8
};


/* =========================================================
   STATE
   ========================================================= */

const state = {

    playlistId: null,

    playlist: null,

    currentUser: null,

    isOwner: false,

    isLoading: false,

    isEditing: false,

    isSavingOrder: false,

    currentSort: "position",

    videos: [],

    draggedVideoId: null,

    selectedVideoId: null,

    selectedVideoTitle: "",

    lastFocusedElement: null

};


/* =========================================================
   DOM
   ========================================================= */

const dom = {};


/* =========================================================
   INITIALISATION DOM
   ========================================================= */

function cacheDOM() {

    dom.loading =
        document.getElementById(
            "playlistLoading"
        );

    dom.error =
        document.getElementById(
            "playlistError"
        );

    dom.errorTitle =
        document.getElementById(
            "playlistErrorTitle"
        );

    dom.errorMessage =
        document.getElementById(
            "playlistErrorMessage"
        );

    dom.retry =
        document.getElementById(
            "playlistRetryButton"
        );

    dom.private =
        document.getElementById(
            "playlistPrivate"
        );

    dom.content =
        document.getElementById(
            "playlistContent"
        );

    dom.cover =
        document.getElementById(
            "playlistCover"
        );

    dom.coverCount =
        document.getElementById(
            "playlistCoverVideoCount"
        );

    dom.title =
        document.getElementById(
            "playlistTitle"
        );

    dom.visibility =
        document.getElementById(
            "playlistVisibility"
        );

    dom.description =
        document.getElementById(
            "playlistDescription"
        );

    dom.owner =
        document.getElementById(
            "playlistOwner"
        );

    dom.ownerLink =
        document.getElementById(
            "playlistOwnerLink"
        );

    dom.ownerAvatar =
        document.getElementById(
            "playlistOwnerAvatar"
        );

    dom.ownerName =
        document.getElementById(
            "playlistOwnerName"
        );

    dom.ownerVerified =
        document.getElementById(
            "playlistOwnerVerified"
        );

    dom.videoCount =
        document.getElementById(
            "playlistVideoCount"
        );

    dom.createdAt =
        document.getElementById(
            "playlistCreatedAt"
        );

    dom.play =
        document.getElementById(
            "playlistPlayButton"
        );

    dom.shuffle =
        document.getElementById(
            "playlistShuffleButton"
        );

    dom.share =
        document.getElementById(
            "playlistShareButton"
        );

    dom.more =
        document.getElementById(
            "playlistMoreButton"
        );

    dom.moreMenu =
        document.getElementById(
            "playlistMoreMenu"
        );

    dom.copyLink =
        document.getElementById(
            "playlistCopyLinkButton"
        );

    dom.edit =
        document.getElementById(
            "playlistEditButton"
        );

    dom.delete =
        document.getElementById(
            "playlistDeleteButton"
        );

    dom.toolbar =
        document.querySelector(
            ".playlist-toolbar"
        );

    dom.sortButton =
        document.getElementById(
            "playlistSortButton"
        );

    dom.sortMenu =
        document.getElementById(
            "playlistSortMenu"
        );

    dom.editingHint =
        document.getElementById(
            "playlistEditingHint"
        );

    dom.empty =
        document.getElementById(
            "playlistEmpty"
        );

    dom.videosSection =
        document.getElementById(
            "playlistVideosSection"
        );

    dom.videosHeaderCount =
        document.getElementById(
            "playlistVideosHeaderCount"
        );

    dom.manage =
        document.getElementById(
            "playlistManageButton"
        );

    dom.videos =
        document.getElementById(
            "playlistVideos"
        );

    dom.videosLoading =
        document.getElementById(
            "playlistVideosLoading"
        );

    dom.shareModal =
        document.getElementById(
            "playlistShareModal"
        );

    dom.closeShare =
        document.getElementById(
            "closePlaylistShareModal"
        );

    dom.shareOptions =
        document.getElementById(
            "playlistShareOptions"
        );

    dom.shareInput =
        document.getElementById(
            "playlistShareLinkInput"
        );

    dom.copyShare =
        document.getElementById(
            "playlistCopyShareLinkButton"
        );

    dom.deleteModal =
        document.getElementById(
            "playlistDeleteModal"
        );

    dom.cancelDelete =
        document.getElementById(
            "cancelPlaylistDeleteButton"
        );

    dom.confirmDelete =
        document.getElementById(
            "confirmPlaylistDeleteButton"
        );

    dom.removeModal =
        document.getElementById(
            "playlistRemoveVideoModal"
        );

    dom.closeRemove =
        document.getElementById(
            "closeRemoveVideoModal"
        );

    dom.removeMessage =
        document.getElementById(
            "playlistRemoveVideoMessage"
        );

    dom.cancelRemove =
        document.getElementById(
            "cancelRemoveVideoButton"
        );

    dom.confirmRemove =
        document.getElementById(
            "confirmRemoveVideoButton"
        );

    dom.loginModal =
        document.getElementById(
            "playlistLoginModal"
        );

    dom.closeLogin =
        document.getElementById(
            "closePlaylistLoginModal"
        );

    dom.contextMenu =
        document.getElementById(
            "playlistVideoContextMenu"
        );

    dom.toast =
        document.getElementById(
            "playlistToast"
        );

    dom.toastIcon =
        document.getElementById(
            "playlistToastIcon"
        );

    dom.toastMessage =
        document.getElementById(
            "playlistToastMessage"
        );

    dom.pageLoader =
        document.getElementById(
            "pageLoader"
        );

    dom.pageLoaderText =
        document.getElementById(
            "pageLoaderText"
        );

    dom.searchForm =
        document.getElementById(
            "searchForm"
        );

    dom.searchInput =
        document.getElementById(
            "searchInput"
        );
}


/* =========================================================
   UTILITAIRES
   ========================================================= */

function getPlaylistId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("id") ||
        params.get("playlist") ||
        params.get("playlist_id")
    );
}


function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}


function formatNumber(value) {

    const number =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "fr-FR"
    ).format(number);
}


function formatDuration(seconds) {

    const total =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const hours =
        Math.floor(
            total / 3600
        );

    const minutes =
        Math.floor(
            (total % 3600) / 60
        );

    const secs =
        Math.floor(
            total % 60
        );

    if (hours > 0) {

        return [
            hours,
            String(minutes).padStart(
                2,
                "0"
            ),
            String(secs).padStart(
                2,
                "0"
            )
        ].join(":");

    }

    return [
        minutes,
        String(secs).padStart(
            2,
            "0"
        )
    ].join(":");
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(
            dateValue
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
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}


function getInitials(name) {

    if (!name) {
        return "N";
    }

    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0)
        )
        .join("")
        .toUpperCase();
}


function normalizeItems(items) {

    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .filter(
            item =>
                item &&
                item.video_id
        )
        .map(
            item => ({
                ...item,
                position:
                    Number(
                        item.position
                    ) || 0,
                video:
                    item.videos || null
            })
        );
}


function getVideoFromItem(item) {

    if (!item) {
        return null;
    }

    return (
        item.video ||
        item.videos ||
        null
    );
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function toast(
    message,
    type = "success"
) {

    if (
        typeof showToast ===
        "function"
    ) {

        try {

            showToast(
                message,
                type
            );

            return;

        } catch (_) {
            // Fallback local
        }
    }

    if (!dom.toast) {
        return;
    }

    if (dom.toastMessage) {
        dom.toastMessage.textContent =
            message;
    }

    if (dom.toastIcon) {

        dom.toastIcon.className =
            type === "error"
                ? "fa-solid fa-circle-exclamation"
                : "fa-solid fa-circle-check";

    }

    dom.toast.hidden = false;

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {
                dom.toast.hidden =
                    true;
            },
            CONFIG.TOAST_DURATION
        );
}


/* =========================================================
   STATES
   ========================================================= */

function showOnly(element) {

    [
        dom.loading,
        dom.error,
        dom.private,
        dom.content
    ].forEach(
        node => {

            if (!node) {
                return;
            }

            node.hidden =
                node !== element;

        }
    );
}


function showLoading() {

    if (dom.loading) {
        dom.loading.hidden =
            false;
    }

    if (dom.error) {
        dom.error.hidden =
            true;
    }

    if (dom.private) {
        dom.private.hidden =
            true;
    }

    if (dom.content) {
        dom.content.hidden =
            true;
    }
}


function showError(
    title,
    message
) {

    if (dom.errorTitle) {
        dom.errorTitle.textContent =
            title;
    }

    if (dom.errorMessage) {
        dom.errorMessage.textContent =
            message;
    }

    showOnly(
        dom.error
    );
}


function showPrivate() {

    showOnly(
        dom.private
    );
}


function showContent() {

    showOnly(
        dom.content
    );
}


/* =========================================================
   LOADER
   ========================================================= */

function setPageLoader(
    visible,
    text = "Chargement..."
) {

    if (!dom.pageLoader) {
        return;
    }

    if (dom.pageLoaderText) {
        dom.pageLoaderText.textContent =
            text;
    }

    dom.pageLoader.hidden =
        !visible;
}


/* =========================================================
   OWNERSHIP
   ========================================================= */

function calculateOwnership() {

    state.isOwner =
        Boolean(
            state.currentUser &&
            state.playlist &&
            state.playlist.owner_id ===
                state.currentUser.id
        );

}


/* =========================================================
   VISIBILITY
   ========================================================= */

function isPlaylistPublic() {

    return (
        !state.playlist ||
        !state.playlist.visibility ||
        state.playlist.visibility ===
            "public"
    );
}


function renderVisibility() {

    if (!dom.visibility) {
        return;
    }

    const visibility =
        state.playlist?.visibility ||
        "public";

    const map = {

        public: {
            icon:
                "fa-solid fa-earth-americas",
            label:
                "Publique"
        },

        unlisted: {
            icon:
                "fa-solid fa-link",
            label:
                "Non répertoriée"
        },

        private: {
            icon:
                "fa-solid fa-lock",
            label:
                "Privée"
        }

    };

    const item =
        map[visibility] ||
        map.public;

    dom.visibility.innerHTML =
        `
        <i class="${item.icon}"></i>
        ${escapeHTML(item.label)}
        `;

}


/* =========================================================
   OWNER
   ========================================================= */

function renderOwner() {

    const owner =
        state.playlist?.profiles ||
        state.playlist?.owner ||
        null;

    const profile =
        owner ||
        state.playlist?.profile ||
        null;

    const name =
        profile?.display_name ||
        profile?.username ||
        profile?.name ||
        (
            state.isOwner
                ? "Vous"
                : "Utilisateur"
        );

    const avatar =
        profile?.avatar_url ||
        "assets/images/default-avatar.png";

    const username =
        profile?.username;

    if (dom.ownerName) {
        dom.ownerName.textContent =
            username
                ? `@${username}`
                : name;
    }

    if (dom.ownerAvatar) {

        dom.ownerAvatar.src =
            avatar;

        dom.ownerAvatar.alt =
            name;

        dom.ownerAvatar.onerror =
            () => {

                dom.ownerAvatar.src =
                    "assets/images/default-avatar.png";

            };

    }

    if (dom.ownerVerified) {

        const verified =
            Boolean(
                profile?.verified
            );

        dom.ownerVerified.hidden =
            !verified;

    }

    if (dom.ownerLink) {

        if (username) {

            dom.ownerLink.href =
                `profile.html?username=${encodeURIComponent(
                    username
                )}`;

        } else if (
            state.playlist?.owner_id
        ) {

            dom.ownerLink.href =
                `profile.html?id=${encodeURIComponent(
                    state.playlist.owner_id
                )}`;

        }

    }

}


/* =========================================================
   COVER
   ========================================================= */

function renderCover() {

    if (!dom.cover) {
        return;
    }

    const firstItem =
        state.videos[0];

    const firstVideo =
        getVideoFromItem(
            firstItem
        );

    const thumbnail =
        firstVideo?.thumbnail_url;

    if (thumbnail) {

        dom.cover.style.backgroundImage =
            `url("${thumbnail.replaceAll(
                '"',
                '\\"'
            )}")`;

        dom.cover.classList.add(
            "has-image"
        );

        dom.cover.innerHTML =
            `
            <img
                src="${escapeHTML(
                    thumbnail
                )}"
                alt=""
                loading="eager"
            >
            `;

    } else {

        dom.cover.classList.remove(
            "has-image"
        );

        dom.cover.style.backgroundImage =
            "";

        dom.cover.innerHTML =
            `
            <div class="playlist-cover-placeholder">
                <i class="fa-solid fa-list"></i>
            </div>
            `;

    }

}


/* =========================================================
   PLAYLIST INFORMATION
   ========================================================= */

function renderPlaylistInformation() {

    const playlist =
        state.playlist;

    if (!playlist) {
        return;
    }

    const title =
        playlist.title ||
        "Playlist sans titre";

    if (dom.title) {
        dom.title.textContent =
            title;
    }

    document.title =
        `${title} — NetView`;

    if (dom.description) {

        const description =
            playlist.description ||
            "";

        dom.description.textContent =
            description;

        dom.description.hidden =
            !description;

    }

    const count =
        state.videos.length;

    if (dom.videoCount) {

        dom.videoCount.textContent =
            formatNumber(
                count
            );

    }

    if (dom.coverCount) {

        dom.coverCount.textContent =
            `${formatNumber(count)} ${
                count === 1
                    ? "vidéo"
                    : "vidéos"
            }`;

    }

    if (dom.videosHeaderCount) {

        dom.videosHeaderCount.textContent =
            `${formatNumber(count)} ${
                count === 1
                    ? "vidéo"
                    : "vidéos"
            }`;

    }

    if (dom.createdAt) {

        dom.createdAt.textContent =
            formatDate(
                playlist.created_at
            );

    }

    renderVisibility();
    renderOwner();
    renderCover();

}


/* =========================================================
   OWNER CONTROLS
   ========================================================= */

function renderOwnerControls() {

    const owner =
        state.isOwner;

    if (dom.edit) {
        dom.edit.hidden =
            !owner;
    }

    if (dom.delete) {
        dom.delete.hidden =
            !owner;
    }

    if (dom.manage) {
        dom.manage.hidden =
            !owner ||
            state.videos.length === 0;
    }

    if (dom.editingHint) {
        dom.editingHint.hidden =
            !state.isEditing;
    }

    if (dom.play) {
        dom.play.disabled =
            state.videos.length === 0;
    }

    if (dom.shuffle) {
        dom.shuffle.disabled =
            state.videos.length < 2;
    }

}


/* =========================================================
   VIDEO SORT
   ========================================================= */

function sortVideos() {

    const videos =
        [...state.videos];

    switch (
        state.currentSort
    ) {

        case "newest":

            videos.sort(
                (a, b) => {

                    const av =
                        getVideoFromItem(a);

                    const bv =
                        getVideoFromItem(b);

                    return (
                        new Date(
                            bv?.created_at ||
                            0
                        ).getTime() -
                        new Date(
                            av?.created_at ||
                            0
                        ).getTime()
                    );

                }
            );

            break;


        case "oldest":

            videos.sort(
                (a, b) => {

                    const av =
                        getVideoFromItem(a);

                    const bv =
                        getVideoFromItem(b);

                    return (
                        new Date(
                            av?.created_at ||
                            0
                        ).getTime() -
                        new Date(
                            bv?.created_at ||
                            0
                        ).getTime()
                    );

                }
            );

            break;


        case "position":
        default:

            videos.sort(
                (a, b) =>
                    Number(a.position) -
                    Number(b.position)
            );

            break;

    }

    return videos;
}


/* =========================================================
   VIDEO LIST RENDERING
   ========================================================= */

function renderVideos() {

    if (!dom.videos) {
        return;
    }

    const videos =
        sortVideos();

    dom.videos.innerHTML =
        "";

    if (!videos.length) {

        if (dom.empty) {
            dom.empty.hidden =
                false;
        }

        if (dom.videosSection) {
            dom.videosSection.hidden =
                true;
        }

        renderOwnerControls();

        return;
    }

    if (dom.empty) {
        dom.empty.hidden =
            true;
    }

    if (dom.videosSection) {
        dom.videosSection.hidden =
            false;
    }

    const fragment =
        document.createDocumentFragment();

    videos.forEach(
        (
            item,
            index
        ) => {

            const video =
                getVideoFromItem(
                    item
                );

            if (!video) {
                return;
            }

            const element =
                createVideoElement(
                    item,
                    video,
                    index
                );

            fragment.appendChild(
                element
            );

        }
    );

    dom.videos.appendChild(
        fragment
    );

    renderOwnerControls();

}


/* =========================================================
   VIDEO ELEMENT
   ========================================================= */

function createVideoElement(
    item,
    video,
    index
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "playlist-video-item";

    article.dataset.videoId =
        video.id;

    article.dataset.position =
        String(
            item.position
        );

    article.draggable =
        Boolean(
            state.isEditing &&
            state.isOwner
        );


    const thumbnail =
        video.thumbnail_url ||
        "assets/images/default-video-thumbnail.png";

    const title =
        video.title ||
        "Vidéo sans titre";

    const channel =
        video.channels ||
        video.channel ||
        null;

    const channelName =
        channel?.name ||
        "";

    const views =
        formatNumber(
            video.views
        );

    const duration =
        formatDuration(
            video.duration
        );


    article.innerHTML =
        `
        ${
            state.isEditing &&
            state.isOwner
                ? `
                    <button
                        type="button"
                        class="playlist-video-drag-handle"
                        data-action="drag"
                        aria-label="Déplacer la vidéo"
                        title="Déplacer"
                    >
                        <i class="fa-solid fa-grip-vertical"></i>
                    </button>
                  `
                : `
                    <span class="playlist-video-index">
                        ${index + 1}
                    </span>
                  `
        }

        <a
            class="playlist-video-thumbnail-link"
            href="player.html?id=${encodeURIComponent(
                video.id
            )}"
            data-action="open"
            aria-label="${escapeHTML(
                title
            )}"
        >

            <div class="playlist-video-thumbnail">

                <img
                    src="${escapeHTML(
                        thumbnail
                    )}"
                    alt=""
                    loading="lazy"
                >

                ${
                    duration
                        ? `
                            <span class="playlist-video-duration">
                                ${escapeHTML(
                                    duration
                                )}
                            </span>
                          `
                        : ""
                }

            </div>

        </a>


        <div class="playlist-video-information">

            <a
                class="playlist-video-title"
                href="player.html?id=${encodeURIComponent(
                    video.id
                )}"
                data-action="open"
            >
                ${escapeHTML(title)}
            </a>


            ${
                channelName
                    ? `
                        <a
                            class="playlist-video-channel"
                            href="channel.html?id=${encodeURIComponent(
                                channel.id
                            )}"
                        >
                            ${escapeHTML(
                                channelName
                            )}
                        </a>
                      `
                    : ""
            }


            <div class="playlist-video-meta">

                ${
                    views
                        ? `
                            <span>
                                ${views} vues
                            </span>
                          `
                        : ""
                }

            </div>

        </div>


        <div class="playlist-video-actions">

            <button
                type="button"
                class="playlist-video-more"
                data-action="menu"
                aria-label="Options"
                aria-expanded="false"
                title="Options"
            >

                <i class="fa-solid fa-ellipsis-vertical"></i>

            </button>

        </div>
        `;


    bindVideoElementEvents(
        article,
        item,
        video
    );

    return article;
}


/* =========================================================
   VIDEO EVENTS
   ========================================================= */

function bindVideoElementEvents(
    element,
    item,
    video
) {

    element.addEventListener(
        "click",
        event => {

            const action =
                event.target.closest(
                    "[data-action]"
                )?.dataset.action;

            if (!action) {
                return;
            }

            if (
                action === "menu"
            ) {

                event.preventDefault();
                event.stopPropagation();

                openContextMenu(
                    event,
                    video.id,
                    video.title
                );

            }

        }
    );


    element.addEventListener(
        "contextmenu",
        event => {

            event.preventDefault();

            openContextMenu(
                event,
                video.id,
                video.title
            );

        }
    );


    if (
        state.isEditing &&
        state.isOwner
    ) {

        element.addEventListener(
            "dragstart",
            event => {

                state.draggedVideoId =
                    video.id;

                element.classList.add(
                    "is-dragging"
                );

                event.dataTransfer.effectAllowed =
                    "move";

                event.dataTransfer.setData(
                    "text/plain",
                    video.id
                );

            }
        );


        element.addEventListener(
            "dragend",
            () => {

                state.draggedVideoId =
                    null;

                element.classList.remove(
                    "is-dragging"
                );

                document
                    .querySelectorAll(
                        ".playlist-video-item.is-drag-over"
                    )
                    .forEach(
                        itemElement =>
                            itemElement.classList.remove(
                                "is-drag-over"
                            )
                    );

            }
        );


        element.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                if (
                    state.draggedVideoId ===
                    video.id
                ) {
                    return;
                }

                element.classList.add(
                    "is-drag-over"
                );

            }
        );


        element.addEventListener(
            "dragleave",
            () => {

                element.classList.remove(
                    "is-drag-over"
                );

            }
        );


        element.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                element.classList.remove(
                    "is-drag-over"
                );

                const draggedId =
                    event.dataTransfer.getData(
                        "text/plain"
                    ) ||
                    state.draggedVideoId;

                if (
                    !draggedId ||
                    draggedId ===
                        video.id
                ) {
                    return;
                }

                reorderLocally(
                    draggedId,
                    video.id
                );

            }
        );

    }

}


/* =========================================================
   REORDER LOCAL
   ========================================================= */

function reorderLocally(
    draggedId,
    targetId
) {

    if (
        !state.isOwner ||
        state.isSavingOrder
    ) {
        return;
    }

    const sourceIndex =
        state.videos.findIndex(
            item =>
                item.video_id ===
                draggedId
        );

    const targetIndex =
        state.videos.findIndex(
            item =>
                item.video_id ===
                targetId
        );

    if (
        sourceIndex < 0 ||
        targetIndex < 0
    ) {
        return;
    }

    const items =
        [...state.videos];

    const [
        moved
    ] =
        items.splice(
            sourceIndex,
            1
        );

    items.splice(
        targetIndex,
        0,
        moved
    );

    items.forEach(
        (
            item,
            index
        ) => {

            item.position =
                index;

        }
    );

    state.videos =
        items;

    state.currentSort =
        "position";

    renderVideos();

    saveOrder();

}


/* =========================================================
   SAVE ORDER
   ========================================================= */

async function saveOrder() {

    if (
        !state.isOwner ||
        state.isSavingOrder
    ) {
        return;
    }

    state.isSavingOrder =
        true;

    setPageLoader(
        true,
        "Enregistrement de l'ordre..."
    );

    try {

        for (
            let index = 0;
            index < state.videos.length;
            index++
        ) {

            const item =
                state.videos[index];

            const result =
                await updatePlaylistItemPosition(
                    state.playlistId,
                    item.video_id,
                    index
                );

            if (
                result?.error
            ) {
                throw result.error;
            }

        }

        state.videos.forEach(
            (
                item,
                index
            ) => {

                item.position =
                    index;

            }
        );

        toast(
            "Ordre de la playlist enregistré."
        );

    } catch (error) {

        console.error(
            "NetView playlist reorder error:",
            error
        );

        toast(
            "Impossible d'enregistrer l'ordre.",
            "error"
        );

        await loadPlaylist();

    } finally {

        state.isSavingOrder =
            false;

        setPageLoader(
            false
        );

    }

}


/* =========================================================
   CONTEXT MENU
   ========================================================= */

function openContextMenu(
    event,
    videoId,
    title
) {

    if (!dom.contextMenu) {
        return;
    }

    state.selectedVideoId =
        videoId;

    state.selectedVideoTitle =
        title || "";

    const removeButton =
        dom.contextMenu.querySelector(
            '[data-action="remove"]'
        );

    if (removeButton) {
        removeButton.hidden =
            !state.isOwner;
    }

    dom.contextMenu.hidden =
        false;

    let x =
        event.clientX;

    let y =
        event.clientY;

    const rect =
        dom.contextMenu.getBoundingClientRect();

    const maxX =
        window.innerWidth -
        rect.width -
        8;

    const maxY =
        window.innerHeight -
        rect.height -
        8;

    x =
        Math.max(
            8,
            Math.min(
                x,
                maxX
            )
        );

    y =
        Math.max(
            8,
            Math.min(
                y,
                maxY
            )
        );

    dom.contextMenu.style.left =
        `${x}px`;

    dom.contextMenu.style.top =
        `${y}px`;

}


function closeContextMenu() {

    if (dom.contextMenu) {
        dom.contextMenu.hidden =
            true;
    }

}


/* =========================================================
   OPEN VIDEO
   ========================================================= */

function openVideo(
    videoId
) {

    if (!videoId) {
        return;
    }

    const url =
        `player.html?id=${encodeURIComponent(
            videoId
        )}`;

    window.location.href =
        url;
}


/* =========================================================
   PLAY ALL
   ========================================================= */

function playAll(
    shuffle = false
) {

    if (
        !state.videos.length
    ) {
        toast(
            "Cette playlist ne contient aucune vidéo.",
            "error"
        );

        return;
    }

    let videos =
        [...state.videos];

    if (shuffle) {
        videos =
            shuffleArray(
                videos
            );
    }

    const first =
        videos[0];

    if (!first?.video_id) {
        return;
    }

    const playlistParam =
        encodeURIComponent(
            state.playlistId
        );

    const url =
        `player.html?id=${encodeURIComponent(
            first.video_id
        )}&playlist=${playlistParam}`;

    window.location.href =
        url;
}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffleArray(
    array
) {

    const result =
        [...array];

    for (
        let i =
            result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            result[i],
            result[j]
        ] =
        [
            result[j],
            result[i]
        ];

    }

    return result;
}


/* =========================================================
   SHARE
   ========================================================= */

function getPlaylistUrl() {

    const url =
        new URL(
            window.location.href
        );

    url.search =
        "";

    url.searchParams.set(
        "id",
        state.playlistId
    );

    return url.toString();
}


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

    } catch (_) {
        // fallback
    }

    try {

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

        const success =
            document.execCommand(
                "copy"
            );

        textarea.remove();

        return success;

    } catch (_) {

        return false;

    }

}


async function copyPlaylistLink() {

    const url =
        getPlaylistUrl();

    const success =
        await copyText(
            url
        );

    if (success) {

        toast(
            "Lien de la playlist copié."
        );

    } else {

        toast(
            "Impossible de copier le lien.",
            "error"
        );

    }

}


/* =========================================================
   SHARE MODAL
   ========================================================= */

function openShareModal() {

    if (!dom.shareModal) {
        return;
    }

    state.lastFocusedElement =
        document.activeElement;

    const url =
        getPlaylistUrl();

    if (dom.shareInput) {
        dom.shareInput.value =
            url;
    }

    dom.shareModal.hidden =
        false;

    dom.shareModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


function closeShareModal() {

    if (!dom.shareModal) {
        return;
    }

    dom.shareModal.hidden =
        true;

    dom.shareModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    if (
        state.lastFocusedElement &&
        typeof state.lastFocusedElement.focus ===
            "function"
    ) {

        state.lastFocusedElement.focus();

    }

}


async function nativeShare() {

    const url =
        getPlaylistUrl();

    const title =
        state.playlist?.title ||
        "Playlist NetView";

    if (
        navigator.share
    ) {

        try {

            await navigator.share({
                title,
                text:
                    "Découvrez cette playlist sur NetView.",
                url
            });

        } catch (error) {

            if (
                error?.name !==
                "AbortError"
            ) {

                toast(
                    "Le partage n'a pas pu être effectué.",
                    "error"
                );

            }

        }

        return;
    }

    await copyPlaylistLink();

}


/* =========================================================
   EDIT PLAYLIST
   ========================================================= */

async function editPlaylist() {

    if (!state.isOwner) {
        requireLogin();
        return;
    }

    const currentTitle =
        state.playlist?.title ||
        "";

    const currentDescription =
        state.playlist?.description ||
        "";

    const currentVisibility =
        state.playlist?.visibility ||
        "public";


    const title =
        window.prompt(
            "Nom de la playlist :",
            currentTitle
        );

    if (
        title === null
    ) {
        return;
    }

    const cleanTitle =
        title.trim();

    if (!cleanTitle) {

        toast(
            "Le nom de la playlist est obligatoire.",
            "error"
        );

        return;
    }


    const description =
        window.prompt(
            "Description de la playlist :",
            currentDescription
        );

    if (
        description === null
    ) {
        return;
    }


    const visibility =
        window.prompt(
            "Visibilité : public, unlisted ou private",
            currentVisibility
        );

    if (
        visibility === null
    ) {
        return;
    }

    const cleanVisibility =
        visibility
            .trim()
            .toLowerCase();

    const validVisibility = [
        "public",
        "unlisted",
        "private"
    ];

    if (
        !validVisibility.includes(
            cleanVisibility
        )
    ) {

        toast(
            "Visibilité invalide.",
            "error"
        );

        return;
    }

    if (
        description.length >
        CONFIG.MAX_DESCRIPTION_LENGTH
    ) {

        toast(
            "La description est trop longue.",
            "error"
        );

        return;
    }


    setPageLoader(
        true,
        "Modification de la playlist..."
    );

    try {

        const result =
            await updatePlaylist(
                state.playlistId,
                {
                    title:
                        cleanTitle,
                    description:
                        description.trim() ||
                        null,
                    visibility:
                        cleanVisibility
                }
            );

        if (
            result?.error
        ) {
            throw result.error;
        }

        if (
            result?.data
        ) {

            state.playlist =
                {
                    ...state.playlist,
                    ...result.data
                };

        } else {

            state.playlist.title =
                cleanTitle;

            state.playlist.description =
                description.trim() ||
                null;

            state.playlist.visibility =
                cleanVisibility;

        }

        renderPlaylistInformation();

        toast(
            "Playlist modifiée."
        );

    } catch (error) {

        console.error(
            "NetView update playlist error:",
            error
        );

        toast(
            "Impossible de modifier la playlist.",
            "error"
        );

    } finally {

        setPageLoader(
            false
        );

    }

}


/* =========================================================
   DELETE PLAYLIST
   ========================================================= */

function openDeleteModal() {

    if (!state.isOwner) {
        requireLogin();
        return;
    }

    if (!dom.deleteModal) {
        return;
    }

    state.lastFocusedElement =
        document.activeElement;

    dom.deleteModal.hidden =
        false;

    dom.deleteModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


function closeDeleteModal() {

    if (!dom.deleteModal) {
        return;
    }

    dom.deleteModal.hidden =
        true;

    dom.deleteModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


async function confirmDeletePlaylist() {

    if (!state.isOwner) {
        requireLogin();
        return;
    }

    setPageLoader(
        true,
        "Suppression de la playlist..."
    );

    if (dom.confirmDelete) {
        dom.confirmDelete.disabled =
            true;
    }

    try {

        const result =
            await deletePlaylist(
                state.playlistId
            );

        if (
            result?.error
        ) {
            throw result.error;
        }

        closeDeleteModal();

        toast(
            "Playlist supprimée."
        );

        setTimeout(
            () => {

                window.location.href =
                    "library.html";

            },
            500
        );

    } catch (error) {

        console.error(
            "NetView delete playlist error:",
            error
        );

        toast(
            "Impossible de supprimer la playlist.",
            "error"
        );

    } finally {

        setPageLoader(
            false
        );

        if (dom.confirmDelete) {
            dom.confirmDelete.disabled =
                false;
        }

    }

}


/* =========================================================
   REMOVE VIDEO
   ========================================================= */

function openRemoveModal() {

    if (
        !state.isOwner ||
        !state.selectedVideoId
    ) {
        return;
    }

    if (dom.removeMessage) {

        const title =
            state.selectedVideoTitle ||
            "cette vidéo";

        dom.removeMessage.textContent =
            `« ${title} » sera retirée de cette playlist. La vidéo elle-même ne sera pas supprimée.`;

    }

    if (!dom.removeModal) {
        return;
    }

    dom.removeModal.hidden =
        false;

    dom.removeModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


function closeRemoveModal() {

    if (!dom.removeModal) {
        return;
    }

    dom.removeModal.hidden =
        true;

    dom.removeModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


async function confirmRemoveVideo() {

    if (
        !state.isOwner ||
        !state.selectedVideoId
    ) {
        return;
    }

    const videoId =
        state.selectedVideoId;

    setPageLoader(
        true,
        "Retrait de la vidéo..."
    );

    if (dom.confirmRemove) {
        dom.confirmRemove.disabled =
            true;
    }

    try {

        const result =
            await removeVideoFromPlaylist(
                state.playlistId,
                videoId
            );

        if (
            result?.error
        ) {
            throw result.error;
        }

        state.videos =
            state.videos.filter(
                item =>
                    item.video_id !==
                    videoId
            );

        state.videos.forEach(
            (
                item,
                index
            ) => {

                item.position =
                    index;

            }
        );

        closeRemoveModal();
        closeContextMenu();

        renderPlaylistInformation();
        renderVideos();

        toast(
            "Vidéo retirée de la playlist."
        );

    } catch (error) {

        console.error(
            "NetView remove playlist video error:",
            error
        );

        toast(
            "Impossible de retirer la vidéo.",
            "error"
        );

    } finally {

        setPageLoader(
            false
        );

        if (dom.confirmRemove) {
            dom.confirmRemove.disabled =
                false;
        }

    }

}


/* =========================================================
   LOGIN
   ========================================================= */

function requireLogin() {

    if (!dom.loginModal) {

        window.location.href =
            "auth.html";

        return;

    }

    state.lastFocusedElement =
        document.activeElement;

    dom.loginModal.hidden =
        false;

    dom.loginModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


function closeLoginModal() {

    if (!dom.loginModal) {
        return;
    }

    dom.loginModal.hidden =
        true;

    dom.loginModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   EDIT MODE
   ========================================================= */

function toggleEditMode() {

    if (!state.isOwner) {
        requireLogin();
        return;
    }

    state.isEditing =
        !state.isEditing;

    if (dom.manage) {

        dom.manage.innerHTML =
            state.isEditing
                ? `
                    <i class="fa-solid fa-check"></i>
                    Terminer
                  `
                : `
                    <i class="fa-solid fa-up-down-left-right"></i>
                    Réorganiser
                  `;

    }

    renderVideos();
    renderOwnerControls();

}


/* =========================================================
   SORT MENU
   ========================================================= */

function openSortMenu() {

    if (!dom.sortMenu) {
        return;
    }

    dom.sortMenu.hidden =
        false;

    if (dom.sortButton) {

        dom.sortButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }

}


function closeSortMenu() {

    if (!dom.sortMenu) {
        return;
    }

    dom.sortMenu.hidden =
        true;

    if (dom.sortButton) {

        dom.sortButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


function toggleSortMenu() {

    if (!dom.sortMenu) {
        return;
    }

    if (
        dom.sortMenu.hidden
    ) {

        openSortMenu();

    } else {

        closeSortMenu();

    }

}


function changeSort(
    sort
) {

    const valid =
        [
            "position",
            "newest",
            "oldest"
        ];

    if (
        !valid.includes(sort)
    ) {
        return;
    }

    state.currentSort =
        sort;

    closeSortMenu();

    renderVideos();

}


/* =========================================================
   MORE MENU
   ========================================================= */

function toggleMoreMenu() {

    if (!dom.moreMenu) {
        return;
    }

    const isHidden =
        dom.moreMenu.hidden;

    dom.moreMenu.hidden =
        !isHidden;

    if (dom.more) {

        dom.more.setAttribute(
            "aria-expanded",
            String(
                isHidden
            )
        );

    }

}


function closeMoreMenu() {

    if (dom.moreMenu) {
        dom.moreMenu.hidden =
            true;
    }

    if (dom.more) {

        dom.more.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


/* =========================================================
   LOAD PLAYLIST
   ========================================================= */

async function loadPlaylist() {

    if (!state.playlistId) {

        showError(
            "Playlist introuvable",
            "Aucune playlist n'a été indiquée dans l'URL."
        );

        return;

    }

    state.isLoading =
        true;

    showLoading();

    try {

        const playlist =
            await getPlaylist(
                state.playlistId
            );

        if (!playlist) {

            showError(
                "Playlist introuvable",
                "Cette playlist n'existe pas ou a été supprimée."
            );

            return;

        }

        state.playlist =
            playlist;

        state.videos =
            normalizeItems(
                playlist.playlist_items
            );

        calculateOwnership();


        /*
         * Une playlist privée appartient à l'utilisateur :
         * l'accès est autorisé si owner_id correspond.
         *
         * Les playlists publiques et non répertoriées
         * restent accessibles.
         */

        const visibility =
            playlist.visibility ||
            "public";

        if (
            visibility ===
                "private" &&
            !state.isOwner
        ) {

            showPrivate();

            return;

        }


        renderPlaylistInformation();
        renderOwnerControls();
        renderVideos();

        showContent();

    } catch (error) {

        console.error(
            "NetView get playlist error:",
            error
        );

        showError(
            "Impossible de charger la playlist",
            "Une erreur est survenue pendant le chargement. Réessayez."
        );

    } finally {

        state.isLoading =
            false;

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

function handleSearch(
    event
) {

    event.preventDefault();

    const query =
        dom.searchInput?.value
            ?.trim();

    if (!query) {
        return;
    }

    window.location.href =
        `search.html?q=${encodeURIComponent(
            query
        )}`;

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function handleKeyboard(
    event
) {

    if (
        event.key ===
        "Escape"
    ) {

        closeContextMenu();
        closeSortMenu();
        closeMoreMenu();
        closeShareModal();
        closeDeleteModal();
        closeRemoveModal();
        closeLoginModal();

        return;

    }

    if (
        event.key === "/" &&
        document.activeElement !==
            dom.searchInput
    ) {

        event.preventDefault();

        dom.searchInput?.focus();

        return;

    }

}


/* =========================================================
   GLOBAL CLICK
   ========================================================= */

function handleDocumentClick(
    event
) {

    if (
        dom.moreMenu &&
        !dom.moreMenu.hidden &&
        !event.target.closest(
            ".playlist-more-container"
        )
    ) {

        closeMoreMenu();

    }

    if (
        dom.sortMenu &&
        !dom.sortMenu.hidden &&
        !event.target.closest(
            "#playlistSortButton, #playlistSortMenu"
        )
    ) {

        closeSortMenu();

    }

    if (
        dom.contextMenu &&
        !dom.contextMenu.hidden &&
        !event.target.closest(
            "#playlistVideoContextMenu"
        )
    ) {

        closeContextMenu();

    }

}


/* =========================================================
   MODAL BACKDROP
   ========================================================= */

function handleModalBackdrop(
    event
) {

    if (
        event.target ===
        dom.shareModal
    ) {
        closeShareModal();
    }

    if (
        event.target ===
        dom.deleteModal
    ) {
        closeDeleteModal();
    }

    if (
        event.target ===
        dom.removeModal
    ) {
        closeRemoveModal();
    }

    if (
        event.target ===
        dom.loginModal
    ) {
        closeLoginModal();
    }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function bindEvents() {


    /* Retry */

    dom.retry?.addEventListener(
        "click",
        loadPlaylist
    );


    /* Play */

    dom.play?.addEventListener(
        "click",
        () =>
            playAll(false)
    );


    /* Shuffle */

    dom.shuffle?.addEventListener(
        "click",
        () =>
            playAll(true)
    );


    /* Share */

    dom.share?.addEventListener(
        "click",
        openShareModal
    );


    dom.closeShare?.addEventListener(
        "click",
        closeShareModal
    );


    dom.copyLink?.addEventListener(
        "click",
        async () => {

            closeMoreMenu();

            await copyPlaylistLink();

        }
    );


    dom.copyShare?.addEventListener(
        "click",
        async () => {

            await copyPlaylistLink();

        }
    );


    /* Native / copy share options */

    dom.shareOptions?.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-share]"
                );

            if (!button) {
                return;
            }

            const mode =
                button.dataset.share;

            if (
                mode ===
                "native"
            ) {

                await nativeShare();

            } else if (
                mode ===
                "copy"
            ) {

                await copyPlaylistLink();

            }

        }
    );


    /* Edit */

    dom.edit?.addEventListener(
        "click",
        () => {

            closeMoreMenu();

            editPlaylist();

        }
    );


    /* Delete */

    dom.delete?.addEventListener(
        "click",
        () => {

            closeMoreMenu();

            openDeleteModal();

        }
    );


    dom.cancelDelete?.addEventListener(
        "click",
        closeDeleteModal
    );


    dom.confirmDelete?.addEventListener(
        "click",
        confirmDeletePlaylist
    );


    /* Remove */

    dom.closeRemove?.addEventListener(
        "click",
        closeRemoveModal
    );


    dom.cancelRemove?.addEventListener(
        "click",
        closeRemoveModal
    );


    dom.confirmRemove?.addEventListener(
        "click",
        confirmRemoveVideo
    );


    /* Login */

    dom.closeLogin?.addEventListener(
        "click",
        closeLoginModal
    );


    /* More */

    dom.more?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleMoreMenu();

        }
    );


    /* Sort */

    dom.sortButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleSortMenu();

        }
    );


    dom.sortMenu?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-sort]"
                );

            if (!button) {
                return;
            }

            changeSort(
                button.dataset.sort
            );

        }
    );


    /* Manage */

    dom.manage?.addEventListener(
        "click",
        toggleEditMode
    );


    /* Context menu */

    dom.contextMenu?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );

            if (!button) {
                return;
            }

            const action =
                button.dataset.action;

            const videoId =
                state.selectedVideoId;

            if (
                action ===
                "play"
            ) {

                closeContextMenu();

                openVideo(
                    videoId
                );

            } else if (
                action ===
                "open"
            ) {

                closeContextMenu();

                openVideo(
                    videoId
                );

            } else if (
                action ===
                "remove"
            ) {

                closeContextMenu();

                openRemoveModal();

            }

        }
    );


    /* Search */

    dom.searchForm?.addEventListener(
        "submit",
        handleSearch
    );


    /* Document */

    document.addEventListener(
        "click",
        handleDocumentClick
    );


    document.addEventListener(
        "keydown",
        handleKeyboard
    );


    /* Modal backdrop */

    [
        dom.shareModal,
        dom.deleteModal,
        dom.removeModal,
        dom.loginModal
    ].forEach(
        modal => {

            modal?.addEventListener(
                "click",
                handleModalBackdrop
            );

        }
    );


    /* Share link input */

    dom.shareInput?.addEventListener(
        "focus",
        event => {
            event.target.select();
        }
    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

async function initializeNavigation() {

    try {

        if (
            typeof initNavigation ===
            "function"
        ) {

            await initNavigation();

        }

    } catch (error) {

        console.error(
            "NetView navigation initialization error:",
            error
        );

    }

}


/* =========================================================
   INITIALISATION PRINCIPALE
   ========================================================= */

async function initialize() {

    cacheDOM();

    bindEvents();

    state.playlistId =
        getPlaylistId();

    try {

        state.currentUser =
            await getCurrentUser();

    } catch (error) {

        console.error(
            "NetView current user error:",
            error
        );

        state.currentUser =
            null;

    }

    initializeNavigation();

    await loadPlaylist();

}


/* =========================================================
   PAGE LIFECYCLE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


/* =========================================================
   VISIBILITY REFRESH
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState !==
            "visible"
        ) {
            return;
        }

        if (
            !state.playlistId ||
            state.isLoading ||
            state.isEditing
        ) {
            return;
        }

        await loadPlaylist();

    }
);


/* =========================================================
   ONLINE / OFFLINE
   ========================================================= */

window.addEventListener(
    "online",
    () => {

        toast(
            "Connexion rétablie."
        );

        if (
            state.playlistId
        ) {
            loadPlaylist();
        }

    }
);


window.addEventListener(
    "offline",
    () => {

        toast(
            "Vous êtes hors connexion.",
            "error"
        );

    }
);
