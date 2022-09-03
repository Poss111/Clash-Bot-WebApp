import {ComponentFixture, TestBed} from "@angular/core/testing";
import {TeamsDashboardComponent} from "./teams-dashboard.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TestScheduler} from "rxjs/testing";
import {FilterType} from "../../../interfaces/filter-type";
import {ClashTeam} from "../../../interfaces/clash-team";
import {UserDetails} from "../../../interfaces/user-details";
import {MatDialog} from "@angular/material/dialog";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {ApplicationDetails} from "../../../interfaces/application-details";
import {TeamsWebsocketService} from "../../../services/teams-websocket.service";
import {Subject} from "rxjs";
import {TeamsModule} from "../teams.module";
import {
  create400HttpError,
  createEmptyMockClashTentativeDetails,
  createMockAppDetails,
  createMockClashTournaments,
  createMockGuilds,
  createMockPlayer,
  createMockUserDetails, mockDiscordGuilds,
} from "../../../shared/shared-test-mocks.spec";
import {
  CreateNewTeamRequest,
  PlacePlayerOnTentativeRequest,
  Role,
  Team,
  TeamService,
  TentativeService,
  UpdateTeamRequest,
  UserService
} from "clash-bot-service-api";
import {Tentative} from "clash-bot-service-api/model/tentative";
import {TentativeRecord} from "../../../interfaces/tentative-record";
import {DiscordGuild} from "../../../interfaces/discord-guild";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {TeamUiWrapper} from "../../../interfaces/team-ui-wrapper";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {ClashBotUserRegister} from "src/app/interfaces/clash-bot-user-register";
import {CreateNewTeamDetails} from "src/app/interfaces/create-new-team-details";
import {ClashBotTeamEvent, ClashBotTeamEventBehavior} from "../../../interfaces/clash-bot-team-event";
import {LoginStatus} from "../../../login-status";
import {TeamFilter} from "../../../interfaces/team-filter";

jest.mock("../../../services/application-details.service");
jest.mock("../../../services/teams-websocket.service");
jest.mock("@angular/material/snack-bar");
jest.mock("clash-bot-service-api");

