import { Card, CardProvider, CardTemplate } from "./card";
import { ContentData } from "./content";
import { Item, ItemTemplate } from "./item";
import { Landmark, LandmarkPassiveEventType, LandmarkTemplate } from "./landmark";
import { FlatStats, FlatStatsData, Ship } from "./ship";
import { TradeOfferHandler, TradeTemplate } from "./trade";
import { pickRandom, requirementsMet } from "./utils";

export class Game {
    missionInProgress = false;
    turnsLeft = 0;
    ships = new Map<number, Ship>();
    shipsOnMission = new Map<number, Ship>();
    cardTemplates = new Map<string, CardTemplate>();
    itemTemplates = new Map<string, ItemTemplate>();
    landmarkTemplates = new Map<string, LandmarkTemplate>();
    landmarks = new Map<number, Landmark>();
    gameStats: Record<string, number> = {
        store_size: 1,
    };
    tradeTemplates = new Map<string, TradeTemplate>();
    constructor(public say: (s: string) => void) {}

    cardId = 0;
    cardIdProvider(): number {
        return this.cardId++;
    }

    landmarkId = 0;
    landmarkIdProvider(): number {
        return this.landmarkId++;
    }

    shipId = 0;
    shipIdProvider(): number {
        return this.shipId++;
    }

    itemId = 0;
    itemIdProvider(): number {
        return this.itemId++;
    }

    addShip(ship: Ship) {
        this.ships.set(ship.id, ship);
        this.say(`@${ship.name} joined the game.`);
    }

    addContent(content: ContentData) {
        for (const cardTemplate of content.cards) {
            this.cardTemplates.set(cardTemplate.name, cardTemplate);
        }
        for (const itemTemplate of content.items) {
            this.itemTemplates.set(itemTemplate.name, itemTemplate);
        }
        for (const landmarkTemplate of content.landmarks) {
            this.landmarkTemplates.set(landmarkTemplate.name, landmarkTemplate);
        }
        for (const tradeTemplate of content.trades) {
            this.tradeTemplates.set(tradeTemplate.name, tradeTemplate);
        }
    }

    landmarkExists(provider: Landmark<any>) {
        return this.landmarks.has(provider.id);
    }

    joinMission(ship: Ship) {
        if (this.missionInProgress) {
            return "too late, mission already in progress!";
        } else {
            this.shipsOnMission.set(ship.id, ship);
            this.say(`@${ship.name} joined the mission.`);
            return "Joined.";
        }
    }

    leaveMission(ship: Ship) {
        this.shipsOnMission.delete(ship.id);
        this.say(`@${ship.name} left the mission.`);
        return "Left.";
    }

    removeLandmark(landmark: Landmark<any>) {
        this.landmarks.delete(landmark.id);
        for (const [id, otherLandmark] of this.landmarks) {
            for (const [kind, redirects] of otherLandmark.redirect) {
                if (redirects.includes(landmark)) {
                    //remove the redirect
                    otherLandmark.redirect.get(kind).splice(otherLandmark.redirect.get(kind).indexOf(landmark), 1);
                }
            }
        }
    }

    shipDestroyed(ship: Ship) {
        if (this.shipsOnMission.has(ship.id)) {
            this.shipsOnMission.delete(ship.id);
        }
    }

    startTurn() {
        this.say("Starting turn...");
        for (const [id, ship] of this.shipsOnMission) {
            ship.turnStart();
        }

        for (const [id, landmark] of this.landmarks) {
            landmark.triggerEvent(LandmarkPassiveEventType.turnStart);
        }
    }

    cardFromTemplate(template: CardTemplate, provider: CardProvider): Card {
        const card = new Card(this.cardIdProvider(), template, provider);
        card.template = template;
        return card;
    }

    createLandmark(template: LandmarkTemplate) {
        const landmark = new Landmark(this.landmarkIdProvider(), template, this);
        this.landmarks.set(landmark.id, landmark);
        return landmark;
    }

    setupLandmarks() {
        const landmarks = [...this.landmarks.values()];
        for (const [id, landmark] of this.landmarks) {
            landmark.setupIntercepts(landmarks);
        }
    }

    getCard(id: string) {
        return this.cardTemplates.get(id);
    }

    tick() {
        if (this.missionInProgress) {
            this.endTurn();
            this.turnsLeft--;
            if (this.turnsLeft > 0) {
                this.startTurn();
            } else {
                this.say("Mission ended.");
                this.awards();
                this.clearMission();
                this.setupMission();
                this.setupStore();
            }
        } else {
            this.missionInProgress = true;
            this.missionStart();
            this.startTurn();
        }
    }

