import { CardTemplate, cardTemplateDescribe } from "./card";
import { Game } from "./game";
import { FlatStats, FlatStatsData, Ship } from "./ship";
import { pickRandom } from "./utils";

type LandmarkAugmentedPassiveBehaviour =
    | {
          type: LandmarkPassiveBehaviourType.changeVisibility;
          data: {
              visible: boolean;
          };
      }
    | {
          type: LandmarkPassiveBehaviourType.interactWithEveryone;
          data: FollowUp;
      }
    | {
          type: LandmarkPassiveBehaviourType.pickRandomShip;
          data: FollowUp;
      }
    | {
          type: LandmarkPassiveBehaviourType.spendStat;
          data: { stat: string; whenAvailable: FollowUp; whenNotAvailable?: FollowUp };
      }
    | {
          type: LandmarkPassiveBehaviourType.checkStat;
          data: { stat: string; whenAvailable: FollowUp; whenNotAvailable?: FollowUp };
      };

export enum LandmarkInteractionType {
    discover = "discover",
    attack = "attack",
    capture = "capture",
}

export enum LandmarkPassiveEventType {
    turnStart = "turnStart",
    turnEnd = "turnEnd",
}

export type LandmarkInteractionIntercept = {
    tags: Array<string>;
    quantity: number;
    type: LandmarkInteractionType | Array<LandmarkInteractionType>;
    action: FollowUp;
    interrupt: boolean;
};

export type LandmarkTemplate = {
    name: string;
    tags?: Array<string>;
    interactions: Partial<Record<LandmarkInteractionType, null | LandmarkAugmentedInteractionBehaviour | Array<LandmarkAugmentedInteractionBehaviour>>>;
    intercepts?: Array<LandmarkInteractionIntercept>;
    passiveActions?: Partial<Record<LandmarkPassiveEventType, null | LandmarkAugmentedPassiveBehaviour | Array<LandmarkAugmentedPassiveBehaviour>>>;
    stats?: any;
    visible?: true;
};

export class Landmark<T = any> {
    game: Game;
    id: number;
    template: LandmarkTemplate;
    visible = false;
    stats: T;
    cardIds = new Map<number, LandmarkAugmentedInteractionBehaviour>();
    redirect = new Map<string, Array<Landmark<any>>>();
    public get name(): string {
        return this.template.name;
    }

    constructor(id: number, template: LandmarkTemplate, game: Game) {
        this.id = id;
        this.game = game;
        this.template = template;
        this.stats = template.stats as T;
        this.visible = !!template.visible;
    }

    addRedirect(actions: string | Array<string>, landmark: Landmark<any>) {
        if (!Array.isArray(actions)) actions = [actions];
        for (const action of actions) {
            if (this.redirect.has(action)) {
                this.redirect.get(action).push(landmark);
            } else {
                this.redirect.set(action, [landmark]);
            }
        }
    }

    setupIntercepts(landmarks: Array<Landmark>) {
        if (this.template.intercepts == null) return;
        for (const intercept of this.template.intercepts) {
            const tags = [...intercept.tags.values()];
            const properlyTagged = landmarks.filter((landmark) => tags.every((t) => landmark.template.tags?.includes(t)));
            let count = 0;
            for (const properLandmark of properlyTagged) {
                if (properLandmark == this) continue;
                if (count >= intercept.quantity && intercept.quantity > 0) break;
                properLandmark.addRedirect(intercept.type, this);
                count++;
            }
        }
    }

    triggerIntecept(landmark: Landmark<any>, ship: Ship, interruptTripped: [boolean]) {
        if (this.template.intercepts == null) return;
        for (const intercept of this.template.intercepts) {
            if (intercept.tags.every((t) => landmark.template.tags?.includes(t))) {
                if (intercept.interrupt) interruptTripped[0] = true;
                return followUp(this, ship, intercept.action);
            }
        }
    }

    description(): string {
        let result = new Array<string>();
        for (const interactionType of Object.keys(this.template.interactions ?? [])) {
            const interaction = this.template.interactions[interactionType];
            result.push(`**${interactionType}**`);

            let current: LandmarkAugmentedInteractionBehaviour;
            let next = new Array<LandmarkAugmentedInteractionBehaviour>();
            if (interaction instanceof Array) {
                const clone = [...interaction];
                current = clone.shift();
                next = clone;
            } else {
                current = interaction;
            }

            while (current) {
                const behaviour = landmarkInteractionBehaviourLookup[current.type].description;
                // @ts-ignore
                result.push(behaviour(this, current.data));
                current = next.shift();
            }
            result.push("---");
        }

        for (const interactionType of Object.keys(this.template.passiveActions ?? [])) {
            const interaction = this.template.passiveActions[interactionType];
            result.push(`**${interactionType}**`);

            let current: LandmarkAugmentedInteractionBehaviour;
            let next = new Array<LandmarkAugmentedInteractionBehaviour>();
            if (interaction instanceof Array) {
                const clone = [...interaction];
                current = clone.shift();
                next = clone;
            } else {
                current = interaction;
            }

            while (current) {
                console.log(current.type);

                const behaviour = landmarkPassiveBehaviourLookup[current.type].description;
                // @ts-ignore
                result.push(behaviour(this, current.data));
                current = next.shift();
            }
            result.push("---");
        }

        return result.join("\n");
    }

