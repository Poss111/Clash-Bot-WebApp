import {Tentative} from "clash-bot-service-api/model/tentative";

export interface TentativeRecord extends Tentative {
    isMember: boolean
    toBeAdded?: boolean
    index?: number
    playerNames?: string[]
}
