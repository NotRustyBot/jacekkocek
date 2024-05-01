function flatStatsToString(fs: FlatStats) {
    return Object.entries(fs)
        .map(([k, v]) => `${k}:${v}`)
        .join(" | ");
}

function pickRandom<T extends any>(arry: Array<T>): T {
    return arry[Math.floor(Math.random() * arry.length)];
}

function itemizer(item: ItemType, tweak = 0): ShipItem {
    const stats = {
        agility: 0,
        armor: 0,
        cargo: 0,
        crew: 0,
        sensors: 0,
    };

    const keys = Object.keys(stats) as Array<keyof typeof stats>;
    const definition = itemDefinitions[item];
    const durability = definition.durability;
    const baseStats = definition.baseStats;

    stats.agility += baseStats?.agility ?? 0;
    stats.armor += baseStats?.armor ?? 0;
    stats.cargo += baseStats?.cargo ?? 0;
    stats.crew += baseStats?.crew ?? 0;
    stats.sensors += baseStats?.sensors ?? 0;

    for (let i = 0; i < tweak; i++) {
        stats[keys.at(Math.floor(Math.random() * keys.length))]++;
        stats[keys.at(Math.floor(Math.random() * keys.length))]--;
        stats[keys.at(Math.floor(Math.random() * keys.length))]++;
    }

    return { item, stats, durability };
}

class Ship {
    name: string;
    objectivePoints = 0;
    shipBase: FlatStats = {
        agility: 3,
        armor: 3,
        cargo: 3,
        crew: 3,
        sensors: 3,
    };

    resources: Record<Resource, number> = {
        [Resource.intel]: 0,
        [Resource.material]: 0,
        [Resource.research]: 0,
    };

    buffs = new Array<Buff>();
    items = new Array<ShipItem>();

    discoveredPointsOfInterest = new Array<PoiInfo>();

    totalStats(): FlatStats {
        const total = { ...this.shipBase };

        for (const item of this.items) {
            total.agility += item.stats?.agility ?? 0;
            total.armor += item.stats?.armor ?? 0;
            total.cargo += item.stats?.cargo ?? 0;
            total.crew += item.stats?.crew ?? 0;
            total.sensors += item.stats?.sensors ?? 0;
        }

        for (const buff of this.buffs) {
            total.agility += buff.stats?.agility ?? 0;
            total.armor += buff.stats?.armor ?? 0;
            total.cargo += buff.stats?.cargo ?? 0;
            total.crew += buff.stats?.crew ?? 0;
            total.sensors += buff.stats?.sensors ?? 0;
        }

        return total;
    }

    useDurability(item: ItemType) {
        const candidates = this.items.filter((c) => c.item == item);
        candidates.sort((a, b) => a.durability - b.durability);
        if (candidates.length > 0) {
            const item = candidates[0];
            item.durability--;
            if (item.durability <= 0) {
                this.removeItem(item);
            }
        } else {
            console.error(`Using durability of non-existent item ${item} (that's bad)`);
        }
    }

    discover(poi: PoiInfo) {
        this.discoveredPointsOfInterest.push(poi);
        return `You discovered ${poi.name}\n${poi.description}`;
    }

    removeItem(item: ShipItem) {
        this.items.splice(this.items.indexOf(item), 1);
    }

    giveItem(item: ShipItem) {
        this.items.push(item);
    }

    say(text: string) {
        console.log("@" + this.name + text);
    }

    processStartTurn() {
        for (const item of this.items) {
            const definition = itemDefinitions[item.item];
            const actions = definition.events?.filter((f) => f.type == ItemEventType.turnStart) ?? [];
            for (const action of actions) {
                action.action(this);
            }
        }
    }

    processEndTurn() {
        for (const item of this.items) {
            const definition = itemDefinitions[item.item];

            if (definition.decay != undefined && definition.decay == ActionDecay.turn) {
                this.removeItem(item);
                continue;
            }

            const actions = definition.events?.filter((f) => f.type == ItemEventType.turnEnd) ?? [];
            for (const action of actions) {
                action.action(this);
            }
        }
    }

