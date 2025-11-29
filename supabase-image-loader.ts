const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function supabaseLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    return `${supabaseUrl}/storage/v1/render/image/public/${src}?width=${width}&quality=${quality || 75}`;
}
