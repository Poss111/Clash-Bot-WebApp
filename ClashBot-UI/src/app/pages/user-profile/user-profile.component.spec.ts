import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UserProfileComponent} from './user-profile.component';
import {UserProfileModule} from "./user-profile.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {RiotDdragonService} from "../../services/riot-ddragon.service";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {UserDetails} from "../../interfaces/user-details";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {TestScheduler} from "rxjs/testing";
import {ChampionData} from "../../interfaces/championData";
import {HttpErrorResponse} from "@angular/common/http";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {ApplicationDetails} from "../../interfaces/application-details";
import * as mocks from '../../shared/shared-test-mocks.spec';
import {Subscription, UserService} from 'clash-bot-service-api';
import {Player} from "clash-bot-service-api/model/player";
import {CreateUserRequest} from "clash-bot-service-api/model/createUserRequest";
import Mock = jest.Mock;

jest.mock('../../services/riot-ddragon.service');
jest.mock('../../services/application-details.service');
jest.mock('clash-bot-service-api');

function expectDefaultState(component: UserProfileComponent, mockGuilds: DiscordGuild[]) {
  expect(component.userDetails).toBeFalsy();
  expect(component.userDetailsForm).toBeFalsy();
  expect(component.preferredChampions).toEqual(new Set());
  expect(component.initialFormControlState).toEqual({});
  expect(component.defaultGuild).toEqual('');
  expect(component.guilds).toEqual(mockGuilds);
  expect(component.listOfChampions.length).toBeLessThan(1);
  expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
}

