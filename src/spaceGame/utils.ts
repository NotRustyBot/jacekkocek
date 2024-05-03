export function flatStatsToString(fs: FlatStats) {
    return Object.entries(fs)
        .map(([k, v]) => `${k}:${v}`)
        .join(" | ");
}

export function pickRandom<T extends any>(arry: Array<T>): T {
    return arry[Math.floor(Math.random() * arry.length)];
}
