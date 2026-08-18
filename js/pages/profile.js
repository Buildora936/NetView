// ==========================================
// NetView
// profile.js
// ==========================================

import { supabase } from "../core/supabase.js";
import {
    showLoader,
    hideLoader
} from "../core/ui.js";

import { initDeviceRevocationListener } from "../core/data.js";

initDeviceRevocationListener();
// ==========================================
// DOM Elements
// ==========================================

const profileForm = document.getElementById("profileForm");

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
// Notifications Helper
// ==========================================

function showNotification(message, isError = false) {
    if (!notification) return;
    notification.textContent = message;
    notification.style.borderColor = isError ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
    notification.style.color = isError ? "#ef4444" : "#22c55e";
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 3500);
}


// ==========================================
// Initialization & Load Profile Data
// ==========================================

async function initProfile() {
    showLoader();

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            window.location.replace("login.html");
            return;
        }

        currentUser = session.user;

        if (currentUser && currentUser.email && emailAddress) {
            emailAddress.textContent = currentUser.email;
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            console.error(profileError);
        }

        if (profile) {
            const isKycVerified = !!profile.verified; 
            if (verifiedBadge) {
                verifiedBadge.textContent = isKycVerified ? "Vérifié" : "Non vérifié";
                verifiedBadge.style.color = isKycVerified ? "#22c55e" : "#ef4444";
            }

            if (usernameInput) usernameInput.value = profile.username || "";
            if (displayNameInput) displayNameInput.value = profile.display_name || "";
            if (bioInput) {
                bioInput.value = profile.bio || "";
                if (bioCounter) bioCounter.textContent = (profile.bio || "").length;
            }
            if (languageSelect) languageSelect.value = profile.language || "fr";

            if (profile.country && countryInput) {
                countryInput.value = profile.country;
            } else if (countryInput) {
                const autoDetectedCountry = await detectUserCountry();
                countryInput.value = autoDetectedCountry || "France";
            }

            if (profile.avatar_url && avatarPreview) {
                avatarPreview.src = profile.avatar_url;
            }

            if (profile.banner_url && bannerImage) {
                bannerImage.src = profile.banner_url;
                bannerImage.style.display = "block";
            } else if (bannerImage) {
                bannerImage.style.display = "none";
            }

            if (profile.company_verified && companyVerifiedBadge) {
                companyVerifiedBadge.textContent = "Vérifiée";
                companyVerifiedBadge.style.color = "#22c55e";
            }
        } else {
            if (verifiedBadge) {
                verifiedBadge.textContent = "Non vérifié";
                verifiedBadge.style.color = "#ef4444";
            }

            if (countryInput) {
                const autoDetectedCountry = await detectUserCountry();
                countryInput.value = autoDetectedCountry || "France";
            }
        }

    } catch (error) {
        console.error(error);
        showNotification("Impossible de charger le profil.", true);
    } finally {
        hideLoader();
    }
}


// ==========================================
// Avatar & Banner Management
// ==========================================

if (avatarButton && avatarInput) {
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
        if (avatarPreview) avatarPreview.src = URL.createObjectURL(file);
    });
}

if (bannerButton && bannerInput) {
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
        if (bannerImage) {
            bannerImage.src = URL.createObjectURL(file);
            bannerImage.style.display = "block";
        }
    });
}


// ==========================================
// Bio Counter
// ==========================================

if (bioInput && bioCounter) {
    bioInput.addEventListener("input", () => {
        bioCounter.textContent = bioInput.value.length;
    });
}


// ==========================================
// Country Modal Management
// ==========================================

function renderCountries(filter = "") {
    if (!countryList) return;
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
            if (countryInput) countryInput.value = country;
            if (countryModal) countryModal.classList.remove("show");
        });
        countryList.appendChild(div);
    });
}

if (countryInput && countryModal) {
    countryInput.addEventListener("click", () => {
        renderCountries();
        countryModal.classList.add("show");
        if (countrySearch) {
            countrySearch.value = "";
            countrySearch.focus();
        }
    });
}

if (closeCountryModal && countryModal) {
    closeCountryModal.addEventListener("click", () => {
        countryModal.classList.remove("show");
    });
}

if (countrySearch) {
    countrySearch.addEventListener("input", (e) => {
        renderCountries(e.target.value);
    });
}

if (countryModal) {
    countryModal.addEventListener("click", (e) => {
        if (e.target === countryModal) {
            countryModal.classList.remove("show");
        }
    });
}


// ==========================================
// Storage Upload Helpers
// ==========================================

async function uploadFileToStorage(userId, file, bucketName) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${bucketName}_${Date.now()}.${fileExt}`;
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
// GeoIP Helper
// ==========================================

async function detectUserCountry() {
    try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.country_name || null;
    } catch (error) {
        console.warn("Impossible de détecter le pays par IP :", error);
        return null;
    }
}


// ==========================================
// Form Submission & Save Profile
// ==========================================

if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentUser) {
            showNotification("Utilisateur non authentifié.", true);
            return;
        }

        const usernameVal = usernameInput ? usernameInput.value.trim().toLowerCase() : "";
        const displayNameVal = displayNameInput ? displayNameInput.value.trim() : "";
        const bioVal = bioInput ? bioInput.value.trim() : "";
        const countryVal = countryInput ? countryInput.value.trim() : "";
        const languageVal = languageSelect ? languageSelect.value : "fr";

        if (usernameVal && usernameVal.length < 3) {
            if (usernameMessage) {
                usernameMessage.textContent = "Le nom d'utilisateur doit contenir au moins 3 caractères.";
                usernameMessage.style.color = "#ef4444";
            }
            if (usernameInput) usernameInput.focus();
            return;
        } else if (usernameMessage) {
            usernameMessage.textContent = "";
        }

        if (!displayNameVal) {
            if (displayNameMessage) {
                displayNameMessage.textContent = "Le nom complet est requis.";
                displayNameMessage.style.color = "#ef4444";
            }
            if (displayNameInput) displayNameInput.focus();
            return;
        } else if (displayNameMessage) {
            displayNameMessage.textContent = "";
        }

        try {
            showLoader();
            if (saveProfileButton) saveProfileButton.disabled = true;
            if (saveProfileText) saveProfileText.hidden = true;
            if (saveProfileLoader) saveProfileLoader.hidden = false;

            let avatarUrl = null;
            let bannerUrl = null;

            if (selectedAvatarFile) {
                avatarUrl = await uploadFileToStorage(currentUser.id, selectedAvatarFile, "avatars");
            }

            if (selectedBannerFile) {
                bannerUrl = await uploadFileToStorage(currentUser.id, selectedBannerFile, "banners");
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
                window.location.replace("settings.html");
            }, 1200);

        } catch (error) {
            console.error(error);
            showNotification(error.message || "Erreur lors de l'enregistrement du profil.", true);
        } finally {
            hideLoader();
            if (saveProfileButton) saveProfileButton.disabled = false;
            if (saveProfileText) saveProfileText.hidden = false;
            if (saveProfileLoader) saveProfileLoader.hidden = true;
        }
    });
}


// ==========================================
// Logout Action
// ==========================================

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            showLoader();
            await supabase.auth.signOut();
            window.location.replace("login.html");
        } catch (error) {
            console.error(error);
            showNotification("Erreur lors de la déconnexion.", true);
            hideLoader();
        }
    });
}


// ==========================================
// Run Initialization
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
    initProfile();
});

console.info("NetView Profile Ready.");
