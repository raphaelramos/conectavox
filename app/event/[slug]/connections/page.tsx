import { getConnections, getEventBySlug } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Scan, Users } from "lucide-react";
import { ConnectionCard } from "@/components/connection-card";

export default async function ConnectionsPage({
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
        return <div>Evento não encontrado</div>;
    }

    const connections = await getConnections(event.id);

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
                    <h1 className="text-2xl font-bold">Conexões</h1>
                </div>
                <Link
                    href={`/event/${slug}/qrcode`}
                    className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                    <Scan className="w-6 h-6" />
                </Link>
            </header>

            <div className="space-y-4">
                {connections.map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                ))}

                {connections.length === 0 && (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                            Você ainda não se conectou com ninguém. <br />
                            Escaneie o QR code de outros participantes!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
