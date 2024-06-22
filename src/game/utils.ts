export function pickRandom<T extends any>(arry: Array<T>): T {
    return arry[Math.floor(Math.random() * arry.length)];
}


export function requirementsMet(requirements: Record<string, number>, stats: Record<string, number>): boolean {
    for (const key in requirements) {
        if (requirements[key] > (stats[key] ?? 0)) {
            return false;
        }
    }
    return true;
}