import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Definido manualmente para produção
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automaticamente definido pela Vercel
    "http://localhost:3000";
  // Garantir que inclua https:// quando não for localhost
  url = url.startsWith("http") ? url : `https://${url}`;
  // Garantir que termine com /
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
}
