import { Game } from "./game";
import { Landmark } from "./landmark";
import { Partner } from "./partner";
import { FlatStats, FlatStatsData, Ship } from "./ship";
import { Sidequest } from "./sidequest";
import { pickRandom } from "./utils";

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
    stats: FlatStatsData;
};

export type AbsoluteActionSetShipStats = {
    type: AbsoluteActionType.SetShipStats;
    stats: FlatStatsData;
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
    | AbsoluteActionSay;

export type AbsoluteActionParameters = {
    game: Game;
    ship?: Ship;
    landmark?: Landmark;
    partner?: Partner;
    sidequest?: Sidequest;
    value?: number;
};

export function executeAbsoluteActions(actions: AbsoluteActions, parameters: AbsoluteActionParameters) {}

function recursiveAbsoluteAction(actions: AbsoluteActions, parameters: AbsoluteActionParameters) {
    if (!(actions instanceof Array)) {
        actions = [actions];
    }
    
    for (const action of actions) {
        let modifiableParameters = {...parameters};
        const result = absoluteActionLookup[action.type](action, modifiableParameters);
        if (result) {
            recursiveAbsoluteAction(result, modifiableParameters);
        }
    }
}

const absoluteActionLookup: Record<AbsoluteActionType, (action: AbsoluteAction, parameters: AbsoluteActionParameters) => void | AbsoluteActions> = {
    [AbsoluteActionType.AlterLandmarkVariable]: (action: AbsoluteActionAlterLandmarkVariable, parameters: AbsoluteActionParameters) => {
        parameters.landmark!.stats.alterValues(action.variables);
    },
    [AbsoluteActionType.SetLandmarkVariable]: (action: AbsoluteActionSetLandmarkVariable, parameters: AbsoluteActionParameters) => {
        parameters.landmark!.stats.alterValues(action.variables, true);
    },
    [AbsoluteActionType.AlterGameVariable]: (action: AbsoluteActionAlterGameVariable, parameters: AbsoluteActionParameters) => {
        parameters.game!.variables.alterValues(action.variables);
    },
    [AbsoluteActionType.SetGameVariable]: (action: AbsoluteActionSetGameVariable, parameters: AbsoluteActionParameters) => {
        parameters.game!.variables.alterValues(action.variables, true);
    },
    [AbsoluteActionType.SetLandmarkVisibility]: (action: AbsoluteActionSetLandmarkVisibility, parameters: AbsoluteActionParameters) => {
        parameters.landmark!.visible = action.visible;
    },
    [AbsoluteActionType.PickRandomShipOnMission]: (action: AbsoluteActionPickRandomShip, parameters: AbsoluteActionParameters) => {
        parameters.ship = pickRandom([...parameters.game!.shipsOnMission.values()]);
        return action.actions;
    },
    [AbsoluteActionType.InteractWithEveryoneOnMission]: (action: AbsoluteActionInteractWithEveryone, parameters: AbsoluteActionParameters) => {
        for (const ship of parameters.game!.shipsOnMission.values()) {
            const params = {...parameters, ship: ship};
            recursiveAbsoluteAction(action.actions, params);
        }
    },
    [AbsoluteActionType.AlterQuestVariable]: (action: AbsoluteActionAlterQuestVariable, parameters: AbsoluteActionParameters) => {
        parameters.sidequest!.variables.alterValues(action.variables);
    },
    [AbsoluteActionType.SetQuestVariable]: (action: AbsoluteActionSetQuestVariable, parameters: AbsoluteActionParameters) => {
        parameters.sidequest!.variables.alterValues(action.variables, true);
    },
    [AbsoluteActionType.AlterShipVariable]: (action: AbsoluteActionAlterShipVariable, parameters: AbsoluteActionParameters) => {
        parameters.ship!.variables.alterValues(action.variables);
    },
    [AbsoluteActionType.SetShipVariable]: (action: AbsoluteActionSetShipVariable, parameters: AbsoluteActionParameters) => {
        parameters.ship!.variables.alterValues(action.variables, true);
    },
    [AbsoluteActionType.AlterShipStats]: (action: AbsoluteActionAlterShipStats, parameters: AbsoluteActionParameters) => {
        parameters.ship!.turnStats.add(action.stats);
    },
    [AbsoluteActionType.SetShipStats]: (action: AbsoluteActionSetShipStats, parameters: AbsoluteActionParameters) => {
        parameters.ship!.turnStats.set(action.stats);
    },
    [AbsoluteActionType.AlterPartnerVariable]: (action: AbsoluteActionAlterPartnerVariable, parameters: AbsoluteActionParameters) => {
        parameters.partner!.variables.alterValues(action.variables);
    },
    [AbsoluteActionType.SetPartnerVariable]: (action: AbsoluteActionSetPartnerVariable, parameters: AbsoluteActionParameters) => {
        parameters.partner!.variables.alterValues(action.variables, true);
    },
    [AbsoluteActionType.AlterShipsPartnerLoyalty]: (action: AbsoluteActionAlterPartnerLoyalty, parameters: AbsoluteActionParameters) => {
        parameters.ship!.alterLoyalty(parameters.partner!, action.loyalty);
    },
    [AbsoluteActionType.SetShipsPartnerLoyalty]: (action: AbsoluteActionSetPartnerLoyalty, parameters: AbsoluteActionParameters) => {
        parameters.ship!.loyalty.set(parameters.partner!, action.loyalty);
    },
    [AbsoluteActionType.AwardVictoryPoints]: (action: AbsoluteActionAwardVictoryPoints, parameters: AbsoluteActionParameters) => {
        parameters.ship!.victoryPoints += action.victoryPoints;
    },
    [AbsoluteActionType.Say]: (action: AbsoluteActionSay, parameters: AbsoluteActionParameters) => {
        parameters.game!.say(action.text);
    },
};
