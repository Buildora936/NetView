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

/**
 * Écoute en temps réel si l'appareil actuel est supprimé pour le déconnecter instantanément
 */
export function initDeviceRevocationListener() {
    const currentDeviceId = localStorage.getItem("netview_current_device_id");
    if (!currentDeviceId) return;

    supabase
        .channel('netview-device-revocation')
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'devices',
                filter: `id=eq.${currentDeviceId}`
            },
            async () => {
                // Nettoyage local et déconnexion
                localStorage.removeItem("netview_current_device_id");
                await supabase.auth.signOut();

                alert("Votre session a été révoquée à distance depuis un autre appareil.");
                window.location.href = "login.html";
            }
        )
        .subscribe();
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

export async function getDevices() {
    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", user.id)
        .order("last_seen", { ascending: false });

    if (error) {
        console.error("Erreur récupération appareils :", error);
        return [];
    }

    return data || [];
}


export async function deleteDevice(deviceId) {
    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {
        return {
            data: null,
            error: new Error("Non connecté")
        };
    }

    return await supabase
        .from("devices")
        .delete()
        .eq("id", deviceId)
        .eq("user_id", user.id);
}


export async function deleteOtherDevices(currentDeviceId) {
    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {
        return {
            data: null,
            error: new Error("Non connecté")
        };
    }

    return await supabase
        .from("devices")
        .delete()
        .eq("user_id", user.id)
        .neq("id", currentDeviceId);
}


// ==========================================
// Profile & Roles
// ==========================================

export async function getProfile() {
    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data: profileData, error: profileError } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

    if (profileError) {
        console.error(
            "Erreur chargement profil :",
            profileError.message
        );

        return null;
    }

    /*
     * Le schéma utilise :
     *
     * user_roles.user_id
     * user_roles.role_id
     * roles.id
     * roles.name
     *
     * et NON user_roles.role.
     */

    const { data: roleData, error: roleError } =
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

    if (roleError) {
        console.error(
            "Erreur chargement rôle :",
            roleError.message
        );
    }

    const roles = (roleData || [])
        .map(item => item.roles)
        .filter(Boolean);

    const roleNames = roles.map(role => role.name);

    let role = "user";

    if (roleNames.includes("pro")) {
        role = "pro";
    } else if (roleNames.includes("creator")) {
        role = "creator";
    } else if (roleNames.includes("user")) {
        role = "user";
    } else if (roleNames.length > 0) {
        role = roleNames[0];
    }

    return {
        ...profileData,

        role,

        roles,

        roleNames
    };
}


export async function updateProfile(values) {
    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {
        return {
            data: null,
            error: new Error("Non connecté")
        };
    }

    return await supabase
        .from("profiles")
        .update(values)
        .eq("id", user.id)
        .select()
        .single();
}


// ==========================================
// User Settings
// ==========================================

export async function getUserSettings() {
    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Erreur récupération paramètres :",
            error.message
        );

        return null;
    }

    return data;
}


export async function updateUserSettings(values) {
    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {
        return {
            data: null,
            error: new Error("Non connecté")
        };
    }

    return await supabase
        .from("user_settings")
        .update(values)
        .eq("user_id", user.id)
        .select()
        .single();
}


// ==========================================
// Videos
// ==========================================

export async function getVideos({
    page = 1,
    search = null
} = {}) {

    const limit = 12;
    const from = Math.max(0, (page - 1) * limit);
    const to = from + limit - 1;

    let query = supabase
        .from("videos")
        .select(`
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            ),
            video_categories (
                id,
                name
            )
        `)
        .eq("status", "published")
        .eq("visibility", "public");

    // Recherche textuelle optionnelle
    if (search && search.trim()) {
        const searchValue = search.trim();
        query = query.or(
            `title.ilike.%${searchValue}%,description.ilike.%${searchValue}%`
        );
    }

    query = query
        .order("published_at", {
            ascending: false,
            nullsFirst: false
        })
        .order("created_at", {
            ascending: false
        })
        .range(from, to);

    const { data, error } = await query;

    if (error) {
        console.error("Erreur Supabase getVideos :", error);
        return [];
    }

    return (data || []).map(video => ({
        ...video,
        channelName: video.channels?.name || "Chaîne inconnue",
        channelHandle: video.channels?.handle || null,
        channelAvatar: video.channels?.avatar_url || "images/default-avatar.png",
        channelVerified: video.channels?.verified || false,
        subscribersCount: video.channels?.subscribers_count || 0,
        categoryName: video.video_categories?.name || null
    }));
}
// ==========================================
// Shorts
// ==========================================

