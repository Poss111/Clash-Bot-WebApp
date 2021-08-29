import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UserProfileComponent} from './user-profile.component';
import {UserProfileModule} from "./user-profile.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ClashBotService} from "../../../services/clash-bot.service";
import {ClashBotUserDetails} from "../../../interfaces/clash-bot-user-details";
import {RiotDdragonService} from "../../../services/riot-ddragon.service";
import {UserDetailsService} from "../../../services/user-details.service";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";
import {DiscordGuild} from "../../../interfaces/discord-guild";
import {UserDetails} from "../../../interfaces/user-details";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {TestScheduler} from "rxjs/testing";
import {ChampionData} from "../../../interfaces/championData";
import Mock = jest.Mock;
import {HttpErrorResponse} from "@angular/common/http";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {ApplicationDetails} from "../../../interfaces/application-details";

jest.mock('../../../services/clash-bot.service')
jest.mock('../../../services/riot-ddragon.service')
jest.mock('../../../services/user-details.service')
jest.mock('../../../services/application-details.service')

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let testScheduler: TestScheduler;
  let clashBotServiceMock: ClashBotService;
  let riotDDragonServiceMock: RiotDdragonService;
  let userDetailsServiceMock: UserDetailsService;
  let applicationDetailsMock: any;
  let matSnackBarMock: MatSnackBar;
  let openMatSnackBarMock: any;

  beforeEach(async () => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    jest.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [UserProfileModule,
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule],
      providers: [RiotDdragonService, UserDetailsService, ApplicationDetailsService]
    })
      .compileComponents();
    clashBotServiceMock = TestBed.inject(ClashBotService);
    riotDDragonServiceMock = TestBed.inject(RiotDdragonService);
    userDetailsServiceMock = TestBed.inject(UserDetailsService);
    matSnackBarMock = TestBed.inject(MatSnackBar);
    applicationDetailsMock = TestBed.inject(ApplicationDetailsService);
    openMatSnackBarMock = jest.fn();
    matSnackBarMock.open = openMatSnackBarMock;
  });

  describe('On Init', () => {
    test('Should instantiate all values for the User Profile page.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        let mockGuilds: DiscordGuild[] = [{
          features: [],
          icon: '1233213123',
          id: '8109283091283021',
          name: 'Some Special Awesomenautic Server',
          owner: true,
          permissions: 0,
          permissions_new: '0'
        }];
        let mockUserDetails: UserDetails = {
          id: '12312321312',
          username: 'Roidrage',
          discriminator: '12312312'
        };
        let mockClashBotUserDetails: ClashBotUserDetails = {
          id: '12312321312',
          username: 'Roidrage',
          serverName: 'Goon Squad',
          preferredChampions: ['Sett'],
          subscriptions: {
            UpcomingClashTournamentDiscordDM: true
          }
        };
        let mockDdragonChampionList: ChampionData = {
          type: '12312',
          format: 'json',
          version: '19.13',
          data: {
            'Aatrox': {},
            'Sett': {},
            'Volibear': {}
          }
        };
        let mockAppDetails: ApplicationDetails = {
          currentTournaments: [],
          defaultGuild: '',
          userGuilds: mockGuilds
        };

        let applicationDetailsColdObs = cold('x|', {x: mockAppDetails});
        let discordUserDetailsColdObservable = cold('x|', {x: mockUserDetails});
        let clashBotUserDetailsColdObservable = cold('x|', {x: mockClashBotUserDetails});
        let ddragonServiceListOfChampionsColdObservable = cold('x|', {x: mockDdragonChampionList});

        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsColdObs);
        (userDetailsServiceMock.getUserDetails as Mock).mockReturnValue(discordUserDetailsColdObservable);
        (clashBotServiceMock.getUserDetails as Mock).mockReturnValue(clashBotUserDetailsColdObservable);
        (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(ddragonServiceListOfChampionsColdObservable);

        createComponent();
        fixture.detectChanges();
        flush();

        expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
        expect(userDetailsServiceMock.getUserDetails).toBeCalledTimes(1);
        expect(clashBotServiceMock.getUserDetails).toBeCalledTimes(1);
        expect(clashBotServiceMock.getUserDetails).toBeCalledWith(mockUserDetails.id);
        expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);

        expect(component.userDetails).toEqual(mockUserDetails);
        expect(component.userDetailsForm).toBeTruthy();
        if (component.userDetailsForm) {
          expect(Object.keys(component.userDetailsForm.controls)).toHaveLength(3);
        } else {
          expect(true).toBeFalsy();
        }
        expect(component.preferredChampions).toEqual(new Set(mockClashBotUserDetails.preferredChampions));
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
            !mockClashBotUserDetails.preferredChampions.includes(record)));
        expect(component.initialAutoCompleteArray)
          .toEqual(Object.keys(mockDdragonChampionList.data).filter(record =>
            !mockClashBotUserDetails.preferredChampions.includes(record)));
      })
    });

    describe('Retrieve Application Loaded User Information', () => {
      test('Error - No Application User Information - If the user information passed is default data, then show a Snack Bar with a generic error message for User information.', () => {
        testScheduler.run((helpers) => {
          const {cold, flush} = helpers;
          let mockGuilds: DiscordGuild[] = [{
            features: [],
            icon: '1233213123',
            id: '8109283091283021',
            name: 'Some Special Awesomenautic Server',
            owner: true,
            permissions: 0,
            permissions_new: '0'
          }];
          let mockUserDetails: UserDetails = {id: '', username: '', discriminator: ''};
          let mockClashBotUserDetails: ClashBotUserDetails = {
            id: '12312321312',
            username: 'Roidrage',
            serverName: 'Goon Squad',
            preferredChampions: ['Sett'],
            subscriptions: {
              UpcomingClashTournamentDiscordDM: true
            }
          };
          let mockDdragonChampionList: ChampionData = {
            type: '12312',
            format: 'json',
            version: '19.13',
            data: {
              'Aatrox': {},
              'Sett': {},
              'Volibear': {}
            }
          };

          let mockAppDetails: ApplicationDetails = {
            currentTournaments: [],
            defaultGuild: '',
            userGuilds: mockGuilds
          };

          let applicationDetailsColdObs = cold('x|', {x: mockAppDetails});
          let discordUserDetailsColdObservable = cold('x|', {x: mockUserDetails});
          let clashBotUserDetailsColdObservable = cold('x|', {x: mockClashBotUserDetails});
          let ddragonServiceListOfChampionsColdObservable = cold('x|', {x: mockDdragonChampionList});

          applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsColdObs);
          (userDetailsServiceMock.getUserDetails as Mock).mockReturnValue(discordUserDetailsColdObservable);
          (clashBotServiceMock.getUserDetails as Mock).mockReturnValue(clashBotUserDetailsColdObservable);
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(ddragonServiceListOfChampionsColdObservable);

          createComponent();
          fixture.detectChanges();
          flush();

          expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
          expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! You are not logged in. Please navigate back to the home screen and log in.', 'X', {duration: 5000});

          expect(userDetailsServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledTimes(0);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(0);


          expect(component.userDetails).toBeFalsy();
          expect(component.userDetailsForm).toBeFalsy();
          expect(component.preferredChampions).toEqual(new Set());
          expect(component.initialFormControlState).toEqual({});
          expect(component.defaultGuild).toEqual('');
          expect(component.guilds).toEqual(mockGuilds);
          expect(component.listOfChampions.length).toBeLessThan(1);
          expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
        });
      })
    })

    describe('Load Clash Bot User Details', () => {
      test('If the user does not exist on the Clash Bot Service, initialize forms with default values.', () => {
        testScheduler.run(helpers => {
          const {cold, flush} = helpers;
          let mockGuilds: DiscordGuild[] = [{
            features: [],
            icon: '1233213123',
            id: '8109283091283021',
            name: 'Some Special Awesomenautic Server',
            owner: true,
            permissions: 0,
            permissions_new: '0'
          }];
          let mockUserDetails: UserDetails = {
            id: '12312321312',
            username: 'Roidrage',
            discriminator: '12312312'
          };
          let mockClashBotUserDetails: ClashBotUserDetails = ({} as any);
          let mockDdragonChampionList: ChampionData = {
            type: '12312',
            format: 'json',
            version: '19.13',
            data: {
              'Aatrox': {},
              'Sett': {},
              'Volibear': {}
            }
          };
          let mockAppDetails: ApplicationDetails = {
            currentTournaments: [],
            defaultGuild: '',
            userGuilds: mockGuilds
          };

          let applicationDetailsColdObs = cold('x|', {x: mockAppDetails});
          let discordUserDetailsColdObservable = cold('x|', {x: mockUserDetails});
          let clashBotUserDetailsColdObservable = cold('x|', {x: mockClashBotUserDetails});
          let ddragonServiceListOfChampionsColdObservable = cold('x|', {x: mockDdragonChampionList});

          applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsColdObs);
          (userDetailsServiceMock.getUserDetails as Mock).mockReturnValue(discordUserDetailsColdObservable);
          (clashBotServiceMock.getUserDetails as Mock).mockReturnValue(clashBotUserDetailsColdObservable);
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(ddragonServiceListOfChampionsColdObservable);

          createComponent();
          fixture.detectChanges();
          flush();

          expect(userDetailsServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledWith(mockUserDetails.id);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);

          expect(component.userDetails).toEqual(mockUserDetails);
          expect(component.userDetailsForm).toBeTruthy();
          if (component.userDetailsForm) {
            expect(Object.keys(component.userDetailsForm.controls)).toHaveLength(3);
          } else {
            expect(true).toBeFalsy();
          }
          expect(component.preferredChampions).toEqual(new Set(mockClashBotUserDetails.preferredChampions));
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

      test('Error - Failed to retrieve Clash Bot User Information - If the call to the clash bot to retrieve persisted User Information fails then a Snack Bar should be called with a generic error message', () => {
        testScheduler.run(helpers => {
          const {cold, flush} = helpers;

          let mockGuilds: DiscordGuild[] = [{
            features: [],
            icon: '1233213123',
            id: '8109283091283021',
            name: 'Some Special Awesomenautic Server',
            owner: true,
            permissions: 0,
            permissions_new: '0'
          }];
          let mockUserDetails: UserDetails = {
            id: '12312321312',
            username: 'Roidrage',
            discriminator: '12312312'
          };
          let mockDdragonChampionList: ChampionData = {
            type: '12312',
            format: 'json',
            version: '19.13',
            data: {
              'Aatrox': {},
              'Sett': {},
              'Volibear': {}
            }
          };
          const expectedError =
              new HttpErrorResponse({
                error: 'Failed to make call.',
                headers: undefined,
                status: 401,
                statusText: 'Not allowed to make call',
                url: 'https://localhost:80/api/user'
              });

          let mockAppDetails: ApplicationDetails = {
            currentTournaments: [],
            defaultGuild: '',
            userGuilds: mockGuilds
          };

          let applicationDetailsColdObs = cold('x|', {x: mockAppDetails});
          let discordUserDetailsColdObservable = cold('x|', {x: mockUserDetails});
          let clashBotUserDetailsColdObservable = cold('#', undefined, expectedError);
          let ddragonServiceListOfChampionsColdObservable = cold('x|', {x: mockDdragonChampionList});

          applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsColdObs);
          (userDetailsServiceMock.getUserDetails as Mock).mockReturnValue(discordUserDetailsColdObservable);
          (clashBotServiceMock.getUserDetails as Mock).mockReturnValue(clashBotUserDetailsColdObservable);
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(ddragonServiceListOfChampionsColdObservable);

          createComponent();
          fixture.detectChanges();
          flush();

          expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
          expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to retrieve your User Information. Please try again later.', 'X', {duration: 5000});

          expect(userDetailsServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledWith(mockUserDetails.id);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(0);

          expect(component.userDetails).toEqual(mockUserDetails);
          expect(component.userDetailsForm).toBeFalsy();
          expect(component.preferredChampions).toEqual(new Set());
          expect(component.initialFormControlState).toEqual({});
          expect(component.defaultGuild).toEqual('');
          expect(component.guilds).toEqual(mockGuilds);
          expect(component.listOfChampions.length).toBeLessThan(1);
          expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
        })
      })

      test('Error - timeout retrieving Clash Bot User Information - If the call to the clash bot to retrieve persisted User Information fails then a Snack Bar should be called with a generic error message', () => {
        testScheduler.run(helpers => {
          const {cold, flush} = helpers;

          let mockGuilds: DiscordGuild[] = [{
            features: [],
            icon: '1233213123',
            id: '8109283091283021',
            name: 'Some Special Awesomenautic Server',
            owner: true,
            permissions: 0,
            permissions_new: '0'
          }];
          let mockUserDetails: UserDetails = {
            id: '12312321312',
            username: 'Roidrage',
            discriminator: '12312312'
          };
          let mockClashBotUserDetails: ClashBotUserDetails = {
            id: '12312321312',
            username: 'Roidrage',
            serverName: 'Goon Squad',
            preferredChampions: ['Sett'],
            subscriptions: {
              UpcomingClashTournamentDiscordDM: true
            }
          };
          let mockDdragonChampionList: ChampionData = {
            type: '12312',
            format: 'json',
            version: '19.13',
            data: {
              'Aatrox': {},
              'Sett': {},
              'Volibear': {}
            }
          };
          let mockAppDetails: ApplicationDetails = {
            currentTournaments: [],
            defaultGuild: '',
            userGuilds: mockGuilds
          };

          let applicationDetailsColdObs = cold('x|', {x: mockAppDetails});
          let discordUserDetailsColdObservable = cold('x|', {x: mockUserDetails});
          let clashBotUserDetailsColdObservable = cold('7000ms x|', {x: mockClashBotUserDetails});
          let ddragonServiceListOfChampionsColdObservable = cold('x|', {x: mockDdragonChampionList});

          applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsColdObs);
          (userDetailsServiceMock.getUserDetails as Mock).mockReturnValue(discordUserDetailsColdObservable);
          (clashBotServiceMock.getUserDetails as Mock).mockReturnValue(clashBotUserDetailsColdObservable);
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(ddragonServiceListOfChampionsColdObservable);

          createComponent();
          fixture.detectChanges();
          flush();

          expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
          expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to retrieve your User Information. Please try again later.', 'X', {duration: 5000});

          expect(userDetailsServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledWith(mockUserDetails.id);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(0);

          expect(component.userDetails).toEqual(mockUserDetails);
          expect(component.userDetailsForm).toBeFalsy();
          expect(component.preferredChampions).toEqual(new Set());
          expect(component.initialFormControlState).toEqual({});
          expect(component.defaultGuild).toEqual('');
          expect(component.guilds).toEqual(mockGuilds);
          expect(component.listOfChampions.length).toBeLessThan(1);
          expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
        })
      })
    })

    describe('Load LoL Champion Data', () => {
      test('Error - Champion Data fails to load from Riot - If the champion names fail to load then there should be a Snack Bar with a generic message printed out.', () => {
        testScheduler.run((helpers) => {
          const {cold, flush} = helpers;
          let mockGuilds: DiscordGuild[] = [{
            features: [],
            icon: '1233213123',
            id: '8109283091283021',
            name: 'Some Special Awesomenautic Server',
            owner: true,
            permissions: 0,
            permissions_new: '0'
          }];
          let mockUserDetails: UserDetails = {
            id: '12312321312',
            username: 'Roidrage',
            discriminator: '12312312'
          };
          let mockClashBotUserDetails: ClashBotUserDetails = {
            id: '12312321312',
            username: 'Roidrage',
            serverName: 'Goon Squad',
            preferredChampions: ['Sett'],
            subscriptions: {
              UpcomingClashTournamentDiscordDM: true
            }
          };
          const expectedError =
            new HttpErrorResponse({
              error: 'Failed to make call.',
              headers: undefined,
              status: 401,
              statusText: 'Not allowed to make call',
              url: 'https://riot.com/datas'
            });

          let mockAppDetails: ApplicationDetails = {
            currentTournaments: [],
            defaultGuild: '',
            userGuilds: mockGuilds
          };

          let applicationDetailsColdObs = cold('x|', {x: mockAppDetails});
          let discordUserDetailsColdObservable = cold('x|', {x: mockUserDetails});
          let clashBotUserDetailsColdObservable = cold('x|', {x: mockClashBotUserDetails});
          let ddragonServiceListOfChampionsColdObservable = cold('#', undefined, expectedError);

          applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsColdObs);
          (userDetailsServiceMock.getUserDetails as Mock).mockReturnValue(discordUserDetailsColdObservable);
          (clashBotServiceMock.getUserDetails as Mock).mockReturnValue(clashBotUserDetailsColdObservable);
          (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(ddragonServiceListOfChampionsColdObservable);

          createComponent();
          fixture.detectChanges();
          flush();

          expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
          expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to retrieve League Champion names. Please try again later.', 'X', {duration: 5000});

          expect(userDetailsServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledTimes(1);
          expect(clashBotServiceMock.getUserDetails).toBeCalledWith(mockUserDetails.id);
          expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);

          expect(component.userDetails).toEqual(mockUserDetails);
          expect(component.userDetailsForm).toBeFalsy();
          expect(component.preferredChampions).toEqual(new Set());
          expect(component.initialFormControlState).toEqual({});
          expect(component.defaultGuild).toEqual('Goon Squad');
          expect(component.listOfChampions.length).toBeLessThan(1);
          expect(component.initialAutoCompleteArray.length).toBeLessThan(1);
        })
      })
    })

    test('Error - Champion Data timesout - If the champion names fail to load then there should be a Snack Bar with a generic message printed out.', () => {
      testScheduler.run((helpers) => {
        const {cold, flush} = helpers;
        let mockGuilds: DiscordGuild[] = [{
          features: [],
          icon: '1233213123',
          id: '8109283091283021',
          name: 'Some Special Awesomenautic Server',
          owner: true,
          permissions: 0,
          permissions_new: '0'
        }];
        let mockUserDetails: UserDetails = {
          id: '12312321312',
          username: 'Roidrage',
          discriminator: '12312312'
        };
        let mockClashBotUserDetails: ClashBotUserDetails = {
          id: '12312321312',
          username: 'Roidrage',
          serverName: 'Goon Squad',
          preferredChampions: ['Sett'],
          subscriptions: {
            UpcomingClashTournamentDiscordDM: true
          }
        };
        let mockDdragonChampionList: ChampionData = {
          type: '12312',
          format: 'json',
          version: '19.13',
          data: {
            'Aatrox': {},
            'Sett': {},
            'Volibear': {}
          }
        };

        let mockAppDetails: ApplicationDetails = {
          currentTournaments: [],
          defaultGuild: '',
          userGuilds: mockGuilds
        };

        let applicationDetailsColdObs = cold('x|', {x: mockAppDetails});
        let discordUserDetailsColdObservable = cold('x|', {x: mockUserDetails});
        let clashBotUserDetailsColdObservable = cold('x|', {x: mockClashBotUserDetails});
        let ddragonServiceListOfChampionsColdObservable = cold('7000ms x|', {x: mockDdragonChampionList});

        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsColdObs);
        (userDetailsServiceMock.getUserDetails as Mock).mockReturnValue(discordUserDetailsColdObservable);
        (clashBotServiceMock.getUserDetails as Mock).mockReturnValue(clashBotUserDetailsColdObservable);
        (riotDDragonServiceMock.getListOfChampions as Mock).mockReturnValue(ddragonServiceListOfChampionsColdObservable);

        createComponent();
        fixture.detectChanges();
        flush();

        expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
        expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to retrieve League Champion names. Please try again later.', 'X', {duration: 5000});

        expect(userDetailsServiceMock.getUserDetails).toBeCalledTimes(1);
        expect(clashBotServiceMock.getUserDetails).toBeCalledTimes(1);
        expect(clashBotServiceMock.getUserDetails).toBeCalledWith(mockUserDetails.id);
        expect(riotDDragonServiceMock.getListOfChampions).toBeCalledTimes(1);

        expect(component.userDetails).toEqual(mockUserDetails);
        expect(component.userDetailsForm).toBeFalsy();
        expect(component.preferredChampions).toEqual(new Set());
        expect(component.initialFormControlState).toEqual({});
        expect(component.defaultGuild).toEqual('Goon Squad');
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
            defaultGuildFC: 'Goon Squad',
            preferredChampionsFC: ['Sett'],
            subscribedDiscordDMFC: true
          },
          markAsPristine: jest.fn(),
          markAsPending: jest.fn()
        } as any);
        component.userDetails = {
          id: '123321312',
          username: 'Roidrage',
          discriminator: '1232132131231'
        };
        let userDetailsResponse: ClashBotUserDetails = {
          id: '12321',
          username: 'Roidrage',
          serverName: 'Goon Squad',
          preferredChampions: ['Sett'],
          subscriptions: {subscribedDiscordDMFC: true}
        }

        let clashBotUserDetailsObservableMock = cold('x|', {x: userDetailsResponse});
        let applicationDetailsObsMock = cold('x|', {x: {}});
        (clashBotServiceMock.postUserDetails as Mock).mockReturnValue(clashBotUserDetailsObservableMock);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationDetailsObsMock);

        component.onSubmit();

        flush();

        expect(clashBotServiceMock.postUserDetails).toHaveBeenCalledTimes(1);

        if (component.userDetailsForm) {
          expect(clashBotServiceMock.postUserDetails).toHaveBeenCalledWith(component.userDetails.id,
            component.userDetailsForm.value.defaultGuildFC,
            new Set<string>(component.userDetailsForm.value.preferredChampionsFC),
            {'UpcomingClashTournamentDiscordDM': component.userDetailsForm.value.subscribedDiscordDMFC},
            component.userDetails.username);
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

    test('Error - Failed to Post - If onSubmit call fails to the Clash Bot User Service, a Snack Bar should be called with a generic message the Form should still be dirty.', () => {
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
          id: '123321312',
          discriminator: '1232132131231',
          username: 'Roidrage'
        };
        component.initialFormControlState = {
          defaultGuildFC: 'Goon Squad',
          preferredChampionsFC: [],
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
        (clashBotServiceMock.postUserDetails as Mock).mockReturnValue(clashBotUserDetailsObservableMock);

        expectObservable(clashBotUserDetailsObservableMock).toBe('-#', undefined, expectedError);

        component.onSubmit();

        flush();

        expect(clashBotServiceMock.postUserDetails).toHaveBeenCalledTimes(1);
        expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
        expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to persist your requested update. Please try again.', 'X', {duration: 5000});

        if (component.userDetailsForm) {
          expect(clashBotServiceMock.postUserDetails).toHaveBeenCalledWith(component.userDetails.id,
            component.userDetailsForm.value.defaultGuildFC,
            new Set<string>(component.userDetailsForm.value.preferredChampionsFC),
            {'UpcomingClashTournamentDiscordDM': component.userDetailsForm.value.subscribedDiscordDMFC},
            component.userDetails.username);
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
          id: '123321312',
          discriminator: '1232132131231',
          username: 'Roidrage'
        };
        component.initialFormControlState = {
          defaultGuildFC: 'Goon Squad',
          username: 'Roidrage',
          preferredChampionsFC: [],
          subscribedDiscordDMFC: true
        }
        let userDetailsResponse: ClashBotUserDetails = {
          id: '12321',
          username: 'Roidrage',
          serverName: 'Goon Squad',
          preferredChampions: ['Sett'],
          subscriptions: {subscribedDiscordDMFC: true}
        }
        let clashBotUserDetailsObservableMock = cold('7000ms -x|', {x: userDetailsResponse});
        (clashBotServiceMock.postUserDetails as Mock).mockReturnValue(clashBotUserDetailsObservableMock);

        expectObservable(clashBotUserDetailsObservableMock).toBe('7000ms -x|', {x: userDetailsResponse});

        component.onSubmit();

        flush();

        expect(clashBotServiceMock.postUserDetails).toHaveBeenCalledTimes(1);
        expect(openMatSnackBarMock).toHaveBeenCalledTimes(1);
        expect(openMatSnackBarMock).toHaveBeenCalledWith('Oops! Failed to persist your requested update. Please try again.', 'X', {duration: 5000});

        if (component.userDetailsForm) {
          expect(clashBotServiceMock.postUserDetails).toHaveBeenCalledWith(component.userDetails.id,
            component.userDetailsForm.value.defaultGuildFC,
            new Set<string>(component.userDetailsForm.value.preferredChampionsFC),
            {'UpcomingClashTournamentDiscordDM': component.userDetailsForm.value.subscribedDiscordDMFC},
            component.userDetails.username);
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
