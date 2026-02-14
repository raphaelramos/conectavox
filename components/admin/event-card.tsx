"use client";

import { deleteEvent } from "@/app/actions";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const canDelete = deleteConfirmationText.trim().toLowerCase() === "excluir";

    const handleDelete = async () => {
        if (!canDelete || isDeleting) return;
        setIsDeleting(true);
        const res = await deleteEvent(event.id);

        if ('error' in res) {
            alert(res.error);
            setIsDeleting(false);
            return;
        }

        setIsDeleteModalOpen(false);
        setDeleteConfirmationText("");
        router.refresh();
    };

    const handleDeleteModalChange = (open = false) => {
        setIsDeleteModalOpen(open);
        if (!open) {
            setDeleteConfirmationText("");
        }
    };

    return (
        <>
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
                        type="button"
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isDeleting}
                        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        aria-label={`Remover ${event.name}`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <Dialog.Root open={isDeleteModalOpen} onOpenChange={handleDeleteModalChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background p-6 shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Fechar"
                            >
                                <X className="size-4" />
                            </button>
                        </Dialog.Close>

                        <Dialog.Title className="text-lg font-semibold text-destructive">
                            Excluir evento
                        </Dialog.Title>
                        <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                            Essa ação não pode ser desfeita. Para confirmar, digite <strong>excluir</strong>.
                        </Dialog.Description>

                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-foreground truncate">{event.name}</p>
                            <Input
                                value={deleteConfirmationText}
                                onChange={(event) => setDeleteConfirmationText(event.target.value)}
                                placeholder='Digite "excluir"'
                                data-slot="delete-event-confirmation-input"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <Dialog.Close asChild>
                                <Button type="button" variant="outline" disabled={isDeleting}>
                                    Cancelar
                                </Button>
                            </Dialog.Close>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={!canDelete || isDeleting}
                            >
                                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                Excluir
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
