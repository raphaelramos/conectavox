import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/app/actions";

export async function TopBar() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const admin = await isAdmin();

    return (
        <header className="flex justify-between items-center p-4 md:p-8 max-w-5xl mx-auto w-full">
            <div>
                <Link href="/">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Conecta Vox
                    </h1>
                </Link>
            </div>
            <div className="flex items-center gap-4">
                {admin && (
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
                    >
                        <Settings className="w-4 h-4" />
                        Admin
                    </Link>
                )}
                <form action="/auth/signout" method="post">
                    <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Sair
                    </button>
                </form>
            </div>
        </header>
    );
}
