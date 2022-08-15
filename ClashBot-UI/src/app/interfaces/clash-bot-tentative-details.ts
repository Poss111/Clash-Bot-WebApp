export interface ClashBotTentativeDetails {
  serverName: string,
  tentativePlayers: string[],
  tournamentDetails: TournamentDetails
  isMember?: boolean,
  index?: number,
  toBeAdded: boolean
}


interface TournamentDetails {
  tournamentName: string,
  tournamentDay: string
}
