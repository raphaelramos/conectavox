"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { processScan } from "@/app/actions";
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

/**
 * Extracts the identifier from a QR code value.
 * If the value is a URL, returns the last segment after the final slash.
 * Otherwise, returns the value as-is.
 */
function extractIdentifierFromUrl(value: string): string {
    if (!value) {
        return "";
    }

    // If it contains a slash, extract the last segment
    if (value.includes("/")) {
        const segments = value.split("/").filter(Boolean);
        return segments[segments.length - 1] || "";
    }

    return value;
}

export function QRCodeView({ user, event }: Props) {
    const [mode, setMode] = useState<"view" | "scan">("view");
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const handleScan = async (detectedCodes: { rawValue: string }[]) => {
        if (isProcessing || detectedCodes.length === 0) return;
        
        setIsProcessing(true);
        setMode("view");

        try {
            const decodedText = detectedCodes[0].rawValue;
            // Extract identifier from URL - get the last segment after the final slash
            const code = extractIdentifierFromUrl(decodedText);

            if (!code) {
                setScanResult({ success: false, message: "QR Code inválido. Código não encontrado." });
                setIsProcessing(false);
                return;
            }

            // Use unified processScan
            const res = await processScan(event.id, code);
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
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`}>
                    <div className="bg-card p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 text-center border border-border">
                        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${scanResult.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                            {scanResult.success ? <User className="w-8 h-8" /> : <X className="w-8 h-8" />}
                        </div>
                        <h3 className="text-xl font-bold">{scanResult.success ? "Sucesso!" : "Ops!"}</h3>
                        <p className="text-muted-foreground">{scanResult.message}</p>
                        {scanResult.points && (
                            <div className="text-2xl font-bold text-primary">+{scanResult.points} pts</div>
                        )}
                        <button
                            onClick={() => setScanResult(null)}
                            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {mode === "scan" ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Escanear QR Code</h2>
                        <button
                            onClick={() => setMode("view")}
                            className="p-2 rounded-full bg-muted hover:bg-muted/80"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="rounded-3xl overflow-hidden border-2 border-primary/50 shadow-2xl">
                        <Scanner
                            onScan={handleScan}
                            onError={(error) => console.error("Scanner error:", error)}
                            constraints={{ facingMode: "environment" }}
                            formats={["qr_code"]}
                            components={{ finder: true }}
                            styles={{ container: { borderRadius: "1.5rem" } }}
                        />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        Aponte sua câmera para o QR Code.
                    </p>
                </div>
            ) : (
                <>
                    <ProfileCard user={user} />

                    {/* Scan Button */}
                    <button
                        onClick={() => setMode("scan")}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <Camera className="w-6 h-6" />
                        Escanear QR Code
                    </button>
                </>
            )}
        </div>
    );
}
