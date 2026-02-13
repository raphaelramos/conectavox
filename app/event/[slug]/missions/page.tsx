import { getEventBySlug, getActivities, getCompletedMissionIdentifiers } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, Target, Scan } from "lucide-react";
import { IMAGES_BUCKET, getSupabaseImageUrl } from "@/utils/constants";

export default async function MissionsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const event = await getEventBySlug(slug);

    if (!event) {
        return <div>Event not found</div>;
    }

    const [missions, completedMissionIdentifiers] = await Promise.all([
        getActivities(event.id, "mission"),
        getCompletedMissionIdentifiers(event.id),
    ]);
    const completedMissionSet = new Set(completedMissionIdentifiers);

    return (
        <div className="min-h-screen p-4 pb-20 max-w-2xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/event/${slug}`}
                        className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold">Missões</h1>
                </div>
                <Link
                    href={`/event/${slug}/qrcode`}
                    className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                    <Scan className="w-6 h-6" />
                </Link>
            </header>

            <div className="space-y-4">
                {missions.map((mission) => {
                    const isCompleted = completedMissionSet.has(mission.identifier);

                    return (
                        <div
                            key={mission.id}
                            className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all group"
                        >
                        <div className="w-full h-48 bg-muted relative">
                            {mission.image_url ? (
                                <Image
                                    src={getSupabaseImageUrl(mission.image_url, IMAGES_BUCKET) || ""}
                                    alt={mission.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-purple-500/10 text-purple-500">
                                    <Target className="w-12 h-12" />
                                </div>
                            )}
                            {isCompleted && (
                                <div className="absolute top-4 left-4">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-600 text-white shadow-lg px-2.5 py-1 text-xs font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Concluída
                                    </span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
                                    +{mission.points} pts
                                </span>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            <h3 className="font-semibold text-lg">{mission.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {mission.description}
                            </p>
                        </div>
                        </div>
                    );
                })}

                {missions.length === 0 && (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Target className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Nenhuma missão disponível ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
