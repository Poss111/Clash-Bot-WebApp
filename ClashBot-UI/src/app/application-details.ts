import {ClashTournaments} from "./clash-tournaments";

export interface ApplicationDetails {
  currentTournaments?: ClashTournaments[],
  defaultGuild?: string
}
