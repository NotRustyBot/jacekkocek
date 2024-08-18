import { AbsoluteActions, executeAbsoluteActions } from "./absoluteAction";
import { CardProvider } from "./card";
import { Game } from "./game";
import { Ship } from "./ship";
import { Sidequest } from "./sidequest";
import { Variables } from "./variables";

export enum LandmarkInteractionType {
    discover = "discover",
    attack = "attack",
    capture = "capture",
    hack = "hack",
}

export enum LandmarkPassiveEventType {
    turnStart = "turnStart",
    turnEnd = "turnEnd",
}

export type LandmarkInteractionIntercept = {
    tags: Array<string>;
    quantity: number;
    type: LandmarkInteractionType | Array<LandmarkInteractionType>;
    action: AbsoluteActions;
    interrupt: boolean;
};

export type LandmarkTemplate = {
    name: string;
    tags?: Array<string>;
    interactions: Partial<Record<LandmarkInteractionType, null | AbsoluteActions>>;
    intercepts?: Array<LandmarkInteractionIntercept>;
    passiveActions?: Partial<Record<LandmarkPassiveEventType, null | AbsoluteActions>>;
    stats?: any;
    visible?: true;
};

export class Landmark implements CardProvider{
    game: Game;
    id: number;
    template: LandmarkTemplate;
    visible = false;
    stats: Variables;
    sidequest: Sidequest;
    redirect = new Map<string, Array<Landmark>>();
    public get name(): string {
        return this.template.name;
    }

    constructor(id: number, template: LandmarkTemplate, game: Game) {
        this.id = id;
        this.game = game;
        this.template = template;
        this.stats = Variables.fromRecord(template.stats);
        this.visible = !!template.visible;
    }

    cardPlayed(id: number): void {
        console.log("Card played " + id);
        
    }

    addRedirect(actions: string | Array<string>, landmark: Landmark) {
        if (!Array.isArray(actions)) actions = [actions];
        for (const action of actions) {
            if (this.redirect.has(action)) {
                this.redirect.get(action).push(landmark);
            } else {
                this.redirect.set(action, [landmark]);
            }
        }
    }

    setupIntercepts(landmarks: Array<Landmark>) {
        if (this.template.intercepts == null) return;
        for (const intercept of this.template.intercepts) {
            const tags = [...intercept.tags.values()];
            const properlyTagged = landmarks.filter((landmark) => tags.every((t) => landmark.template.tags?.includes(t)));
            let count = 0;
            for (const properLandmark of properlyTagged) {
                if (properLandmark == this) continue;
                if (count >= intercept.quantity && intercept.quantity > 0) break;
                properLandmark.addRedirect(intercept.type, this);
                count++;
            }
        }
    }

    triggerIntecept(landmark: Landmark, ship: Ship, interruptTripped: [boolean]) {
        if (this.template.intercepts == null) return;
        for (const intercept of this.template.intercepts) {
            if (intercept.tags.every((t) => landmark.template.tags?.includes(t))) {
                if (intercept.interrupt) interruptTripped[0] = true;
                executeAbsoluteActions(intercept.action, { game: this.game, landmark: this, sidequest: this.sidequest });
            }
        }
    }

    description(): string {
        return "no descriptions right now"
    }

    landmarkInteraction(interactionType: LandmarkInteractionType | string, ship: Ship, value?: number) {
        const interaction = this.template.interactions[interactionType];
        if (this.redirect.has(interactionType)) {
            let interruptTripped = [false] as [boolean];
            for (const landmark of this.redirect.get(interactionType)) {
                landmark.triggerIntecept(this, ship, interruptTripped)
            }
        }
        if (!interaction) return ["nothing happens"];
        return executeAbsoluteActions(interaction, { game: this.game, landmark: this, sidequest: this.sidequest, ship: ship, value: value, cardProvider: this });
    }

    triggerEvent(landmarkPassiveEventType: LandmarkPassiveEventType) {
        const passive = this.template.passiveActions?.[landmarkPassiveEventType];

        if (!passive) return;
        executeAbsoluteActions(passive, { game: this.game, landmark: this, sidequest: this.sidequest });
    }

    
}
