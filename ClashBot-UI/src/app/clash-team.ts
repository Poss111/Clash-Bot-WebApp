export interface ClashTeam {
  teamName?: string,
  playersDetails?: PlayerDetails[]
  tournamentDetails?: TournamentDetails
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
