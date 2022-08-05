import {Team} from "clash-bot-service-api";
import {TeamUiWrapper} from "./interfaces/team-ui-wrapper";

export interface ClashBotTeamEvent {
  behavior: ClashBotTeamEventBehavior,
  event: Team,
  mappedEvent?: TeamUiWrapper,
  originalTeam?: TeamUiWrapper
}

export enum ClashBotTeamEventBehavior {
  ADDED,
  REMOVED,
  UPDATED
}
