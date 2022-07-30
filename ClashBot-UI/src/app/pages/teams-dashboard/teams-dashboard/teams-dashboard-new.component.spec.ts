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
  createEmptyMockClashTentativeDetails,
  createMockAppDetails,
  createMockClashBotUserDetails,
  createMockClashTeam,
  createMockClashTournaments,
  createMockGuilds,
  createMockPlayer,
  createMockUserDetails,
} from "../../../shared/shared-test-mocks.spec";
import {Role, Team, TeamService, TentativeService, UserService} from "clash-bot-service-api";
import {Tentative} from "clash-bot-service-api/model/tentative";
import {TentativeRecord} from "../../../interfaces/tentative-record";
import {DiscordGuild} from "../../../interfaces/discord-guild";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {TeamUiWrapper} from "../../../interfaces/team-ui-wrapper";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";

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
    test('(empty) - I should not do anything.', () => {
      component = fixture.componentInstance;
      let msg: ClashTeam = {}
      component.handleIncomingTeamsWsEvent(msg);
      expect(component.teams).toEqual([]);
    });

    test('(New Team with User) - it should be added and remove one eligible Tournaments.', () => {
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
  })
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
