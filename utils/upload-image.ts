import { createClient } from "@/lib/supabase/client";

const MAX_WIDTH = 500;

export async function uploadImage(
    file: File,
    bucket: "avatars" | "images",
    path?: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
    try {
        const supabase = createClient();

        // Strategy for path generation
        const pathStrategies: Record<string, () => Promise<string | null>> = {
            avatars: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                return user ? `${user.id}` : null;
            },
            images: async () => Promise.resolve(path || ""),
        };

        const getBasePath = pathStrategies[bucket];
        const basePath = await getBasePath();

        if (basePath === null) {
            return { url: null, path: null, error: "Usuário não autenticado." };
        }

        // 1. Resize Image
        const resizedBlob = await resizeImage(file, MAX_WIDTH);

        // 2. Prepare Path
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = basePath ? `${basePath}/${fileName}` : fileName;

        // 3. Upload to Supabase
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, resizedBlob, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { url: null, path: null, error: "Erro ao fazer upload da imagem." };
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        // Return both full URL (for immediate preview if needed) and relative path (for DB)
        // The loader expects "bucket/path/to/file"
        const fullPath = `${bucket}/${filePath}`;

        return { url: publicUrl, path: fullPath, error: null };

    } catch (err) {
        console.error("Image processing error:", err);
        return { url: null, path: null, error: "Erro ao processar imagem." };
    }
}

function resizeImage(file: File, maxWidth: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Canvas to Blob failed"));
                    },
                    file.type,
                    0.8 // Quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
