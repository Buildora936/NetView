// ==========================================
// NetView
// auth.js
// ==========================================

import { supabase } from "./supabase.js";

// ==========================================
// Authentication
// ==========================================

export async function signUp(email, password) {
    return await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin + "/confirm-email.html"
        }
    });
}

export async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({
        email,
        password
    });
}

export async function signOut() {
    return await supabase.auth.signOut();
}

// ==========================================
// Session & User
// ==========================================

export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

export async function getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
}

export async function isAuthenticated() {
    const session = await getSession();
    return session !== null;
}

export async function refreshUser() {
    await supabase.auth.refreshSession();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        throw error;
    }
    return data.user;
}

// ==========================================
// Profile
// ==========================================

export async function createProfile({
    username,
    display_name,
    country,
    language = "fr",
    account_type = "user"
}) {
    const user = await refreshUser();

    if (!user) {
        throw new Error("Utilisateur introuvable");
    }

    // Vérifier si le profil existe déjà
    const { data: existingProfile, error: existingError } =
        await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

    if (existingError) {
        throw existingError;
    }

    if (existingProfile) {
        return true;
    }

    // Création du profil avec account_type
    const { error: profileError } =
        await supabase
            .from("profiles")
            .insert({
                id: user.id,
                username,
                display_name,
                email: user.email,
                country,
                language,
                account_type: "user"
            });

    if (profileError) {
        throw profileError;
    }

    // Paramètres par défaut (si la table user_settings existe toujours)
    const { error: settingsError } =
        await supabase
            .from("user_settings")
            .insert({
                user_id: user.id
            });

    if (settingsError && settingsError.code !== "23505") {
        throw settingsError;
    }

    return true;
}

// ==========================================
// Account Type / Roles (Basé sur profiles)
// ==========================================

export async function getRole() {
    const user = await refreshUser();

    if (!user) {
        return null;
    }

    const { data, error } =
        await supabase
            .from("profiles")
            .select("account_type")
            .eq("id", user.id)
            .maybeSingle();

    if (error || !data) {
        return "user";
    }

    return data.account_type; // Renvoie 'user' ou 'pro'
}

export async function isUser() {
    return (await getRole()) === "user";
}

export async function isPro() {
    return (await getRole()) === "pro";
}

export async function updateRole(accountType) {
    const user = await refreshUser();

    if (!user) {
        throw new Error("Utilisateur non connecté");
    }

    const allowedTypes = ["user", "pro"];

    if (!allowedTypes.includes(accountType)) {
        throw new Error(`Type de compte invalide : ${accountType}`);
    }

    const { error } = await supabase
        .from("profiles")
        .update({ account_type: accountType, updated_at: new Date().toISOString() })
        .eq("id", user.id);

    if (error) {
        throw error;
    }

    return true;
}

// ==========================================
// Email & Password Management
// ==========================================

export async function resendVerification(email) {
    return await supabase.auth.resend({
        type: "signup",
        email
    });
}

export async function resetPassword(email) {
    return await supabase.auth.resetPasswordForEmail(email);
}

export async function updatePassword(password) {
    return await supabase.auth.updateUser({
        password
    });
}

export async function updateUser(data) {
    return await supabase.auth.updateUser(data);
}

// ==========================================
// Auth Listener
// ==========================================

export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange(
        (event, session) => {
            callback(event, session);
        }
    );
}
