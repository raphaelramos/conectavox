"use client";

import { useState } from "react";
import { createActivity, updateActivity } from "@/app/actions";
import { uploadImage } from "@/utils/upload-image";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
    eventId: string;
    type: "mission" | "hidden_point";
    initialData?: {
        id: string;
        name: string;
        description: string | null;
        points: number;
        image_url: string | null;
    };
    onSuccess?: () => void;
    redirectUrl?: string;
}

export function ActivityForm({ eventId, type, initialData, onSuccess, redirectUrl }: Props) {
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        if (imageUrl) {
            formData.set("image_url", imageUrl);
        }

        let res;
        if (initialData) {
            res = await updateActivity(initialData.id, formData);
        } else {
            res = await createActivity(formData);
        }

        if ('success' in res && res.success) {
            if (!initialData) {
                (e.target as HTMLFormElement).reset();
                setImageUrl("");
            }
            router.refresh();
            if (onSuccess) onSuccess();
            if (redirectUrl) router.push(redirectUrl);
        } else if ('error' in res) {
            alert(res.error);
        }

        setLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const { path, error } = await uploadImage(file, "images");

        if (error) {
            alert(error);
        } else if (path) {
            setImageUrl(path);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="event_id" value={eventId} />
            <input type="hidden" name="type" value={type} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    name="name"
                    defaultValue={initialData?.name}
                    placeholder={type === "mission" ? "Nome da Missão" : "Nome do Ponto Oculto"}
                    required
                    className="px-4 py-2 rounded-xl bg-background border border-border"
                />
                <input
                    name="points"
                    type="number"
                    defaultValue={initialData?.points}
                    placeholder="Pontos"
                    required
                    className="px-4 py-2 rounded-xl bg-background border border-border"
                />
            </div>

            {type === "mission" && (
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
            )}

            {imageUrl && type === "mission" && (
                <div className="w-full h-32 bg-muted rounded-xl overflow-hidden relative">
                    <Image
                        src={imageUrl}
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
                rows={2}
            />
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
            >
                {loading ? "Salvar" : (initialData ? "Atualizar" : "Adicionar")}
            </button>
        </form>
    );
}
