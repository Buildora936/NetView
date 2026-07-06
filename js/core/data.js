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
