import { twMerge } from "tailwind-merge";
import { getLevelProgress, USER_LEVEL_THRESHOLDS } from "@/lib/levels";

interface LevelProgressCardProps {
    points: number;
    className?: string;
    levels?: ReadonlyArray<number>;
}

export function LevelProgressCard({ points, className, levels = USER_LEVEL_THRESHOLDS }: LevelProgressCardProps) {
    const {
        currentLevel,
        nextLevel,
        currentLevelMinPoints,
        nextLevelMinPoints,
        progressPercentage,
        pointsToNextLevel,
    } = getLevelProgress(points, levels);
    const progressValue = `${progressPercentage}%`;

    return (
        <div
            data-slot="level-progress-card"
            className={twMerge(
                "p-6 rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-xl shadow-primary/25 relative overflow-hidden space-y-4",
                className,
            )}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />

            <div className="relative z-10 space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-primary-foreground/80 font-medium">Sua Pontuação</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold">{points}</span>
                            <span className="text-xl opacity-80">pts</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Nível atual</p>
                        <p className="text-2xl font-bold">{currentLevel}</p>
                    </div>
                </div>

                <div className="space-y-2" data-slot="level-progress">
                    <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-white transition-all duration-500"
                            style={{ width: progressValue }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-primary-foreground/80">
                        <span>{currentLevelMinPoints} pts</span>
                        <span>{nextLevelMinPoints !== null ? `${nextLevelMinPoints} pts` : "MAX"}</span>
                    </div>
                </div>

                <p className="text-sm text-primary-foreground/90">
                    {nextLevel
                        ? `Faltam ${pointsToNextLevel} pontos para chegar ao nível ${nextLevel}`
                        : "Voce alcancou o nivel maximo"}
                </p>
            </div>
        </div>
    );
}