    landmarkInteraction(interactionType: LandmarkInteractionType, ship: Ship): string {
        const interaction = this.template.interactions[interactionType];
        let result = new Array<string>();

        if (this.redirect.has(interactionType)) {
            let interruptTripped = [false] as [boolean];
            for (const landmark of this.redirect.get(interactionType)) {
                result.push(landmark.name + " intervenes!");
                result.push(landmark.triggerIntecept(this, ship, interruptTripped));
            }

            if (interruptTripped[0]) return result.join("\n");
        }

        if (!interaction) {
            result.push("Nothing happens.");

            return result.join("\n");
        }

        let current: LandmarkAugmentedInteractionBehaviour;
        let next = new Array<LandmarkAugmentedInteractionBehaviour>();
        if (interaction instanceof Array) {
            const clone = [...interaction];
            current = clone.shift();
            next = clone;
        } else {
            current = interaction;
        }

        while (current) {
            const behaviour = landmarkInteractionBehaviourLookup[current.type].action;
            // @ts-ignore
            result.push(behaviour(this, ship, current.data));
            current = next.shift();
        }

        return result.join("\n");
    }

    triggerEvent(landmarkPassiveEventType: LandmarkPassiveEventType) {
        const passive = this.template.passiveActions?.[landmarkPassiveEventType];

        if (!passive) return;
        let current: LandmarkAugmentedPassiveBehaviour;
        let next = new Array<LandmarkAugmentedPassiveBehaviour>();
        if (passive instanceof Array) {
            current = passive.shift();
            next = passive;
        } else {
            current = passive;
        }

        while (current) {
            const behaviour = landmarkPassiveBehaviourLookup[current.type].action;
            const result = behaviour(this, current.data);
            if (result) {
                this.game.say(followUp(this, null, result));
            }
            current = next.shift();
        }
    }

    cardPlayed(id: number) {
        const data = this.cardIds.get(id);
        landmarkPassiveBehaviourLookup[data.type](this, data.data);
    }
}

export enum LandmarkInteractionBehaviourType {
    awardVictoryPoints = "awardVictoryPoints",
    consumeStats = "consumeStats",
    triggerPassiveBehaviour = "triggerPassiveBehaviour",
    checkVisibility = "checkVisibility",
    defaultDiscover = "defaultDiscover",
    provideCard = "provideCard",
    dealDamage = "dealDamage",
    destroyLandmark = "destroyLandmark",
}

export type LandmarkAugmentedInteractionBehaviour =
    | {
          type: LandmarkInteractionBehaviourType.awardVictoryPoints;
          data: {
              victoryPoints: number;
          };
      }
    | {
          type: LandmarkInteractionBehaviourType.checkVisibility;
          data: {
              visible: boolean;
              followUp: FollowUp;
          };
      }
    | {
          type: LandmarkInteractionBehaviourType.consumeStats;
          data: {
              stats: FlatStatsData;
          };
      }
    | {
          type: LandmarkInteractionBehaviourType.triggerPassiveBehaviour;
          data: {
              type: LandmarkPassiveBehaviourType;
              data: any;
          };
      }
    | {
          type: LandmarkInteractionBehaviourType.defaultDiscover;
          data: {
              followUp?: FollowUp;
          };
      }
    | {
          type: LandmarkInteractionBehaviourType.provideCard;
          data: {
              card: string;
              info: LandmarkAugmentedInteractionBehaviour;
          };
      }
    | {
          type: LandmarkInteractionBehaviourType.dealDamage;
          data: {
              damage: number;
          };
      }
    | {
          type: LandmarkInteractionBehaviourType.destroyLandmark;
          data: {
              followUp?: FollowUp;
          };
      };

type LandmarkInteractionBehaviour<T> = {
    action: (landmark: Landmark, ship: Ship, data: Extract<LandmarkAugmentedInteractionBehaviour, { type: T }>["data"]) => string;
    description: (landmark: Landmark, data: Extract<LandmarkAugmentedInteractionBehaviour, { type: T }>["data"]) => string;
};

