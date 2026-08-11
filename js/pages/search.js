// ==========================================
// NetView
// search.js
// Partie 1
// Imports + DOM + Variables globales
// ==========================================
// ==========================================
// Core Imports
// ==========================================
import {
    formatDate
} from "../core/utils.js";
import {
    getSession
} from "../core/auth.js";

import {
    searchVideos,
    searchShorts,
    searchChannels,
    searchLives,
    searchProducts
} from "../core/data.js";

import {
    showLoader,
    hideLoader,
    showToast
} from "../core/ui.js";

import {
    navigate
} from "../core/navigation.js";

// ==========================================
// DOM Elements
// ==========================================
// Header
const header =
document.querySelector(".nv-header");

const menuButton =
document.getElementById(
    "menuButton"
);

const searchForm =
document.getElementById(
    "searchForm"
);

const searchInput =
document.getElementById(
    "searchInput"
);

const searchButton =
document.querySelector(
    ".nv-search-button"
);

// Mobile Search
const mobileSearchForm =
document.getElementById(
    "mobileSearchForm"
);

const mobileSearchInput =
document.getElementById(
    "mobileSearchInput"
);

// Sidebar
const sidebar =
document.getElementById(
    "sidebar"
);

const sidebarOverlay =
document.getElementById(
    "sidebarOverlay"
);

// Header User
const headerRight =
document.querySelector(
    ".nv-header-right"
);

// Filters
const searchFilters =
document.querySelectorAll(
    ".nv-search-filter"
);

// Results
const searchResults =
document.getElementById(
    "searchResults"
);

const searchSkeleton =
document.getElementById(
    "searchSkeleton"
);

const searchEmpty =
document.getElementById(
    "searchEmpty"
);

const searchLoader =
document.getElementById(
    "searchLoader"
);

// Context Menu
const contextMenu =
document.getElementById(
    "contextMenu"
);

// Notification
const notification =
document.getElementById(
    "notification"
);

// ==========================================
// Variables Globales
// ==========================================

let currentUser = null;

let searchQuery = "";

let currentType = "all";

let searchResultsData = [];

let currentPage = 1;

let loading = false;

let hasMore = true;

let sidebarOpen = false;

let isMobile = false;

let searchTimeout = null;

let currentSearchController = null;

// ==========================================
// Responsive Search State
// ==========================================
const mobileBreakpoint = 768;
// ==========================================
// Initialisation
// ==========================================


async function init(){


    await checkSession();


    setupSearchBar();


    addEventListeners();


    loadInitialSearch();


}





// ==========================================
// Vérification session
// ==========================================


async function checkSession(){


    const session =
        await getSession();


    if(session){


        currentUser =
            session.user;


    }


}





// ==========================================
// Gestion des deux barres de recherche
// Desktop / Mobile
// ==========================================


function setupSearchBar(){


    updateSearchBarVisibility();



    window.addEventListener(
        "resize",
        updateSearchBarVisibility
    );


}





function updateSearchBarVisibility(){


    isMobile =
        window.innerWidth <= mobileBreakpoint;



    if(isMobile){


        if(searchForm){

            searchForm.style.display =
                "none";

        }


        if(mobileSearchForm){

            mobileSearchForm.style.display =
                "flex";

        }


    }

    else{


        if(searchForm){

            searchForm.style.display =
                "flex";

        }


        if(mobileSearchForm){

            mobileSearchForm.style.display =
                "none";

        }


    }


}

// ==========================================
// Recherche initiale
// ==========================================
function loadInitialSearch(){


    const params =
        new URLSearchParams(
            window.location.search
        );


    const query =
        params.get("q");


    if(query){


        searchQuery =
            query;


        searchInput.value =
            query;


        mobileSearchInput.value =
            query;


        executeSearch();


    }


}

// ==========================================
// Recherche principale
// ==========================================

