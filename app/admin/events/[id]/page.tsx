import { getEventBySlug, getActivities, deleteActivity } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Edit, QrCode } from "lucide-react";
import { ActivityForm } from "@/components/admin/activity-form";

import { ActivityQRDialog } from "@/components/admin/activity-qr-dialog";

export default async function EventAdminPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (!eventData) {
        return <div>Event not found</div>;
    }

    const event = eventData as any;

    const missions = await getActivities(id, "mission");
    const hiddenPoints = await getActivities(id, "hidden_point");

    async function deleteActivityAction(activityId: string) {
        "use server";
        await deleteActivity(activityId);
        redirect(`/admin/events/${id}`);
    }

    return (
        <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {event.name}
                            <Link
                                href={`/admin/events/${id}/edit`}
                                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Edit className="w-5 h-5" />
                            </Link>
                        </h1>
                        <p className="text-muted-foreground">Gerenciar missões e pontos</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Missions Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Plus className="w-6 h-6 text-primary" />
                            Missões
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {missions.length} missões
                        </span>
                    </div>

                    <div className="bg-card border border-border/50 rounded-3xl p-6">
                        <ActivityForm eventId={id} type="mission" />
                    </div>

                    <div className="space-y-4">
                        {missions.map((mission) => (
                            <div
                                key={mission.id}
                                className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors group"
                            >
                                <div>
                                    <h3 className="font-semibold">{mission.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {mission.points} pontos
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ActivityQRDialog
                                        name={mission.name}
                                        identifier={mission.identifier}
                                        points={mission.points}
                                    />
                                    <Link
                                        href={`/admin/events/${id}/activities/${mission.id}`}
                                        className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <form action={deleteActivityAction.bind(null, mission.id)}>
                                        <button className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Hidden Points Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <QrCode className="w-6 h-6 text-purple-500" />
                            Pontos Ocultos
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {hiddenPoints.length} pontos
                        </span>
                    </div>

                    <div className="bg-card border border-border/50 rounded-3xl p-6">
                        <ActivityForm eventId={id} type="hidden_point" />
                    </div>

                    <div className="space-y-4">
                        {hiddenPoints.map((point) => (
                            <div
                                key={point.id}
                                className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between hover:border-purple-500/50 transition-colors group"
                            >
                                <div>
                                    <h3 className="font-semibold">{point.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {point.points} pontos
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ActivityQRDialog
                                        name={point.name}
                                        identifier={point.identifier}
                                        points={point.points}
                                    />
                                    <Link
                                        href={`/admin/events/${id}/activities/${point.id}`}
                                        className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <form action={deleteActivityAction.bind(null, point.id)}>
                                        <button className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
