import { Game } from "./game";
import { Landmark } from "./landmark";
import { Partner } from "./partner";
import { Ship } from "./ship";
import { Sidequest, StateCheck } from "./sidequest";
import { pickRandom } from "./utils";
import { Variables } from "./variables";

export enum AbsoluteActionType {
    AlterLandmarkVariable = "AlterLandmarkVariable",
    SetLandmarkVariable = "SetLandmarkVariable",
    AlterGameVariable = "AlterGameVariable",
    SetGameVariable = "SetGameVariable",
    SetLandmarkVisibility = "SetLandmarkVisibility",
    PickRandomShipOnMission = "PickRandomShip",
    InteractWithEveryoneOnMission = "InteractWithEveryone",
    AlterQuestVariable = "AlterQuestVariable",
    SetQuestVariable = "SetQuestVariable",
    GiveQuest = "GiveQuest",
    AlterShipVariable = "AlterShipVariable",
    SetShipVariable = "SetShipVariable",
    AlterShipStats = "AlterShipStats",
    SetShipStats = "SetShipStats",
    AlterPartnerVariable = "AlterPartnerVariable",
    SetPartnerVariable = "SetPartnerVariable",
    AlterShipsPartnerLoyalty = "AlterPartnerLoyalty",
    SetShipsPartnerLoyalty = "SetPartnerLoyalty",
    AwardVictoryPoints = "AwardVictoryPoints",
    Say = "Say",
    DestroyLandmark = "DestroyLandmark",
    DamageShip = "DamageShip",
    InteractWithLandmark = "InteractWithLandmark",
    Condition = "Condition",
    ProvideCard = "ProvideCard",
    AlterStats = "AlterStats",
    SetStats = "SetStats",
    InteractWithRandomLandmark = "InteractWithRandomLandmark",
    DrawCard = "DrawCard",
    InteractWithQuestLandmark = "InteractWithQuestLandmark",
    Offer = "Offer",
}

