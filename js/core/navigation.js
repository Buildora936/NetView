// ==========================================
// NetView
// navigation.js
// ==========================================


// ==========================================
// Imports
// ==========================================

import {
    getSession,
    getRole
} from "./auth.js";


// ==========================================
// Current Page
// ==========================================

export function getCurrentPage(){

    const path = window.location.pathname;

    const page = path
        .split("/")
        .pop()
        .replace(".html","");

    return page || "index";

}


// ==========================================
// Navigate
// ==========================================

export function navigate(url){

    window.location.href = url;

}


// ==========================================
// Open New Tab
// ==========================================

export function openPage(url){

    window.open(
        url,
        "_blank"
    );

}


// ==========================================
// Back
// ==========================================

export function goBack(){

    window.history.back();

}


// ==========================================
// Refresh Page
// ==========================================

export function reload(){

    window.location.reload();

}


// ==========================================
// Active Navigation Item
// ==========================================

export function setActiveNav(){

    const current =
        getCurrentPage();


    const links =
        document.querySelectorAll(
            "[data-nav]"
        );


    links.forEach(link=>{


        const target =
            link.dataset.nav;


        if(target === current){

            link.classList.add(
                "active"
            );

        }

        else{

            link.classList.remove(
                "active"
            );

        }


    });


}


// ==========================================
// Require Authentication
// ==========================================

export async function requireAuth(
    redirect = "auth.html"
){

    const session =
        await getSession();


    if(!session){

        navigate(
            redirect
        );

        return false;

    }


    return true;

}


// ==========================================
// Redirect Authenticated Users
// ==========================================

export async function redirectIfLogged(){

    const session =
        await getSession();


    if(session){

        navigate(
            "index.html"
        );

        return true;

    }


    return false;

}


// ==========================================
// Role Access
// ==========================================

export async function requireRole(
    roles = [],
    redirect = "index.html"
){


    const role =
        await getRole();


    if(!role){

        navigate(
            redirect
        );

        return false;

    }


    if(
        !roles.includes(role)
    ){

        navigate(
            redirect
        );

        return false;

    }


    return true;

}


// ==========================================
// Creator Access
// ==========================================

export async function requireCreator(){

    return await requireRole(
        [
            "creator",
            "pro"
        ],
        "index.html"
    );

}


// ==========================================
// Pro Access
// ==========================================

export async function requirePro(){

    return await requireRole(
        [
            "pro"
        ],
        "index.html"
    );

}


// ==========================================
// Initialize Navigation
// ==========================================

export function initNavigation(){

    setActiveNav();


    const links =
        document.querySelectorAll(
            "[data-link]"
        );


    links.forEach(link=>{


        link.addEventListener(
            "click",
            ()=>{

                const url =
                    link.dataset.link;


                if(url){

                    navigate(url);

                }


            }
        );


    });


}


// ==========================================
// Mobile Sidebar Toggle
// ==========================================

export function toggleSidebar(){

    const sidebar =
        document.querySelector(
            ".nv-sidebar"
        );


    if(!sidebar) return;


    sidebar.classList.toggle(
        "open"
    );


}


// ==========================================
// Close Sidebar
// ==========================================

export function closeSidebar(){

    const sidebar =
        document.querySelector(
            ".nv-sidebar"
        );


    if(!sidebar) return;


    sidebar.classList.remove(
        "open"
    );


}
