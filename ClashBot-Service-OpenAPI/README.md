# Clash Bot Webapp
## Summary
- Used to support the scheduling, creation, and notification of upcoming League of Legends Clash Tournaments.

## Entity Model
```mermaid
erDiagram
    PLAYER {
        string key
        string playerName
        string serverName
        string subscribed
        array preferredChampions
    }
    PLAYERWTEAMS {
        string playerId
        string details
        object teamName
    }
    TEAMS {
        string serverName
        string details
        string teamName
        array players
        object playersWRoles
        string tournamentName
        string tournamentDay
        string startTime
    }
    TOURNAMENT {
        string key
        string startTime
        string tournamentName
        string tournamentDay
        string registrationTime
    }
    TENTATIVE {
        string key
        array tentativePlayers
        string serverName
        object tournamentDetails
    }
    PLAYER |o--o{ PLAYERWTEAMS: has
    PLAYERWTEAMS }o--o| TEAMS: has
    TOURNAMENT |o--o{ TEAMS: has
    TOURNAMENT |o--o| TENTATIVE: has
    PLAYER |o--o{ TENTATIVE: has
    TOURNAMENT |o--o| TEAMS: has
    TOURNAMENT |o--o{ PLAYERWTEAMS: has
```