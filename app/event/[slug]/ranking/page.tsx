import { getEventBySlug, getRanking } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { RankingList } from "@/components/ranking-list";

export default async function RankingPage({
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

    const ranking = await getRanking(event.id);

    return (
        <div className="min-h-screen p-4 pb-20 max-w-2xl mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <Link
                    href={`/event/${slug}`}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold">Ranking</h1>
            </header>

            <RankingList
                initialRanking={ranking}
                eventId={event.id}
                currentUserId={user.id}
            />
        </div>
    );
}