    shipInfo(types: Array<ItemSlot>, showTotals = false, showBuffs = false, showSecret = false): string {
        let result = "";
        for (const type of types) {
            result += "\n\n" + type + ":";
            for (const item of this.items) {
                const info = itemDefinitions[item.item];
                if (info.slot == type && (showSecret || !info.secret)) {
                    result += `\n${info.secret ? "*" : ""} **${info.name + (info.durability ? " (" + item.durability + ")" : "")}** ${info.description} ${info.secret ? "*" : ""}`;
                }
            }
        }

        if (showBuffs) {
            result += "\n\nBuffs:";
            for (const buff of this.buffs) {
                result += "\n" + buff.name + flatStatsToString(buff.stats);
            }
        }

        if (showTotals) {
            result += "\n\nTotal:\n";
            result += flatStatsToString(this.totalStats());
        }

        return result;
    }

    maintnance() {
        let toPay = 0;
        for (const key of Object.keys(ItemSlot)) {
            const count = this.items.filter((f) => itemDefinitions[f.item].slot == key).length;
            const overLimit = count - game.freeSlotLimits[key];
            if (overLimit > 0) {
                const pay = game.slotCost[key] * Math.pow(2, overLimit);
                toPay += pay;
            }
        }
        return toPay;
    }

    target = undefined;
    targetKind = ActionTarget.none;
    possibleActions(): Array<ActionType> {
        const allActions = this.items.flatMap((i) => itemDefinitions[i.item].actions).filter((f) => f != undefined);
        return allActions.filter((a) => actionDefinition[a].context == game.context && actionDefinition[a].target == this.targetKind);
    }

    doAction(action: ActionType) {
        if (this.possibleActions().includes(action)) {
            const definition = actionDefinition[action];
            if (definition.target == ActionTarget.none) return definition.action(this);
            if (definition.target == ActionTarget.poi) return definition.action(this, this.target);
        }
    }
}

type Buff = {
    name: string;
    stats: FlatStats;
};

enum PoiType {
    missileSilo,
    probe,
    /*
    broadcastTower,
    laboratory,
    excavationSite,
    defensePlatform,
    militaryOutpost,*/
}

type PoiInfo = {
    type: PoiType;
    name: string;
    description: string;
    affiliate?: AffiliateType;
    hidden?: boolean;
};

enum InterestCategory {
    military,
    research,
    resourceAquisition,
    wip,
    intel,
}

type PoiGenerator = {
    name: string;
    description: string;
    hidden: number;
    nick: string[];
    onSpawn?: (poi: PoiInfo) => void;
    onDiscovery?: (poi: PoiInfo, discoverer: Ship | false) => void;
    onCapture?: (poi: PoiInfo, capturer: Ship) => void;
    onHack?: (poi: PoiInfo, hacker: Ship) => void;
};

const militaryNick: Array<string> = ["Raven", "Overlord", "Citadel", "Fortress", "Bastion", "Eagle", "Vanguard", "Delta", "Phoenix", "Titan", "Shadow", "Sentinel", "Thunder"];
const scienceNick: Array<string> = ["Echo"];

const poiDefinition: Record<PoiType, PoiGenerator> = {
    [PoiType.missileSilo]: {
        name: "Missile Silo",
        description: "Military installation capable of launching missiles",
        hidden: 0.9,
        nick: militaryNick,
        onSpawn(poi) {
            const ra: ReadyAction = { action: ReadyActionType.missileSiloFireAtShip, data: { poi, target: pickRandom(game.ships) } };
            game.readyAction.push(ra);
        },
        onCapture(poi, capturer) {
            game.removeReadyAction({ poi: poi });
            const si: ShipItem = {
                item: ItemType.missileSiloMissile,
                poi: poi,
                durability: 1,
                stats: {},
            };
            capturer.giveItem(si);
        },
    },
    [PoiType.probe]: {
        name: "Probe",
        description: "Autonomous machine with scanning equipment",
        hidden: 0.9,
        nick: scienceNick,
        onSpawn(poi) {
            const ra: ReadyAction = { action: ReadyActionType.missileSiloFireAtShip, data: { poi, target: pickRandom(game.ships) } };
            game.readyAction.push(ra);
        },

        onHack(poi, hacker) {
            if(game.currentLevel.stats.sensors){
                hacker.sca
            }
        },
    }
};

class GameLevel {
    stats: FlatStats;
    poiExists(poi: PoiInfo): boolean {
        return this.pointsOfInterest.includes(poi);
    }

    pointsOfInterest = new Array<PoiInfo>();
}

