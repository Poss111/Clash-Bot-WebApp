import {DiscordGuild} from "../interfaces/discord-guild";
import {ClashBotUserDetails} from "../interfaces/clash-bot-user-details";
import {UserDetails} from "../interfaces/user-details";
import {ApplicationDetails} from "../interfaces/application-details";
import {ClashTeam} from "../interfaces/clash-team";
import {HttpErrorResponse} from "@angular/common/http";
import {ClashTournaments} from "../interfaces/clash-tournaments";

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

export function createMockClashTournaments(expectedTournamentName: string, numberOfDays: number): ClashTournaments[] {
    let mockClashTournaments = [];
    for (let i = 1; i <= numberOfDays; i++) {
        mockClashTournaments.push({
            tournamentName: expectedTournamentName,
            tournamentDay: `${i}`,
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        })
    }
    return mockClashTournaments;
}

export function setupLoggedInMockApplicationDetails(): ApplicationDetails {
    const mockClashTournaments = createMockClashTournaments('msi2022', 2);
    let mockAppDetails = createMockAppDetails(
        createMockGuilds(),
        createMockClashBotUserDetails(),
        createMockUserDetails()
    );
    mockAppDetails.loggedIn = true;
    mockAppDetails.currentTournaments = mockClashTournaments;
    return mockAppDetails;
}

export function setupLoggedOutMockApplicationDetails(): ApplicationDetails {
    let mockAppDetails: ApplicationDetails = {};
    mockAppDetails.loggedIn = false;
    return mockAppDetails;
}

export function copyObject(object: any) {
    return JSON.parse(JSON.stringify(object));
}