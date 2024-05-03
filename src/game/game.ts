import { Ship } from "./ship";

export class Game {
    ships = new Array<Ship>();
    constructor() {
    }

    addShip(ship: Ship) {
        this.ships.push(ship);
        this.say(`@${ship.name} joined the game.`);
    }

    processTurn() {
        for (const ship of this.ships) {
        }
    }

    say(text: string) {
        console.log(text);
    }
}