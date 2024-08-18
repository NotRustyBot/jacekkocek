import { AbsoluteAction, AbsoluteActions, executeAbsoluteActions } from "./absoluteAction";
import { Game } from "./game";
import { Ship } from "./ship";
import { StateCheck } from "./sidequest";
import { Variables } from "./variables";

export type PartnerTemplate = {
    name: string;
    description: string;
    actions: Array<PartnerOptions>;
};

export class Partner {
    game: Game;
    variables = new Variables();
    template: PartnerTemplate;

    constructor(game: Game, template: PartnerTemplate) {
        this.game = game;
        this.template = template;
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
                    executeAbsoluteActions(option.actions, { game: this.game, partner: this, ship: ship });
                    limit++;
                }
            }
        }
    }
}

export type PartnerOptions = {
    limit?: number;
    chance?: number;
    requirements?: Array<StateCheck>;
    actions: AbsoluteActions;
};
