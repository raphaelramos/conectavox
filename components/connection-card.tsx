"use client";

import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { AVATARS_BUCKET, getSupabaseImageUrl } from "@/utils/constants";
import { Database } from "@/types/database.types";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { twMerge } from "tailwind-merge";

type Connection = Database["public"]["Tables"]["connections"]["Row"] & {
    connected_user: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

interface ConnectionCardProps {
    connection: Connection;
    eventId: string;
}

export function ConnectionCard({ connection, eventId }: ConnectionCardProps) {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const handleProfileModalChange = (open = false) => {
        setIsProfileModalOpen(open);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className={twMerge(
                    "w-full bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 transition-all cursor-pointer text-left",
                )}
                data-slot="connection-card"
            >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold overflow-hidden relative shrink-0">
                    {connection.connected_user?.avatar_url ? (
                        <Image
                            src={getSupabaseImageUrl(connection.connected_user.avatar_url, AVATARS_BUCKET) || ""}
                            alt={connection.connected_user.full_name || "Avatar"}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <User className="w-6 h-6" />
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold">
                        {connection.connected_user?.full_name || "Usuário Anônimo"}
                    </h3>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                        {connection.created_at
                            ? new Date(connection.created_at).toLocaleDateString("pt-BR")
                            : ""}
                        <p>Toque para ver perfil</p>
                    </div>
                </div>
            </button>

            <UserProfileDialog
                open={isProfileModalOpen}
                onOpenChange={handleProfileModalChange}
                user={connection.connected_user}
                eventId={eventId}
            />
        </>
    );
}
