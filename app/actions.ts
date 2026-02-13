"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";
import { QR_CODE_TOKEN_PREFIX, UUID_REGEX } from "@/lib/qrcode";

type Event = Database["public"]["Tables"]["events"]["Row"];
type Connection = Database["public"]["Tables"]["connections"]["Row"] & {
    connected_user: Database["public"]["Tables"]["profiles"]["Row"] | null;
};
type RankingEntry = {
    points: number;
    user: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
type ActivityUpdate = Database["public"]["Tables"]["activities"]["Update"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ScanResponse = { success: boolean; message: string; points?: number; name?: string };
type QRTokenType = "activity" | "user";
type DecodedQRPayload = {
    v: 1;
    t: QRTokenType;
    e: string;
    i: string;
};
const NOT_APP_QR_MESSAGE = "Este QRCode não pertence a esse app";

function extractCodeToken(value: string) {
    const trimmedValue = value.trim();
    if (!trimmedValue) return "";

    if (!trimmedValue.includes("/")) return trimmedValue;

    try {
        const url = new URL(trimmedValue);
        const pathSegments = url.pathname.split("/").filter(Boolean);
        const codeIndex = pathSegments.lastIndexOf("code");
        if (codeIndex >= 0 && pathSegments[codeIndex + 1]) {
            return pathSegments[codeIndex + 1];
        }
        return pathSegments[pathSegments.length - 1] ?? "";
    } catch {
        const pathSegments = trimmedValue.split("/").filter(Boolean);
        return pathSegments[pathSegments.length - 1] ?? "";
    }
}

function decodeQRCodeToken(token: string): DecodedQRPayload | null {
    if (!token.startsWith(QR_CODE_TOKEN_PREFIX)) return null;

    const encodedPayload = token.slice(QR_CODE_TOKEN_PREFIX.length);
    if (!encodedPayload) return null;

    try {
        const normalizedBase64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedBase64 = normalizedBase64.padEnd(
            normalizedBase64.length + ((4 - (normalizedBase64.length % 4)) % 4),
            "="
        );
        const jsonPayload = Buffer.from(paddedBase64, "base64").toString("utf8");
        const payload = JSON.parse(jsonPayload) as Partial<DecodedQRPayload>;

        if (payload.v !== 1) return null;
        if (payload.t !== "activity" && payload.t !== "user") return null;
        if (typeof payload.e !== "string" || !UUID_REGEX.test(payload.e)) return null;
        if (typeof payload.i !== "string" || !UUID_REGEX.test(payload.i)) return null;

        return payload as DecodedQRPayload;
    } catch {
        return null;
    }
}


export async function getEvents() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false });

    if (error) {
        console.error("Error fetching events:", error);
        return [];
    }
    return data as Event[];
}

export async function getEventBySlug(slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) return null;
    return data as Event;
}

export async function getUserPoints(eventId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return 0;

    const { data, error } = await supabase
        .from("user_event_points")
        .select("points")
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .single();

    if (error) return 0;
    return data?.points ?? 0;
}





export async function getConnections(eventId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("connections")
        .select(`
      *,
      connected_user:profiles!connections_connected_user_id_fkey(*)
    `)
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching connections:", error);
        return [];
    }
    return data as unknown as Connection[];
}

export async function getRanking(eventId: string, page: number = 0, limit: number = 20) {
    const supabase = await createClient();
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
        .from("user_event_points")
        .select(`
      points,
      user:profiles(*)
    `)
        .eq("event_id", eventId)
        .order("points", { ascending: false })
        .range(from, to);

    if (error) return [];
    return data as unknown as RankingEntry[];
}