enum ActionContext {
    base,
    event,
    any,
}

type LevelTypeInfo = {
    name: string;
    description: string;
    primaryStats: FlatStats;
};

type LevelInfo = {
    name: string;
    primaryStats: FlatStats;
    stages: number;
    difficulty: number;
    complexity: number;
};

const levelType: Array<LevelTypeInfo> = [
    {
        name: "Evacuation",
        description: "$name declared emergency. You are tasked with evacuating civilians from the area. Be quick, and prepare for a bumpy landing.",
        primaryStats: { agility: 1, armor: 1 },
    },
    {
        name: "Cargo Hop",
        description: "$name needs some supplies. Let's not keep them waiting.",
        primaryStats: { agility: 1, cargo: 1 },
    },
    {
        name: "Hit and Run",
        description: "Rebel forces have captred highly defendable positions on $name. We need you to carry out a series of suprise attacks to assist our forces.",
        primaryStats: { agility: 1, crew: 1 },
    },
    {
        name: "Exploration",
        description: "Some parts of $name are not fully explored. Why not take a look?",
        primaryStats: { agility: 1, sensors: 1 },
    },
    {
        name: "Combat Resupply",
        description: "Our forces on $name are running low on supplies. Get ready to catch some strays.",
        primaryStats: { armor: 1, cargo: 1 },
    },
    {
        name: "Point Capture",
        description: "A group of rebels is currently attempting to overthrow the goverment on $name, by force. Stop them.",
        primaryStats: { armor: 1, crew: 1 },
    },
    {
        name: "Anomaly Scan",
        description: "Something is going on on $name. It doesn't look safe. Investigate the situation.",
        primaryStats: { armor: 1, sensors: 1 },
    },
    {
        name: "Battlefield Salvage",
        description: "After the incident on $name, there is a lot of scrap. We don't really need it, but we don't want the rebels to have it.",
        primaryStats: { cargo: 1, crew: 1 },
    },
    {
        name: "Prospects",
        description: "It appears $name has a few deposits of the good stuff. Find them, and bring us some samples.",
        primaryStats: { cargo: 1, sensors: 1 },
    },
    {
        name: "Search and Rescue",
        description: "This time you need to find and rescue survivors of a recent disaster on $name.",
        primaryStats: { crew: 1, sensors: 1 },
    },
];

class Game {
    ships = new Array<Ship>();
    say(text: string) {
        console.log(text);
    }

    destroyPoi(target: PoiInfo) {
        const index = this.currentLevel.pointsOfInterest.indexOf(target);
        this.currentLevel.pointsOfInterest.splice(index, 1);
    }

    currentLevel = new GameLevel();
    readyAction = new Array<ReadyAction>();
    freeSlotLimits: Record<ItemSlot, number> = {
        system: 2,
        module: 3,
        affiliate: 1,
        action: 0,
    };
    slotCost: Record<ItemSlot, number> = {
        system: 10,
        module: 25,
        affiliate: 10,
        action: 0,
    };

    context = ActionContext.event;
    removeReadyAction(filter: any) {
        const removeAt = this.readyAction.findIndex((ra) => Object.entries(filter).every(([k, v]) => v == ra.data[k]));
        this.readyAction.splice(removeAt, 1);
    }
    processTurn() {
        for (const ready of this.readyAction) {
            const action = ready.action;
            readyActionDefinition[action](ready);
        }

        for (const ship of this.ships) {
            ship.processEndTurn();
        }

        this.awardOP();
    }

    awardOP() {
        let teamTotal = 0;
        let teamTotalGain = 0;
        for (const ship of this.ships) {
            let total = 1;
            for (const [key, value] of Object.entries(this.currentLevel.stats)) {
                if (value) {
                    total *= value * ship.totalStats()[key];
                }
            }

            teamTotalGain += total;
            ship.objectivePoints += total;
            teamTotal += ship.objectivePoints;
            this.say(`**${ship.name}** earned ${total} Objective Points this round. Total: ${ship.objectivePoints}`);
        }

        this.say(`Team gained ${teamTotalGain} OP this round. Total ${teamTotal}`);
    }

