// ==========================================
// NetView
// data.js
// ==========================================

import { supabase } from "./supabase.js";


// ==========================================
// Constants
// ==========================================

export const SEARCH_LIMIT = 20;
export const DEFAULT_PAGE_LIMIT = 12;
export const MAX_PAGE_LIMIT = 100;

const DEFAULT_AVATAR = "images/default-avatar.png";


export async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}


// ==========================================
// Helpers
// ==========================================

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}


function normalizePage(page = 1) {
    const value = Number(page);

    return Number.isFinite(value) && value > 0
        ? Math.floor(value)
        : 1;
}


function normalizeLimit(
    limit = DEFAULT_PAGE_LIMIT
) {
    const value = Number(limit);

    if (!Number.isFinite(value)) {
        return DEFAULT_PAGE_LIMIT;
    }

    return Math.min(
        Math.max(Math.floor(value), 1),
        MAX_PAGE_LIMIT
    );
}


function getRange(page, limit) {
    const safePage = normalizePage(page);
    const safeLimit = normalizeLimit(limit);

    const from =
        (safePage - 1) * safeLimit;

    const to =
        from + safeLimit - 1;

    return {
        from,
        to,
        page: safePage,
        limit: safeLimit
    };
}


function normalizeVideo(video) {
    if (!video) {
        return null;
    }

    return {
        ...video,

        channelName:
            video.channels?.name ||
            "Chaîne inconnue",

        channelHandle:
            video.channels?.handle ||
            null,

        channelAvatar:
            video.channels?.avatar_url ||
            DEFAULT_AVATAR,

        channelVerified:
            video.channels?.verified ||
            false,

        subscribersCount:
            video.channels?.subscribers_count ||
            0,

        categoryName:
            video.video_categories?.name ||
            null
    };
}


function normalizeShort(short) {
    if (!short) {
        return null;
    }

    return {
        ...short,

        channelName:
            short.channels?.name ||
            "Chaîne inconnue",

        channelHandle:
            short.channels?.handle ||
            null,

        channelAvatar:
            short.channels?.avatar_url ||
            DEFAULT_AVATAR,

        channelVerified:
            short.channels?.verified ||
            false,

        subscribersCount:
            short.channels?.subscribers_count ||
            0
    };
}


