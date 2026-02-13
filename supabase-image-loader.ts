const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function supabaseLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    void width;
    void quality;

    if (!src) return "";

    if (src.startsWith("http://") || src.startsWith("https://")) {
        return src;
    }

    const normalizedSrc = src
        .replace(/^\/+/, "")
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    if (!supabaseUrl) return `/${normalizedSrc}`;
    return `${supabaseUrl}/storage/v1/object/public/${normalizedSrc}`;
}