    chooseLevel(): LevelInfo {
        const pickedType = pickRandom(levelType);
        const place = [
            "Solstice",
            "Hypernova",
            "Orion",
            "Centauri",
            "Nova",
            "Draco",
            "Andromeda",
            "Phoenix",
            "Polaris",
            "Colangula",
            "Araket",
            "Pulsar",
            "Vega",
            "Sirius",
            "Vista",
            "Alico",
            "Zebra",
            "Trident",
            "Dark",
            "Far",
            "Inner",
            "Central",
        ];

        const systems = [
            "Belt",
            "System",
            "Cluster",
            "Mainstar",
            "Dwarf",
            "Orbital",
            "Nebula",
            "Arrangement",
        ]

        const latinNumbers = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
        const moon = ["", "", "", "a", "a", "a", "b", "b", "c"];
        const system = `${pickRandom(place)} ${pickRandom(systems)} ${pickRandom(latinNumbers)}${pickRandom(moon)}`;
        const info: LevelInfo = {
            name: `${system} - ${pickedType.name}`,
            complexity: 2,
            difficulty: 1,
            primaryStats: pickedType.primaryStats,
            stages: 1,
        };
        this.say(info.name);
        let desc = pickedType.description;
        this.say(desc.replaceAll("$name", system));

        return info;
    }

    initialiseLevel(info: LevelInfo) {
        const complexity = info.complexity + Math.floor(info.complexity * Math.random());
        this.currentLevel = new GameLevel();

        for (let i = 0; i < complexity; i++) {
            const poiType = Math.floor(Math.random() * Object.entries(poiDefinition).length) as PoiType;
            console.log(poiType);

            const poiGen: PoiGenerator = poiDefinition[poiType];

            const newPoi: PoiInfo = {
                type: poiType,
                name: pickRandom(poiGen.nick) + ` ${Math.floor(Math.random() * 9 + 1)} ` + poiGen.name,
                description: poiGen.description,
                hidden: Math.random() < poiGen.hidden,
            };

            poiGen.onSpawn(newPoi);
            this.currentLevel.pointsOfInterest.push(newPoi);
            this.currentLevel.stats = info.primaryStats;
        }

        this.stageStart();
    }

    stageStart() {
        for (const ship of this.ships) {
            ship.processStartTurn();
        }
    }

    attackPoi(target: PoiInfo) {
        let isProtected = false;
        this.destroyPoi(target);
        return isProtected;
    }
}

let game = new Game();

type ShipItem =
    | {
          item: ItemType;
          stats: FlatStats;
          durability: number;
      }
    | {
          item: ItemType.missileSiloMissile;
          stats: FlatStats;
          durability: number;
          poi: PoiInfo;
      };

type FlatStats = {
    agility?: number;
    sensors?: number;
    cargo?: number;
    armor?: number;
    crew?: number;
};

enum ItemSlot {
    system = "system",
    module = "module",
    affiliate = "affiliate",
    action = "action",
}

enum ItemEventType {
    turnStart,
    turnEnd,
}

type ItemEvent = {
    type: ItemEventType;
    action: (ship: Ship) => void;
};

enum ActionDecay {
    turn,
    level,
}

type ItemDefinition = {
    name: string;
    description: string;
    slot: ItemSlot;
    baseStats?: FlatStats;
    durability?: number;
    secret?: true;
    actions?: Array<ActionType>;
    events?: Array<ItemEvent>;
    decay?: ActionDecay;
};

enum ActionTarget {
    none,
    otherShip,
    anyShip,
    poi,
    affiliate,
}

type ActionDefinition = {
    name: string;
    description: string;
    context: ActionContext;
    secret?: true;
} & TargetedAction;

type TargetedAction =
    | {
          target: ActionTarget.none;
          action(ship: Ship): string | void;
      }
    | {
          target: ActionTarget.otherShip;
          action(ship: Ship, target: Ship): string | void;
      }
    | {
          target: ActionTarget.anyShip;
          action(ship: Ship, target: Ship): string | void;
      }
    | {
          target: ActionTarget.poi;
          action(ship: Ship, target: PoiInfo): string | void;
      };

