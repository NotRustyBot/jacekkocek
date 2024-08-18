import { APIEmbed, BaseMessageOptions, InteractionReplyOptions, MessagePayload } from "discord.js";
import { Card } from "../card";
import { Ship } from "../ship";
import {
    StateCheck,
    StateCheckAnyShip,
    StateCheckGame,
    StateCheckLandmark,
    StateCheckLandmarkDestroyed,
    StateCheckLandmarkVisible,
    StateCheckLoyalty,
    StateCheckOtherShip,
    StateCheckPartner,
    StateCheckShip,
    StateCheckSidequest,
    StateCheckStats,
    StateCheckTaggedLandmark,
    StateCheckType,
} from "../sidequest";
import { variableRangeString } from "../utils";
import {
    AbsoluteAction,
    AbsoluteActionAlterGameVariable,
    AbsoluteActionAlterLandmarkVariable,
    AbsoluteActionAlterPartnerLoyalty,
    AbsoluteActionAlterPartnerVariable,
    AbsoluteActionAlterQuestVariable,
    AbsoluteActionAlterShipStats,
    AbsoluteActionAlterShipVariable,
    AbsoluteActionAlterStats,
    AbsoluteActionAwardVictoryPoints,
    AbsoluteActionCondition,
    AbsoluteActionDamageShip,
    AbsoluteActionDestroyLandmark,
    AbsoluteActionDrawCard,
    AbsoluteActionGiveQuest,
    AbsoluteActionInteractWithEveryone,
    AbsoluteActionInteractWithLandmark,
    AbsoluteActionInteractWithQuestLandmark,
    AbsoluteActionInteractWithRandomLandmark,
    AbsoluteActionOffer,
    AbsoluteActionParameters,
    AbsoluteActionPickRandomShip,
    AbsoluteActionProvideCard,
    AbsoluteActions,
    AbsoluteActionSay,
    AbsoluteActionSetGameVariable,
    AbsoluteActionSetLandmarkVariable,
    AbsoluteActionSetLandmarkVisibility,
    AbsoluteActionSetPartnerLoyalty,
    AbsoluteActionSetPartnerVariable,
    AbsoluteActionSetQuestVariable,
    AbsoluteActionSetShipStats,
    AbsoluteActionSetShipVariable,
    AbsoluteActionSetStats,
    AbsoluteActionType,
} from "../absoluteAction";
import { VariableRange, Variables } from "../variables";
import { Landmark } from "../landmark";

