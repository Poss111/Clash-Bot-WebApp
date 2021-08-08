export interface ClashTeam {
  teamName?: string,
  playersDetails?: PlayerDetails[]
  tournamentDetails?: TournamentDetails
  error?: string
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
