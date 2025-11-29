"use client";

import { useState } from "react";
import { createEvent, updateEvent } from "@/app/actions";
import { uploadImage, deleteSupabaseFile } from "@/utils/supabase-image";
import { IMAGES_BUCKET } from "@/utils/constants";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
    initialData?: {
        id: string;
        name: string;
        description: string | null;
        start_date: string;
        end_date: string;
        image_url: string | null;
    };
    onSuccess?: () => void;
    redirectUrl?: string;
}

export function EventForm({ initialData, onSuccess, redirectUrl }: Props) {
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
    const router = useRouter();

    const formatDateForInput = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        // Adjust for timezone offset to display correct local time
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 16);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        if (imageUrl) {
            formData.set("image_url", imageUrl);
        }

        let res;
        if (initialData) {
            // For update, we need to ensure dates are sent in ISO format (UTC)
            // The form sends them as local time string, but Supabase expects ISO.
            // Actually, Supabase/Postgres can handle ISO strings with timezone or just timestamps.
            // When we submit the form, the browser sends the value as is (YYYY-MM-DDThh:mm).
            // We might need to convert it back to UTC or let the server handle it.
            // Let's assume for now we send it as is and see if it works, or if we need to append ":00Z" or similar.
            // Usually, sending "2023-10-27T10:00" is interpreted as local time if no timezone info, 
            // but for safety we can convert back to ISO string.
            // However, the action just takes formData.get("start_date").
            // Let's rely on standard behavior first, but for DISPLAY we definitely need the formatter.
            res = await updateEvent(initialData.id, formData);
        } else {
            res = await createEvent(formData);
        }

        if ('success' in res && res.success) {
            if (!initialData) {
                (e.target as HTMLFormElement).reset();
                setImageUrl("");
            }
            router.refresh();
            if (onSuccess) onSuccess();
            if (redirectUrl) {
                router.push(redirectUrl);
            } else if ('id' in res) {
                // If creating new event, redirect to its management page
                router.push(`/admin/events/${res.id}`);
            }
        } else if ('error' in res) {
            alert(res.error);
        }

        setLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const { path, error } = await uploadImage(file);

        if (error) {
            alert(error);
        } else if (path) {
            if (imageUrl) {
                await deleteSupabaseFile(imageUrl);
            }
            setImageUrl(path);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Nome do Evento</label>
                    <input
                        name="name"
                        defaultValue={initialData?.name}
                        placeholder="Nome do Evento"
                        required
                        className="w-full px-4 py-2 rounded-xl bg-background border border-border"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Início</label>
                        <input
                            name="start_date"
                            type="datetime-local"
                            defaultValue={formatDateForInput(initialData?.start_date)}
                            required
                            className="w-full px-4 py-2 rounded-xl bg-background border border-border"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fim</label>
                        <input
                            name="end_date"
                            type="datetime-local"
                            defaultValue={formatDateForInput(initialData?.end_date)}
                            required
                            className="w-full px-4 py-2 rounded-xl bg-background border border-border"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                    <input
                        type="hidden"
                        name="image_url"
                        value={imageUrl}
                    />
                    <div className="flex items-center gap-4 border border-border rounded-xl px-4 py-2 bg-background">
                        <span className="text-muted-foreground flex-1 truncate">
                            {imageUrl ? "Imagem selecionada" : "Selecione uma imagem"}
                        </span>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {imageUrl && (
                <div className="w-full h-32 bg-muted rounded-xl overflow-hidden relative">
                    <Image
                        src={`${IMAGES_BUCKET}/${imageUrl}`}
                        alt="Preview"
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            <textarea
                name="description"
                defaultValue={initialData?.description || ""}
                placeholder="Descrição"
                className="w-full px-4 py-2 rounded-xl bg-background border border-border"
                rows={3}
            />
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
            >
                {loading ? "Salvando..." : (initialData ? "Salvar Alterações" : "Criar Evento")}
            </button>
        </form>
    );
}
