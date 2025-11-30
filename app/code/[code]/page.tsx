"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { processCodeScan } from "@/app/actions";
import { Loader2, CheckCircle, XCircle, Home } from "lucide-react";
import Link from "next/link";

interface ScanResult {
    success: boolean;
    message: string;
    points?: number;
    name?: string;
}

type ProcessingState = "loading" | "success" | "error";

export default function CodePage() {
    const params = useParams();
    const router = useRouter();
    const [state, setState] = useState<ProcessingState>("loading");
    const [result, setResult] = useState<ScanResult | null>(null);

    const code = params.code as string;

    useEffect(() => {
        const processCode = async () => {
            if (!code) {
                setState("error");
                setResult({ success: false, message: "Código não informado." });
                return;
            }

            // Extract identifier from URL if full URL was passed
            const identifier = extractIdentifier(code);

            try {
                const response = await processCodeScan(identifier);
                setResult(response);
                setState(response.success ? "success" : "error");
            } catch {
                setState("error");
                setResult({ success: false, message: "Erro ao processar o código. Tente novamente." });
            }
        };

        processCode();
    }, [code]);

    const extractIdentifier = (value: string): string => {
        // If it's a full URL, extract the last segment
        if (value.includes("/")) {
            const segments = value.split("/").filter(Boolean);
            return segments[segments.length - 1];
        }
        return value;
    };

    const handleGoToEvents = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <div className="bg-card border border-border/50 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
                {state === "loading" && (
                    <LoadingState />
                )}

                {state === "success" && result && (
                    <SuccessState result={result} onGoToEvents={handleGoToEvents} />
                )}

                {state === "error" && result && (
                    <ErrorState result={result} onGoToEvents={handleGoToEvents} />
                )}
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <>
            <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold">Processando...</h2>
            <p className="text-muted-foreground">
                Aguarde enquanto validamos seu código.
            </p>
        </>
    );
}

interface StateProps {
    result: ScanResult;
    onGoToEvents: () => void;
}

function SuccessState({ result, onGoToEvents }: StateProps) {
    return (
        <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-500">Sucesso!</h2>
            <p className="text-muted-foreground">{result.message}</p>
            {result.points && (
                <div className="text-3xl font-bold text-primary">
                    +{result.points} pts
                </div>
            )}
            {result.name && (
                <p className="text-lg font-medium">{result.name}</p>
            )}
            <ActionButtons onGoToEvents={onGoToEvents} />
        </>
    );
}

function ErrorState({ result, onGoToEvents }: StateProps) {
    return (
        <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 mx-auto flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-red-500">Ops!</h2>
            <p className="text-muted-foreground">{result.message}</p>
            <ActionButtons onGoToEvents={onGoToEvents} />
        </>
    );
}

interface ActionButtonsProps {
    onGoToEvents: () => void;
}

function ActionButtons({ onGoToEvents }: ActionButtonsProps) {
    return (
        <div className="space-y-3 pt-4">
            <button
                onClick={onGoToEvents}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
                <Home className="w-5 h-5" />
                Ir para Eventos
            </button>
            <Link
                href="/"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                Voltar ao início
            </Link>
        </div>
    );
}
