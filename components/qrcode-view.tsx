"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { processScan } from "@/app/actions";
import { Camera, X, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./profile-card";

interface Props {
    user: any;
    event: any;
}

export function QRCodeView({ user, event }: Props) {
    const [mode, setMode] = useState<"view" | "scan">("view");
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        points?: number;
    } | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (mode === "scan") {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [0], // 0 == Html5QrcodeScanType.SCAN_TYPE_CAMERA
                    showTorchButtonIfSupported: true
                },
        /* verbose= */ false
            );

            scanner.render(
                async (decodedText) => {
                    scanner.clear();
                    setMode("view");
                    setLoading(true);

                    try {
                        // Use unified processScan
                        const res = await processScan(event.id, decodedText);
                        setScanResult(res);
                        if (res.success) {
                            router.refresh();
                        }
                    } catch (error) {
                        setScanResult({ success: false, message: "Erro ao processar QR Code" });
                    } finally {
                        setLoading(false);
                    }
                },
                (error) => {
                    // console.warn(error);
                }
            );

            return () => {
                scanner.clear().catch(console.error);
            };
        }
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
                        Aponte sua câmera para uma Missão ou QR Code de Usuário
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
