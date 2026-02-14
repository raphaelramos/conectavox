"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getRanking } from "@/app/actions";
import { Database } from "@/types/database.types";
import { AVATARS_BUCKET, getSupabaseImageUrl } from "@/utils/constants";
import { twMerge } from "tailwind-merge";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { Loader2 } from "lucide-react";

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

const RANKING_PAGE_SIZE = 20;

export function RankingList({ initialRanking, eventId, currentUserId }: Props) {
    const [ranking, setRanking] = useState<RankingEntry[]>(initialRanking);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialRanking.length >= RANKING_PAGE_SIZE);
    const [selectedEntry, setSelectedEntry] = useState<SelectedRankingEntry | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const loadingRef = useRef(false);
    const pageRef = useRef(0);
    const hasMoreRef = useRef(initialRanking.length >= RANKING_PAGE_SIZE);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        const nextPage = pageRef.current + 1;

        try {
            const newEntries = await getRanking(eventId, nextPage);

            if (newEntries.length < RANKING_PAGE_SIZE) {
                hasMoreRef.current = false;
                setHasMore(false);
            }

            setRanking((prev) => [...prev, ...newEntries]);
            pageRef.current = nextPage;
        } catch (error) {
            console.error("Failed to load more ranking entries", error);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (!hasMore) return;

        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (!firstEntry?.isIntersecting) return;

                void loadMore();
            },
            { rootMargin: "280px 0px", threshold: 0 },
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, loadMore]);

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

                {hasMore && <div ref={sentinelRef} className="h-2" aria-hidden="true" data-slot="ranking-sentinel" />}

                {loading && (
                    <div className="w-full py-3 rounded-xl bg-secondary/50 text-sm font-medium text-muted-foreground flex items-center justify-center gap-2" data-slot="ranking-loading">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando...
                    </div>
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
