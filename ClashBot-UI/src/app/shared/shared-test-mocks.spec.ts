import {DiscordGuild} from "../interfaces/discord-guild";
import {ClashBotUserDetails} from "../interfaces/clash-bot-user-details";
import {UserDetails} from "../interfaces/user-details";
import {ApplicationDetails} from "../interfaces/application-details";
import {ClashTeam} from "../interfaces/clash-team";
import {HttpErrorResponse} from "@angular/common/http";

export function createMockGuilds() {
    return [{
        features: [],
        icon: '1233213123',
        id: '8109283091283021',
        name: 'Some Special Awesomenautic Server',
        owner: true,
        permissions: 0,
        permissions_new: '0'
    }];
}

export function createMockUserDetails() {
    return {
        id: 12312321312,
        username: 'Roidrage',
        discriminator: '12312312'
    };
}

export function createMockClashBotUserDetails() {
    return {
        id: 12312321312,
        username: 'Roidrage',
        serverName: 'Goon Squad',
        preferredChampions: ['Sett'],
        subscriptions: {
            UpcomingClashTournamentDiscordDM: true
        }
    };
}

export function getMockDdragonChampionList() {
    return {
        type: '12312',
        format: 'json',
        version: '19.13',
        data: {
            'Aatrox': {},
            'Sett': {},
            'Volibear': {}
        }
    };
}

export function createMockAppDetails(mockGuilds: DiscordGuild[], mockClashBotUserDetails?: ClashBotUserDetails, mockUserDetails?: UserDetails) : ApplicationDetails{
    return {
        currentTournaments: [],
        defaultGuild: '',
        userGuilds: mockGuilds,
        clashBotUserDetails: mockClashBotUserDetails,
        userDetails: mockUserDetails
    };
}

export function createEmptyMockClashTentativeDetails() {
    return [
        {
            serverName: "LoL-ClashBotSupport",
            tournamentDetails: {"tournamentName": "awesome_sauce", "tournamentDay": "2"},
            tentativePlayers: []
        },
        {
            serverName: "LoL-ClashBotSupport",
            tournamentDetails: {"tournamentName": "awesome_sauce", "tournamentDay": "3"},
            tentativePlayers: []
        },
        {
            serverName: "LoL-ClashBotSupport",
            tournamentDetails: {"tournamentName": "awesome_sauce", "tournamentDay": "4"},
            tentativePlayers: []
        }
    ]
}

export function createMockClashTeam() : ClashTeam {
    return {
        teamName: 'Team toBeAdded',
        playersDetails: [],
        serverName: 'Goon Squad',
        startTime: new Date().toISOString()
    };
}

export function create400HttpError(): Error {
    return new HttpErrorResponse({
        error: 'Failed to make call.',
        headers: undefined,
        status: 400,
        statusText: 'Bad Request',
        url: 'https://localhost.com/api'
    });
}

export function create500HttpError(): Error {
    return new HttpErrorResponse({
        error: 'Failed to make call.',
        headers: undefined,
        status: 500,
        statusText: 'Internal Server Error',
        url: 'https://localhost.com/api'
    });
}

export function create401HttpError(): Error {
    return new HttpErrorResponse({
        error: 'Failed to make call.',
        headers: undefined,
        status: 401,
        statusText: 'Unauthorized Error',
        url: 'https://localhost.com/api'
    });
}