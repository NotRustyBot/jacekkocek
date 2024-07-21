export class StatusEffect {
    name: string;
    severity: number;
    template: StatusEffectTemplate;
    constructor(name: string, severity: number) {
        this.name = name;
        this.severity = severity;
    }
}

enum StatusEffectActionTrigger {
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

type StatusEffectTemplate = {
    name: string;
    actions: Record<StatusEffectActionTrigger, Array<StatusEffectActionData>>;
};

enum StatusEffectActionType {
    AddStatusEffect = "AddStatusEffect",
    RemoveStatusEffect = "RemoveStatusEffect",
    SetStatusEffectSeverity = "SetStatusEffectSeverity",
    
};

type StatusEffectActionData = {};
