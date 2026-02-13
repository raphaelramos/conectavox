"use client";

import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, QrCode, X } from "lucide-react";
import { getURL } from "@/lib/utils";
import { buildQRCodeUrl } from "@/lib/qrcode";

interface Props {
    name: string;
    identifier: string;
    points: number;
    eventId: string;
}

export function ActivityQRDialog({ name, identifier, points, eventId }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const qrRef = useRef<HTMLCanvasElement>(null);
    const qrHighResRef = useRef<HTMLCanvasElement>(null);

    const qrValue = buildQRCodeUrl(getURL(), "activity", eventId, identifier);

    const downloadQR = () => {
        if (!qrHighResRef.current) return;

        const sourceCanvas = qrHighResRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = 3000;
        canvas.height = 3000;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear background (transparent)
        ctx.clearRect(0, 0, 3000, 3000);

        // Draw QR Code centered
        // We use a slightly smaller size for the QR to leave room for text
        const qrSize = 2600;
        const x = (3000 - qrSize) / 2;
        const y = 100; // Top padding
        ctx.drawImage(sourceCanvas, x, y, qrSize, qrSize);

        // Draw Text
        ctx.font = "bold 120px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const textY = y + qrSize + 50;
        ctx.fillText(name, 1500, textY);

        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `qrcode-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                title="Ver QR Code"
            >
                <QrCode className="w-4 h-4" />
            </button>

            {/* Hidden High Res QR for generation */}
            <div style={{ display: "none" }}>
                <QRCodeCanvas
                    ref={qrHighResRef}
                    value={qrValue}
                    size={2600}
                    level="H"
                    marginSize={2}
                    bgColor="transparent"
                    fgColor="#000000"
                />
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-6">
                            <div>
                                <h3 className="text-xl font-bold">{name}</h3>
                                <p className="text-muted-foreground">+{points} pontos</p>
                            </div>

                            <div className="flex justify-center p-4 bg-white rounded-2xl shadow-inner">
                                <QRCodeCanvas
                                    ref={qrRef}
                                    value={qrValue}
                                    size={200}
                                    level="H"
                                    marginSize={2}
                                />
                            </div>

                            <button
                                onClick={downloadQR}
                                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Baixar QR Code
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
