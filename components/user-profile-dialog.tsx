"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Instagram, User, X } from "lucide-react";
import { getUserPointsByUserId } from "@/app/actions";
import { getLevelProgress } from "@/lib/levels";
import { AVATARS_BUCKET, getSupabaseImageUrl } from "@/utils/constants";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: Profile | null;
    eventId?: string;
    points?: number;
    rank?: number;
}

export function UserProfileDialog({
    open,
    onOpenChange,
    user,
    eventId,
    points,
    rank,
}: UserProfileDialogProps) {
    const [resolvedPoints, setResolvedPoints] = useState<number | null>(
        typeof points === "number" ? points : null,
    );

    useEffect(() => {
        if (!open) return;

        if (typeof points === "number") {
            setResolvedPoints(points);
            return;
        }

        if (!eventId || !user?.id) {
            setResolvedPoints(0);
            return;
        }

        let isActive = true;
        const loadPoints = async () => {
            const userPoints = await getUserPointsByUserId(eventId, user.id);
            if (!isActive) return;
            setResolvedPoints(userPoints);
        };

        void loadPoints();

        return () => {
            isActive = false;
        };
    }, [open, points, eventId, user?.id]);

    const currentLevel = typeof resolvedPoints === "number" ? getLevelProgress(resolvedPoints).currentLevel : null;
    const isUnder18 = user?.age_group === "under_18";

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    data-slot="user-profile-overlay"
                />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background p-6 shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-slot="user-profile-content"
                >
                    <Dialog.Close asChild>
                        <button
                            type="button"
                            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Fechar"
                        >
                            <X className="size-4" />
                        </button>
                    </Dialog.Close>

                    <Dialog.Title className="text-lg font-semibold">
                        {user?.full_name || "Usuário Anônimo"}
                    </Dialog.Title>
                    {(typeof rank === "number" || typeof resolvedPoints === "number") && (
                        <Dialog.Description className="text-sm text-muted-foreground">
                            {typeof rank === "number" && `#${rank} no ranking`}
                            {typeof rank === "number" && typeof resolvedPoints === "number" && " • "}
                            {typeof resolvedPoints === "number" && `${resolvedPoints} pontos`}
                        </Dialog.Description>
                    )}
                    {(currentLevel || isUnder18) && (
                        <div className="mt-2 flex items-center gap-2">
                            {currentLevel && (
                                <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    Nível {currentLevel}
                                </p>
                            )}
                            {isUnder18 && (
                                <p className="inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600">
                                    Adolescente
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex flex-col items-center gap-4">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                            {user?.avatar_url ? (
                                <Image
                                    src={getSupabaseImageUrl(user.avatar_url, AVATARS_BUCKET) || ""}
                                    alt={user.full_name || "Avatar"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <User className="size-8 text-muted-foreground" />
                            )}
                        </div>

                        <div className="w-full space-y-2">
                            {user?.instagram && (
                                <a
                                    href={`https://instagram.com/${user.instagram}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-gradient-to-br from-primary to-primary/70 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                                >
                                    <Instagram className="size-5" />
                                    <span className="font-medium">Instagram</span>
                                </a>
                            )}

                            {user?.tiktok && (
                                <a
                                    href={`https://tiktok.com/@${user.tiktok}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-black text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-sm"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                    </svg>
                                    <span className="font-medium">TikTok</span>
                                </a>
                            )}

                            {!user?.instagram && !user?.tiktok && (
                                <p className="text-sm text-muted-foreground text-center py-2 bg-muted/50 rounded-xl">
                                    Nenhuma rede social vinculada.
                                </p>
                            )}
                        </div>

                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
