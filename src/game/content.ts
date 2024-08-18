import { AbsoluteActionType } from "./absoluteAction";
import { CardTemplate } from "./card";
import { ItemBehaviourKind, ItemTemplate } from "./item";
import { LandmarkInteractionType, LandmarkPassiveEventType, LandmarkTemplate } from "./landmark";
import { PartnerTemplate } from "./partner";
import { SidequestActionKind, SidequestTemplate, StateCheckType } from "./sidequest";
import { StatusEffectTemplate } from "./statusEffect";
import { TradeTemplate } from "./trade";

export type ContentData = {
    cards: Array<CardTemplate>;
    items: Array<ItemTemplate>;
    landmarks: Array<LandmarkTemplate>;
    trades: Array<TradeTemplate>;
    partners: Array<PartnerTemplate>;
    sidequests: Array<SidequestTemplate>;
    effects: Array<StatusEffectTemplate>;
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
            behaviour: [
                {
                    type: AbsoluteActionType.AlterStats,
                    stats: {
                        ["sensors"]: -3,
                    },
                },
                {
                    type: AbsoluteActionType.InteractWithRandomLandmark,
                    conditions: [
                        {
                            type: StateCheckType.LandmarkVisible,
                            visible: false,
                        },
                    ],
                    actions: [
                        {
                            type: AbsoluteActionType.InteractWithLandmark,
                            interaction: "discover",
                        },
                    ],
                },
            ],
        },

        {
            name: "SPAM Shot",
            behaviour: {
                type: AbsoluteActionType.InteractWithLandmark,
                interaction: "attack",
            },
            exhaust: true,
        },
        {
            name: "Tactical Takeover",
            behaviour: [
                {
                    type: AbsoluteActionType.AlterShipStats,
                    stats: {
                        ["crew"]: -5,
                    },
                },
                {
                    type: AbsoluteActionType.InteractWithLandmark,
                    interaction: "capture",
                },
            ],
        },
        {
            name: "Demolition Squad",
            behaviour: [
                {
                    type: AbsoluteActionType.AlterShipStats,
                    stats: {
                        ["crew"]: -3,
                    },
                },
                {
                    type: AbsoluteActionType.InteractWithLandmark,
                    interaction: "attack",
                },
            ],
        },
        {
            name: "Exploration Gear",
            behaviour: [
                {
                    type: AbsoluteActionType.AlterShipStats,
                    stats: {
                        ["crew"]: -3,
                    },
                },
                {
                    type: AbsoluteActionType.InteractWithRandomLandmark,
                    conditions: [
                        {
                            type: StateCheckType.LandmarkVisible,
                            visible: false,
                        },
                    ],
                    actions: [
                        {
                            type: AbsoluteActionType.InteractWithLandmark,
                            interaction: "discover",
                        },
                    ],
                },
            ],
        },
        {
            name: "All hands on deck!",
            behaviour: [
                {
                    type: AbsoluteActionType.AlterShipStats,
                    stats: {
                        ["crew"]: -3,
                    },
                },
                {
                    type: AbsoluteActionType.DrawCard,
                    count: 2,
                },
            ],
        },
        {
            name: "Scout Ahead",
            behaviour: [
                {
                    type: AbsoluteActionType.AlterShipStats,
                    stats: {
                        ["agility"]: -3,
                    },
                },
                {
                    type: AbsoluteActionType.InteractWithRandomLandmark,
                    conditions: [
                        {
                            type: StateCheckType.LandmarkVisible,
                            visible: false,
                        },
                    ],
                    actions: [
                        {
                            type: AbsoluteActionType.InteractWithLandmark,
                            interaction: "discover",
                        },
                    ],
                },
            ],
        },
        {
            name: "Heat",
            behaviour: [],
        },
        {
            name: "Objective Coordinates",
            behaviour: {
                type: AbsoluteActionType.InteractWithQuestLandmark,
                actions: {
                    type: AbsoluteActionType.InteractWithLandmark,
                    interaction: "discover",
                },
            },
            exhaust: true,
        },
        {
            name: "Full Thrust",
            behaviour: {
                type: AbsoluteActionType.AlterShipStats,
                stats: {
                    ["agility"]: -4,
                },
            },
        },
        {
            name: "Copycat Exploit",
            behaviour: {
                type: AbsoluteActionType.InteractWithLandmark,
                interaction: "hack",
            },
        },
        {
            name: "Assisted Planning",
            behaviour: [
                {
                    type: AbsoluteActionType.AlterShipStats,
                    stats: {
                        sensors: -5,
                    },
                },
                {
                    type: AbsoluteActionType.DrawCard,
                    count: 2,
                },
            ],
        },
        {
            name: "Missile",
            description: "Missile",
            behaviour: {
                type: AbsoluteActionType.InteractWithLandmark,
                interaction: "attack",
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
                        type: AbsoluteActionType.DestroyLandmark,
                    },
                    {
                        type: AbsoluteActionType.AwardVictoryPoints,
                        victoryPoints: 1,
                    },
                ],
                hack: [
                    {
                        type: AbsoluteActionType.AlterQuestVariable,
                        variables: {
                            rescued: 1,
                        },
                    },
                ],
                discover: [
                    {
                        type: AbsoluteActionType.SetLandmarkVisibility,
                        visible: true,
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
                        type: AbsoluteActionType.DestroyLandmark,
                    },
                    {
                        type: AbsoluteActionType.AwardVictoryPoints,
                        victoryPoints: 1,
                    },
                ],
                capture: [
                    {
                        type: AbsoluteActionType.DestroyLandmark,
                    },
                    {
                        type: AbsoluteActionType.AwardVictoryPoints,
                        victoryPoints: 5,
                    },
                ],
                discover: [
                    {
                        type: AbsoluteActionType.SetLandmarkVisibility,
                        visible: true,
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
                            type: AbsoluteActionType.SetLandmarkVisibility,
                            visible: true,
                        },
                        {
                            type: AbsoluteActionType.DamageShip,
                            damage: 1,
                        },
                    ],
                },
            ],
            interactions: {
                discover: [
                    {
                        type: AbsoluteActionType.SetLandmarkVisibility,
                        visible: true,
                    },
                ],
                attack: [
                    {
                        type: AbsoluteActionType.DestroyLandmark,
                    },
                    {
                        type: AbsoluteActionType.AwardVictoryPoints,
                        victoryPoints: 1,
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
                    type: AbsoluteActionType.Condition,
                    requirements: [
                        {
                            type: StateCheckType.Landmark,
                            range: [
                                {
                                    min: {
                                        missile: 1,
                                        free: 1,
                                    },
                                },
                            ],
                        },
                    ],
                    successActions: [
                        {
                            type: AbsoluteActionType.AlterLandmarkVariable,
                            variables: {
                                missile: -1,
                            },
                        },
                        {
                            type: AbsoluteActionType.DamageShip,
                            damage: 5,
                        },
                    ],
                },
            },
            interactions: {
                discover: [
                    {
                        type: AbsoluteActionType.SetLandmarkVisibility,
                        visible: true,
                    },
                ],
                capture: [
                    {
                        type: AbsoluteActionType.ProvideCard,
                        card: "Missile",
                    },
                    {
                        type: AbsoluteActionType.SetLandmarkVariable,
                        variables: {
                            free: 0,
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
                            max: 0,
                        },
                    ],
                    actions: [
                        {
                            type: AbsoluteActionType.Offer,
                            offerData: {
                                parameters: {

                                },
                                description: "One of our potential talents is waiting for evacuation. We're sure they'll happily work for us after this.",
                                actions: [
                                    {
                                        type: AbsoluteActionType.GiveQuest,
                                        name: "Human Resources",
                                    },
                                ],
                                requirements: [
                                    {
                                        type: StateCheckType.Loyalty,
                                        min: 0,
                                        max: 0,
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        },
        {
            name: "AIM",
            description: "Alliance for Interstellar Matters. Used to be an influential entity in shaping the course of galactic diplomacy.",
            actions: [],
        },
        {
            name: "Second Caliber",
            description: "Weapon research, used to be part of AIM. Under investigation after it was suspected that the research was sold to others.",
            actions: [],
        },
        {
            name: "Columbic Systems",
            description: "Manufacturer of ship systems, mainly propulsion and navigation. Developed most of the tech used by AIM.",
            actions: [],
        },
        {
            name: "Rule Zero",
            description: "Infamous hacker group. Claims to target authoritarians.",
            actions: [],
        },
        {
            name: "Warbird",
            description: "New weapons and systems developer for AIM.",
            actions: [],
        },
    ],

    sidequests: [
        {
            name: "Human Resources",
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
                    type: AbsoluteActionType.AlterShipsPartnerLoyalty,
                    loyalty: 5,
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
                                    nametag: "lab",
                                },
                            },
                        },
                    ],
                },
            ],
        },
    ],
    effects: [
        {
            name: "Inspiration",
            actions: {
                Cost: {
                    type: AbsoluteActionType.Condition,
                    requirements: [
                        {
                            type: StateCheckType.Stats,
                            range: [
                                {
                                    min: {
                                        crew: 1,
                                    },
                                },
                            ],
                        },
                    ],
                    successActions: [
                        {
                            type: AbsoluteActionType.AlterStats,
                            stats: {
                                crew: 1,
                            },
                        },
                    ],
                },
            },
        },
    ],
};
