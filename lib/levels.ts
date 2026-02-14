export interface LevelProgress {
    currentLevel: number;
    nextLevel: number | null;
    currentLevelMinPoints: number;
    nextLevelMinPoints: number | null;
    progressPercentage: number;
    pointsToNextLevel: number;
}

export const USER_LEVEL_THRESHOLDS: ReadonlyArray<number> = [
    0,
    20,
    45,
    75,
    110,
    150,
    200,
    260,
    325,
    400,
];

export function getLevelProgress(points: number, thresholds: ReadonlyArray<number> = USER_LEVEL_THRESHOLDS): LevelProgress {
    if (thresholds.length === 0) {
        return {
            currentLevel: 1,
            nextLevel: null,
            currentLevelMinPoints: 0,
            nextLevelMinPoints: null,
            progressPercentage: 100,
            pointsToNextLevel: 0,
        };
    }

    const sanitizedPoints = Math.max(0, points);
    const nextLevelIndex = thresholds.findIndex((minPoints) => sanitizedPoints < minPoints);
    const currentLevelIndex = nextLevelIndex === -1 ? thresholds.length - 1 : Math.max(nextLevelIndex - 1, 0);
    const currentLevelMinPoints = thresholds[currentLevelIndex] ?? 0;
    const nextLevelMinPoints = nextLevelIndex === -1 ? null : thresholds[nextLevelIndex];

    if (nextLevelMinPoints === null) {
        return {
            currentLevel: currentLevelIndex + 1,
            nextLevel: null,
            currentLevelMinPoints,
            nextLevelMinPoints: null,
            progressPercentage: 100,
            pointsToNextLevel: 0,
        };
    }

    const levelRange = nextLevelMinPoints - currentLevelMinPoints;
    const pointsInCurrentRange = sanitizedPoints - currentLevelMinPoints;
    const rawProgress = levelRange > 0 ? (pointsInCurrentRange / levelRange) * 100 : 0;

    return {
        currentLevel: currentLevelIndex + 1,
        nextLevel: currentLevelIndex + 2,
        currentLevelMinPoints,
        nextLevelMinPoints,
        progressPercentage: Math.min(100, Math.max(0, rawProgress)),
        pointsToNextLevel: Math.max(0, nextLevelMinPoints - sanitizedPoints),
    };
}
