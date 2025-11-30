"use client";

import { useState } from "react";
import { ActivityForm } from "@/components/admin/activity-form";
import { Plus, X } from "lucide-react";

interface Props {
    eventId: string;
    type: "mission" | "hidden_point";
}

export function CreateActivityForm({ eventId, type }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-4 rounded-3xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary font-medium"
            >
                <Plus className="w-5 h-5" />
                {type === "mission" ? "Nova Missão" : "Novo Ponto Oculto"}
            </button>
        );
    }

    return (
        <div className="bg-card border border-border/50 rounded-3xl p-6 relative animate-in fade-in slide-in-from-top-4 duration-200">
            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
                <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
                <h3 className="text-lg font-semibold">
                    {type === "mission" ? "Nova Missão" : "Novo Ponto Oculto"}
                </h3>
            </div>
            <ActivityForm
                eventId={eventId}
                type={type}
                onSuccess={() => setIsOpen(false)}
            />
        </div>
    );
}
