"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { processScan, updateProfile } from "@/app/actions";
import { Loader2, Camera, X, Edit2, Save, User, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/utils/upload-image";

interface Props {
    user: any;
    event: any;
}

export function QRCodeView({ user, event }: Props) {
    const [mode, setMode] = useState<"view" | "scan">("view");
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.full_name || "");
    const [instagram, setInstagram] = useState(user.instagram || "");
    const [tiktok, setTikTok] = useState(user.tiktok || "");
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        points?: number;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (mode === "scan") {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
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

    const handleSaveProfile = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("instagram", instagram);
        formData.append("tiktok", tiktok);
        formData.append("avatar_url", avatarUrl);

        await updateProfile(formData);
        setLoading(false);
        setIsEditing(false);
        router.refresh();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const { path, error } = await uploadImage(file, "avatars");

        if (error) {
            alert(error);
        } else if (path) {
            setAvatarUrl(path);
        }
        setLoading(false);
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
                    <div id="reader" className="rounded-3xl overflow-hidden border-2 border-primary/50 shadow-2xl" />
                    <p className="text-center text-sm text-muted-foreground">
                        Aponte sua câmera para uma Missão ou QR Code de Usuário
                    </p>
                </div>
            ) : (
                <>
                    {/* Profile Card */}
                    <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6 shadow-xl">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative">
                                        {avatarUrl ? (
                                            <Image
                                                src={avatarUrl}
                                                alt="Avatar"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            user.full_name?.[0]?.toUpperCase() || "U"
                                        )}
                                    </div>
                                    {isEditing && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <Upload className="w-6 h-6 text-white" />
                                        </button>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                    />
                                </div>
                                <div>
                                    {isEditing ? (
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-muted px-2 py-1 rounded-md w-full mb-1"
                                            placeholder="Seu Nome"
                                        />
                                    ) : (
                                        <h2 className="text-xl font-bold">{user.full_name || "Anônimo"}</h2>
                                    )}

                                    {isEditing ? (
                                        <div className="space-y-1 mt-2">
                                            <input
                                                value={instagram}
                                                onChange={(e) => setInstagram(e.target.value)}
                                                className="bg-muted px-2 py-1 rounded-md w-full text-sm"
                                                placeholder="Instagram"
                                            />
                                            <input
                                                value={tiktok}
                                                onChange={(e) => setTikTok(e.target.value)}
                                                className="bg-muted px-2 py-1 rounded-md w-full text-sm"
                                                placeholder="TikTok"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col text-sm text-muted-foreground">
                                            {user.instagram && (
                                                <a
                                                    href={`https://instagram.com/${user.instagram}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-primary hover:underline"
                                                >
                                                    @{user.instagram}
                                                </a>
                                            )}
                                            {user.tiktok && (
                                                <a
                                                    href={`https://tiktok.com/@${user.tiktok}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-primary hover:underline"
                                                >
                                                    @{user.tiktok} (TikTok)
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />)}
                            </button>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="p-4 bg-white rounded-3xl shadow-lg">
                                <QRCodeSVG
                                    value={user.id}
                                    size={250}
                                    level="H"
                                    includeMargin
                                    imageSettings={{
                                        src: avatarUrl || "/favicon.ico",
                                        x: undefined,
                                        y: undefined,
                                        height: 24,
                                        width: 24,
                                        excavate: true,
                                    }}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Mostre este código para outros para conectar <br /> e ganhar pontos!
                            </p>
                        </div>
                    </div>

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
