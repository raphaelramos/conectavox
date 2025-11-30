import { getEventBySlug, getProfile } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const QRCodeView = dynamic(() => import("@/components/qrcode-view").then(mod => mod.QRCodeView), {
    ssr: false,
});

export default async function QRCodePage({
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
    const profile = await getProfile();

    if (!event || !profile) {
        return <div>Error loading data</div>;
    }

    return (
        <div className="min-h-screen p-4 pb-20">
            <header className="flex items-center gap-4 mb-8">
                <Link
                    href={`/event/${slug}`}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold">Meu QR Code</h1>
            </header>

            <QRCodeView user={profile} event={event} />
        </div>
    );
}