export type AbsoluteActionAlterLandmarkVariable = {
    type: AbsoluteActionType.AlterLandmarkVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionSetLandmarkVariable = {
    type: AbsoluteActionType.SetLandmarkVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionAlterGameVariable = {
    type: AbsoluteActionType.AlterGameVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionSetGameVariable = {
    type: AbsoluteActionType.SetGameVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionSetLandmarkVisibility = {
    type: AbsoluteActionType.SetLandmarkVisibility;
    visible: boolean;
};

export type AbsoluteActionPickRandomShip = {
    type: AbsoluteActionType.PickRandomShipOnMission;
    actions: AbsoluteActions;
};

export type AbsoluteActionInteractWithEveryone = {
    type: AbsoluteActionType.InteractWithEveryoneOnMission;
    actions: AbsoluteActions;
};

export type AbsoluteActionAlterQuestVariable = {
    type: AbsoluteActionType.AlterQuestVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionSetQuestVariable = {
    type: AbsoluteActionType.SetQuestVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionAlterShipVariable = {
    type: AbsoluteActionType.AlterShipVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionSetShipVariable = {
    type: AbsoluteActionType.SetShipVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionAlterShipStats = {
    type: AbsoluteActionType.AlterShipStats;
    stats: Record<string, number>;
};

export type AbsoluteActionSetShipStats = {
    type: AbsoluteActionType.SetShipStats;
    stats: Record<string, number>;
};

export type AbsoluteActionAlterPartnerVariable = {
    type: AbsoluteActionType.AlterPartnerVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionSetPartnerVariable = {
    type: AbsoluteActionType.SetPartnerVariable;
    variables: Record<string, number>;
};

export type AbsoluteActionAlterPartnerLoyalty = {
    type: AbsoluteActionType.AlterShipsPartnerLoyalty;
    loyalty: number;
};

export type AbsoluteActionSetPartnerLoyalty = {
    type: AbsoluteActionType.SetShipsPartnerLoyalty;
    loyalty: number;
};

export type AbsoluteActionAwardVictoryPoints = {
    type: AbsoluteActionType.AwardVictoryPoints;
    victoryPoints: number;
};

export type AbsoluteActionSay = {
    type: AbsoluteActionType.Say;
    text: string;
};

export type AbsoluteActionDestroyLandmark = {
    type: AbsoluteActionType.DestroyLandmark;
};

export type AbsoluteActionDamageShip = {
    type: AbsoluteActionType.DamageShip;
    damage: number;
};

export type AbsoluteActionInteractWithLandmark = {
    type: AbsoluteActionType.InteractWithLandmark;
    interaction: string;
    value?: number;
};

export type AbsoluteActionCondition = {
    type: AbsoluteActionType.Condition;
    requirements: Array<StateCheck>;
    successActions?: Array<AbsoluteAction>;
    failureActions?: Array<AbsoluteAction>;
};

export type AbsoluteActionProvideCard = {
    type: AbsoluteActionType.ProvideCard;
    card: string;
};

export type AbsoluteActionAlterStats = {
    type: AbsoluteActionType.AlterStats;
    stats: Record<string, number>;
};

export type AbsoluteActionSetStats = {
    type: AbsoluteActionType.SetStats;
    stats: Record<string, number>;
};

export type AbsoluteActionInteractWithRandomLandmark = {
    type: AbsoluteActionType.InteractWithRandomLandmark;
    conditions?: Array<StateCheck>;
    actions: AbsoluteActions;
};

export type AbsoluteActionDrawCard = {
    type: AbsoluteActionType.DrawCard;
    count?: number;
};

export type AbsoluteActionInteractWithQuestLandmark = {
    type: AbsoluteActionType.InteractWithQuestLandmark;
    actions: AbsoluteActions;
    nametag?: string;
};

export type AbsoluteActionOffer = {
    type: AbsoluteActionType.Offer;
    offerData: OfferData;
};

export type AbsoluteActionGiveQuest = {
    type: AbsoluteActionType.GiveQuest;
    name: string;
};

export type AbsoluteActions = Array<AbsoluteAction> | AbsoluteAction;

export type AbsoluteAction =
    | AbsoluteActionAlterLandmarkVariable
    | AbsoluteActionSetLandmarkVariable
    | AbsoluteActionAlterGameVariable
    | AbsoluteActionSetGameVariable
    | AbsoluteActionSetLandmarkVisibility
    | AbsoluteActionPickRandomShip
    | AbsoluteActionInteractWithEveryone
    | AbsoluteActionAlterQuestVariable
    | AbsoluteActionSetQuestVariable
    | AbsoluteActionAlterShipVariable
    | AbsoluteActionSetShipVariable
    | AbsoluteActionAlterShipStats
    | AbsoluteActionSetShipStats
    | AbsoluteActionAlterPartnerVariable
    | AbsoluteActionSetPartnerVariable
    | AbsoluteActionAlterPartnerLoyalty
    | AbsoluteActionSetPartnerLoyalty
    | AbsoluteActionAwardVictoryPoints
    | AbsoluteActionSay
    | AbsoluteActionDestroyLandmark
    | AbsoluteActionDamageShip
    | AbsoluteActionInteractWithLandmark
    | AbsoluteActionCondition
    | AbsoluteActionAlterStats
    | AbsoluteActionSetStats
    | AbsoluteActionInteractWithRandomLandmark
    | AbsoluteActionDrawCard
    | AbsoluteActionInteractWithQuestLandmark
    | AbsoluteActionOffer
    | AbsoluteActionGiveQuest
    | AbsoluteActionProvideCard;

export type AbsoluteActionParameters = {
    game: Game;
    ship?: Ship;
    landmark?: Landmark;
    partner?: Partner;
    sidequest?: Sidequest;
    value?: number;
    stats?: Record<string, number>;
};

export type AbsoluteActionsParametersSerialized = {
    ship?: number;
    landmark?: number;
    partner?: string;
    sidequest?: number;
    value?: number;
    stats?: Record<string, number>;
};

export function executeAbsoluteActions(actions: AbsoluteActions, parameters: AbsoluteActionParameters) {
    const result = new Array<string>();
    recursiveAbsoluteAction(actions, parameters, result);
    console.log(result.join("\n"));
    return result;
}

function recursiveAbsoluteAction(actions: AbsoluteActions, parameters: AbsoluteActionParameters, description: Array<string> = []) {
    if (!(actions instanceof Array)) {
        actions = [actions];
    }

    for (const action of actions) {
        let modifiableParameters = { ...parameters };
        absoluteActionLookup[action.type](action, modifiableParameters, description);
    }
}

const absoluteActionLookup: Record<AbsoluteActionType, (action: AbsoluteAction, parameters: AbsoluteActionParameters, description?: Array<string>) => void> = {
    [AbsoluteActionType.AlterLandmarkVariable]: (action: AbsoluteActionAlterLandmarkVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.landmark!.stats.alterValues(action.variables);
        description.push(`change ${parameters.landmark.name} variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetLandmarkVariable]: (action: AbsoluteActionSetLandmarkVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.landmark!.stats.alterValues(action.variables, true);
        description.push(`set ${parameters.landmark.name} variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.AlterGameVariable]: (action: AbsoluteActionAlterGameVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.game!.variables.alterValues(action.variables);
        description.push(`change game variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetGameVariable]: (action: AbsoluteActionSetGameVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.game!.variables.alterValues(action.variables, true);
        description.push(`set game variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetLandmarkVisibility]: (action: AbsoluteActionSetLandmarkVisibility, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.landmark!.visible = action.visible;
        description.push(`set ${parameters.landmark.name} visibility to ${action.visible}`);
    },
    [AbsoluteActionType.PickRandomShipOnMission]: (action: AbsoluteActionPickRandomShip, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship = pickRandom([...parameters.game!.shipsOnMission.values()]);
        description.push(`${parameters.ship.name} was picked randomly`);
        recursiveAbsoluteAction(action.actions, parameters, description);
    },
    [AbsoluteActionType.InteractWithEveryoneOnMission]: (action: AbsoluteActionInteractWithEveryone, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`every ship:`);
        for (const ship of parameters.game!.shipsOnMission.values()) {
            const params = { ...parameters, ship: ship };
            description.push(`- ${ship.name}`);
            recursiveAbsoluteAction(action.actions, params, description);
        }
    },
    [AbsoluteActionType.AlterQuestVariable]: (action: AbsoluteActionAlterQuestVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.sidequest!.variables.alterValues(action.variables);
        description.push(`change ${parameters.sidequest!.template.name} variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetQuestVariable]: (action: AbsoluteActionSetQuestVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.sidequest!.variables.alterValues(action.variables, true);
        description.push(`set ${parameters.sidequest!.template.name} variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.AlterShipVariable]: (action: AbsoluteActionAlterShipVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship!.variables.alterValues(action.variables);
        description.push(`change ${parameters.ship!.name} variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetShipVariable]: (action: AbsoluteActionSetShipVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship!.variables.alterValues(action.variables, true);
        description.push(`set ${parameters.ship!.name} variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.AlterShipStats]: (action: AbsoluteActionAlterShipStats, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship!.turnStats.alterValues(action.stats);
        description.push(`change ${parameters.ship!.name} stats by ${Variables.toString(action.stats)}`);
    },
    [AbsoluteActionType.SetShipStats]: (action: AbsoluteActionSetShipStats, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship!.turnStats.alterValues(action.stats, true);
        description.push(`set ${parameters.ship!.name} stats to ${Variables.toString(action.stats)}`);
    },
    [AbsoluteActionType.AlterPartnerVariable]: (action: AbsoluteActionAlterPartnerVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.partner!.variables.alterValues(action.variables);
        description.push(`change ${parameters.partner!.template.name} variables by ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.SetPartnerVariable]: (action: AbsoluteActionSetPartnerVariable, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.partner!.variables.alterValues(action.variables, true);
        description.push(`set ${parameters.partner!.template.name} variables to ${Variables.toString(action.variables)}`);
    },
    [AbsoluteActionType.AlterShipsPartnerLoyalty]: (action: AbsoluteActionAlterPartnerLoyalty, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship!.alterLoyalty(parameters.partner!, action.loyalty);
        description.push(`for ${parameters.ship!.name} change ${parameters.partner!.template.name} loyalty by ${action.loyalty}`);
    },
    [AbsoluteActionType.SetShipsPartnerLoyalty]: (action: AbsoluteActionSetPartnerLoyalty, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship!.loyalty.set(parameters.partner!, action.loyalty);
        description.push(`for ${parameters.ship!.name} set ${parameters.partner!.template.name} loyalty to ${action.loyalty}`);
    },
    [AbsoluteActionType.AwardVictoryPoints]: (action: AbsoluteActionAwardVictoryPoints, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship!.victoryPoints += action.victoryPoints;
        description.push(`for ${parameters.ship!.name} add ${action.victoryPoints} victory points`);
    },
    [AbsoluteActionType.Say]: (action: AbsoluteActionSay, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.game!.say(action.text);
        description.push(`...`);
    },
    [AbsoluteActionType.DestroyLandmark]: (action: AbsoluteActionDestroyLandmark, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.game!.removeLandmark(parameters.landmark!);
        description.push(`destroy ${parameters.landmark!.name}`);
    },
    [AbsoluteActionType.DamageShip]: (action: AbsoluteActionDamageShip, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship!.dealDamage(action.damage);
        description.push(`for ${parameters.ship!.name} deal ${action.damage} damage`);
    },
    [AbsoluteActionType.InteractWithLandmark]: (action: AbsoluteActionInteractWithLandmark, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`${parameters.ship!.name} ${action.interaction} with ${parameters.landmark!.name}`);
        description.push(...parameters.landmark!.landmarkInteraction(action.interaction, parameters.ship!, action.value));
    },
    [AbsoluteActionType.Condition]: (action: AbsoluteActionCondition, parameters: AbsoluteActionParameters, description: Array<string>) => {
        if (parameters.game.stateRequirementsMet(action.requirements, parameters)) {
            description.push(`the condition was met`);
            action.successActions && recursiveAbsoluteAction(action.successActions, parameters, description);
        } else {
            description.push(`the condition was not met`);
            action.failureActions && recursiveAbsoluteAction(action.failureActions, parameters, description);
        }
    },
    [AbsoluteActionType.ProvideCard]: (action: AbsoluteActionProvideCard, parameters: AbsoluteActionParameters, description: Array<string>) => {
        const card = parameters.game.cardFromTemplate(parameters.game.getCard(action.card), parameters.sidequest!);
        parameters.ship!.addCard(card);
        description.push(`${parameters.ship!.name} got ${card.name}`);
    },
    [AbsoluteActionType.AlterStats]: (action: AbsoluteActionAlterStats, parameters: AbsoluteActionParameters, description: Array<string>) => {
        const stats = Variables.fromRecord(parameters.stats);
        stats.alterValues(action.stats);
        parameters.stats = stats.values;
        description.push(`alter ${parameters.ship!.name} stats by ${Variables.toString(action.stats)}`);
    },
    [AbsoluteActionType.SetStats]: (action: AbsoluteActionSetStats, parameters: AbsoluteActionParameters, description: Array<string>) => {
        const stats = Variables.fromRecord(parameters.stats);
        stats.alterValues(action.stats, true);
        parameters.stats = stats.values;
        description.push(`set ${parameters.ship!.name} stats to ${Variables.toString(action.stats)}`);
    },
    [AbsoluteActionType.InteractWithRandomLandmark]: (action: AbsoluteActionInteractWithRandomLandmark, parameters: AbsoluteActionParameters, description: Array<string>) => {
        const randomOrderLandmarks = Array.from(parameters.game.landmarks.values()).sort(() => Math.random() - 0.5);
        for (const landmark of randomOrderLandmarks) {
            if (parameters.game.stateRequirementsMet(action.conditions, { ...parameters, landmark })) {
                parameters.landmark = landmark;
                description.push(`randomly picked ${landmark.name}`);
                recursiveAbsoluteAction(action.actions, parameters, description);
                return;
            }
        }
    },
    [AbsoluteActionType.DrawCard]: (action: AbsoluteActionDrawCard, parameters: AbsoluteActionParameters, description: Array<string>) => {
        description.push(`draw ${action.count || 1} card${action.count === 1 ? "" : "s"}`);
        if (action.count) {
            parameters.ship!.drawCards(action.count);
        } else {
            parameters.ship!.drawCard();
        }
    },

    [AbsoluteActionType.InteractWithQuestLandmark]: (action: AbsoluteActionInteractWithQuestLandmark, parameters: AbsoluteActionParameters, description: Array<string>) => {
        let sidequest = parameters.sidequest;
        const landmark = sidequest.landmarks.get(action.nametag)!;
        description.push(`interact with ${landmark.name}`);
        recursiveAbsoluteAction(action.actions, { ...parameters, landmark });
    },
    [AbsoluteActionType.Offer]: (action: AbsoluteActionOffer, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship.addOffer(action.offerData);
    },

    [AbsoluteActionType.GiveQuest]: (action: AbsoluteActionOffer, parameters: AbsoluteActionParameters, description: Array<string>) => {
        parameters.ship.addOffer(action.offerData);
    },
};

export function deserealizeParameters(game: Game, parameters: Partial<AbsoluteActionsParametersSerialized>): AbsoluteActionParameters {
    const result: AbsoluteActionParameters = { game };
    if (parameters.ship !== undefined) {
        result.ship = game.ships.get(parameters.ship);
    }
    if (parameters.landmark !== undefined) {
        result.landmark = game.landmarks.get(parameters.landmark);
    }
    if (parameters.partner !== undefined) {
        result.partner = game.partners.get(parameters.partner);
    }
    if (parameters.sidequest !== undefined) {
        result.sidequest = game.sidequests.get(parameters.sidequest);
    }
    if (parameters.value !== undefined) {
        result.value = parameters.value;
    }
    if (parameters.stats !== undefined) {
        result.stats = parameters.stats;
    }
    return result;
}

export type OfferData = {
    actions: AbsoluteActions;
    requirements: Array<StateCheck>;
    description: string;
    parameters: Partial<AbsoluteActionsParametersSerialized>;
};
