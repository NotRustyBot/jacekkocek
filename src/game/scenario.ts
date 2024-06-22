import { DiscordGameInterface } from "./discordInterface";

export function scenario(dif: DiscordGameInterface) {
    //dif.createShip("500632024831492100", "name-ship");
    //dif.joinMission("500632024831492100");
    
    dif.createShip("645206726097764364", "Norubo");
    dif.joinMission("645206726097764364");
    dif.getItem("645206726097764364", "SPAM Launcher");
    dif.getItem("645206726097764364", "Antikythera Computing System");

    //dif.createShip("532918953014722560", "kwoerk");
    //dif.joinMission("532918953014722560");
    //dif.getItem("532918953014722560", "Silkers Tactical Team");
    //dif.getItem("532918953014722560", "Echo Propulsion");

}
