import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TeamsDashboardComponent} from './teams-dashboard.component';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatChip, MatChipsModule} from "@angular/material/chips";
import {TeamCardComponent} from "../team-card/team-card.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {ReactiveFormsModule} from "@angular/forms";
import {MatCardModule} from "@angular/material/card";
import {ClashBotService} from "../clash-bot.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";
import {DiscordService} from "../discord.service";
import {TestScheduler} from "rxjs/testing";
import {FilterType} from "../filter-type";
import {HttpErrorResponse} from "@angular/common/http";
import {ClashTeam} from "../clash-team";
import {TeamFilter} from "../team-filter";

jest.mock("../clash-bot.service");

describe('TeamsDashboardComponent', () => {
  let component: TeamsDashboardComponent;
  let fixture: ComponentFixture<TeamsDashboardComponent>;
  let clashBotServiceMock: ClashBotService;
  let discordServiceMock: DiscordService;
  let getUserDetailsMock: any;
  let getGuildsMock: any;
  let snackBarMock: MatSnackBar;
  let snackBarOpenMock: any;
  let getClashTeamsMock: any;

  let testScheduler: TestScheduler;

  beforeEach(async () => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    jest.resetAllMocks();
    await TestBed.configureTestingModule({
      declarations: [TeamsDashboardComponent, TeamCardComponent],
      imports: [MatProgressSpinnerModule, MatChipsModule, MatFormFieldModule, ReactiveFormsModule, MatCardModule, HttpClientTestingModule, MatSnackBarModule],
      providers: [ClashBotService, DiscordService],
    })
      .compileComponents();
    getUserDetailsMock = jest.fn();
    getGuildsMock = jest.fn();
    snackBarOpenMock = jest.fn();
    getClashTeamsMock = jest.fn();
    clashBotServiceMock = TestBed.inject(ClashBotService);
    discordServiceMock = TestBed.inject(DiscordService);
    snackBarMock = TestBed.inject(MatSnackBar);
    discordServiceMock.getUserDetails = getUserDetailsMock;
    discordServiceMock.getGuilds = getGuildsMock;
    snackBarMock.open = snackBarOpenMock;
    clashBotServiceMock.getClashTeams = getClashTeamsMock;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamsDashboardComponent);
  });

  test('Whenever the component is created, a call to the discordService should be made which will then turn the progress spinner off.', () => {
    testScheduler.run((helpers) => {
      const {cold, expectObservable, flush} = helpers;
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
      const expectedTeamsFilter = mockObservableGuilds.map((record) => {
        let id = record.name.replace(new RegExp(/ /, 'g'), '-').toLowerCase();
        return {
          value: record.name,
          type: FilterType.SERVER,
          state: false,
          id: id
        }
      });
      const guildObservable$ = cold('----x|', {x: mockObservableGuilds});
      getGuildsMock.mockReturnValue(guildObservable$);
      component = fixture.componentInstance;
      expect(component.showSpinner).toBeFalsy();
      fixture.detectChanges();
      expectObservable(guildObservable$).toBe('----x|', {x: mockObservableGuilds});
      flush();
      expect(component.showSpinner).toBeFalsy();
      expect(component.teamFilters).toEqual(expectedTeamsFilter);
      expect(component.color).toEqual('primary');
      expect(component.mode).toEqual('indeterminate');
    })
  })

  test('Whenever the component is created, a call to the discordService and the call times out after 7 seconds then a generic error message should be displayed.', () => {
    testScheduler.run((helpers) => {
      const {cold, expectObservable, flush} = helpers;
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
      const guildObservable$ = cold('7000ms x|', {x: mockObservableGuilds});
      getGuildsMock.mockReturnValue(guildObservable$);
      component = fixture.componentInstance;
      expect(component.showSpinner).toBeFalsy();
      fixture.detectChanges();
      expectObservable(guildObservable$).toBe('7000ms x|', {x: mockObservableGuilds});
      flush();
      expect(component.showSpinner).toBeFalsy();
      expect(component.teamFilters).toHaveLength(0);
      expect(snackBarOpenMock).toHaveBeenCalledTimes(1);
      expect(snackBarOpenMock).toHaveBeenCalledWith('Failed to retrieve Servers. Please try again later.', 'X', {duration: 5000});
      expect(component.color).toEqual('primary');
      expect(component.mode).toEqual('indeterminate');
    })
  })

  test('Whenever the component is created, a call to the discordService should be made and if it times out a SnackBar module should be created with a generic message.', () => {
    testScheduler.run((helpers) => {
      const {cold, expectObservable, flush} = helpers;
      const expectedError = new Error('Failed to make call.');
      const guildObservable$ = cold('----#', undefined, expectedError);
      getGuildsMock.mockReturnValue(guildObservable$);
      component = fixture.componentInstance;
      expect(component.showSpinner).toBeFalsy();
      fixture.detectChanges();
      expectObservable(guildObservable$).toBe('----#', undefined, expectedError);
      flush();
      expect(component.showSpinner).toBeFalsy();
      expect(component.teamFilters).toHaveLength(0);
      expect(snackBarOpenMock).toHaveBeenCalledTimes(1);
      expect(snackBarOpenMock).toHaveBeenCalledWith('Failed to retrieve Servers. Please try again later.', 'X', {duration: 5000});
      expect(component.color).toEqual('primary');
      expect(component.mode).toEqual('indeterminate');
    })
  })


  test('Whenever the component is created, a call to the discordService should be made and if the call fails with a unauthorized then a SnackBar module should be created.', () => {
    testScheduler.run((helpers) => {
      const {cold, expectObservable, flush} = helpers;
      const expectedError =
        new HttpErrorResponse({
          error: 'Failed to make call.',
          headers: undefined,
          status: 401,
          statusText: 'Not allowed to make call',
          url: 'https://discord.com/api'
        });
      const guildObservable$ = cold('----#', undefined, expectedError);
      getGuildsMock.mockReturnValue(guildObservable$);
      component = fixture.componentInstance;
      expect(component.showSpinner).toBeFalsy();
      fixture.detectChanges();
      expectObservable(guildObservable$).toBe('----#', undefined, expectedError);
      flush();
      expect(component.showSpinner).toBeFalsy();
      expect(component.teamFilters).toHaveLength(0);
      expect(snackBarOpenMock).toHaveBeenCalledTimes(1);
      expect(snackBarOpenMock).toHaveBeenCalledWith('Invalid Discord Token. Please login to Discord again.', 'X', {duration: 5000});
      expect(component.color).toEqual('primary');
      expect(component.mode).toEqual('indeterminate');
    })
  })

  test('When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and filter it based on the argument passed.', () => {
    testScheduler.run((helpers) => {
      const {cold, expectObservable, flush} = helpers;
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
      const guildObservable$ = cold('-x|', {x: mockObservableGuilds});
      getGuildsMock.mockReturnValue(guildObservable$);
      component = fixture.componentInstance;
      fixture.detectChanges();
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
      let expectedClashTeam: ClashTeam[] = mockClashTeams.map(record => {
        return {
          teamName: record.teamName,
          serverName: record.serverName,
          playersDetails: record.playersDetails,
          id: `${record.serverName}-${record.teamName}`.replace(new RegExp(/ /, 'g'), '-').toLowerCase(),
        }
      })
      const clashTeamsObservable$ = cold('----x|', {x: mockClashTeams});
      getClashTeamsMock.mockReturnValue(clashTeamsObservable$);
      const mockMatChip: MatChip = ({
        selected: () => {},
        deselect: () => {},
        selectViaInteraction: () => {}
      } as any);
      const expectedSearchPhrase = 'Goon Squad';
      component.formControl.setValue(expectedSearchPhrase);
      fixture.detectChanges();
      component.filterTeam(mockMatChip);
      expectObservable(clashTeamsObservable$).toBe('----x|', {x: mockClashTeams});
      flush();
      expect(getClashTeamsMock).toBeCalledWith(expectedSearchPhrase);
      expect(component.showSpinner).toBeFalsy();
      expect(component.teams).toEqual(expectedClashTeam);
    })
  })

  test('When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and no Teams are retrieve then a error with no data should be sent.', () => {
    testScheduler.run((helpers) => {
      const {cold, expectObservable, flush} = helpers;
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
      const guildObservable$ = cold('-x|', {x: mockObservableGuilds});
      getGuildsMock.mockReturnValue(guildObservable$);
      component = fixture.componentInstance;
      fixture.detectChanges();
      let mockClashTeams: ClashTeam[] = [];
      const clashTeamsObservable$ = cold('----x|', {x: mockClashTeams});
      getClashTeamsMock.mockReturnValue(clashTeamsObservable$);
      const mockMatChip: MatChip = ({
        selected: () => {},
        deselect: () => {},
        selectViaInteraction: () => {}
      } as any);
      const expectedSearchPhrase = 'Goon Squad';
      component.formControl.setValue(expectedSearchPhrase);
      fixture.detectChanges();
      component.filterTeam(mockMatChip);
      expectObservable(clashTeamsObservable$).toBe('----x|', {x: mockClashTeams});
      flush();
      expect(getClashTeamsMock).toBeCalledWith(expectedSearchPhrase);
      expect(component.showSpinner).toBeFalsy();
      expect(component.teams).toEqual([{error: "No data"}]);
    })
  })

  test('When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and if an generic error occurs the Snack Bar should be called with a generic message..', () => {
    testScheduler.run((helpers) => {
      const {cold, expectObservable, flush} = helpers;
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
      const guildObservable$ = cold('-x|', {x: mockObservableGuilds});
      getGuildsMock.mockReturnValue(guildObservable$);
      component = fixture.componentInstance;
      fixture.detectChanges();
      let error = new Error('Failed to make call.');
      const clashTeamsObservable$ = cold('-#', undefined, error);
      getClashTeamsMock.mockReturnValue(clashTeamsObservable$);
      const mockMatChip: MatChip = ({
        selected: () => {},
        deselect: () => {},
        selectViaInteraction: () => {}
      } as any);
      const expectedSearchPhrase = 'Goon Squad';
      component.formControl.setValue(expectedSearchPhrase);
      fixture.detectChanges();
      component.filterTeam(mockMatChip);
      expectObservable(clashTeamsObservable$).toBe('-#', undefined, error);
      flush();
      expect(getClashTeamsMock).toBeCalledWith(expectedSearchPhrase);
      expect(component.showSpinner).toBeFalsy();
      expect(component.teams).toHaveLength(1);
      expect(component.teams).toEqual([{error: "Failed to make call."}]);
      expect(snackBarOpenMock).toHaveBeenCalledTimes(1);
      expect(snackBarOpenMock).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
    })
  })

  test('When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and if the call times out after 7 seconds the Snack Bar should be called with a generic message..', () => {
    testScheduler.run((helpers) => {
      const {cold, expectObservable, flush} = helpers;
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
      const guildObservable$ = cold('-x|', {x: mockObservableGuilds});
      getGuildsMock.mockReturnValue(guildObservable$);
      component = fixture.componentInstance;
      fixture.detectChanges();
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
      const clashTeamsObservable$ = cold('7000ms x|', {x: mockClashTeams});
      getClashTeamsMock.mockReturnValue(clashTeamsObservable$);
      const mockMatChip: MatChip = ({
        selected: () => {},
        deselect: () => {},
        selectViaInteraction: () => {}
      } as any);
      const expectedSearchPhrase = 'Goon Squad';
      component.formControl.setValue(expectedSearchPhrase);
      fixture.detectChanges();
      component.filterTeam(mockMatChip);
      expectObservable(clashTeamsObservable$).toBe('7000ms x|', {x: mockClashTeams});
      flush();
      expect(getClashTeamsMock).toBeCalledWith(expectedSearchPhrase);
      expect(component.showSpinner).toBeFalsy();
      expect(component.teams).toHaveLength(1);
      expect(component.teams).toEqual([{error: "Timeout has occurred"}]);
      expect(snackBarOpenMock).toHaveBeenCalledTimes(1);
      expect(snackBarOpenMock).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
    })
  })

  test('When changedSelected is called with a valid TeamFilter then it should set the state to false.', () => {
    let teamFilter: TeamFilter = {
      value: 'Filterah',
      type: FilterType.SERVER,
      state: true,
      id: 'filterah'
    }
    component = fixture.componentInstance;
    component.changeSelected(teamFilter);
    expect(teamFilter.state).toBeFalsy();
  })
});
