import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TeamsDashboardComponent} from './teams-dashboard.component';
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
  createMockUserDetails,
} from "../../../shared/shared-test-mocks.spec";
import {CreateNewTeamRequest, PlacePlayerOnTentativeRequest, RemovePlayerFromTeamRequest, Role, Team, TeamService, TentativeService, UpdateTeamRequest, UserService} from "clash-bot-service-api";
import {Tentative} from "clash-bot-service-api/model/tentative";
import {TentativeRecord} from "../../../interfaces/tentative-record";
import {DiscordGuild} from "../../../interfaces/discord-guild";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {TeamUiWrapper} from "../../../interfaces/team-ui-wrapper";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import { ClashBotUserRegister } from 'src/app/interfaces/clash-bot-user-register';
import { CreateNewTeamDetails } from 'src/app/interfaces/create-new-team-details';
import { ClashBotTentativeDetails } from 'src/app/interfaces/clash-bot-tentative-details';

jest.mock("../../../services/application-details.service");
jest.mock("../../../services/teams-websocket.service");
jest.mock("@angular/material/snack-bar");
jest.mock("clash-bot-service-api");

describe('TeamsDashboardComponent', () => {
  let component: TeamsDashboardComponent;
  let fixture: ComponentFixture<TeamsDashboardComponent>;
  let userServiceMock: UserService;
  let teamServiceMock: TeamService;
  let tentativeServiceMock: TentativeService;
  let applicationDetailsMock: any;
  let teamsWebsocketServiceMock: any;
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

  describe('On Init', () => {
    test('ngOnInit - (create, logged in, and default guild) - a call to the Application Details should be made and if the User has a default guild it will be set and then a call to retrieve the teams will be made.', (done) => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const mockUserDetails: UserDetails = createMockUserDetails();
        let mockGuilds = mockDiscordGuilds();
        let mockClashTournaments =
          createMockClashTournaments('awesome_sauce', 2);
        let mockClashTeams = createMockClashTeams(mockClashTournaments, mockUserDetails);
        let mockMappedTeams = mapClashTeams(mockClashTeams);
        const expectedTeamsFilter = mockGuilds.map((record) => {
          let id = record.name
            .replace(new RegExp(/ /, 'g'), '-')
            .toLowerCase();
          return {
            value: record.name,
            type: FilterType.SERVER,
            state: false,
            id: id
          }
        });
        let mockApplicationsDetails: ApplicationDetails =
          createMockAppDetails(mockGuilds, createMockPlayer(), mockUserDetails);
        mockApplicationsDetails.loggedIn = true;
        mockApplicationsDetails.defaultGuild = 'Clash Bot';
        let mockClashTentativeDetails: Tentative[] =
          createEmptyMockClashTentativeDetails();
        mockClashTentativeDetails?.[0].tentativePlayers?.push({
          name: 'Sample User',
          id: '1234'
        });
        let coldClashTeamsWebsocketObs = new Subject<ClashTeam | String>();

        applicationDetailsMock.getApplicationDetails
          .mockReturnValue(cold('x|', {x: mockApplicationsDetails}));
        (tentativeServiceMock.getTentativeDetails as any)
          .mockReturnValue(cold('x|', {x: mockClashTentativeDetails}));
        (teamServiceMock.getTeam as any)
          .mockReturnValue(cold('x|', {x: mockClashTeams}));
        teamsWebsocketServiceMock.getSubject
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
          name: 'Team toBeAdded',
          playerDetails: {
            Top: {
              name: 'PlayerOne',
              id: '1',
              role: 'Top',
              champions: []
            },
          },
          tournament: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          serverName: 'Goon Squad',
        };

        coldClashTeamsWebsocketObs.subscribe((msg) => {
          if (typeof msg === 'string') {
            expect(msg).toEqual(mockApplicationsDetails.defaultGuild);
          }
        });

        fixture.detectChanges();

        flush();

        expect(component.showSpinner).toBeFalsy();
        expect(component.teamFilters).toEqual(expectedTeamsFilter);
        expect(component.currentApplicationDetails).toEqual(mockApplicationsDetails);
        expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(2);
        expect(teamServiceMock.getTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.getTeam).toHaveBeenCalledWith(mockApplicationsDetails.defaultGuild);
        expect(tentativeServiceMock.getTentativeDetails).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.getTentativeDetails).toHaveBeenCalledWith(mockApplicationsDetails.defaultGuild);
        expect(teamsWebsocketServiceMock.getSubject).toHaveBeenCalledTimes(2);
        expect(component.tentativeList).toEqual(mockClashTentativeDetails);
        expect(component.teams).toEqual([...mockMappedTeams])

        coldClashTeamsWebsocketObs.subscribe((msg) => {
          if (typeof msg !== 'string') {
            expect(component.teams.length).toEqual(mockMappedTeams.length + 1);
            expect(component.teams).toEqual([...mockMappedTeams, msg]);
            coldClashTeamsWebsocketObs.unsubscribe();
            done();
          }
        });

        coldClashTeamsWebsocketObs.next(msg);
      })
    })

    test('ngOnInit - (create, logged in, no default guild) - a call to the Application Details should be made and if the User does not have a default guild, then none shall be chosen.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        let mockObservableGuilds = mockDiscordGuilds();
        const expectedTeamsFilter = mockObservableGuilds.map((record) => {
          let id = record.name.replace(new RegExp(/ /, 'g'), '-').toLowerCase();
          return {
            value: record.name,
            type: FilterType.SERVER,
            state: false,
            id: id
          }
        });
        const mockApplicationsDetails: ApplicationDetails = {
          currentTournaments: [],
          userGuilds: mockObservableGuilds
        }

        let coldApplicationDetailsObs = cold('x|', {x: mockApplicationsDetails});

        applicationDetailsMock.getApplicationDetails.mockReturnValue(coldApplicationDetailsObs);

        component = fixture.componentInstance;

        fixture.detectChanges();

        flush();
        expect(component.showSpinner).toBeFalsy();
        expect(component.teamFilters).toEqual(expectedTeamsFilter);
        expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(2);
        expect(teamServiceMock.getTeam).not.toHaveBeenCalled();
      })
    })
  });

  describe('Handling Incoming Websocket Event', () => {
    test('handleIncomingTeamsWsEvent - (empty) - I should not do anything.', () => {
      component = fixture.componentInstance;
      let msg: ClashTeam = {}
      component.handleIncomingTeamsWsEvent(msg);
      expect(component.teams).toEqual([]);
    });

    test( 'handleIncomingTeamsWsEvent - (New Team with User) - it should be added and remove one eligible Tournaments.', () => {
      component = fixture.componentInstance;
      const expectedTournamentName = 'awesome_sauce';
      const expectedTournamentDay = '1';
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
      expect(component.teams.length).toEqual(0);

      component.handleIncomingTeamsWsEvent(mockClashTeam[0]);

      expect(component.teams.length).toEqual(1);
      expect(component.teams[0]).toEqual(mockClashTeam[0]);
      expect(component.eligibleTournaments).toHaveLength(1);
      expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
    });

    test( 'handleIncomingTeamsWsEvent - (New Team with User, only one Team with error) - Team with error, it should create a new array.', () => {
      component = fixture.componentInstance;
      const expectedTournamentName = 'awesome_sauce';
      const expectedTournamentDay = '1';
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
      component.teams = [{ error: 'No data'}];
      expect(component.teams).toHaveLength(1);

      component.handleIncomingTeamsWsEvent(mockClashTeam[0]);

      expect(component.teams.length).toEqual(1);
      expect(component.teams[0]).toEqual(mockClashTeam[0]);
      expect(component.eligibleTournaments).toHaveLength(1);
      expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
    });

    test( 'handleIncomingTeamsWsEvent - (Team that already exists) - it should be updated and remove one eligible Tournaments.', () => {
      component = fixture.componentInstance;
      const expectedTournamentName = 'awesome_sauce';
      const expectedTournamentDay = '1';
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

      component.teams = [...mockClashTeam];

      expect(component.teams.length).toEqual(2);

      const teamUpdate = {...mockClashTeam[0]};
      teamUpdate.playerDetails = {
        Bot: {
          name: mockUserDetails.username,
          id: `${mockUserDetails.id}`,
          champions: []
        }
      };

      const expectedTeamUiWrapper : TeamUiWrapper = {...teamUpdate};
      expectedTeamUiWrapper.id = 'test-server-team-abra';
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
         ]


      component.handleIncomingTeamsWsEvent(teamUpdate);

      expect(component.teams.length).toEqual(2);
      expect(component.teams[0]).toEqual(expectedTeamUiWrapper);
      expect(component.eligibleTournaments).toHaveLength(1);
      expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
    });

    test( 'handleIncomingTeamsWsEvent - (Team should be removed that has no players) - should remove Team and add back the eligible Tournament.', () => {
      component = fixture.componentInstance;
      const expectedTournamentName = 'awesome_sauce';
      const expectedTournamentDay = '1';
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
          name: 'ThisGuy',
          id: '0',
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

      component.handleIncomingTeamsWsEvent(teamUpdate);

      expect(component.teams).toHaveLength(1);
      expect(component.teams[0]).toEqual(mockClashTeam[0]);
      expect(component.eligibleTournaments).toHaveLength(2);
    });
  });

  describe('Map Team Service Response', () => {
    test('mapDynamicValues - When there is only one Team and one valid member.', () => {
      component = fixture.componentInstance;
      component
        .currentApplicationDetails
        .userDetails = createMockUserDetails();
      let mockTeam: Team = {
        name: 'Oooooogi',
        serverName: 'Goon Squad',
        playerDetails: {
          Top: {
            name: 'Roid',
            id: '1',
          }
        },
        tournament: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1'
        }
      };
      const expectedMappedTeam: TeamUiWrapper = ({...mockTeam} as TeamUiWrapper);
      expectedMappedTeam.id = 'goon-squad-oooooogi';
      expectedMappedTeam.teamDetails = [
        {
          name: 'Roid',
          id: '1',
          role: Role.Top,
          isUser: false
        },
        {
          id: '0',
          role: Role.Mid,
          isUser: false
        },
        {
          id: '0',
          role: Role.Jg,
          isUser: false
        },
        {
          id: '0',
          role: Role.Bot,
          isUser: false
        },
        {
          id: '0',
          role: Role.Supp,
          isUser: false
        },
      ];
      expect(component.mapTeamToTeamUiWrapper(mockTeam)).toEqual(expectedMappedTeam);
    });

    test('mapDynamicValues - When there is a Team that has a full roster.', () => {
      component = fixture.componentInstance;
      component
        .currentApplicationDetails
        .userDetails = createMockUserDetails();
      let mockTeam: Team = {
        name: 'Oooooogi',
        serverName: 'Goon Squad',
        playerDetails: {
          Top: {
            name: 'Roid',
            id: '1',
          },
          Jg: {
            name: 'PepeConrad',
            id: '2',
          },
          Bot: {
            name: 'TheIncentive',
            id: '5',
          },
          Supp: {
            name: 'MrSir',
            id: '4',
          },
          Mid: {
            name: 'Shiragaku',
            id: '3'
          },
        },
        tournament: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1'
        }
      };
      const expectedMappedTeam: TeamUiWrapper = ({...mockTeam} as TeamUiWrapper);
      expectedMappedTeam.id = 'goon-squad-oooooogi';
      expectedMappedTeam.teamDetails = [
        {
          name: 'Roid',
          id: '1',
          role: Role.Top,
          isUser: false
        },
        {
          id: '3',
          name: 'Shiragaku',
          role: Role.Mid,
          isUser: false
        },
        {
          id: '2',
          name: 'PepeConrad',
          role: Role.Jg,
          isUser: false
        },
        {
          id: '5',
          name: 'TheIncentive',
          role: Role.Bot,
          isUser: false
        },
        {
          id: '4',
          name: 'MrSir',
          role: Role.Supp,
          isUser: false
        },
      ];
      expect(component.mapTeamToTeamUiWrapper(mockTeam)).toEqual(expectedMappedTeam);
    });
  });

  describe('Sync Users eligible Tournaments', () => {
    test('repopulateEligibleTournaments - If a User has does not belong to any team, they should have all tournaments as eligible and should be able to create a new Team.', () =>{
      component = fixture.componentInstance;
      const userDetails = createMockUserDetails();
      const tournaments
          = createMockClashTournaments('awesome_sauce', 2);
      const mockTeams = createMockClashTeams(tournaments, userDetails);

      component.currentApplicationDetails.currentTournaments = tournaments;
      component.currentApplicationDetails.userDetails = userDetails;

      component.repopulateEligibleTournaments(mockTeams);

      expect(component.eligibleTournaments).toHaveLength(2);
      expect(component.eligibleTournaments).toEqual(tournaments);
      expect(component.canCreateNewTeam).toBeTruthy();
    });

    test('repopulateEligibleTournaments - If a User belongs to a team by themselves, they should not create a new Team for that Tournament.', () =>{
      component = fixture.componentInstance;
      const userDetails = createMockUserDetails();
      const tournaments
          = createMockClashTournaments('awesome_sauce', 2);
      const mockTeams = createMockClashTeams(tournaments, userDetails);
      mockTeams[0].tournament = tournaments[0];
      mockTeams[0].playerDetails = {
        Top: {
          name: 'Me',
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

    test('repopulateEligibleTournaments - If a User belongs to all teams by themselves, they should not be able to create a new Team.', () =>{
      component = fixture.componentInstance;
      const userDetails = createMockUserDetails();
      const tournaments
          = createMockClashTournaments('awesome_sauce', 2);
      const mockTeams = createMockClashTeams(tournaments, userDetails);
      mockTeams[0].tournament = tournaments[0];
      mockTeams[0].playerDetails = {
        Top: {
          name: 'Me',
          id: `${userDetails.id}`,
        }
      }
      mockTeams[1].tournament = tournaments[1];
      mockTeams[1].playerDetails = {
        Top: {
          name: 'Me',
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

  describe('Tournament to Clash Team Map', () => {
    test('As a user, I should know all Tournaments I am scheduled with and which Teams I am assigned to.', () => {
      const expectedTournamentName = 'awesome_sauce';
      const expectedTournamentDay = '1';
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
          name: 'Abra',
          serverName: 'Special Server',
          tournament: {
            tournamentName: 'dne',
            tournamentDay: expectedTournamentDay
          },
          playerDetails: {
            Top: {
              id: '0',
              name: 'User 1',
              role: 'Top'
            },
            Mid: {
              id: '2',
              name: 'User 2',
              role: 'Mid'
            },
            Jg: {
              id: '3',
              name: 'User 3',
              role: 'Jg'
            },
            Bot: {
              id: '4',
              name: 'User 4',
              role: 'Bot'
            },
            Supp: {
              id: '5',
              name: 'User 5',
              role: 'Supp'
            },
          }
        },
        {
          name: 'Abra2',
          serverName: 'Special Server',
          tournament: {
            tournamentName: expectedTournamentName,
            tournamentDay: expectedTournamentDay
          },
          playerDetails: {
            Top: {
              id: '1',
              name: 'User 1',
              role: 'Top'
            },
            Mid: {
              id: '2',
              name: 'User 2',
              role: 'Mid'
            },
            Jg: {
              id: '3',
              name: 'User 3',
              role: 'Jg'
            },
            Bot: {
              id: '4',
              name: 'User 4',
              role: 'Bot'
            },
            Supp: {
              id: '5',
              name: 'User 5',
              role: 'Supp'
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

  describe('Update Tentative List Based on Team', () => {
    test('updateTentativeListBasedOnTeam - (Remove from Tentative List) - A player should be removed from Tentative when they belong to a Team for a tournament.', () => {
      component = fixture.componentInstance;
      const tentativeDetails : TentativeRecord[] = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);
      tentativeDetails[0].isMember = false;
      tentativeDetails[0].tentativePlayers?.push(
        {
          id: '1',
          name: 'Roid',
        }
      );
      component.tentativeList = [...tentativeDetails];
      component.updateTentativeListBasedOnTeam({});

      tentativeDetails[0].tentativePlayers = [];

      expect(component.tentativeList).toHaveLength(3);
      expect(component.tentativeList[0]).toEqual(tentativeDetails[0]);
    });
  });

  describe('Register for Team', () => {
    test('registerForTeam - (Register for Team) - If a user is logged in and has details, they should be able to invoke to update Team.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        
        const clashBotUserRegisterPayload: ClashBotUserRegister = {
          teamName: 'Teamy',
          role: 'Top',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          serverName: 'Goon Squad',
          id: '1'
        };
  
        const expectedUpdatedPayload: UpdateTeamRequest = {
          serverName: 'Goon Squad',
          teamName: 'Teamy',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
          role: Role.Top
        };
  
        (teamServiceMock.updateTeam as any).mockReturnValue(cold('x|', {x: {}}));
        component.registerForTeam(clashBotUserRegisterPayload);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledWith(expectedUpdatedPayload);
        flush();
      });
    });

    test('registerForTeam - (API Error) - If an API Error occurs it should trigger a snackbar.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        
        const clashBotUserRegisterPayload: ClashBotUserRegister = {
          teamName: 'Teamy',
          role: 'Top',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          serverName: 'Goon Squad',
          id: '1'
        };
  
        const expectedUpdatedPayload: UpdateTeamRequest = {
          serverName: 'Goon Squad',
          teamName: 'Teamy',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
          role: Role.Top
        };
  
        (teamServiceMock.updateTeam as any).mockReturnValue(cold('#', undefined, create400HttpError()));
        component.registerForTeam(clashBotUserRegisterPayload);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledWith(expectedUpdatedPayload);
        flush();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Failed to register you to the Team, missing required details.', 'X', { duration: 5000 });
      });
    });

    test('registerForTeam - (Timeout Error) - If a Timeout Error occurs it should trigger a snackbar.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        
        const clashBotUserRegisterPayload: ClashBotUserRegister = {
          teamName: 'Teamy',
          role: 'Top',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          serverName: 'Goon Squad',
          id: '1'
        };
  
        const expectedUpdatedPayload: UpdateTeamRequest = {
          serverName: 'Goon Squad',
          teamName: 'Teamy',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
          role: Role.Top
        };
  
        (teamServiceMock.updateTeam as any).mockReturnValue(cold('7000ms -x|', {x: []}));
        component.registerForTeam(clashBotUserRegisterPayload);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateTeam).toHaveBeenCalledWith(expectedUpdatedPayload);
        flush();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your registration timed out, please try again!', 'X', { duration: 5000 });
      });
    });
  });

  describe('Unregister for Team', () => {
    test('unregissterFromTeam - (Unregister for Team) - If a user is logged in and has details, they should be able to invoke to unregister from a Team.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        
        const teamUiWrapperEvent: TeamUiWrapper = {
          name: 'Teamy',
          playerDetails: {
            Top: {
              id: '1',
              name: 'Roid',
            }
          },
          tournament: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          serverName: 'Goon Squad',
          id: '1'
        };
  
        const expectedRemovePayload: RemovePlayerFromTeamRequest = {
          serverName: 'Goon Squad',
          teamName: 'Teamy',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
        };
  
        (teamServiceMock.removePlayerFromTeam as any).mockReturnValue(cold('x|', {x: {}}));
        component.unregisterFromTeam(teamUiWrapperEvent);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledWith(expectedRemovePayload);
        flush();
      });
    });

    test('unregisterFromTeam - (API Error) - If an API Error occurs it should trigger a snackbar.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        
        
        const teamUiWrapperEvent: TeamUiWrapper = {
          name: 'Teamy',
          playerDetails: {
            Top: {
              id: '1',
              name: 'Roid',
            }
          },
          tournament: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          serverName: 'Goon Squad',
          id: '1'
        };
  
        const expectedRemovePayload: RemovePlayerFromTeamRequest = {
          serverName: 'Goon Squad',
          teamName: 'Teamy',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
        };
  
        (teamServiceMock.removePlayerFromTeam as any).mockReturnValue(cold('#', undefined, create400HttpError()));
        component.unregisterFromTeam(teamUiWrapperEvent);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledWith(expectedRemovePayload);
        flush();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Failed to unregister you from the Team.', 'X', { duration: 5000 });
      });
    });

    test('unregisterFromTeam - (Timeout Error) - If a Timeout Error occurs it should trigger a snackbar.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        
        
        const teamUiWrapperEvent: TeamUiWrapper = {
          name: 'Teamy',
          playerDetails: {
            Top: {
              id: '1',
              name: 'Roid',
            }
          },
          tournament: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          serverName: 'Goon Squad',
          id: '1'
        };
  
        const expectedRemovePayload: RemovePlayerFromTeamRequest = {
          serverName: 'Goon Squad',
          teamName: 'Teamy',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`,
        };
  
        (teamServiceMock.removePlayerFromTeam as any).mockReturnValue(cold('7000ms -x|', {x: []}));
        component.unregisterFromTeam(teamUiWrapperEvent);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.removePlayerFromTeam).toHaveBeenCalledWith(expectedRemovePayload);
        flush();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your request timed out, please try again!', 'X', { duration: 5000 });
      });
    });
  });

  describe('Create New Team', () => {
    test('createNewTeam - (Create New Team) - Create a new Team if the user is logged in.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        component.currentSelectedGuild = 'Goon Squad';

        const createNewTeamDetails: CreateNewTeamDetails = {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
          role: 'Top'
        };

        const expectedCreateNewTeamPayload: CreateNewTeamRequest = {
          serverName: 'Goon Squad',
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
          playerDetails: {
            id: `${component.currentApplicationDetails.userDetails.id}`,
            role: Role.Top
          }
        };

        (teamServiceMock.createNewTeam as any).mockReturnValue(cold('x|', { x: {}}));
        
        component.createNewTeam(createNewTeamDetails);
        flush();

        expect(teamServiceMock.createNewTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.createNewTeam).toHaveBeenCalledWith(expectedCreateNewTeamPayload);
      });
    });

    test('createNewTeam - (API Error) - If an API Error occurs it should trigger a snackbar.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        component.currentSelectedGuild = 'Goon Squad';

        const createNewTeamDetails: CreateNewTeamDetails = {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
          role: 'Top'
        };

        const expectedCreateNewTeamPayload: CreateNewTeamRequest = {
          serverName: 'Goon Squad',
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
          playerDetails: {
            id: `${component.currentApplicationDetails.userDetails.id}`,
            role: Role.Top
          }
        };

        (teamServiceMock.createNewTeam as any).mockReturnValue(cold('#', undefined, create400HttpError()));
        
        component.createNewTeam(createNewTeamDetails);
        flush();

        expect(teamServiceMock.createNewTeam).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.createNewTeam).toHaveBeenCalledWith(expectedCreateNewTeamPayload);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! An error occurred while creating a new team.', 'X', { duration: 5000 });
      });
    });

    test('createNewTeam - (Timeout Error) - If a Timeout Error occurs it should trigger a snackbar.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();
        component.currentSelectedGuild = 'Goon Squad';

        const createNewTeamDetails: CreateNewTeamDetails = {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
          role: 'Top'
        };

        const expectedCreateNewTeamPayload: CreateNewTeamRequest = {
          serverName: 'Goon Squad',
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
          playerDetails: {
            id: `${component.currentApplicationDetails.userDetails.id}`,
            role: Role.Top
          }
        };

        (teamServiceMock.createNewTeam as any)
        .mockReturnValue(cold('7000ms x|', {}));
        
        component.createNewTeam(createNewTeamDetails);
        flush();

        expect(teamServiceMock.createNewTeam)
          .toHaveBeenCalledTimes(1);
        expect(teamServiceMock.createNewTeam)
          .toHaveBeenCalledWith(expectedCreateNewTeamPayload);
        expect(snackBarMock.open)
          .toHaveBeenCalledTimes(1);
        expect(snackBarMock.open)
          .toHaveBeenCalledWith('Oops! Your request to create a new Team has timed out. Please try again.', 
          'X', 
          { duration: 5000 });
      });
    });
  });

  describe('Tentative Register', () => {
    test('tentativeRegister - (Register for Tentative) - If user is logged in, they should be able to register as tentative for an eligible Tournament.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();

        component.tentativeList = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);

        const clashBotTentativeDetails: ClashBotTentativeDetails = {
          serverName: 'Goon Squad',
          tentativePlayers: [],
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          index: 0,
          toBeAdded: true
        };

        const placePlayerOnTentativeRequest: PlacePlayerOnTentativeRequest = {
          serverName: 'Goon Squad',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`
        };

        const tentativeResponse: Tentative = {
          serverName: 'Goon Squad',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          tentativePlayers: [{
            id: `${component.currentApplicationDetails.userDetails.id}`,
            name: 'Tentative Player'
          }]
        };

        (tentativeServiceMock.placePlayerOnTentative as any).mockReturnValue(cold('x|', { x: tentativeResponse}))
        component.tentativeRegister(clashBotTentativeDetails);

        flush();

        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledWith(placePlayerOnTentativeRequest);

        expect(component.tentativeList[0].isMember).toBeTruthy();
        expect(component.tentativeList[0].tournamentDetails).toEqual({
          tournamentName: 'awesome_sauce',
          tournamentDay: '1'
        });
        expect(component.tentativeList[0].tentativePlayers).toHaveLength(1);
        expect(component.tentativeList?.[0].tentativePlayers?.[0]).toEqual({
          id: `${component.currentApplicationDetails.userDetails.id}`,
          name: 'Tentative Player'
        })
      });
    });

    test('tentativeRegister - (Unregister for Tentative) - If user is logged in, and already belongs to a Tentative list they should be able to unregister from the tentative for an eligible Tournament.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();

        component.tentativeList = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);

        const clashBotTentativeDetails: ClashBotTentativeDetails = {
          serverName: 'Goon Squad',
          tentativePlayers: [],
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          index: 0,
          toBeAdded: false
        };

        const placePlayerOnTentativeRequest: PlacePlayerOnTentativeRequest = {
          serverName: 'Goon Squad',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`
        };

        const tentativeResponse: Tentative = {
          serverName: 'Goon Squad',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          tentativePlayers: [{
            id: `${component.currentApplicationDetails.userDetails.id}`,
            name: 'Tentative Player'
          }]
        };

        (tentativeServiceMock.removePlayerFromTentative as any).mockReturnValue(cold('x|', { x: tentativeResponse}))
        component.tentativeRegister(clashBotTentativeDetails);

        flush();

        expect(tentativeServiceMock.removePlayerFromTentative).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.removePlayerFromTentative).toHaveBeenCalledWith(placePlayerOnTentativeRequest);

        expect(component.tentativeList[0].isMember).toBeTruthy();
        expect(component.tentativeList[0].tournamentDetails).toEqual({
          tournamentName: 'awesome_sauce',
          tournamentDay: '1'
        });
        expect(component.tentativeList[0].tentativePlayers).toHaveLength(1);
        expect(component.tentativeList?.[0].tentativePlayers?.[0]).toEqual({
          id: `${component.currentApplicationDetails.userDetails.id}`,
          name: 'Tentative Player'
        })
      });
    });

    test('tentativeRegister - (API Error) - If an API Error occurs it should trigger a snackbar.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();

        component.tentativeList = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);

        const clashBotTentativeDetails: ClashBotTentativeDetails = {
          serverName: 'Goon Squad',
          tentativePlayers: [],
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          index: 0,
          toBeAdded: true
        };

        const placePlayerOnTentativeRequest: PlacePlayerOnTentativeRequest = {
          serverName: 'Goon Squad',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`
        };

        const tentativeResponse: Tentative = {
          serverName: 'Goon Squad',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          tentativePlayers: [{
            id: `${component.currentApplicationDetails.userDetails.id}`,
            name: 'Tentative Player'
          }]
        };

        (tentativeServiceMock.placePlayerOnTentative as any).mockReturnValue(cold('#', undefined, create400HttpError()))
        component.tentativeRegister(clashBotTentativeDetails);

        flush();

        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledWith(placePlayerOnTentativeRequest);

        expect(snackBarMock.open)
          .toHaveBeenCalledTimes(1);
        expect(snackBarMock.open)
          .toHaveBeenCalledWith('Oops, we were unable to update the tentative list. Please try again later!', 
          'X', 
          { duration: 5000 });
      });
    });


    test('tentativeRegister - (Timeout Error) - If a Timeout Error occurs it should trigger a snackbar.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;
  
        component.currentApplicationDetails.loggedIn = true;
        component.currentApplicationDetails.userDetails = createMockUserDetails();

        component.tentativeList = (createEmptyMockClashTentativeDetails() as TentativeRecord[]);

        const clashBotTentativeDetails: ClashBotTentativeDetails = {
          serverName: 'Goon Squad',
          tentativePlayers: [],
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          index: 0,
          toBeAdded: true
        };

        const placePlayerOnTentativeRequest: PlacePlayerOnTentativeRequest = {
          serverName: 'Goon Squad',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          playerId: `${component.currentApplicationDetails.userDetails.id}`
        };

        const tentativeResponse: Tentative = {
          serverName: 'Goon Squad',
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
          },
          tentativePlayers: [{
            id: `${component.currentApplicationDetails.userDetails.id}`,
            name: 'Tentative Player'
          }]
        };

        (tentativeServiceMock.placePlayerOnTentative as any).mockReturnValue(cold('7000ms x|', {x: {}}))
        component.tentativeRegister(clashBotTentativeDetails);

        flush();

        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledTimes(1);
        expect(tentativeServiceMock.placePlayerOnTentative).toHaveBeenCalledWith(placePlayerOnTentativeRequest);

        expect(snackBarMock.open)
          .toHaveBeenCalledTimes(1);
        expect(snackBarMock.open)
          .toHaveBeenCalledWith('Oops, we were unable to update the tentative list. Please try again later!', 
          'X', 
          { duration: 5000 });
      });
    });
  });
});

