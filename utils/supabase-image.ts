import { createClient } from "@/lib/supabase/client";
import { IMAGES_BUCKET, MAX_IMAGE_WIDTH } from "./constants";

export const uploadImage = async (file: File, bucket: string = IMAGES_BUCKET, folder?: string) => {
    const resizedFile = await resizeImage(file);
    const supabase = createClient();
    const fileExt = resizedFile.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : `${fileName}`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, resizedFile);

    if (error) {
        return { error: error.message };
    }

    return { path: filePath };
};

export const getPublicImageUrl = (imageUrl: string, bucket: string = IMAGES_BUCKET) => {
    const supabase = createClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(imageUrl);
    return data?.publicUrl ?? null;
};

export const deleteSupabaseFile = async (path: string, bucket: string = IMAGES_BUCKET) => {
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);

    return { error };
};

const resizeImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const { width, height } = img;

            if (width <= MAX_IMAGE_WIDTH) {
                resolve(file);
                return;
            }

            const scaleFactor = MAX_IMAGE_WIDTH / width;
            const newWidth = MAX_IMAGE_WIDTH;
            const newHeight = height * scaleFactor;

            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(file);
                return;
            }

            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            canvas.toBlob((blob) => {
                if (blob) {
                    const resizedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now(),
                    });
                    resolve(resizedFile);
                } else {
                    resolve(file);
                }
            }, file.type, 0.8);
        };

        img.onerror = () => resolve(file);
    });
};
