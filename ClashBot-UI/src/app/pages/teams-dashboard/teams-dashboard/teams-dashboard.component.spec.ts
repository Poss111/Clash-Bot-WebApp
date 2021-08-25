import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TeamsDashboardComponent} from './teams-dashboard.component';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatChip, MatChipsModule} from "@angular/material/chips";
import {TeamCardComponent} from "../team-card/team-card.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {MatCardModule} from "@angular/material/card";
import {ClashBotService} from "../../../services/clash-bot.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TestScheduler} from "rxjs/testing";
import {FilterType} from "../../../interfaces/filter-type";
import {HttpErrorResponse} from "@angular/common/http";
import {ClashTeam} from "../../../interfaces/clash-team";
import {UserDetails} from "../../../interfaces/user-details";
import {UserDetailsService} from "../../../services/user-details.service";
import {MatIconModule} from "@angular/material/icon";
import {MatDialogModule} from "@angular/material/dialog";
import {ColdObservable} from "rxjs/internal/testing/ColdObservable";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {MatOption, MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {ApplicationDetails} from "../../../interfaces/application-details";
import {DiscordGuild} from "../../../interfaces/discord-guild";

jest.mock("../../../services/clash-bot.service");
jest.mock("../../../services/application-details.service");
jest.mock("../../../services/user-details.service");
jest.mock("@angular/material/snack-bar");

describe('TeamsDashboardComponent', () => {
  let component: TeamsDashboardComponent;
  let fixture: ComponentFixture<TeamsDashboardComponent>;
  let clashBotServiceMock: any;
  let userDetailsMock: any;
  let applicationDetailsMock: any;
  let snackBarMock: any;
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    jest.resetAllMocks();
    await TestBed.configureTestingModule({
      declarations: [TeamsDashboardComponent, TeamCardComponent],
      imports: [MatProgressSpinnerModule,
        MatChipsModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatCardModule,
        HttpClientTestingModule,
        MatIconModule,
        MatDialogModule,
        MatOptionModule,
        MatSelectModule],
      providers: [ClashBotService, UserDetailsService, ApplicationDetailsService, MatSnackBar],
    })
      .compileComponents();
    clashBotServiceMock = TestBed.inject(ClashBotService);
    snackBarMock = TestBed.inject(MatSnackBar);
    userDetailsMock = TestBed.inject(UserDetailsService);
    applicationDetailsMock = TestBed.inject(ApplicationDetailsService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamsDashboardComponent);
  });

  describe('On Init', () => {
    test('Whenever the component is created, a call to the Application Details should be made and if the User has a default guild it will be set and then a call to retrieve the teams will be made.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        let mockObservableGuilds = mockDiscordGuilds();
        let mockClashTournaments = createMockClashTournaments('awesome_sauce', '1');
        let mockClashTeams = createMockClashTeams(mockClashTournaments, mockUserDetails);
        let mockMappedTeams = mapClashTeams(mockClashTeams, mockUserDetails);
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
          currentTournaments: mockClashTournaments,
          defaultGuild: 'Goon Squad',
          userGuilds: mockObservableGuilds
        }

        let coldApplicationDetailsObs = cold('x|', {x: mockApplicationsDetails});
        let coldUserDetailsObs = cold('x|', { x: mockUserDetails});
        let coldClashTeamsObs = cold('x|', {x: mockClashTeams});

        applicationDetailsMock.getApplicationDetails.mockReturnValue(coldApplicationDetailsObs);
        userDetailsMock.getUserDetails.mockReturnValue(coldUserDetailsObs);
        clashBotServiceMock.getClashTeams.mockReturnValue(coldClashTeamsObs);

        component = fixture.componentInstance;

        expect(component.showSpinner).toBeFalsy();
        expect(component.formControl).toBeFalsy();

        fixture.detectChanges();

        flush();
        expect(component.showSpinner).toBeFalsy();
        expect(component.teamFilters).toEqual(expectedTeamsFilter);
        expect(component.color).toEqual('primary');
        expect(component.mode).toEqual('indeterminate');
        expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(2);
        expect(userDetailsMock.getUserDetails).toHaveBeenCalledTimes(1);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledTimes(1);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledWith(mockApplicationsDetails.defaultGuild);
        if (component.formControl) {
          expect(component.formControl.value).toEqual(mockApplicationsDetails.defaultGuild);
          expect(component.teams).toEqual(mockMappedTeams);
        } else {
          expect(component.formControl).toBeTruthy();
        }
      })
    })

    test('Whenever the component is created, a call to the Application Details should be made and if the User does not have a default guild, then none shall be chosen.', () => {
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
        expect(component.formControl).toBeFalsy();

        fixture.detectChanges();

        flush();
        expect(component.showSpinner).toBeFalsy();
        expect(component.teamFilters).toEqual(expectedTeamsFilter);
        expect(component.color).toEqual('primary');
        expect(component.mode).toEqual('indeterminate');
        expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(1);
        expect(userDetailsMock.getUserDetails).not.toHaveBeenCalled();
        expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
        if (component.formControl) {
          expect(component.formControl.value).toBeFalsy();
          expect(component.teams).toHaveLength(0);
        } else {
          expect(component.formControl).toBeTruthy();
        }
      })
    })
  })

  describe('Filter Team', () => {
    test('When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and filter it based on the argument passed.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        setupGuildObservable(cold);
        component = fixture.componentInstance;

        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '1';
        let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
        let mockClashTeams: ClashTeam[] = createMockClashTeams(mockClashTournaments, mockUserDetails);
        let expectedClashTeam: ClashTeam[] = mapClashTeams(mockClashTeams, mockUserDetails);

        const userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        const clashTeamsObservable$ = cold('----x|', {x: mockClashTeams});
        const applicationDetailsObservable$ = cold('-x', {x: {currentTournaments: mockClashTournaments}})

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsObservable$);

        const mockMatChip: MatChip = ({
          selected: () => {
          },
          deselect: () => {
          },
          selectViaInteraction: () => {
          }
        } as any);
        const expectedSearchPhrase = 'Goon Squad';
        component.formControl = new FormControl(expectedSearchPhrase);
        component.formControl.setValue(expectedSearchPhrase);
        component.filterTeam(mockMatChip);

        expectObservable(userDetailsColdObservable).toBe('-x|', {x: mockUserDetails});
        expectObservable(clashTeamsObservable$).toBe('----x|', {x: mockClashTeams});
        expectObservable(applicationDetailsObservable$).toBe('-x', {x: {currentTournaments: mockClashTournaments}});

        flush();
        expect(clashBotServiceMock.getClashTeams).toBeCalledWith(expectedSearchPhrase);
        expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
        expect(component.showSpinner).toBeFalsy();
        expect(component.teams).toEqual(expectedClashTeam);
        expect(component.eligibleTournaments).toHaveLength(1);
        expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
      })
    })

    test('When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and if an generic error occurs the Snack Bar should be called with a generic message..', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        setupGuildObservable(cold);
        component = fixture.componentInstance;

        let error = new Error('Failed to make call.');

        const userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        const clashTeamsObservable$ = cold('-#', undefined, error);

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        const mockMatChip: MatChip = ({
          selected: () => {
          },
          deselect: () => {
          },
          selectViaInteraction: () => {
          }
        } as any);
        const expectedSearchPhrase = 'Goon Squad';
        component.formControl = new FormControl(expectedSearchPhrase);
        component.formControl.setValue(expectedSearchPhrase);

        component.filterTeam(mockMatChip);

        expectObservable(clashTeamsObservable$).toBe('-#', undefined, error);
        expectObservable(userDetailsColdObservable).toBe('-x|', {x: mockUserDetails});

        flush();
        expect(clashBotServiceMock.getClashTeams).toBeCalledWith(expectedSearchPhrase);
        expect(component.showSpinner).toBeFalsy();
        expect(component.teams).toHaveLength(1);
        expect(component.teams).toEqual([{error: "Failed to make call."}]);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
      })
    })

    test('When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and if the call times out after 7 seconds the Snack Bar should be called with a generic message..', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        setupGuildObservable(cold);

        component = fixture.componentInstance;

        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: 'Test Server',
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              }
            ]
          }
        ];

        const userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        const clashTeamsObservable$ = cold('7000ms x|', {x: mockClashTeams});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        const mockMatChip: MatChip = ({
          selected: () => {
          },
          deselect: () => {
          },
          selectViaInteraction: () => {
          }
        } as any);
        const expectedSearchPhrase = 'Goon Squad';
        component.formControl = new FormControl(expectedSearchPhrase);
        component.formControl.setValue(expectedSearchPhrase);

        component.filterTeam(mockMatChip);

        expectObservable(userDetailsColdObservable).toBe('-x|', {x: mockUserDetails});
        expectObservable(clashTeamsObservable$).toBe('7000ms x|', {x: mockClashTeams});

        flush();
        expect(clashBotServiceMock.getClashTeams).toBeCalledWith(expectedSearchPhrase);
        expect(component.showSpinner).toBeFalsy();
        expect(component.teams).toHaveLength(1);
        expect(component.teams).toEqual([{error: "Timeout has occurred"}]);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
      })
    })

    test('Error - getUserDetails - When the filterTeam method is called with invalid User Details, it should not make a call but show a snack bar error immediately that the player needs to login again.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        const mockUserDetails: UserDetails = {id: '', username: '', discriminator: '12312asd'};

        component = fixture.componentInstance;

        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: 'Test Server',
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              }
            ]
          },

          {
            teamName: 'Team Abra',
            serverName: 'Test Server',
            playersDetails: [
              {name: mockUserDetails.username}
            ]
          }
        ];

        const userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        const clashTeamsObservable$ = cold('----x|', {x: mockClashTeams});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        const mockMatChip: MatChip = ({
          selected: () => {
          },
          deselect: () => {
          },
          selectViaInteraction: () => {
          }
        } as any);
        const expectedSearchPhrase = 'Goon Squad';
        component.formControl = new FormControl();
        if (component.formControl) {
          component.formControl.setValue(expectedSearchPhrase);
        }

        component.filterTeam(mockMatChip);

        expectObservable(userDetailsColdObservable).toBe('-x|', {x: mockUserDetails});
        expectObservable(clashTeamsObservable$).toBe('----x|', {x: mockClashTeams});

        flush();
        expect(component.showSpinner).toBeFalsy();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
        expect(component.teams).toEqual([{error: "No data"}]);
      })
    })
  })

  function setupGuildObservable<T>(cold: <T = string>(marbles: string, values?: { [p: string]: T }, error?: any) => ColdObservable<T>) {
    let mockObservableGuilds = [{
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
      "icon": null,
      "owner": true,
      "permissions": 2147483647,
      "features": [],
      "permissions_new": "274877906943"
    }];
    const guildObservable$ = cold('x|', {x: mockObservableGuilds});
    // discordServiceMock.getGuilds.mockReturnValue(guildObservable$);
    return {mockObservableGuilds, guildObservable$};
  }

  describe('Register for Team', () => {
    test('When I call register for Team, it should subscribe to retrieve the latest User Details and then invoke a call to Clash Bot service to register a user to the team.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const expectedServer = 'Test Server';
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};

        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: expectedServer,
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              }
            ]
          }
        ];
        let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
        expectedMockClashTeamResponse[0].playersDetails.push({name: mockUserDetails.username});
        let mockRetrieveUserResponse = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));

        component = fixture.componentInstance;
        expect(component.showSpinner).toBeFalsy();

        component.teams = JSON.parse(JSON.stringify(mockClashTeams));

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let registerUserForTeamColdObservable = cold('-x|', {x: mockRetrieveUserResponse});
        let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        component.registerForTeam(mockRetrieveUserResponse);

        flush();

        expect(component.teams).toEqual(expectedMockClashTeamResponse);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledWith(expectedServer);
      });
    })

    test('When I call register for Team, it should subscribe to retrieve the latest User Details and if the Users Details are empty then it should show a snackbar error.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;

        component = fixture.componentInstance;

        const mockUserDetails: UserDetails = {id: '', username: '', discriminator: '12312asd'};
        const mockRetrieveUserResponse: ClashTeam = {teamName: 'Team Awesome'};

        component.teams = [{teamName: 'Team Awesome', playersDetails: []}]

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let registerUserForTeamColdObservable = cold('-x|', {x: mockRetrieveUserResponse})

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);

        component.registerForTeam(mockRetrieveUserResponse);

        flush();

        expect(component.teams).toEqual([{
          teamName: 'Team Awesome',
          playersDetails: []
        }]);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
      });
    })

    test('When I call register for Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an error.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        component = fixture.componentInstance;

        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        const mockRetrieveUserResponse: ClashTeam = {teamName: 'Team Awesome'};
        component.teams = [{teamName: 'Team Awesome', playersDetails: []}];
        const expectedError =
          new HttpErrorResponse({
            error: 'Failed to make call.',
            headers: undefined,
            status: 400,
            statusText: 'Bad Request',
            url: 'https://localhost.com/api'
          });
        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let registerUserForTeamColdObservable = cold('-#', undefined, expectedError);

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);

        component.registerForTeam(mockRetrieveUserResponse);

        flush();

        expect(component.teams).toEqual([{
          teamName: 'Team Awesome',
          playersDetails: []
        }]);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Failed to register you to the Team, missing required details.', 'X', {duration: 5000});
      });
    })

    test('When I call register for Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an timeout.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;

        component = fixture.componentInstance;

        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        const mockRetrieveUserResponse: ClashTeam = {teamName: 'Team Awesome'};

        component.teams = [{teamName: 'Team Awesome', playersDetails: []}];

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let registerUserForTeamColdObservable = cold('7000ms -x|', {x: mockUserDetails});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);

        component.registerForTeam(mockRetrieveUserResponse);

        flush();

        expect(component.teams).toEqual([{teamName: 'Team Awesome', playersDetails: []}]);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your registration timed out, please try again!', 'X', {duration: 5000});
      });
    })

  })

  describe('Unregister from Team', () => {
    test('When I call unregister from Team, it should subscribe to retrieve the latest User Details and then invoke a call to Clash Bot service to unregister a user from team.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const expectedServer = 'Test Server';
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};

        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: expectedServer,
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              },
              {
                name: mockUserDetails.username
              }
            ]
          }
        ];
        let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
        let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
        expectedMockClashTeamResponse[0].playersDetails.pop();
        let mockUnregisterFromTeamResponse = {message: 'Successfully unregistered User from Team.'};

        component = fixture.componentInstance;
        expect(component.showSpinner).toBeFalsy();
        component.teams = JSON.parse(JSON.stringify(mockClashTeams));

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let unregisterUserFromTeamColdObservable = cold('-x|', {x: mockUnregisterFromTeamResponse});
        let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        component.unregisterFromTeam(mockTeamToUnregisterFrom);

        flush();

        expect(component.teams).toEqual(expectedMockClashTeamResponse);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledWith(expectedServer);
      });
    })

    test('Error - Missing User Details - When I call unregister from Team, it should subscribe to retrieve the latest User Details and if the Users Details are empty then it should show a snackbar error.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;

        const expectedServer = 'Test Server';
        const mockUserDetails: UserDetails = {id: '', username: '', discriminator: '12312asd'};

        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: expectedServer,
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              },
              {
                name: mockUserDetails.username
              }
            ]
          }
        ];

        let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
        let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
        let mockUnregisterFromTeamResponse = {message: 'Successfully unregistered User from Team.'};

        component = fixture.componentInstance;

        expect(component.showSpinner).toBeFalsy();

        component.teams = JSON.parse(JSON.stringify(mockClashTeams));

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let unregisterUserFromTeamColdObservable = cold('-x|', {x: mockUnregisterFromTeamResponse});
        let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        component.unregisterFromTeam(mockTeamToUnregisterFrom);

        flush();

        expect(component.teams).toEqual([{error: 'No data'}]);
        expect(userDetailsMock.getUserDetails).toHaveBeenCalled();
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
      })
    })

    test('Error - Unregister Failed - When I call unregister from Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an error.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const expectedServer = 'Test Server';
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: expectedServer,
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              },
              {
                name: mockUserDetails.username
              }
            ]
          }
        ];
        let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
        let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
        expectedMockClashTeamResponse[0].playersDetails.pop();

        component = fixture.componentInstance;

        expect(component.showSpinner).toBeFalsy();

        component.teams = JSON.parse(JSON.stringify(mockClashTeams));

        const expectedError =
          new HttpErrorResponse({
            error: 'Failed to make call.',
            headers: undefined,
            status: 400,
            statusText: 'Bad Request',
            url: 'https://localhost.com/api/teams/unregister'
          });
        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let unregisterUserFromTeamColdObservable = cold('-#', undefined, expectedError);
        let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        component.unregisterFromTeam(mockTeamToUnregisterFrom);

        flush();

        expect(component.teams).toEqual(expectedMockClashTeamResponse);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledWith(expectedServer);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Failed to unregister you from the Team.', 'X', {duration: 5000});
      });
    })

    test('Error - Timeout for Unregister - When I call unregister from Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an timeout.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const expectedServer = 'Test Server';
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: expectedServer,
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              },
              {
                name: mockUserDetails.username
              }
            ]
          }
        ];
        let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
        let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
        expectedMockClashTeamResponse[0].playersDetails.pop();
        let mockUnregisterFromTeamResponse = {message: 'Successfully unregistered User from Team.'};

        component = fixture.componentInstance;
        expect(component.showSpinner).toBeFalsy();
        component.teams = JSON.parse(JSON.stringify(mockClashTeams));

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let unregisterUserFromTeamColdObservable = cold('7000ms x|', {x: mockUnregisterFromTeamResponse});
        let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        component.unregisterFromTeam(mockTeamToUnregisterFrom);

        flush();

        expect(component.teams).toEqual(expectedMockClashTeamResponse);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledWith(expectedServer);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your request timed out, please try again!', 'X', {duration: 5000});
      });
    })

    test('Error - Retrieving updated Teams - When I call unregister from Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an error.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const expectedServer = 'Test Server';
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: expectedServer,
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              },
              {
                name: mockUserDetails.username
              }
            ]
          }
        ];
        let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
        let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
        expectedMockClashTeamResponse[0].playersDetails.pop();
        let mockUnregisterFromTeamResponse = {message: 'Successfully unregistered User from Team.'};

        const expectedError =
          new HttpErrorResponse({
            error: 'Failed to make call.',
            headers: undefined,
            status: 400,
            statusText: 'Bad Request',
            url: 'https://localhost.com/api/teams'
          });
        component = fixture.componentInstance;

        expect(component.showSpinner).toBeFalsy();

        component.teams = JSON.parse(JSON.stringify(mockClashTeams));

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let unregisterUserFromTeamColdObservable = cold('-x|', {x: mockUnregisterFromTeamResponse});
        let clashTeamsObservable$ = cold('#', undefined, expectedError);

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        component.unregisterFromTeam(mockTeamToUnregisterFrom);

        flush();

        expect(component.teams).toEqual([{error: 'Http failure response for https://localhost.com/api/teams: 400 Bad Request'}]);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledWith(expectedServer);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
      });
    })

    test('Error - Timeout for update Teams - When I call unregister from Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an timeout.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        const expectedServer = 'Test Server';
        const mockUserDetails: UserDetails = {id: '12321', username: 'Test User', discriminator: '12312asd'};
        let mockClashTeams: ClashTeam[] = [
          {
            teamName: 'Team Abra',
            serverName: expectedServer,
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              },
              {
                name: mockUserDetails.username
              }
            ]
          }
        ];
        let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
        let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
        expectedMockClashTeamResponse[0].playersDetails.pop();
        let mockUnregisterFromTeamResponse = {message: 'Successfully unregistered User from Team.'};

        component = fixture.componentInstance;

        expect(component.showSpinner).toBeFalsy();

        component.teams = JSON.parse(JSON.stringify(mockClashTeams));

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let unregisterUserFromTeamColdObservable = cold('-x|', {x: mockUnregisterFromTeamResponse});
        let clashTeamsObservable$ = cold('7000ms x|', {x: expectedMockClashTeamResponse});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

        component.unregisterFromTeam(mockTeamToUnregisterFrom);

        flush();

        expect(component.teams).toEqual([{error: 'Timeout has occurred'}]);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledWith(expectedServer);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
      });
    })
  })

  describe('Error Handlers', () => {
    test('If getClashTeams service returns and error then a Mat Snack Bar should be opened and an error should be returned.', () => {
      component = fixture.componentInstance;
      const expectedError =
        new HttpErrorResponse({
          error: 'Failed to make call.',
          headers: undefined,
          status: 400,
          statusText: 'Bad Request',
          url: 'https://clash-bot.ninja/api/teams'
        });
      testScheduler.run((helpers) => {
        const { expectObservable } = helpers;
        expectObservable(component.handleClashTeamsError(snackBarMock, expectedError)).toBe('#', undefined, expectedError);
        expect(snackBarMock.open).toHaveBeenCalledTimes(1);
        expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
      })
    })
  })

  describe('Create New Team', () => {
    test('When createNewTeam is called with a MatOption, then a call to the create new team Clash Bot Service endpoint should be made with the details necessary to create a new team.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;

        let mockUserDetails: UserDetails = {id: '12321312', username: 'Test User', discriminator: '12312asdawe'};
        const expectedServerName = 'Integration Server';
        let mockMatOption: MatOption = ({select: jest.fn(), deselect: jest.fn()} as any);
        let mockEligibleTournaments = [{
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
          registrationTime: new Date().toISOString(),
          startTime: new Date().toISOString()
        }];
        let mockReturnedUpdatedTeamsList: ClashTeam[] = [
          {
            teamName: 'Team Testing',
            serverName: expectedServerName,
            tournamentDetails: {tournamentName: '', tournamentDay: ''},
            startTime: '',
            playersDetails: [{name: mockUserDetails.username}]
          }
        ];
        let mockCreateNewTeamReturn: ClashTeam = {
          teamName: 'Team Testing',
          serverName: expectedServerName,
          tournamentDetails: {tournamentName: '', tournamentDay: ''},
          startTime: '',
          playersDetails: [{name: mockUserDetails.username}]
        };

        component = fixture.componentInstance;
        component.formControl = ({value: ` ${expectedServerName} `} as any);
        component.createNewTeamFormControl = ({value: `${mockEligibleTournaments[0].tournamentName} ${mockEligibleTournaments[0].tournamentDay}`} as any);
        component.eligibleTournaments = JSON.parse(JSON.stringify(mockEligibleTournaments));

        let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
        let getTeamsColdObservable = cold('-x|', {x: mockReturnedUpdatedTeamsList});
        let createTeamColdObservable = cold('-x|', {x: mockCreateNewTeamReturn});

        userDetailsMock.getUserDetails.mockReturnValue(userDetailsColdObservable);
        clashBotServiceMock.getClashTeams.mockReturnValue(getTeamsColdObservable);
        clashBotServiceMock.createNewTeam.mockReturnValue(getTeamsColdObservable);

        expectObservable(userDetailsColdObservable).toBe('-x|', {x: mockUserDetails});
        expectObservable(getTeamsColdObservable).toBe('-x|', {x: mockReturnedUpdatedTeamsList});
        expectObservable(createTeamColdObservable).toBe('-x|', {x: mockCreateNewTeamReturn});

        component.createNewTeam(mockMatOption);

        flush();

        expect(mockMatOption.select).toBeCalledTimes(1);
        expect(mockMatOption.deselect).toBeCalledTimes(1);
        if (component.formControl) {
          expect(clashBotServiceMock.createNewTeam).toBeCalledWith(mockUserDetails, {
            serverName: component.formControl.value.trimLeft().trimRight(),
            tournamentDetails: {
              tournamentName: mockEligibleTournaments[0].tournamentName,
              tournamentDay: mockEligibleTournaments[0].tournamentDay
            },
            startTime: mockEligibleTournaments[0].startTime
          });
        } else {
          expect(component.formControl).toBeTruthy();
        }
        expect(userDetailsMock.getUserDetails).toHaveBeenCalledTimes(1);
        expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledTimes(1);
      })
    })
  })

  describe('Tournament to Clash Team Map', () => {
    test('As a user, I should know all Tournaments I am scheduled with and which one Teams I am assigned to.', () => {
      const expectedTournamentName = 'awesome_sauce';
      const expectedTournamentDay = '1';
      const expectedUser = 'Test User';
      let mockClashTournaments: ClashTournaments[] = [
        {
          tournamentName: expectedTournamentName,
          tournamentDay: expectedTournamentDay,
          startTime: new Date().toISOString(),
          registrationTime: new Date().toISOString()
        }
      ];
      let mockClashTeams: ClashTeam[] = [
        {
          teamName: 'Team Abra',
          serverName: 'Special Server',
          tournamentDetails: {
            tournamentName: 'dne',
            tournamentDay: expectedTournamentDay
          },
          playersDetails: []
        },
        {
          teamName: 'Team Abra',
          serverName: 'Special Server',
          tournamentDetails: {
            tournamentName: expectedTournamentName,
            tournamentDay: expectedTournamentDay
          },
          playersDetails: [{name: expectedUser}]
        }
      ];
      const expectedTournamentToTeamUserMap = new Map<ClashTournaments, ClashTeam>();
      expectedTournamentToTeamUserMap.set(mockClashTournaments[0], mockClashTeams[1]);
      component = fixture.componentInstance;
      expect(component.createUserToTournamentMap(expectedUser, mockClashTournaments, mockClashTeams)).toEqual(expectedTournamentToTeamUserMap);
    })
  })

  describe('Sync Team Details', () => {
    test('When a Team list and a list of Tournaments are passed to syncTeamDetails, it should populate the eligible Tournaments list and add the detail if the Player is on the Team', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        component = fixture.componentInstance;
        let mockTournaments: ClashTournaments[] = [
          {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
          },
          {
            tournamentName: 'awesome_sauce',
            tournamentDay: '2',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
          },
        ]
        let mockUserDetails: UserDetails = {id: '123321', username: 'Hi', discriminator: '123123jsaf'};
        let mockTeamData: ClashTeam[] = [
          {
            teamName: 'Test Team 1',
            serverName: 'Integration Server',
            tournamentDetails: {
              tournamentName: mockTournaments[0].tournamentName,
              tournamentDay: mockTournaments[0].tournamentDay
            },
            playersDetails: [{name: mockUserDetails.username}],
            startTime: new Date().toISOString()
          },
          {
            teamName: 'Test Team 1',
            serverName: 'Integration Server',
            tournamentDetails: {
              tournamentName: mockTournaments[1].tournamentName,
              tournamentDay: mockTournaments[1].tournamentDay
            },
            playersDetails: [{name: mockUserDetails.username}, {name: 'Test User 2'}],
            startTime: new Date().toISOString()
          }
        ];
        let mockApplicationDetails: ApplicationDetails = {currentTournaments: mockTournaments}
        let mockApplicationDetailsObservable = cold('-x|', {x: mockApplicationDetails});

        let expectedTeamData = mockTeamData.map(record => {
          if (record.playersDetails) {
            let boolean = false;
            if (record.playersDetails.find(player => player.name === mockUserDetails.username)) {
              boolean = true;
            }
            record.userOnTeam = boolean;
          }
          return record;
        });

        applicationDetailsMock.getApplicationDetails.mockReturnValue(mockApplicationDetailsObservable);

        expectObservable(mockApplicationDetailsObservable).toBe('-x|', {x: mockApplicationDetails});
        component.syncTeamInformation(mockTeamData, {id: '123321', username: 'Hi', discriminator: '123123jsaf'});

        flush();
        expect(component.teams).toEqual(expectedTeamData);
        expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
        expect(component.eligibleTournaments).toEqual([mockTournaments[1]]);
      });
    })

    test('When a Team list and an empty list of Tournaments are passed to syncTeamDetails, it should have an empty eligible tournaments list.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        component = fixture.componentInstance;
        let mockTournaments: ClashTournaments[] = [];
        let mockUserDetails: UserDetails = {id: '123321', username: 'Hi', discriminator: '123123jsaf'};
        let mockTeamData: ClashTeam[] = [
          {
            teamName: 'Test Team 1',
            serverName: 'Integration Server',
            tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '1'},
            playersDetails: [{name: mockUserDetails.username}],
            startTime: new Date().toISOString()
          },
          {
            teamName: 'Test Team 1',
            serverName: 'Integration Server',
            tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'},
            playersDetails: [{name: mockUserDetails.username}, {name: 'Test User 2'}],
            startTime: new Date().toISOString()
          }
        ];
        let mockApplicationDetails: ApplicationDetails = {currentTournaments: mockTournaments}
        let mockApplicationDetailsObservable = cold('-x|', {x: mockApplicationDetails});

        let expectedTeamData = mockTeamData.map(record => {
          if (record.playersDetails) {
            let boolean = false;
            if (record.playersDetails.find(player => player.name === mockUserDetails.username)) {
              boolean = true;
            }
            record.userOnTeam = boolean;
          }
          return record;
        });

        applicationDetailsMock.getApplicationDetails.mockReturnValue(mockApplicationDetailsObservable);

        expectObservable(mockApplicationDetailsObservable).toBe('-x|', {x: mockApplicationDetails});
        component.syncTeamInformation(mockTeamData, {id: '123321', username: 'Hi', discriminator: '123123jsaf'});

        flush();
        expect(component.teams).toEqual(expectedTeamData);
        expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
        expect(component.eligibleTournaments).toEqual([]);
      });
    })

    test('When an empty Team list is passed, it should populate the teams list with an error of No data', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        component = fixture.componentInstance;
        let mockTournaments: ClashTournaments[] = [
          {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
          },
          {
            tournamentName: 'awesome_sauce',
            tournamentDay: '2',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
          },
        ]

        let mockApplicationDetails: ApplicationDetails = {currentTournaments: mockTournaments}
        let mockApplicationDetailsObservable = cold('-x|', {x: mockApplicationDetails});

        applicationDetailsMock.getApplicationDetails.mockReturnValue(mockApplicationDetailsObservable);

        expectObservable(mockApplicationDetailsObservable).toBe('-x|', {x: mockApplicationDetails});

        component.syncTeamInformation([], {id: '123321', username: 'Hi', discriminator: '123123jsaf'});

        flush();
        expect(component.teams).toEqual([{error: 'No data'}]);
        expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
        expect(component.eligibleTournaments).toEqual(mockTournaments);
      });
    })
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