enum ItemType {
    balancedImprovements,
    explorerMod,
    deliveryMod,
    evacMod,
    cavalryMod,
    prospectorMod,
    awareMod,
    rescueMod,
    runnerMod,
    salvageMod,
    takeoverMod,
    agilitySpec,
    sensorsSpec,
    cargoSpec,
    armorSpec,
    crewSpec,
    fuelFilter,
    scoutDrone,
    cargoDrone,
    bubbleShield,
    expeditionGear,
    intelOfficer,
    infiltrator,
    ace,
    tacticalOfficer,
    gapaChair,
    talentInc,
    intelOfficerBasicScan,
    missileSiloMissile,
    infiltratorPoiCapture,
}

enum ActionType {
    fuelFilter,
    scoutDrone,
    cargoDrone,
    bubbleShield,
    expeditionGear,
    intelOfficerBroadScan,
    intelOfficerShipScan,
    missileSiloAntiPoI,
    missileSiloAntiShip,
    infiltratorOperation,
}

const itemDefinitions: Record<ItemType, ItemDefinition> = {
    [ItemType.balancedImprovements]: {
        name: "Balanced Improvements",
        description: "+1 to all stats",
        slot: ItemSlot.system,
        baseStats: {
            agility: 1,
            armor: 1,
            cargo: 1,
            crew: 1,
            sensors: 1,
        },
    },
    [ItemType.explorerMod]: {
        name: "'Explorer' Mod",
        description: "+3 to agility and sensors",
        slot: ItemSlot.system,
        baseStats: {
            agility: 3,
            sensors: 3,
        },
    },
    [ItemType.deliveryMod]: {
        name: "'Delivery' Mod",
        description: "+3 to agility and cargo",
        slot: ItemSlot.system,
        baseStats: {
            agility: 3,
            cargo: 3,
        },
    },
    [ItemType.evacMod]: {
        name: "'Evac' Mod",
        description: "+3 to agility and armor",
        slot: ItemSlot.system,
        baseStats: {
            agility: 3,
            armor: 3,
        },
    },
    [ItemType.cavalryMod]: {
        name: "'Cavalry' Mod",
        description: "+3 to agility and crew",
        slot: ItemSlot.system,
        baseStats: {
            agility: 3,
            crew: 3,
        },
    },
    [ItemType.prospectorMod]: {
        name: "'Prospector' Mod",
        description: "+3 to sensors and cargo",
        slot: ItemSlot.system,
        baseStats: {
            sensors: 3,
            cargo: 3,
        },
    },
    [ItemType.awareMod]: {
        name: "'Aware' Mod",
        description: "+3 to sensors and armor",
        slot: ItemSlot.system,
        baseStats: {
            sensors: 3,
            armor: 3,
        },
    },
    [ItemType.rescueMod]: {
        name: "'Rescue' Mod",
        description: "+3 to sensors and crew",
        slot: ItemSlot.system,
        baseStats: {
            sensors: 3,
            crew: 3,
        },
    },
    [ItemType.runnerMod]: {
        name: "'Runner' Mod",
        description: "+3 to cargo and armor",
        slot: ItemSlot.system,
        baseStats: {
            cargo: 3,
            armor: 3,
        },
    },
    [ItemType.salvageMod]: {
        name: "'Salvage' Mod",
        description: "+3 to cargo and crew",
        slot: ItemSlot.system,
        baseStats: {
            cargo: 3,
            crew: 3,
        },
    },
    [ItemType.takeoverMod]: {
        name: "'Takeover' Mod",
        description: "+3 to armor and crew",
        slot: ItemSlot.system,
        baseStats: {
            armor: 3,
            crew: 3,
        },
    },
    [ItemType.agilitySpec]: {
        name: "Agility Specialization",
        description: "+7 to agility",
        slot: ItemSlot.system,
        baseStats: {
            agility: 7,
        },
    },
    [ItemType.sensorsSpec]: {
        name: "Sensor Specialization",
        description: "+7 to sensors",
        slot: ItemSlot.system,
        baseStats: {
            sensors: 7,
        },
    },
    [ItemType.cargoSpec]: {
        name: "Cargo Specialization",
        description: "+7 to cargo",
        slot: ItemSlot.system,
        baseStats: {
            cargo: 7,
        },
    },
    [ItemType.armorSpec]: {
        name: "Armor Specialization",
        description: "+7 to armor",
        slot: ItemSlot.system,
        baseStats: {
            armor: 7,
        },
    },
    [ItemType.crewSpec]: {
        name: "Crew Specialization",
        description: "+7 to crew",
        slot: ItemSlot.system,
        baseStats: {
            crew: 7,
        },
    },
    [ItemType.fuelFilter]: {
        name: "Fuel Filter",
        description: "on use: +5 agility",
        slot: ItemSlot.module,
    },
    [ItemType.scoutDrone]: {
        name: "Scout Drone",
        description: "on use: +5 sensors",
        slot: ItemSlot.module,
    },
    [ItemType.cargoDrone]: {
        name: "Cargo Drone",
        description: "on use: +5 cargo",
        slot: ItemSlot.module,
    },
    [ItemType.bubbleShield]: {
        name: "Bubble Shield",
        description: "on use: +5 armor",
        slot: ItemSlot.module,
    },
    [ItemType.expeditionGear]: {
        name: "Expedition Gear",
        description: "on use: +5 crew",
        slot: ItemSlot.module,
    },
    [ItemType.intelOfficer]: {
        name: "Intel Officer",
        description: "Enables basic scanning using sensors",
        slot: ItemSlot.module,
        events: [
            {
                type: ItemEventType.turnStart,
                action(ship) {
                    ship.giveItem({
                        item: ItemType.intelOfficerBasicScan,
                        durability: 0,
                        stats: {},
                    });
                },
            },
        ],
    },
    [ItemType.intelOfficerBasicScan]: {
        name: "Basic Scan",
        description: "(Intel Officer) Reveals hidden information using sensors",
        slot: ItemSlot.action,
        actions: [ActionType.intelOfficerBroadScan, ActionType.intelOfficerShipScan],
        decay: ActionDecay.turn,
    },
    [ItemType.infiltrator]: {
        name: "Specops Leader",
        description: "Leads your crew to complete various objectives.",
        slot: ItemSlot.module,
        events: [
            {
                type: ItemEventType.turnStart,
                action(ship) {
                    ship.giveItem({
                        item: ItemType.infiltratorPoiCapture,
                        durability: 0,
                        stats: {},
                    });
                },
            },
        ],
    },
    [ItemType.infiltratorPoiCapture]: {
        name: "Infiltration Operation",
        description: "(Specops Leader) Captures a point of interest",
        slot: ItemSlot.action,
        actions: [ActionType.infiltratorOperation],
        decay: ActionDecay.turn,
    },
    [ItemType.ace]: {
        name: "Ace Pilot",
        description: "Skilled pilot, using agility to solve problems.",
        slot: ItemSlot.module,
    },
    [ItemType.tacticalOfficer]: {
        name: "Tactical Officer",
        description: "Experienced tactician capable of taking advantage of your ships strengths.",
        slot: ItemSlot.module,
    },
    [ItemType.gapaChair]: {
        name: "GaPA Chairman",
        description: "Sometimes it's good to have someone from the HQ on board.",
        slot: ItemSlot.module,
    },
    [ItemType.talentInc]: {
        name: "Talent Inc.",
        description: "Top of the line humans.",
        slot: ItemSlot.affiliate,
        durability: 1,
        actions: [],
    },
    [ItemType.missileSiloMissile]: {
        name: "Siloed Missile",
        description: "A missile. Works in anti-ground, but also in anti-orbital capacity.",
        slot: ItemSlot.action,
        durability: 1,
        actions: [ActionType.missileSiloAntiPoI, ActionType.missileSiloAntiShip],
    },
};

