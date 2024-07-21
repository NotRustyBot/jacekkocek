import deepmerge from "deepmerge";
import { CardProvider, CardTemplate } from "./card";
import { Game } from "./game";
import { Landmark } from "./landmark";
import { Ship } from "./ship";
import { DeepPartial } from "./utils";
import { VariableRange, Variables } from "./variables";
import { Partner, PartnerActionData, PartnerActionType } from "./partner";

export class Sidequest implements CardProvider {
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

    cardPlayed(id: number): void {}

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
            this.partner.actions(this.template.reward, this.ship);
        }
    }
}

export enum SidequestActionKind {
    giveQuestShipCards,
    createLandmark,
}

export type SidequestTemplate = {
    name: string;
    description: string;
    variables?: Record<string, number>;
    completionRequirements: Array<StateCheck>;
    setupActions: Array<SidequestAction>;
    reward: Array<PartnerActionData>;
};

type SidequestLandmarkData = {
    nametag: string;
    template: string;
};

export enum StateCheckType {
    Game,
    Partner,
    Ship,
    AnyShip,
    OtherShip,
    Landmark,
    LandmarkDestroyed,
    Sidequest,
    Loyalty,
}

type StateCheckGame = {
    type: StateCheckType.Game;
    range: Array<VariableRange>;
};

type StateCheckPartner = {
    type: StateCheckType.Partner;
    range: Array<VariableRange>;
};

type StateCheckShip = {
    type: StateCheckType.Ship;
    range: Array<VariableRange>;
};

type StateCheckAnyShip = {
    type: StateCheckType.AnyShip;
    range: Array<VariableRange>;
};

type StateCheckOtherShip = {
    type: StateCheckType.OtherShip;
    range: Array<VariableRange>;
};

type StateCheckSidequest = {
    type: StateCheckType.Sidequest;
    range: Array<VariableRange>;
};

type StateCheckLandmark = {
    type: StateCheckType.Landmark;
    nametag: string;
    range: Array<VariableRange>;
};

type StateCheckLandmarkDestroyed = {
    type: StateCheckType.LandmarkDestroyed;
    nametag: string;
};

type StateCheckLoyalty = {
    type: StateCheckType.Loyalty;
    min?: number;
    max?: number;
};

export type StateCheck = StateCheckGame | StateCheckPartner | StateCheckShip | StateCheckAnyShip | StateCheckOtherShip | StateCheckLandmark | StateCheckLandmarkDestroyed | StateCheckSidequest | StateCheckLoyalty;


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
