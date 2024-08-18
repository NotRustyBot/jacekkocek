import { deserealizeParameters, executeAbsoluteActions, OfferData } from "./absoluteAction";
import { Card, Discardability } from "./card";
import { Game } from "./game";
import { HandStats } from "./handStatus";
import { Item } from "./item";
import { Landmark } from "./landmark";
import { Partner } from "./partner";
import { Resources } from "./resources";
import { Variables } from "./variables";


export type ShipPreferences = {
    cardDescriptionsInStatus: boolean;
};

export class Ship {
    preferences: ShipPreferences = {
        cardDescriptionsInStatus: true,
    };
    target: Landmark;
    variables = Variables.fromRecord({});
    loyalty = new Map<Partner, number>();
    offers = new Map<number, OfferData>();
    offerIndex = 0;

    playCard(cardId: number) {
        const card = this.hand[cardId];
        if (card && card.canBePlayed(this)) {
            const result = card.play(this);
            this.game.checkSidequests();
            return this.name + " plays: " + card.name + "\n" + result.join("\n");
        } else {
            return "Can't do that";
        }
    }

    addOffer(offer: OfferData) {
        this.offers.set(this.offerIndex++, offer);
    }

    acceptOffer(id: number) {
        const offer = this.offers.get(id);
        const params = deserealizeParameters(this.game, offer.parameters ?? {});
        if (offer) {
            const canAccept = this.game.stateRequirementsMet(offer.requirements, { ship: this, ...params});
            if (canAccept) {
                executeAbsoluteActions(offer.actions, { game: this.game, ship: this, ...params});
                this.offers.delete(id);
                return "Offer accepted";
            }
            return "Can't accept offer";
        }
        return "Can't find offer";
    }

    alterLoyalty(partner: Partner, amount: number) {
        this.loyalty.set(partner, (this.loyalty.get(partner) ?? 0) + amount);
    }

    getTotalLoyalty(partner: Partner) {
        return this.loyalty.get(partner) ?? 0;
    }

    dealDamage(damage: number) {
        this.hp = Math.max(this.hp - damage, 0);
        if (this.hp == 0) {
            this.game.say(`@${this.name} is out of commission.`);
            this.game.shipDestroyed(this);
        }
    }

    calculateVictoryPoints(statsThatCount: Variables) {
        let totalStast = this.totalStats();

        let vp = 0;

        for (const key in statsThatCount.values) {
            vp += statsThatCount.values[key] * (totalStast[key] ?? 0);
        }

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
        this.turnStats = new Variables();
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
        console.log("start turn", this.hand);

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
        const total = new Variables();
        total.alterValues(this.baseStats);
        total.alterValues(this.itemStats);
        total.alterValues(this.turnStats);
        return total;
    }

    id: number;
    game: Game;
    hand = new Array<Card>();
    deck = new Array<Card>();
    graveyard = new Array<Card>();
    items = new Map<number, Item>();
    stowage = new Map<number, Item>();
    resources = new Resources();
    name: string;
    victoryPoints = 0;
    hp = 10;

    baseHandStats: HandStats = {
        maxSize: 5,
        startingHand: 3,
        draw: 2,
    };

    baseStats = Variables.fromRecord({
        agility: 3,
        sensors: 3,
        crew: 3,
    });

    itemStats = new Variables();
    turnStats = new Variables();

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
        if (cardHandIndex == -1) return;
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
        this.stowage.set(item.id, item);
    }

    equipStowedItem(itemId: number) {
        if (this.game.missionInProgress && this.game.shipsOnMission.has(this.id)) {
            return "Ship is on a mission. You can't stow items while on a mission.";
        }

        const item = this.stowage.get(itemId);
        if (item) {
            this.addItem(item);
            this.stowage.delete(itemId);
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
            this.stowage.set(itemId, item);
            this.removeItem(item);
            return item.name;
        } else {
            return "Item not found";
        }
    }

    addResource(resource: string, amount: number) {
        this.resources[resource] = (this.resources[resource] ?? 0) + amount;
    }

    spendResource(resource: string, amount: number) {
        if (this.resources[resource] < amount) {
            return false;
        }
        this.resources[resource] = (this.resources[resource] ?? 0) - amount;
        return true;
    }
}
