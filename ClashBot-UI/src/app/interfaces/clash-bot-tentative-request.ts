export interface ClashBotTentativeRequest {
  id: string,
  serverName: string,
  tournamentDetails: TournamentDetails
}

interface TournamentDetails {
  tournamentName: string,
  tournamentDay: string
}

