"use client";

import { deleteEvent } from "@/app/actions";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EventCardProps {
    event: {
        id: string;
        name: string;
        start_date: string | null;
        end_date: string | null;
    };
}

export function EventCard({ event }: EventCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.")) {
            return;
        }

        setIsDeleting(true);
        const res = await deleteEvent(event.id);

        if ('error' in res) {
            alert(res.error);
            setIsDeleting(false);
        } else {
            router.refresh();
        }
    };

    return (
        <div
            className="group relative bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
            <Link
                href={`/admin/events/${event.id}`}
                className="flex-1 min-w-0 pr-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <h3 className="font-semibold truncate">{event.name}</h3>
                <p className="text-sm text-muted-foreground">
                    {event.start_date && event.end_date
                        ? `${new Date(event.start_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}`
                        : "Data não definida"}
                </p>
            </Link>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    aria-label={`Remover ${event.name}`}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
