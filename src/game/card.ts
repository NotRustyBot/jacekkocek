import { CardDescription } from "./actionResults";
import { Landmark } from "./landmark";
import { FlatStatsData, FlatStats, Ship } from "./ship";
import { pickRandom } from "./utils";

type CardBehaviour = {
    kind: CardBehaviourKind;
    followUp?: CardBehaviour;
    data?: any;
};

export type CardProvider = {
    cardPlayed(id: number): void;
};

export enum Discardability {
    turn = "turn",
    level = "level",
    never = "never",
}

export type CardTemplate = {
    behaviour: CardBehaviour;
    name: string;
    description?: string;
    discardability?: Discardability;
    exhaust?: true;
};

export enum CardBehaviourKind {
    spendStats = "spendStats",
    gainStats = "gainStats",
    awardVictoryPoints = "awardVictoryPoints",
    interactWithLandmark = "interactWithLandmark",
    interactWithRandomLandmark = "interactWithRandomLandmark",
    drawCard = "drawCard",
    nothing = "nothing",
}

export class Card {
    id: number;
    template: CardTemplate;
    discardability: Discardability;
    provider?: CardProvider;

    constructor(id: number, template: CardTemplate, provider?: CardProvider) {
        this.id = id;
        this.template = template;
        this.discardability = template.discardability ?? Discardability.level;
        this.provider = provider;
    }

    public get name(): string {
        return this.template.name;
    }

    public get description(): string {
        return cardTemplateDescribe(this.template);
    }

    canBePlayed(ship: Ship): boolean {
        let allOkay = true;
        let behaviour = this.template.behaviour;
        while (behaviour) {
            const condition = cardBehaviourLookup[behaviour.kind].condition;
            if (condition && !condition(ship, this, behaviour.data)) {
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
            result.push(effect(ship, this, behaviour.data));
            behaviour = behaviour.followUp;
        }

        if (this.template.exhaust) {
            ship.removeCard(this);
        } else {
            ship.graveyardCard(this);
        }

        return result.join("\n");
    }

    static appendbehaviour(cardTemplate: CardTemplate, behaviour: CardBehaviour) {
        let lastBehaviour = cardTemplate.behaviour;
        while (lastBehaviour.followUp) {
            lastBehaviour = lastBehaviour.followUp;
        }
        lastBehaviour.followUp = behaviour;
    }
}

const cardBehaviourLookup: Record<
    CardBehaviourKind,
    {
        condition?: (ship: Ship, card: Card, data?: any) => boolean;
        effect: (ship: Ship, card: Card, data?: any) => string;
        description: (data?: any) => CardDescription;
    }
> = {
    [CardBehaviourKind.spendStats]: {
        description: (data?: any) => ({
            kind: CardBehaviourKind.spendStats,
            details: {
                stats: data.stats as FlatStatsData,
            },
        }),
        condition(ship: Ship, card: Card, data: any) {
            const stats = data.stats as FlatStatsData;
            for (const [key, value] of Object.entries<number>(stats)) {
                if (value > 0) {
                    if (ship.totalStats()[key] < value) {
                        return false;
                    }
                }
            }
            return true;
        },
        effect(ship: Ship, card: Card, data: any) {
            const statsData = data.stats as FlatStatsData;
            const stats = new FlatStats(statsData);
            ship.turnStats.remove(stats);
            return "spent " + stats.toString();
        },
    },

    [CardBehaviourKind.gainStats]: {
        description: (data?: any) => ({
            kind: CardBehaviourKind.gainStats,
            details: {
                stats: data.stats as FlatStatsData,
            },
        }),
        effect(ship: Ship, card: Card, data: any) {
            const statsData = data.stats as FlatStatsData;
            const stats = new FlatStats(statsData);
            ship.turnStats.add(stats);
            return "gained " + stats.toString();
        },
    },
    [CardBehaviourKind.awardVictoryPoints]: {
        description: (data?: any) => ({
            kind: CardBehaviourKind.awardVictoryPoints,
            details: {
                victoryPoints: data.victoryPoints as number,
            },
        }),
        effect(ship: Ship, card: Card, data: any) {
            const victoryPoints = data.victoryPoints as number;
            ship.victoryPoints += victoryPoints;
            return "awarded " + victoryPoints + " victory points";
        },
    },
    [CardBehaviourKind.interactWithLandmark]: {
        description: (data?: any) => ({
            kind: CardBehaviourKind.interactWithLandmark,
            details: {
                interactionType: data.interactionType as string,
            },
        }),
        condition(ship, card, data) {
            return ship.target instanceof Landmark;
        },
        effect(ship: Ship, card: Card, data: any) {
            const result = ship.target.landmarkInteraction(data.interactionType, ship);
            return result;
        },
    },
    [CardBehaviourKind.interactWithRandomLandmark]: {
        description: (data?: any) => ({
            kind: CardBehaviourKind.interactWithRandomLandmark,
            details: {
                interactionType: data.interactionType as string,
            },
        }),
        effect(ship: Ship, card: Card, data: any) {
            const values = [...ship.game.landmarks.values()];
            let valid = values.filter((v) => data.visible == undefined || v.visible == data.visible);
            const pick = pickRandom(valid);

            if (pick) {
                return pick.landmarkInteraction(data.interactionType, ship);
            } else {
                return "no landmarks found";
            }
        },
    },
    [CardBehaviourKind.drawCard]: {
        description: (data?: any) => ({
            kind: CardBehaviourKind.drawCard,
        }),
        effect(ship: Ship, card: Card, data: any) {
            const quantity = data.quantity as number;
            ship.drawCards(quantity);
            return "Drawn " + quantity + " card" + (quantity == 1 ? "" : "s");
        },
    },
    [CardBehaviourKind.nothing]: {
        description: (data?: any) => `Do nothing`,
        effect(ship: Ship, card: Card, data: any) {
            return "Nothing happens";
        },
    },
};

export function cardTemplateDescribe(template: CardTemplate) {
    let behaviour = template.behaviour;
    let result = new Array<string>();
    while (behaviour) {
        const describe = cardBehaviourLookup[behaviour.kind].description;
        result.push(describe(behaviour.data));
        behaviour = behaviour.followUp;
    }
    return result.join("\n") + (template.description ?? "");
}