export async function processScan(eventId: string, codeIdentifier: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("process_scan", {
        p_event_id: eventId,
        p_code: codeIdentifier,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    return data as ScanResponse;
}

export async function getProfile() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return data;
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const full_name = formData.get("name") as string;
    let instagram = formData.get("instagram") as string;
    let tiktok = formData.get("tiktok") as string;
    const avatar_url = formData.get("avatar_url") as string;

    // Sanitize inputs: remove @ and full URLs, keep only username
    if (instagram) {
        instagram = instagram.replace(/^@/, "").replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, "").split("/")[0];
    }
    if (tiktok) {
        tiktok = tiktok.replace(/^@/, "").replace(/^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?/, "").split("/")[0];
    }

    const updates: ProfileUpdate = { full_name, instagram, tiktok };
    if (avatar_url) updates.avatar_url = avatar_url;

    const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function updateAvatar(avatar_url: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
        .from("profiles")
        .update({ avatar_url })
        .eq("id", user.id);

    if (error) return { error: error.message };
    return { success: true };
}

// Admin Actions

export async function isAdmin(): Promise<boolean> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

    return !!data;
}

export async function createEvent(
    formData: FormData
): Promise<{ error: string } | { success: true; id: string }> {
    if (!(await isAdmin())) return { error: "Unauthorized" };

    const supabase = await createClient();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    const { data, error } = await supabase
        .from("events")
        .insert({ name, description, image_url, start_date, end_date, slug })
        .select("id")
        .single();

    if (error) return { error: error.message };
    return { success: true, id: data.id };
}

