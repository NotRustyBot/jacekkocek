import Canvas from "canvas";
import * as Database from "./database.js";
import * as Matoshi from "./matoshi.js";
import * as Utilities from "./utilities.js";

const stockApiKey = "c8oe5maad3iatn99i470";

const stockHistoryLength = 24;
const stockUpdatesPerHour = 4;

export const stockNames = ["CORN", "BTC"];
export let stockData = new Map();


export function init() {
    stockNames.forEach(name => {
        stockData.set(name, []);
    })
    setInterval(() => {
        getStockInfo();
    }, 3600000 / stockUpdatesPerHour);
}

function updateStockHistory(stockName, value) {
    let hist = stockData.get(stockName);
    if (hist.length > stockHistoryLength)
        hist.shift();
    hist.push(value);
}

export function generateGraph(stockName) {
    let stockHistory = stockData.get(stockName);
    let can = Canvas.createCanvas(600, 300);
    let ctx = can.getContext("2d");
    ctx.fillStyle = "#32353B";
    ctx.fillRect(0, 0, 600, 300);
    ctx.strokeStyle = "#18C3B2";
    ctx.lineWidth = 3;

    let min = Math.min(...stockHistory);
    let max = Math.max(...stockHistory);
    console.log(stockHistory);

    //ctx.moveTo(600, 300 - stockHistory[stockHistory.length - 1]);
    for (let i = 0; i < stockHistory.length; i++) {
        let y = (stockHistory[stockHistory.length - i - 1] - min) / (max - min) * 250 + 25;
        if (min == max) y = 150;
        ctx.lineTo(600 - i * (600 / stockHistoryLength), 300 - y);
    }
    ctx.stroke();

    ctx.fillStyle="#FFFFFF";
    ctx.textAlign = "left";
    ctx.textBaseline="bottom";
    ctx.fillText(min,5,295);
    ctx.textBaseline="top";
    ctx.fillText(max,5,5);
    ctx.textAlign = "right";
    ctx.textBaseline="bottom";
    ctx.fillText(Utilities.dateString(Date.now()),595,295);
    ctx.textAlign = "left";
    ctx.fillText(Utilities.dateString(Date.now()-stockHistoryLength/stockUpdatesPerHour*3600000),5,295);
    return can.createPNGStream();
}

function stockPrice(stockName) {
    return stockData.get(stockName)[stockData.get(stockName).length - 1];
}


function getStockInfo() {
    for (let i = 0; i < stockNames.length; i++) {
        const stock = stockNames[i];
        axios.get(`https://finnhub.io/api/v1/quote?symbol=${stock}&token=${stockApiKey}`).then((res) => {
            updateStockHistory(stock, res.data.c);
            if (i == stockNames.length - 1) {
                console.log("Updated stocks.");
            }
        });
    }
}