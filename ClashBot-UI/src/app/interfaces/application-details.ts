import {DiscordGuild} from "./discord-guild";
import {UserDetails} from "./user-details";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {Player} from "clash-bot-service-api/model/player";
import {LoginStatus} from "../login-status";

export interface ApplicationDetails {
  currentTournaments?: Tournament[],
  defaultGuild?: DiscordGuild,
  userGuilds?: Map<string, DiscordGuild>,
  selectedGuilds?: Map<string, DiscordGuild>,
  userDetails?: UserDetails,
  clashBotUserDetails?: Player,
  loggedIn: boolean
  loginStatus: LoginStatus
}
