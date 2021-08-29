export interface ClashBotTentativeDetails {
  serverName: string,
  tentativePlayers: string[],
  tournamentDetails: TournamentDetails
  isMember?: boolean
}


interface TournamentDetails {
  tournamentName: string,
  tournamentDay: string
}
