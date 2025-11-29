"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EventForm } from "./event-form";

export function CreateEventSection() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <section className="space-y-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xl font-semibold hover:opacity-80 transition-opacity w-full text-left"
            >
                <div className={`p-1 rounded-full bg-primary/10 text-primary transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
                    <Plus className="w-5 h-5" />
                </div>
                Novo Evento
            </button>

            {isOpen && (
                <div className="bg-card border border-border/50 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <EventForm onSuccess={() => setIsOpen(false)} />
                </div>
            )}
        </section>
    );
}