async function executeSearch(){

    if(!searchQuery.trim()){


        clearResults();


        return;


    }


    if(loading) return;

    loading = true;

    currentPage = 1;

    hasMore = true;

    searchResultsData = [];

    showSearchLoading();

    try{
  let results = [];

        switch(currentType){

            case "videos":
                results =
                    await searchVideos(
                        searchQuery,
                        currentPage
                    );


            break;




            case "shorts":


                results =
                    await searchShorts(
                        searchQuery,
                        currentPage
                    );


            break;




            case "channels":


                results =
                    await searchChannels(
                        searchQuery,
                        currentPage
                    );


            break;




            case "lives":


                results =
                    await searchLives(
                        searchQuery,
                        currentPage
                    );


            break;




            case "products":


                results =
                    await searchProducts(
                        searchQuery,
                        currentPage
                    );


            break;




            default:


                results =
                await searchAll();



            break;


        }



        searchResultsData =
            results || [];



        hideSearchLoading();



        renderSearchResults();



    }

    catch(error){


        console.error(
            "Erreur recherche:",
            error
        );


        hideSearchLoading();



        showToast(
            "Erreur pendant la recherche",
            "error"
        );


    }


    finally{


        loading = false;


    }


}







// ==========================================
// Recherche globale
// ==========================================


async function searchAll(){


    const [

        videos,

        shorts,

        channels,

        lives,

        products


    ] = await Promise.all([



        searchVideos(
            searchQuery,
            currentPage
        ),



        searchShorts(
            searchQuery,
            currentPage
        ),



        searchChannels(
            searchQuery,
            currentPage
        ),



        searchLives(
            searchQuery,
            currentPage
        ),



        searchProducts(
            searchQuery,
            currentPage
        )


    ]);



    return {


        videos,

        shorts,

        channels,

        lives,

        products


    };


}






// ==========================================
// Chargement visuel
// ==========================================


function showSearchLoading(){


    if(searchSkeleton){

        searchSkeleton.hidden =
            false;

    }



    if(searchResults){

        searchResults.innerHTML =
            "";

    }



}

function hideSearchLoading(){


    if(searchSkeleton){

        searchSkeleton.hidden =
            true;
    }

}


// ==========================================
// Nettoyage résultats
// ==========================================
function clearResults(){

    searchResults.innerHTML =
        "";

    searchEmpty.hidden =
        false;

}
// ==========================================
// Filtres de recherche
// ==========================================


function changeFilter(type){


    currentType = type;



    currentPage = 1;



    hasMore = true;



    searchFilters.forEach(
        button => {


            button.classList.remove(
                "active"
            );


            if(
                button.dataset.type === type
            ){

                button.classList.add(
                    "active"
                );

            }


        }
    );



    executeSearch();


}
// ==========================================
// Gestion des événements
// ==========================================


function addEventListeners(){


    // ======================================
    // Recherche Header Desktop
    // ======================================

    if(searchForm){


        searchForm.addEventListener(
            "submit",
            event => {


                event.preventDefault();



                searchQuery =
                    searchInput.value.trim();



                updateUrl();



                executeSearch();



            }

        );


    }

    // ======================================
    // Recherche Mobile
    // ======================================


    if(mobileSearchForm){


        mobileSearchForm.addEventListener(
            "submit",
            event => {


                event.preventDefault();



                searchQuery =
                    mobileSearchInput
                    .value
                    .trim();



                searchInput.value =
                    searchQuery;



                updateUrl();



                executeSearch();



            }

        );


    }






    // ======================================
    // Recherche instantanée
    // ======================================


    if(searchInput){


        searchInput.addEventListener(
            "input",
            () => {


                autoSearch(
                    searchInput.value
                );


            }

        );


    }




    if(mobileSearchInput){


        mobileSearchInput.addEventListener(
            "input",
            () => {


                autoSearch(
                    mobileSearchInput.value
                );


            }

        );


    }





    // ======================================
    // Boutons filtres
    // ======================================


    searchFilters.forEach(
        button => {


            button.addEventListener(
                "click",
                () => {


                    changeFilter(
                        button.dataset.type
                    );


                }

            );


        }

    );






    // ======================================
    // Menu sidebar
    // ======================================


    if(menuButton){


        menuButton.addEventListener(
            "click",
            toggleSidebar
        );


    }



    if(sidebarOverlay){


        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );


    }





    // ======================================
    // Fermeture menu contextuel
    // ======================================


    document.addEventListener(
        "click",
        event => {


            if(
                contextMenu &&
                !contextMenu.contains(
                    event.target
                )
            ){


                contextMenu.classList.remove(
                    "active"
                );


            }


        }

    );





    // ======================================
    // Chargement infini
    // ======================================


    window.addEventListener(
        "scroll",
        handleInfiniteScroll
    );


}