export async function updateEvent(
    id: string,
    formData: FormData
): Promise<{ error: string } | { success: true }> {
    if (!(await isAdmin())) return { error: "Unauthorized" };

    const supabase = await createClient();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const updates: EventUpdate = { name, description, start_date, end_date };
    if (image_url) updates.image_url = image_url;

    const { error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function deleteEvent(
    id: string
): Promise<{ error: string } | { success: true }> {
    if (!(await isAdmin())) return { error: "Unauthorized" };
    const supabase = await createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
}

type Activity = {
    id: string;
    event_id: string;
    type: "mission" | "hidden_point";
    name: string;
    description: string | null;
    image_url: string | null;
    points: number;
    identifier: string;
    created_at: string;
};

export async function getActivities(eventId: string, type?: "mission" | "hidden_point") {
    const supabase = await createClient();
    let query = supabase
        .from("activities")
        .select("*")
        .eq("event_id", eventId);

    if (type) {
        query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) return [];
    return data as Activity[];
}

export async function getCompletedMissionIdentifiers(eventId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("scans")
        .select("qrcode_identifier")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .eq("type", "mission");

    if (error || !data) return [];

    return data.map((scan) => scan.qrcode_identifier);
}

export async function getActivity(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data as Activity;
}

export async function createActivity(
    formData: FormData
): Promise<{ error: string } | { success: true }> {
    if (!(await isAdmin())) return { error: "Unauthorized" };

    const supabase = await createClient();
    const event_id = formData.get("event_id") as string;
    const type = formData.get("type") as "mission" | "hidden_point";
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const points = parseInt(formData.get("points") as string);
    const image_url = formData.get("image_url") as string;

    const { error } = await supabase
        .from("activities")
        .insert({ event_id, type, name, description, points, image_url });

    if (error) return { error: error.message };
    return { success: true };
}

export async function updateActivity(
    id: string,
    formData: FormData
): Promise<{ error: string } | { success: true }> {
    if (!(await isAdmin())) return { error: "Unauthorized" };

    const supabase = await createClient();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const points = parseInt(formData.get("points") as string);
    const image_url = formData.get("image_url") as string;

    const updates: ActivityUpdate = { name, description, points };
    if (image_url) updates.image_url = image_url;

    const { error } = await supabase
        .from("activities")
        .update(updates)
        .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function deleteActivity(
    id: string
): Promise<{ error: string } | { success: true }> {
    if (!(await isAdmin())) return { error: "Unauthorized" };
    const supabase = await createClient();
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
}

async function getActiveEventId(supabase: SupabaseServerClient) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("events")
        .select("id")
        .lte("start_date", now)
        .gte("end_date", now)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) return { eventId: null, error: "Erro ao buscar eventos ativos. Tente novamente." };
    if (!data) return { eventId: null, error: "Nenhum evento ativo no momento para realizar conexão." };
    return { eventId: data.id, error: null };
}

async function resolveLegacyActivityEvent(
    supabase: SupabaseServerClient,
    code: string,
    contextEventId: string | null
) {
    if (contextEventId) {
        const { data: scopedActivity, error: scopedActivityError } = await supabase
            .from("activities")
            .select("event_id")
            .eq("identifier", code)
            .eq("event_id", contextEventId)
            .maybeSingle();

        if (scopedActivityError) {
            return { eventId: null, error: "Erro ao verificar atividade. Tente novamente.", belongsOtherEvent: false };
        }

        if (scopedActivity) {
            return { eventId: scopedActivity.event_id, error: null, belongsOtherEvent: false };
        }
    }

    const { data: activity, error: activityError } = await supabase
        .from("activities")
        .select("event_id")
        .eq("identifier", code)
        .maybeSingle();

    if (activityError) {
        return { eventId: null, error: "Erro ao verificar atividade. Tente novamente.", belongsOtherEvent: false };
    }

    if (activity) {
        return {
            eventId: activity.event_id,
            error: null,
            belongsOtherEvent: contextEventId ? activity.event_id !== contextEventId : false,
        };
    }

    return { eventId: null, error: null, belongsOtherEvent: false };
}

async function resolveLegacyUser(supabase: SupabaseServerClient, code: string) {
    const { data: profileByQrIdentifier, error: profileByQrIdentifierError } = await supabase
        .from("profiles")
        .select("id")
        .eq("qr_identifier", code)
        .maybeSingle();

    if (profileByQrIdentifierError) {
        return { found: false, error: "Erro ao verificar usuário. Tente novamente." };
    }

    if (profileByQrIdentifier) {
        return { found: true, error: null };
    }

    const { data: profileById, error: profileByIdError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", code)
        .maybeSingle();

    if (profileByIdError) {
        return { found: false, error: "Erro ao verificar usuário. Tente novamente." };
    }

    return { found: !!profileById, error: null };
}

export async function processQRCodeScan(rawCode: string, contextEventId: string = "") {
    if (!rawCode || rawCode.trim() === "") {
        return { success: false, message: "Código não informado." } as ScanResponse;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "Você precisa estar logado para escanear códigos." } as ScanResponse;
    }

    const codeToken = extractCodeToken(rawCode);
    if (!codeToken) {
        return { success: false, message: NOT_APP_QR_MESSAGE } as ScanResponse;
    }

    const decodedPayload = decodeQRCodeToken(codeToken);
    if (decodedPayload) {
        if (contextEventId && contextEventId !== decodedPayload.e) {
            return { success: false, message: "Esse QR Code pertence a outro evento." } as ScanResponse;
        }

        return processScan(decodedPayload.e, decodedPayload.i);
    }

    if (codeToken.startsWith(QR_CODE_TOKEN_PREFIX)) {
        return { success: false, message: NOT_APP_QR_MESSAGE } as ScanResponse;
    }

    if (!UUID_REGEX.test(codeToken)) {
        return { success: false, message: NOT_APP_QR_MESSAGE } as ScanResponse;
    }

    const legacyUser = await resolveLegacyUser(supabase, codeToken);
    if (legacyUser.error) {
        return { success: false, message: legacyUser.error } as ScanResponse;
    }

    if (!legacyUser.found) {
        const legacyActivity = await resolveLegacyActivityEvent(supabase, codeToken, contextEventId || null);
        if (legacyActivity.error) {
            return { success: false, message: legacyActivity.error } as ScanResponse;
        }

        if (legacyActivity.belongsOtherEvent) {
            return { success: false, message: "Esse QR Code pertence a outro evento." } as ScanResponse;
        }

        if (!legacyActivity.eventId) {
            return { success: false, message: NOT_APP_QR_MESSAGE } as ScanResponse;
        }

        return processScan(legacyActivity.eventId, codeToken);
    }

    if (contextEventId) {
        return processScan(contextEventId, codeToken);
    }

    const activeEvent = await getActiveEventId(supabase);
    if (activeEvent.error || !activeEvent.eventId) {
        return { success: false, message: activeEvent.error ?? "Nenhum evento ativo no momento para realizar conexão." } as ScanResponse;
    }

    return processScan(activeEvent.eventId, codeToken);
}

export async function processCodeScan(code: string) {
    return processQRCodeScan(code);
}
