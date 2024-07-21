import { CardBehaviourKind, CardTemplate } from "./card";
import { ItemBehaviourKind, ItemTemplate } from "./item";
import { LandmarkInteractionBehaviourType, LandmarkInteractionType, LandmarkPassiveBehaviourType, LandmarkPassiveEventType, LandmarkTemplate } from "./landmark";
import { PartnerActionType, PartnerTemplate } from "./partner";
import { SidequestActionKind, SidequestTemplate, StateCheckType } from "./sidequest";
import { TradeTemplate } from "./trade";

export type ContentData = {
    cards: Array<CardTemplate>;
    items: Array<ItemTemplate>;
    landmarks: Array<LandmarkTemplate>;
    trades: Array<TradeTemplate>;
    partners: Array<PartnerTemplate>;
    sidequests: Array<SidequestTemplate>;
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
            exhaust: true,
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
            name: "Objective Coordinates",
            behaviour: {
                kind: CardBehaviourKind.interactWithQuestLandmark,
                data: {
                    interactionType: "discover",
                    visible: false,
                },
            },
            exhaust: true,
        },
        {
            name: "Full Thrust",
            behaviour: {
                kind: CardBehaviourKind.gainStats,
                data: {
                    stats: {
                        agility: 4,
                    },
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
                        sensors: 5,
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
                },
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
                },
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
                },
            },
        },
    ],
    landmarks: [
        {
            name: "Lab",
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
                hack: [
                    {
                        type: LandmarkInteractionBehaviourType.triggerPassiveBehaviour,
                        data: {
                            type: LandmarkPassiveBehaviourType.alterQuestVariable,
                            data: {
                                variable: "rescued",
                                value: 1,
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
                                type: LandmarkPassiveBehaviourType.alterLandmarkVariable,
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
                                    type: LandmarkPassiveBehaviourType.alterLandmarkVariable,
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
                            type: LandmarkPassiveBehaviourType.alterLandmarkVariable,
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
    partners: [
        {
            name: "Talent Inc.",
            description: "Human resources specialist",
            actions: [
                {
                    limit: 1,
                    requirements: [
                        {
                            type: StateCheckType.Loyalty,
                            min: 0,
                        },
                    ],
                    actions: [
                        {
                            type: PartnerActionType.Offer,
                            requirements: [
                                {
                                    type: StateCheckType.Loyalty,
                                    min: 0,
                                },
                            ],
                            actions: [
                                {
                                    type: PartnerActionType.Sidequest,
                                    sidequest: "Human Resources",
                                },
                            ],
                        },
                    ],
                },
            ],
            allies: [],
            hostiles: [],
        },
        {
            name: "AIM",
            description: "Alliance for Interstellar Matters. Used to be an influential entity in shaping the course of galactic diplomacy.",
            actions: [],
            allies: ["Columbic Systems", "Warbird"],
            hostiles: ["Second Caliber", "Rule Zero"],
        },
        {
            name: "Second Caliber",
            description: "Weapon research, used to be part of AIM. Under investigation after it was suspected that the research was sold to others.",
            actions: [],
            allies: [],
            hostiles: ["Warbird"],
        },
        {
            name: "Columbic Systems",
            description: "Manufacturer of ship systems, mainly propulsion and navigation. Developed most of the tech used by AIM.",
            actions: [],
            allies: ["AIM"],
            hostiles: ["Rule Zero"],
        },
        {
            name: "Rule Zero",
            description: "Infamous hacker group. Claims to target authoritarians.",
            actions: [],
            allies: [],
            hostiles: ["AIM", "Columbic Systems"],
        },
        {
            name: "Warbird",
            description: "New weapons and systems developer for AIM.",
            actions: [],
            allies: ["AIM"],
            hostiles: ["Second Caliber"],
        },
    ],

    sidequests: [
        {
            name: "Employee Benefits",
            description: "We need you to rescue our employee. Open contract.",
            variables: {
                rescued: 0,
            },
            completionRequirements: [
                {
                    type: StateCheckType.Ship,
                    range: [
                        {
                            min: {
                                rescued: 1,
                            },
                            max: {},
                        },
                    ],
                },
            ],
            reward: [
                {
                    type: PartnerActionType.AlterLoyalty,
                    amount: 5,
                },
                {
                    type: PartnerActionType.AlterResource,
                    amount: 5,
                    resource: "cash",
                },
            ],
            setupActions: [
                {
                    kind: SidequestActionKind.createLandmark,
                    nametag: "office",
                    template: "Office",
                },
            ],
        },
        {
            name: "Human Resources",
            description: "One of our potential talents is waiting for evacuation. We're sure they'll happily work for us after this.",
            variables: {
                rescued: 0,
            },
            completionRequirements: [
                {
                    type: StateCheckType.Sidequest,
                    range: [
                        {
                            min: {
                                rescued: 1,
                            },
                            max: {},
                        },
                    ],
                },
            ],
            reward: [
                {
                    type: PartnerActionType.AlterLoyalty,
                    amount: 5,
                },
            ],
            setupActions: [
                {
                    kind: SidequestActionKind.createLandmark,
                    nametag: "lab",
                    template: "Lab",
                },
                {
                    kind: SidequestActionKind.giveQuestShipCards,
                    cards: [
                        {
                            template: "Objective Coordinates",
                            modification: {
                                behaviour: {
                                    data: {
                                        nametag: "lab",
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