function createMockClashTeams(mockClashTournaments: ClashTournaments[], mockUserDetails: UserDetails) {
  return [
    {
      teamName: 'Team Abra',
      serverName: 'Test Server',
      tournamentDetails: {
        tournamentName: mockClashTournaments[0].tournamentName,
        tournamentDay: '2'
      },
      playersDetails: [
        {
          name: 'Roïdräge',
          champions: ['Volibear', 'Ornn', 'Sett'],
          role: 'Top'
        },
        {
          name: 'TheIncentive',
          champions: ['Lucian'],
          role: 'ADC'
        },
        {
          name: 'Pepe Conrad',
          champions: ['Lucian'],
          role: 'Jg'
        }
      ]
    },
    {
      teamName: 'Team Abra',
      serverName: 'Test Server',
      tournamentDetails: {
        tournamentName: mockClashTournaments[0].tournamentName,
        tournamentDay: mockClashTournaments[0].tournamentDay
      },
      playersDetails: [
        {name: mockUserDetails.username}
      ]
    }
  ];
}

function createMockClashTournaments(expectedTournamentName: string, expectedTournamentDay: string) {
  return [
    {
      tournamentName: expectedTournamentName,
      tournamentDay: expectedTournamentDay,
      startTime: new Date().toISOString(),
      registrationTime: new Date().toISOString()
    },
    {
      tournamentName: expectedTournamentName,
      tournamentDay: '2',
      startTime: new Date().toISOString(),
      registrationTime: new Date().toISOString()
    }
  ];
}

function mapClashTeams(mockClashTeams: ClashTeam[], mockUserDetails: UserDetails) {
  return mockClashTeams.map(record => {
    return {
      teamName: record.teamName,
      serverName: record.serverName,
      playersDetails: record.playersDetails,
      id: `${record.serverName}-${record.teamName}`.replace(new RegExp(/ /, 'g'), '-').toLowerCase(),
      tournamentDetails: record.tournamentDetails,
      userOnTeam: !Array.isArray(record.playersDetails) || record.playersDetails.find(value => value.name === mockUserDetails.username) !== undefined
    }
  })
}
