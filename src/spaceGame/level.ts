

class GameLevel {
    stats: FlatStats;
    poiExists(poi: PoiInfo): boolean {
        return this.pointsOfInterest.includes(poi);
    }

    pointsOfInterest = new Array<PoiInfo>();
}

enum ActionContext {
    base,
    event,
    any,
}

type LevelTypeInfo = {
    name: string;
    description: string;
    primaryStats: FlatStats;
};

type LevelInfo = {
    name: string;
    primaryStats: FlatStats;
    stages: number;
    difficulty: number;
    complexity: number;
};

const levelType: Array<LevelTypeInfo> = [
    {
        name: "Evacuation",
        description: "$name declared emergency. You are tasked with evacuating civilians from the area. Be quick, and prepare for a bumpy landing.",
        primaryStats: { agility: 1, armor: 1 },
    },
    {
        name: "Cargo Hop",
        description: "$name needs some supplies. Let's not keep them waiting.",
        primaryStats: { agility: 1, cargo: 1 },
    },
    {
        name: "Hit and Run",
        description: "Rebel forces have captred highly defendable positions on $name. We need you to carry out a series of suprise attacks to assist our forces.",
        primaryStats: { agility: 1, crew: 1 },
    },
    {
        name: "Exploration",
        description: "Some parts of $name are not fully explored. Why not take a look?",
        primaryStats: { agility: 1, sensors: 1 },
    },
    {
        name: "Combat Resupply",
        description: "Our forces on $name are running low on supplies. Get ready to catch some strays.",
        primaryStats: { armor: 1, cargo: 1 },
    },
    {
        name: "Point Capture",
        description: "A group of rebels is currently attempting to overthrow the goverment on $name, by force. Stop them.",
        primaryStats: { armor: 1, crew: 1 },
    },
    {
        name: "Anomaly Scan",
        description: "Something is going on on $name. It doesn't look safe. Investigate the situation.",
        primaryStats: { armor: 1, sensors: 1 },
    },
    {
        name: "Battlefield Salvage",
        description: "After the incident on $name, there is a lot of scrap. We don't really need it, but we don't want the rebels to have it.",
        primaryStats: { cargo: 1, crew: 1 },
    },
    {
        name: "Prospects",
        description: "It appears $name has a few deposits of the good stuff. Find them, and bring us some samples.",
        primaryStats: { cargo: 1, sensors: 1 },
    },
    {
        name: "Search and Rescue",
        description: "This time you need to find and rescue survivors of a recent disaster on $name.",
        primaryStats: { crew: 1, sensors: 1 },
    },
];