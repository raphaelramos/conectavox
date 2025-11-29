"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";

type Event = Database["public"]["Tables"]["events"]["Row"];
type Mission = Database["public"]["Tables"]["missions"]["Row"];
type HiddenPoint = Database["public"]["Tables"]["hidden_points"]["Row"];
type Connection = Database["public"]["Tables"]["connections"]["Row"] & {
    connected_user: Database["public"]["Tables"]["profiles"]["Row"] | null;
};
type RankingEntry = {
    points: number;
    user: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

export async function getEvents() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

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
    return (data as any).points;
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
    } as any);

    if (error) {
        return { success: false, message: error.message };
    }

    return data as { success: boolean; message: string; points?: number; name?: string };
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

    // Sanitize inputs: remove @ and full URLs, keep only username
    if (instagram) {
        instagram = instagram.replace(/^@/, "").replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//, "").split("/")[0];
    }
    if (tiktok) {
        tiktok = tiktok.replace(/^@/, "").replace(/^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?/, "").split("/")[0];
    }

    const { error } = await (supabase
        .from("profiles") as any)
        .update({ full_name, instagram, tiktok })
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

    const { data, error } = await (supabase
        .from("events") as any)
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
    // We probably don't want to update the slug automatically as it breaks URLs, 
    // or maybe we do but it's risky. For now, let's keep slug as is or update it if name changes? 
    // Usually changing slug breaks SEO and links. Let's NOT update slug for now unless explicitly requested.

    const updates: any = { name, description, start_date, end_date };
    if (image_url) updates.image_url = image_url;

    const { error } = await (supabase
        .from("events") as any)
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
    const { error } = await (supabase.from("events") as any).delete().eq("id", id);
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

    const { error } = await (supabase
        .from("activities") as any)
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

    const updates: any = { name, description, points };
    if (image_url) updates.image_url = image_url;

    const { error } = await (supabase
        .from("activities") as any)
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
    const { error } = await (supabase.from("activities") as any).delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
}