const landmarkInteractionBehaviourLookup: { [K in LandmarkInteractionBehaviourType]: LandmarkInteractionBehaviour<K> } = {
    [LandmarkInteractionBehaviourType.awardVictoryPoints]: {
        action: (landmark: Landmark, ship: Ship, data) => {
            ship.victoryPoints += data.victoryPoints;
            return ship.name + " gained " + data.victoryPoints + " victory points.";
        },
        description: (landmark: Landmark, data) => {
            return `Gain ${data.victoryPoints} victory points.`;
        },
    },
    [LandmarkInteractionBehaviourType.consumeStats]: {
        action: (landmark: Landmark, ship: Ship, data) => {
            const fs = new FlatStats(data.stats);
            ship.turnStats.remove(fs);
            return ship.name + " lost " + fs.toString() + " to " + landmark.name;
        },
        description: (landmark: Landmark, data) => {
            return `Spend ${new FlatStats(data.stats).toString()} to ${landmark.name}.`;
        },
    },
    [LandmarkInteractionBehaviourType.triggerPassiveBehaviour]: {
        action: (landmark: Landmark, ship: Ship, data) => {
            const result = landmarkPassiveBehaviourLookup[data.type].action(landmark, data.data);
            if (result) {
                return followUp(landmark, ship, result);
            }
        },
        description: (landmark: Landmark, data) => {
            const result = landmarkPassiveBehaviourLookup[data.type].description(landmark, data.data);
            if (typeof result != "string") {
                return followUpDescription(landmark, result);
            }
            return result;
        },
    },
    [LandmarkInteractionBehaviourType.checkVisibility]: {
        action: (landmark: Landmark, ship: Ship, data) => {
            if (landmark.visible == data.visible) {
                return followUp(landmark, ship, data.followUp);
            } else {
                return landmark.name + " is currently " + (data.visible ? "visible" : "hidden");
            }
        },
        description: (landmark: Landmark, data) => {
            return `if ${landmark.name} is ${data.visible ? "visible" : "hidden"}.`;
        },
    },
    [LandmarkInteractionBehaviourType.defaultDiscover]: {
        action: (landmark: Landmark, ship: Ship, data) => {
            if (landmark.visible) {
                return landmark.name + " is already discovered";
            } else {
                landmark.visible = true;
                let res = "";
                if (data.followUp) {
                    res = followUp(landmark, ship, data.followUp);
                }
                return landmark.name + " is now discovered\n" + res;
            }
        },
        description: (landmark: Landmark, data) => {
            return `Discover ${landmark.name}.`;
        },
    },
    [LandmarkInteractionBehaviourType.provideCard]: {
        action: (landmark: Landmark<{ cardIds: Array<number> }>, ship: Ship, data) => {
            const template = ship.game.cardTemplates.get(data.card);
            const cardInstance = ship.game.cardFromTemplate(template, landmark);
            ship.addCard(cardInstance);
            landmark.cardIds.set(cardInstance.id, data.info);
            return ship.name + " received " + template.name;
        },
        description: (landmark: Landmark<{ cardIds: Array<number> }>, data) => {
            const template = landmark.game.cardTemplates.get(data.card);
            return `Receive card \`${template.name}\`:\n${cardTemplateDescribe(template)}.\n`;
        },
    },
    [LandmarkInteractionBehaviourType.dealDamage]: {
        action: (landmark: Landmark, ship: Ship, data) => {
            ship.dealDamage(data.damage);
            return ship.name + " took " + data.damage + " damage from " + landmark.name;
        },
        description: (landmark: Landmark, data) => {
            return `Take ${data.damage} damage from ${landmark.name}.`;
        },
    },
    [LandmarkInteractionBehaviourType.destroyLandmark]: {
        action: (landmark: Landmark, ship: Ship, data) => {
            landmark.game.removeLandmark(landmark);
            let res = "";
            if (data.followUp) {
                res = "\n" + followUp(landmark, ship, data.followUp);
            }
            return ship.name + " destroyed " + landmark.name + res;
        },
        description: (landmark: Landmark, data) => {
            let res = "";
            if (data.followUp) {
                res = "\n" + followUpDescription(landmark, data.followUp);
            }
            return `Destroy ${landmark.name}.${res}`;
        },
    },
};

export enum LandmarkPassiveBehaviourType {
    changeVisibility = "changeVisibility",
    spendStat = "spendStat",
    interactWithEveryone = "interactWithEveryone",
    pickRandomShip = "pickRandomShip",
    checkStat = "checkStat",
}

