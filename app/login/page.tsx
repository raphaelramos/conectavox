"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ChevronLeft } from "lucide-react";
import { translateSupabaseError } from "@/utils/supabase-errors";

type ViewState = "initial" | "login" | "signup";

export default function LoginPage() {
    const [view, setView] = useState<ViewState>("initial");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === "signup") {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                        data: {
                            full_name: name,
                        },
                    },
                });
                if (error) throw error;

                if (data.session) {
                    router.refresh();
                    router.push("/");
                } else {
                    setMessage("Cadastro realizado! Verifique seu e-mail para confirmar.");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.refresh();
                router.push("/");
            }
        } catch (err: any) {
            setError(translateSupabaseError(err));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setError(null);
        setMessage(null);
        setEmail("");
        setPassword("");
        setName("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px]" />
            </div>

            <div className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl transition-all duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                        Conecta Vox
                    </h1>
                    <p className="text-muted-foreground">
                        {view === "initial" && "Bem-vindo ao evento"}
                        {view === "login" && "Bem-vindo de volta"}
                        {view === "signup" && "Crie sua conta"}
                    </p>
                </div>

                {view === "initial" ? (
                    <div className="space-y-4">
                        <button
                            onClick={() => { setView("signup"); resetForm(); }}
                            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Cadastrar
                        </button>
                        <button
                            onClick={() => { setView("login"); resetForm(); }}
                            className="w-full py-4 rounded-xl bg-card border-2 border-primary/20 text-primary font-bold text-lg hover:bg-primary/5 hover:border-primary/50 transition-all"
                        >
                            Entrar
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleAuth} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {view === "signup" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Nome Completo"
                                    autoComplete="name"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">E-mail</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="voce@exemplo.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="p-3 rounded-lg bg-green-500/10 text-green-500 text-sm text-center">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {view === "signup" ? "Cadastrar" : "Entrar"}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setView("initial"); resetForm(); }}
                            className="w-full py-2 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" /> Voltar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
