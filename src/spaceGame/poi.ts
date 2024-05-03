type PoiGenerator = {
    name: string;
    description: string;
    hidden: number;
    nick: string[];
    onSpawn?: (poi: PoiInfo) => void;
    onDiscovery?: (poi: PoiInfo, discoverer: Ship | false) => void;
    onCapture?: (poi: PoiInfo, capturer: Ship) => void;
    onHack?: (poi: PoiInfo, hacker: Ship) => void;
};

const militaryNick: Array<string> = ["Raven", "Overlord", "Citadel", "Fortress", "Bastion", "Eagle", "Vanguard", "Delta", "Phoenix", "Titan", "Shadow", "Sentinel", "Thunder"];
const scienceNick: Array<string> = ["Echo"];

const poiDefinition: Record<PoiType, PoiGenerator> = {
    [PoiType.missileSilo]: {
        name: "Missile Silo",
        description: "Military installation capable of launching missiles",
        hidden: 0.9,
        nick: militaryNick,
        onSpawn(poi) {
            const ra: ReadyAction = { action: ReadyActionType.missileSiloFireAtShip, data: { poi, target: pickRandom(game.ships) } };
            game.readyAction.push(ra);
        },
        onCapture(poi, capturer) {
            game.removeReadyAction({ poi: poi });
            const si: ShipItem = {
                item: ItemType.missileSiloMissile,
                poi: poi,
                durability: 1,
                stats: {},
            };
            capturer.giveItem(si);
        },
    },
    [PoiType.probe]: {
        name: "Probe",
        description: "Autonomous machine with scanning equipment",
        hidden: 0.9,
        nick: scienceNick,
        onSpawn(poi) {
            const ra: ReadyAction = { action: ReadyActionType.missileSiloFireAtShip, data: { poi, target: pickRandom(game.ships) } };
            game.readyAction.push(ra);
        },

        onHack(poi, hacker) {
            if (game.currentLevel.stats.sensors) {
            }
        },
    }
};


enum InterestCategory {
    military,
    research,
    resourceAquisition,
    wip,
    intel,
}


enum PoiType {
    missileSilo,
    probe,
    /*
    broadcastTower,
    laboratory,
    excavationSite,
    defensePlatform,
    militaryOutpost,*/
}

type PoiInfo = {
    type: PoiType;
    name: string;
    description: string;
    affiliate?: AffiliateType;
    hidden?: boolean;
};
