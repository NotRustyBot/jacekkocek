import { Card, CardTemplate } from "./card";
import { FlatStatsData, FlatStats, Ship } from "./ship";


enum ItemBehaviourKind {
    structuralItem,
    cardProvier
}
type ItemBehaviourDefinition = {
    kind: ItemBehaviourKind;
    followUp?: ItemBehaviourDefinition;
    data: any;
}

export type ItemTemplate = {
    behaviour: ItemBehaviourDefinition;
    name: string;
    description: string;
}

export class Item {
    id: number;
    template: ItemTemplate;
    behaviours = new Array<ItemBehaviour>();
    create() {
        let behave = this.template.behaviour;
        while (behave) {
            this.behaviours.push(new ItemBehaviourLookup[behave.kind](behave.data));
            behave = behave.followUp;
        }
    }

    public get name(): string {
        return this.template.name;
    }

    public get description(): string {
        return this.template.description;
    }

    onEquip(ship: Ship) {
        console.log(ship.name + " equipped " + this.name);
    }

    onUnequip(ship: Ship) {
        console.log(ship.name + " unequipped " + this.name);
    }

    onTurnStart(ship: Ship) {
    }

    onTurnEnd(ship: Ship) {
    }

}

abstract class ItemBehaviour {
    onEquip(ship: Ship) { }
    onUnequip(ship: Ship) { }
    onTurnStart(ship: Ship) { }
    onTurnEnd(ship: Ship) { }
}

export class StructuralItem extends ItemBehaviour {
    private statsToAdd = new FlatStats();
    constructor(data: {statsToAdd: FlatStatsData}) {
        super();
        this.statsToAdd.add(data.statsToAdd);
    }
    onEquip(ship: Ship): void {
        super.onEquip(ship);
        ship.itemStats.add(this.statsToAdd);
    }

    onUnequip(ship: Ship): void {
        super.onUnequip(ship);
        ship.itemStats.remove(this.statsToAdd);
    }
}

export class CardProvider extends Item {
    private playedCards = new Array<Card>();
    private provideCards = new Array<CardTemplate>();
    constructor(data: {provideCards: CardTemplate[]}) {
        super();
        this.provideCards = data.provideCards;
    }
    
    onUnequip(ship: Ship): void {
        super.onUnequip(ship);
        for (const card of this.playedCards) {
            ship.removeCard(card);
        }
    }
}

const ItemBehaviourLookup: Record<ItemBehaviourKind, new (data: any) => ItemBehaviour> = {
    [ItemBehaviourKind.structuralItem]: StructuralItem,
    [ItemBehaviourKind.cardProvier]: CardProvider
}
