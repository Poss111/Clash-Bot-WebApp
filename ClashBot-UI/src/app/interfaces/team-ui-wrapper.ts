import {Team, Player} from "clash-bot-service-api";
import {DiscordGuild} from "./discord-guild";

export interface PlayerUiWrapper extends Player {
    isUser: boolean;
}

export interface TeamUiWrapper extends Team {
    id?: string;
    server?: DiscordGuild,
    teamDetails?: PlayerUiWrapper[];
    error?: string;
}
