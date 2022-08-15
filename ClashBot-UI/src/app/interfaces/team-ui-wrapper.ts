import {Team, Player} from "clash-bot-service-api";

export interface PlayerUiWrapper extends Player {
    isUser: boolean;
}

export interface TeamUiWrapper extends Team {
    id?: string;
    teamDetails?: PlayerUiWrapper[];
    error?: string
}