type LandmarkPasssiveBehaviour = {
    action: (landmark: Landmark, data: any) => void | FollowUp;
    description: (landmark: Landmark, data: any) => string | FollowUp;
};

const landmarkPassiveBehaviourLookup: Record<LandmarkPassiveBehaviourType, LandmarkPasssiveBehaviour> = {
    [LandmarkPassiveBehaviourType.changeVisibility]: {
        action: (landmark: Landmark, data: { visible: boolean }) => {
            landmark.visible = data.visible;
            landmark.game.say(landmark.name + " is now " + (data.visible ? "visible" : "hidden"));
        },
        description: (landmark: Landmark, data: { visible: boolean }) => {
            return `${landmark.name} becomes ${data.visible ? "visible" : "hidden"}.`;
        },
    },
    [LandmarkPassiveBehaviourType.spendStat]: {
        action: (landmark: Landmark, data: { stat: string; whenAvailable: FollowUp; whenNotAvailable?: FollowUp }) => {
            if (landmark.stats[data.stat] > 0) {
                landmark.stats[data.stat]--;
                return data.whenAvailable;
            } else {
                if (data.whenNotAvailable) {
                    return data.whenNotAvailable;
                }
                return null;
            }
        },
        description: (landmark: Landmark, data: { stat: string; whenAvailable: FollowUp; whenNotAvailable?: FollowUp }) => {
            const whenAvailable = followUpDescription(landmark, data.whenAvailable);
            const whenNotAvailable = data.whenNotAvailable ? followUpDescription(landmark, data.whenNotAvailable) : undefined;
            return `${landmark.name} spends ${data.stat}, ${whenAvailable} ${whenNotAvailable ? "or " + whenNotAvailable : ""}.`;
        },
    },
    [LandmarkPassiveBehaviourType.checkStat]: {
        action: (landmark: Landmark, data: { stat: string; whenAvailable: FollowUp; whenNotAvailable?: FollowUp }) => {
            if (landmark.stats[data.stat] > 0) {
                return data.whenAvailable;
            } else {
                if (data.whenNotAvailable) {
                    return data.whenNotAvailable;
                }
                return null;
            }
        },
        description: (landmark: Landmark, data: { stat: string; whenAvailable: FollowUp; whenNotAvailable?: FollowUp }) => {
            const whenAvailable = followUpDescription(landmark, data.whenAvailable);
            const whenNotAvailable = data.whenNotAvailable ? followUpDescription(landmark, data.whenNotAvailable) : undefined;
            return `${landmark.name} checks ${data.stat}, ${whenAvailable} ${whenNotAvailable ? "or " + whenNotAvailable : ""}.`;
        },
    },
    [LandmarkPassiveBehaviourType.interactWithEveryone]: {
        action: (landmark: Landmark, data: any) => {
            let result = new Array<string>();
            for (const [id, ship] of landmark.game.ships) {
                result.push(followUp(landmark, ship, data));
            }
            landmark.game.say(result.join("\n"));
        },
        description: (landmark: Landmark, data: any) => {
            return `Every ship in play:\n ${followUpDescription(landmark, data)}`;
        },
    },
    [LandmarkPassiveBehaviourType.pickRandomShip]: {
        action: (landmark: Landmark, data: any) => {
            const ship = pickRandom([...landmark.game.ships.values()]);
            landmark.game.say(followUp(landmark, ship, data));
        },
        description: (landmark: Landmark, data: any) => {
            return `Pick a random ship in play:\n ${followUpDescription(landmark, data)}`;
        },
    },
};

type FollowUp = LandmarkAugmentedInteractionBehaviour | LandmarkAugmentedInteractionBehaviour[] | null;

function followUp(landmark: Landmark, ship: Ship, followUp: FollowUp): string {
    if (followUp == null) return "";
    const result = new Array<string>();

    if (Array.isArray(followUp)) {
        for (const trigger of followUp) {
            result.push(landmarkInteractionBehaviourLookup[trigger.type].action(landmark, ship, trigger.data as any));
        }
    } else {
        result.push(landmarkInteractionBehaviourLookup[followUp.type].action(landmark, ship, followUp.data as any));
    }
    return result.join("\n");
}

function followUpDescription(landmark: Landmark, followUp: FollowUp): string {
    if (followUp == null) return "";
    const result = new Array<string>();

    if (Array.isArray(followUp)) {
        for (const trigger of followUp) {
            result.push(landmarkInteractionBehaviourLookup[trigger.type].description(landmark, trigger.data as any));
        }
    } else {
        result.push(landmarkInteractionBehaviourLookup[followUp.type].description(landmark, followUp.data as any));
    }
    return result.join("\n");
}
