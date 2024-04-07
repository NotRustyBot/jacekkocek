function flatStatsToString(fs: FlatStats) {
    return Object.entries(fs)
        .map(([k, v]) => `${k}:${v}`)
        .join(" | ");
}

function tweaker(item: ItemType, tweak = 0): ShipItem {
    const stats = {
        agility: 0,
        armor: 0,
        cargo: 0,
        crew: 0,
        sensors: 0,
    };

    const keys = Object.keys(stats) as Array<keyof typeof stats>;
    const durability = itemDefinitions[item].durability;
    const baseStats = itemDefinitions[item].baseStats;

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
    objectivePoints = 0;
    shipBase: FlatStats = {
        agility: 3,
        armor: 3,
        cargo: 3,
        crew: 3,
        sensors: 3,
    };
    buffs = new Array<Buff>();
    items = new Array<ShipItem>();

    discoveredPointsOfInterest = new Array<PointOfInterest>();

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

    discover(poi: PointOfInterest) {
        this.discoveredPointsOfInterest.push(poi);
        return `You discovered ${poi.name}\n${poi.description}`;
    }

    removeItem(item: ShipItem) {
        this.items.splice(this.items.indexOf(item), 1);
    }

    say(text: string) {
        console.log(text);
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
            if (definition.target == ActionTarget.none) definition.action(this);
        }
    }
}

type Buff = {
    name: string;
    stats: FlatStats;
};

type PointOfInterest = {
    name: string;
    description: string;
    hidden?: true;
};

class GameLevel {
    pointsOfInterest = new Array<PointOfInterest>();
}

enum ActionContext {
    base,
    event,
    any,
}

class Game {
    currentLevel = new GameLevel();
    freeSlotLimits: Record<ItemSlot, number> = {
        system: 2,
        module: 3,
        affiliate: 1,
    };
    slotCost: Record<ItemSlot, number> = {
        system: 10,
        module: 25,
        affiliate: 10,
    };
    context = ActionContext.event;
}

let game = new Game();
game.currentLevel.pointsOfInterest.push({hidden: true, name: "Defense Platform", description: "A bloody gun pointin at ya"});

type ShipItem = {
    item: ItemType;
    stats: FlatStats;
    durability: number;
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
}

type ItemDefinition = {
    name: string;
    description: string;
    slot: ItemSlot;
    baseStats?: FlatStats;
    durability?: number;
    secret?: true;
    actions?: Array<ActionType>;
};


enum ActionTarget {
    none,
    otherShip,
    anyShip,
    secondary,
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
          target: ActionTarget.secondary;
          action(ship: Ship, target: any): string | void;
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
}

enum ActionType {
    fuelFilter,
    scoutDrone,
    cargoDrone,
    bubbleShield,
    expeditionGear,
    intelOfficerBroadScan,
    intelOfficerShipScan,
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
        description: "Reveals hidden information using sensors",
        slot: ItemSlot.module,
        actions: [ActionType.intelOfficerBroadScan, ActionType.intelOfficerShipScan],
    },
    [ItemType.infiltrator]: {
        name: "Specops Leader",
        description: "Leads your crew to complete various objectives.",
        slot: ItemSlot.module,
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
            ship.useDurability(ItemType.intelOfficer);
            let discovered: PointOfInterest = undefined;
            for (const poi of game.currentLevel.pointsOfInterest) {
                if (!poi.hidden) continue;
                if (ship.discoveredPointsOfInterest.includes(poi)) continue;
                discovered = poi;
                break;
            }
            
            if (discovered) {
                console.log(discovered);
                
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
            return target.shipInfo([ItemSlot.system, ItemSlot.module], true, true);
        },
    },
};

enum Resource {
    intel,
    research,
    material,
}

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
                level: 2,
            },
            {
                item: ItemType.gapaChair,
                level: 3,
            },
        ],
    },
};

const ship = new Ship();
ship.items.push(tweaker(ItemType.balancedImprovements));
ship.items.push(tweaker(ItemType.awareMod));
ship.items.push(tweaker(ItemType.crewSpec));
ship.items.push(tweaker(ItemType.intelOfficer));
ship.items.push(tweaker(ItemType.infiltrator));
console.log(ship.shipInfo([ItemSlot.system, ItemSlot.module, ItemSlot.affiliate], true, true));
console.log(ship.maintnance());
console.log(ship.possibleActions().map((a) => actionDefinition[a].name));
ship.doAction(ActionType.intelOfficerBroadScan);