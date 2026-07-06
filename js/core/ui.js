// ==========================================
// NetView
// ui.js
// ==========================================


// ==========================================
// Toast System
// ==========================================


export function showToast(
    message,
    type = "info",
    duration = 4000
){

    let container =
        document.querySelector(
            ".nv-toast-container"
        );


    if(!container){

        container =
            document.createElement(
                "div"
            );

        container.className =
            "nv-toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `nv-toast nv-toast-${type}`;


    toast.innerHTML = `

        <div class="nv-toast-icon">

            ${getToastIcon(type)}

        </div>


        <div class="nv-toast-content">

            <div class="nv-toast-message">

                ${message}

            </div>

        </div>


        <div class="nv-toast-close">

            ×

        </div>

    `;


    container.appendChild(
        toast
    );


    const close =
        toast.querySelector(
            ".nv-toast-close"
        );


    close.onclick = ()=>{

        removeToast(
            toast
        );

    };


    setTimeout(()=>{

        removeToast(
            toast
        );

    },duration);


    return toast;

}


// ==========================================
// Remove Toast
// ==========================================

function removeToast(toast){

    if(!toast) return;


    toast.classList.add(
        "hide"
    );


    setTimeout(()=>{

        toast.remove();

    },400);

}


// ==========================================
// Toast Icons
// ==========================================

function getToastIcon(type){


    const icons = {

        success:"✓",

        error:"✕",

        warning:"!",

        info:"i"

    };


    return icons[type] || icons.info;

}


// ==========================================
// Modal System
// ==========================================


export function openModal(id){

    const modal =
        document.getElementById(
            id
        );


    if(!modal) return;


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}



export function closeModal(id){

    const modal =
        document.getElementById(
            id
        );


    if(!modal) return;


    modal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}



export function closeAllModals(){

    document
    .querySelectorAll(
        ".nv-modal-overlay"
    )
    .forEach(modal=>{

        modal.classList.remove(
            "active"
        );

    });


    document.body.style.overflow =
        "";

}


// ==========================================
// Confirm Modal
// ==========================================


export function confirmAction(
    message,
    callback
){

    const result =
        window.confirm(
            message
        );


    if(result){

        callback();

    }

}


// ==========================================
// Loading
// ==========================================


export function showLoader(){

    let loader =
        document.querySelector(
            ".nv-page-loader"
        );


    if(loader){

        loader.style.display =
            "flex";

    }

}



export function hideLoader(){

    let loader =
        document.querySelector(
            ".nv-page-loader"
        );


    if(loader){

        loader.style.display =
            "none";

    }

}


// ==========================================
// Button Loading
// ==========================================


export function buttonLoading(
    button,
    state = true
){

    if(!button) return;


    if(state){

        button.dataset.text =
            button.innerHTML;


        button.innerHTML =
        `

        <span class="nv-spinner nv-spinner-sm"></span>

        `;


        button.disabled =
            true;

    }

    else{


        button.innerHTML =
            button.dataset.text;


        button.disabled =
            false;

    }

}


// ==========================================
// Error Handler
// ==========================================


export function showError(
    error
){

    console.error(
        error
    );


    showToast(
        error.message || "Une erreur est survenue",
        "error"
    );

}


// ==========================================
// Success Message
// ==========================================


export function showSuccess(
    message
){

    showToast(
        message,
        "success"
    );

}


// ==========================================
// Empty State
// ==========================================


export function showEmpty(
    container,
    message
){

    if(!container)
        return;


    container.innerHTML = `

        <div class="nv-empty">

            ${message}

        </div>

    `;

}


// ==========================================
// Copy Text
// ==========================================


export async function copyText(
    text
){

    await navigator.clipboard.writeText(
        text
    );


    showSuccess(
        "Copié"
    );

}


// ==========================================
// Initialize UI
// ==========================================


export function initUI(){


    document
    .querySelectorAll(
        "[data-modal-close]"
    )
    .forEach(button=>{


        button.onclick = ()=>{


            closeAllModals();


        };


    });


}
