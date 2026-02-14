"use client";

import { useState } from "react";
import Image from "next/image";
import { getRanking } from "@/app/actions";
import { Database } from "@/types/database.types";
import { AVATARS_BUCKET, getSupabaseImageUrl } from "@/utils/constants";
import { twMerge } from "tailwind-merge";
import { UserProfileDialog } from "@/components/user-profile-dialog";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface RankingEntry {
    points: number;
    user: Profile | null;
}

interface SelectedRankingEntry extends RankingEntry {
    rank: number;
}

interface Props {
    initialRanking: RankingEntry[];
    eventId: string;
    currentUserId?: string;
}

export function RankingList({ initialRanking, eventId, currentUserId }: Props) {
    const [ranking, setRanking] = useState<RankingEntry[]>(initialRanking);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialRanking.length >= 20);
    const [selectedEntry, setSelectedEntry] = useState<SelectedRankingEntry | null>(null);

    const loadMore = async () => {
        setLoading(true);
        const nextPage = page + 1;
        try {
            const newEntries = await getRanking(eventId, nextPage);

            if (newEntries.length < 20) {
                setHasMore(false);
            }

            setRanking((prev) => [...prev, ...newEntries]);
            setPage(nextPage);
        } catch (error) {
            console.error("Failed to load more ranking entries", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProfileModal = (entry: RankingEntry, rank: number) => {
        setSelectedEntry({ ...entry, rank });
    };

    const handleProfileModalChange = (open = false) => {
        if (!open) {
            setSelectedEntry(null);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {ranking.map((entry, index) => {
                    const isCurrentUser = entry.user?.id === currentUserId;
                    const rank = index + 1;

                    return (
                        <button
                            key={`${entry.user?.id || "unknown"}-${index}`}
                            type="button"
                            onClick={() => handleOpenProfileModal(entry, rank)}
                            className={twMerge(
                                `
                            w-full text-left
                            flex items-center gap-4 p-4 rounded-2xl border
                            hover:border-primary/60 transition-colors
                            ${isCurrentUser
                                        ? "bg-primary/10 border-primary/50"
                                        : "bg-card border-border/50"
                                    }
                        `,
                            )}
                            data-slot="ranking-entry"
                        >
                            <div className="font-bold text-lg w-8 text-center text-muted-foreground">
                                #{rank}
                            </div>

                            <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0 relative">
                                {entry.user?.avatar_url ? (
                                    <Image
                                        src={getSupabaseImageUrl(entry.user.avatar_url, AVATARS_BUCKET) || ""}
                                        alt={entry.user.full_name || "User"}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                                        {entry.user?.full_name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                    {entry.user?.full_name || "Usuário Anônimo"}
                                </p>
                                {isCurrentUser && (
                                    <p className="text-xs text-primary font-medium">Você</p>
                                )}
                            </div>

                            <div className="font-bold text-lg text-primary">
                                {entry.points}
                            </div>
                        </button>
                    );
                })}

                {hasMore && (
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? "Carregando..." : "Carregar Mais"}
                    </button>
                )}
            </div>

            <UserProfileDialog
                open={selectedEntry !== null}
                onOpenChange={handleProfileModalChange}
                user={selectedEntry?.user ?? null}
                eventId={eventId}
                points={selectedEntry?.points}
                rank={selectedEntry?.rank}
            />
        </>
    );
}
