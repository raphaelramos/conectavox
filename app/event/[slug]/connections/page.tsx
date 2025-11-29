import { getConnections, getEventBySlug } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ExternalLink, Scan, Users, User } from "lucide-react";

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
                    <div
                        key={connection.id}
                        className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 transition-all"
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden relative shrink-0">
                            {connection.connected_user?.avatar_url ? (
                                <Image
                                    src={connection.connected_user.avatar_url}
                                    alt={connection.connected_user.full_name || "Avatar"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <User className="w-6 h-6" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">
                                {connection.connected_user?.full_name || "Usuário Anônimo"}
                            </h3>
                            <div className="flex flex-col gap-1">
                                {connection.connected_user?.instagram && (
                                    <a
                                        href={`https://instagram.com/${connection.connected_user.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                                    >
                                        @{connection.connected_user.instagram}
                                    </a>
                                )}
                                {connection.connected_user?.tiktok && (
                                    <a
                                        href={`https://tiktok.com/@${connection.connected_user.tiktok}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                                    >
                                        @{connection.connected_user.tiktok} (TikTok)
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {connection.created_at ? new Date(connection.created_at).toLocaleDateString() : ""}
                        </div>
                    </div>
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
