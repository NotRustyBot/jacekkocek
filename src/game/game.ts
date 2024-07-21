import { Card, CardProvider, CardTemplate } from "./card";
import { ContentData } from "./content";
import { Item, ItemTemplate } from "./item";
import { Landmark, LandmarkPassiveEventType, LandmarkTemplate } from "./landmark";
import { Partner } from "./partner";
import { Resources } from "./resources";
import { FlatStats, FlatStatsData, Ship } from "./ship";
import { Sidequest, SidequestTemplate, StateCheck, StateCheckType } from "./sidequest";
import { TradeOfferHandler, TradeTemplate } from "./trade";
import { pickRandom, requirementsMet } from "./utils";
import { Variables } from "./variables";

export class Game {
    missionInProgress = false;
    turnsLeft = 0;
    ships = new Map<number, Ship>();
    shipsOnMission = new Map<number, Ship>();
    cardTemplates = new Map<string, CardTemplate>();
    itemTemplates = new Map<string, ItemTemplate>();
    sidequestTemplates = new Map<string, SidequestTemplate>();
    landmarkTemplates = new Map<string, LandmarkTemplate>();
    landmarks = new Map<number, Landmark>();
    partners = new Map<string, Partner>();
    variables = Variables.fromRecord({
        store_size: 1,
    });
    tradeTemplates = new Map<string, TradeTemplate>();

    sidequests = new Map<number, Sidequest>();

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

    createItem(name: string) {
        const item = new Item(this, this.itemTemplates.get(name)!);
        return item;
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
        for (const partnerTemplate of content.partners) {
            this.partners.set(partnerTemplate.name, new Partner(this, partnerTemplate));
        }
        for (const sidequestTemplate of content.sidequests) {
            this.sidequestTemplates.set(sidequestTemplate.name, sidequestTemplate);
        }
    }

    checkSidequests() {
        for (const [id, sidequest] of this.sidequests) {
            sidequest.checkCompleted();
        }
    }

    createSidequest(sidequestName: string, ship: Ship, partner: Partner) {
        const template = this.sidequestTemplates.get(sidequestName);
        const sidequest = new Sidequest(this, this.sidequests.size, template, ship, partner);
        this.sidequests.set(sidequest.id, sidequest);
        return sidequest;
    }

    landmarkExists(provider: Landmark) {
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

    removeLandmark(landmark: Landmark) {
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

    stateRequirementsMet(requirements: StateCheck[], { ship, landmarks, partner, sidequest }: { ship?: Ship; landmarks?: Map<string, Landmark>; partner?: Partner; sidequest?: Sidequest }) {
        for (const requirement of requirements) {
            if (
                (() => {
                    let variables = new Variables();
                    let atLeastOne = false;
                    if (requirement.type === StateCheckType.Ship) {
                        if (!ship) return false;
                        variables = ship.variables;
                    } else if (requirement.type === StateCheckType.Landmark) {
                        const landmark = landmarks?.get(requirement.nametag);
                        if (!landmark) return false;
                        variables = landmark.stats;
                    } else if (requirement.type === StateCheckType.Partner) {
                        if (!partner) return false;
                        variables = partner.variables;
                    } else if (requirement.type === StateCheckType.Game) {
                        variables = this.variables;
                    } else if (requirement.type === StateCheckType.AnyShip || requirement.type === StateCheckType.OtherShip) {
                        for (const [_, anyShip] of this.shipsOnMission) {
                            if (requirement.type === StateCheckType.OtherShip && anyShip === ship) continue;
                            for (const range of requirement.range) {
                                if (variables.withinRange(range)) {
                                    atLeastOne = true;
                                    break;
                                }
                            }
                            return atLeastOne;
                        }
                    } else if (requirement.type === StateCheckType.LandmarkDestroyed) {
                        return !this.landmarks.has(landmarks?.get(requirement.nametag)?.id);
                    } else if (requirement.type === StateCheckType.Sidequest) {
                        variables = sidequest.variables;
                    } else if (requirement.type === StateCheckType.Loyalty) {
                        const loyalty = ship.getTotalLoyalty(partner);
                        if (requirement.max && loyalty > requirement.max) return false;
                        if (requirement.min && loyalty < requirement.min) return false;
                        return true;
                    }

                    for (const range of requirement.range) {
                        if (variables.withinRange(range)) {
                            atLeastOne = true;
                            break;
                        }
                    }

                    return atLeastOne;
                })()
            ) {
                return true;
            }
        }

        return false;
    }

    tick() {
        if (this.missionInProgress) {
            this.endTurn();
            this.turnsLeft--;
            if (this.turnsLeft > 0) {
                this.startTurn();
                this.checkSidequests();
            } else {
                this.say("Mission ended.");
                this.awards();
                this.clearMission();
                this.setupMission();
                this.partnerActions();
                this.setupStore();
            }
        } else {
            this.missionInProgress = true;
            this.missionStart();
            this.startTurn();
        }
    }

    partnerActions() {
        for (const [name, partner] of this.partners) {
            partner.considerOptions([...this.ships.values()]);
        }
    }

    missionStart() {
        this.say("Starting mission...");
        for (const [id, ship] of this.shipsOnMission) {
            ship.missionStart();
        }

        for (const sq of this.sidequests.values()) {
            sq.setupActions();
        }
    }

    rewardPool = {
        resources: new Resources({
            gold: 0,
            xp: 0,
            crew: 0,
        }),
    };

    missionObjective: FlatStatsData = { agility: 1, crew: 1 };

    currentTrades = new Map<number, TradeTemplate>();
    setupStore() {
        this.currentTrades.clear();
        const validTrades = [];

        for (const [_, trade] of this.tradeTemplates) {
            if (!trade.requirements || this.stateRequirementsMet(trade.requirements, {})) {
                validTrades.push(trade);
            }
        }

        if (validTrades.length === 0) {
            return;
        }

        for (let i = 0; i < this.variables["store_size"]; i++) {
            const trade = pickRandom(validTrades);
            this.currentTrades.set(i, trade);
        }
    }

    showTrades(ship: Ship) {
        const validTrades = [];
        const tradesToShow = ["Trades:"];
        for (const [_, trade] of this.tradeTemplates) {
            if (!trade.requirements || this.stateRequirementsMet(trade.requirements, { ship })) {
                validTrades.push(trade);
                tradesToShow.push(TradeOfferHandler.tradeToString(trade, this.itemTemplates));
            }
        }

        return tradesToShow.join("\n");
    }

    acceptTrade(ship: Ship, tradeId: number) {
        const trade = this.currentTrades.get(tradeId);

        if(trade === undefined) {
            return `no such trade!`;
        }

        if(!ship.resources.hasEnoughResource(trade.price)) {
            return `${ship.name} does not have enough resources!`;
        }

        ship.resources.modifyResources(trade.price);

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
        let briefing = `Next mission info:\n \`${this.turnsLeft}\` turns. \`${this.landmarks.size}\` landmarks. Points will be awarded for \`${Object.keys(this.missionObjective).join(", ")}\``;
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
