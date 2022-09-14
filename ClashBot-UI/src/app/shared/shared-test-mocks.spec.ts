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

export function createFullMockDiscordUser(): UserDetails {
    return {
        id: 299370234228506627,
        "username": "Roïdräge",
        "avatar": "4393f322cfd8882c2d74648ad321c1eb",
        "discriminator": "2657",
        "public_flags": 0,
        "flags": 0,
        "locale": "en-US",
        "mfa_enabled": false
    };
}

export function createMockClashBotUserDetails() {
    return {
        id: "12312321312",
        username: "Roidrage",
        serverId: "0",
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
        serverId: "0",
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
        defaultGuild: mockGuilds[0],
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
            serverId: "0",
            tournamentDetails: {"tournamentName": "awesome_sauce", "tournamentDay": "2"},
            tentativePlayers: []
        },
        {
            serverId: "0",
            tournamentDetails: {"tournamentName": "awesome_sauce", "tournamentDay": "3"},
            tentativePlayers: []
        },
        {
            serverId: "0",
            tournamentDetails: {"tournamentName": "awesome_sauce", "tournamentDay": "4"},
            tentativePlayers: []
        }
    ]
}

export function createMockClashTeam() : ClashTeam {
    return {
        teamName: "Team toBeAdded",
        playersDetails: [],
        serverId: "0",
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

export function mockDiscordGuilds(): DiscordGuild[] {
  return [{
    "id": "136278926191362058",
    "name": "Garret's Discord",
    "icon": "17ce03186d96453d4f2b341649b2b7cc",
    "owner": false,
    "permissions": 37215809,
    "features": [],
    "permissions_new": "246997835329"
  }, {
    "id": "434172219472609281",
    "name": "The Other Other Guys",
    "icon": "87580ac4ffcd87347a7e1d566e9285ce",
    "owner": false,
    "permissions": 104324673,
    "features": [],
    "permissions_new": "247064944193"
  }, {
    "id": "837685892885512202",
    "name": "LoL-ClashBotSupport",
    "icon": "123123123",
    "owner": true,
    "permissions": 2147483647,
    "features": [],
    "permissions_new": "274877906943"
  }];
}

export function mockSixDiscordGuilds(): DiscordGuild[] {
    const guilds = mockDiscordGuilds();
    guilds.push({
        "id": "1",
        "name": "Something Server",
        "icon": "123123123",
        "owner": true,
        "permissions": 2147483647,
        "features": [],
        "permissions_new": "274877906943"
    });
    guilds.push({
        "id": "2",
        "name": "Fancy Fancy",
        "icon": "123123123",
        "owner": true,
        "permissions": 2147483647,
        "features": [],
        "permissions_new": "274877906943"
    });
    guilds.push({
        "id": "3",
        "name": "Gojira",
        "icon": "123123123",
        "owner": true,
        "permissions": 2147483647,
        "features": [],
        "permissions_new": "274877906943"
    });
    return guilds;
}
