import { Card, CardProvider, CardTemplate, Discardability } from "./card";
import { Game } from "./game";
import { HandStats } from "./handStatus";
import { Item } from "./item";
import { Landmark } from "./landmark";

export type FlatStatsData = {
    agility?: number;
    sensors?: number;
    crew?: number;
};

export class FlatStats {
    agility = 0;
    sensors = 0;
    crew = 0;

    constructor(stats?: FlatStatsData) {
        Object.assign(this, stats);
    }

    add(other: FlatStatsData) {
        this.agility = this.agility + (other.agility ?? 0);
        this.sensors = this.sensors + (other.sensors ?? 0);
        this.crew = this.crew + (other.crew ?? 0);
    }

    remove(other: FlatStatsData) {
        this.agility = Math.max(this.agility - (other.agility ?? 0), 0);
        this.sensors = Math.max(this.sensors - (other.sensors ?? 0), 0);
        this.crew = Math.max(this.crew - (other.crew ?? 0), 0);
    }

    toString() {
        const parts = [];
        if (this.agility) parts.push(`agility: ${this.agility}`);
        if (this.sensors) parts.push(`sensors: ${this.sensors}`);
        if (this.crew) parts.push(`crew: ${this.crew}`);
        return parts.join(", ");
    }
}

export class Ship {

    target: Landmark;
    playCard(cardId: number) {
        const card = this.hand[cardId];
        if (card.canBePlayed(this)) {
            return this.name + " plays: " + card.name + "\n" + card.play(this);
        } else {
            return "Can't do that";
        }
    }

    dealDamage(damage: number) {
        this.hp = Math.max(this.hp - damage, 0);
        if (this.hp == 0) {
            this.game.say(`@${this.name} is out of commission.`);
            this.game.shipDestroyed(this);
        }
    }

    calculateVictoryPoints(statsThatCount: FlatStatsData) {
        statsThatCount.agility = statsThatCount.agility ?? 0;
        statsThatCount.crew = statsThatCount.crew ?? 0;
        statsThatCount.sensors = statsThatCount.sensors ?? 0;

        let totalStast = this.totalStats();

        let vp = 0;
        vp += statsThatCount.agility * totalStast.agility;
        vp += statsThatCount.crew * totalStast.crew;
        vp += statsThatCount.sensors * totalStast.sensors;
        this.victoryPoints += vp;
        return vp;
    }

    missionStart() {
        this.graveyard = [];
        this.deck = [];
        this.hand = [];
        for (const [id, item] of this.items) {
            item.onMissionStart(this);
        }

        const handStats = this.currentHandStats();
        this.drawCards(handStats.startingHand);
    }

    turnEnd() {
        this.turnStats = new FlatStats();
        for (const [id, item] of this.items) {
            item.onTurnEnd(this);
        }

        for (const card of this.hand) {
            if (card.discardability == Discardability.turn) {
                this.removeCard(card);
            }
        }
    }

    currentHandStats() {
        const stats = { ...this.baseHandStats };

        return stats;
    }

    turnStart() {
        console.log("start turn" ,this.hand);
        
        for (const [id, item] of this.items) {
            console.log("Starting item " + item.name);
            item.onTurnStart(this);
        }

        const handStats = this.currentHandStats();

        for (let c = 0; c < handStats.draw; c++) {
            this.drawCard();
        }
    }

    drawCards(amount: number) {
        for (let c = 0; c < amount; c++) {
            this.drawCard();
        }
    }

    drawCard() {
        if (this.deck.length == 0) {
            for (let i = 0; i < this.graveyard.length; i++) {
                const index = Math.floor(Math.random() * this.graveyard.length);
                this.deck.push(this.graveyard[index]);
                this.graveyard.splice(index, 1);
            }
        }

        const card = this.deck.pop();
        const currentHandStats = this.currentHandStats();

        if (currentHandStats.maxSize > this.hand.length) {
            this.addCard(card);
        }
    }

    totalStats() {
        const total = new FlatStats();
        total.add(this.baseStats);
        total.add(this.itemStats);
        total.add(this.turnStats);
        return total;
    }

    id: number;
    game: Game;
    hand = new Array<Card>();
    deck = new Array<Card>();
    graveyard = new Array<Card>();
    items = new Map<number, Item>();
    storage = new Map<number, Item>();
    resources: Record<string, number> = {};
    name: string;
    victoryPoints = 0;
    hp = 10;

    baseHandStats: HandStats = {
        maxSize: 5,
        startingHand: 3,
        draw: 2,
    };

    baseStats = new FlatStats({
        agility: 3,
        sensors: 3,
        crew: 3,
    });

    itemStats = new FlatStats();
    turnStats = new FlatStats();

    constructor(game: Game, name: string) {
        this.name = name;
        this.game = game;
        this.id = game.shipIdProvider();
    }

    addCard(card: Card) {
        console.log(this.hand);

        console.log(card);
        console.log("Added card " + card.name);

        this.hand.push(card);
        
    }

    removeCard(card: Card) {
        this.removeCardId(card.id);
    }

    graveyardCard(card: Card) {
        this.removeCardId(card.id);
        this.graveyard.push(card);
    }

    removeCardId(cardId: number) {
        const cardHandIndex = this.hand.findIndex((c) => c.id == cardId);
        if (cardHandIndex == -1)  return;
        console.log(this.hand.map((c) => c.name));
        console.log("Removed card " + cardHandIndex);
        this.hand.splice(cardHandIndex, 1);
        console.log(this.hand.map((c) => c.name));
        
    }

    addItem(item: Item) {
        this.items.set(item.id, item);
    }

    removeItem(item: Item) {
        this.items.delete(item.id);
    }

    clearMission() {
        this.victoryPoints = 0;
        this.hp = 10;
        for (const card of this.hand) {
            if (card.discardability == Discardability.level) {
                this.removeCard(card);
            }
        }
    }

    addItemToStowage(item: Item) {
        this.storage.set(item.id, item);
    }

    equipStowedItem(itemId: number) {
        if (this.game.missionInProgress && this.game.shipsOnMission.has(this.id)) {
            return "Ship is on a mission. You can't stow items while on a mission.";
        }

        const item = this.storage.get(itemId);
        if (item) {
            this.addItem(item);
            this.storage.delete(itemId);
            return item.name + " equipped";
        } else {
            return "Item not found";
        }
    }

    stowItem(itemId: number) {
        if (this.game.missionInProgress && this.game.shipsOnMission.has(this.id)) {
            return "Ship is on a mission. You can't stow items while on a mission.";
        }

        if (this.items.has(itemId)) {
            const item = this.items.get(itemId)!;
            this.storage.set(itemId, item);
            this.removeItem(item);
            return item.name;
        } else {
            return "Item not found";
        }
    }
}