function normalizeLive(live) {
    if (!live) {
        return null;
    }

    return {
        ...live,

        channelName:
            live.channels?.name ||
            "Chaîne inconnue",

        channelHandle:
            live.channels?.handle ||
            null,

        channelAvatar:
            live.channels?.avatar_url ||
            DEFAULT_AVATAR,

        channelVerified:
            live.channels?.verified ||
            false,

        subscribersCount:
            live.channels?.subscribers_count ||
            0
    };
}


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

    if (filters && Array.isArray(filters)) {
        for (const filter of filters) {
            if (
                !filter ||
                !filter.method ||
                !filter.column
            ) {
                continue;
            }

            if (
                typeof query[filter.method] !==
                "function"
            ) {
                throw new Error(
                    `Méthode Supabase invalide : ${filter.method}`
                );
            }

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
    filters = []
) {
    let query = supabase
        .from(table)
        .update(values);

    if (Array.isArray(filters)) {
        for (const filter of filters) {
            if (
                !filter ||
                !filter.method ||
                !filter.column
            ) {
                continue;
            }

            if (
                typeof query[filter.method] !==
                "function"
            ) {
                throw new Error(
                    `Méthode Supabase invalide : ${filter.method}`
                );
            }

            query = query[filter.method](
                filter.column,
                filter.value
            );
        }
    }

    return await query;
}


export async function remove(
    table,
    filters = []
) {
    let query = supabase
        .from(table)
        .delete();

    if (Array.isArray(filters)) {
        for (const filter of filters) {
            if (
                !filter ||
                !filter.method ||
                !filter.column
            ) {
                continue;
            }

            if (
                typeof query[filter.method] !==
                "function"
            ) {
                throw new Error(
                    `Méthode Supabase invalide : ${filter.method}`
                );
            }

            query = query[filter.method](
                filter.column,
                filter.value
            );
        }
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
    if (!bucket || !path || !file) {
        return {
            data: null,
            error: new Error(
                "Bucket, chemin ou fichier manquant."
            )
        };
    }

    return await supabase
        .storage
        .from(bucket)
        .upload(
            path,
            file,
            options
        );
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


export async function listFiles(
    bucket,
    path = "",
    options = {}
) {
    return await supabase
        .storage
        .from(bucket)
        .list(path, options);
}


export async function moveFile(
    bucket,
    oldPath,
    newPath
) {
    return await supabase
        .storage
        .from(bucket)
        .move(
            oldPath,
            newPath
        );
}


export async function copyFile(
    bucket,
    oldPath,
    newPath
) {
    return await supabase
        .storage
        .from(bucket)
        .copy(
            oldPath,
            newPath
        );
}


// ==========================================
// Realtime
// ==========================================

export function subscribe(
    channelName,
    table,
    callback,
    options = {}
) {
    const event =
        options.event || "*";

    const schema =
        options.schema || "public";

    const filter =
        options.filter;

    const config = {
        event,
        schema,
        table
    };

    if (filter) {
        config.filter = filter;
    }

    return supabase
        .channel(channelName)
        .on(
            "postgres_changes",
            config,
            callback
        )
        .subscribe();
}


export async function unsubscribe(
    channel
) {
    if (!channel) {
        return;
    }

    return await supabase
        .removeChannel(channel);
}


export async function unsubscribeAll() {
    return await supabase
        .removeAllChannels();
}


// ==========================================
// Device Revocation
// ==========================================

export function initDeviceRevocationListener() {

    const currentDeviceId =
        localStorage.getItem(
            "netview_current_device_id"
        );

    if (!currentDeviceId) {
        return null;
    }

    return supabase
        .channel(
            `netview-device-revocation-${currentDeviceId}`
        )
        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "devices",
                filter:
                    `id=eq.${currentDeviceId}`
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

    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        data,
        error
    } = await supabase
        .from("devices")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
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


export async function registerDevice(
    device
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    const {
        data,
        error
    } = await supabase
        .from("devices")
        .insert({
            user_id: user.id,
            device_name:
                device?.device_name ||
                null,
            browser:
                device?.browser ||
                null,
            operating_system:
                device?.operating_system ||
                null,
            ip_address:
                device?.ip_address ||
                null,
            last_seen:
                new Date().toISOString()
        })
        .select()
        .single();

    if (!error && data?.id) {
        localStorage.setItem(
            "netview_current_device_id",
            data.id
        );
    }

    return {
        data,
        error
    };
}


export async function updateDevice(
    deviceId,
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("devices")
        .update(values)
        .eq(
            "id",
            deviceId
        )
        .eq(
            "user_id",
            user.id
        )
        .select()
        .single();
}


export async function deleteDevice(
    deviceId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    if (
        localStorage.getItem(
            "netview_current_device_id"
        ) === deviceId
    ) {
        localStorage.removeItem(
            "netview_current_device_id"
        );
    }

    return await supabase
        .from("devices")
        .delete()
        .eq(
            "id",
            deviceId
        )
        .eq(
            "user_id",
            user.id
        );
}


export async function deleteOtherDevices(
    currentDeviceId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("devices")
        .delete()
        .eq(
            "user_id",
            user.id
        )
        .neq(
            "id",
            currentDeviceId
        );
}


// ==========================================
// Profile
// ==========================================

export async function getProfile() {

    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select("*")
        .eq(
            "id",
            user.id
        )
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

        role:
            data.account_type ||
            "user",

        accountType:
            data.account_type ||
            "user"
    };
}


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
        .eq(
            "id",
            userId
        )
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


export async function getProfileByUsername(
    username
) {
    const value =
        String(username || "")
            .trim()
            .replace(/^@/, "");

    if (!value) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select("*")
        .eq(
            "username",
            value
        )
        .maybeSingle();

    if (error) {
        console.error(
            "Erreur récupération profil username :",
            error
        );

        return null;
    }

    return data || null;
}


export async function updateProfile(
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("profiles")
        .update({
            ...values,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            user.id
        )
        .select()
        .single();
}


// ==========================================
// User Settings
// ==========================================

export async function getUserSettings() {

    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("user_settings")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
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


export async function createUserSettings(
    values = {}
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("user_settings")
        .insert({
            user_id: user.id,
            ...values
        })
        .select()
        .single();
}


export async function updateUserSettings(
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("user_settings")
        .update(values)
        .eq(
            "user_id",
            user.id
        )
        .select()
        .single();
}


export async function upsertUserSettings(
    values = {}
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("user_settings")
        .upsert(
            {
                user_id: user.id,
                ...values
            },
            {
                onConflict: "user_id"
            }
        )
        .select()
        .single();
}


// ==========================================
// Account Type
// ==========================================

export async function getAccountType() {
    const profile =
        await getProfile();

    return (
        profile?.account_type ||
        "user"
    );
}


export async function isProAccount() {
    return (
        await getAccountType()
    ) === "pro";
}


export async function updateAccountType(
    accountType
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    const allowedTypes = [
        "user",
        "pro"
    ];

    if (
        !allowedTypes.includes(
            accountType
        )
    ) {
        return {
            data: null,
            error: new Error(
                "Type de compte invalide."
            )
        };
    }

    return await supabase
        .from("profiles")
        .update({
            account_type:
                accountType,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            user.id
        )
        .select()
        .single();
}


// ==========================================
// Channels
// ==========================================

export async function getChannels({
    page = 1,
    limit = 12
} = {}) {
    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

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
            "Erreur récupération chaînes :",
            error
        );

        throw error;
    }

    return data || [];
}


export async function getChannel(
    channelId
) {
    if (!channelId) {
        return null;
    }

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
                banner_url,
                bio,
                verified,
                company_verified
            )
        `)
        .eq(
            "id",
            channelId
        )
        .maybeSingle();

    if (error) {
        console.error(
            "Erreur récupération chaîne :",
            error
        );

        return null;
    }

    return data;
}


export async function getChannelByHandle(
    handle
) {
    const value =
        String(handle || "")
            .trim()
            .replace(/^@/, "");

    if (!value) {
        return null;
    }

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
                banner_url,
                bio,
                verified,
                company_verified
            )
        `)
        .eq(
            "handle",
            value
        )
        .maybeSingle();

    if (error) {
        console.error(
            "Erreur chaîne handle :",
            error
        );

        return null;
    }

    return data;
}


export async function getMyChannels() {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        data,
        error
    } = await supabase
        .from("channels")
        .select("*")
        .eq(
            "owner_id",
            user.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {
        console.error(
            "Erreur récupération mes chaînes :",
            error
        );

        return [];
    }

    return data || [];
}

/* =========================================================
   CHANNEL HANDLE
   Vérifie réellement le handle dans Supabase
   ========================================================= */

export async function isChannelHandleAvailable(handle) {

    const normalizedHandle =
        String(handle || "")
            .trim()
            .replace(/^@+/, "")
            .toLowerCase();

    if (!normalizedHandle) {
        return false;
    }

    const {
        data,
        error
    } = await supabase
        .from("channels")
        .select("id")
        .eq(
            "handle",
            normalizedHandle
        )
        .limit(1);

    if (error) {
        console.error(
            "NetView — Erreur vérification handle :",
            error
        );

        throw error;
    }

    return !data || data.length === 0;
}

export async function createChannel(
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("channels")
        .insert({
            ...values,
            owner_id: user.id
        })
        .select()
        .single();
}


export async function updateChannel(
    channelId,
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("channels")
        .update({
            ...values,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            channelId
        )
        .eq(
            "owner_id",
            user.id
        )
        .select()
        .single();
}


export async function deleteChannel(
    channelId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("channels")
        .delete()
        .eq(
            "id",
            channelId
        )
        .eq(
            "owner_id",
            user.id
        );
}


// ==========================================
// Channel Members
// ==========================================

export async function getChannelMembers(
    channelId
) {
    const {
        data,
        error
    } = await supabase
        .from("channel_members")
        .select(`
            *,
            profiles:user_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)
        .eq(
            "channel_id",
            channelId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function addChannelMember(
    channelId,
    userId,
    role = "member"
) {
    return await supabase
        .from("channel_members")
        .insert({
            channel_id: channelId,
            user_id: userId,
            role
        });
}


export async function removeChannelMember(
    channelId,
    userId
) {
    return await supabase
        .from("channel_members")
        .delete()
        .eq(
            "channel_id",
            channelId
        )
        .eq(
            "user_id",
            userId
        );
}


// ==========================================
// Channel Subscriptions
// ==========================================

export async function subscribeToChannel(
    channelId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("subscriptions")
        .insert({
            subscriber_id: user.id,
            channel_id: channelId
        });
}


export async function unsubscribeFromChannel(
    channelId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("subscriptions")
        .delete()
        .eq(
            "subscriber_id",
            user.id
        )
        .eq(
            "channel_id",
            channelId
        );
}


export async function isSubscribedToChannel(
    channelId
) {
    const user =
        await getCurrentUser();

    if (!user || !channelId) {
        return false;
    }

    const {
        data,
        error
    } = await supabase
        .from("subscriptions")
        .select(
            "subscriber_id"
        )
        .eq(
            "subscriber_id",
            user.id
        )
        .eq(
            "channel_id",
            channelId
        )
        .maybeSingle();

    if (error) {
        return false;
    }

    return !!data;
}


export async function getMySubscriptions({
    page = 1,
    limit = 20
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("subscriptions")
        .select(`
            *,
            channels (
                id,
                owner_id,
                name,
                handle,
                description,
                avatar_url,
                banner_url,
                verified,
                subscribers_count,
                videos_count,
                total_views
            )
        `)
        .eq(
            "subscriber_id",
            user.id
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
        throw error;
    }

    return data || [];
}


// ==========================================
// Videos
// ==========================================

export async function getVideos({
    page = 1,
    limit = 12,
    search = null,
    channelId = null,
    categoryId = null
} = {}) {

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    let query = supabase
        .from("videos")
        .select(`
            *,
            channels (
                id,
                owner_id,
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
        );

    if (search && search.trim()) {
        const value =
            search.trim();

        query = query.or(
            `title.ilike.%${value}%,description.ilike.%${value}%`
        );
    }

    if (channelId) {
        query = query.eq(
            "channel_id",
            channelId
        );
    }

    if (categoryId) {
        query = query.eq(
            "category_id",
            categoryId
        );
    }

    const {
        data,
        error
    } = await query
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

    if (error) {
        console.error(
            "Erreur Supabase getVideos :",
            error
        );

        throw error;
    }

    return (
        data || []
    ).map(normalizeVideo);
}


export async function getVideo(
    videoId
) {
    if (!videoId) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("videos")
        .select(`
            *,
            channels (
                id,
                owner_id,
                name,
                handle,
                avatar_url,
                banner_url,
                verified,
                subscribers_count
            ),
            video_categories (
                id,
                name
            ),
            video_files (
                id,
                quality,
                file_url,
                file_size,
                created_at
            ),
            video_tags (
                id,
                tag
            )
        `)
        .eq(
            "id",
            videoId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return normalizeVideo(data);
}


export async function getMyVideos({
    page = 1,
    limit = 20
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("videos")
        .select(`
            *,
            channels!inner (
                id,
                owner_id,
                name,
                handle,
                avatar_url,
                verified
            ),
            video_categories (
                id,
                name
            )
        `)
        .eq(
            "channels.owner_id",
            user.id
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
        throw error;
    }

    return (
        data || []
    ).map(normalizeVideo);
}


export async function createVideo(
    values
) {
    return await supabase
        .from("videos")
        .insert(values)
        .select()
        .single();
}


export async function updateVideo(
    videoId,
    values
) {
    return await supabase
        .from("videos")
        .update({
            ...values,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            videoId
        )
        .select()
        .single();
}


export async function deleteVideo(
    videoId
) {
    return await supabase
        .from("videos")
        .delete()
        .eq(
            "id",
            videoId
        );
}


// ==========================================
// Video Files
// ==========================================

export async function getVideoFiles(
    videoId
) {
    const {
        data,
        error
    } = await supabase
        .from("video_files")
        .select("*")
        .eq(
            "video_id",
            videoId
        )
        .order(
            "quality",
            {
                ascending: true
            }
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function addVideoFile(
    values
) {
    return await supabase
        .from("video_files")
        .insert(values)
        .select()
        .single();
}


export async function deleteVideoFile(
    fileId
) {
    return await supabase
        .from("video_files")
        .delete()
        .eq(
            "id",
            fileId
        );
}


// ==========================================
// Video Tags
// ==========================================

export async function getVideoTags(
    videoId
) {
    const {
        data,
        error
    } = await supabase
        .from("video_tags")
        .select("*")
        .eq(
            "video_id",
            videoId
        )
        .order(
            "tag",
            {
                ascending: true
            }
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function addVideoTag(
    videoId,
    tag
) {
    return await supabase
        .from("video_tags")
        .insert({
            video_id: videoId,
            tag
        })
        .select()
        .single();
}


export async function removeVideoTag(
    tagId
) {
    return await supabase
        .from("video_tags")
        .delete()
        .eq(
            "id",
            tagId
        );
}


// ==========================================
// Video Reactions
// ==========================================

export async function setVideoReaction(
    videoId,
    reaction
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("video_reactions")
        .upsert(
            {
                video_id: videoId,
                user_id: user.id,
                reaction
            },
            {
                onConflict:
                    "video_id,user_id"
            }
        )
        .select()
        .single();
}


export async function removeVideoReaction(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("video_reactions")
        .delete()
        .eq(
            "video_id",
            videoId
        )
        .eq(
            "user_id",
            user.id
        );
}


export async function getUserVideoReaction(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("video_reactions")
        .select("reaction")
        .eq(
            "video_id",
            videoId
        )
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();

    if (error) {
        return null;
    }

    return data?.reaction || null;
}


// ==========================================
// Comments
// ==========================================

export async function getComments(
    videoId,
    {
        page = 1,
        limit = 30
    } = {}
) {
    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("comments")
        .select(`
            *,
            profiles:user_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)
        .eq(
            "video_id",
            videoId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        )
        .range(
            from,
            to
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function createComment(
    videoId,
    content,
    parentId = null
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("comments")
        .insert({
            video_id: videoId,
            user_id: user.id,
            parent_id: parentId,
            content
        })
        .select(`
            *,
            profiles:user_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)
        .single();
}


export async function updateComment(
    commentId,
    content
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("comments")
        .update({
            content,
            edited: true,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            commentId
        )
        .eq(
            "user_id",
            user.id
        )
        .select()
        .single();
}


export async function deleteComment(
    commentId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("comments")
        .delete()
        .eq(
            "id",
            commentId
        )
        .eq(
            "user_id",
            user.id
        );
}


// ==========================================
// Shorts
// ==========================================

export async function getShorts({
    page = 1,
    limit = 20
} = {}) {
    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("shorts")
        .select(`
            *,
            channels (
                id,
                owner_id,
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
        )
        .range(
            from,
            to
        );

    if (error) {
        throw error;
    }

    return (
        data || []
    ).map(normalizeShort);
}


export async function getShort(
    shortId
) {
    const {
        data,
        error
    } = await supabase
        .from("shorts")
        .select(`
            *,
            channels (
                id,
                owner_id,
                name,
                handle,
                avatar_url,
                banner_url,
                verified,
                subscribers_count
            )
        `)
        .eq(
            "id",
            shortId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return normalizeShort(data);
}


export async function createShort(
    values
) {
    return await supabase
        .from("shorts")
        .insert(values)
        .select()
        .single();
}


export async function updateShort(
    shortId,
    values
) {
    return await supabase
        .from("shorts")
        .update(values)
        .eq(
            "id",
            shortId
        )
        .select()
        .single();
}


export async function deleteShort(
    shortId
) {
    return await supabase
        .from("shorts")
        .delete()
        .eq(
            "id",
            shortId
        );
}


// ==========================================
// Short Reactions
// ==========================================

export async function setShortReaction(
    shortId,
    reaction
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("short_reactions")
        .upsert(
            {
                short_id: shortId,
                user_id: user.id,
                reaction
            },
            {
                onConflict:
                    "short_id,user_id"
            }
        )
        .select()
        .single();
}


export async function removeShortReaction(
    shortId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("short_reactions")
        .delete()
        .eq(
            "short_id",
            shortId
        )
        .eq(
            "user_id",
            user.id
        );
}


// ==========================================
// Watch History
// ==========================================

export async function getWatchHistory({
    page = 1,
    limit = 20
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("watch_history")
        .select(`
            *,
            videos (
                id,
                title,
                thumbnail_url,
                duration,
                channel_id,
                channels (
                    id,
                    name,
                    handle,
                    avatar_url,
                    verified
                )
            )
        `)
        .eq(
            "user_id",
            user.id
        )
        .order(
            "last_watched_at",
            {
                ascending: false
            }
        )
        .range(
            from,
            to
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function saveWatchHistory(
    videoId,
    lastPosition = 0,
    watchedPercent = 0
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("watch_history")
        .insert({
            user_id: user.id,
            video_id: videoId,
            last_position: lastPosition,
            watched_percent:
                watchedPercent,
            last_watched_at:
                new Date().toISOString()
        })
        .select()
        .single();
}


export async function clearWatchHistory() {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("watch_history")
        .delete()
        .eq(
            "user_id",
            user.id
        );
}


// ==========================================
// Watch Later
// ==========================================

export async function addWatchLater(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("watch_later")
        .insert({
            user_id: user.id,
            video_id: videoId
        });
}


export async function removeWatchLater(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("watch_later")
        .delete()
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "video_id",
            videoId
        );
}


export async function hasWatchLater(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user || !videoId) {
        return false;
    }

    const {
        data
    } = await supabase
        .from("watch_later")
        .select("video_id")
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "video_id",
            videoId
        )
        .maybeSingle();

    return !!data;
}


export async function getWatchLater({
    page = 1,
    limit = 20
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("watch_later")
        .select(`
            *,
            videos (
                *,
                channels (
                    id,
                    name,
                    handle,
                    avatar_url,
                    verified
                )
            )
        `)
        .eq(
            "user_id",
            user.id
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
        throw error;
    }

    return data || [];
}


// ==========================================
// Liked Videos
// ==========================================

export async function likeVideo(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("liked_videos")
        .insert({
            user_id: user.id,
            video_id: videoId
        });
}


export async function unlikeVideo(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("liked_videos")
        .delete()
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "video_id",
            videoId
        );
}


export async function hasLikedVideo(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user || !videoId) {
        return false;
    }

    const {
        data
    } = await supabase
        .from("liked_videos")
        .select("video_id")
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "video_id",
            videoId
        )
        .maybeSingle();

    return !!data;
}


export async function getLikedVideos({
    page = 1,
    limit = 20
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("liked_videos")
        .select(`
            *,
            videos (
                *,
                channels (
                    id,
                    name,
                    handle,
                    avatar_url,
                    verified
                )
            )
        `)
        .eq(
            "user_id",
            user.id
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
        throw error;
    }

    return data || [];
}


// ==========================================
// Playlists
// ==========================================

export async function getPlaylists({
    page = 1,
    limit = 20
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("playlists")
        .select(`
            *,
            playlist_items (
                video_id,
                position,
                videos (
                    id,
                    title,
                    thumbnail_url,
                    duration
                )
            )
        `)
        .eq(
            "owner_id",
            user.id
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
        throw error;
    }

    return data || [];
}


export async function getPlaylist(
    playlistId
) {
    if (!playlistId) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("playlists")
        .select(`
            *,
            playlist_items (
                playlist_id,
                video_id,
                position,
                created_at,
                videos (
                    id,
                    title,
                    description,
                    thumbnail_url,
                    duration,
                    views,
                    likes,
                    channel_id,
                    channels (
                        id,
                        name,
                        handle,
                        avatar_url,
                        verified
                    )
                )
            )
        `)
        .eq(
            "id",
            playlistId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    if (
        Array.isArray(
            data.playlist_items
        )
    ) {
        data.playlist_items.sort(
            (a, b) =>
                a.position -
                b.position
        );
    }

    return data;
}


export async function createPlaylist(
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("playlists")
        .insert({
            ...values,
            owner_id: user.id
        })
        .select()
        .single();
}


export async function updatePlaylist(
    playlistId,
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("playlists")
        .update(values)
        .eq(
            "id",
            playlistId
        )
        .eq(
            "owner_id",
            user.id
        )
        .select()
        .single();
}


export async function deletePlaylist(
    playlistId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("playlists")
        .delete()
        .eq(
            "id",
            playlistId
        )
        .eq(
            "owner_id",
            user.id
        );
}


export async function addVideoToPlaylist(
    playlistId,
    videoId,
    position = null
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    if (position === null) {
        const {
            data: lastItem
        } = await supabase
            .from("playlist_items")
            .select("position")
            .eq(
                "playlist_id",
                playlistId
            )
            .order(
                "position",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();

        position =
            lastItem
                ? Number(
                    lastItem.position
                ) + 1
                : 0;
    }

    return await supabase
        .from("playlist_items")
        .insert({
            playlist_id: playlistId,
            video_id: videoId,
            position
        })
        .select()
        .single();
}


export async function removeVideoFromPlaylist(
    playlistId,
    videoId
) {
    return await supabase
        .from("playlist_items")
        .delete()
        .eq(
            "playlist_id",
            playlistId
        )
        .eq(
            "video_id",
            videoId
        );
}


export async function updatePlaylistItemPosition(
    playlistId,
    videoId,
    position
) {
    return await supabase
        .from("playlist_items")
        .update({
            position
        })
        .eq(
            "playlist_id",
            playlistId
        )
        .eq(
            "video_id",
            videoId
        );
}


// ==========================================
// Video Views
// ==========================================

export async function recordVideoView(
    videoId,
    {
        watchTime = 0,
        completed = false,
        country = null
    } = {}
) {
    const user =
        await getCurrentUser();

    return await supabase
        .from("video_views")
        .insert({
            video_id: videoId,
            user_id:
                user?.id || null,
            watch_time: watchTime,
            completed,
            country
        })
        .select()
        .single();
}


// ==========================================
// Lives
// ==========================================

export async function getLives({
    page = 1,
    limit = 20,
    status = "live"
} = {}) {
    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    let query = supabase
        .from("lives")
        .select(`
            *,
            channels (
                id,
                owner_id,
                name,
                handle,
                avatar_url,
                verified,
                subscribers_count
            )
        `);

    if (status) {
        query = query.eq(
            "status",
            status
        );
    }

    const {
        data,
        error
    } = await query
        .eq(
            "visibility",
            "public"
        )
        .order(
            "started_at",
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
        throw error;
    }

    return (
        data || []
    ).map(normalizeLive);
}


export async function getLive(
    liveId
) {
    const {
        data,
        error
    } = await supabase
        .from("lives")
        .select(`
            *,
            channels (
                id,
                owner_id,
                name,
                handle,
                avatar_url,
                banner_url,
                verified,
                subscribers_count
            )
        `)
        .eq(
            "id",
            liveId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return normalizeLive(data);
}


export async function createLive(
    values
) {
    return await supabase
        .from("lives")
        .insert(values)
        .select()
        .single();
}


export async function updateLive(
    liveId,
    values
) {
    return await supabase
        .from("lives")
        .update({
            ...values,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            liveId
        )
        .select()
        .single();
}


export async function deleteLive(
    liveId
) {
    return await supabase
        .from("lives")
        .delete()
        .eq(
            "id",
            liveId
        );
}


// ==========================================
// Live Viewers
// ==========================================

export async function addLiveViewer(
    values
) {
    return await supabase
        .from("live_viewers")
        .insert(values)
        .select()
        .single();
}


export async function updateLiveViewer(
    viewerId,
    values
) {
    return await supabase
        .from("live_viewers")
        .update(values)
        .eq(
            "id",
            viewerId
        )
        .select()
        .single();
}


export async function getLiveViewers(
    liveId
) {
    const {
        data,
        error
    } = await supabase
        .from("live_viewers")
        .select(`
            *,
            profiles:user_id (
                id,
                username,
                display_name,
                avatar_url
            )
        `)
        .eq(
            "live_id",
            liveId
        )
        .order(
            "joined_at",
            {
                ascending: false
            }
        );

    if (error) {
        throw error;
    }

    return data || [];
}


// ==========================================
// Live Chat
// ==========================================

export async function getLiveChatMessages(
    liveId,
    {
        page = 1,
        limit = 100
    } = {}
) {
    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("live_chat_messages")
        .select(`
            *,
            profiles:sender_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            ),
            live_chat_attachments (*)
        `)
        .eq(
            "live_id",
            liveId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        )
        .range(
            from,
            to
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function sendLiveChatMessage(
    liveId,
    message,
    options = {}
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("live_chat_messages")
        .insert({
            live_id: liveId,
            sender_id: user.id,
            message_type:
                options.messageType ||
                "text",
            message,
            reply_to:
                options.replyTo ||
                null
        })
        .select(`
            *,
            profiles:sender_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)
        .single();
}


export async function deleteLiveChatMessage(
    messageId
) {
    return await supabase
        .from("live_chat_messages")
        .update({
            deleted: true,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            messageId
        );
}


export function subscribeToLiveChat(
    liveId,
    callback
) {
    return supabase
        .channel(
            `netview-live-chat-${liveId}`
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table:
                    "live_chat_messages",
                filter:
                    `live_id=eq.${liveId}`
            },
            callback
        )
        .subscribe();
}


// ==========================================
// Marketplace - Stores
// ==========================================

export async function getStore(
    storeId
) {
    const {
        data,
        error
    } = await supabase
        .from("stores")
        .select(`
            *,
            profiles:owner_id (
                id,
                username,
                display_name,
                avatar_url,
                verified,
                company_verified
            )
        `)
        .eq(
            "id",
            storeId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


export async function getStoreBySlug(
    slug
) {
    const {
        data,
        error
    } = await supabase
        .from("stores")
        .select(`
            *,
            profiles:owner_id (
                id,
                username,
                display_name,
                avatar_url,
                verified,
                company_verified
            )
        `)
        .eq(
            "slug",
            slug
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


export async function getMyStore() {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("stores")
        .select("*")
        .eq(
            "owner_id",
            user.id
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


export async function createStore(
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("stores")
        .insert({
            ...values,
            owner_id: user.id
        })
        .select()
        .single();
}


export async function updateStore(
    storeId,
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("stores")
        .update({
            ...values,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            storeId
        )
        .eq(
            "owner_id",
            user.id
        )
        .select()
        .single();
}


// ==========================================
// Product Categories
// ==========================================

export async function getProductCategories() {
    const {
        data,
        error
    } = await supabase
        .from("product_categories")
        .select("*")
        .order(
            "name",
            {
                ascending: true
            }
        );

    if (error) {
        throw error;
    }

    return data || [];
}


// ==========================================
// Products
// ==========================================

export async function getProducts({
    page = 1,
    limit = 20,
    categoryId = null,
    storeId = null
} = {}) {
    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    let query = supabase
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
        );

    if (categoryId) {
        query = query.eq(
            "category_id",
            categoryId
        );
    }

    if (storeId) {
        query = query.eq(
            "store_id",
            storeId
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
        throw error;
    }

    return data || [];
}


export async function getProduct(
    productId
) {
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
                banner_path,
                owner_id
            ),
            product_categories (
                id,
                name,
                icon
            ),
            product_images (
                id,
                image_path,
                position
            ),
            product_files (
                id,
                storage_path,
                version,
                file_size,
                checksum
            ),
            product_tags (
                id,
                tag
            )
        `)
        .eq(
            "id",
            productId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


export async function createProduct(
    values
) {
    return await supabase
        .from("products")
        .insert(values)
        .select()
        .single();
}


export async function updateProduct(
    productId,
    values
) {
    return await supabase
        .from("products")
        .update({
            ...values,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            productId
        )
        .select()
        .single();
}


export async function deleteProduct(
    productId
) {
    return await supabase
        .from("products")
        .delete()
        .eq(
            "id",
            productId
        );
}


// ==========================================
// Product Favorites
// ==========================================

export async function addProductFavorite(
    productId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("product_favorites")
        .insert({
            product_id: productId,
            user_id: user.id
        });
}


export async function removeProductFavorite(
    productId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("product_favorites")
        .delete()
        .eq(
            "product_id",
            productId
        )
        .eq(
            "user_id",
            user.id
        );
}


export async function hasProductFavorite(
    productId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return false;
    }

    const {
        data
    } = await supabase
        .from("product_favorites")
        .select("product_id")
        .eq(
            "product_id",
            productId
        )
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();

    return !!data;
}


// ==========================================
// Product Reviews
// ==========================================

export async function getProductReviews(
    productId
) {
    const {
        data,
        error
    } = await supabase
        .from("product_reviews")
        .select(`
            *,
            profiles:user_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)
        .eq(
            "product_id",
            productId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function createProductReview(
    productId,
    rating,
    review
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("product_reviews")
        .insert({
            product_id: productId,
            user_id: user.id,
            rating,
            review
        })
        .select()
        .single();
}


export async function updateProductReview(
    reviewId,
    values
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("product_reviews")
        .update({
            ...values,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            reviewId
        )
        .eq(
            "user_id",
            user.id
        )
        .select()
        .single();
}


export async function deleteProductReview(
    reviewId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("product_reviews")
        .delete()
        .eq(
            "id",
            reviewId
        )
        .eq(
            "user_id",
            user.id
        );
}


// ==========================================
// Sponsored Products
// ==========================================

export async function getSponsoredProducts({
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
            "created_at",
            {
                ascending: false
            }
        )
        .limit(
            normalizeLimit(limit)
        );

    if (error) {
        throw error;
    }

    return data || [];
}


// ==========================================
// Cart
// ==========================================

export async function getCart() {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("carts")
        .select(`
            *,
            cart_items (
                *,
                products (
                    id,
                    title,
                    slug,
                    thumbnail_path,
                    price,
                    currency,
                    status
                )
            )
        `)
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


export async function createCart() {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("carts")
        .insert({
            user_id: user.id
        })
        .select()
        .single();
}


export async function addCartItem(
    cartId,
    productId,
    unitPrice,
    quantity = 1
) {
    const totalPrice =
        Number(unitPrice) *
        Number(quantity);

    return await supabase
        .from("cart_items")
        .insert({
            cart_id: cartId,
            product_id: productId,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice
        })
        .select()
        .single();
}


export async function updateCartItem(
    itemId,
    quantity,
    unitPrice
) {
    return await supabase
        .from("cart_items")
        .update({
            quantity,
            unit_price: unitPrice,
            total_price:
                Number(unitPrice) *
                Number(quantity)
        })
        .eq(
            "id",
            itemId
        )
        .select()
        .single();
}


export async function removeCartItem(
    itemId
) {
    return await supabase
        .from("cart_items")
        .delete()
        .eq(
            "id",
            itemId
        );
}


// ==========================================
// Orders
// ==========================================

export async function getOrders({
    page = 1,
    limit = 20
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                *,
                products (
                    id,
                    title,
                    slug,
                    thumbnail_path
                )
            )
        `)
        .eq(
            "buyer_id",
            user.id
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
        throw error;
    }

    return data || [];
}


export async function getOrder(
    orderId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                *,
                products (
                    id,
                    title,
                    slug,
                    thumbnail_path
                )
            ),
            order_events (
                *
            )
        `)
        .eq(
            "id",
            orderId
        )
        .eq(
            "buyer_id",
            user.id
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


// ==========================================
// Wallets
// ==========================================

export async function getMyWallets() {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        data,
        error
    } = await supabase
        .from("wallets")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function getWallet(
    walletId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("wallets")
        .select("*")
        .eq(
            "id",
            walletId
        )
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


export async function getWalletTransactions(
    walletId,
    {
        page = 1,
        limit = 30
    } = {}
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq(
            "wallet_id",
            walletId
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
        throw error;
    }

    return data || [];
}


export async function requestWithdrawal(
    walletId,
    amount
) {
    return await supabase
        .from("withdrawal_requests")
        .insert({
            wallet_id: walletId,
            amount
        })
        .select()
        .single();
}


// ==========================================
// Stripe Accounts
// ==========================================

export async function getStripeAccount() {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("stripe_accounts")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


export async function getPaymentMethods() {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        data,
        error
    } = await supabase
        .from("payment_methods")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
        .order(
            "is_default",
            {
                ascending: false
            }
        );

    if (error) {
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
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    let query = supabase
        .from("notifications")
        .select(`
            *,
            actor:actor_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)
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
        throw error;
    }

    return data || [];
}


export async function getUnreadNotificationCount() {
    const user =
        await getCurrentUser();

    if (!user) {
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
        return 0;
    }

    return count || 0;
}


export async function markNotificationAsRead(
    notificationId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("notifications")
        .update({
            is_read: true,
            read_at:
                new Date().toISOString()
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


export async function markAllNotificationsAsRead() {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("notifications")
        .update({
            is_read: true,
            read_at:
                new Date().toISOString()
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


export async function deleteNotification(
    notificationId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
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


export function subscribeToNotifications(
    callback
) {
    return supabase
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
}


// ==========================================
// Search
// ==========================================

export async function searchVideos(
    query,
    page = 1
) {
    const search =
        String(query || "")
            .trim();

    if (!search) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        SEARCH_LIMIT
    );

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
        throw error;
    }

    return (
        data || []
    ).map(normalizeVideo);
}


export async function searchShorts(
    query,
    page = 1
) {
    const search =
        String(query || "")
            .trim();

    if (!search) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        SEARCH_LIMIT
    );

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
        throw error;
    }

    return (
        data || []
    ).map(normalizeShort);
}


export async function searchChannels(
    query,
    page = 1
) {
    const search =
        String(query || "")
            .trim();

    if (!search) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        SEARCH_LIMIT
    );

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
        throw error;
    }

    return data || [];
}


export async function searchLives(
    query,
    page = 1
) {
    const search =
        String(query || "")
            .trim();

    if (!search) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        SEARCH_LIMIT
    );

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
        throw error;
    }

    return (
        data || []
    ).map(normalizeLive);
}


export async function searchProducts(
    query,
    page = 1
) {
    const search =
        String(query || "")
            .trim();

    if (!search) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        SEARCH_LIMIT
    );

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
            "Erreur récupération catégories vidéos :",
            error
        );

        return [];
    }

    return data || [];
}


// ==========================================
// Trending
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
        .limit(
            normalizeLimit(limit)
        );

    if (error) {
        throw error;
    }

    return (
        data || []
    ).map(normalizeVideo);
}


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
        .limit(
            normalizeLimit(limit)
        );

    if (error) {
        throw error;
    }

    return (
        data || []
    ).map(normalizeShort);
}


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
        .limit(
            normalizeLimit(limit)
        );

    if (error) {
        throw error;
    }

    return data || [];
}


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
        .limit(
            normalizeLimit(limit)
        );

    if (error) {
        throw error;
    }

    return (
        data || []
    ).map(normalizeLive);
}


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
        .limit(
            normalizeLimit(limit)
        );

    if (error) {
        throw error;
    }

    return data || [];
}


// ==========================================
// Video Downloads
// ==========================================
// IMPORTANT
// Table réelle : video_downloads
// ==========================================

export async function canDownloadVideo(
    videoId
) {
    if (!videoId) {
        return false;
    }

    const {
        data,
        error
    } = await supabase
        .from("videos")
        .select(`
            id,
            download_enabled,
            status,
            visibility
        `)
        .eq(
            "id",
            videoId
        )
        .eq(
            "status",
            "published"
        )
        .eq(
            "visibility",
            "public"
        )
        .maybeSingle();

    if (error) {
        console.error(
            "Erreur vérification téléchargement vidéo :",
            error
        );

        return false;
    }

    return (
        data?.download_enabled === true
    );
}


export async function getDownloadableVideo(
    videoId
) {
    if (!videoId) {
        return {
            data: null,
            error: new Error(
                "Identifiant vidéo manquant."
            )
        };
    }

    const {
        data,
        error
    } = await supabase
        .from("videos")
        .select(`
            id,
            channel_id,
            title,
            download_enabled,
            video_files (
                id,
                quality,
                file_url,
                file_size
            )
        `)
        .eq(
            "id",
            videoId
        )
        .eq(
            "status",
            "published"
        )
        .eq(
            "visibility",
            "public"
        )
        .eq(
            "download_enabled",
            true
        )
        .maybeSingle();

    if (error) {
        return {
            data: null,
            error
        };
    }

    if (!data) {
        return {
            data: null,
            error: new Error(
                "Le téléchargement de cette vidéo n'est pas autorisé."
            )
        };
    }

    return {
        data,
        error: null
    };
}


export async function getDownloads({
    page = 1,
    limit = 20
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("video_downloads")
        .select(`
            *,
            videos (
                id,
                title,
                thumbnail_url,
                duration,
                channel_id,
                download_enabled,
                channels (
                    id,
                    name,
                    handle,
                    avatar_url,
                    verified
                )
            ),
            video_files (
                id,
                quality,
                file_url,
                file_size
            )
        `)
        .eq(
            "user_id",
            user.id
        )
        .order(
            "downloaded_at",
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
            "Erreur récupération téléchargements :",
            error
        );

        return [];
    }

    return (
        data || []
    ).filter(
        item =>
            item.videos?.download_enabled ===
            true
    );
}


export async function addDownload(
    videoId,
    {
        videoFileId = null,
        quality = null
    } = {}
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    if (!videoId) {
        return {
            data: null,
            error: new Error(
                "Identifiant vidéo manquant."
            )
        };
    }

    const allowed =
        await canDownloadVideo(
            videoId
        );

    if (!allowed) {
        return {
            data: null,
            error: new Error(
                "Le créateur n'autorise pas le téléchargement de cette vidéo."
            )
        };
    }

    return await supabase
        .from("video_downloads")
        .upsert(
            {
                user_id: user.id,
                video_id: videoId,
                video_file_id:
                    videoFileId,
                quality
            },
            {
                onConflict:
                    "user_id,video_id"
            }
        )
        .select(`
            *,
            videos (
                id,
                title,
                thumbnail_url,
                duration,
                download_enabled
            )
        `)
        .single();
}


export async function removeDownload(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    if (!videoId) {
        return {
            data: null,
            error: new Error(
                "Identifiant vidéo manquant."
            )
        };
    }

    return await supabase
        .from("video_downloads")
        .delete()
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "video_id",
            videoId
        );
}


export async function hasDownload(
    videoId
) {
    const user =
        await getCurrentUser();

    if (!user || !videoId) {
        return false;
    }

    const {
        data,
        error
    } = await supabase
        .from("video_downloads")
        .select("video_id")
        .eq(
            "user_id",
            user.id
        )
        .eq(
            "video_id",
            videoId
        )
        .maybeSingle();

    if (error) {
        return false;
    }

    return !!data;
}


export async function clearDownloads() {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("video_downloads")
        .delete()
        .eq(
            "user_id",
            user.id
        );
}


// ==========================================
// Messaging
// ==========================================

export async function getConversations({
    page = 1,
    limit = 30
} = {}) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("conversation_members")
        .select(`
            *,
            conversations (
                *,
                conversation_members (
                    id,
                    user_id,
                    role,
                    joined_at,
                    last_read_at,
                    is_muted,
                    profiles:user_id (
                        id,
                        username,
                        display_name,
                        avatar_url,
                        verified
                    )
                )
            )
        `)
        .eq(
            "user_id",
            user.id
        )
        .order(
            "joined_at",
            {
                ascending: false
            }
        )
        .range(
            from,
            to
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function getConversation(
    conversationId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("conversations")
        .select(`
            *,
            conversation_members (
                id,
                user_id,
                role,
                joined_at,
                last_read_at,
                is_muted,
                profiles:user_id (
                    id,
                    username,
                    display_name,
                    avatar_url,
                    verified
                )
            )
        `)
        .eq(
            "id",
            conversationId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


export async function createConversation(
    {
        type = "direct",
        title = null
    } = {}
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    const {
        data: conversation,
        error
    } = await supabase
        .from("conversations")
        .insert({
            type,
            title,
            created_by: user.id
        })
        .select()
        .single();

    if (error) {
        return {
            data: null,
            error
        };
    }

    const {
        error: memberError
    } = await supabase
        .from("conversation_members")
        .insert({
            conversation_id:
                conversation.id,
            user_id: user.id,
            role: "member"
        });

    if (memberError) {
        return {
            data: conversation,
            error: memberError
        };
    }

    return {
        data: conversation,
        error: null
    };
}


export async function addConversationMember(
    conversationId,
    userId,
    role = "member"
) {
    return await supabase
        .from("conversation_members")
        .insert({
            conversation_id:
                conversationId,
            user_id: userId,
            role
        })
        .select()
        .single();
}


export async function removeConversationMember(
    conversationId,
    userId
) {
    return await supabase
        .from("conversation_members")
        .delete()
        .eq(
            "conversation_id",
            conversationId
        )
        .eq(
            "user_id",
            userId
        );
}


export async function getMessages(
    conversationId,
    {
        page = 1,
        limit = 50
    } = {}
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    const {
        from,
        to
    } = getRange(
        page,
        limit
    );

    const {
        data,
        error
    } = await supabase
        .from("messages")
        .select(`
            *,
            profiles:sender_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            ),
            message_files (*)
        `)
        .eq(
            "conversation_id",
            conversationId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        )
        .range(
            from,
            to
        );

    if (error) {
        throw error;
    }

    return data || [];
}


export async function sendMessage(
    conversationId,
    content,
    options = {}
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Vous devez être connecté."
            )
        };
    }

    return await supabase
        .from("messages")
        .insert({
            conversation_id:
                conversationId,
            sender_id: user.id,
            message_type:
                options.messageType ||
                "text",
            content,
            reply_to:
                options.replyTo ||
                null,
            is_system:
                options.isSystem ||
                false
        })
        .select(`
            *,
            profiles:sender_id (
                id,
                username,
                display_name,
                avatar_url,
                verified
            )
        `)
        .single();
}


export async function editMessage(
    messageId,
    content
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("messages")
        .update({
            content,
            is_edited: true,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            messageId
        )
        .eq(
            "sender_id",
            user.id
        )
        .select()
        .single();
}


export async function deleteMessage(
    messageId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("messages")
        .update({
            is_deleted: true,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            messageId
        )
        .eq(
            "sender_id",
            user.id
        );
}


export async function markMessageAsRead(
    messageId
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("message_reads")
        .upsert(
            {
                message_id:
                    messageId,
                user_id:
                    user.id,
                read_at:
                    new Date().toISOString()
            },
            {
                onConflict:
                    "message_id,user_id"
            }
        );
}


export async function updateTypingStatus(
    conversationId,
    isTyping = true
) {
    const user =
        await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error(
                "Non connecté"
            )
        };
    }

    return await supabase
        .from("typing_status")
        .upsert(
            {
                conversation_id:
                    conversationId,
                user_id:
                    user.id,
                is_typing: isTyping,
                updated_at:
                    new Date().toISOString()
            },
            {
                onConflict:
                    "conversation_id,user_id"
            }
        );
}


export function subscribeToMessages(
    conversationId,
    callback
) {
    return supabase
        .channel(
            `netview-messages-${conversationId}`
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "messages",
                filter:
                    `conversation_id=eq.${conversationId}`
            },
            callback
        )
        .subscribe();
}


export function subscribeToTyping(
    conversationId,
    callback
) {
    return supabase
        .channel(
            `netview-typing-${conversationId}`
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "typing_status",
                filter:
                    `conversation_id=eq.${conversationId}`
            },
            callback
        )
        .subscribe();
}


// ==========================================
// Search Everything
// ==========================================

export async function searchAll(
    query,
    {
        page = 1,
        limit = SEARCH_LIMIT
    } = {}
) {
    const search =
        String(query || "")
            .trim();

    if (!search) {
        return {
            videos: [],
            shorts: [],
            channels: [],
            lives: [],
            products: []
        };
    }

    const [
        videos,
        shorts,
        channels,
        lives,
        products
    ] = await Promise.all([
        searchVideos(
            search,
            page
        ),
        searchShorts(
            search,
            page
        ),
        searchChannels(
            search,
            page
        ),
        searchLives(
            search,
            page
        ),
        searchProducts(
            search,
            page
        )
    ]);

    return {
        videos,
        shorts,
        channels,
        lives,
        products
    };
}
