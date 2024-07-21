import { VariableRange } from "./variables";

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

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};


export function variableRangeString(range: VariableRange): string {
    return JSON.stringify(range);
}