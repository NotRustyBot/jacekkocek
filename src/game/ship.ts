import { Card } from "./card";
import { Game } from "./game";
import { Item } from "./item";

export type FlatStatsData = {
    agility?: number;
    sensors?: number;
    cargo?: number;
    crew?: number;
}

export class FlatStats {
    agility?: number;
    sensors?: number;
    cargo?: number;
    crew?: number;

    constructor(stats?: FlatStatsData) {
        Object.assign(this, stats);
    }

    add(other: FlatStatsData) {
        this.agility = (this.agility ?? 0) + (other.agility ?? 0);
        this.sensors = (this.sensors ?? 0) + (other.sensors ?? 0);
        this.cargo = (this.cargo ?? 0) + (other.cargo ?? 0);
        this.crew = (this.crew ?? 0) + (other.crew ?? 0);
    }

    remove(other: FlatStatsData) {
        this.agility = (this.agility ?? 0) - (other.agility ?? 0);
        this.sensors = (this.sensors ?? 0) - (other.sensors ?? 0);
        this.cargo = (this.cargo ?? 0) - (other.cargo ?? 0);
        this.crew = (this.crew ?? 0) - (other.crew ?? 0);
    }

    toString() {
        return JSON.stringify(this);
    }
};


export class Ship {
    totalStats() {
        const total = new FlatStats();
        total.add(this.baseStats);
        total.add(this.itemStats);
        total.add(this.turnStats);
        return total;
    }

    id: number;
    game: Game;
    cards = new Map<number, Card>();
    items = new Map<number, Item>();
    name: string;

    baseStats = new FlatStats({
        
        agility: 3,
        sensors: 3,
        cargo: 3,
        crew: 3,
    });

    itemStats = new FlatStats();
    turnStats = new FlatStats();


    constructor(game: Game, name: string) {
        this.name = name;
        this.game = game;
    }

    addCard(card: Card) {
        this.cards.set(card.id, card);
    }

    removeCard(card: Card) {
        this.cards.delete(card.id);
    }

    addItem(item: Item) {
        this.items.set(item.id, item);
        item.onEquip(this);
    }
}
