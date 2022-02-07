import {ClashTeam} from "./clash-team";

export interface ClashBotGenericResponse {
  registeredTeam: ClashTeam,
  unregisteredTeams: ClashTeam[]
}
