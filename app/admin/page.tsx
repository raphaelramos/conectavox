import { getEvents, isAdmin } from "@/app/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateEventSection } from "@/components/admin/create-event-section";
import { EventCard } from "@/components/admin/event-card";

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
                            <EventCard key={event.id} event={event} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