function createMockErrorResponse() {
  return new HttpErrorResponse({
    error: 'Failed to make call.',
    headers: undefined,
    status: 401,
    statusText: 'Not allowed to make call',
    url: 'https://localhost:80/api/user'
  });
}

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let testScheduler: TestScheduler;
  let userServiceMock: UserService;
  let riotDDragonServiceMock: RiotDdragonService;
  let applicationDetailsMock: any;
  let matSnackBarMock: MatSnackBar;
  let openMatSnackBarMock: any;

  beforeEach(async () => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    jest.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [
        UserProfileModule,
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule],
      providers: [RiotDdragonService, ApplicationDetailsService, UserService]
    })
      .compileComponents();
    userServiceMock = TestBed.inject(UserService);
    riotDDragonServiceMock = TestBed.inject(RiotDdragonService);
    matSnackBarMock = TestBed.inject(MatSnackBar);
    applicationDetailsMock = TestBed.inject(ApplicationDetailsService);
    openMatSnackBarMock = jest.fn();
    matSnackBarMock.open = openMatSnackBarMock;
  });

  describe('On Init', () => {
    test('Should instantiate all values for the User Profile page.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        let mockGuilds: DiscordGuild[] = mocks.createMockGuilds();
        let mockUserDetails: UserDetails = mocks.createMockUserDetails();
        let mockClashBotUserDetails: Player = mocks.createMockPlayer();
        let mockDdragonChampionList: ChampionData = mocks.getMockDdragonChampionList();
        let mockAppDetails: ApplicationDetails =
            mocks.createMockAppDetails(mockGuilds, mockClashBotUserDetails, mockUserDetails);
        mockAppDetails.loggedIn = true;

        applicationDetailsMock.getApplicationDetails.mockReturnValue(cold('x|', {x: mockAppDetails}));
        (userServiceMock.getUser as Mock).mockReturnValue(cold('x|', {x: mockClashBotUserDetails}));
        (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(cold('x|', {x: mockDdragonChampionList}));

        createComponent();
        fixture.detectChanges();
        flush();

        expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
        expect(userServiceMock.getUser).toBeCalledTimes(1);
        expect(userServiceMock.getUser).toBeCalledWith(`${mockUserDetails.id}`);
        expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);

        expect(component.userDetails).toEqual(mockUserDetails);
        expect(component.userDetailsForm).toBeTruthy();
        if (component.userDetailsForm) {
          expect(Object.keys(component.userDetailsForm.controls)).toHaveLength(3);
        } else {
          expect(true).toBeFalsy();
        }
        expect(component.preferredChampions).toEqual(new Set(mockClashBotUserDetails.champions));
        let expectedInitialFormControlState = {
          preferredChampionsFC: ['Sett'],
          subscribedDiscordDMFC: true,
          defaultGuildFC: 'Goon Squad'
        };
        expect(component.initialFormControlState).toEqual(expectedInitialFormControlState);
        expect(component.defaultGuild).toEqual('Goon Squad');
        expect(component.guilds).toEqual(mockGuilds);
        expect(component.listOfChampions)
          .toEqual(Object.keys(mockDdragonChampionList.data).filter(record =>
            !mockClashBotUserDetails.champions?.includes(record)));
        expect(component.initialAutoCompleteArray)
          .toEqual(Object.keys(mockDdragonChampionList.data).filter(record =>
            !mockClashBotUserDetails.champions?.includes(record)));
      })
    });

    describe('Retrieve Application Loaded User Information', () => {
      test('Error - If AppDetails show not logged in - Then show a Snack Bar with a generic error message for User information.', () => {
        testScheduler.run((helpers) => {
          const {cold, flush} = helpers;
          let mockGuilds: DiscordGuild[] = mocks.createMockGuilds();
          let mockClashBotUserDetails: Player = mocks.createMockPlayer();
          let mockDdragonChampionList: ChampionData = mocks.getMockDdragonChampionList();

          let mockAppDetails: ApplicationDetails =
          mocks.createMockAppDetails(mockGuilds, mockClashBotUserDetails, mocks.createMockUserDetails());
          mockAppDetails.loggedIn = false;

          applicationDetailsMock.getApplicationDetails.mockReturnValue(cold('x|', {x: mockAppDetails}));
          (userServiceMock.getUser as Mock).mockReturnValue(cold('x|', {x: mockClashBotUserDetails}));
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(cold('x|', {x: mockDdragonChampionList}));

          createComponent();
          fixture.detectChanges();
          flush();

          expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
          expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! You are not logged in. Please navigate back to the home screen and log in.', 'X', {duration: 5000});

          expect(userServiceMock.getUser).toBeCalledTimes(1);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);
          expectDefaultState(component, mockGuilds);
        });
      })
    })

    describe('Load Clash Bot User Details', () => {
      test('If the user does not exist on the Clash Bot Service, initialize forms with default values.', () => {
        testScheduler.run(helpers => {
          const {cold, flush} = helpers;
          let mockGuilds: DiscordGuild[] = mocks.createMockGuilds();
          let mockUserDetails: UserDetails = mocks.createMockUserDetails();
          let mockClashBotUserDetails: Player = ({} as any);
          let mockDdragonChampionList: ChampionData = mocks.getMockDdragonChampionList();
          let mockAppDetails: ApplicationDetails = mocks.createMockAppDetails(mockGuilds, mockClashBotUserDetails, mockUserDetails);
          mockAppDetails.loggedIn = true;

          applicationDetailsMock.getApplicationDetails.mockReturnValue(cold('x|', {x: mockAppDetails}));
          (userServiceMock.getUser as Mock).mockReturnValue(cold('x|', {x: mockClashBotUserDetails}));
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(cold('x|', {x: mockDdragonChampionList}));

          createComponent();
          fixture.detectChanges();
          flush();

          expect(userServiceMock.getUser).toBeCalledTimes(1);
          expect(userServiceMock.getUser).toBeCalledWith(`${mockUserDetails.id}`);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);

          expect(component.userDetails).toEqual(mockUserDetails);
          expect(component.userDetailsForm).toBeTruthy();
          if (component.userDetailsForm) {
            expect(Object.keys(component.userDetailsForm.controls)).toHaveLength(3);
          } else {
            expect(true).toBeFalsy();
          }
          expect(component.preferredChampions).toEqual(new Set(mockClashBotUserDetails.champions));
          let expectedInitialFormControlState = {
            preferredChampionsFC: [],
            subscribedDiscordDMFC: false,
            defaultGuildFC: mockGuilds[0].name
          };
          expect(component.initialFormControlState).toEqual(expectedInitialFormControlState);
          expect(component.defaultGuild).toEqual(mockGuilds[0].name);
          expect(component.listOfChampions)
            .toEqual(Object.keys(mockDdragonChampionList.data));
          expect(component.initialAutoCompleteArray)
            .toEqual(Object.keys(mockDdragonChampionList.data));
        })
      })

      test('Error - Failed to retrieve Clash Bot User Information - If the call to the clash bot to retrieve persisted User Information fails then a Snack Bar should be called with a generic error message.', () => {
        testScheduler.run(helpers => {
          const {cold, flush} = helpers;

          let mockGuilds: DiscordGuild[] = mocks.createMockGuilds();
          let mockUserDetails: UserDetails = mocks.createMockUserDetails();
          let mockDdragonChampionList: ChampionData = mocks.getMockDdragonChampionList();

          let mockAppDetails: ApplicationDetails = mocks.createMockAppDetails(mockGuilds, undefined, mockUserDetails);
          mockAppDetails.loggedIn = true;

          applicationDetailsMock.getApplicationDetails.mockReturnValue(cold('x|', {x: mockAppDetails}));
          (userServiceMock.getUser as Mock).mockReturnValue(cold('#|', undefined, createMockErrorResponse()));
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(cold('x|', {x: mockDdragonChampionList}));

          createComponent();
          fixture.detectChanges();
          flush();

          expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
          expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to retrieve your User Information. Please try again later.', 'X', {duration: 5000});

          expect(userServiceMock.getUser).toBeCalledTimes(1);
          expect(userServiceMock.getUser).toBeCalledWith(`${mockUserDetails.id}`);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(0);

          expect(component.userDetails).toBeFalsy();
          expect(component.userDetailsForm).toBeFalsy();
          expect(component.preferredChampions).toEqual(new Set());
          expect(component.initialFormControlState).toEqual({});
          expect(component.defaultGuild).toEqual('');
          expect(component.guilds).toEqual([]);
          expect(component.listOfChampions.length).toBeLessThan(1);
          expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
        })
      })

      test('Error - Timeout retrieving Clash Bot User Information - If the call to the clash bot to retrieve persisted User Information fails then a Snack Bar should be called with a generic error message', () => {
        testScheduler.run(helpers => {
          const {cold, flush} = helpers;

          let mockGuilds: DiscordGuild[] = mocks.createMockGuilds();
          let mockUserDetails: UserDetails = mocks.createMockUserDetails();
          let mockClashBotUserDetails: Player = mocks.createMockClashBotUserDetails();
          let mockDdragonChampionList: ChampionData = mocks.getMockDdragonChampionList();
          let mockAppDetails: ApplicationDetails = mocks.createMockAppDetails(mockGuilds, mockClashBotUserDetails, mockUserDetails);

          applicationDetailsMock.getApplicationDetails.mockReturnValue(cold('x|', {x: mockAppDetails}));
          (userServiceMock.getUser as Mock).mockReturnValue(cold('7000ms x|', {x: mockClashBotUserDetails}));
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(cold('x|', {x: mockDdragonChampionList}));

          createComponent();
          fixture.detectChanges();
          flush();

          expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
          expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to retrieve your User Information. Please try again later.', 'X', {duration: 5000});

          expect(userServiceMock.getUser).toBeCalledTimes(1);
          expect(userServiceMock.getUser).toBeCalledWith(`${mockUserDetails.id}`);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(0);

          expect(component.userDetails).toBeFalsy();
          expect(component.userDetailsForm).toBeFalsy();
          expect(component.preferredChampions).toEqual(new Set());
          expect(component.initialFormControlState).toEqual({});
          expect(component.defaultGuild).toEqual('');
          expect(component.guilds).toEqual([]);
          expect(component.listOfChampions.length).toBeLessThan(1);
          expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
        })
      })
    })

    describe('Load LoL Champion Data', () => {
      test('Error - Champion Data fails to load from Riot - If the champion names fail to load then there should be a Snack Bar with a generic message printed out.', () => {
        testScheduler.run((helpers) => {
          const {cold, flush} = helpers;
          let mockUserDetails: UserDetails = mocks.createMockUserDetails();
          let mockClashBotUserDetails: Player = mocks.createMockPlayer();

          applicationDetailsMock.getApplicationDetails.mockReturnValue(cold('x|', {x: mocks.createMockAppDetails(mocks.createMockGuilds(), mockClashBotUserDetails, mockUserDetails)}));
          (userServiceMock.getUser as Mock).mockReturnValue(cold('x|', {x: mockClashBotUserDetails}));
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(cold('#', undefined, createMockErrorResponse()));

          createComponent();
          fixture.detectChanges();
          flush();

          expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
          expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to retrieve League Champion names. Please try again later.', 'X', {duration: 5000});

          expect(userServiceMock.getUser).toBeCalledTimes(1);
          expect(userServiceMock.getUser).toBeCalledWith(`${mockUserDetails.id}`);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);

          expect(component.userDetails).toBeFalsy();
          expect(component.userDetailsForm).toBeFalsy();
          expect(component.preferredChampions).toEqual(new Set());
          expect(component.initialFormControlState).toEqual({});
          expect(component.defaultGuild).toEqual('');
          expect(component.listOfChampions.length).toBeLessThan(1);
          expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
        })
      })
    })

    test('Error - Champion Data timeout - If the champion names fail to load then there should be a Snack Bar with a generic message printed out.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        let mockUserDetails: UserDetails = mocks.createMockUserDetails();
        let mockClashBotUserDetails: Player = mocks.createMockClashBotUserDetails();

        let mockAppDetails: ApplicationDetails = mocks.createMockAppDetails(mocks.createMockGuilds(), mockClashBotUserDetails, mockUserDetails);

        let applicationDetailsColdObs = cold('x|', {x: mockAppDetails});
        let clashBotUserDetailsColdObservable = cold('x|', {x: mockClashBotUserDetails});
        let ddragonServiceListOfChampionsColdObservable = cold('7000ms x|', {x: mocks.getMockDdragonChampionList()});

        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsColdObs);
        (userServiceMock.getUser as Mock).mockReturnValue(clashBotUserDetailsColdObservable);
        (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(ddragonServiceListOfChampionsColdObservable);

        createComponent();
        fixture.detectChanges();
        flush();

        expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
        expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to retrieve League Champion names. Please try again later.', 'X', {duration: 5000});

        expect(userServiceMock.getUser).toBeCalledTimes(1);
        expect(userServiceMock.getUser).toBeCalledWith(`${mockUserDetails.id}`);
        expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);

        expect(component.userDetails).toBeFalsy();
        expect(component.userDetailsForm).toBeFalsy();
        expect(component.preferredChampions).toEqual(new Set());
        expect(component.initialFormControlState).toEqual({});
        expect(component.defaultGuild).toEqual('');
        expect(component.listOfChampions.length).toBeLessThan(1);
        expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
      })
    })
  })

  describe('Selected', () => {
    test('When I select an element from the champion auto complete, then I should be able to add it to the preferred champions list if the user does not exist in list.', () => {
      createComponent();
      let mockMatAutoCompleteEvent = ({
        option: {
          viewValue: 'Sylas'
        }
      } as any);
      component.championInput = {
        nativeElement: {}
      }
      component.championAutoCompleteCtrl = ({
        setValue: jest.fn()
      } as any);
      component.userDetailsForm = ({
        controls: {
          preferredChampionsFC: {
            setValue: jest.fn()
          },
          subscribedDiscordDMFC: {
            value: true
          }
        },
        markAsDirty: jest.fn(),
        markAsPristine: jest.fn()
      } as any);
      component.listOfChampions = [mockMatAutoCompleteEvent.option.viewValue];
      component.initialFormControlState = {
        preferredChampionsFC: [],
        subscribedDiscordDMFC: true
      };
      component.selected(mockMatAutoCompleteEvent);
      expect(component.championInput.nativeElement.value).toEqual('');
      expect(component.championInput.nativeElement.value).toEqual('');
      expect(component.championAutoCompleteCtrl.setValue).toHaveBeenCalledWith(null);
      expect(component.preferredChampions.has(mockMatAutoCompleteEvent.option.viewValue)).toBeTruthy();
      if (component.userDetailsForm) {
        expect(component.userDetailsForm.controls.preferredChampionsFC.setValue).toHaveBeenCalledWith([...component.preferredChampions]);
        expect(component.userDetailsForm.markAsDirty).toHaveBeenCalledTimes(1);
        expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(0);
      } else {
        expect(true).toBeFalsy();
      }
    })

    test('When I select an element from the champion auto complete, and the preferred champion list would then be ' +
      'greater than 5 then do not add selected champion.', () => {
      createComponent();
      let mockMatAutoCompleteEvent = ({
        option: {
          viewValue: 'Sylas'
        }
      } as any);
      component.championInput = {
        nativeElement: {}
      }
      component.championAutoCompleteCtrl = ({
        setValue: jest.fn()
      } as any);
      component.userDetailsForm = ({
        controls: {
          preferredChampionsFC: {
            setValue: jest.fn()
          },
          subscribedDiscordDMFC: {
            value: true
          }
        },
        markAsDirty: jest.fn(),
        markAsPristine: jest.fn()
      } as any);
      component.listOfChampions = [mockMatAutoCompleteEvent.option.viewValue];
      component.preferredChampions.add('Ahri');
      component.preferredChampions.add('Aatrox');
      component.preferredChampions.add('Malphite');
      component.preferredChampions.add('Anivia');
      component.preferredChampions.add('Zed');
      component.initialFormControlState = {
        preferredChampionsFC: ['Ahri','Aatrox','Malphite','Anivia','Zed'],
        subscribedDiscordDMFC: true
      };
      component.selected(mockMatAutoCompleteEvent);
      expect(component.championInput.nativeElement.value).toEqual('');
      expect(component.championInput.nativeElement.value).toEqual('');
      expect(component.championAutoCompleteCtrl.setValue).toHaveBeenCalledWith(null);
      expect(component.preferredChampions.has(mockMatAutoCompleteEvent.option.viewValue)).toBeFalsy();
      expect(component.preferredChampions.size).toEqual(5);
      if (component.userDetailsForm) {
        expect(component.userDetailsForm.controls.preferredChampionsFC.setValue)
          .toHaveBeenCalledWith([...component.preferredChampions]);
        expect(component.userDetailsForm.markAsDirty).toHaveBeenCalledTimes(0);
        expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
      } else {
        expect(true).toBeFalsy();
      }
    })

    test('Reverting - When I select an element from the champion auto complete, then I should be able to add it to the preferred champions list if the user does not exist in list.', () => {
      createComponent();
      let mockMatAutoCompleteEvent = ({
        option: {
          viewValue: 'Sylas'
        }
      } as any);
      component.championInput = {
        nativeElement: {}
      }
      component.championAutoCompleteCtrl = ({
        setValue: jest.fn()
      } as any);
      component.userDetailsForm = ({
        controls: {
          preferredChampionsFC: {
            setValue: jest.fn()
          },
          subscribedDiscordDMFC: {
            value: true
          }
        },
        markAsDirty: jest.fn(),
        markAsPristine: jest.fn()
      } as any);
      component.listOfChampions = [mockMatAutoCompleteEvent.option.viewValue];
      component.initialFormControlState = {
        preferredChampionsFC: [mockMatAutoCompleteEvent.option.viewValue],
        subscribedDiscordDMFC: true
      };
      component.selected(mockMatAutoCompleteEvent);
      expect(component.championInput.nativeElement.value).toEqual('');
      expect(component.championInput.nativeElement.value).toEqual('');
      expect(component.championAutoCompleteCtrl.setValue).toHaveBeenCalledWith(null);
      expect(component.preferredChampions.has(mockMatAutoCompleteEvent.option.viewValue)).toBeTruthy();
      if (component.userDetailsForm) {
        expect(component.userDetailsForm.controls.preferredChampionsFC.setValue).toHaveBeenCalledWith([...component.preferredChampions]);
        expect(component.userDetailsForm.markAsDirty).toHaveBeenCalledTimes(0);
        expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
      } else {
        expect(true).toBeFalsy();
      }
    })
  })

  describe('Remove', () => {
    test('When I select an element from the champion auto complete, then I should be able to add it to the preferred champions list if the user does not exist in list.', () => {
      createComponent();
      const removeChampion = 'Sylas';
      component.championInput = {
        nativeElement: {}
      }
      component.championAutoCompleteCtrl = ({
        setValue: jest.fn()
      } as any);
      component.userDetailsForm = ({
        controls: {
          preferredChampionsFC: {
            setValue: jest.fn()
          },
          subscribedDiscordDMFC: {
            value: true
          }
        },
        markAsDirty: jest.fn(),
        markAsPristine: jest.fn()
      } as any);
      component.listOfChampions = [];
      component.initialFormControlState = {
        preferredChampionsFC: [removeChampion],
        subscribedDiscordDMFC: true
      };
      component.remove(removeChampion);
      expect(!component.preferredChampions.has(removeChampion)).toBeTruthy();
      if (component.userDetailsForm) {
        expect(component.userDetailsForm.controls.preferredChampionsFC.setValue).toHaveBeenCalledWith([...component.preferredChampions]);
        expect(component.userDetailsForm.markAsDirty).toHaveBeenCalledTimes(1);
        expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(0);
      } else {
        expect(true).toBeFalsy();
      }
    })

    test('Reverting - When I select an element from the champion auto complete, then I should be able to add it to the preferred champions list if the user does not exist in list.', () => {
      createComponent();
      const removeChampion = 'Sylas';
      component.championInput = {
        nativeElement: {}
      }
      component.championAutoCompleteCtrl = ({
        setValue: jest.fn()
      } as any);
      component.userDetailsForm = ({
        controls: {
          preferredChampionsFC: {
            setValue: jest.fn()
          },
          subscribedDiscordDMFC: {
            value: true
          }
        },
        markAsDirty: jest.fn(),
        markAsPristine: jest.fn()
      } as any);
      component.listOfChampions = [];
      component.initialFormControlState = {
        preferredChampionsFC: [],
        subscribedDiscordDMFC: true
      };
      component.remove(removeChampion);
      expect(!component.preferredChampions.has(removeChampion)).toBeTruthy();
      if (component.userDetailsForm) {
        expect(component.userDetailsForm.controls.preferredChampionsFC.setValue).toHaveBeenCalledWith([...component.preferredChampions]);
        expect(component.userDetailsForm.markAsDirty).toHaveBeenCalledTimes(0);
        expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
      } else {
        expect(true).toBeFalsy();
      }
    })
  })

  describe('Reset State', () => {
    test('When reset state is called, it should reset the form control and all values back to their state before submition.', () => {
      createComponent();
      component.initialFormControlState = {
        preferredChampionsFC: [],
        subscribedDiscordDMFC: true,
        defaultGuildFC: 'Goon Squad'
      }
      component.initialAutoCompleteArray = ['Ashe', 'Sylas', 'Volibear', 'Yasuo'];
      component.userDetailsForm = ({
        reset: jest.fn()
      } as any);
      component.preferredChampions = new Set<string>(['Ashe', 'Volibear', 'Yasuo'])
      component.listOfChampions = ['Sylas'];
      component.resetState();
      expect(component.preferredChampions.size).toEqual(0);
      expect(component.listOfChampions).toEqual(component.initialAutoCompleteArray);
      if (component.userDetailsForm) {
        expect(component.userDetailsForm.reset).toHaveBeenCalledTimes(1);
        expect(component.userDetailsForm.reset).toHaveBeenCalledWith(component.initialFormControlState);
      } else {
        expect(true).toBeFalsy();
      }
    })
  })

  describe('Submit', () => {
    test('When onSubmit is called, it should take the values from the userDetailsForm as well as the User Id and post the update to the ClashBot API to update the user details', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        createComponent();
        component.userDetailsForm = ({
          value: {
            defaultGuildFC: 'Sejjjus',
            preferredChampionsFC: ['Sett'],
            subscribedDiscordDMFC: true
          },
          markAsPristine: jest.fn(),
          markAsPending: jest.fn()
        } as any);
        component.initialFormControlState = {
          defaultGuildFC: 'Goon Squad',
          preferredChampionsFC: ['Ahri'],
          subscribedDiscordDMFC: false
        };
        component.userDetails = {
          id: 123321312,
          username: 'Roidrage',
          discriminator: '1232132131231'
        };
        let userDetailsResponse: Player = {
          id: '12321',
          name: 'Roidrage',
          serverName: 'Sejjjus',
          champions: ['Sett'],
          subscriptions: [
            {
              key: 'UpcomingClashTournamentDiscordDM',
              isOn: true
            }]
        };

        let clashBotUserDetailsObservableMock = cold('x|', {x: userDetailsResponse});
        let applicationDetailsObsMock = cold('x|', {x: {}});
        (userServiceMock.updateUser as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        (userServiceMock.createNewListOfPreferredChampions as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        (userServiceMock.subscribeUser as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsObsMock);

        component.onSubmit();

        flush();

        expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.createNewListOfPreferredChampions).toHaveBeenCalledTimes(1);
        expect(userServiceMock.subscribeUser).toHaveBeenCalledTimes(1);

        if (component.userDetailsForm) {

          const expectedUpdateUserRequest: CreateUserRequest = {
            id: `${component.userDetails.id}`,
            name: component.userDetails.username,
            serverName: `${component.userDetailsForm.value.defaultGuildFC}`
          };
          expect(userServiceMock.updateUser)
              .toHaveBeenCalledWith(expectedUpdateUserRequest);
          expect(userServiceMock.createNewListOfPreferredChampions).toHaveBeenCalledWith(
              `${component.userDetails.id}`,
              {champions: ['Sett']}
          );
          expect(userServiceMock.subscribeUser)
              .toHaveBeenCalledWith(`${component.userDetails.id}`);
          expect(component.initialFormControlState).toEqual(component.userDetailsForm.value);
          expect(component.userDetailsForm.markAsPending).toHaveBeenCalledTimes(1);
          expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledWith({ defaultGuild: userDetailsResponse.serverName });
        } else {
          expect(true).toBeFalsy();
        }
      })
    })

    test('When onSubmit is called, if only champions are changed, only the champions update call should be made.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        createComponent();
        component.userDetailsForm = ({
          value: {
            defaultGuildFC: 'Goon Squad',
            preferredChampionsFC: ['Sett'],
            subscribedDiscordDMFC: true
          },
          markAsPristine: jest.fn(),
          markAsPending: jest.fn()
        } as any);
        component.initialFormControlState = {
          defaultGuildFC: 'Goon Squad',
          preferredChampionsFC: ['Ahri'],
          subscribedDiscordDMFC: true
        };
        component.userDetails = {
          id: 123321312,
          username: 'Roidrage',
          discriminator: '1232132131231'
        };
        let userDetailsResponse = ['Sett'];

        let clashBotUserDetailsObservableMock = cold('x|', {x: userDetailsResponse});
        let applicationDetailsObsMock = cold('x|', {x: {}});
        (userServiceMock.createNewListOfPreferredChampions as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsObsMock);

        component.onSubmit();

        flush();

        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
        expect(userServiceMock.createNewListOfPreferredChampions).toHaveBeenCalledTimes(1);
        expect(userServiceMock.subscribeUser).not.toHaveBeenCalled();

        if (component.userDetailsForm) {

          expect(userServiceMock.createNewListOfPreferredChampions).toHaveBeenCalledWith(
              `${component.userDetails.id}`,
              {champions: ['Sett']}
          );
          expect(component.initialFormControlState).toEqual(component.userDetailsForm.value);
          expect(component.userDetailsForm.markAsPending).toHaveBeenCalledTimes(1);
          expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledWith({ defaultGuild: 'Goon Squad' });
        } else {
          expect(true).toBeFalsy();
        }
      })
    })

    test('When onSubmit is called, if only the subscription is changed and is changing to true, only the subscribe user update call should be made.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        createComponent();
        component.userDetailsForm = ({
          value: {
            defaultGuildFC: 'Goon Squad',
            preferredChampionsFC: ['Sett'],
            subscribedDiscordDMFC: true
          },
          markAsPristine: jest.fn(),
          markAsPending: jest.fn()
        } as any);
        component.initialFormControlState = {
          defaultGuildFC: 'Goon Squad',
          preferredChampionsFC: ['Sett'],
          subscribedDiscordDMFC: false
        };
        component.userDetails = {
          id: 123321312,
          username: 'Roidrage',
          discriminator: '1232132131231'
        };
        let userDetailsResponse: Subscription[] = [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true
        }];

        let clashBotUserDetailsObservableMock = cold('x|', {x: userDetailsResponse});
        let applicationDetailsObsMock = cold('x|', {x: {}});
        (userServiceMock.subscribeUser as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsObsMock);

        component.onSubmit();

        flush();

        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
        expect(userServiceMock.createNewListOfPreferredChampions).not.toHaveBeenCalled();
        expect(userServiceMock.subscribeUser).toHaveBeenCalledTimes(1);

        if (component.userDetailsForm) {
          expect(userServiceMock.subscribeUser).toHaveBeenCalledWith(`${component.userDetails.id}`);
          expect(component.initialFormControlState).toEqual(component.userDetailsForm.value);
          expect(component.userDetailsForm.markAsPending).toHaveBeenCalledTimes(1);
          expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledWith({ defaultGuild: 'Goon Squad' });
        } else {
          expect(true).toBeFalsy();
        }
      })
    })

    test('When onSubmit is called, if only the subscription is changed and is changing to false, only the unsubscribe user update call should be made.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        createComponent();
        component.userDetailsForm = ({
          value: {
            defaultGuildFC: 'Goon Squad',
            preferredChampionsFC: ['Sett'],
            subscribedDiscordDMFC: false
          },
          markAsPristine: jest.fn(),
          markAsPending: jest.fn()
        } as any);
        component.initialFormControlState = {
          defaultGuildFC: 'Goon Squad',
          preferredChampionsFC: ['Sett'],
          subscribedDiscordDMFC: true
        };
        component.userDetails = {
          id: 123321312,
          username: 'Roidrage',
          discriminator: '1232132131231'
        };
        let userDetailsResponse: Subscription[] = [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: false
        }];

        let clashBotUserDetailsObservableMock = cold('x|', {x: userDetailsResponse});
        let applicationDetailsObsMock = cold('x|', {x: {}});
        (userServiceMock.unsubscribeUser as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsObsMock);

        component.onSubmit();

        flush();

        expect(userServiceMock.updateUser).not.toHaveBeenCalled();
        expect(userServiceMock.createNewListOfPreferredChampions).not.toHaveBeenCalled();
        expect(userServiceMock.subscribeUser).not.toHaveBeenCalled();
        expect(userServiceMock.unsubscribeUser).toHaveBeenCalledTimes(1);

        if (component.userDetailsForm) {
          expect(userServiceMock.unsubscribeUser).toHaveBeenCalledWith(`${component.userDetails.id}`);
          expect(component.initialFormControlState).toEqual(component.userDetailsForm.value);
          expect(component.userDetailsForm.markAsPending).toHaveBeenCalledTimes(1);
          expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledWith({ defaultGuild: 'Goon Squad' });
        } else {
          expect(true).toBeFalsy();
        }
      })
    })

    test('When onSubmit is called, if only the default server is changed, only the server update call should be made.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        createComponent();
        component.userDetailsForm = ({
          value: {
            defaultGuildFC: 'Goon Squad',
            preferredChampionsFC: ['Sett'],
            subscribedDiscordDMFC: true
          },
          markAsPristine: jest.fn(),
          markAsPending: jest.fn()
        } as any);
        component.initialFormControlState = {
          defaultGuildFC: 'Sejjjjjjj',
          preferredChampionsFC: ['Sett'],
          subscribedDiscordDMFC: true
        };
        component.userDetails = {
          id: 123321312,
          username: 'Roidrage',
          discriminator: '1232132131231'
        };
        let userDetailsResponse: Player = {
          id: '12321',
          name: 'Roidrage',
          serverName: 'Goon Squad',
          champions: ['Sett'],
          subscriptions: [
            {
              key: 'UpcomingClashTournamentDiscordDM',
              isOn: true
            }]
        };

        let clashBotUserDetailsObservableMock = cold('x|', {x: userDetailsResponse});
        let applicationDetailsObsMock = cold('x|', {x: {}});
        (userServiceMock.updateUser as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsObsMock);

        component.onSubmit();

        flush();

        expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.createNewListOfPreferredChampions).not.toHaveBeenCalled();
        expect(userServiceMock.subscribeUser).not.toHaveBeenCalled();

        if (component.userDetailsForm) {

          const expectedUpdateUserRequest: CreateUserRequest = {
            id: `${component.userDetails.id}`,
            name: component.userDetails.username,
            serverName: `${component.userDetailsForm.value.defaultGuildFC}`
          };
          expect(userServiceMock.updateUser).toHaveBeenCalledWith(expectedUpdateUserRequest);
          expect(component.initialFormControlState).toEqual(component.userDetailsForm.value);
          expect(component.userDetailsForm.markAsPending).toHaveBeenCalledTimes(1);
          expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledTimes(1);
          expect(applicationDetailsMock.setApplicationDetails).toHaveBeenCalledWith({ defaultGuild: 'Goon Squad' });
        } else {
          expect(true).toBeFalsy();
        }
      })
    })

    test('Error - Failed to Post - If onSubmit call fails to the Clash Bot User Service, a Snack Bar should be called with a generic message the Form should still be dirty.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        createComponent();
        component.userDetailsForm = ({
          value: {
            defaultGuildFC: 'HeeeeeHoooo',
            preferredChampionsFC: ['Sett'],
            subscribedDiscordDMFC: true
          },
          markAsPristine: jest.fn(),
          markAsPending: jest.fn()
        } as any);
        component.userDetails = {
          id: 123321312,
          discriminator: '1232132131231',
          username: 'Roidrage'
        };
        component.initialFormControlState = {
          defaultGuildFC: 'Goon Squad',
          preferredChampionsFC: ['Sett'],
          subscribedDiscordDMFC: true
        };

        const expectedError =
          new HttpErrorResponse({
            error: 'Failed to make call.',
            headers: undefined,
            status: 400,
            statusText: 'Bad Request',
            url: 'https://localhost.com/api/user'
          });
        let clashBotUserDetailsObservableMock = cold('-#', undefined, expectedError);
        (userServiceMock.updateUser as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        expectObservable(clashBotUserDetailsObservableMock).toBe('-#', undefined, expectedError);

        component.onSubmit();

        flush();

        expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.createNewListOfPreferredChampions).not.toHaveBeenCalled();
        expect(userServiceMock.subscribeUser).not.toHaveBeenCalled();
        expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
        expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to persist your requested update. Please try again.', 'X', {duration: 5000});

        if (component.userDetailsForm) {

          const expectedUpdateUserRequest: CreateUserRequest = {
            id: `${component.userDetails.id}`,
            name: component.userDetails.username,
            serverName: `${component.userDetailsForm.value.defaultGuildFC}`
          };
          expect(userServiceMock.updateUser).toHaveBeenCalledWith(expectedUpdateUserRequest);
          expect(component.initialFormControlState).not.toEqual(component.userDetailsForm.value);
          expect(component.userDetailsForm.markAsPending).toHaveBeenCalledTimes(1);
          expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(0);
        } else {
          expect(true).toBeFalsy();
        }
      })
    })

    test('Error - Timeout - If onSubmit call fails to the Clash Bot User Service, a Snack Bar should be called with a generic message the Form should still be dirty.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        createComponent();
        component.userDetailsForm = ({
          value: {
            defaultGuildFC: 'Goon Squad',
            preferredChampionsFC: ['Sett'],
            subscribedDiscordDMFC: true
          },
          markAsPristine: jest.fn(),
          markAsPending: jest.fn()
        } as any);
        component.userDetails = {
          id: 123321312,
          discriminator: '1232132131231',
          username: 'Roidrage'
        };
        component.initialFormControlState = {
          defaultGuildFC: 'Sejj',
          username: 'Roidrage',
          preferredChampionsFC: ['Sett'],
          subscribedDiscordDMFC: true
        }
        let userDetailsResponse: Player = {
          id: '12321',
          name: 'Roidrage',
          serverName: 'Goon Squad',
          champions: ['Sett'],
          subscriptions: [
            {
              key: 'UpcomingClashTournamentDiscordDM',
              isOn: true
            }]
        };
        let clashBotUserDetailsObservableMock = cold('7000ms -x|',
            {x: userDetailsResponse});
        (userServiceMock.updateUser as Mock)
            .mockReturnValue(clashBotUserDetailsObservableMock);

        expectObservable(clashBotUserDetailsObservableMock).toBe('7000ms -x|',
            {x: userDetailsResponse});

        component.onSubmit();

        flush();

        expect(userServiceMock.updateUser).toHaveBeenCalledTimes(1);
        expect(userServiceMock.subscribeUser).not.toHaveBeenCalled();
        expect(userServiceMock.unsubscribeUser).not.toHaveBeenCalled();
        expect(userServiceMock.createNewListOfPreferredChampions).not.toHaveBeenCalled();
        expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
        expect(openMatSnackBarMock)
            .toHaveBeenCalledWith('Oops! Failed to persist your requested update. Please try again.',
                'X', {duration: 5000});

        if (component.userDetailsForm) {

          const expectedUpdateUserRequest: CreateUserRequest = {
            id: `${component.userDetails.id}`,
            name: component.userDetails.username,
            serverName: `${component.userDetailsForm.value.defaultGuildFC}`
          };
          expect(userServiceMock.updateUser).toHaveBeenCalledWith(expectedUpdateUserRequest);
          expect(component.initialFormControlState).not.toEqual(component.userDetailsForm.value);
          expect(component.userDetailsForm.markAsPending).toHaveBeenCalledTimes(1);
          expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(0);
        } else {
          expect(true).toBeFalsy();
        }
      })
    })
  })

  describe('Slider Update', () => {

    test('When sliderUpdate is called, if the state is different than the initial state then it should call markAsDirty.', () => {
      createComponent();
      component.userDetailsForm = ({
        controls: {
          preferredChampionsFC: {
            setValue: jest.fn()
          },
          subscribedDiscordDMFC: {
            value: false
          }
        },
        markAsDirty: jest.fn(),
        markAsPristine: jest.fn()
      } as any);
      component.listOfChampions = [];
      component.initialFormControlState = {
        preferredChampionsFC: [],
        subscribedDiscordDMFC: true
      };
      component.sliderUpdate();
      if (component.userDetailsForm) {
        expect(component.userDetailsForm.markAsDirty).toHaveBeenCalledTimes(1);
        expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(0);
      } else {
        expect(true).toBeFalsy();
      }
    })

    test('When sliderUpdate is called, if the state is different than the initial state then it should call markAsPristine.', () => {
      createComponent();
      component.userDetailsForm = ({
        controls: {
          preferredChampionsFC: {
            setValue: jest.fn()
          },
          subscribedDiscordDMFC: {
            value: true
          }
        },
        markAsDirty: jest.fn(),
        markAsPristine: jest.fn()
      } as any);
      component.listOfChampions = [];
      component.initialFormControlState = {
        preferredChampionsFC: [],
        subscribedDiscordDMFC: true
      };
      component.sliderUpdate();
      if (component.userDetailsForm) {
        expect(component.userDetailsForm.markAsDirty).toHaveBeenCalledTimes(0);
        expect(component.userDetailsForm.markAsPristine).toHaveBeenCalledTimes(1);
      } else {
        expect(true).toBeFalsy();
      }
    })
  })

  let createComponent = () => {
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  };
})
