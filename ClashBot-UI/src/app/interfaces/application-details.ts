import {ClashTournaments} from "./clash-tournaments";
import {DiscordGuild} from "./discord-guild";

export interface ApplicationDetails {
  currentTournaments?: ClashTournaments[],
  defaultGuild?: string,
  userGuilds?: DiscordGuild[]
  darkMode?: boolean
}