export async function getShorts(options = {}) {
    let query = supabase
        .from("shorts")
        .select(`
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            )
        `)
        .order("published_at", {
            ascending: false,
            nullsFirst: false
        })
        .order("created_at", {
            ascending: false
        });

    if (options.category && options.category !== "Tous") {
        query = query.eq(
            "category",
            options.category
        );
    }

    const { data, error } = await query;

    if (error) {
        console.error(
            "Erreur récupération Shorts :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Lives
// ==========================================

export async function getLives() {
    const { data, error } = await supabase
        .from("lives")
        .select(`
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            )
        `)
        .eq("status", "live")
        .eq("visibility", "public")
        .order("started_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Erreur récupération lives :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Sponsored Products
// ==========================================

export async function getSponsoredProducts() {
    const { data, error } = await supabase
        .from("products")
        .select(`
            *,
            stores (
                id,
                name,
                slug,
                logo_path,
                owner_id
            )
        `)
        .eq("is_sponsored", "TRUE")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Erreur récupération produits sponsorisés :",
            error
        );

        throw error;
    }

    return data || [];
}
// ==========================================
// Search
// ==========================================

const SEARCH_LIMIT = 20;


// ==========================================
// Search Videos
// ==========================================

export async function searchVideos(
    query,
    page = 1
) {
    const search = String(query || "").trim();

    if (!search) {
        return [];
    }

    const from = (page - 1) * SEARCH_LIMIT;
    const to = from + SEARCH_LIMIT - 1;

    const { data, error } = await supabase
        .from("videos")
        .select(`
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            ),
            video_categories (
                id,
                name
            )
        `)
        .or(
            `title.ilike.%${search}%,description.ilike.%${search}%`
        )
        .eq("status", "published")
        .eq("visibility", "public")
        .order("published_at", {
            ascending: false,
            nullsFirst: false
        })
        .range(from, to);

    if (error) {
        console.error(
            "Erreur recherche vidéos :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Search Shorts
// ==========================================

export async function searchShorts(
    query,
    page = 1
) {
    const search = String(query || "").trim();

    if (!search) {
        return [];
    }

    const from = (page - 1) * SEARCH_LIMIT;
    const to = from + SEARCH_LIMIT - 1;

    const { data, error } = await supabase
        .from("shorts")
        .select(`
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            )
        `)
        .or(
            `title.ilike.%${search}%,description.ilike.%${search}%`
        )
        .order("published_at", {
            ascending: false,
            nullsFirst: false
        })
        .range(from, to);

    if (error) {
        console.error(
            "Erreur recherche Shorts :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Search Channels
// ==========================================

export async function searchChannels(
    query,
    page = 1
) {
    const search = String(query || "").trim();

    if (!search) {
        return [];
    }

    const from = (page - 1) * SEARCH_LIMIT;
    const to = from + SEARCH_LIMIT - 1;

    const { data, error } = await supabase
        .from("channels")
        .select(`
            *,
            profiles:owner_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)
        .or(
            `name.ilike.%${search}%,description.ilike.%${search}%,handle.ilike.%${search}%`
        )
        .order("subscribers_count", {
            ascending: false
        })
        .range(from, to);

    if (error) {
        console.error(
            "Erreur recherche chaînes :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Search Lives
// ==========================================

export async function searchLives(
    query,
    page = 1
) {
    const search = String(query || "").trim();

    if (!search) {
        return [];
    }

    const from = (page - 1) * SEARCH_LIMIT;
    const to = from + SEARCH_LIMIT - 1;

    const { data, error } = await supabase
        .from("lives")
        .select(`
            *,
            channels (
                id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            )
        `)
        .or(
            `title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`
        )
        .eq("status", "live")
        .eq("visibility", "public")
        .order("started_at", {
            ascending: false
        })
        .range(from, to);

    if (error) {
        console.error(
            "Erreur recherche lives :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Search Products
// ==========================================

export async function searchProducts(
    query,
    page = 1
) {
    const search = String(query || "").trim();

    if (!search) {
        return [];
    }

    const from = (page - 1) * SEARCH_LIMIT;
    const to = from + SEARCH_LIMIT - 1;

    const { data, error } = await supabase
        .from("products")
        .select(`
            *,
            stores (
                id,
                name,
                slug,
                logo_path,
                owner_id
            ),
            product_categories (
                id,
                name,
                icon
            )
        `)
        .or(
            `title.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`
        )
        .eq("status", "published")
        .order("created_at", {
            ascending: false
        })
        .range(from, to);

    if (error) {
        console.error(
            "Erreur recherche produits :",
            error
        );

        throw error;
    }

    return data || [];
}
