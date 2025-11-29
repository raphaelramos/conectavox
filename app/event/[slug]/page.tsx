import { getEventBySlug, getUserPoints } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { QrCode, Target, Users, Trophy, ChevronLeft, Calendar } from "lucide-react";
import { IMAGES_BUCKET } from "@/utils/constants";

export default async function EventDashboard({
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

    const points = await getUserPoints(event.id);

    const menuItems = [
        {
            title: "QR Code",
            icon: QrCode,
            href: `/event/${slug}/qrcode`,
            color: "bg-blue-500/10 text-blue-500",
            description: "Seu ID & Scanner",
        },
        {
            title: "Missões",
            icon: Target,
            href: `/event/${slug}/missions`,
            color: "bg-purple-500/10 text-purple-500",
            description: "Complete tarefas",
        },
        {
            title: "Conexões",
            icon: Users,
            href: `/event/${slug}/connections`,
            color: "bg-pink-500/10 text-pink-500",
            description: "Pessoas que conheceu",
        },
        {
            title: "Ranking",
            icon: Trophy,
            href: `/event/${slug}/ranking`,
            color: "bg-yellow-500/10 text-yellow-500",
            description: "Classificação",
        },
    ];

    return (
        <div className="min-h-screen pb-20">
            {/* Header Image */}
            <div className="relative h-48 md:h-64 w-full bg-muted overflow-hidden">
                {event.image_url ? (
                    <Image
                        src={`${IMAGES_BUCKET}/${event.image_url}`}
                        alt={event.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

                <Link
                    href="/"
                    className="absolute top-4 left-4 p-2 rounded-full bg-background/50 backdrop-blur-md border border-white/10 text-foreground hover:bg-background/80 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Link>
            </div>

            <div className="px-4 -mt-12 relative z-10 space-y-8 max-w-lg mx-auto">
                {/* Event Info */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{event.name}</h1>
                    <p className="text-muted-foreground text-sm">{event.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {event.start_date && event.end_date
                            ? `${new Date(event.start_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}`
                            : "Data a definir"}
                    </div>
                </div>

                {/* Score Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-xl shadow-primary/25 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-primary-foreground/80 font-medium">Sua Pontuação</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold">{points}</span>
                            <span className="text-xl opacity-80">pts</span>
                        </div>
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:scale-[1.02] active:scale-[0.98] space-y-3 group"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{item.title}</h3>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Instructions */}
                <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Como Participar
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2 pl-4 list-disc">
                        <li>Escaneie QR codes para ganhar pontos:</li>
                        <li>Conecte-se com outros participantes</li>
                        <li>Completando missões</li>
                        <li>Encontrando QRCodes escondidos</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
