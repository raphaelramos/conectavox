export default function supabaseLoader({ src, width, quality }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/render/image/public/${src}?width=${width}&quality=${quality || 75}`;
}
