"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { processQRCodeScan } from "@/app/actions";
import { Camera, X, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./profile-card";

import { Database } from "@/types/database.types";

// SSR-safe import
const Scanner = dynamic(
    () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
    { ssr: false }
);

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Event = Database["public"]["Tables"]["events"]["Row"];

interface ScanResult {
    success: boolean;
    message: string;
    points?: number;
}

interface Props {
    user: Profile;
    event: Event;
}

export function QRCodeView({ user, event }: Props) {
    const [mode, setMode] = useState<"view" | "scan">("view");
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    // Trigger confetti on successful scan
    useEffect(() => {
        if (scanResult?.success) {
            import("canvas-confetti").then((confetti) => {
                confetti.default({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 9999, // Ensure it's above the modal
                });
            });
        }
    }, [scanResult]);

    const handleScan = async (detectedCodes: { rawValue: string }[]) => {
        if (isProcessing || detectedCodes.length === 0) return;

        setIsProcessing(true);
        setMode("view");

        try {
            const decodedText = detectedCodes[0].rawValue;
            const res = await processQRCodeScan(decodedText, event.id);
            setScanResult(res);
            if (res.success) {
                router.refresh();
            }
        } catch {
            setScanResult({ success: false, message: "Erro ao processar QR Code. Tente novamente." });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-8">
            {/* Scan Result Modal/Toast */}
            {scanResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-6 text-center border border-border animate-in zoom-in-95 duration-300 relative overflow-hidden">

                        {/* Background subtle glow effect */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${scanResult.success ? "from-green-400 via-green-500 to-green-400" : "from-red-400 via-red-500 to-red-400"}`} />

                        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${scanResult.success
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 ring-4 ring-green-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 ring-4 ring-red-500/20"
                            }`}>
                            {scanResult.success ? (
                                <User className="w-10 h-10 animate-bounce" />
                            ) : (
                                <X className="w-10 h-10" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight">
                                {scanResult.success ? "Sucesso!" : "Algo deu errado"}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {scanResult.message}
                            </p>
                        </div>

                        {scanResult.points && (
                            <div className="py-3 px-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-1">
                                    Pontos Ganhos
                                </p>
                                <div className="text-4xl font-black text-yellow-500 animate-pulse">
                                    +{scanResult.points}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setScanResult(null);
                                if (!scanResult.success) {
                                    setMode("scan");
                                }
                            }}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-[0.98] ${scanResult.success
                                    ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30"
                                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                                }`}
                        >
                            {scanResult.success ? "Continuar" : "Tentar Novamente"}
                        </button>
                    </div>
                </div>
            )}

            {mode === "scan" ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Escanear QR Code</h2>
                        <button
                            onClick={() => setMode("view")}
                            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="rounded-3xl overflow-hidden border-2 border-primary/50 shadow-2xl aspect-square relative z-0">
                        <Scanner
                            onScan={handleScan}
                            onError={(error) => console.error("Scanner error:", error)}
                            constraints={{ facingMode: "environment" }}
                            formats={["qr_code"]}
                            components={{ finder: true }}
                            styles={{
                                container: { width: "100%", height: "100%" },
                                video: { width: "100%", height: "100%", objectFit: "cover" }
                            }}
                        />
                    </div>
                    <p className="text-center text-sm text-muted-foreground animate-pulse">
                        Procurando QR Code...
                    </p>
                </div>
            ) : (
                <>
                    <ProfileCard user={user} eventId={event.id} />

                    {/* Scan Button */}
                    <button
                        onClick={() => setMode("scan")}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                    >
                        <Camera className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        Escanear QR Code
                    </button>
                </>
            )}
        </div>
    );
}
