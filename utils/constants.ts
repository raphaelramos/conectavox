export const AVATARS_BUCKET = "avatars";
export const IMAGES_BUCKET = "images";
export const MAX_IMAGE_WIDTH = 1080;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const getSupabaseImageUrl = (path: string, bucket: string = IMAGES_BUCKET) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (!SUPABASE_URL) return null;
    
    const cleanPath = path.replace(/^\/+/, '');
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
};
