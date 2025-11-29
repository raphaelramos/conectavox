import { isAdmin } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/event-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EditEventPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (!(await isAdmin())) {
        redirect("/");
    }

    const supabase = await createClient();
    const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (!event) {
        return <div>Event not found</div>;
    }

    const typedEvent = event as {
        id: string;
        name: string;
        description: string | null;
        start_date: string;
        end_date: string;
        image_url: string | null;
    };

    return (
        <div className="min-h-screen p-8 max-w-2xl mx-auto space-y-8">
            <header className="flex items-center gap-4">
                <Link
                    href={`/admin/events/${id}`}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Editar Evento</h1>
                    <p className="text-muted-foreground text-sm">{typedEvent.name}</p>
                </div>
            </header>

            <div className="bg-card border border-border/50 rounded-3xl p-6">
                <EventForm
                    initialData={typedEvent}
                    redirectUrl={`/admin/events/${id}`}
                />
            </div>
        </div>
    );
}
