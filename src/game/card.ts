import { FlatStatsData as FlatStatsData, FlatStats, Ship } from "./ship";

type CardBehaviour = {
    kind: CardBehaviourKind;
    followUp?: CardBehaviour;
    data: any;
}
export type CardTemplate = {
    behaviour: CardBehaviour;
    name: string;
    description: string;
}

enum CardBehaviourKind {
    spendStats = "spendStats",
    gainStats = "gainStats",
}

export class Card {
    id: number;
    template: CardTemplate;

    public get name(): string {
        return this.template.name;
    }

    public get description(): string {
        return this.template.description;
    }

    canBePlayed(ship: Ship): boolean {
        let allOkay = true;
        let behaviour = this.template.behaviour;
        while (behaviour) {
            const condition = cardBehaviourLookup[behaviour.kind].condition;
            if (!condition(ship, behaviour.data)) {
                allOkay = false;
                break;
            }
            behaviour = behaviour.followUp;
        }
        return allOkay;
    }

    play(ship: Ship): string {
        let behaviour = this.template.behaviour;
        let result = new Array<string>();
        while (behaviour) {
            const effect = cardBehaviourLookup[behaviour.kind].effect;
            result.push(effect(ship, behaviour.data));
            behaviour = behaviour.followUp;
        }
        return result.join("\n");
    }
}


const cardBehaviourLookup: Record<CardBehaviourKind, {
    condition: (ship: Ship, data?: any) => boolean;
    effect: (ship: Ship, data?: any) => string;
}> = {
    [CardBehaviourKind.spendStats]: {
        condition(ship: Ship, data: any) {
            const stats = data.stats as FlatStatsData;
            for (const [key, value] of Object.entries<number>(stats)) {
                if (value > 0) {
                    if (ship.totalStats()[key] < value) {
                        return false;
                    }
                }
            }
        },
        effect(ship: Ship, data: any) {
            const statsData = data.stats as FlatStatsData;
            const stats = new FlatStats(statsData)
            ship.turnStats.remove(stats);
            return "spent " + stats.toString();
        }
    },
    [CardBehaviourKind.gainStats]: {
        condition(ship: Ship, data: any) {
            return true;
        },

        effect(ship, data) {
            const statsData = data.stats as FlatStatsData;
            const stats = new FlatStats(statsData)
            ship.turnStats.add(stats);
            return "gained " + stats.toString();
        },
    }
}