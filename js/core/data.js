// ==========================================
// NetView
// data.js
// ==========================================

import { supabase } from "./supabase.js";

// ==========================================
// Generic Database Functions
// ==========================================

export async function select(
    table,
    columns = "*",
    filters = null
) {

    let query = supabase
        .from(table)
        .select(columns);

    if (filters) {

        for (const filter of filters) {

            query = query[filter.method](
                filter.column,
                filter.value
            );

        }

    }

    return await query;

}

export async function insert(
    table,
    values
) {

    return await supabase
        .from(table)
        .insert(values);

}

export async function update(
    table,
    values,
    filters
) {

    let query = supabase
        .from(table)
        .update(values);

    for (const filter of filters) {

        query = query[filter.method](
            filter.column,
            filter.value
        );

    }

    return await query;

}

export async function remove(
    table,
    filters
) {

    let query = supabase
        .from(table)
        .delete();

    for (const filter of filters) {

        query = query[filter.method](
            filter.column,
            filter.value
        );

    }

    return await query;

}

// ==========================================
// Storage
// ==========================================

export async function uploadFile(
    bucket,
    path,
    file,
    options = {}
) {

    return await supabase
        .storage
        .from(bucket)
        .upload(path, file, options);

}

export async function downloadFile(
    bucket,
    path
) {

    return await supabase
        .storage
        .from(bucket)
        .download(path);

}

export function getPublicUrl(
    bucket,
    path
) {

    return supabase
        .storage
        .from(bucket)
        .getPublicUrl(path);

}

export async function deleteFile(
    bucket,
    path
) {

    return await supabase
        .storage
        .from(bucket)
        .remove([path]);

}

// ==========================================
// Realtime
// ==========================================

export function subscribe(
    channelName,
    table,
    callback
) {

    return supabase
        .channel(channelName)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table
            },
            callback
        )
        .subscribe();

}

export async function unsubscribe(
    channel
) {

    return await supabase.removeChannel(channel);

}

// ==========================================
// RPC
// ==========================================

export async function rpc(
    functionName,
    params = {}
) {

    return await supabase.rpc(
        functionName,
        params
    );

}

// ==========================================
// Devices
// ==========================================

export async function getDevices(){
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", user.id)
        .order("last_seen", { ascending: false });

    return data || [];
}

export async function deleteDevice(
    deviceId
){
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: "Non connecté" };

    return await supabase
        .from("devices")
        .delete()
        .eq("id", deviceId)
        .eq("user_id", user.id);
}

export async function deleteOtherDevices(
    currentDeviceId
){
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: "Non connecté" };

    return await supabase
        .from("devices")
        .delete()
        .neq("id", currentDeviceId)
        .eq("user_id", user.id);
}

// ==========================================
// Profile & Roles
// ==========================================

export async function getProfile(){
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    // 1. Récupération du profil principal
    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.error("Erreur chargement profil:", profileError.message);
        return null;
    }

    // 2. Récupération du rôle associé via user_roles et roles
    const { data: userRoleData } = await supabase
        .from("user_roles")
        .select(`
            roles (
                name
            )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

    let roleName = "Utilisateur";
    if (userRoleData && userRoleData.roles) {
        // Gérer si roles est un tableau ou un objet unique selon la configuration Supabase
        roleName = Array.isArray(userRoleData.roles) 
            ? (userRoleData.roles[0]?.name || "Utilisateur") 
            : (userRoleData.roles.name || "Utilisateur");
    }

    // On retourne l'ensemble fusionné avec le champ 'role'
    return {
        ...profileData,
        role: roleName
    };
}

export async function updateProfile(
    values
){
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: "Non connecté" };

    return await supabase
        .from("profiles")
        .update(values)
        .eq("id", user.id);
}

// ==========================================
// User Settings
// ==========================================

export async function getUserSettings(){
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    return data;
}

export async function updateUserSettings(
    values
){
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: "Non connecté" };

    return await supabase
        .from("user_settings")
        .update(values)
        .eq("user_id", user.id);
}
