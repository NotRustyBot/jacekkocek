import { TextChannel } from "discord.js";
import { content } from "./content";
import { Game } from "./game";
import { Item } from "./item";
import { Ship } from "./ship";
import { scenario } from "./scenario";
import { DiscordRenderer } from "./renderers/discordRenderer";
import { title } from "process";

export enum CardPile  {
    hand = 0,
    discard = 1,
    draw = 2,
}

export class DiscordGameInterface {
    game: Game;
    userShips: Map<string, Ship>;
    renderer = new DiscordRenderer();
    constructor(channel: TextChannel) {
        this.game = new Game((s) => {
            console.log("say: " + s);
            if (s != "") channel.send(s);
        });
        this.game.addContent(content);
        this.game.setupMission();
        this.userShips = new Map<string, Ship>();
        this.game.setupStore();
        scenario(this);
    }

    createShip(user: string, name: string) {
        const ship = new Ship(this.game, name);
        this.userShips.set(user, ship);
        this.game.addShip(ship);
        return "successfully created ship " + name + " for " + `<@${user}>`;
    }

    joinMission(user: string) {
        return this.game.joinMission(this.userShips.get(user));
    }

    leaveMission(user: string) {
        return this.game.leaveMission(this.userShips.get(user));
    }

    showLandmarks() {
        const landmarks = [...this.game.landmarks.entries()].filter(([id, landmark]) => landmark.visible).map(([id, landmark]) => id + ": **" + landmark.name + "**\n" + landmark.description());
        return "landmarks: " + landmarks.join("\n");
    }

    buyItem(user: string, tradeId: number) {
        const ship = this.userShips.get(user);
        if (!ship) return "Ship not found";
        return this.game.acceptTrade(ship, tradeId);
    }

    shipInfo(user: string, about: string) {
        const ship = this.userShips.get(about);
        if (!ship) return "Ship not found";
        return this.renderer.shipOverview(ship, user != about);
    }

    targetLandmark(user: string, landmarkId: number) {
        const ship = this.userShips.get(user);
        if (ship) {
            ship.target = this.game.landmarks.get(landmarkId);
            return "successfully targeted landmark " + ship.target.name + " for " + ship.name;
        } else {
            return "Ship not found";
        }
    }

    tick() {
        this.game.tick();
    }

    
    showCards(user: string, pile: CardPile) {
        const ship = this.userShips.get(user);
        if (ship) {
            switch (pile) {
                case CardPile.hand:
                    return this.renderer.showHand(ship);
                case CardPile.discard:
                    return this.renderer.showDiscard(ship);
                case CardPile.draw:
                    return this.renderer.showDraw(ship);
                default:
                    break;
            }
            return this.renderer.showHand(ship);
        } else {
            throw new Error("Ship not found");
        }
    }

    
    status(user: string) {
        const ship = this.userShips.get(user);
        if (ship) {
            return this.renderer.myStatus(ship);
        } else {
            throw new Error("Ship not found");
        }
    }

    getItem(user: string, itemId: string) {
        const ship = this.userShips.get(user);
        if (!ship) return "Ship not found";
        const item = new Item(this.game, ship.game.itemTemplates.get(itemId)!);
        ship.addItem(item);
        return "successfully created item " + item.name + " for " + ship.name;
    }

    playCard(user: string, cardId: number) {
        const ship = this.userShips.get(user);
        if (ship) {
            return ship.playCard(cardId);
        } else {
            return "Ship not found";
        }
    }
}