    missionStart() {
        this.say("Starting mission...");
        for (const [id, ship] of this.shipsOnMission) {
            ship.missionStart();
        }
    }

    rewardPool = {
        resources: {
            ["intel"]: 5,
            ["material"]: 4,
            ["science"]: 3,
        } as Record<string, number>,
    };

    missionObjective: FlatStatsData = { agility: 1, crew: 1 };

    currentTrades = new Map<number, TradeTemplate>();
    setupStore() {
        this.currentTrades.clear();
        const validTrades = [];

        for (const [_, trade] of this.tradeTemplates) {
            if (!trade.gameRequirements || requirementsMet(trade.gameRequirements, this.gameStats)) {
                validTrades.push(trade);
            }
        }

        if (validTrades.length === 0) {
            return;
        }

        for (let i = 0; i < this.gameStats["store_size"]; i++) {
            const trade = pickRandom(validTrades);
            this.currentTrades.set(i, trade);
        }
    }

    showTrades(ship: Ship) {
        const validTrades = [];
        const tradesToShow = ["Trades:"];
        for (const [_, trade] of this.tradeTemplates) {
            if (!trade.shipRequirements || requirementsMet(trade.shipRequirements, ship.resources)) {
                validTrades.push(trade);
                tradesToShow.push(TradeOfferHandler.tradeToString(trade, this.itemTemplates));
            }
        }

        return tradesToShow.join("\n");
    }

    acceptTrade(ship: Ship, tradeId: number) {
        const trade = this.currentTrades.get(tradeId);
        //check if ship has the resources

        for (const resource of Object.keys(trade.price)) {
            if (trade.price[resource] > (ship.resources[resource] ?? 0)) {
                return `${ship.name} does not have enough ${resource}!`;
            }
        }

        //subtract the resources
        for (const resource of Object.keys(trade.price)) {
            ship.resources[resource] -= trade.price[resource];
        }

        const info = TradeOfferHandler.getItem(trade, this.itemTemplates);
        this.currentTrades.delete(tradeId);
        ship.addItemToStowage(new Item(this, info));
        return `item ${info.name} is added to stowage.`;
    }

    awards() {
        let sortedShips = [...this.shipsOnMission.values()].sort((a, b) => b.victoryPoints - a.victoryPoints);
        let place = 0;
        let rewardResult = ["Rewards:"];
        for (const ship of sortedShips) {
            let rewardString = `@${ship.name} received `;
            for (const resource of Object.keys(this.rewardPool.resources)) {
                const pieces = (sortedShips.length * (sortedShips.length + 1)) / 2;
                const rewardPieces = sortedShips.length - place;
                const rewardRatio = rewardPieces / pieces;
                const reward = Math.round(this.rewardPool.resources[resource] / rewardRatio);
                rewardString += `${reward} ${resource}, `;
                ship.resources[resource] += reward;
            }
            rewardResult.push(rewardString);
            place++;
        }
        this.say(rewardResult.join("\n"));
    }

    clearMission() {
        this.missionInProgress = false;
        for (const [id, ship] of this.shipsOnMission) {
            ship.clearMission();
        }

        this.landmarks.clear();
        this.shipsOnMission.clear();
    }

    setupMission() {
        this.turnsLeft = 5;
        let landmarkCount = 5;

        for (let i = 0; i < landmarkCount; i++) {
            this.createLandmark(pickRandom([...this.landmarkTemplates.values()]));
        }

        console.log([...this.landmarks.values()].map((landmark) => landmark.name).join("\n"));
        let briefing = `Next mission info:\n \`${this.turnsLeft}\` turns. \`${landmarkCount}\` landmarks. Points will be awarded for \`${Object.keys(this.missionObjective).join(", ")}\``;
        this.say(briefing);
    }

    endTurn() {
        for (const [id, landmark] of this.landmarks) {
            landmark.triggerEvent(LandmarkPassiveEventType.turnEnd);
        }

        let points = ["Points gained from stats this turn:"];
        let totalGain = 0;
        for (const [id, ship] of this.shipsOnMission) {
            let vp = ship.calculateVictoryPoints(this.missionObjective);
            points.push(`ship ${ship.name} gained ${vp} VP, putting it at ${ship.victoryPoints} VP`);
            totalGain += vp;
            ship.turnEnd();
        }
        points.push(`In total ${totalGain} VP were gained this turn.`);
        this.say(points.join("\n"));
    }
}
