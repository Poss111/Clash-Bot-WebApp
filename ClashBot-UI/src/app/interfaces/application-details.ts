import {DiscordGuild} from "./discord-guild";
import {UserDetails} from "./user-details";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {Player} from "clash-bot-service-api/model/player";

export interface ApplicationDetails {
  currentTournaments?: Tournament[],
  defaultGuild?: string,
  userGuilds?: DiscordGuild[],
  userDetails?: UserDetails,
  clashBotUserDetails?: Player,
  loggedIn?: boolean
}
