import { CardBehaviourKind } from "./card";
import { FlatStatsData } from "./ship";

type SpendStatsDetails = {
    stats: FlatStatsData;
};

type GainStatsDetails = {
    stats: FlatStatsData;
};

type AwardVictoryPointsDetails = {
    victoryPoints: number;
};

type InteractWithLandmarkDetails = {
    interactionType: string;
};

type InteractWithRandomLandmarkDetails = {
    interactionType: string;
    visible?: boolean;
};

type DrawCardDetails = {
    quantity: number;
};

export type CardDescription =
    | { kind: CardBehaviourKind.spendStats; details: SpendStatsDetails; followUp?: CardDescription }
    | { kind: CardBehaviourKind.gainStats; details: GainStatsDetails; followUp?: CardDescription }
    | { kind: CardBehaviourKind.awardVictoryPoints; details: AwardVictoryPointsDetails; followUp?: CardDescription }
    | { kind: CardBehaviourKind.interactWithLandmark; details: InteractWithLandmarkDetails; followUp?: CardDescription }
    | { kind: CardBehaviourKind.interactWithRandomLandmark; details: InteractWithRandomLandmarkDetails; followUp?: CardDescription }
    | { kind: CardBehaviourKind.drawCard; details: DrawCardDetails; followUp?: CardDescription }
    | { kind: CardBehaviourKind.nothing; details: {}; followUp?: CardDescription };


export type LandmarkOverview = {
    id: number;
    name: string;
}