import { getActivity } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ActivityForm } from "@/components/admin/activity-form";

export default async function EditActivityPage({
    params,
}: {
    params: Promise<{ id: string; activityId: string }>;
}) {
    const { id, activityId } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const activity = await getActivity(activityId);

    if (!activity) {
        return <div>Activity not found</div>;
    }

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
                    <h1 className="text-2xl font-bold">
                        Editar {activity.type === "mission" ? "Missão" : "Ponto Oculto"}
                    </h1>
                    <p className="text-muted-foreground">{activity.name}</p>
                </div>
            </header>

            <div className="bg-card border border-border/50 rounded-3xl p-6">
                <ActivityForm
                    eventId={id}
                    type={activity.type}
                    initialData={activity}
                    redirectUrl={`/admin/events/${id}`}
                />
            </div>
        </div>
    );
}
