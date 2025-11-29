import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

interface AvatarRequest {
    userId: string;
    avatarUrl: string;
}

async function getFileExtensionFromUrl(url: string): Promise<string> {
    try {
        const urlParts = url.split("?")[0].split(".");
        const fileExt = urlParts[urlParts.length - 1].toLowerCase();
        const validImageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
        return validImageExts.includes(fileExt) ? fileExt : "jpg";
    } catch (error) {
        console.error("Error extracting file extension:", error);
        return "jpg";
    }
}

async function downloadAndUploadAvatar(userId: string, avatarUrl: string) {
    try {
        const avatarResponse = await fetch(avatarUrl);
        if (!avatarResponse.ok || !avatarResponse.body) {
            throw new Error(
                `Failed to download avatar: ${avatarResponse.status} ${avatarResponse.statusText}`
            );
        }

        const imageData = await avatarResponse.arrayBuffer();
        if (!imageData || imageData.byteLength === 0) {
            throw new Error("Downloaded image data is empty.");
        }

        const fileExt = await getFileExtensionFromUrl(avatarUrl);
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const contentType =
            avatarResponse.headers.get("content-type") || "image/jpeg";

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, imageData, {
                contentType: contentType,
                upsert: true,
            });

        if (uploadError) {
            console.error("Supabase upload error details:", uploadError);
            throw new Error(`Failed to upload avatar: ${uploadError.message}`);
        }

        const { error: updateError } = await supabase
            .from("profiles")
            .update({ avatar_url: filePath })
            .eq("id", userId);

        if (updateError) {
            console.error("Supabase profile update error details:", updateError);
            throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        return { success: true, filePath };
    } catch (error: unknown) {
        console.error(
            `Error processing avatar for user ${userId} from ${avatarUrl}:`,
            error
        );
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error occurred during avatar processing";
        return { success: false, error: errorMessage };
    }
}

serve(async (req: Request) => {
    // Return immediately to not block the caller
    const responsePromise = new Response(
        JSON.stringify({ message: "Avatar processing started" }),
        { status: 202, headers: { "Content-Type": "application/json" } }
    );

    try {
        const requestData: AvatarRequest = await req.json();
        const { userId, avatarUrl } = requestData;

        if (!userId || !avatarUrl) {
            console.error("Request is missing userId or avatarUrl:", requestData);
            return new Response(
                JSON.stringify({
                    error: "Missing required fields: userId and avatarUrl",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Process the avatar in the background
        const processPromise = async () => {
            try {
                const result = await downloadAndUploadAvatar(userId, avatarUrl);
                console.log(
                    `Avatar processing ${result.success ? "succeeded" : "failed"} for user ${userId}`
                );
            } catch (error) {
                console.error(
                    `Unhandled error processing avatar for user ${userId}:`,
                    error
                );
            }
        };

        // Use EdgeRuntime.waitUntil to run the process in the background
        // without blocking the response
        // @ts-ignore - EdgeRuntime is available in Deno Deploy
        EdgeRuntime.waitUntil(processPromise());

        return responsePromise;
    } catch (error: any) {
        console.error("Error parsing request:", error);
        return new Response(
            JSON.stringify({
                error: "Invalid request format",
                details: error.message,
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
});