const actionDefinition: Record<ActionType, ActionDefinition> = {
    [ActionType.fuelFilter]: {
        name: "Filter Fuel",
        description: "+5 agility",
        context: ActionContext.event,
        target: ActionTarget.none,
        action(ship) {
            ship.useDurability(ItemType.fuelFilter);
            ship.buffs.push({
                name: "Fuel Filter",
                stats: { agility: 5 },
            });
        },
    },
    [ActionType.scoutDrone]: {
        name: "Scout Drone",
        description: "+5 sensors",
        context: ActionContext.event,
        target: ActionTarget.none,
        action(ship) {
            ship.useDurability(ItemType.scoutDrone);
            ship.buffs.push({ name: "Scout Drone", stats: { sensors: 5 } });
        },
    },
    [ActionType.cargoDrone]: {
        name: "Cargo Drone",
        description: "+5 cargo",
        context: ActionContext.event,
        target: ActionTarget.none,
        action(ship) {
            ship.useDurability(ItemType.cargoDrone);
            ship.buffs.push({ name: "Cargo Drone", stats: { cargo: 5 } });
        },
    },
    [ActionType.bubbleShield]: {
        name: "Bubble Shield",
        description: "+5 armor",
        context: ActionContext.event,
        target: ActionTarget.none,
        action(ship) {
            ship.useDurability(ItemType.bubbleShield);
            ship.buffs.push({ name: "Bubble Shield", stats: { armor: 5 } });
        },
    },
    [ActionType.expeditionGear]: {
        name: "Expedition Gear",
        description: "+5 crew",
        context: ActionContext.event,
        target: ActionTarget.none,
        action(ship) {
            ship.useDurability(ItemType.expeditionGear);
            ship.buffs.push({ name: "Expedition Gear", stats: { crew: 5 } });
        },
    },
    [ActionType.intelOfficerBroadScan]: {
        name: "Broad Scan",
        description: "Searches for a point of interest. -3 OP",
        context: ActionContext.event,
        target: ActionTarget.none,
        secret: true,
        action(ship) {
            ship.objectivePoints -= 3;
            ship.useDurability(ItemType.intelOfficerBasicScan);
            ship.useDurability(ItemType.intelOfficer);
            let discovered: PoiInfo = undefined;
            for (const poi of game.currentLevel.pointsOfInterest) {
                if (!poi.hidden) continue;
                if (ship.discoveredPointsOfInterest.includes(poi)) continue;
                discovered = poi;
                break;
            }

            if (discovered) {
                return ship.discover(discovered);
            } else {
                return "No points of interest.";
            }
        },
    },
    [ActionType.intelOfficerShipScan]: {
        name: "Ship Scan",
        description: "Shows ship systems, modules (including secret ones) and buffs. -3 OP",
        context: ActionContext.event,
        target: ActionTarget.otherShip,
        secret: true,
        action(ship, target) {
            ship.objectivePoints -= 3;
            ship.useDurability(ItemType.intelOfficer);
            ship.useDurability(ItemType.intelOfficerBasicScan);
            return target.shipInfo([ItemSlot.system, ItemSlot.module], true, true);
        },
    },
    [ActionType.missileSiloAntiPoI]: {
        name: "Siloed Missile - Static Target",
        description: "Launch a missile from the silo. Destroys a point of interest.",
        context: ActionContext.event,
        target: ActionTarget.poi,
        secret: true,
        action(ship, target) {
            const msl = ship.items.find((f) => f.item == ItemType.missileSiloMissile);
            if ("poi" in msl && game.currentLevel.poiExists(msl.poi)) {
                game.readyAction.push({
                    action: ReadyActionType.missileSiloFireAtPoi,
                    data: {
                        poi: msl.poi,
                        target: target,
                    },
                });
                ship.useDurability(ItemType.missileSiloMissile);
                return "Missile is locked in. ETA end of turn.";
            } else {
                ship.useDurability(ItemType.missileSiloMissile);
                return "Missile cannot be fired";
            }
        },
    },
    [ActionType.missileSiloAntiShip]: {
        name: "Siloed Missile - Ship Target",
        description: "Launch a missile from the silo. Damages a ship.",
        context: ActionContext.event,
        target: ActionTarget.anyShip,
        secret: true,
        action(ship, target) {
            const msl = ship.items.find((f) => f.item == ItemType.missileSiloMissile);
            if ("poi" in msl && game.currentLevel.poiExists(msl.poi)) {
                game.readyAction.push({
                    action: ReadyActionType.missileSiloFireAtShip,
                    data: {
                        poi: msl.poi,
                        target: target,
                    },
                });
                ship.useDurability(ItemType.missileSiloMissile);
                return "Missile is locked in. ETA end of turn.";
            } else {
                ship.useDurability(ItemType.missileSiloMissile);
                return "Missile cannot be fired";
            }
        },
    },

    [ActionType.infiltratorOperation]: {
        name: "Infiltration Operation",
        description: "Captures a point of interest. -3 OP",
        context: ActionContext.event,
        target: ActionTarget.poi,
        secret: true,
        action(ship, target) {
            const definition = poiDefinition[target.type];
            if (definition.onCapture) {
                definition.onCapture(target, ship);
                return `**${target.name}** is now under our control.`;
            } else {
                ship.objectivePoints -= 3;
                ship.useDurability(ItemType.infiltrator);
                ship.useDurability(ItemType.infiltratorPoiCapture);
                return "We cannot capture this target.";
            }
        },
    },
};

