"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { updateProfile, updateAvatar } from "@/app/actions";
import { Loader2, Edit2, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadImage, getPublicImageUrl, deleteSupabaseFile } from "@/utils/supabase-image";
import { AVATARS_BUCKET } from "@/utils/constants";
import { getURL } from "@/lib/utils";

import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
    user: Profile;
}

export function ProfileCard({ user }: Props) {
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

    const displayAvatarUrl = avatarUrl
        ? getPublicImageUrl(avatarUrl, AVATARS_BUCKET)
        : null;

    return (
        <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative">
                            {displayAvatarUrl ? (
                                <Image
                                    src={`${AVATARS_BUCKET}/${avatarUrl}`}
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
                <button
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />)}
                </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-4 bg-white rounded-3xl shadow-lg">
                    <QRCodeSVG
                        value={`${getURL()}code/${user.id}`}
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
