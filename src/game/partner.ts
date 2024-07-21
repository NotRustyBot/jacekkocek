import { Game } from "./game";
import { Ship } from "./ship";
import { StateCheck } from "./sidequest";
import { Variables } from "./variables";

export type PartnerTemplate = {
    name: string;
    description: string;
    allies: Array<string>;
    hostiles: Array<string>;
    actions: Array<PartnerActivityData>;
};

export class Partner {

    game: Game;
    variables = new Variables();
    template: PartnerTemplate;
    hostiles = new Set<string>();
    allies = new Set<string>();

    constructor(game: Game, template: PartnerTemplate) {
        this.game = game;
        this.template = template;

        for (const ally of template.allies) {
            this.allies.add(ally);
        }

        for (const hostile of template.hostiles) {
            this.hostiles.add(hostile);
        }
    }

    considerOptions(ships: Array<Ship>) {
        //randomize ship order
        ships = ships.sort(() => Math.random() - 0.5);
        for (const option of this.template.actions) {
            let limit = 0;
            for (const ship of ships) {
                if (option.limit != undefined && !(limit < option.limit)) continue;
                if (option.chance && Math.random() > option.chance) continue;
                if (this.game.stateRequirementsMet(option.requirements, { partner: this, ship: ship })) {
                    for (const action of option.actions) {
                        this.action(action, ship);
                    }
                    limit++;
                }
            }
        }
    }

    action(action: PartnerActionData, ship: Ship) {
        switch (action.type) {
            case PartnerActionType.Offer:
                ship.addOffer({
                    data: action,
                    partner: this.template.name,
                });
                break;
            case PartnerActionType.GiveItem:
                ship.addItemToStowage(this.game.createItem(action.item));
                break;
            case PartnerActionType.AlterLoyalty:
                ship.alterLoyalty(this, action.amount);
                break;
            case PartnerActionType.AlterResource:
                ship.addResource(action.resource, action.amount);
                break;
            case PartnerActionType.ChangeRelation:
                this.changeRelation(action.target, action.relation);
                break;
            case PartnerActionType.Sidequest:
               this.game.createSidequest(action.sidequest, ship, this);
                break;
        }
    }

    actions(actions: PartnerActionData[], ship: Ship) {
        for (const action of actions) {
            this.action(action, ship);
        }
    }

    changeRelation(target: string, relation: PartnerRelations) {
        this.hostiles.delete(target);
        this.allies.delete(target);

        if (relation == PartnerRelations.Ally) {
            this.allies.add(target);
        } else if (relation == PartnerRelations.Hostile) {
            this.hostiles.add(target);
        }
    }
}

type PartnerActivityData = {
    requirements: Array<StateCheck>;
    actions: Array<PartnerActionData>;
    chance?: number;
    limit?: number;
};

export enum PartnerActionType {
    Offer = "offer",
    GiveItem = "giveItem",
    AlterLoyalty = "alterLoyalty",
    AlterResource = "alterResource",
    ChangeRelation = "changeRelation",
    Sidequest = "sidequest",
}

export type PartnerActionData = PartnerActionOfferData | PartnerActionGiveItemData | PartnerActionAlterLoyaltyData | PartnerActionAlterResourceData | PartnerActionChangeRelationData | PartnerActionSidequestData;

type PartnerActionGiveItemData = {
    type: PartnerActionType.GiveItem;
    item: string;
};

export type PartnerOfferData = {
    data: PartnerActionOfferData;
    partner: string;
}

type PartnerActionOfferData = {
    type: PartnerActionType.Offer;
    requirements: Array<StateCheck>;
    actions: Array<PartnerActionData>;
};

type PartnerActionAlterLoyaltyData = {
    type: PartnerActionType.AlterLoyalty;
    amount: number;
};

type PartnerActionAlterResourceData = {
    type: PartnerActionType.AlterResource;
    resource: string;
    amount: number;
};

type PartnerActionSidequestData = {
    type: PartnerActionType.Sidequest;
    sidequest: string;
};


enum PartnerRelations {
    Neutral = "neutral",
    Ally = "ally",
    Hostile = "hostile",
}

type PartnerActionChangeRelationData = {
    type: PartnerActionType.ChangeRelation;
    target: string;
    relation: PartnerRelations;
}