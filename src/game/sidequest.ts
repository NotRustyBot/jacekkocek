import deepmerge from "deepmerge";
import { CardTemplate } from "./card";
import { Game } from "./game";
import { Landmark } from "./landmark";
import { Ship } from "./ship";
import { DeepPartial } from "./utils";
import { VariableRange, Variables } from "./variables";
import { Partner } from "./partner";
import {  AbsoluteActions, executeAbsoluteActions } from "./absoluteAction";

export class Sidequest {
    game: Game;
    public id: number;
    template: SidequestTemplate;
    landmarks = new Map<string, Landmark>();
    ship: Ship;
    variables: Variables;
    partner: Partner;

    constructor(game: Game, id: number, template: SidequestTemplate, ship: Ship, partner: Partner) {
        this.game = game;
        this.id = id;
        this.template = template;
        this.ship = ship;
        this.partner = partner;
        this.variables = Variables.fromRecord(template?.variables);
    }

    setupActions() {
        for (const action of this.template.setupActions) {
            switch (action.kind) {
                case SidequestActionKind.createLandmark:
                    this.createLandmark(action);
                    break;
                case SidequestActionKind.giveQuestShipCards:
                    this.giveCards(action);
                    break;
            }
        }
    }
    giveCards(action: SidequestActionGiveCards) {
        for (const cardData of action.cards) {
            const modifiedTemplate = deepmerge(this.game.cardTemplates.get(cardData.template), cardData.modification) as CardTemplate;
            const card = this.game.cardFromTemplate(modifiedTemplate, this);
            console.log("modifiedTemplate", modifiedTemplate);

            this.ship.addCard(card);
        }
    }

    createLandmark(ladmarkData: SidequestLandmarkData) {
        const template = this.game.landmarkTemplates.get(ladmarkData.template);
        const landmark = this.game.createLandmark(template);
        this.landmarks.set(ladmarkData.nametag, landmark);
        console.log("Created landmark " + ladmarkData.nametag);

        landmark.sidequest = this;
    }

    checkCompleted() {
        const isCompleted = this.game.stateRequirementsMet(this.template.completionRequirements, { landmarks: this.landmarks, ship: this.ship, sidequest: this });
        if (isCompleted) {
            this.game.say(`Sidequest ${this.template.name} completed!`);
            this.game.sidequests.delete(this.id);
            executeAbsoluteActions(this.template.reward, { game: this.game, sidequest: this, ship: this.ship });
        }
    }
}

export enum SidequestActionKind {
    giveQuestShipCards,
    createLandmark,
}

export type SidequestTemplate = {
    name: string;
    variables?: Record<string, number>;
    completionRequirements: Array<StateCheck>;
    setupActions: Array<SidequestAction>;
    reward: AbsoluteActions
}

type SidequestLandmarkData = {
    nametag: string;
    template: string;
};

export enum StateCheckType {
    Game = "Game",
    Partner = "Partner",
    Ship = "Ship",
    AnyShip = "AnyShip",
    OtherShip = "OtherShip",
    Landmark = "Landmark",
    TaggedLandmark = "TaggedLandmark",
    LandmarkDestroyed = "LandmarkDestroyed",
    Sidequest = "Sidequest",
    Loyalty = "Loyalty",
    Stats = "Stats",
    LandmarkVisible = "LandmarkVisible",
}

export type StateCheckGame = {
    type: StateCheckType.Game;
    range: Array<VariableRange>;
};

export type StateCheckPartner = {
    type: StateCheckType.Partner;
    range: Array<VariableRange>;
};

export type StateCheckShip = {
    type: StateCheckType.Ship;
    range: Array<VariableRange>;
};

export type StateCheckAnyShip = {
    type: StateCheckType.AnyShip;
    range: Array<VariableRange>;
};

export type StateCheckOtherShip = {
    type: StateCheckType.OtherShip;
    range: Array<VariableRange>;
};

export type StateCheckSidequest = {
    type: StateCheckType.Sidequest;
    range: Array<VariableRange>;
};

export type StateCheckLandmark = {
    type: StateCheckType.Landmark;
    range: Array<VariableRange>;
};

export type StateCheckLandmarkDestroyed = {
    type: StateCheckType.LandmarkDestroyed;
    nametag: string;
};

export type StateCheckLoyalty = {
    type: StateCheckType.Loyalty;
    min?: number;
    max?: number;
};

export type StateCheckStats = {
    type: StateCheckType.Stats;
    range: Array<VariableRange>;
};

export type StateCheckLandmarkVisible = {
    type: StateCheckType.LandmarkVisible;
    nametag?: string;
    visible?: boolean;
};

export type StateCheckTaggedLandmark = {
    type: StateCheckType.TaggedLandmark;
    nametag: string;
    range: Array<VariableRange>;
};

export type StateCheck =
    | StateCheckGame
    | StateCheckPartner
    | StateCheckShip
    | StateCheckAnyShip
    | StateCheckOtherShip
    | StateCheckLandmark
    | StateCheckLandmarkDestroyed
    | StateCheckSidequest
    | StateCheckLoyalty
    | StateCheckStats
    | StateCheckLandmarkVisible
    | StateCheckTaggedLandmark;

type SidequestAction = SidequestActionGiveCards | SidequestActionCreateLandmark;

type SidequestActionGiveCards = {
    kind: SidequestActionKind.giveQuestShipCards;
    cards: Array<{ template: string; modification?: DeepPartial<CardTemplate> }>;
};

type SidequestActionCreateLandmark = {
    kind: SidequestActionKind.createLandmark;
    template: string;
    nametag: string;
};
