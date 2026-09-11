import {
    getUser
} from "./auth.js";

export async function getCurrentUser() {
    return await getUser();
}

export async function getProfile() {
    const user =
        await getCurrentUser();

    if (!user?.id) {
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
        throw error;
    }

    if (!data) {
        return null;
    }

    return {
        ...data,
        role: data.account_type,
        accountType: data.account_type
    };
}

export async function upsertCurrentDevice(values = {}) {
    const user =
        await getCurrentUser();

    if (!user?.id) {
        return null;
    }

    const payload = {
        user_id: user.id,
        device_name:
            values.device_name || null,
        device_type:
            values.device_type || null,
        browser:
            values.browser || null,
        operating_system:
            values.operating_system || null,
        device_token:
            values.device_token || null,
        last_ip:
            values.last_ip || null,
        last_active_at:
            new Date().toISOString(),
        is_active: true
    };

    const {
        data,
        error
    } = await supabase
        .from("devices")
        .upsert(
            payload,
            {
                onConflict:
                    "user_id,device_token"
            }
        )
        .select()
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}
