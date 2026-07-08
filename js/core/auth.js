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
        password

    });

}

export async function refreshSession(){

    await supabase.auth.refreshSession();

    const { data } =
    await supabase.auth.getUser();

    return data.user;

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

export async function getProfile() {

    const user = await refreshSession();

    if (!user) return null;


    const { data, error } = await supabase

        .from("profiles")

        .select("*")

        .eq("id", user.id)

        .single();


    if (error) throw error;

    return data;

}


// ==========================================
// Roles
// ==========================================

export async function getRole() {

    const profile = await getProfile();

    if (!profile) return null;

    return profile.role;

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
