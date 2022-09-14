import {TestBed} from "@angular/core/testing";

import {ApplicationDetailsService} from "./application-details.service";
import {ApplicationDetails} from "../interfaces/application-details";
import {take} from "rxjs/operators";
import {BehaviorSubject} from "rxjs";
import {LoginStatus} from "../login-status";
import {DiscordGuild} from "../interfaces/discord-guild";
import {
  create400HttpError,
  create404HttpError, create429HttpError, createFullMockDiscordUser, createMockGuilds,
  createMockPlayer, createMockUserDetails,
  mockDiscordGuilds, mockSixDiscordGuilds,
  setupLoggedOutMockApplicationDetails
} from "../shared/shared-test-mocks.spec";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {DiscordService} from "./discord.service";
import {DateTimeProvider, OAuthLogger, OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TestScheduler} from "rxjs/testing";
import Mock = jest.Mock;
import {UserService} from "clash-bot-service-api";

jest.mock("clash-bot-service-api");
jest.mock("./discord.service");
jest.mock("@angular/material/snack-bar");

describe("ApplicationDetailsService", () => {
  let service: ApplicationDetailsService;
  let discordServiceMock: DiscordService;
  let userServiceMock: UserService;
  let matSnackBarMock: MatSnackBar;
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    TestBed.configureTestingModule({
      imports: [
          HttpClientTestingModule
      ],
      providers: [
          DiscordService,
          UserService,
          OAuthService,
          UrlHelperService,
          OAuthLogger,
          DateTimeProvider,
          MatSnackBar
      ]
    });
    service = TestBed.inject(ApplicationDetailsService);
    discordServiceMock = TestBed.inject(DiscordService);
    userServiceMock = TestBed.inject(UserService);
    matSnackBarMock = TestBed.inject(MatSnackBar);
  });

  test("should be created", () => {
    expect(service).toBeTruthy();
  });

  test("getApplicationDetails should return a Subject.", () => {
    expect(service.getApplicationDetails()).toBeTruthy()
  })

  test("When setApplicationDetails are set, it should emit to all subscribed.", (done) => {
    let applicationDetails: ApplicationDetails = {
      currentTournaments: [{
        tournamentName: "awesome_sauce",
        tournamentDay: "1",
        startTime: new Date().toISOString(),
        registrationTime: new Date().toISOString()
      }],
      loggedIn: false,
      loginStatus: LoginStatus.NOT_LOGGED_IN
    };
    service.setApplicationDetails(applicationDetails);
    service.getApplicationDetails().pipe(take(1)).subscribe((data) => {
      expect(data).toEqual(applicationDetails);
      done()
    })
  })

  describe("Logging in User", () => {
    test("loggingIn - it should set loggedIn to false and should set the loginStatus to LoggingIn.", () => {
      let applicationDetails: ApplicationDetails = {
        currentTournaments: [{
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          startTime: new Date().toISOString(),
          registrationTime: new Date().toISOString(),
        }],
        loggedIn: false,
        loginStatus: LoginStatus.NOT_LOGGED_IN,
      };
      service.applicationDetails = new BehaviorSubject<ApplicationDetails>(applicationDetails);
      service.loggingIn();
      const updatedApplicationDetails = service.getApplicationDetails().value;
      expect(updatedApplicationDetails.userDetails).toBeFalsy();
      expect(updatedApplicationDetails.clashBotUserDetails).toBeFalsy();
      expect(updatedApplicationDetails.loggedIn).toBeFalsy();
      expect(updatedApplicationDetails.userGuilds).toBeFalsy();
      expect(updatedApplicationDetails.defaultGuild).toBeFalsy();
      expect(updatedApplicationDetails.currentTournaments).toEqual(applicationDetails.currentTournaments);
      expect(updatedApplicationDetails.loginStatus).toEqual(LoginStatus.LOGGING_IN);
    });
  });

  describe("Log Out User", () => {
    test("logOutUser - it should clear the applicationsDetails and set it back to default.", () => {
      const guilds = mockDiscordGuilds();
      let applicationDetails: ApplicationDetails = {
        currentTournaments: [{
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          startTime: new Date().toISOString(),
          registrationTime: new Date().toISOString(),
        }],
        loggedIn: true,
        loginStatus: LoginStatus.LOGGED_IN,
        defaultGuild: guilds[0],
        userGuilds: new Map<string, DiscordGuild>(),
        userDetails: {
          id: 1,
          username: "Roidrage",
          discriminator: "hehe",
          avatar: "avatar",
          bot: false,
          system: false,
          mfa_enabled: true,
          locale: "NA",
          verified: true,
          email: "NA",
          flags: 0,
          premium_type: 0,
          public_flags: 0
        },
        clashBotUserDetails: {
          id: "1",
          name: "Roidrage",
          champions: ["Sett"],
          subscriptions: [],
          serverId: "0",
        }
      };
      service.applicationDetails = new BehaviorSubject<ApplicationDetails>(applicationDetails);
      service.logOutUser();
      const updatedApplicationDetails = service.getApplicationDetails().value;
      expect(updatedApplicationDetails.userDetails).toBeFalsy();
      expect(updatedApplicationDetails.clashBotUserDetails).toBeFalsy();
      expect(updatedApplicationDetails.loggedIn).toBeFalsy();
      expect(updatedApplicationDetails.userGuilds).toBeTruthy();
      expect(updatedApplicationDetails.userGuilds?.size).toEqual(0);
      expect(updatedApplicationDetails.defaultGuild).toBeFalsy();
      expect(updatedApplicationDetails.currentTournaments).toEqual(applicationDetails.currentTournaments);
      expect(updatedApplicationDetails.loginStatus).toEqual(LoginStatus.NOT_LOGGED_IN);
    });
  });

  describe("Load User", () => {
    test("loadUserDetails - It should set the login status to LOAD_USER_DETAILS.", () => {
      const guilds = mockDiscordGuilds();
      let applicationDetails: ApplicationDetails = {
        currentTournaments: [{
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          startTime: new Date().toISOString(),
          registrationTime: new Date().toISOString(),
        }],
        loggedIn: true,
        loginStatus: LoginStatus.LOGGED_IN,
        defaultGuild: guilds[0],
        userGuilds: new Map<string, DiscordGuild>(),
        userDetails: {
          id: 1,
          username: "Roidrage",
          discriminator: "hehe",
          avatar: "avatar",
          bot: false,
          system: false,
          mfa_enabled: true,
          locale: "NA",
          verified: true,
          email: "NA",
          flags: 0,
          premium_type: 0,
          public_flags: 0
        },
        clashBotUserDetails: {
          id: "1",
          name: "Roidrage",
          champions: ["Sett"],
          subscriptions: [],
          serverId: "0",
        }
      };
      service.applicationDetails = new BehaviorSubject<ApplicationDetails>(applicationDetails);
      service.loadUserDetails();
      const updatedApplicationDetails = service.getApplicationDetails().value;
      expect(updatedApplicationDetails.loginStatus).toEqual(LoginStatus.LOAD_USER_DETAILS);
    });
  });

  describe("Loading User", () => {
    test("loadingUserDetails - It should set the login status to LOAD_USER_DETAILS.", () => {
      const guilds = mockDiscordGuilds();
      let applicationDetails: ApplicationDetails = {
        currentTournaments: [{
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          startTime: new Date().toISOString(),
          registrationTime: new Date().toISOString(),
        }],
        loggedIn: true,
        loginStatus: LoginStatus.LOGGED_IN,
        defaultGuild: guilds[0],
        userGuilds: new Map<string, DiscordGuild>(),
        userDetails: {
          id: 1,
          username: "Roidrage",
          discriminator: "hehe",
          avatar: "avatar",
          bot: false,
          system: false,
          mfa_enabled: true,
          locale: "NA",
          verified: true,
          email: "NA",
          flags: 0,
          premium_type: 0,
          public_flags: 0
        },
        clashBotUserDetails: {
          id: "1",
          name: "Roidrage",
          champions: ["Sett"],
          subscriptions: [],
          serverId: "0",
        }
      };
      service.applicationDetails = new BehaviorSubject<ApplicationDetails>(applicationDetails);
      service.loadingUserDetails();
      const updatedApplicationDetails = service.getApplicationDetails().value;
      expect(updatedApplicationDetails.loginStatus).toEqual(LoginStatus.LOADING_USER_DETAILS);
    });
  });

  describe("Initialize User Details", () => {
    test("initUserDetails - (Brand new User) - it should invoke the call to discord to get the user details and guilds, then make a call to retrieve the Clash Bot User Details, then make a call with the details to Clash Bot Service, then push that into the App Details service.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        let mockUser = createFullMockDiscordUser();
        let mockClashBotUser = createMockPlayer();
        mockClashBotUser.name = mockUser.username;
        let mockGuilds = mockSixDiscordGuilds();
        const guildMap = new Map<string, DiscordGuild>();
        mockClashBotUser.serverId = mockGuilds[0].id;
        (discordServiceMock.getUserDetails as Mock).mockReturnValue(cold("x|", {x: mockUser}));
        (discordServiceMock.getGuilds as Mock).mockReturnValue(cold("x|", {x: mockGuilds}));
        (userServiceMock.getUser as Mock).mockReturnValue(cold("#|", undefined, create404HttpError()));
        (userServiceMock.createUser as Mock).mockReturnValue(cold("x|", {x: mockClashBotUser}));
        service.applicationDetails.next(setupLoggedOutMockApplicationDetails());

        const expectedGuilds = [...mockGuilds];
        expectedGuilds.forEach(guild => guildMap.set(guild.id, guild));
        service.initUserDetails();

        expect(service.getApplicationDetails().value.loginStatus).toEqual(LoginStatus.LOADING_USER_DETAILS);

        flush();

        const expectedApplicationDetails: ApplicationDetails = {
          defaultGuild: mockGuilds[0],
          userGuilds: guildMap,
          clashBotUserDetails: mockClashBotUser,
          userDetails: mockUser,
          selectedGuilds: new Map<string, DiscordGuild>(),
          loggedIn: true,
          loginStatus: LoginStatus.LOGGED_IN,
        };

        expect(userServiceMock.getUser).toHaveBeenCalledWith(`${mockUser.id}`);
        expect(service.getApplicationDetails().value).toEqual(expectedApplicationDetails);
        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
        expect(userServiceMock.createUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.createUser).toHaveBeenCalledWith({
          id: `${mockUser.id}`,
          serverId: `${mockGuilds[0].id}`,
          name: mockUser.username
        });
      })
    })

    test("(Existing User) - it should invoke the call to discord to get the user details then push that into the Applications Details service then make a call to retrieve the Clash Bot User Details.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        let mockUser = createMockUserDetails();
        let mockClashBotUser = createMockPlayer();
        let mockGuilds = mockSixDiscordGuilds();
        const freeAgentGuild = {
          id: "-1",
          name: "Free Agents",
          icon: "",
          owner: false,
          permissions: 0,
          features: [],
          permissions_new: "0"
        };
        mockClashBotUser.selectedServers = [mockGuilds[0].id, mockGuilds[1].id];
        const guildMap = new Map<string, DiscordGuild>();

        (discordServiceMock.getUserDetails as Mock).mockReturnValue(cold("x|", {x: mockUser}));
        (discordServiceMock.getGuilds as Mock).mockReturnValue(cold("x|", {x: mockGuilds}));
        (userServiceMock.getUser as Mock).mockReturnValue(cold("x|", {x: mockClashBotUser}));
        service.applicationDetails.next(setupLoggedOutMockApplicationDetails());

        const expectedGuilds = [...mockGuilds];
        const expectedSelectedServers = new Map<string, DiscordGuild>();
        expectedGuilds.forEach(guild => guildMap.set(guild.id, guild));
        mockClashBotUser.selectedServers.forEach(id => {
          let guild = guildMap.get(id);
          if (guild) {
            expectedSelectedServers.set(guild.id, guild);
          }
        });
        expectedSelectedServers.set(freeAgentGuild.id, freeAgentGuild);

        service.initUserDetails();

        flush();

        const expectedApplicationDetails: ApplicationDetails = {
          defaultGuild: guildMap.get(<string>mockClashBotUser.serverId),
          userGuilds: guildMap,
          clashBotUserDetails: mockClashBotUser,
          userDetails: mockUser,
          selectedGuilds: expectedSelectedServers,
          loggedIn: true,
          loginStatus: LoginStatus.LOGGED_IN
        };

        expect(userServiceMock.getUser).toHaveBeenCalledWith(`${mockUser.id}`);
        expect(service.applicationDetails.value)
            .toEqual(expectedApplicationDetails);
        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
      })
    });

    test("(Existing User with mismatched name) - it should invoke the call to discord to get the user details then push that into the Applications Details service then make a call to retrieve the Clash Bot User Details.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        let mockUser = createFullMockDiscordUser();
        mockUser.username = "The Boas";
        let mockClashBotUser = createMockPlayer();
        let mockGuilds = mockSixDiscordGuilds();
        const freeAgentGuild = {
          id: "-1",
          name: "Free Agents",
          icon: "",
          owner: false,
          permissions: 0,
          features: [],
          permissions_new: "0"
        };
        const guildMap = new Map<string, DiscordGuild>();
        mockClashBotUser.serverId = mockGuilds[1].id;
        mockClashBotUser.selectedServers = [mockGuilds[0].id, mockGuilds[1].id];

        (discordServiceMock
            .getUserDetails as Mock)
            .mockReturnValue(cold("x|", {x: mockUser}));
        (discordServiceMock
            .getGuilds as Mock).mockReturnValue(cold("x|", {x: mockGuilds}));
        (userServiceMock.getUser as Mock)
            .mockReturnValue(cold("x|", {x: mockClashBotUser}));
        (userServiceMock.updateUser as Mock)
            .mockReturnValue(cold("x|", {x: mockClashBotUser}));
        service.applicationDetails.next(setupLoggedOutMockApplicationDetails());

        const expectedGuilds = [...mockGuilds];
        const expectedSelectedServers = new Map<string, DiscordGuild>();
        expectedGuilds.forEach(guild => guildMap.set(guild.id, guild));
        mockClashBotUser.selectedServers.forEach(id => {
          let guild = guildMap.get(id);
          if (guild) {
            expectedSelectedServers.set(guild.id, guild);
          }
        });
        expectedSelectedServers.set(freeAgentGuild.id, freeAgentGuild);

        service.initUserDetails();
        flush();

        const expectedApplicationDetails: ApplicationDetails = {
          defaultGuild: guildMap.get(<string>mockClashBotUser.serverId),
          userGuilds: guildMap,
          clashBotUserDetails: mockClashBotUser,
          userDetails: mockUser,
          selectedGuilds: expectedSelectedServers,
          loggedIn: true,
          loginStatus: LoginStatus.LOGGED_IN
        };

        expect(userServiceMock.getUser).toHaveBeenCalledWith(`${mockUser.id}`);
        expect(service.applicationDetails.value).toEqual(expectedApplicationDetails);
        expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.updateUser).toHaveBeenCalledWith({
          id: `${mockUser.id}`,
          serverId: mockGuilds[1].id,
          name: mockUser.username
        });
      })
    })

    test("(Discord User Details API call fails) - it should invoke a mat snack bar with a generic error message and not be logged in.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        (discordServiceMock.getUserDetails as Mock).mockReturnValue(cold("#|", undefined, create400HttpError()));
        service.initUserDetails();

        flush();

        expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
        expect(discordServiceMock.getGuilds).not.toHaveBeenCalled();
        expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
        expect(matSnackBarMock.open).toHaveBeenCalledWith(
            "Failed to log you in.",
            "X",
            {duration: 5000});
        expect(userServiceMock.getUser).not.toHaveBeenCalled();
        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
      })
    })

    test("(Retry 3 times Discord User Details API call fails with 429) - it should invoke a mat snack bar with a generic error message and not be logged in.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        (discordServiceMock.getUserDetails as Mock).mockReturnValue(cold("#-#-#|", undefined, create429HttpError()));

        service.initUserDetails();

        flush();

        expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
        expect(discordServiceMock.getGuilds).not.toHaveBeenCalled();
        expect(matSnackBarMock.open).toHaveBeenCalledTimes(3);
        expect(matSnackBarMock.open).toHaveBeenCalledWith(
            "Retrying to retrieve your details after 10ms...",
            "X",
            {duration: 5000});
        expect(userServiceMock.getUser).not.toHaveBeenCalled();
        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
      })
    })

    test("(Discord Guilds API fails) - it should invoke a mat snack bar with a generic error message and not be logged in.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        (discordServiceMock.getUserDetails as Mock).mockReturnValue(cold("x|", {x: createMockUserDetails()}));
        (discordServiceMock.getGuilds as Mock).mockReturnValue(cold("#|", undefined, create400HttpError()));
        service.initUserDetails();

        flush();

        expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
        expect(discordServiceMock.getGuilds).toHaveBeenCalledTimes(1);
        expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
        expect(matSnackBarMock.open).toHaveBeenCalledWith(
            "Failed to log you in.",
            "X",
            {duration: 5000});
        expect(userServiceMock.getUser).not.toHaveBeenCalled();
        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
      })
    })

    test("(Retry 3 times Discord Guilds API fails with 429) - it should invoke a mat snack bar with a generic error message and not be logged in.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        (discordServiceMock.getUserDetails as Mock).mockReturnValue(cold("x|", {x: createMockUserDetails()}));
        (discordServiceMock.getGuilds as Mock).mockReturnValue(cold("#-#-#|", undefined, create429HttpError()));
        service.initUserDetails();

        flush();

        expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
        expect(discordServiceMock.getGuilds).toHaveBeenCalledTimes(1);
        expect(matSnackBarMock.open).toHaveBeenCalledTimes(3);
        expect(matSnackBarMock.open).toHaveBeenCalledWith(
            "Retrying to retrieve your server details after 10ms...",
            "X",
            {duration: 5000});
        expect(userServiceMock.getUser).not.toHaveBeenCalled();
        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
      })
    })

    test("(Clash Bot Service get user details call API fails) - it should invoke a mat snack bar with a generic error message and not be logged in.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        let mockUserDetails = createMockUserDetails();
        (discordServiceMock.getUserDetails as Mock).mockReturnValue(cold("x|", {x: mockUserDetails}));
        (discordServiceMock.getGuilds as Mock).mockReturnValue(cold("x|", {x: createMockGuilds()}));
        (userServiceMock.getUser as Mock).mockReturnValue(cold("#|", undefined, create400HttpError()));
        service.initUserDetails();

        flush();

        expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
        expect(discordServiceMock.getGuilds).toHaveBeenCalledTimes(1);
        expect(userServiceMock.getUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.getUser).toHaveBeenCalledWith(`${mockUserDetails.id}`);
        expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
        expect(matSnackBarMock.open).toHaveBeenCalledWith(
            "Failed to log you in.",
            "X",
            {duration: 5000});
        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
      })
    })

    test("(Clash Bot Service post user details call API fails) - it should invoke a mat snack bar with a generic error message and not be logged in.", () => {
      testScheduler.run(helpers => {
        const {cold, flush} = helpers;

        let mockUserDetails = createMockUserDetails();
        let mockClashBotPlayer = createMockPlayer();
        mockUserDetails.username = "Pompous Loaf";
        let mockGuilds = mockDiscordGuilds();
        mockClashBotPlayer.serverId = mockGuilds[1].id;
        (discordServiceMock.getUserDetails as Mock).mockReturnValue(cold("x|", {x: mockUserDetails}));
        (discordServiceMock.getGuilds as Mock).mockReturnValue(cold("x|", {x: mockGuilds}));
        (userServiceMock.getUser as Mock).mockReturnValue(cold("x|", {x: mockClashBotPlayer}));
        (userServiceMock.updateUser as Mock).mockReturnValue(cold("#|", undefined, create400HttpError()));
        service.initUserDetails();

        flush();

        expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
        expect(discordServiceMock.getGuilds).toHaveBeenCalledTimes(1);
        expect(userServiceMock.getUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.getUser).toHaveBeenCalledWith(`${mockUserDetails.id}`);
        expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.updateUser).toHaveBeenCalledWith({
          id: `${mockUserDetails.id}`,
          serverId: mockGuilds[1].id,
          name: mockUserDetails.username
        });
        expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
        expect(matSnackBarMock.open).toHaveBeenCalledWith(
            "Failed to log you in.",
            "X",
            {duration: 5000});
      })
    });
  });

});
