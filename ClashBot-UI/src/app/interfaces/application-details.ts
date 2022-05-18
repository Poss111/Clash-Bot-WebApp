import {ClashTournaments} from "./clash-tournaments";
import {DiscordGuild} from "./discord-guild";
import {UserDetails} from "./user-details";
import {ClashBotUserDetails} from "./clash-bot-user-details";

export interface ApplicationDetails {
  currentTournaments?: ClashTournaments[],
  defaultGuild?: string,
  userGuilds?: DiscordGuild[],
  userDetails?: UserDetails,
  clashBotUserDetails?: ClashBotUserDetails,
  loggedIn?: boolean
}
