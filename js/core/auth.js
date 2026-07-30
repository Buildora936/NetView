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