enum Resource {
    intel,
    research,
    material,
}

enum ReadyActionType {
    missileSiloFireAtShip,
    missileSiloFireAtPoi,
}

type ReadyAction =
    | {
          action: ReadyActionType.missileSiloFireAtShip;
          data: {
              poi: PoiInfo;
              target: Ship;
          };
      }
    | {
          action: ReadyActionType.missileSiloFireAtPoi;
          data: {
              poi: PoiInfo;
              target: PoiInfo;
          };
      };

const readyActionDefinition: Record<ReadyActionType, (ra: ReadyAction) => void> = {
    [ReadyActionType.missileSiloFireAtPoi]: (ra: ReadyAction) => {
        if (ra.action != ReadyActionType.missileSiloFireAtPoi) return;
        const data = ra.data;
        if (game.currentLevel.poiExists(data.poi)) {
            if (game.currentLevel.poiExists(data.target)) {
                data.poi.hidden = false;
                game.say(`A missile was launched from **${data.poi.name}**`);
                game.say(`The missile impacted **${data.target.name}**, destroying it instantly`);
                game.destroyPoi(data.target);
            }
        }
    },
    [ReadyActionType.missileSiloFireAtShip]: (ra: ReadyAction) => {
        if (ra.action != ReadyActionType.missileSiloFireAtShip) return;
        const data = ra.data;
        if (game.currentLevel.poiExists(data.poi)) {
            data.poi.hidden = false;
            game.say(`A missile was launched from **${data.poi.name}**`);
            const systems = data.target.items.filter((f) => itemDefinitions[f.item].slot == ItemSlot.system);
            game.say(`The missile impacted **${data.target.name}**`);
            if (systems.length > 0) {
                const destroyed = pickRandom(systems);
                const destroyedInfo = itemDefinitions[destroyed.item];
                data.target.removeItem(destroyed);
                game.say(`The explosion destroyed **${destroyedInfo.name}**`);
            }
        }
    },
};

