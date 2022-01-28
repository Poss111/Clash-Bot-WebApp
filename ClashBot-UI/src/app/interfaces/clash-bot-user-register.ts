export interface ClashBotUserRegister {
  teamName?: string,
  role?: string,
  tournamentDetails?: TournamentDetails,
  serverName?: string,
  startTime?: string
  error?: string,
  id?: string
}

interface TournamentDetails {
  tournamentName?: string,
  tournamentDay?: string
}
