export interface ClashTeam {
  teamName?: string,
  playersDetails?: PlayerDetails[]
  tournamentDetails?: TournamentDetails,
  serverName?: string,
  startTime?: string
  error?: string,
  id?: string
}

export interface PlayerDetails {
  name: string,
  id: number,
  role: string,
  champions?: string[],
  isUser?: boolean
}

interface TournamentDetails {
  tournamentName: string,
  tournamentDay: string
}
