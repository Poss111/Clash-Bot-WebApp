import {DiscordGuild} from "./discord-guild";

export interface ClashBotUserRegister {
  teamName?: string,
  role?: string,
  tournamentDetails?: TournamentDetails,
  server?: DiscordGuild,
  startTime?: string
  error?: string,
  id?: string
}

interface TournamentDetails {
  tournamentName?: string,
  tournamentDay?: string
}