//function that mixes arrays and returns a copy
export function shuffle<T>(array: Array<T>): Array<T> {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

export class DiscordRenderer {
    landmarks(landmarks: Landmark[]) {
        return { embeds: landmarks.map((landmark, id) => this.renderLandmark(landmark, id)) };
    }

    renderLandmark(landmark: Landmark, id: number) {
        let description = "";
        description += "### Interactions\n";
        for (const interaction in landmark.template.interactions) {
            const actions = landmark.template.interactions[interaction] as AbsoluteActions;
            description += "**" + interaction + "**:\n" + this.describeAction(actions) + "\n\n";
        }
        description += "### Passive Actions\n";
        for (const interaction in landmark.template.passiveActions) {
            const actions = landmark.template.passiveActions[interaction] as AbsoluteActions;
            description += "**" + interaction + "**:\n" + this.describeAction(actions) + "\n\n";
        }

        const embed: APIEmbed = {
            title: id + " " + landmark.template.name,
            description,
        };
        console.log(description);

        return embed;
    }

    describeAction(action: AbsoluteActions) {
        action = action instanceof Array ? action : [action];
        return describeAction(action);
    }

    showOffers(ship: Ship) {
        if (ship.offers.size === 0) return { embeds: [{ title: "No offers" }] };
        const embeds: APIEmbed[] = [];
        for (const [id, offer] of ship.offers) {
            let requirements = new Array<string>();

            for (const req of offer.requirements) {
                requirements.push(describeCondition(req));
            }

            let offerPoints = new Array<string>();
            offerPoints.push(describeAction(offer.actions));
            offerPoints.push(offer.description);

            const desc = `## Requirements\n${requirements.join("\n")}\n\n## Actions\n${offerPoints.join("\n")}`;
            embeds.push({ title: "`" + id + "`", description: desc, fields: [] });
        }
        return { embeds: embeds, body: "You have " + ship.offers.size + " offers" };
    }

    showDraw(ship: Ship) {
        const embed: APIEmbed = {
            title: "Draw Pile",
            description: `you currently have \`${ship.deck.length}\` cards in your draw pile`,
            fields: [],
        };
        this.addCardsAsFields(shuffle(ship.deck), embed);
        return { embeds: [embed] };
    }

    showDiscard(ship: Ship) {
        const embed: APIEmbed = {
            title: "Discard Pile",
            description: `you currently have \`${ship.graveyard.length}\` cards in your discard pile`,
            fields: [],
        };
        this.addCardsAsFields(shuffle(ship.graveyard), embed);
        return { embeds: [embed] };
    }

    showHand(ship: Ship): InteractionReplyOptions {
        const embed: APIEmbed = {
            title: "Hand",
            description: `you start with \`${ship.currentHandStats().startingHand}\` cards and can draw up to \`${ship.currentHandStats().maxSize}\`, drawing \`${
                ship.currentHandStats().draw
            } cards per turn\``,
            fields: [],
        };
        this.addCardsAsFields(ship.hand, embed);
        return { embeds: [embed] };
    }

    private addCardsAsFields(cards: Card[], embed: APIEmbed) {
        let i = 0;
        for (const card of cards) {
            const descs = [];
            let behaviourArray = card.template.behaviour instanceof Array ? card.template.behaviour : [card.template.behaviour];
            let lines = 0;

            for (const behaviour of behaviourArray) {
                const string = actionDescriptionLookup[behaviour.type].description(behaviour);
                descs.push(string);

                const words = string.split(" ");
                let currLenght = 0;
                for (const word of words) {
                    if (currLenght + word.length > 17) {
                        lines++;
                        currLenght = word.length;
                    } else {
                        currLenght += word.length + 1;
                    }
                }

                lines += 2;
            }
            lines -= 2;
            let text = descs.join("\n\n");

            //fill with newlines until there are 6
            while (lines < 6) {
                text += "\n";
                lines++;
            }
            text += "\n".padEnd(17, "-");

            embed.fields.push({ name: `${i} - ` + card.name, value: "```" + text + "```\n", inline: true });
            i++;
        }

        while (i % 3 !== 0) {
            embed.fields.push({ name: "", value: "", inline: true });
            i++;
        }
    }

    myStatus(ship: Ship): BaseMessageOptions {
        const embed: APIEmbed = {
            title: "Overview",
            description: `**HP**: ${ship.hp}\n\n**Stats: **${ship.totalStats()}\n\n**Effects:**\nNone\n\n**Victory Points:** ${ship.victoryPoints}`,
            fields: [],
        };

        if (ship.preferences.cardDescriptionsInStatus) {
            this.addCardsAsFields(ship.hand, embed);
        } else {
            embed.description += "\n\n```" + ship.hand.map((card, i) => `${i} - ` + card.name).join("\n") + "```";
        }

        return { embeds: [embed] };
    }

    shipOverview(ship: Ship, limited = false): BaseMessageOptions {
        const items = new Array<string>();
        for (const [id, item] of ship.items) {
            items.push(`\`${id}\` **${item.name}**: ${item.description}\n- ${item.getItemFunctionalityDescription().join("\n- ")}`);
        }

        const stowedItems = new Array<string>();
        for (const [id, item] of ship.stowage) {
            stowedItems.push(`\`${id}\` **${item.name}**: ${item.description}\n- ${item.getItemFunctionalityDescription().join("\n- ")}`);
        }

        return {
            embeds: [
                {
                    title: ship.name,
                    fields: [
                        {
                            name: "Resources",
                            value: ship.resources.toString(),
                        },
                        {
                            name: "Items",
                            value: items.join("\n"),
                        },
                        {
                            name: "Stowed Items",
                            value: stowedItems.join("\n"),
                        },
                    ],
                },
            ],
        };
    }
}

function describeAction(actions: AbsoluteActions): string {
    actions = actions instanceof Array ? actions : [actions];
    let result = [];
    for (const action of actions) {
        result.push(actionDescriptionLookup[action.type].description(action));
    }
    return result.join("\n");
}

const actionDescriptionLookup: Record<
    AbsoluteActionType,
    {
        description: (data: AbsoluteAction) => string;
    }
> = {
    [AbsoluteActionType.AwardVictoryPoints]: {
        description: (data: AbsoluteActionAwardVictoryPoints) => `award ${data.victoryPoints} victory points`,
    },
    [AbsoluteActionType.AlterGameVariable]: {
        description: (data: AbsoluteActionAlterGameVariable) => {
            return `change game variables by: ${Variables.toString(data.variables)}`;
        },
    },
    [AbsoluteActionType.AlterLandmarkVariable]: {
        description: (data: AbsoluteActionAlterLandmarkVariable) => {
            return `change landmark variables by: ${Variables.toString(data.variables)}`;
        },
    },
    [AbsoluteActionType.AlterPartnerVariable]: {
        description: (data: AbsoluteActionAlterPartnerVariable) => {
            return `change partner variables by: ${Variables.toString(data.variables)}`;
        },
    },

    [AbsoluteActionType.SetGameVariable]: {
        description: (data: AbsoluteActionSetGameVariable) => {
            return `set game variables to: ${Variables.toString(data.variables)}`;
        },
    },

    [AbsoluteActionType.SetLandmarkVariable]: {
        description: (data: AbsoluteActionSetLandmarkVariable) => {
            return `set landmark variables to: ${Variables.toString(data.variables)}`;
        },
    },

    [AbsoluteActionType.SetPartnerVariable]: {
        description: (data: AbsoluteActionSetPartnerVariable) => {
            return `set partner variables to: ${Variables.toString(data.variables)}`;
        },
    },

    [AbsoluteActionType.SetShipVariable]: {
        description: (data: AbsoluteActionSetShipVariable) => {
            return `set ship variables to: ${Variables.toString(data.variables)}`;
        },
    },

    [AbsoluteActionType.SetQuestVariable]: {
        description: (data: AbsoluteActionSetQuestVariable) => {
            return `set quest variables to: ${Variables.toString(data.variables)}`;
        },
    },

    [AbsoluteActionType.AlterShipStats]: {
        description: (data: AbsoluteActionAlterShipStats) => {
            return `change ship stats by: ${Variables.toString(data.stats)}`;
        },
    },

    [AbsoluteActionType.AlterShipVariable]: {
        description: (data: AbsoluteActionAlterShipVariable) => {
            return `change ship variables by: ${Variables.toString(data.variables)}`;
        },
    },

    [AbsoluteActionType.AlterQuestVariable]: {
        description: (data: AbsoluteActionAlterQuestVariable) => {
            return `change quest variables by: ${Variables.toString(data.variables)}`;
        },
    },

    [AbsoluteActionType.DestroyLandmark]: {
        description: (data: AbsoluteActionDestroyLandmark) => `destroy landmark`,
    },

    [AbsoluteActionType.DamageShip]: {
        description: (data: AbsoluteActionDamageShip) => `damage ship: ${data.damage}`,
    },

    [AbsoluteActionType.DrawCard]: {
        description: (data: AbsoluteActionDrawCard) => `draw card ${data.count || 1} time${data.count == 1 ? "" : "s"}`,
    },

    [AbsoluteActionType.InteractWithEveryoneOnMission]: {
        description: (data: AbsoluteActionInteractWithEveryone) => `every ship:\n${describeAction(data.actions)}`,
    },

    [AbsoluteActionType.InteractWithLandmark]: {
        description: (data: AbsoluteActionInteractWithLandmark) => `${data.interaction}${data.value ? " " + data.value : ""} landmark`,
    },

    [AbsoluteActionType.InteractWithRandomLandmark]: {
        description: (data: AbsoluteActionInteractWithRandomLandmark) => `random landmark:\n${describeAction(data.actions)}`,
    },

    [AbsoluteActionType.InteractWithQuestLandmark]: {
        description: (data: AbsoluteActionInteractWithQuestLandmark) => `quest landmark:\n${describeAction(data.actions)}`,
    },

    [AbsoluteActionType.PickRandomShipOnMission]: {
        description: (data: AbsoluteActionPickRandomShip) => `random ship:\n${describeAction(data.actions)}`,
    },

    [AbsoluteActionType.ProvideCard]: {
        description: (data: AbsoluteActionProvideCard) => `provide card: ${data.card}`,
    },

    [AbsoluteActionType.Say]: {
        description: (data: AbsoluteActionSay) => `say: ${data.text}`,
    },

    [AbsoluteActionType.SetLandmarkVisibility]: {
        description: (data: AbsoluteActionSetLandmarkVisibility) => `set landmark visibility: ${data.visible ? "visible" : "invisible"}`,
    },

    [AbsoluteActionType.SetStats]: {
        description: (data: AbsoluteActionSetStats) => {
            return `set stats to: ${Variables.toString(data.stats)}`;
        },
    },

    [AbsoluteActionType.SetShipStats]: {
        description: (data: AbsoluteActionSetShipStats) => {
            return `set ship stats to: ${Variables.toString(data.stats)}`;
        },
    },
    [AbsoluteActionType.AlterShipsPartnerLoyalty]: {
        description: (data: AbsoluteActionAlterPartnerLoyalty) => {
            return `change partner loyalty by: ${data.loyalty}`;
        },
    },

    [AbsoluteActionType.SetShipsPartnerLoyalty]: {
        description: (data: AbsoluteActionAlterPartnerLoyalty) => {
            return `set partner loyalty to: ${data.loyalty}`;
        },
    },

    [AbsoluteActionType.AlterStats]: {
        description: (data: AbsoluteActionAlterStats) => {
            return `change stats by: ${Variables.toString(data.stats)}`;
        },
    },

    [AbsoluteActionType.Condition]: {
        description: (data: AbsoluteActionCondition) => {
            return `condition: ${data.requirements.map((c) => describeCondition(c)).join(", ")}\nif met: ${describeAction(data.successActions)}\n${
                data.failureActions != undefined ? "if not met: " + describeAction(data.failureActions) : ""
            }`;
        },
    },

    [AbsoluteActionType.GiveQuest]: {
        description: (data: AbsoluteActionGiveQuest) => {
            return data.name;
        },
    },

    [AbsoluteActionType.Offer]: {
        description: (data: AbsoluteActionOffer) => {
            return "offer: " + data.offerData.description;
        },
    },
};

function describeCondition(condition: StateCheck) {
    return conditionDescriptionLookup[condition.type](condition);
}

const conditionDescriptionLookup: Record<StateCheckType, (condition: StateCheck) => string> = {
    [StateCheckType.Ship]: (condition: StateCheckShip) => {
        return `ship variables ${variableRangeRenderer(condition.range)}`;
    },
    [StateCheckType.Partner]: (condition: StateCheckPartner) => {
        return `partner variables ${variableRangeRenderer(condition.range)}`;
    },
    [StateCheckType.Game]: (condition: StateCheckGame) => {
        return `the world variables ${variableRangeRenderer(condition.range)}`;
    },
    [StateCheckType.Landmark]: (condition: StateCheckLandmark) => {
        return `landmark variables ${variableRangeRenderer(condition.range)}`;
    },
    [StateCheckType.Loyalty]: (condition: StateCheckLoyalty) => {
        console.log(condition);

        return `loyalty ${condition.min !== undefined ? `at least ${condition.min}` : ""} ${condition.max !== undefined ? `at most ${condition.max}` : ""}`;
    },
    [StateCheckType.Stats]: (condition: StateCheckStats) => {
        return `stats ${variableRangeRenderer(condition.range)}`;
    },
    [StateCheckType.Sidequest]: (condition: StateCheckSidequest) => {
        return `sidequest variables ${variableRangeRenderer(condition.range)}`;
    },
    [StateCheckType.LandmarkDestroyed]: (condition: StateCheckLandmarkDestroyed) => {
        return `landmark ${condition.nametag} destroyed`;
    },
    [StateCheckType.OtherShip]: (condition: StateCheckOtherShip) => {
        return `other ship variables ${variableRangeRenderer(condition.range)}`;
    },
    [StateCheckType.AnyShip]: (condition: StateCheckAnyShip) => {
        return `any ship variables ${variableRangeRenderer(condition.range)}`;
    },
    [StateCheckType.LandmarkVisible]: (condition: StateCheckLandmarkVisible) => {
        return `landmark ${condition.nametag} ${condition.visible ? "visible" : "invisible"}`;
    },
    [StateCheckType.TaggedLandmark]: (condition: StateCheckTaggedLandmark) => {
        return `landmark ${condition.nametag} variables ${variableRangeRenderer(condition.range)}`;
    },
};

function variableRangeRenderer(ranges: VariableRange[]) {
    let results = [];
    for (const range of ranges) {
        let result = "";

        if (range.min) {
            result += " above: ";
            for (const k in range.min) {
                if (k in range.min) {
                    result += `\`${k}: ${range.min[k]}\` `;
                }
            }
        }

        if (range.max) {
            result += " below: ";
            for (const k in range.max) {
                if (k in range.max) {
                    result += `\`${k}: ${range.max[k]}\` `;
                }
            }
        }

        results.push(result);
    }
    return results.join("; or ");
}

/*
const absoluteActionLookup: Record<AbsoluteActionType, (action: AbsoluteAction, parameters: AbsoluteActionParameters, description?: Array<string>) => void> = {
    [AbsoluteActionType.AlterLandmarkVariable]: (action: AbsoluteActionAlterLandmarkVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`change ${parameters.landmark.name} variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetLandmarkVariable]: (action: AbsoluteActionSetLandmarkVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`set ${parameters.landmark.name} variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.AlterGameVariable]: (action: AbsoluteActionAlterGameVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`change game variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetGameVariable]: (action: AbsoluteActionSetGameVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`set game variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetLandmarkVisibility]: (action: AbsoluteActionSetLandmarkVisibility, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`set ${parameters.landmark.name} visibility to ${action.visible}`);
    },
    [AbsoluteActionType.PickRandomShipOnMission]: (action: AbsoluteActionPickRandomShip, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`${parameters.ship.name} was picked randomly`);
    },
    [AbsoluteActionType.InteractWithEveryoneOnMission]: (action: AbsoluteActionInteractWithEveryone, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`every ship:`);
    },
    [AbsoluteActionType.AlterQuestVariable]: (action: AbsoluteActionAlterQuestVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`change ${parameters.sidequest!.template.name} variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetQuestVariable]: (action: AbsoluteActionSetQuestVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`set ${parameters.sidequest!.template.name} variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.AlterShipVariable]: (action: AbsoluteActionAlterShipVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`change ${parameters.ship!.name} variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetShipVariable]: (action: AbsoluteActionSetShipVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`set ${parameters.ship!.name} variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.AlterShipStats]: (action: AbsoluteActionAlterShipStats, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`change ${parameters.ship!.name} stats by ${Variables.toString(action.stats)}`);
    },
    [AbsoluteActionType.SetShipStats]: (action: AbsoluteActionSetShipStats, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`set ${parameters.ship!.name} stats to ${Variables.toString(action.stats)}`);
    },
    [AbsoluteActionType.AlterPartnerVariable]: (action: AbsoluteActionAlterPartnerVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`change ${parameters.partner!.template.name} variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetPartnerVariable]: (action: AbsoluteActionSetPartnerVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`set ${parameters.partner!.template.name} variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.AlterShipsPartnerLoyalty]: (action: AbsoluteActionAlterPartnerLoyalty, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`for ${parameters.ship!.name} change ${parameters.partner!.template.name} loyalty by ${action.loyalty}`);
    },
    [AbsoluteActionType.SetShipsPartnerLoyalty]: (action: AbsoluteActionSetPartnerLoyalty, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`for ${parameters.ship!.name} set ${parameters.partner!.template.name} loyalty to ${action.loyalty}`);
    },
    [AbsoluteActionType.AwardVictoryPoints]: (action: AbsoluteActionAwardVictoryPoints, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`for ${parameters.ship!.name} add ${action.victoryPoints} victory points`);
    },
    [AbsoluteActionType.Say]: (action: AbsoluteActionSay, parameters: AbsoluteActionParameters, description: Array<string>) => {
    },
    [AbsoluteActionType.DestroyLandmark]: (action: AbsoluteActionDestroyLandmark, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`destroy ${parameters.landmark!.name}`);
    },
    [AbsoluteActionType.DamageShip]: (action: AbsoluteActionDamageShip, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`for ${parameters.ship!.name} deal ${action.damage} damage`);
    },
    [AbsoluteActionType.InteractWithLandmark]: (action: AbsoluteActionInteractWithLandmark, parameters: AbsoluteActionParameters, description: Array<string>) => {
       description.push(`${parameters.ship!.name}: ${action.interaction} the ${parameters.landmark!.name}`);
       description.push(... parameters.landmark!.landmarkInteraction(action.interaction, parameters.ship!, action.value));
    },
    [AbsoluteActionType.Condition]: (action: AbsoluteActionCondition, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`...`);
    },
    [AbsoluteActionType.ProvideCard]: (action: AbsoluteActionProvideCard, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`${parameters.ship!.name} got ${action.card}`);
    },
    [AbsoluteActionType.AlterStats]: (action: AbsoluteActionAlterStats, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`alter ${parameters.ship!.name} stats by ${Variables.toString(action.stats)}`);
    },
    [AbsoluteActionType.SetStats]: (action: AbsoluteActionSetStats, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`set ${parameters.ship!.name} stats to ${Variables.toString(action.stats)}`);
    },
    [AbsoluteActionType.InteractWithRandomLandmark]: (action: AbsoluteActionInteractWithRandomLandmark, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`${parameters.ship!.name} was picked`);
    },
    [AbsoluteActionType.DrawCard]: (action: AbsoluteActionDrawCard, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`draw ${action.count || 1} card${action.count === 1 ? "" : "s"}`);
    },
    [AbsoluteActionType.InteractWithQuestLandmark]: (action: AbsoluteActionInteractWithQuestLandmark, parameters: AbsoluteActionParameters, description: Array<string>) => {
        const landmark = parameters.sidequest!.landmarks.get(action.nametag)!;
        description.push(`interact with ${landmark.name}`);
    }
};

*/
