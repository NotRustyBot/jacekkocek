import Canvas from "canvas";
import axios from "axios";
import * as Matoshi from "./matoshi";
import * as Utilities from "./utilities";
import * as Main from "./main";
import { setStockPolicyDefaults, stockPresets } from "./stockPresets";
import { User } from "./user";

const stockApiKey = "c8oe5maad3iatn99i470";

const stockHistoryHours = 24;
const stockUpdatesPerHour = 4;

const resolutions = {
    m1: 1,
    m5: 5,
    m15: 15,
    m30: 30,
    hour: 60,
    day: "D",
    week: "W",
    month: "M",
};

export let stockData = new Map<string, Array<number>>();

export function init() {
    stockPresets.forEach((preset) => {
        stockData.set(preset.id, []);
    });
    setInterval(() => {
        getStockData();
    }, 3600000 / stockUpdatesPerHour);
    getStockData();
    setStockPolicyDefaults();
}

export function findStockPreset(id: string) {
    for (let i = 0; i < stockPresets.length; i++) {
        const s = stockPresets[i];
        if (s.id == id) return s;
    }
    return undefined;
}

export function generateGraph(stockId: string) {
    const width = 600;
    const height = 300;
    const padding = 5;
    const axisOffetX = 0;
    const axisOffsetY = 25;
    const graphWidth = width - axisOffetX;
    const graphHeight = height - axisOffsetY * 2;
    let stockHistory = stockData.get(stockId);
    let can = Canvas.createCanvas(width, height);
    let ctx = can.getContext("2d");
    ctx.fillStyle = "#32353B";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#18C3B2";
    ctx.lineWidth = 3;

    if (stockHistory && stockHistory.length > 0) {
        try {
            let min = Math.min(...stockHistory);
            let max = Math.max(...stockHistory);
            console.log(stockHistory);

            //ctx.moveTo(600, 300 - stockHistory[stockHistory.length - 1]);
            for (let i = 0; i < stockHistory.length; i++) {
                let y = ((stockHistory[stockHistory.length - i - 1] - min) / (max - min)) * graphHeight + axisOffsetY;
                if (min == max) y = graphHeight / 2 + axisOffsetY;
                ctx.lineTo(width - i * (graphWidth / (stockHistory.length - 1)), height - y);
            }
            ctx.stroke();

            ctx.lineTo(axisOffetX, height);
            ctx.lineTo(width, height);
            let gradient = ctx.createLinearGradient(0, axisOffsetY, 0, height);
            gradient.addColorStop(0, "#27716D");
            gradient.addColorStop(1, "#32353B");
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = "#5E5E5E";
            ctx.lineWidth = 2;

            /*ctx.beginPath();
            ctx.moveTo(axisOffetX, 0);
            ctx.lineTo(axisOffetX, height);
            ctx.stroke();*/

            ctx.beginPath();
            ctx.moveTo(0, height - axisOffsetY);
            ctx.lineTo(width, height - axisOffsetY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, axisOffsetY);
            ctx.lineTo(width, axisOffsetY);
            ctx.stroke();

            let y = height - (((stockHistory[stockHistory.length - 1] - min) / (max - min)) * graphHeight + axisOffsetY);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            ctx.font = "12px Arial";

            ctx.fillStyle = "#FFFFFF";
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            ctx.fillText(formatCurrency(min), axisOffetX + 5, height - padding - axisOffsetY);
            ctx.textBaseline = "top";
            ctx.fillText(formatCurrency(max), axisOffetX + 5, axisOffsetY + 5);
            ctx.textBaseline = "top";
            ctx.fillText(formatCurrency(stockHistory[stockHistory.length - 1]), axisOffetX + 5, y + 5);
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(Utilities.dateString(new Date()), width - padding, height - padding);
            ctx.textAlign = "left";
            ctx.fillText(Utilities.dateString(new Date(Date.now() - stockHistoryHours * 3600000)), axisOffetX + 5, height - padding);
            return can.createPNGStream();
        } catch (error) {
            return false;
        }
    } else return false;
}

