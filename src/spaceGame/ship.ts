import { flatStatsToString } from "./utils";

export class Ship {
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
    cards = new Array<Card>();

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
    possibleActions(): Array<Card> {
        return this.cards.filter(c => c.canBePlayed(this));
    }

    playCard(action: Card) {
        if (action.canBePlayed(this)) {
            return action.play(this);
        }
        return "Can't do that";
    }
}
