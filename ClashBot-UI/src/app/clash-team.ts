export interface ClashTeam {
  teamName?: string,
  playersDetails?: PlayerDetails[]
  tournamentDetails?: TournamentDetails,
  serverName?: string,
  startTime?: string
  error?: string,
  id?: string
}

interface PlayerDetails {
  name: string,
  role: string,
  champions: string[]
}

interface TournamentDetails {
  tournamentName: string,
  tournamentDay: string
}
