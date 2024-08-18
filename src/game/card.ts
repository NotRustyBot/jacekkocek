import { AbsoluteAction, AbsoluteActions, AbsoluteActionType, executeAbsoluteActions } from "./absoluteAction";
import { Landmark } from "./landmark";
import { Ship } from "./ship";
import { Sidequest, StateCheck } from "./sidequest";
import { Variables } from "./variables";

export enum Discardability {
    turn = "turn",
    level = "level",
    never = "never",
}

export type CardTemplate = {
    conditions?: Array<StateCheck>;
    behaviour: AbsoluteActions;
    name: string;
    description?: string;

    discardability?: Discardability;
    exhaust?: true;
};

export type ActionResult = {
    success: boolean;
    reason?: string;
};

export class Card {
    id: number;
    template: CardTemplate;
    discardability: Discardability;
    sidequest?: Sidequest;

    constructor(id: number, template: CardTemplate, sidequest?: Sidequest) {
        this.id = id;
        this.sidequest = sidequest;
        this.template = template;
        this.discardability = template.discardability ?? Discardability.level;
    }

    public get name(): string {
        return this.template.name;
    }

    canBePlayed(ship: Ship) {
        if (this.template.conditions != undefined) {
            return ship.game.stateRequirementsMet(this.template.conditions, { ship: ship }) && this.checkBehaviours(ship).success;
        }
        return this.checkBehaviours(ship).success;
    }

    private checkBehaviours(ship: Ship) {
        let behaviours: Array<AbsoluteAction> = [];
        if (!(this.template.behaviour instanceof Array)) {
            behaviours.push(this.template.behaviour);
        } else {
            behaviours = this.template.behaviour;
        }

        const results = new Array<ActionResult>();
        let overallSuccess = true;
        let failResasons = new Array<string>(); 

        for (const behaviour of behaviours) {
            switch (behaviour.type) {
                case AbsoluteActionType.AlterShipStats:
                    if (!ship.totalStats().meetsRequirements(behaviour.stats)) {
                        failResasons.push(`You need ${Variables.toString(behaviour.stats)} (You have ${ship.totalStats().toString()})`);
                    }
                    break;
                default:
                    break;
            }
        }

        return { success: overallSuccess, results: results };
    }

    play(ship: Ship) {
        const result = executeAbsoluteActions(this.template.behaviour, { game: ship.game, ship: ship, landmark: ship.target, sidequest: this.sidequest });
        if (this.template.exhaust) {
            ship.removeCardId(this.id);
        } else {
            ship.graveyardCard(this);
        }
        return result;
    }
}