function formatCurrency(num: number): string {
    if (!num) return "Unknown";
    if (num >= 100) {
        return Math.round(num).toString();
    } else {
        return num.toFixed(3);
    }
}

export function currentPrice(stockName: string) {
    if (stockData.has(stockName)) {
        let data = stockData.get(stockName) || [];
        if (data.length >= 1) return data[data.length - 1];
    }
    return undefined;
}

function getStockData() {
    for (let i = 0; i < stockPresets.length; i++) {
        const stock = stockPresets[i];
        if (!stockData.has(stock.id)) stockData.set(stock.id, []);
        if (stock.id == "BTC") {
            axios
                .get("https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?slug=bitcoin", {
                    headers: {
                        "X-CMC_PRO_API_KEY": process.env.COIN_API_KEY,
                    },
                })
                .then((res) => {
                    stockData.get(stock.id).push(res.data.data["1"].quote.USD.price);
                })
                .catch((e) => {
                    throw new Error("Error updating stocks (" + stock.symbol + "): " + e);
                });
        } else if (stock.id == "XAU") {
            axios
                .get("https://api.gold-api.com/price/XAU")
                .then((res) => {
                    stockData.get(stock.id).push(res.data.price);
                })
                .catch((e) => {
                    throw new Error("Error updating stocks (" + stock.symbol + "): " + e);
                });
        } else {
            axios
                .get(`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${stockApiKey}`)
                .then((res) => {
                    stockData.get(stock.id).push(res.data.c);
                })
                .catch((e) => {
                    throw new Error("Error updating stocks (" + stock.symbol + "): " + e);
                });
        }

        if (stockData.get(stock.id).length > stockHistoryHours * stockUpdatesPerHour) {
            stockData.get(stock.id).shift();
        }
    }
}

export function list() {
    let str = "Available stocks:\n";
    stockPresets.forEach((stock) => {
        str += stock.name + " (" + stock.id + ") - Current price: " + formatCurrency(currentPrice(stock.id)) + " ₥\n";
    });
    return str;
}

export async function buy(userId: string, stock: string, amount: number) {
    let price = currentPrice(stock);
    if (Utilities.isValid(price)) {
        if (await Matoshi.pay({ from: userId, to: Main.client.user.id, amount: amount }, false)) {
            let user = await User.get(userId);
            let currentStock = user.wallet.stocks[stock] || 0;
            currentStock += (amount * (1 - Main.policyValues.stock[stock + "fee"] / 100)) / price;
            user.wallet.stocks[stock] = currentStock;
            user.dbUpdate();
            return true;
        } else return false;
    } else return false;
}

export async function sell(userId: string, stock: string, amount: number) {
    let price = currentPrice(stock);
    let user = await User.get(userId);
    let currentStock = user.wallet.stocks[stock];
    if (currentStock >= amount / price && Utilities.isValid(currentStock) && Utilities.isValid(price)) {
        currentStock -= amount / price;
        if (user.wallet.dailySale + amount > Main.policyValues.stock.saleLimit) return "Sales limit exceeded";
        if (await Matoshi.pay({ from: Main.client.user.id, to: userId, amount: Math.floor(amount * (1 - Main.policyValues.stock[stock + "fee"] / 100)) }, false)) {
            let user = await User.get(userId);
            user.wallet.stocks[stock] = currentStock;
            user.wallet.dailySale += amount;
            await user.dbUpdate();
            return true;
        } else return "Transation failed";
    } else return "Invalid amount";
}

export async function balance(userId, stock) {
    let user = await User.get(userId, true);
    let currentStock = user.wallet.stocks[stock];
    return currentStock;
}

type StockTotalInfo = {
    stocks: Array<{ stock: string; balance: number }>;
    limit: number;
};
export async function balanceAll(userId): Promise<StockTotalInfo> {
    let user = await User.get(userId, true);
    let out = [];
    for (const stock in user.wallet.stocks) {
        out.push({ stock, balance: user.wallet.stocks[stock] });
    }

    return { limit: user.wallet.dailySale, stocks: out };
}