// ==========================================
// Recherche automatique avec délai
// ==========================================


function autoSearch(value){


    clearTimeout(
        searchTimeout
    );



    searchTimeout =
        setTimeout(
            () => {


                searchQuery =
                    value.trim();



                if(
                    searchQuery.length >= 2
                ){


                    updateUrl();



                    executeSearch();


                }


            },
            500
        );


}







// ==========================================
// Mise à jour URL
// ==========================================


function updateUrl(){


    const url =
        new URL(
            window.location
        );



    if(searchQuery){


        url.searchParams.set(
            "q",
            searchQuery
        );


    }

    else{


        url.searchParams.delete(
            "q"
        );


    }



    window.history.pushState(
        {},
        "",
        url
    );


}







// ==========================================
// Sidebar
// ==========================================


function toggleSidebar(){


    sidebarOpen =
        !sidebarOpen;



    if(sidebarOpen){


        openSidebar();


    }

    else{


        closeSidebar();


    }


}






function openSidebar(){


    if(sidebar){


        sidebar.classList.add(
            "active"
        );


    }



    if(sidebarOverlay){


        sidebarOverlay.classList.add(
            "active"
        );


    }


}






function closeSidebar(){


    sidebarOpen =
        false;



    if(sidebar){


        sidebar.classList.remove(
            "active"
        );


    }



    if(sidebarOverlay){


        sidebarOverlay.classList.remove(
            "active"
        );


    }


}






// ==========================================
// Scroll infini
// ==========================================


function handleInfiniteScroll(){


    if(
        loading ||
        !hasMore
    ){

        return;

    }



    const scrollPosition =
        window.innerHeight +
        window.scrollY;



    const pageHeight =
        document.body.offsetHeight;



    if(
        scrollPosition >=
        pageHeight - 500
    ){


        loadMoreResults();


    }


}





async function loadMoreResults(){


    currentPage++;



    loading = true;



    try{


        const more =
            await executeSearch();



    }

    catch(error){


        console.error(error);


    }

    finally{


        loading = false;


    }


}
// ==========================================
// Rendu des résultats
// ==========================================


function renderSearchResults(){


    if(!searchResults){

        return;

    }



    searchResults.innerHTML = "";



    searchEmpty.hidden = true;



    if(
        !searchResultsData ||
        Object.keys(searchResultsData).length === 0 ||
        searchResultsData.length === 0
    ){

        searchEmpty.hidden = false;

        return;

    }





    switch(currentType){


        case "videos":


            renderVideos(
                searchResultsData
            );

        break;




        case "shorts":


            renderShorts(
                searchResultsData
            );

        break;




        case "channels":


            renderChannels(
                searchResultsData
            );

        break;




        case "lives":


            renderLives(
                searchResultsData
            );

        break;




        case "products":


            renderProducts(
                searchResultsData
            );

        break;




        default:


            renderAllResults(
                searchResultsData
            );


        break;


    }


}







// ==========================================
// Tout afficher
// ==========================================