type AffiliateInfo = {
    name: string;
    description: string;
    resource: Resource;
    offers: Array<AffiliateOffer>;
};

type AffiliateOffer = {
    item: ItemType;
    level: number;
    tweak?: number;
};

enum AffiliateType {
    talentInc,
}

const affiliateDefinition: Record<AffiliateType, AffiliateInfo> = {
    [AffiliateType.talentInc]: {
        name: "Talent Inc.",
        description: "Top of the line humans.",
        resource: Resource.intel,
        offers: [
            {
                item: ItemType.intelOfficer,
                level: 1,
            },
            {
                item: ItemType.ace,
                level: 1,
            },
            {
                item: ItemType.infiltrator,
                level: 1,
            },
            {
                item: ItemType.tacticalOfficer,
                level: 3,
            },
            {
                item: ItemType.gapaChair,
                level: 5,
            },
        ],
    },
};

function makeAffiliateOffer(affiliate: AffiliateType, level: number) {
    const info = affiliateDefinition[affiliate];
    const possibleOffers = info.offers.filter((o) => o.level <= level);
    return pickRandom(possibleOffers);
}

const ship = new Ship();
ship.name = "Celestia One";
game.ships.push(ship);
ship.items.push(itemizer(ItemType.balancedImprovements));
ship.items.push(itemizer(ItemType.awareMod));
ship.items.push(itemizer(ItemType.crewSpec));
ship.items.push(itemizer(ItemType.intelOfficer));
ship.items.push(itemizer(ItemType.infiltrator));

game.initialiseLevel(game.chooseLevel());
console.log(ship.possibleActions().map((a) => actionDefinition[a].name));
console.log(ship.doAction(ActionType.intelOfficerBroadScan));
console.log(ship.doAction(ActionType.intelOfficerBroadScan));
ship.target = ship.discoveredPointsOfInterest[0];
ship.targetKind = ActionTarget.poi;
console.log(ship.possibleActions().map((a) => actionDefinition[a].name));
console.log(ship.doAction(ActionType.infiltratorOperation));
ship.target = ship.discoveredPointsOfInterest[1];
console.log(ship.doAction(ActionType.missileSiloAntiPoI));

game.processTurn();
