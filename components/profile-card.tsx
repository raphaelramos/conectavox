"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { updateProfile, updateAvatar } from "@/app/actions";
import { Loader2, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadImage, deleteSupabaseFile } from "@/utils/supabase-image";
import { AVATARS_BUCKET, getSupabaseImageUrl } from "@/utils/constants";
import { getURL } from "@/lib/utils";
import { buildQRCodeUrl } from "@/lib/qrcode";

import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
    user: Profile;
    eventId: string;
}

export function ProfileCard({ user, eventId }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.full_name || "");
    const [instagram, setInstagram] = useState(user.instagram || "");
    const [tiktok, setTikTok] = useState(user.tiktok || "");
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleSaveProfile = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("instagram", instagram);
        formData.append("tiktok", tiktok);
        formData.append("avatar_url", avatarUrl);

        await updateProfile(formData);
        setLoading(false);
        setIsEditing(false);
        router.refresh();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const { path, error } = await uploadImage(file, AVATARS_BUCKET, user.id);

        if (error) {
            alert(error);
            setLoading(false);
            return;
        }

        if (path) {
            // Delete old avatar if exists
            if (avatarUrl) {
                await deleteSupabaseFile(avatarUrl, AVATARS_BUCKET);
            }

            setAvatarUrl(path);
            // Immediate save
            await updateAvatar(path);
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative">
                            {avatarUrl ? (
                                <Image
                                    src={getSupabaseImageUrl(avatarUrl, AVATARS_BUCKET) || ""}
                                    alt="Avatar"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                user.full_name?.[0]?.toUpperCase() || "U"
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <Upload className="w-6 h-6 text-white" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div>
                        {isEditing ? (
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-muted px-2 py-1 rounded-md w-full mb-1"
                                placeholder="Seu Nome"
                            />
                        ) : (
                            <h2 className="text-xl font-bold">{user.full_name || "Anônimo"}</h2>
                        )}

                        {isEditing ? (
                            <div className="space-y-1 mt-2">
                                <input
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    className="bg-muted px-2 py-1 rounded-md w-full text-sm"
                                    placeholder="Instagram"
                                />
                                <input
                                    value={tiktok}
                                    onChange={(e) => setTikTok(e.target.value)}
                                    className="bg-muted px-2 py-1 rounded-md w-full text-sm"
                                    placeholder="TikTok"
                                />
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="w-full mt-4 bg-primary text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors font-medium"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col text-sm text-muted-foreground">
                                {user.instagram && (
                                    <a
                                        href={`https://instagram.com/${user.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary hover:underline"
                                    >
                                        @{user.instagram}
                                    </a>
                                )}
                                {user.tiktok && (
                                    <a
                                        href={`https://tiktok.com/@${user.tiktok}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary hover:underline"
                                    >
                                        @{user.tiktok} (TikTok)
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                        Editar perfil
                    </button>
                )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-4 bg-white rounded-3xl shadow-lg">
                    <QRCodeSVG
                        value={buildQRCodeUrl(getURL(), "user", eventId, user.qr_identifier)}
                        size={200}
                        level="H"
                    />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                    Mostre este código para outros para conectar <br /> e ganhar pontos!
                </p>
            </div>
        </div>
    );
}
