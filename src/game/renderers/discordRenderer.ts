import { APIEmbed, InteractionReplyOptions, MessagePayload } from "discord.js";
import { Card, CardBehaviourKind } from "../card";
import { FlatStats, Ship } from "../ship";
import { StateCheckType } from "../sidequest";
import { variableRangeString } from "../utils";
import { PartnerActionType } from "../partner";

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
    showOffers(ship: Ship) {
        if (ship.offers.size === 0) return { embeds: [{ title: "No offers" }] };
        const embeds: APIEmbed[] = [];
        for (const [id, offer] of ship.offers) {
            let requirements = new Array<string>();
            for (const requirement of offer.data.requirements) {
                switch (requirement.type) {
                    case StateCheckType.Ship:
                    case StateCheckType.Partner:
                    case StateCheckType.Game:
                        if (requirement.type === StateCheckType.Ship) requirements.push("**Your ship**");
                        if (requirement.type === StateCheckType.Partner) requirements.push("**" + offer.partner + "**");
                        if (requirement.type === StateCheckType.Game) requirements.push("**The World**");

                        for (const range of requirement.range) {
                            requirements.push("- " + variableRangeString(range));
                        }
                        break;

                    case StateCheckType.Loyalty:
                        requirements.push("**Loyalty**");
                        if (requirement.min != undefined) requirements.push("- At least " + requirement.min + " loyalty");
                        if (requirement.max != undefined) requirements.push("- At most " + requirement.max + " loyalty");
                        break;

                    default:
                        break;
                }
            }

            let offerPoints = new Array<string>();
            for (const action of offer.data.actions) {
                switch (action.type) {
                    case PartnerActionType.Sidequest:
                        offerPoints.push("** Quest:" + action.sidequest + "**");
                        offerPoints.push(ship.game.sidequestTemplates.get(action.sidequest).description);
                        break;
                }
            }

            const desc = `## Requirements\n${requirements.join("\n")}\n\n## Actions\n${offerPoints.join("\n")}`;
            embeds.push({ title: "`" + id + "` Offer from " + offer.partner, description: desc, fields: [] });
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
            let behaviour = card.template.behaviour;
            let lines = 0;

            while (behaviour) {
                const string = cardDesctiptionLookup[behaviour.kind].description(card, behaviour.data);
                descs.push(string);
                behaviour = behaviour.followUp;

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
            text += "\n.";

            embed.fields.push({ name: `${i} - ` + card.name, value: "```" + text + "```\n", inline: true });
            i++;
        }

        while (i % 3 !== 0) {
            embed.fields.push({ name: "", value: "", inline: true });
            i++;
        }
    }

    myStatus(ship: Ship): InteractionReplyOptions {
        const embed: APIEmbed = {
            title: "Overview",
            description: `**HP**: ${ship.hp}\n\n**Stats: **${ship.totalStats()}\n\n**Effects:**\nNone\n\n**Victory Points:** ${ship.victoryPoints}`,
            fields: [],
        };

        if (ship.preferences.cardDescriptionsInStatus) {
            let i = 0;
            for (const card of ship.hand) {
                const descs = [];
                let behaviour = card.template.behaviour;
                let lines = 0;

                while (behaviour) {
                    const string = cardDesctiptionLookup[behaviour.kind].description(card, behaviour.data);
                    descs.push(string);
                    behaviour = behaviour.followUp;

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
                text += "\n.";

                embed.fields.push({ name: `${i} - ` + card.name, value: "```" + text + "```\n", inline: true });
                i++;
            }

            while (i % 3 !== 0) {
                embed.fields.push({ name: "", value: "", inline: true });
                i++;
            }
        } else {
            embed.description += "\n\n```" + ship.hand.map((card, i) => `${i} - ` + card.name).join("\n") + "```";
        }

        return { embeds: [embed] };
    }

    shipOverview(ship: Ship, limited = false): InteractionReplyOptions {
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

const cardDesctiptionLookup: Record<
    CardBehaviourKind,
    {
        description: (card: Card, data: any) => string;
    }
> = {
    [CardBehaviourKind.spendStats]: {
        description: (card: Card, data: any) => `spend ${FlatStats.toString(data.stats)}`,
    },

    [CardBehaviourKind.gainStats]: {
        description: (card: Card, data: any) => `gain ${FlatStats.toString(data.stats)}`,
    },
    [CardBehaviourKind.awardVictoryPoints]: {
        description: (card: Card, data: any) => `award ${data.victoryPoints} victory points`,
    },
    [CardBehaviourKind.interactWithLandmark]: {
        description: (card: Card, data: any) => `${data.interactionType} targeted landmark`,
    },
    [CardBehaviourKind.interactWithRandomLandmark]: {
        description: (card: Card, data: any) => `${data.interactionType} random ${data.visible == undefined ? "" : data.visible ? "visible" : "invisible"} landmark`,
    },
    [CardBehaviourKind.drawCard]: {
        description: (card: Card, data: any) => `draws ${data.quantity} card${data.quantity == 1 ? "" : "s"}`,
    },
    [CardBehaviourKind.nothing]: {
        description: (card: Card, data: any) => `does nothing`,
    },
    [CardBehaviourKind.interactWithQuestLandmark]: {
        description: (card: Card, data: any) => `${data.interactionType} quest landmark`,
    },
};
