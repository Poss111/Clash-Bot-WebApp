export interface ClashBotTentativeDetails {
  serverName: string,
  tentativePlayers: string[],
  tournamentDetails: TournamentDetails
  isMember?: boolean,
  index?: number
}


interface TournamentDetails {
  tournamentName: string,
  tournamentDay: string
}
