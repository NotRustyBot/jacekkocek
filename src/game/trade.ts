import { ItemTemplate } from "./item";
import { StateCheck } from "./sidequest";

export type TradeTemplate = {
    name: string;
    price: Record<string, number>;
    item: ItemTemplate | string;
    requirements?: Array<StateCheck>;
};

export class TradeOfferHandler {
    static tradeToString(trade: TradeTemplate, items: Map<string, ItemTemplate>) : string {
        let item = this.getItem(trade, items);
        return "**" + item.name + "**  : " + Object.entries(trade.price).map(([k, v]) => `${k}:${v}`).join(" | ");
    }

    static getItem(trade: TradeTemplate, items: Map<string, ItemTemplate>) {
        let item: ItemTemplate;
        if (typeof trade.item == "string") {
            item = items.get(trade.item);
        } else {
            item = trade.item;
        }

        return item;
    }
}