function mockDiscordGuilds(): DiscordGuild[] {
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
    "icon": '123123123',
    "owner": true,
    "permissions": 2147483647,
    "features": [],
    "permissions_new": "274877906943"
  }];
}

function createMockClashTeams(mockClashTournaments: Tournament[], mockUserDetails: UserDetails): Team[] {
  return [
    {
      name: 'Team Abra',
      serverName: 'Test Server',
      tournament: {
        tournamentName: mockClashTournaments[0].tournamentName,
        tournamentDay: '2'
      },
      playerDetails: {
        Top: {
          id: '1',
          name: 'Roïdräge',
          champions: ['Volibear', 'Ornn', 'Sett'],
        },
        Mid: {
          id: '4',
          name: 'Pepe Conrad',
          champions: ['Lucian'],
        },
        Jg: {
          id: '3',
          name: 'Pepe Conrad',
          champions: ['Lucian'],
        },
        Bot: {
          id: '2',
          name: 'TheIncentive',
          champions: ['Lucian'],
        },
        Supp: {
          id: '5',
          name: 'Pepe Conrad',
          champions: ['Lucian']
        }
      }
    },
    {
      name: 'Team Bangok',
      serverName: 'Test Server',
      tournament: {
        tournamentName: mockClashTournaments[0].tournamentName,
        tournamentDay: mockClashTournaments[0].tournamentDay
      },
      playerDetails: {
        Top: {
          id: `${mockUserDetails.id}`,
          name: mockUserDetails.username,
          champions: ['Volibear', 'Ornn', 'Sett'],
        },
      }
    }
  ];
}

function mapClashTeams(mockClashTeams: Team[]): TeamUiWrapper[] {
  return mockClashTeams.map(record => {
    let teamUiWrapper: TeamUiWrapper = record as TeamUiWrapper
    teamUiWrapper.id = `${record.serverName}-${record.name}`
      .replace(new RegExp(/ /, 'g'), '-')
      .toLowerCase();
    return teamUiWrapper;
  })
}
