import { CardBehaviourKind, CardTemplate } from "./card";
import { ItemBehaviourKind, ItemTemplate } from "./item";
import { LandmarkInteractionBehaviourType, LandmarkInteractionType, LandmarkPassiveBehaviourType, LandmarkPassiveEventType, LandmarkTemplate } from "./landmark";
import { TradeTemplate } from "./trade";

export type ContentData = {
    cards: Array<CardTemplate>;
    items: Array<ItemTemplate>;
    landmarks: Array<LandmarkTemplate>;
    trades: Array<TradeTemplate>;
};

export const content: ContentData = {
    trades: [
        {
            name: "Ping",
            price: {
                ["material"]: 5,
            },
            item: "Ping",
        },
        {
            name: "Tactical Officer",
            price: {
                ["intel"]: 5,
            },
            item: "Tactical Officer",
        },
    ],
    cards: [
        {
            name: "Ping",
            behaviour: {
                kind: CardBehaviourKind.spendStats,
                data: {
                    stats: {
                        sensors: 4,
                    },
                },
                followUp: {
                    kind: CardBehaviourKind.interactWithRandomLandmark,
                    data: {
                        interactionType: "discover",
                        visible: false,
                    },
                },
            },
        },

        {
            name: "SPAM Shot",
            behaviour: {
                kind: CardBehaviourKind.interactWithLandmark,
                data: {
                    interactionType: "attack",
                },
            },
            exhaust: true
        },
        {
            name: "Tactical Takeover",
            behaviour: {
                kind: CardBehaviourKind.spendStats,
                data: {
                    stats: {
                        crew: 5,
                    },
                },
                followUp: {
                    kind: CardBehaviourKind.interactWithLandmark,
                    data: {
                        interactionType: "capture",
                    },
                },
            },
        },
        {
            name: "Demolition Squad",
            behaviour: {
                kind: CardBehaviourKind.spendStats,
                data: {
                    stats: {
                        crew: 3,
                    },
                },
                followUp: {
                    kind: CardBehaviourKind.interactWithLandmark,
                    data: {
                        interactionType: "attack",
                    },
                },
            },
        },
        {
            name: "Exploration Gear",
            behaviour: {
                kind: CardBehaviourKind.spendStats,
                data: {
                    stats: {
                        crew: 5,
                    },
                },
                followUp: {
                    kind: CardBehaviourKind.interactWithRandomLandmark,
                    data: {
                        interactionType: "discover",
                        visible: false,
                    },
                },
            },
        },
        {
            name: "All hands on deck!",
            behaviour: {
                kind: CardBehaviourKind.spendStats,
                data: {
                    stats: {
                        crew: 3,
                    },
                },
                followUp: {
                    kind: CardBehaviourKind.drawCard,
                    data: {
                        quantity: 2,
                    },
                },
            },
        },
        {
            name: "Scout Ahead",
            behaviour: {
                kind: CardBehaviourKind.spendStats,
                data: {
                    stats: {
                        agility: 2,
                    },
                },
                followUp: {
                    kind: CardBehaviourKind.interactWithRandomLandmark,
                    data: {
                        interactionType: "discover",
                        visible: false,
                    },
                },
            },
        },
        {
            name: "Heat",
            behaviour: {
                kind: CardBehaviourKind.nothing,
                data: {},
            },
        },
        {
            name: "Full Thrust",
            behaviour: {
                kind: CardBehaviourKind.gainStats,
                data: {
                    stats: {
                        agility: 4
                    }
                },
            },
        },
        {
            name: "Copycat Exploit",
            behaviour: {
                kind: CardBehaviourKind.interactWithLandmark,
                data: {
                    interactionType: "hack",
                },
            },
        },
        {
            name: "Assisted Planning",
            behaviour: {
                kind: CardBehaviourKind.spendStats,
                data: {
                    stats: {
                        sensors: 5
                    }
                },
                followUp: {
                    kind: CardBehaviourKind.drawCard,
                    data: {
                        quantity: 2
                    },
                },
            },
        },
        {
            name: "Missile",
            description: "Missile",
            behaviour: {
                kind: CardBehaviourKind.interactWithLandmark,
                data: {
                    interactionType: "attack",
                },
            },
        },
    ],
    items: [
        {
            name: "Passive Radar",
            behaviour: {
                kind: ItemBehaviourKind.structuralItem,
                data: {
                    statsToAdd: {
                        sensors: 8,
                    },
                },
            },
        },
        {
            name: "Antikythera Computing System",
            description: "Multipurpose computing system",
            behaviour: {
                kind: ItemBehaviourKind.consumableProvider,
                data: {
                    provideCards: ["Ping", "Copycat Exploit", "Assisted Planning", "Heat"],
                },
                followUp: {
                    kind: ItemBehaviourKind.structuralItem,
                    data: {
                        statsToAdd: {
                            sensors: 2,
                        },
                    },
                }
            },
        },
        {
            name: "SPAM Launcher",
            description: "Launches Strategic Precision Assault Munitions",
            behaviour: {
                kind: ItemBehaviourKind.consumableProvider,
                data: {
                    provideCards: ["SPAM Shot", "SPAM Shot", "SPAM Shot"],
                },
            },
        },
        {
            name: "Silkers Tactical Team",
            description: "Team of skilled infiltrators",
            behaviour: {
                kind: ItemBehaviourKind.consumableProvider,
                data: {
                    provideCards: ["Tactical Takeover", "Demolition Squad", "Exploration Gear", "Heat"],
                },
                followUp: {
                    kind: ItemBehaviourKind.structuralItem,
                    data: {
                        statsToAdd: {
                            crew: 2,
                        },
                    },
                }
            },
        },
        {
            name: "Echo Propulsion",
            description: "Engien",
            behaviour: {
                kind: ItemBehaviourKind.consumableProvider,
                data: {
                    provideCards: ["Scout Ahead", "Full Thrust", "Heat"],
                },
                followUp: {
                    kind: ItemBehaviourKind.structuralItem,
                    data: {
                        statsToAdd: {
                            agility: 4,
                        },
                    },
                }
            },
        },
    ],
    landmarks: [
        {
            name: "Tower",
            tags: ["ground"],
            interactions: {
                attack: [
                    {
                        type: LandmarkInteractionBehaviourType.destroyLandmark,
                        data: {
                            followUp: {
                                type: LandmarkInteractionBehaviourType.awardVictoryPoints,
                                data: {
                                    victoryPoints: 1,
                                },
                            },
                        },
                    },
                ],
                capture: [
                    {
                        type: LandmarkInteractionBehaviourType.destroyLandmark,
                        data: {
                            followUp: {
                                type: LandmarkInteractionBehaviourType.awardVictoryPoints,
                                data: {
                                    victoryPoints: 5,
                                },
                            },
                        },
                    },
                ],
                discover: [
                    {
                        type: LandmarkInteractionBehaviourType.defaultDiscover,
                        data: {},
                    },
                ],
            },
        },
        {
            name: "Defense Turret",
            intercepts: [
                {
                    tags: ["ground"],
                    quantity: 1,
                    type: [LandmarkInteractionType.discover, LandmarkInteractionType.attack],
                    interrupt: true,
                    action: [
                        {
                            type: LandmarkInteractionBehaviourType.triggerPassiveBehaviour,
                            data: {
                                type: LandmarkPassiveBehaviourType.changeVisibility,
                                data: {
                                    visible: true,
                                },
                            },
                        },
                        {
                            type: LandmarkInteractionBehaviourType.dealDamage,
                            data: {
                                damage: 1,
                            },
                        },
                    ],
                },
            ],
            interactions: {
                discover: [
                    {
                        type: LandmarkInteractionBehaviourType.defaultDiscover,
                        data: {},
                    },
                ],
                attack: [
                    {
                        type: LandmarkInteractionBehaviourType.destroyLandmark,
                        data: {
                            followUp: {
                                type: LandmarkInteractionBehaviourType.awardVictoryPoints,
                                data: {
                                    victoryPoints: 5,
                                },
                            },
                        },
                    },
                ],
            },
        },
        {
            name: "Missile Silo",
            stats: {
                missile: 1,
                free: 1,
            },
            tags: ["ground"],
            visible: true,
            passiveActions: {
                [LandmarkPassiveEventType.turnEnd]: {
                    type: LandmarkPassiveBehaviourType.checkStat,
                    data: {
                        stat: "free",
                        whenAvailable: {
                            type: LandmarkInteractionBehaviourType.triggerPassiveBehaviour,
                            data: {
                                type: LandmarkPassiveBehaviourType.spendStat,
                                data: {
                                    stat: "missile",
                                    whenAvailable: {
                                        type: LandmarkInteractionBehaviourType.triggerPassiveBehaviour,
                                        data: {
                                            type: LandmarkPassiveBehaviourType.pickRandomShip,
                                            data: {
                                                type: LandmarkInteractionBehaviourType.dealDamage,
                                                data: {
                                                    damage: 5,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            interactions: {
                discover: [
                    {
                        type: LandmarkInteractionBehaviourType.defaultDiscover,
                        data: {},
                    },
                ],
                capture: [
                    {
                        type: LandmarkInteractionBehaviourType.provideCard,
                        data: {
                            card: "Missile",
                            info: {
                                type: LandmarkInteractionBehaviourType.triggerPassiveBehaviour,
                                data: {
                                    type: LandmarkPassiveBehaviourType.spendStat,
                                    data: {
                                        stat: "missile",
                                    },
                                },
                            },
                        },
                    },
                    {
                        type: LandmarkInteractionBehaviourType.triggerPassiveBehaviour,
                        data: {
                            type: LandmarkPassiveBehaviourType.spendStat,
                            data: {
                                stat: "free",
                                whenAvailable: null,
                            },
                        },
                    },
                ],
            },
        },
    ],
};
