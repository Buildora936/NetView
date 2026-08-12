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
// Device Revocation Realtime
// ==========================================

export function initDeviceRevocationListener() {

    const currentDeviceId =
        localStorage.getItem(
            "netview_current_device_id"
        );

    if (!currentDeviceId) {
        return;
    }

    return supabase
        .channel("netview-device-revocation")
        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "devices",
                filter: `id=eq.${currentDeviceId}`
            },
            async () => {

                localStorage.removeItem(
                    "netview_current_device_id"
                );

                await supabase.auth.signOut();

                alert(
                    "Votre session a été révoquée à distance depuis un autre appareil."
                );

                window.location.href =
                    "login.html";
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

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const {
        data,
        error
    } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", user.id)
        .order(
            "last_seen",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "Erreur récupération appareils :",
            error
        );

        return [];
    }

    return data || [];
}


export async function deleteDevice(
    deviceId
) {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

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


export async function deleteOtherDevices(
    currentDeviceId
) {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

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
// Profile
// ==========================================

export async function getProfile() {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {

        console.error(
            "Erreur chargement profil :",
            error.message
        );

        return null;
    }

    if (!data) {
        return null;
    }

    return {
        ...data,
        role: data.account_type || "user",
        accountType: data.account_type || "user"
    };
}


// ==========================================
// Profile By ID
// ==========================================

export async function getProfileById(
    userId
) {

    if (!userId) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (error) {

        console.error(
            "Erreur récupération profil :",
            error
        );

        return null;
    }

    return data || null;
}


// ==========================================
// Update Profile
// ==========================================

export async function updateProfile(
    values
) {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

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

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
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


export async function updateUserSettings(
    values
) {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

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

    const from =
        Math.max(
            0,
            (page - 1) * limit
        );

    const to =
        from + limit - 1;

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

    if (
        search &&
        search.trim()
    ) {

        const searchValue =
            search.trim();

        query = query.or(
            `title.ilike.%${searchValue}%,description.ilike.%${searchValue}%`
        );
    }

    query = query
        .order(
            "published_at",
            {
                ascending: false,
                nullsFirst: false
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .range(
            from,
            to
        );

    const {
        data,
        error
    } = await query;

    if (error) {

        console.error(
            "Erreur Supabase getVideos :",
            error
        );

        return [];
    }

    return (data || []).map(
        video => ({
            ...video,

            channelName:
                video.channels?.name ||
                "Chaîne inconnue",

            channelHandle:
                video.channels?.handle ||
                null,

            channelAvatar:
                video.channels?.avatar_url ||
                "images/default-avatar.png",

            channelVerified:
                video.channels?.verified ||
                false,

            subscribersCount:
                video.channels?.subscribers_count ||
                0,

            categoryName:
                video.video_categories?.name ||
                null
        })
    );
}


// ==========================================
// Shorts
// ==========================================

export async function getShorts(
    options = {}
) {

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
        .order(
            "published_at",
            {
                ascending: false,
                nullsFirst: false
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (
        options.category &&
        options.category !== "Tous"
    ) {

        query = query.eq(
            "category",
            options.category
        );
    }

    const {
        data,
        error
    } = await query;

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

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "status",
            "live"
        )
        .eq(
            "visibility",
            "public"
        )
        .order(
            "started_at",
            {
                ascending: false
            }
        );

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

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "is_sponsored",
            true
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

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

export const SEARCH_LIMIT = 20;


// ==========================================
// Search Videos
// ==========================================

export async function searchVideos(
    query,
    page = 1
) {

    const search =
        String(query || "").trim();

    if (!search) {
        return [];
    }

    const from =
        (page - 1) *
        SEARCH_LIMIT;

    const to =
        from +
        SEARCH_LIMIT -
        1;

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "status",
            "published"
        )
        .eq(
            "visibility",
            "public"
        )
        .order(
            "published_at",
            {
                ascending: false,
                nullsFirst: false
            }
        )
        .range(
            from,
            to
        );

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

    const search =
        String(query || "").trim();

    if (!search) {
        return [];
    }

    const from =
        (page - 1) *
        SEARCH_LIMIT;

    const to =
        from +
        SEARCH_LIMIT -
        1;

    const {
        data,
        error
    } = await supabase
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
        .order(
            "published_at",
            {
                ascending: false,
                nullsFirst: false
            }
        )
        .range(
            from,
            to
        );

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

    const search =
        String(query || "").trim();

    if (!search) {
        return [];
    }

    const from =
        (page - 1) *
        SEARCH_LIMIT;

    const to =
        from +
        SEARCH_LIMIT -
        1;

    const {
        data,
        error
    } = await supabase
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
        .order(
            "subscribers_count",
            {
                ascending: false
            }
        )
        .range(
            from,
            to
        );

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

    const search =
        String(query || "").trim();

    if (!search) {
        return [];
    }

    const from =
        (page - 1) *
        SEARCH_LIMIT;

    const to =
        from +
        SEARCH_LIMIT -
        1;

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "status",
            "live"
        )
        .eq(
            "visibility",
            "public"
        )
        .order(
            "started_at",
            {
                ascending: false
            }
        )
        .range(
            from,
            to
        );

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

    const search =
        String(query || "").trim();

    if (!search) {
        return [];
    }

    const from =
        (page - 1) *
        SEARCH_LIMIT;

    const to =
        from +
        SEARCH_LIMIT -
        1;

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "status",
            "published"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .range(
            from,
            to
        );

    if (error) {

        console.error(
            "Erreur recherche produits :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Video Categories
// ==========================================

export async function getVideoCategories() {

    const {
        data,
        error
    } = await supabase
        .from("video_categories")
        .select("*")
        .order(
            "name",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "Erreur récupération catégories :",
            error
        );

        return [];
    }

    return data || [];
}


// ==========================================
// Trending Videos
// ==========================================

export async function getTrendingVideos({
    limit = 12
} = {}) {

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "status",
            "published"
        )
        .eq(
            "visibility",
            "public"
        )
        .order(
            "views",
            {
                ascending: false
            }
        )
        .order(
            "likes",
            {
                ascending: false
            }
        )
        .order(
            "published_at",
            {
                ascending: false,
                nullsFirst: false
            }
        )
        .limit(limit);

    if (error) {

        console.error(
            "Erreur récupération vidéos tendance :",
            error
        );

        throw error;
    }

    return (data || []).map(
        video => ({
            ...video,

            channelName:
                video.channels?.name ||
                "Chaîne inconnue",

            channelHandle:
                video.channels?.handle ||
                null,

            channelAvatar:
                video.channels?.avatar_url ||
                "images/default-avatar.png",

            channelVerified:
                video.channels?.verified ||
                false,

            subscribersCount:
                video.channels?.subscribers_count ||
                0,

            categoryName:
                video.video_categories?.name ||
                null
        })
    );
}


// ==========================================
// Trending Shorts
// ==========================================

export async function getTrendingShorts({
    limit = 12
} = {}) {

    const {
        data,
        error
    } = await supabase
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
        .order(
            "views",
            {
                ascending: false
            }
        )
        .order(
            "likes",
            {
                ascending: false
            }
        )
        .order(
            "published_at",
            {
                ascending: false,
                nullsFirst: false
            }
        )
        .limit(limit);

    if (error) {

        console.error(
            "Erreur récupération Shorts tendance :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Trending Products
// ==========================================

export async function getTrendingProducts({
    limit = 12
} = {}) {

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "status",
            "published"
        )
        .order(
            "sales",
            {
                ascending: false
            }
        )
        .order(
            "rating",
            {
                ascending: false
            }
        )
        .order(
            "favorites",
            {
                ascending: false
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(limit);

    if (error) {

        console.error(
            "Erreur récupération produits tendance :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Trending Lives
// ==========================================

export async function getTrendingLives({
    limit = 12
} = {}) {

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "status",
            "live"
        )
        .eq(
            "visibility",
            "public"
        )
        .order(
            "current_viewers",
            {
                ascending: false
            }
        )
        .order(
            "peak_viewers",
            {
                ascending: false
            }
        )
        .order(
            "total_views",
            {
                ascending: false
            }
        )
        .limit(limit);

    if (error) {

        console.error(
            "Erreur récupération lives tendance :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Trending Sponsored Products
// ==========================================

export async function getTrendingSponsoredProducts({
    limit = 12
} = {}) {

    const {
        data,
        error
    } = await supabase
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
        .eq(
            "status",
            "published"
        )
        .eq(
            "is_sponsored",
            true
        )
        .order(
            "sales",
            {
                ascending: false
            }
        )
        .order(
            "rating",
            {
                ascending: false
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(limit);

    if (error) {

        console.error(
            "Erreur récupération produits sponsorisés tendance :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Notifications
// ==========================================

export async function getNotifications({
    page = 1,
    limit = 20,
    unreadOnly = false
} = {}) {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const from =
        (page - 1) * limit;

    const to =
        from + limit - 1;

    let query = supabase
        .from("notifications")
        .select("*")
        .eq(
            "user_id",
            user.id
        );

    if (unreadOnly) {
        query = query.eq(
            "is_read",
            false
        );
    }

    const {
        data,
        error
    } = await query
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .range(
            from,
            to
        );

    if (error) {

        console.error(
            "Erreur récupération notifications :",
            error
        );

        throw error;
    }

    return data || [];
}


// ==========================================
// Notification Count
// ==========================================

export async function getUnreadNotificationCount() {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return 0;
    }

    const {
        count,
        error
    } = await supabase
        .from("notifications")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "is_read",
            false
        );

    if (error) {

        console.error(
            "Erreur compteur notifications :",
            error
        );

        return 0;
    }

    return count || 0;
}


// ==========================================
// Mark Notification As Read
// ==========================================

export async function markNotificationAsRead(
    notificationId
) {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {

        return {
            data: null,
            error: new Error("Non connecté")
        };
    }

    return await supabase
        .from("notifications")
        .update({
            is_read: true
        })
        .eq(
            "id",
            notificationId
        )
        .eq(
            "user_id",
            user.id
        );
}


// ==========================================
// Mark All Notifications As Read
// ==========================================

export async function markAllNotificationsAsRead() {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {

        return {
            data: null,
            error: new Error("Non connecté")
        };
    }

    return await supabase
        .from("notifications")
        .update({
            is_read: true
        })
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "is_read",
            false
        );
}


// ==========================================
// Delete Notification
// ==========================================

export async function deleteNotification(
    notificationId
) {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {

        return {
            data: null,
            error: new Error("Non connecté")
        };
    }

    return await supabase
        .from("notifications")
        .delete()
        .eq(
            "id",
            notificationId
        )
        .eq(
            "user_id",
            user.id
        );
}


// ==========================================
// Notification Realtime
// ==========================================

export function subscribeToNotifications(
    callback
) {

    const channel =
        supabase
            .channel(
                "netview-notifications"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications"
                },
                callback
            )
            .subscribe();

    return channel;
}
