import {DiscordGuild} from "../interfaces/discord-guild";
import {UserDetails} from "../interfaces/user-details";
import {ApplicationDetails} from "../interfaces/application-details";
import {ClashTeam} from "../interfaces/clash-team";
import {HttpErrorResponse} from "@angular/common/http";
import {Player} from "clash-bot-service-api/model/player";
import {Tentative} from "clash-bot-service-api/model/tentative";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {LoginStatus} from "../login-status";

test("Simple Check", () => expect(true).toBeTruthy())

export function createMockGuilds() {
    return [{
        features: [],
        icon: "1233213123",
        id: "8109283091283021",
        name: "Some Special Awesomenautic Server",
        owner: true,
        permissions: 0,
        permissions_new: "0"
    }];
}

export function createMockUserDetails() {
    return {
        id: 12312321312,
        username: "Roidrage",
        discriminator: "12312312"
    };
}

export function createMockClashBotUserDetails() {
    return {
        id: "12312321312",
        username: "Roidrage",
        serverName: "Goon Squad",
        preferredChampions: ["Sett"],
        subscriptions: [{
            key: "UpcomingClashTournamentDiscordDM",
            isOn: true
        }]
    };
}

export function createMockPlayer() : Player {
    return {
        id: "12312321312",
        name: "Roidrage",
        serverName: "Goon Squad",
        champions: ["Sett"],
        subscriptions: [{
            key: "UpcomingClashTournamentDiscordDM",
            isOn: true
        }]
    };
}

export function getMockDdragonChampionList() {
    return {
        type: "12312",
        format: "json",
        version: "19.13",
        data: {
            "Aatrox": {},
            "Sett": {},
            "Volibear": {}
        }
    };
}

export function createMockAppDetails(mockGuilds: DiscordGuild[], mockClashBotUserDetails?: Player, mockUserDetails?: UserDetails) : ApplicationDetails{
    const guildMap = new Map<string, DiscordGuild>();
    mockGuilds.forEach(guild => guildMap.set(guild.id, guild));
    return {
        currentTournaments: [],
        defaultGuild: "",
        userGuilds: guildMap,
        clashBotUserDetails: mockClashBotUserDetails,
        userDetails: mockUserDetails,
        loggedIn: true,
        loginStatus: LoginStatus.LOGGED_IN
    };
}

export function createEmptyMockClashTentativeDetails() : Tentative[] {
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
        teamName: "Team toBeAdded",
        playersDetails: [],
        serverName: "Goon Squad",
        startTime: new Date().toISOString()
    };
}

export function create400HttpError(): Error {
    return new HttpErrorResponse({
        error: "Failed to make call.",
        headers: undefined,
        status: 400,
        statusText: "Bad Request",
        url: "https://localhost.com/api"
    });
}

export function create429HttpError(): Error {
    return new HttpErrorResponse({
        error: {
            msg: "Failed to make call.",
            retry_after: 10
        },
        headers: undefined,
        status: 429,
        statusText: "Rate Limited",
        url: "https://localhost.com/api"
    });
}

export function create204HttpError(): Error {
    return new HttpErrorResponse({
        error: {
            msg: "Failed to make call.",
            retry_after: 10
        },
        headers: undefined,
        status: 204,
        statusText: "No Content",
        url: "https://localhost.com/api"
    });
}

export function create404HttpError(): Error {
    return new HttpErrorResponse({
        error: "Resource not found.",
        headers: undefined,
        status: 404,
        statusText: "Not Found",
        url: "https://localhost.com/api"
    });
}


export function create500HttpError(): Error {
    return new HttpErrorResponse({
        error: "Failed to make call.",
        headers: undefined,
        status: 500,
        statusText: "Internal Server Error",
        url: "https://localhost.com/api"
    });
}

export function create401HttpError(): Error {
    return new HttpErrorResponse({
        error: "Failed to make call.",
        headers: undefined,
        status: 401,
        statusText: "Unauthorized Error",
        url: "https://localhost.com/api"
    });
}

export function createMockClashTournaments(expectedTournamentName: string, numberOfDays: number): Tournament[] {
    let mockClashTournaments = [];
    for (let i = 1; i <= numberOfDays; i++) {
        mockClashTournaments.push({
            tournamentName: expectedTournamentName,
            tournamentDay: `${i}`,
            startTime: "2022-07-30T19:37:40.569Z",
            registrationTime: "2022-07-30T19:37:40.569Z"
        })
    }
    return mockClashTournaments;
}

export function setupLoggedInMockApplicationDetails(): ApplicationDetails {
    const mockClashTournaments = createMockClashTournaments("msi2022", 2);
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
    let mockAppDetails: ApplicationDetails = {loggedIn: false, loginStatus: LoginStatus.NOT_LOGGED_IN};
    mockAppDetails.loggedIn = false;
    return mockAppDetails;
}

export function copyObject(object: any) {
    return JSON.parse(JSON.stringify(object));
}
