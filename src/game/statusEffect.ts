import { AbsoluteActionParameters, AbsoluteActions, executeAbsoluteActions } from "./absoluteAction";
import { Game } from "./game";
import { Ship } from "./ship";

export class StatusEffect {
    game: Game;
    ship: Ship;
    name: string;
    severity: number;
    template: StatusEffectTemplate;

    constructor(name: string, severity: number, game: Game, ship: Ship, template: StatusEffectTemplate) {
        this.game = game;
        this.ship = ship;
        this.template = template;
        this.name = name;
        this.severity = severity;
    }

    trigger(triggerType: StatusEffectActionTrigger, suplementary?: Partial<AbsoluteActionParameters>) {
        const actions = this.template.actions[triggerType];
        const params = { game: this.game, ship: this.ship, ...suplementary };

        if (actions) {
            executeAbsoluteActions(actions, params);
        }

        return params;
    }
}

export enum StatusEffectActionTrigger {
    TurnStart = "TurnStart",
    TurnEnd = "TurnEnd",
    Interaction = "Interaction",
    Cost = "Cost",
    Damage = "Damage",
    CardPlayed = "CardPlayed",
    CardDrawn = "CardDrawn",
    CardExhausted = "CardExhausted",
    PickedAsRandomTarget = "PickedAsRandomTarget",
}

export type StatusEffectTemplate = {
    name: string;
    actions: { [K in StatusEffectActionTrigger]?: AbsoluteActions };
};
