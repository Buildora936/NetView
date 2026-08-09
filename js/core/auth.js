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

    options:{

        emailRedirectTo:

            window.location.origin +

            "/confirm-email.html"

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
// Session
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


// ==========================================
// Profile
// ==========================================

export async function createProfile({

    username,

    display_name,

    country,

    language = "fr"

}) {

    const user = await refreshUser();


    if(!user){

        throw new Error(
            "Utilisateur introuvable"
        );

    }


    // Création profil

    const { error: profileError } =

    await supabase

    .from("profiles")

    .insert({

        id:user.id,

        username,

        display_name,

        email:user.email,

        country,

        language

    });


    if(profileError){

        throw profileError;

    }


    // Création paramètres par défaut

    const { error: settingsError } =

    await supabase

    .from("user_settings")

    .insert({

        user_id:user.id

    });


    if(settingsError){

        throw settingsError;

    }


    // Création rôle utilisateur

    const { error: roleError } =

    await supabase

    .from("user_roles")

    .insert({

        user_id:user.id,

        role:"user"

    });


    if(roleError){

        throw roleError;

    }


    return true;

}

// ==========================================
// Roles
// ==========================================

export async function getRole(){

    const user = await refreshUser();


    if(!user){

        return null;

    }


    const { data, error } =

    await supabase

    .from("user_roles")

    .select("role")

    .eq(
        "user_id",
        user.id
    )

    .single();


    if(error){

        return "user";

    }


    return data.role;

}
export async function isUser() {

    return (await getRole()) === "user";

}


export async function isCreator() {

    return (await getRole()) === "creator";

}


export async function isPro() {

    return (await getRole()) === "pro";

}


// ==========================================
// Email Verification
// ==========================================

export async function resendVerification(email) {

    return await supabase.auth.resend({

        type: "signup",

        email

    });

}


// ==========================================
// Password
// ==========================================

export async function resetPassword(email) {

    return await supabase.auth.resetPasswordForEmail(email);

}


export async function updatePassword(password) {

    return await supabase.auth.updateUser({

        password

    });

}


// ==========================================
// User Update
// ==========================================

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
export async function refreshUser(){

    await supabase.auth.refreshSession();

    const { data, error } =
        await supabase.auth.getUser();

    if(error){

        throw error;

    }

    return data.user;

}

export async function updateRole(role){

    const user =
    await refreshUser();


    return await supabase

    .from("user_roles")

    .update({

        role

    })

    .eq(
        "user_id",
        user.id
    );

}
// ==========================================
// Profile
// ==========================================

export async function createProfile({
    username,
    display_name,
    country,
    language = "fr"
}) {
    const user = await refreshUser();

    if (!user) {
        throw new Error("Utilisateur introuvable");
    }

    // ==========================================
    // Vérifier si le profil existe déjà
    // ==========================================

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

    // ==========================================
    // Création du profil
    // ==========================================

    const { error: profileError } =
        await supabase
            .from("profiles")
            .insert({
                id: user.id,
                username,
                display_name,
                email: user.email,
                country,
                language
            });

    if (profileError) {
        throw profileError;
    }

    // ==========================================
    // Paramètres par défaut
    // ==========================================

    const { error: settingsError } =
        await supabase
            .from("user_settings")
            .insert({
                user_id: user.id
            });

    if (
        settingsError &&
        settingsError.code !== "23505"
    ) {
        throw settingsError;
    }

    // ==========================================
    // Rôle USER par défaut
    // ==========================================

    const { data: userRole } =
        await supabase
            .from("roles")
            .select("id")
            .eq("name", "user")
            .maybeSingle();

    if (!userRole) {
        throw new Error(
            "Le rôle 'user' n'existe pas dans la table roles."
        );
    }

    const { error: roleError } =
        await supabase
            .from("user_roles")
            .insert({
                user_id: user.id,
                role_id: userRole.id
            });

    if (
        roleError &&
        roleError.code !== "23505"
    ) {
        throw roleError;
    }

    return true;
}


// ==========================================
// Roles
// ==========================================

export async function getRole() {
    const user = await refreshUser();

    if (!user) {
        return null;
    }

    const { data, error } =
        await supabase
            .from("user_roles")
            .select(`
                role_id,
                roles (
                    id,
                    name,
                    description
                )
            `)
            .eq("user_id", user.id);

    if (error) {
        console.error(
            "Erreur récupération rôle :",
            error.message
        );

        return "user";
    }

    const roles = (data || [])
        .map(item => item.roles)
        .filter(Boolean);

    /*
     * Priorité :
     *
     * pro
     * creator
     * user
     */

    if (
        roles.some(role => role.name === "pro")
    ) {
        return "pro";
    }

    if (
        roles.some(role => role.name === "creator")
    ) {
        return "creator";
    }

    if (
        roles.some(role => role.name === "user")
    ) {
        return "user";
    }

    return "user";
}


export async function isUser() {
    return (await getRole()) === "user";
}


export async function isCreator() {
    return (await getRole()) === "creator";
}


export async function isPro() {
    return (await getRole()) === "pro";
}


// ==========================================
// Update Role
// ==========================================

export async function updateRole(role) {
    const user = await refreshUser();

    if (!user) {
        throw new Error("Utilisateur non connecté");
    }

    const allowedRoles = [
        "user",
        "creator",
        "pro"
    ];

    if (!allowedRoles.includes(role)) {
        throw new Error(
            `Rôle invalide : ${role}`
        );
    }

    // Récupération du rôle dans la table roles
    const { data: roleData, error: roleError } =
        await supabase
            .from("roles")
            .select("id, name")
            .eq("name", role)
            .maybeSingle();

    if (roleError) {
        throw roleError;
    }

    if (!roleData) {
        throw new Error(
            `Le rôle "${role}" n'existe pas dans la table roles.`
        );
    }

    /*
     * On récupère le rôle actuel.
     */

    const { data: currentRoles, error: currentError } =
        await supabase
            .from("user_roles")
            .select(`
                role_id,
                roles (
                    id,
                    name
                )
            `)
            .eq("user_id", user.id);

    if (currentError) {
        throw currentError;
    }

    /*
     * Pour NetView :
     *
     * USER     → rôle user
     * CREATOR  → rôle creator
     * PRO      → rôle pro
     *
     * On supprime les rôles existants
     * puis on attribue le nouveau rôle.
     */

    if (currentRoles && currentRoles.length > 0) {
        const { error: deleteError } =
            await supabase
                .from("user_roles")
                .delete()
                .eq("user_id", user.id);

        if (deleteError) {
            throw deleteError;
        }
    }

    return await supabase
        .from("user_roles")
        .insert({
            user_id: user.id,
            role_id: roleData.id
        });
}