describe("TeamsDashboardComponent", () => {
  let component: TeamsDashboardComponent;
  let fixture: ComponentFixture<TeamsDashboardComponent>;
  let userServiceMock: UserService;
  let teamServiceMock: TeamService;
  let tentativeServiceMock: TentativeService;
  let applicationDetailsMock: any;
  let teamsWebsocketServiceMock: TeamsWebsocketService;
  let snackBarMock: any;
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    jest.resetAllMocks();
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [TeamsModule],
      providers: [TentativeService, TeamService, TeamsWebsocketService,
        ApplicationDetailsService, MatSnackBar, MatDialog],
    }).compileComponents();
    userServiceMock = TestBed.inject(UserService);
    teamServiceMock = TestBed.inject(TeamService);
    tentativeServiceMock = TestBed.inject(TentativeService);
    teamsWebsocketServiceMock = TestBed.inject(TeamsWebsocketService);
    snackBarMock = TestBed.inject(MatSnackBar);
    applicationDetailsMock = TestBed.inject(ApplicationDetailsService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamsDashboardComponent);
  });

  describe("On Init", () => {
    test("ngOnInit - (create, logged in, and default guild) - a call to the Application Details should be made and if the User has a default guild it will be set and then a call to retrieve the teams will be made.", (done) => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const mockUserDetails: UserDetails = createMockUserDetails();
        let mockGuilds = mockDiscordGuilds();
        let mockClashTournaments =
          createMockClashTournaments("awesome_sauce", 2);
        let mockClashTeams = createMockClashTeams(mockClashTournaments, mockUserDetails);
        let mockMappedTeams = mapClashTeams(mockClashTeams);
        const mappedFilters = mockGuilds.map((record) => {
          let id = record.name
            .replace(new RegExp(/ /, "g"), "-")
            .toLowerCase();
          return {
            value: record,
            type: FilterType.SERVER,
            state: record.name === mockGuilds[2].name,
            id: id,
            numberOfTeams: 2
          }
        });
        const expectedTeamsFilter = [
          mappedFilters[2],
          mappedFilters[0],
          mappedFilters[1],
        ]
        let mockApplicationsDetails: ApplicationDetails =
          createMockAppDetails(mockGuilds, createMockPlayer(), mockUserDetails);
        mockApplicationsDetails.loggedIn = true;
        mockApplicationsDetails.defaultGuild = mockGuilds[2];
        let mockClashTentativeDetails: Tentative[] =
          createEmptyMockClashTentativeDetails();
        mockClashTentativeDetails?.[0].tentativePlayers?.push({
          name: "Sample User",
          id: "1234"
        });
        let coldClashTeamsWebsocketObs = new Subject<ClashTeam | String>();

        applicationDetailsMock.getApplicationDetails
          .mockReturnValue(cold("x|", {x: mockApplicationsDetails}));
        (tentativeServiceMock.getTentativeDetails as any)
          .mockReturnValue(cold("x|", {x: mockClashTentativeDetails}));
        (teamServiceMock.getTeam as any)
          .mockReturnValue(cold("x|", {x: mockClashTeams}));
        (teamsWebsocketServiceMock.connect as any)
          .mockReturnValue(coldClashTeamsWebsocketObs);

        component = fixture.componentInstance;

        expect(component.showSpinner).toBeFalsy();

        const mockTentativeRecords = mockClashTentativeDetails.map((tentative) => {
          let mappedTentativeDetails: TentativeRecord = (tentative as TentativeRecord);
          mappedTentativeDetails.isMember = false;
          return mappedTentativeDetails;
        });

        mockTentativeRecords[0].isMember = true;
        mockTentativeRecords[1].isMember = false;
        mockTentativeRecords[2].isMember = false;

        let msg: Team = {
          name: "Team toBeAdded",
          playerDetails: {
            Top: {
              name: "PlayerOne",
              id: "1",
              role: "Top",
              champions: []
            },
          },
          tournament: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          serverId: mockGuilds[0].id,
        };

        coldClashTeamsWebsocketObs.subscribe((msg) => {
          if (typeof msg === "string") {
            expect(msg).toEqual(mockApplicationsDetails.defaultGuild);
          }
        });

        fixture.detectChanges();

        flush();

        expect(component.showSpinner).toBeFalsy();
        expect(component.$callObs.value).toEqual(expectedTeamsFilter);
        expect(component.currentApplicationDetails).toEqual(mockApplicationsDetails);
        expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(2);
        expect(teamServiceMock.getTeam).toHaveBeenCalledTimes(4);
        expect(teamServiceMock.getTeam).toHaveBeenCalledWith(mockApplicationsDetails.defaultGuild.id);
        expect(tentativeServiceMock.getTentativeDetails).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.getTentativeDetails).toHaveBeenCalledWith(mockApplicationsDetails.defaultGuild.id);
        expect(teamsWebsocketServiceMock.connect).toHaveBeenCalledTimes(1);
        expect(component.tentativeList).toEqual(mockClashTentativeDetails);
        expect(component.teams).toEqual([...mockMappedTeams])

        coldClashTeamsWebsocketObs.subscribe((msg) => {
          if (typeof msg !== "string") {
            expect(component.teams.length).toEqual(mockMappedTeams.length + 1);
            expect(component.teams).toEqual([...mockMappedTeams, msg]);
            coldClashTeamsWebsocketObs.unsubscribe();
            done();
          }
        });

        coldClashTeamsWebsocketObs.next(msg);
      })
    })

    test("ngOnInit - (create, logged in, no default guild) - a call to the Application Details should be made and if the User does not have a default guild, then none shall be chosen.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const mockUserDetails: UserDetails = createMockUserDetails();
        let mockClashTournaments =
            createMockClashTournaments("awesome_sauce", 2);
        let mockClashTeams = createMockClashTeams(mockClashTournaments, mockUserDetails);
        let mockObservableGuilds = mockDiscordGuilds();
        const guildMap = new Map<string, DiscordGuild>();
        mockObservableGuilds.forEach(guild => guildMap.set(guild.id, guild));
        const mappedFilters = mockObservableGuilds.map((record) => {
          let id = record.name.replace(new RegExp(/ /, "g"), "-").toLowerCase();
          return {
            value: record,
            type: FilterType.SERVER,
            state: false,
            id: id,
            numberOfTeams: 2
          }
        });
        const expectedTeamsFilter = [
          mappedFilters[0],
          mappedFilters[2],
          mappedFilters[1],
        ]
        const mockApplicationsDetails: ApplicationDetails = {
          currentTournaments: [],
          userGuilds: guildMap,
          loggedIn: true,
          loginStatus: LoginStatus.LOGGED_IN
        };

        applicationDetailsMock.getApplicationDetails
            .mockReturnValue(cold("x|", {x: mockApplicationsDetails}));
        (teamServiceMock.getTeam as any)
            .mockReturnValue(cold("x|", {x: mockClashTeams}));

        component = fixture.componentInstance;

        fixture.detectChanges();

        flush();
        expect(component.showSpinner).toBeFalsy();
        expect(component.$callObs.value).toEqual(expectedTeamsFilter);
        expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(2);
        expect(teamServiceMock.getTeam).toHaveBeenCalledTimes(mappedFilters.length);
        mappedFilters.forEach((filter) => {
          expect(teamServiceMock.getTeam).toHaveBeenCalledWith(filter.value.id)
        });
      })
    })
  });

  describe("Sort Server Filter", () => {

    const createTeamFilterEntry = (identifier: string, name: string, id: string, state: boolean, numberOfTeams: number) => {
      return {
        value: {
          features: [],
              icon: "",
              id: identifier,
              name,
              owner: false,
              permissions: 0,
              permissions_new: ""
        },
        type: FilterType.SERVER,
          state,
          id,
          numberOfTeams
      };
    };

    test("sortFilters - (Sort by Free Agents, state, numberOfTeams, then name) - when sorted is called with a TeamFilter array, it should have the Free Agents Guild at the top, then the selected server, then be sorted by numberOfTeams, then finally sorted by name.", () => {
      const mappedGuilds: TeamFilter[] = [
        createTeamFilterEntry("0", "Goon Squad", "goon-squad", false, 0),
        createTeamFilterEntry("0", "ClashBot-Server", "clashbot-server", false, 5),
        createTeamFilterEntry("-1", "Free Agents", "free-agents", false, 0),
        createTeamFilterEntry("0", "LoL-ClashBotSupport", "lol-clashbotsupport", true, 0),
      ];
      const expectedOrderedTeamFilters = [
          mappedGuilds[2],
          mappedGuilds[3],
          mappedGuilds[1],
          mappedGuilds[0]
      ];
      const sortedTeamFilters = fixture.componentInstance.sortFilters(mappedGuilds);
      expect(sortedTeamFilters).toEqual(expectedOrderedTeamFilters);
    });

    test("sortFilters - (Sort by numberOfTeams) - If state is not true then it should just sort by number of Teams.", () => {
      const mappedGuilds: TeamFilter[] = [
        createTeamFilterEntry("0", "Goon Squad", "goon-squad", false, 0),
        createTeamFilterEntry("0", "ClashBot-Server", "clashbot-server", false, 5),
        createTeamFilterEntry("-1", "Free Agents", "free-agents", false, 0),
        createTeamFilterEntry("0", "LoL-ClashBotSupport", "lol-clashbotsupport", false, 3),
      ];
      const expectedOrderedTeamFilters = [
        mappedGuilds[2],
        mappedGuilds[1],
        mappedGuilds[3],
        mappedGuilds[0],
      ];
      const sortedTeamFilters = fixture.componentInstance.sortFilters(mappedGuilds);
      expect(sortedTeamFilters).toEqual(expectedOrderedTeamFilters);
    })

    test("sortFilters - (Sort by name) - If all numberOfTeams are 0 then it should just sort by server name.", () => {
      const mappedGuilds: TeamFilter[] = [
        createTeamFilterEntry("0", "Goon Squad", "goon-squad", false, 0),
        createTeamFilterEntry("0", "ClashBot-Server", "clashbot-server", false, 0),
        createTeamFilterEntry("-1", "Free Agents", "free-agents", false, 0),
        createTeamFilterEntry("0", "LoL-ClashBotSupport", "lol-clashbotsupport", false, 0),
      ];
      const expectedOrderedTeamFilters = [
        mappedGuilds[2],
        mappedGuilds[1],
        mappedGuilds[0],
        mappedGuilds[3],
      ];
      const sortedTeamFilters = fixture.componentInstance.sortFilters(mappedGuilds);
      expect(sortedTeamFilters).toEqual(expectedOrderedTeamFilters);
    })

    test("sortFilters - (Sort by numberOfTeams, then by name) - If number of Teams are equal, then name should take precedencee.", () => {
      const mappedGuilds: TeamFilter[] = [
        {
          value: {
            features: [],
            icon: "",
            id: "0",
            name: "Goon Squad",
            owner: false,
            permissions: 0,
            permissions_new: ""
          },
          type: FilterType.SERVER,
          state: false,
          id: "goon-squad",
          numberOfTeams: 0
        },
        {
          value: {
            features: [],
            icon: "",
            id: "0",
            name: "ClashBot-Server",
            owner: false,
            permissions: 0,
            permissions_new: ""
          },
          type: FilterType.SERVER,
          state: false,
          id: "clashbot-server",
          numberOfTeams: 2
        },
        {
          value: {
            features: [],
            icon: "",
            id: "0",
            name: "LoL-ClashBotSupport",
            owner: false,
            permissions: 0,
            permissions_new: ""
          },
          type: FilterType.SERVER,
          state: false,
          id: "lol-clashbotsupport",
          numberOfTeams: 9
        },
        {
          value: {
            features: [],
            icon: "",
            id: "0",
            name: "ABCDE",
            owner: false,
            permissions: 0,
            permissions_new: ""
          },
          type: FilterType.SERVER,
          state: false,
          id: "abcde",
          numberOfTeams: 2
        }
      ];
      const expectedOrderedTeamFilters = [
        mappedGuilds[2],
        mappedGuilds[3],
        mappedGuilds[1],
        mappedGuilds[0],
      ];
      const sortedTeamFilters = fixture.componentInstance.sortFilters(mappedGuilds);
      expect(sortedTeamFilters).toEqual(expectedOrderedTeamFilters);
    })
  })

  describe("Filter for Server", () => {
    test("filterTeam - (Filter for Server) - should pass in a server name to filter by, update the selected Server, sort the filter list, and invoke a call to retrieve the Teams for the Server.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const mockUserDetails: UserDetails = createMockUserDetails();
        const mockGuilds = mockDiscordGuilds();
        let mockClashTournaments =
            createMockClashTournaments("awesome_sauce", 2);
        let mockClashTeams = createMockClashTeams(mockClashTournaments, mockUserDetails);
        const guildMap = new Map<string, DiscordGuild>();
        mockGuilds.forEach(guild => guildMap.set(guild.id, guild));
        const mappedFilters = mockGuilds.map((record) => {
          let id = record.name
              .replace(new RegExp(/ /, "g"), "-")
              .toLowerCase();
          return {
            value: record,
            type: FilterType.SERVER,
            state: record.name === mockGuilds[2].name,
            id: id,
            numberOfTeams: 2
          }
        });
        const expectedTeamsFilter = [
          mappedFilters[2],
          mappedFilters[0],
          mappedFilters[1],
        ];
        let mockApplicationsDetails: ApplicationDetails =
            createMockAppDetails(mockGuilds, createMockPlayer(), mockUserDetails);
        mockApplicationsDetails.loggedIn = true;
        mockApplicationsDetails.userGuilds = guildMap;
        mockApplicationsDetails.defaultGuild = mockGuilds[2];
        let mockClashTentativeDetails: Tentative[] =
            createEmptyMockClashTentativeDetails();
        mockClashTentativeDetails?.[0].tentativePlayers?.push({
          name: "Sample User",
          id: "1234"
        });
        let coldClashTeamsWebsocketObs = new Subject<ClashTeam | String>();

        applicationDetailsMock.getApplicationDetails
            .mockReturnValue(cold("x|", {x: mockApplicationsDetails}));
        (tentativeServiceMock.getTentativeDetails as any)
            .mockReturnValue(cold("x|", {x: mockClashTentativeDetails}));
        (teamServiceMock.getTeam as any)
            .mockReturnValue(cold("x|", {x: mockClashTeams}));
        (teamsWebsocketServiceMock.connect as any)
            .mockReturnValue(coldClashTeamsWebsocketObs);

        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.$callObs.next(expectedTeamsFilter);

        component.filterTeam(mockGuilds[0]);
        expect(component.currentSelectedGuild).toEqual({
          features: [],
              icon: "",
            id: "",
            name: "",
            owner: false,
            permissions: 0,
            permissions_new: ""
        });

        flush();

        expect(component.currentSelectedGuild).toEqual(mockGuilds[0]);
        expect(teamServiceMock.getTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.getTeam).toHaveBeenCalledWith(mockGuilds[0].id);

        expect(teamsWebsocketServiceMock.connect).toHaveBeenCalledTimes(1);
        expect(teamsWebsocketServiceMock.connect).toHaveBeenCalledWith(mockGuilds[0].id);

        expect(component.$callObs.value).toEqual(expectedTeamsFilter);
        expect(component.teams).toEqual(mockClashTeams);
      });
    })
  });

  describe("Handling Incoming Websocket Event", () => {
    test("handleIncomingTeamsWsEvent - (empty) - I should not do anything.", () => {
      component = fixture.componentInstance;
      let msg: ClashBotTeamEvent = {
        behavior: ClashBotTeamEventBehavior.REMOVED,
        event: {}
      }
      component.teams = [];
      component.handleIncomingTeamsWsEvent(msg);
      expect(component.teams).toEqual([{
        error: "No data"
      }]);
    });

    test( "handleIncomingTeamsWsEvent - (New Team with User) - it should be added and remove one eligible Tournaments.", () => {
      component = fixture.componentInstance;
      const expectedTournamentName = "awesome_sauce";
      const expectedTournamentDay = "1";
      let mockClashTournaments: Tournament[] = createMockClashTournaments(expectedTournamentName, 2);
      let mockUserDetails = createMockUserDetails();
      let mockAppDetails = createMockAppDetails(
        createMockGuilds(),
        createMockPlayer(),
        mockUserDetails
      );
      let mockClashTeam: Team[] = createMockClashTeams(mockClashTournaments, mockUserDetails);
      mockClashTeam[0].playerDetails = {
        Top: {
          name: mockUserDetails.username,
          id: `${mockUserDetails.id}`,
          champions: []
        }
      };
      mockClashTeam[0].tournament = {
        tournamentName: expectedTournamentName,
        tournamentDay: expectedTournamentDay
      };

      const mappedTeam: TeamUiWrapper = {...mockClashTeam[0]};
      mappedTeam.teamDetails = [{
        ...mockClashTeam[0].playerDetails,
        isUser: true
      }];

      let clashBotEvent: ClashBotTeamEvent = {
        behavior: ClashBotTeamEventBehavior.ADDED,
        event: mockClashTeam[0],
        mappedEvent: mappedTeam,
        originalTeam: undefined
      };
      mockAppDetails.currentTournaments = createMockClashTournaments(expectedTournamentName, 2);
      component.currentApplicationDetails = mockAppDetails;
      expect(component.teams.length).toEqual(0);

      component.handleIncomingTeamsWsEvent(clashBotEvent);

      expect(component.teams.length).toEqual(1);
      expect(component.teams[0]).toEqual(mappedTeam);
      expect(component.eligibleTournaments).toHaveLength(1);
      expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
    });

    test( "handleIncomingTeamsWsEvent - (New Team with User, only one Team with error) - Team with error, it should create a new array.", () => {
      component = fixture.componentInstance;
      const expectedTournamentName = "awesome_sauce";
      const expectedTournamentDay = "1";
      let mockClashTournaments: Tournament[] = createMockClashTournaments(expectedTournamentName, 2);
      let mockUserDetails = createMockUserDetails();
      let mockAppDetails = createMockAppDetails(
          createMockGuilds(),
          createMockPlayer(),
          mockUserDetails
      );
      let mockClashTeam: Team[] = createMockClashTeams(mockClashTournaments, mockUserDetails);
      mockClashTeam[0].playerDetails = {
        Top: {
          name: mockUserDetails.username,
          id: `${mockUserDetails.id}`,
          champions: []
        }
      };
      mockClashTeam[0].tournament = {
        tournamentName: expectedTournamentName,
        tournamentDay: expectedTournamentDay
      };

      const mappedTeam: TeamUiWrapper = {...mockClashTeam[0]};
      mappedTeam.teamDetails = [{
        ...mockClashTeam[0].playerDetails,
        isUser: true
      }];

      let clashBotEvent: ClashBotTeamEvent = {
        behavior: ClashBotTeamEventBehavior.ADDED,
        event: mockClashTeam[0],
        mappedEvent: mappedTeam,
        originalTeam: undefined
      };

      mockAppDetails.currentTournaments = createMockClashTournaments(expectedTournamentName, 2);
      component.currentApplicationDetails = mockAppDetails;
      component.teams = [{error: "No data"}];
      expect(component.teams).toHaveLength(1);

      component.handleIncomingTeamsWsEvent(clashBotEvent);

      expect(component.teams.length).toEqual(1);
      expect(component.teams[0]).toEqual(mappedTeam);
      expect(component.eligibleTournaments).toHaveLength(1);
      expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
    });

    test( "handleIncomingTeamsWsEvent - (Team that already exists) - it should be updated and remove one eligible Tournaments.", () => {
      component = fixture.componentInstance;
      const expectedTournamentName = "awesome_sauce";
      const expectedTournamentDay = "1";
      let mockClashTournaments: Tournament[] = createMockClashTournaments(expectedTournamentName, 2);
      let mockUserDetails = createMockUserDetails();
      let mockAppDetails = createMockAppDetails(
          createMockGuilds(),
          createMockPlayer(),
          mockUserDetails
      );
      let mockClashTeam: Team[] = createMockClashTeams(mockClashTournaments, mockUserDetails);
      mockClashTeam[0].playerDetails = {
        Top: {
          name: mockUserDetails.username,
          id: `${mockUserDetails.id}`,
          champions: []
        }
      };
      mockClashTeam[0].tournament = {
        tournamentName: expectedTournamentName,
        tournamentDay: expectedTournamentDay
      };
      mockAppDetails.currentTournaments = createMockClashTournaments(expectedTournamentName, 2);
      component.currentApplicationDetails = mockAppDetails;

      const uiMappedTeams = mockClashTeam.map(team => {
        let uiWrapper: TeamUiWrapper = {...team};
        uiWrapper.id = `${uiWrapper.serverId}-${uiWrapper.name}`
            .replace(new RegExp(/ /, "g"), "-")
            .toLowerCase();
        return uiWrapper;
      });

      const teamUpdate = {...mockClashTeam[0]};
      teamUpdate.playerDetails = {
        Bot: {
          name: mockUserDetails.username,
          id: `${mockUserDetails.id}`,
          champions: []
        }
      };

      const expectedTeamUiWrapper : TeamUiWrapper = {...teamUpdate};
      expectedTeamUiWrapper.id = "0-team-abra";
      expectedTeamUiWrapper.teamDetails =  [
            {
              id: "0",
              isUser: false,
              role: "Top",
             },
            {
               id: "0",
               isUser: false,
               role: "Mid",
            },
            {
               id: "0",
               isUser: false,
               role: "Jg",
             },
            {
               champions: [],
               id: "12312321312",
               isUser: false,
               name: "Roidrage",
               role: "Bot",
               },
            {
               id: "0",
               isUser: false,
               role: "Supp",
             },
         ];

      let clashBotEvent: ClashBotTeamEvent = {
        behavior: ClashBotTeamEventBehavior.UPDATED,
        event: mockClashTeam[0],
        mappedEvent: expectedTeamUiWrapper,
        originalTeam: {...mockClashTeam[0]}
      };

      component.teams = [...uiMappedTeams];

      expect(component.teams.length).toEqual(2);

      component.handleIncomingTeamsWsEvent(clashBotEvent);

      expect(component.teams.length).toEqual(2);
      expect(component.teams[0]).toEqual(expectedTeamUiWrapper);
      expect(component.eligibleTournaments).toHaveLength(1);
      expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
    });

    test( "handleIncomingTeamsWsEvent - (Team should be removed that has no players) - should remove Team and add back the eligible Tournament.", () => {
      component = fixture.componentInstance;
      const expectedTournamentName = "awesome_sauce";
      const expectedTournamentDay = "1";
      let mockClashTournaments: Tournament[] = createMockClashTournaments(expectedTournamentName, 2);
      let mockUserDetails = createMockUserDetails();
      let mockAppDetails = createMockAppDetails(
          createMockGuilds(),
          createMockPlayer(),
          mockUserDetails
      );
      let mockClashTeam: Team[] = createMockClashTeams(mockClashTournaments, mockUserDetails);
      mockClashTeam[0].playerDetails = {
        Top: {
          name: mockUserDetails.username,
          id: `${mockUserDetails.id}`,
          champions: []
        },
        Bot: {
          name: "ThisGuy",
          id: "0",
          champions: []
        },
      };
      mockClashTeam[0].tournament = {
        tournamentName: expectedTournamentName,
        tournamentDay: expectedTournamentDay
      };
      mockAppDetails.currentTournaments = createMockClashTournaments(expectedTournamentName, 2);
      component.currentApplicationDetails = mockAppDetails;

      component.teams = [...mockClashTeam];

      expect(component.teams.length).toEqual(2);

      const teamUpdate = {...mockClashTeam[1]};
      teamUpdate.playerDetails = {};

      let clashBotEvent: ClashBotTeamEvent = {
        behavior: ClashBotTeamEventBehavior.REMOVED,
        event: {...mockClashTeam[1]},
        originalTeam: {...mockClashTeam[1]}
      };

      component.handleIncomingTeamsWsEvent(clashBotEvent);

      expect(component.teams).toHaveLength(1);
      expect(component.teams[0]).toEqual(mockClashTeam[0]);
      expect(component.eligibleTournaments).toHaveLength(2);
    });
  });

  describe("Map Team Service Response", () => {
    test("mapDynamicValues - When there is only one Team and one valid member.", () => {
      component = fixture.componentInstance;
      component
        .currentApplicationDetails
        .userDetails = createMockUserDetails();
      let mockTeam: Team = {
        name: "Oooooogi",
        serverId: "1",
        playerDetails: {
          Top: {
            name: "Roid",
            id: "1",
          }
        },
        tournament: {
          tournamentName: "awesome_sauce",
          tournamentDay: "1"
        }
      };
      const expectedMappedTeam: TeamUiWrapper = ({...mockTeam} as TeamUiWrapper);
      expectedMappedTeam.id = "1-oooooogi";
      expectedMappedTeam.teamDetails = [
        {
          name: "Roid",
          id: "1",
          role: Role.Top,
          isUser: false
        },
        {
          id: "0",
          role: Role.Mid,
          isUser: false
        },
        {
          id: "0",
          role: Role.Jg,
          isUser: false
        },
        {
          id: "0",
          role: Role.Bot,
          isUser: false
        },
        {
          id: "0",
          role: Role.Supp,
          isUser: false
        },
      ];
      expect(component.mapTeamToTeamUiWrapper(mockTeam)).toEqual(expectedMappedTeam);
    });

    test("mapDynamicValues - When there is a Team that has a full roster.", () => {
      component = fixture.componentInstance;
      component
        .currentApplicationDetails
        .userDetails = createMockUserDetails();
      let mockTeam: Team = {
        name: "Oooooogi",
        serverId: "1",
        playerDetails: {
          Top: {
            name: "Roid",
            id: "1",
          },
          Jg: {
            name: "PepeConrad",
            id: "2",
          },
          Bot: {
            name: "TheIncentive",
            id: "5",
          },
          Supp: {
            name: "MrSir",
            id: "4",
          },
          Mid: {
            name: "Shiragaku",
            id: "3"
          },
        },
        tournament: {
          tournamentName: "awesome_sauce",
          tournamentDay: "1"
        }
      };
      const expectedMappedTeam: TeamUiWrapper = ({...mockTeam} as TeamUiWrapper);
      expectedMappedTeam.id = "1-oooooogi";
      expectedMappedTeam.teamDetails = [
        {
          name: "Roid",
          id: "1",
          role: Role.Top,
          isUser: false
        },
        {
          id: "3",
          name: "Shiragaku",
          role: Role.Mid,
          isUser: false
        },
        {
          id: "2",
          name: "PepeConrad",
          role: Role.Jg,
          isUser: false
        },
        {
          id: "5",
          name: "TheIncentive",
          role: Role.Bot,
          isUser: false
        },
        {
          id: "4",
          name: "MrSir",
          role: Role.Supp,
          isUser: false
        },
      ];
      expect(component.mapTeamToTeamUiWrapper(mockTeam)).toEqual(expectedMappedTeam);
    });
  });

  describe("Sync Users eligible Tournaments", () => {
    test("repopulateEligibleTournaments - If a User has does not belong to any team, they should have all tournaments as eligible and should be able to create a new Team.", () =>{
      component = fixture.componentInstance;
      const userDetails = createMockUserDetails();
      const tournaments
          = createMockClashTournaments("awesome_sauce", 2);
      const mockTeams = createMockClashTeams(tournaments, userDetails);

      component.currentApplicationDetails.currentTournaments = tournaments;
      component.currentApplicationDetails.userDetails = userDetails;

      component.repopulateEligibleTournaments(mockTeams);

      expect(component.eligibleTournaments).toHaveLength(2);
      expect(component.eligibleTournaments).toEqual(tournaments);
      expect(component.canCreateNewTeam).toBeTruthy();
    });

    test("repopulateEligibleTournaments - If a User belongs to a team by themselves, they should not create a new Team for that Tournament.", () =>{
      component = fixture.componentInstance;
      const userDetails = createMockUserDetails();
      const tournaments
          = createMockClashTournaments("awesome_sauce", 2);
      const mockTeams = createMockClashTeams(tournaments, userDetails);
      mockTeams[0].tournament = tournaments[0];
      mockTeams[0].playerDetails = {
        Top: {
          name: "Me",
          id: `${userDetails.id}`,
        }
      }

      component.currentApplicationDetails.currentTournaments = [...tournaments];
      component.currentApplicationDetails.userDetails = userDetails;
      component.teams = mockTeams;

      component.repopulateEligibleTournaments(mockTeams);

      expect(component.eligibleTournaments).toHaveLength(1);
      expect(component.eligibleTournaments[0]).toEqual(tournaments[1]);
      expect(component.canCreateNewTeam).toBeTruthy();
    });

    test("repopulateEligibleTournaments - If a User belongs to all teams by themselves, they should not be able to create a new Team.", () =>{
      component = fixture.componentInstance;
      const userDetails = createMockUserDetails();
      const tournaments
          = createMockClashTournaments("awesome_sauce", 2);
      const mockTeams = createMockClashTeams(tournaments, userDetails);
      mockTeams[0].tournament = tournaments[0];
      mockTeams[0].playerDetails = {
        Top: {
          name: "Me",
          id: `${userDetails.id}`,
        }
      }
      mockTeams[1].tournament = tournaments[1];
      mockTeams[1].playerDetails = {
        Top: {
          name: "Me",
          id: `${userDetails.id}`,
        }
      }

      component.currentApplicationDetails.currentTournaments = [...tournaments];
      component.currentApplicationDetails.userDetails = userDetails;
      component.teams = mockTeams;

      component.repopulateEligibleTournaments(mockTeams);

      expect(component.eligibleTournaments).toHaveLength(0);
      expect(component.eligibleTournaments).toEqual([]);
      expect(component.canCreateNewTeam).toBeFalsy();
    });
  });

  describe("Tournament to Clash Team Map", () => {
    test("As a user, I should know all Tournaments I am scheduled with and which Teams I am assigned to.", () => {
      const expectedTournamentName = "awesome_sauce";
      const expectedTournamentDay = "1";
      const expectedUserId = 1;
      let mockClashTournaments: ClashTournaments[] = [
        {
          tournamentName: expectedTournamentName,
          tournamentDay: expectedTournamentDay,
          startTime: new Date().toISOString(),
          registrationTime: new Date().toISOString()
        }
      ];
      let mockClashTeams: Team[] = [
        {
          name: "Abra",
          serverId: "1",
          tournament: {
            tournamentName: "dne",
            tournamentDay: expectedTournamentDay
          },
          playerDetails: {
            Top: {
              id: "0",
              name: "User 1",
              role: "Top"
            },
            Mid: {
              id: "2",
              name: "User 2",
              role: "Mid"
            },
            Jg: {
              id: "3",
              name: "User 3",
              role: "Jg"
            },
            Bot: {
              id: "4",
              name: "User 4",
              role: "Bot"
            },
            Supp: {
              id: "5",
              name: "User 5",
              role: "Supp"
            },
          }
        },
        {
          name: "Abra2",
          serverId: "1",
          tournament: {
            tournamentName: expectedTournamentName,
            tournamentDay: expectedTournamentDay
          },
          playerDetails: {
            Top: {
              id: "1",
              name: "User 1",
              role: "Top"
            },
            Mid: {
              id: "2",
              name: "User 2",
              role: "Mid"
            },
            Jg: {
              id: "3",
              name: "User 3",
              role: "Jg"
            },
            Bot: {
              id: "4",
              name: "User 4",
              role: "Bot"
            },
            Supp: {
              id: "5",
              name: "User 5",
              role: "Supp"
            },
          }
        }
      ];
      const expectedTournamentToTeamUserMap = new Map<ClashTournaments, ClashTeam>();
      expectedTournamentToTeamUserMap.set(mockClashTournaments[0], mockClashTeams[1]);
      component = fixture.componentInstance;
      expect(component
          .createUserToTournamentMap(expectedUserId, mockClashTournaments, mockClashTeams))
          .toEqual(expectedTournamentToTeamUserMap);
    })
  });

  describe("Update Tentative List Based on Team", () => {
    test("updateTentativeListBasedOnTeam - (Remove from Tentative List) - A player should be removed from Tentative when they belong to a Team for a tournament.", () => {
      component = fixture.componentInstance;
      const tentativeDetails : TentativeRecord[] = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);
      tentativeDetails[0].isMember = false;
      tentativeDetails[0].tentativePlayers?.push(
        {
          id: "1",
          name: "Roid",
        }
      );
      tentativeDetails
      component.tentativeList = [...tentativeDetails];
      component.updateTentativeListBasedOnTeam({});

      tentativeDetails[0].tentativePlayers = [];

      expect(component.tentativeList).toHaveLength(3);
      expect(component.tentativeList[0]).toEqual(tentativeDetails[0]);
    });
  });

  describe("Register for Team", () => {
    test("registerForTeam - (Register for Team) - If a user is logged in and has details, they should be able to invoke to update Team.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();

        const clashBotUserRegisterPayload: ClashBotUserRegister = {
          teamName: "Teamy",
          role: "Top",
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          server: guilds[0],
          id: "1"
        };

        const expectedUpdatedPayload: UpdateTeamRequest = {
          serverId: guilds[0].id,
          teamName: "Teamy",
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
          role: Role.Top
        };

        (teamServiceMock.updateTeam as any).mockReturnValue(cold("x|", {x: {}}));
        component.registerForTeam(clashBotUserRegisterPayload);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledWith(expectedUpdatedPayload);
        flush();
      });
    });

    test("registerForTeam - (API Error) - If an API Error occurs it should trigger a snackbar.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();

        const clashBotUserRegisterPayload: ClashBotUserRegister = {
          teamName: "Teamy",
          role: "Top",
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          server: guilds[0],
          id: "1"
        };

        const expectedUpdatedPayload: UpdateTeamRequest = {
          serverId: guilds[0].id,
          teamName: "Teamy",
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
          role: Role.Top
        };

        (teamServiceMock.updateTeam as any).mockReturnValue(cold("#", undefined, create400HttpError()));
        component.registerForTeam(clashBotUserRegisterPayload);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledWith(expectedUpdatedPayload);
        flush();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith("Oops! Failed to register you to the Team, missing required details.", "X", {duration: 5000});
      });
    });

    test("registerForTeam - (Timeout Error) - If a Timeout Error occurs it should trigger a snackbar.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();

        const clashBotUserRegisterPayload: ClashBotUserRegister = {
          teamName: "Teamy",
          role: "Top",
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          server: guilds[0],
          id: "1"
        };

        const expectedUpdatedPayload: UpdateTeamRequest = {
          serverId: guilds[0].id,
          teamName: "Teamy",
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
          role: Role.Top
        };

        (teamServiceMock.updateTeam as any).mockReturnValue(cold("7000ms -x|", {x: []}));
        component.registerForTeam(clashBotUserRegisterPayload);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledWith(expectedUpdatedPayload);
        flush();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith("Oops! Your registration timed out, please try again!", "X", {duration: 5000});
      });
    });
  });

  describe("Unregister for Team", () => {
    test("unregissterFromTeam - (Unregister for Team) - If a user is logged in and has details, they should be able to invoke to unregister from a Team.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();

        const teamUiWrapperEvent: TeamUiWrapper = {
          name: "Teamy",
          playerDetails: {
            Top: {
              id: "1",
              name: "Roid",
            }
          },
          tournament: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          server: guilds[0],
          serverId: guilds[0].id,
          id: "1"
        };

        (teamServiceMock.removePlayerFromTeam as any).mockReturnValue(cold("x|", {x: {}}));
        component.unregisterFromTeam(teamUiWrapperEvent);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.removePlayerFromTeam)
            .toHaveBeenCalledWith("Teamy",
              guilds[0].id,
              "awesome_sauce",
              "1",
              `${component.currentApplicationDetails.userDetails.id}`);
        flush();
      });
    });

    test("unregisterFromTeam - (API Error) - If an API Error occurs it should trigger a snackbar.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();

        const teamUiWrapperEvent: TeamUiWrapper = {
          name: "Teamy",
          playerDetails: {
            Top: {
              id: "1",
              name: "Roid",
            }
          },
          tournament: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          server: guilds[0],
          serverId: guilds[0].id,
          id: "1"
        };

        (teamServiceMock.removePlayerFromTeam as any).mockReturnValue(cold("#", undefined, create400HttpError()));
        component.unregisterFromTeam(teamUiWrapperEvent);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.removePlayerFromTeam)
            .toHaveBeenCalledWith("Teamy",
                guilds[0].id,
                "awesome_sauce",
                "1",
                `${component.currentApplicationDetails.userDetails.id}`);
        flush();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith("Oops! Failed to unregister you from the Team.", "X", {duration: 5000});
      });
    });

    test("unregisterFromTeam - (Timeout Error) - If a Timeout Error occurs it should trigger a snackbar.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();

        const teamUiWrapperEvent: TeamUiWrapper = {
          name: "Teamy",
          playerDetails: {
            Top: {
              id: "1",
              name: "Roid",
            }
          },
          tournament: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          server: guilds[0],
          serverId: guilds[0].id,
          id: "1"
        };

        (teamServiceMock.removePlayerFromTeam as any).mockReturnValue(cold("7000ms -x|", {x: []}));
        component.unregisterFromTeam(teamUiWrapperEvent);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.removePlayerFromTeam)
            .toHaveBeenCalledWith("Teamy",
                guilds[0].id,
                "awesome_sauce",
                "1",
                `${component.currentApplicationDetails.userDetails.id}`);
        flush();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith("Oops! Your request timed out, please try again!", "X", {duration: 5000});
      });
    });
  });

  describe("Create New Team", () => {
    test("createNewTeam - (Create New Team) - Create a new Team if the user is logged in.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();
        component.currentSelectedGuild = guilds[0];

        const createNewTeamDetails: CreateNewTeamDetails = {
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          role: "Top"
        };

        const expectedCreateNewTeamPayload: CreateNewTeamRequest = {
          serverId: guilds[0].id,
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          playerDetails: {
            id: `${component.currentApplicationDetails.userDetails.id}`,
            role: Role.Top
          }
        };

        (teamServiceMock.createNewTeam as any).mockReturnValue(cold("x|", {x: {}}));

        component.createNewTeam(createNewTeamDetails);
        flush();

        expect(teamServiceMock.createNewTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.createNewTeam).toHaveBeenCalledWith(expectedCreateNewTeamPayload);
      });
    });

    test("createNewTeam - (API Error) - If an API Error occurs it should trigger a snackbar.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();
        component.currentSelectedGuild = guilds[0];

        const createNewTeamDetails: CreateNewTeamDetails = {
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          role: "Top"
        };

        const expectedCreateNewTeamPayload: CreateNewTeamRequest = {
          serverId: guilds[0].id,
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          playerDetails: {
            id: `${component.currentApplicationDetails.userDetails.id}`,
            role: Role.Top
          }
        };

        (teamServiceMock.createNewTeam as any).mockReturnValue(cold("#", undefined, create400HttpError()));

        component.createNewTeam(createNewTeamDetails);
        flush();

        expect(teamServiceMock.createNewTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.createNewTeam).toHaveBeenCalledWith(expectedCreateNewTeamPayload);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith("Oops! An error occurred while creating a new team.", "X", {duration: 5000});
      });
    });

    test("createNewTeam - (Timeout Error) - If a Timeout Error occurs it should trigger a snackbar.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();
        component.currentSelectedGuild = guilds[0];

        const createNewTeamDetails: CreateNewTeamDetails = {
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          role: "Top"
        };

        const expectedCreateNewTeamPayload: CreateNewTeamRequest = {
          serverId: guilds[0].id,
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          playerDetails: {
            id: `${component.currentApplicationDetails.userDetails.id}`,
            role: Role.Top
          }
        };

        (teamServiceMock.createNewTeam as any)
        .mockReturnValue(cold("7000ms x|", {}));

        component.createNewTeam(createNewTeamDetails);
        flush();

        expect(teamServiceMock.createNewTeam)
          .toHaveBeenCalledTimes(1);
        expect(teamServiceMock.createNewTeam)
          .toHaveBeenCalledWith(expectedCreateNewTeamPayload);
        expect(snackBarMock.open)
          .toHaveBeenCalledTimes(1);
        expect(snackBarMock.open)
          .toHaveBeenCalledWith("Oops! Your request to create a new Team has timed out. Please try again.",
          "X",
          {duration: 5000});
      });
    });
  });

  describe("Tentative Register", () => {
    test("tentativeRegister - (Register for Tentative) - If user is logged in, they should be able to register as tentative for an eligible Tournament.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();
        component.currentSelectedGuild = guilds[0];

        component.tentativeList = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);

        const clashBotTentativeDetails: TentativeRecord = {
          serverId: guilds[0].id,
          tentativePlayers: [],
          playerNames: [],
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          index: 0,
          isMember: true,
          toBeAdded: true
        };

        const placePlayerOnTentativeRequest: PlacePlayerOnTentativeRequest = {
          serverId: guilds[0].id,
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`
        };

        const tentativeResponse: Tentative = {
          serverId: guilds[0].id,
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          tentativePlayers: [{
            id: `${component.currentApplicationDetails.userDetails.id}`,
            name: "Tentative Player"
          }]
        };

        (tentativeServiceMock.placePlayerOnTentative as any).mockReturnValue(cold("x|", {x: tentativeResponse}))
        component.tentativeRegister(clashBotTentativeDetails);

        flush();

        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledWith(placePlayerOnTentativeRequest);

        expect(component.tentativeList[0].isMember).toBeTruthy();
        expect(component.tentativeList[0].tournamentDetails).toEqual({
          tournamentName: "awesome_sauce",
          tournamentDay: "1"
        });
        expect(component.tentativeList[0].tentativePlayers).toHaveLength(1);
        expect(component.tentativeList[0].playerNames?.[0]).toEqual("Tentative Player");
        expect(component.tentativeList?.[0].tentativePlayers?.[0]).toEqual({
          id: `${component.currentApplicationDetails.userDetails.id}`,
          name: "Tentative Player"
        })
      });
    });

    test("tentativeRegister - (Unregister for Tentative) - If user is logged in, and already belongs to a Tentative list they should be able to unregister from the tentative for an eligible Tournament.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();
        component.currentSelectedGuild = guilds[0];

        component.tentativeList = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);

        const clashBotTentativeDetails: TentativeRecord = {
          serverId: guilds[0].id,
          tentativePlayers: [],
          playerNames: ["Tentative Player"],
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          index: 0,
          isMember: true,
          toBeAdded: false
        };

        const tentativeResponse: Tentative = {
          serverId: guilds[0].id,
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          tentativePlayers: []
        };

        (tentativeServiceMock.removePlayerFromTentative as any).mockReturnValue(cold("x|", {x: tentativeResponse}))
        component.tentativeRegister(clashBotTentativeDetails);

        flush();

        expect(tentativeServiceMock.removePlayerFromTentative).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.removePlayerFromTentative).toHaveBeenCalledWith(
            guilds[0].id, "12312321312", "awesome_sauce", "1"
        );

        expect(component.tentativeList[0].isMember).toBeFalsy();
        expect(component.tentativeList[0].tournamentDetails).toEqual({
          tournamentName: "awesome_sauce",
          tournamentDay: "1"
        });
        expect(component.tentativeList[0].tentativePlayers).toHaveLength(0);
        expect(component.tentativeList[0].playerNames).toHaveLength(0);
      });
    });

    test("tentativeRegister - (API Error) - If an API Error occurs it should trigger a snackbar.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();
        component.currentSelectedGuild = guilds[0];

        component.tentativeList = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);

        const clashBotTentativeDetails: TentativeRecord = {
          serverId: guilds[0].id,
          tentativePlayers: [],
          playerNames: [],
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          index: 0,
          isMember: true,
          toBeAdded: true
        };

        const placePlayerOnTentativeRequest: PlacePlayerOnTentativeRequest = {
          serverId: guilds[0].id,
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`
        };

        (tentativeServiceMock.placePlayerOnTentative as any).mockReturnValue(cold("#", undefined, create400HttpError()))
        component.tentativeRegister(clashBotTentativeDetails);

        flush();

        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledWith(placePlayerOnTentativeRequest);

        expect(snackBarMock.open)
          .toHaveBeenCalledTimes(1);
        expect(snackBarMock.open)
          .toHaveBeenCalledWith("Oops, we were unable to update the tentative list. Please try again later!",
          "X",
          {duration: 5000});
      });
    });


    test("tentativeRegister - (Timeout Error) - If a Timeout Error occurs it should trigger a snackbar.", () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        const guilds = mockDiscordGuilds();
        component.currentSelectedGuild = guilds[0];

        component.tentativeList = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);

        const clashBotTentativeDetails: TentativeRecord = {
          serverId: guilds[0].id,
          tentativePlayers: [],
          playerNames: [],
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          index: 0,
          isMember: true,
          toBeAdded: true
        };

        const placePlayerOnTentativeRequest: PlacePlayerOnTentativeRequest = {
          serverId: guilds[0].id,
          tournamentDetails: {
            tournamentName: "awesome_sauce",
            tournamentDay: "1"
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`
        };

        (tentativeServiceMock.placePlayerOnTentative as any).mockReturnValue(cold("7000ms x|", {x: {}}))
        component.tentativeRegister(clashBotTentativeDetails);

        flush();

        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledWith(placePlayerOnTentativeRequest);

        expect(snackBarMock.open)
          .toHaveBeenCalledTimes(1);
        expect(snackBarMock.open)
          .toHaveBeenCalledWith("Oops, we were unable to update the tentative list. Please try again later!",
          "X",
          {duration: 5000});
      });
    });
  });
});

function createMockClashTeams(mockClashTournaments: Tournament[], mockUserDetails: UserDetails): Team[] {
  return [
    {
      name: "Team Abra",
      serverId: "0",
      tournament: {
        tournamentName: mockClashTournaments[0].tournamentName,
        tournamentDay: "2"
      },
      playerDetails: {
        Top: {
          id: "1",
          name: "Roïdräge",
          champions: ["Volibear", "Ornn", "Sett"],
        },
        Mid: {
          id: "4",
          name: "Pepe Conrad",
          champions: ["Lucian"],
        },
        Jg: {
          id: "3",
          name: "Pepe Conrad",
          champions: ["Lucian"],
        },
        Bot: {
          id: "2",
          name: "TheIncentive",
          champions: ["Lucian"],
        },
        Supp: {
          id: "5",
          name: "Pepe Conrad",
          champions: ["Lucian"]
        }
      }
    },
    {
      name: "Team Bangok",
      serverId: "0",
      tournament: {
        tournamentName: mockClashTournaments[0].tournamentName,
        tournamentDay: mockClashTournaments[0].tournamentDay
      },
      playerDetails: {
        Top: {
          id: `${mockUserDetails.id}`,
          name: mockUserDetails.username,
          champions: ["Volibear", "Ornn", "Sett"],
        },
      }
    }
  ];
}

function mapClashTeams(mockClashTeams: Team[]): TeamUiWrapper[] {
  return mockClashTeams.map(record => {
    let teamUiWrapper: TeamUiWrapper = record as TeamUiWrapper
    teamUiWrapper.id = `${record.serverId}-${record.name}`
      .replace(new RegExp(/ /, "g"), "-")
      .toLowerCase();
    return teamUiWrapper;
  })
}
