import { Card, CardTemplate } from "./card";
import { Game } from "./game";
import { Ship } from "./ship";
import { Variables } from "./variables";

export enum ItemBehaviourKind {
    structuralItem,
    consumableProvider,
}

type ItemBehaviourDefinition = {
    kind: ItemBehaviourKind;
    followUp?: ItemBehaviourDefinition;
    data: any;
};

export type ItemTemplate = {
    behaviour: ItemBehaviourDefinition;
    name: string;
    description?: string;
};

export class Item {
    id: number;
    template: ItemTemplate;
    behaviours = new Array<ItemBehaviour>();
    constructor(game: Game, template: ItemTemplate) {
        this.id = game.itemIdProvider();
        this.template = template;
        let behave = this.template.behaviour;
        while (behave) {
            const behaviourConstructor = ItemBehaviourLookup[behave.kind];
            this.behaviours.push(new behaviourConstructor(game, this, behave.data));
            behave = behave.followUp;
        }
    }

    public get name(): string {
        return this.template.name;
    }

    public get description(): string {
        return this.template.description;
    }

    getItemFunctionalityDescription(){
        return this.behaviours.map(behaviour => behaviour.describe());
    }

    onMissionStart(ship: Ship) {
        for (const behaviour of this.behaviours) {
            behaviour.onMissionStart(ship);
        }
    }

    onTurnStart(ship: Ship) {
        for (const behaviour of this.behaviours) {
            behaviour.onTurnStart(ship);
        }
    }

    onTurnEnd(ship: Ship) {
        for (const behaviour of this.behaviours) {
            behaviour.onTurnEnd(ship);
        }
    }
}

abstract class ItemBehaviour {
    game: Game;
    item: Item;
    constructor(game: Game, item: Item) {
        this.game = game;
        this.item = item;
    }
    onMissionStart(ship: Ship) {}
    onTurnStart(ship: Ship) {}
    onTurnEnd(ship: Ship) {}

    abstract describe();
}

export class StructuralItemBehaviour extends ItemBehaviour {
    private statsToAdd = new Variables();
    constructor(game: Game, item: Item, data: { statsToAdd: Record<string, number> }) {
        super(game, item);
        this.statsToAdd.alterValues(data.statsToAdd);
    }
    onMissionStart(ship: Ship): void {
        ship.itemStats.alterValues(this.statsToAdd);
    }

    onUnequip(ship: Ship): void {
        ship.itemStats.alterValues(Variables.invert(this.statsToAdd.values));
    }

    describe() {
        return "Adds stats: " + this.statsToAdd.toString();
    }
}

export class CardProviderBehaviour extends ItemBehaviour {
    private playedCards = new Set<number>();
    private provideCards = new Array<CardTemplate>();
    constructor(game: Game, item: Item, data: { provideCards: Array<string> }) {
        super(game, item);
        for (const card of data.provideCards) {
            let cardTemplate: CardTemplate;
            cardTemplate = this.game.cardTemplates.get(card);
            this.provideCards.push(cardTemplate);
        }
    }

    cardPlayed(id: number): void {
        this.playedCards.delete(id);
    }

    onMissionStart(ship: Ship): void {
        console.log(ship.name + " equipped " + this.item.name);
        for (const cardTemplate of this.provideCards) {
            const card = this.game.cardFromTemplate(cardTemplate, this)
            ship.graveyard.push(card);
        }
    }

    onUnequip(ship: Ship): void {
        for (const card of this.playedCards) {
            ship.removeCardId(card);
        }
    }

    describe() {
        const cards = this.provideCards.reduce((acc, val) => {
            const count = acc.get(val.name) || 0;
            acc.set(val.name, count + 1);
            return acc;
        }, new Map<string, number>());
        const strings = Array.from(cards.entries()).map(([name, count]) => count > 1 ? `${count}x ${name}` : name);
        return "Provides cards: " + strings.join(", ");
    }
}

const ItemBehaviourLookup: Record<ItemBehaviourKind, new (game: Game, item: Item, data: any) => ItemBehaviour> = {
    [ItemBehaviourKind.structuralItem]: StructuralItemBehaviour,
    [ItemBehaviourKind.consumableProvider]: CardProviderBehaviour,
};
