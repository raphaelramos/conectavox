"use client";

import { useState } from "react";
import Image from "next/image";
import { User, Instagram } from "lucide-react";
import { AVATARS_BUCKET } from "@/utils/constants";
import { Database } from "@/types/database.types";

type Connection = Database["public"]["Tables"]["connections"]["Row"] & {
    connected_user: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

interface ConnectionCardProps {
    connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    return (
        <div
            onClick={toggleExpanded}
            className={`bg-card border border-border/50 rounded-2xl p-4 flex flex-col gap-4 hover:border-primary/50 transition-all cursor-pointer ${isExpanded ? "border-primary ring-1 ring-primary/50" : ""
                }`}
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden relative shrink-0">
                    {connection.connected_user?.avatar_url ? (
                        <Image
                            src={`${AVATARS_BUCKET}/${connection.connected_user.avatar_url}`}
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
                    <div className="text-xs text-muted-foreground">
                        {connection.created_at
                            ? new Date(connection.created_at).toLocaleDateString("pt-BR")
                            : ""}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                    {connection.connected_user?.instagram && (
                        <a
                            href={`https://instagram.com/${connection.connected_user.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[120px] bg-gradient-to-br from-purple-600 to-pink-600 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Instagram className="w-5 h-5" />
                            <span className="font-medium">Instagram</span>
                        </a>
                    )}
                    {connection.connected_user?.tiktok && (
                        <a
                            href={`https://tiktok.com/@${connection.connected_user.tiktok}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[120px] bg-black text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-sm"
                            onClick={(e) => e.stopPropagation()}
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
                    {!connection.connected_user?.instagram && !connection.connected_user?.tiktok && (
                        <p className="text-sm text-muted-foreground w-full text-center py-2 bg-muted/50 rounded-xl">
                            Nenhuma rede social vinculada.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
