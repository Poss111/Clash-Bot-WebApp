export interface ClashBotTentativeDetails {
    serverName: string,
    tentativePlayers: string[],
    tournamentDetails: TournamentDetails
}


interface TournamentDetails {
    tournamentName: string,
    tournamentDay: string
}