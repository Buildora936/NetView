// ==========================================
// NetView
// profile.js
// ==========================================

import { supabase } from "../core/supabase.js";

// ==========================================
// DOM Elements
// ==========================================

const profileForm = document.getElementById("profileForm");
const globalLoader = document.getElementById("globalLoader");

// Avatar
const avatarPreview = document.getElementById("avatarPreview");
const avatarButton = document.getElementById("avatarButton");
const avatarInput = document.getElementById("avatarInput");

// Banner
const bannerImage = document.getElementById("bannerImage");
const bannerButton = document.getElementById("bannerButton");
const bannerInput = document.getElementById("bannerInput");

// Inputs
const usernameInput = document.getElementById("username");
const usernameMessage = document.getElementById("usernameMessage");
const displayNameInput = document.getElementById("displayName");
const displayNameMessage = document.getElementById("displayNameMessage");
const bioInput = document.getElementById("bio");
const bioCounter = document.getElementById("bioCounter");
const countryInput = document.getElementById("country");
const languageSelect = document.getElementById("language");

// Account Info
const emailAddress = document.getElementById("emailAddress");
const verifiedBadge = document.getElementById("verifiedBadge");
const companyVerifiedBadge = document.getElementById("companyVerifiedBadge");

// Buttons & Actions
const saveProfileButton = document.getElementById("saveProfileButton");
const saveProfileText = document.getElementById("saveProfileText");
const saveProfileLoader = document.getElementById("saveProfileLoader");
const logoutButton = document.getElementById("logoutButton");
const notification = document.getElementById("notification");

// Country Modal
const countryModal = document.getElementById("countryModal");
const closeCountryModal = document.getElementById("closeCountryModal");
const countrySearch = document.getElementById("countrySearch");
const countryList = document.getElementById("countryList");


// ==========================================
// State
// ==========================================

let currentUser = null;
let selectedAvatarFile = null;
let selectedBannerFile = null;

const countriesList = [
    "France", "Canada", "Belgique", "Suisse", "Haïti", 
    "États-Unis", "Royaume-Uni", "Allemagne", "Espagne", 
    "Italie", "Portugal", "Brésil", "Maroc", "Algérie", "Tunisie"
];


// ==========================================
// Notifications & Loader Helpers
// ==========================================

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.style.borderColor = isError ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
    notification.style.color = isError ? "#ef4444" : "#22c55e";
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 3500);
}

function showPageLoader(show) {
    if (show) {
        globalLoader.classList.add("show");
    } else {
        globalLoader.classList.remove("show");
    }
}


// ==========================================
// Initialization & Load Profile Data
// ==========================================

async function initProfile() {
    showPageLoader(true);

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            window.location.replace("login.html");
            return;
        }

        currentUser = session.user;

        if (currentUser && currentUser.email) {
            emailAddress.textContent = currentUser.email;
            const isConfirmed = !!currentUser.email_confirmed_at;
            verifiedBadge.textContent = isConfirmed ? "Vérifié" : "Non vérifié";
            verifiedBadge.style.color = isConfirmed ? "#22c55e" : "#ef4444";
        }

        // Fetch user profile from database table 'profiles'
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            console.error(profileError);
        }

        if (profile) {
            usernameInput.value = profile.username || "";
            displayNameInput.value = profile.display_name || "";
            bioInput.value = profile.bio || "";
            bioCounter.textContent = (profile.bio || "").length;
            countryInput.value = profile.country || "France";
            languageSelect.value = profile.language || "fr";

            if (profile.avatar_url) {
                avatarPreview.src = profile.avatar_url;
            }

            if (profile.banner_url) {
                bannerImage.src = profile.banner_url;
                bannerImage.style.display = "block";
            } else {
                bannerImage.style.display = "none";
            }

            if (profile.company_verified) {
                companyVerifiedBadge.textContent = "Vérifiée";
                companyVerifiedBadge.style.color = "#22c55e";
            }
        }

    } catch (error) {
        console.error(error);
        showNotification("Impossible de charger le profil.", true);
    } finally {
        showPageLoader(false);
    }
}


// ==========================================
// Avatar & Banner Management
// ==========================================

avatarButton.addEventListener("click", () => {
    avatarInput.click();
});

avatarInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showNotification("L'image ne doit pas dépasser 5 Mo.", true);
        return;
    }

    selectedAvatarFile = file;
    avatarPreview.src = URL.createObjectURL(file);
});

bannerButton.addEventListener("click", () => {
    bannerInput.click();
});

bannerInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
        showNotification("La bannière ne doit pas dépasser 8 Mo.", true);
        return;
    }

    selectedBannerFile = file;
    bannerImage.src = URL.createObjectURL(file);
    bannerImage.style.display = "block";
});


// ==========================================
// Bio Counter
// ==========================================

bioInput.addEventListener("input", () => {
    bioCounter.textContent = bioInput.value.length;
});


// ==========================================
// Country Modal Management
// ==========================================

function renderCountries(filter = "") {
    countryList.innerHTML = "";
    
    const filtered = countriesList.filter(c => c.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        countryList.innerHTML = `<div class="country-item" style="text-align:center; color:var(--nv-text-muted);">Aucun pays trouvé</div>`;
        return;
    }

    filtered.forEach(country => {
        const div = document.createElement("div");
        div.className = "country-item";
        div.textContent = country;
        div.addEventListener("click", () => {
            countryInput.value = country;
            countryModal.classList.remove("show");
        });
        countryList.appendChild(div);
    });
}

countryInput.addEventListener("click", () => {
    renderCountries();
    countryModal.classList.add("show");
    countrySearch.value = "";
    countrySearch.focus();
});

closeCountryModal.addEventListener("click", () => {
    countryModal.classList.remove("show");
});

countrySearch.addEventListener("input", (e) => {
    renderCountries(e.target.value);
});

countryModal.addEventListener("click", (e) => {
    if (e.target === countryModal) {
        countryModal.classList.remove("show");
    }
});

// ==========================================
// Storage Upload Helpers
// ==========================================

async function uploadFileToStorage(userId, file, bucketName) {
    const fileExt = file.name.split('.').pop();
    // Crée un chemin du type : userId/avatar-123456789.png ou userId/banner.png
    // Pour un nom fixe comme banner.png à chaque fois : `${userId}/banner.${fileExt}`
    const fileName = `banner_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    return data.publicUrl;
}


// ==========================================
// Form Submission & Save Profile
// ==========================================

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usernameVal = usernameInput.value.trim().toLowerCase();
    const displayNameVal = displayNameInput.value.trim();
    const bioVal = bioInput.value.trim();
    const countryVal = countryInput.value.trim();
    const languageVal = languageSelect.value;

    if (usernameVal && usernameVal.length < 3) {
        usernameMessage.textContent = "Le nom d'utilisateur doit contenir au moins 3 caractères.";
        usernameMessage.style.color = "#ef4444";
        usernameInput.focus();
        return;
    } else {
        usernameMessage.textContent = "";
    }

    if (!displayNameVal) {
        displayNameMessage.textContent = "Le nom complet est requis.";
        displayNameMessage.style.color = "#ef4444";
        displayNameInput.focus();
        return;
    } else {
        displayNameMessage.textContent = "";
    }

    saveProfileButton.disabled = true;
    saveProfileText.hidden = true;
    saveProfileLoader.hidden = false;
    showPageLoader(true);

    try {
        let avatarUrl = null;
        let bannerUrl = null;

        if (selectedAvatarFile) {
            avatarUrl = await uploadFileToStorage(currentUser.id, selectedAvatarFile, "avatars", "avatars");
        }

        if (selectedBannerFile) {
            bannerUrl = await uploadFileToStorage(currentUser.id, selectedBannerFile, "banners", "banners");
        }

        const updates = {
            id: currentUser.id,
            username: usernameVal || null,
            display_name: displayNameVal,
            bio: bioVal || null,
            country: countryVal || null,
            language: languageVal,
            updated_at: new Date().toISOString()
        };

        if (avatarUrl) updates.avatar_url = avatarUrl;
        if (bannerUrl) updates.banner_url = bannerUrl;

        const { error: upsertError } = await supabase
            .from("profiles")
            .upsert(updates);

        if (upsertError) throw upsertError;

        showNotification("Profil enregistré avec succès !");
        
        setTimeout(() => {
            window.location.replace("index.html");
        }, 1200);

    } catch (error) {
        console.error(error);
        showNotification(error.message || "Erreur lors de l'enregistrement du profil.", true);
        saveProfileButton.disabled = false;
        saveProfileText.hidden = false;
        saveProfileLoader.hidden = true;
    } finally {
        showPageLoader(false);
    }
});


// ==========================================
// Logout Action
// ==========================================

logoutButton.addEventListener("click", async () => {
    try {
        showPageLoader(true);
        await supabase.auth.signOut();
        window.location.replace("login.html");
    } catch (error) {
        console.error(error);
        showNotification("Erreur lors de la déconnexion.", true);
        showPageLoader(false);
    }
});


// ==========================================
// Run Initialization
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
    initProfile();
});

console.info("NetView Profile Ready.");