function renderAllResults(data){



    if(data.videos?.length){


        createSectionTitle(
            "Vidéos"
        );


        renderVideos(
            data.videos
        );


    }



    if(data.shorts?.length){


        createSectionTitle(
            "Shorts"
        );


        renderShorts(
            data.shorts
        );


    }





    if(data.channels?.length){


        createSectionTitle(
            "Chaînes"
        );


        renderChannels(
            data.channels
        );


    }





    if(data.lives?.length){


        createSectionTitle(
            "Lives"
        );


        renderLives(
            data.lives
        );


    }





    if(data.products?.length){


        createSectionTitle(
            "Produits"
        );


        renderProducts(
            data.products
        );


    }


}








// ==========================================
// Titres des sections
// ==========================================


function createSectionTitle(title){


    const h2 =
        document.createElement(
            "h2"
        );


    h2.className =
        "nv-search-section-title";


    h2.textContent =
        title;



    searchResults.appendChild(
        h2
    );


}







// ==========================================
// Vidéos
// ==========================================


function renderVideos(videos){


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "nv-search-videos";



    videos.forEach(
        video => {


            container.innerHTML += `

<article class="nv-search-video-card">


<a class="nv-search-video-thumbnail">


<img
src="${video.thumbnail_url || ''}"
alt="${video.title || 'Vidéo'}">


<span class="nv-search-duration">

${video.duration || ""}

</span>


</a>



<div class="nv-search-video-info">


<h3 class="nv-search-video-title">

${video.title || "Sans titre"}

</h3>


<p class="nv-search-video-channel">

${video.channel_name || "NetView"}

</p>


<p class="nv-search-video-meta">

${video.views || 0} vues

•

${formatDate(video.created_at)}

</p>


</div>


</article>

`;



        }

    );



    searchResults.appendChild(
        container
    );


}








// ==========================================
// Shorts
// ==========================================


function renderShorts(shorts){


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "nv-search-shorts-grid";



    shorts.forEach(
        short => {


            container.innerHTML += `

<article class="nv-search-short-card">


<div class="nv-search-short-thumbnail">


<img
src="${short.thumbnail_url || ''}"
alt="Short">


</div>



<div class="nv-search-short-info">


<h3>

${short.title || "Short"}

</h3>


</div>


</article>

`;


        }

    );



    searchResults.appendChild(
        container
    );


}







// ==========================================
// Chaînes
// ==========================================


function renderChannels(channels){


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "nv-search-channels";



    channels.forEach(
        channel => {


            container.innerHTML += `

<article class="nv-search-channel-card">


<div class="nv-search-channel-avatar">


<img
src="${channel.avatar_url || 'images/default-avatar.png'}"
alt="Avatar">


</div>



<div>


<h3>

${channel.name || "Chaîne"}

</h3>


<p>

${channel.subscribers || 0}
abonnés

</p>


</div>


</article>

`;



        }

    );



    searchResults.appendChild(
        container
    );


}







// ==========================================
// Lives
// ==========================================


function renderLives(lives){


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "nv-search-live-scroll";



    lives.forEach(
        live => {


            container.innerHTML += `

<article class="nv-search-live-card">


<div class="nv-search-live-thumbnail">


<img
src="${live.thumbnail_url || ''}"
alt="Live">


<span class="nv-live-badge">

LIVE

</span>


</div>



<div class="nv-search-product-info">


<h3>

${live.title || "Live"}

</h3>


</div>


</article>

`;



        }

    );



    searchResults.appendChild(
        container
    );


}







// ==========================================
// Produits
// ==========================================


function renderProducts(products){


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "nv-search-products-grid";



    products.forEach(
        product => {


            container.innerHTML += `

<article class="nv-search-product-card">


<div class="nv-search-product-image">


<img
src="${product.image_url || ''}"
alt="${product.name || 'Produit'}">


</div>



<div class="nv-search-product-info">


<h3>

${product.name || "Produit"}

</h3>


<p>

${product.price || 0} $

</p>


</div>


</article>

`;



        }

    );



    searchResults.appendChild(
        container
    );


}
// ==========================================
// Pagination
// ==========================================


