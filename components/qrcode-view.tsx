"use client";

import { useState, useEffect, useRef } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { processScan } from "@/app/actions";
import { Camera, X, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./profile-card";

import { Database } from "@/types/database.types";

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
    const router = useRouter();
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        if (mode !== "scan") return;

        let html5QrCode: Html5Qrcode;

        import("html5-qrcode").then(({ Html5Qrcode }) => {
            html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            const qrCodeSuccessCallback = async (decodedText: string) => {
                await html5QrCode.stop();
                setMode("view");

                try {
                    const code = extractIdentifierFromUrl(decodedText);

                    if (!code) {
                        setScanResult({ success: false, message: "QR Code inválido. Código não encontrado." });
                        return;
                    }

                    const res = await processScan(event.id, code);
                    setScanResult(res);
                    if (res.success) {
                        router.refresh();
                    }
                } catch {
                    setScanResult({ success: false, message: "Erro ao processar QR Code. Tente novamente." });
                }
            };

            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: { width: 250, height: 250 } },
                qrCodeSuccessCallback,
                () => {}
            ).catch((err) => {
                console.error("Camera start error:", err);
            });
        });

        return () => {
            scannerRef.current?.stop().catch(() => {});
        };
    }, [mode, event.id, router]);

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
                    <div id="reader" className="rounded-3xl overflow-hidden border-2 border-primary/50 shadow-2xl" />
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
