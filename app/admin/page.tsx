import { getEvents, deleteEvent, isAdmin } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronRight, Settings, Trash2 } from "lucide-react";
import { CreateEventSection } from "@/components/admin/create-event-section";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    if (!(await isAdmin())) {
        redirect("/");
    }

    const events = await getEvents();

    return (
        <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Painel Admin</h1>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                    Voltar para Home
                </Link>
            </header>

            <div className="grid gap-8">
                <CreateEventSection />

                {/* Events List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Eventos Existentes</h2>
                    {events.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-card border border-border/50 rounded-2xl">
                            <p>Nenhum evento cadastrado</p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-semibold">{event.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {event.start_date && event.end_date
                                            ? `${new Date(event.start_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}`
                                            : "Data não definida"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/events/${event.id}`}
                                        className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium"
                                    >
                                        Gerenciar Conteúdo
                                    </Link>
                                    <form action={async () => {
                                        "use server";
                                        await deleteEvent(event.id);
                                        redirect("/admin");
                                    }}>
                                        <button className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