async function loadMoreResults(){


    if(
        loading ||
        !hasMore ||
        !searchQuery
    ){

        return;

    }



    loading = true;



    currentPage++;




    try{


        showInfiniteLoader();



        let results = [];



        switch(currentType){



            case "videos":


                results =
                    await searchVideos(
                        searchQuery,
                        currentPage
                    );

            break;




            case "shorts":


                results =
                    await searchShorts(
                        searchQuery,
                        currentPage
                    );

            break;




            case "channels":


                results =
                    await searchChannels(
                        searchQuery,
                        currentPage
                    );

            break;




            case "lives":


                results =
                    await searchLives(
                        searchQuery,
                        currentPage
                    );

            break;




            case "products":


                results =
                    await searchProducts(
                        searchQuery,
                        currentPage
                    );

            break;




            default:


                results =
                    await searchAll();


            break;


        }





        if(
            !results ||
            results.length === 0
        ){


            hasMore = false;


            return;


        }





        appendSearchResults(
            results
        );



    }

    catch(error){


        console.error(
            "Erreur pagination:",
            error
        );


        showToast(
            "Impossible de charger plus de résultats",
            "error"
        );


    }

    finally{


        hideInfiniteLoader();



        loading = false;


    }


}







// ==========================================
// Ajout résultats supplémentaires
// ==========================================


function appendSearchResults(data){



    if(currentType === "all"){


        renderAllResults(
            data
        );


        return;


    }



    switch(currentType){



        case "videos":


            renderVideos(
                data
            );

        break;



        case "shorts":


            renderShorts(
                data
            );

        break;



        case "channels":


            renderChannels(
                data
            );

        break;



        case "lives":


            renderLives(
                data
            );

        break;



        case "products":


            renderProducts(
                data
            );

        break;


    }


}







// ==========================================
// Loader pagination
// ==========================================


function showInfiniteLoader(){


    if(searchLoader){


        searchLoader.hidden =
            false;


    }


}





function hideInfiniteLoader(){


    if(searchLoader){


        searchLoader.hidden =
            true;


    }


}







// ==========================================
// Nettoyage recherche
// ==========================================


function clearSearch(){



    searchQuery = "";



    currentType = "all";



    currentPage = 1;



    hasMore = true;



    searchResultsData = [];



    if(searchInput){


        searchInput.value = "";


    }



    if(mobileSearchInput){


        mobileSearchInput.value = "";


    }




    if(searchResults){


        searchResults.innerHTML = "";


    }



}







// ==========================================
// Reset filtres
// ==========================================


function resetFilters(){


    searchFilters.forEach(
        button => {


            button.classList.remove(
                "active"
            );


        }

    );



    const defaultFilter =
        document.querySelector(
            '[data-type="all"]'
        );



    if(defaultFilter){


        defaultFilter.classList.add(
            "active"
        );


    }



    currentType = "all";


}








// ==========================================
// Fermeture propre des menus
// ==========================================


function closeContextMenu(){



    if(contextMenu){


        contextMenu.classList.remove(
            "active"
        );


    }


}







// ==========================================
// Suppression événements
// ==========================================


function removeEventListeners(){



    window.removeEventListener(
        "scroll",
        handleInfiniteScroll
    );



    window.removeEventListener(
        "resize",
        updateSearchBarVisibility
    );



    clearTimeout(
        searchTimeout
    );



}







// ==========================================
// Nettoyage complet page
// ==========================================

function cleanup(){


    removeEventListeners();

    closeContextMenu();

    clearSearch();

    if(currentSearchController){

        currentSearchController.abort();

        currentSearchController = null;

    }


}


// ==========================================
// Avant fermeture page
// ==========================================

window.addEventListener(
    "beforeunload",
    cleanup
);

// ==========================================
// Lancement
// ==========================================

init();
