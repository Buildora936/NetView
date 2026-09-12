import { supabase } from "./supabase.js";
import { getUser } from "./auth.js";

const NETVIEW_DEVICE_TOKEN_KEY =
    "netview_device_token";

export async function registerCurrentDevice() {
    const user =
        await getUser();

    if (!user?.id) {
        throw new Error(
            "Utilisateur non authentifié."
        );
    }

    const deviceToken =
        getOrCreateDeviceToken();

    const deviceInfo =
        getDeviceInfo();

    const {
        data: existingDevice,
        error: findError
    } = await supabase
        .from("devices")
        .select("id")
        .eq("user_id", user.id)
        .eq("device_token", deviceToken)
        .maybeSingle();

    if (findError) {
        throw findError;
    }

    const payload = {
        user_id: user.id,
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        operating_system: deviceInfo.operatingSystem,
        device_token: deviceToken,
        last_active_at:
            new Date().toISOString(),
        is_active: true
    };

    if (existingDevice?.id) {
        const {
            data,
            error
        } = await supabase
            .from("devices")
            .update(payload)
            .eq("id", existingDevice.id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    const {
        data,
        error
    } = await supabase
        .from("devices")
        .insert(payload)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

function getOrCreateDeviceToken() {
    try {
        const existing =
            localStorage.getItem(
                NETVIEW_DEVICE_TOKEN_KEY
            );

        if (existing) {
            return existing;
        }

        const token =
            crypto.randomUUID();

        localStorage.setItem(
            NETVIEW_DEVICE_TOKEN_KEY,
            token
        );

        return token;
    } catch (error) {
        console.warn(
            "NetView device token storage warning:",
            error
        );

        return crypto.randomUUID();
    }
}

function getDeviceInfo() {
    const userAgent =
        navigator.userAgent || "";

    const platform =
        navigator.platform || "";

    return {
        deviceName:
            getDeviceName(),

        deviceType:
            getDeviceType(),

        browser:
            getBrowserName(
                userAgent
            ),

        operatingSystem:
            getOperatingSystem(
                userAgent,
                platform
            )
    };
}

function getDeviceName() {
    const type =
        getDeviceType();

    if (type === "mobile") {
        return "Appareil mobile";
    }

    if (type === "tablet") {
        return "Tablette";
    }

    return "Ordinateur";
}

function getDeviceType() {
    const userAgent =
        navigator.userAgent ||
        "";

    if (
        /iPad|Tablet|Android(?!.*Mobile)/i.test(
            userAgent
        )
    ) {
        return "tablet";
    }

    if (
        /Mobi|Android|iPhone|iPod|Windows Phone/i.test(
            userAgent
        )
    ) {
        return "mobile";
    }

    return "desktop";
}

function getBrowserName(
    userAgent
) {
    if (
        /Edg\//i.test(
            userAgent
        )
    ) {
        return "Microsoft Edge";
    }

    if (
        /OPR\//i.test(
            userAgent
        )
    ) {
        return "Opera";
    }

    if (
        /Chrome\//i.test(
            userAgent
        ) &&
        !/Edg\//i.test(
            userAgent
        )
    ) {
        return "Google Chrome";
    }

    if (
        /Firefox\//i.test(
            userAgent
        )
    ) {
        return "Mozilla Firefox";
    }

    if (
        /Safari\//i.test(
            userAgent
        ) &&
        !/Chrome\//i.test(
            userAgent
        )
    ) {
        return "Safari";
    }

    return "Navigateur inconnu";
}

function getOperatingSystem(
    userAgent,
    platform
) {
    if (
        /Windows NT/i.test(
            userAgent
        )
    ) {
        return "Windows";
    }

    if (
        /Android/i.test(
            userAgent
        )
    ) {
        return "Android";
    }

    if (
        /iPhone|iPad|iPod/i.test(
            userAgent
        )
    ) {
        return "iOS";
    }

    if (
        /Mac OS X/i.test(
            userAgent
        ) ||
        /Mac/i.test(
            platform
        )
    ) {
        return "macOS";
    }

    if (
        /CrOS/i.test(
            userAgent
        )
    ) {
        return "ChromeOS";
    }

    if (
        /Linux/i.test(
            userAgent
        )
    ) {
        return "Linux";
    }

    return "Système inconnu";
}
