import { Game } from "./game";
import { StructuralItem } from "./item";
import { Ship } from "./ship";

const game = new Game();

const ship = new Ship(game, "Jacek");
game.addShip(ship);
const item = new StructuralItem("Radar", "Radar");
item.statsToAdd.sensors = 8;
ship.addItem(item);
console.log(ship.itemStats.toString());