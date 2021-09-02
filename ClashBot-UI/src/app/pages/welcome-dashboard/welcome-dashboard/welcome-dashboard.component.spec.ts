import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WelcomeDashboardComponent} from './welcome-dashboard.component';
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {ClashTournamentCalendarComponent} from "../../../clash-tournament-calendar/clash-tournament-calendar.component";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {AuthConfig, DateTimeProvider, OAuthLogger, OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {ClashBotService} from "../../../services/clash-bot.service";
import {DiscordService} from "../../../services/discord.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {of} from "rxjs";
import {MatNativeDateModule} from "@angular/material/core";
import {ClashTournamentCalendarHeaderComponent} from "../../../clash-tournament-calendar-header/clash-tournament-calendar-header.component";
import {NgModule} from "@angular/core";
import {environment} from "../../../../environments/environment";
import {UserDetailsService} from "../../../services/user-details.service";
import {UserDetails} from "../../../interfaces/user-details";
import {MatSnackBarConfig} from "@angular/material/snack-bar/snack-bar-config";
import {TestScheduler} from "rxjs/testing";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {ClashBotUserDetails} from "../../../interfaces/clash-bot-user-details";
import {HttpErrorResponse} from "@angular/common/http";
import {MatProgressBarModule} from "@angular/material/progress-bar";

jest.mock("angular-oauth2-oidc");
jest.mock("../../../services/clash-bot.service");
jest.mock("../../../services/discord.service");
jest.mock("../../../services/user-details.service");
jest.mock("../../../services/application-details.service");
jest.mock("@angular/material/snack-bar");

@NgModule({
  declarations: [ClashTournamentCalendarHeaderComponent],
  entryComponents: [ClashTournamentCalendarHeaderComponent],
  imports: [MatIconModule]
})
class WelcomeDashboardTestModule {
}

describe('WelcomeDashboardComponent', () => {
  let component: WelcomeDashboardComponent;
  let fixture: ComponentFixture<WelcomeDashboardComponent>;
  let httpMock: HttpTestingController;
  let clashBotMock: any;
  let discordServiceMock: any;
  let userDetailsServiceMock: any;
  let oAuthServiceMock: OAuthService;
  let matSnackBarMock: any;
  let applicationDetailsServiceMock: any;
  let validAccessTokenMock: any;
  let tryLoginMock: any;
  const expectedOAuthConfig: AuthConfig = {
    loginUrl: 'https://discord.com/api/oauth2/authorize',
    tokenEndpoint: 'https://discord.com/api/oauth2/token',
    revocationEndpoint: 'https://discord.com/api/oauth2/revoke',
    redirectUri: window.location.origin,
    clientId: environment.discordClientId,
    responseType: 'code',
    scope: 'identify guilds',
    showDebugInformation: true,
    oidc: false,
    sessionChecksEnabled: true
  }
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    jest.resetAllMocks();
    await TestBed.configureTestingModule({
      declarations: [WelcomeDashboardComponent, ClashTournamentCalendarComponent],
      imports: [MatCardModule, MatIconModule, MatDatepickerModule, HttpClientTestingModule, MatNativeDateModule, WelcomeDashboardTestModule, MatProgressBarModule],
      providers: [OAuthService, UrlHelperService, OAuthLogger, DateTimeProvider, ApplicationDetailsService, ClashBotService, DiscordService, UserDetailsService, MatSnackBar]
    })
      .compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    clashBotMock = TestBed.inject(ClashBotService);
    discordServiceMock = TestBed.inject(DiscordService);
    userDetailsServiceMock = TestBed.inject(UserDetailsService);
    oAuthServiceMock = TestBed.inject(OAuthService);
    applicationDetailsServiceMock = TestBed.inject(ApplicationDetailsService);
    matSnackBarMock = TestBed.inject(MatSnackBar);
    validAccessTokenMock = jest.fn().mockReturnValueOnce(false);
    tryLoginMock = jest.fn();
    clashBotMock.getClashTournaments = jest.fn().mockReturnValue(of([]));
    oAuthServiceMock.hasValidAccessToken = validAccessTokenMock;
    oAuthServiceMock.tryLogin = tryLoginMock;
  });

  beforeEach(() => {
    sessionStorage.clear();
    httpMock.verify();
    validAccessTokenMock.mockReturnValueOnce(true);
  });

  test('should create', () => {
    fixture = TestBed.createComponent(WelcomeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  test('Should attempt to login upon load up if there has not been a Login Attempt', () => {
    fixture = TestBed.createComponent(WelcomeDashboardComponent);
    component = fixture.componentInstance;
    expect(component.loggedIn).toEqual('NOT_LOGGED_IN');
    fixture.detectChanges();
    expect(oAuthServiceMock.configure).toHaveBeenCalledTimes(1);
    expect(oAuthServiceMock.configure).toHaveBeenCalledWith(expectedOAuthConfig);
    expect(component.loggedIn).toEqual('LOGGED_IN');
  })

  test('Should attempt to login with existing tournaments Days upon load up if there has not been a Login Attempt', () => {
    testScheduler.run((helpers) => {
      const {cold, flush} = helpers;

      let mockTournaments: ClashTournaments[] = createMockTournaments();
      const expectedObservable = cold('-x|', {x: mockTournaments});
      const expectedApplicationDetails = cold('-x', {x: {}});

      clashBotMock.getClashTournaments = jest.fn().mockReturnValue(expectedObservable);
      applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(expectedApplicationDetails);

      fixture = TestBed.createComponent(WelcomeDashboardComponent);
      component = fixture.componentInstance;
      expect(component.loggedIn).toEqual('NOT_LOGGED_IN');
      fixture.detectChanges();

      expect(oAuthServiceMock.configure).toHaveBeenCalledTimes(1);
      expect(oAuthServiceMock.configure).toHaveBeenCalledWith(expectedOAuthConfig);
      expect(component.loggedIn).toEqual('LOGGED_IN');

      fixture.detectChanges();

      flush();

      expect(component.tournamentDays).toHaveLength(2);
      expect(component.dataLoaded).toBeTruthy();
      expect(component.loggedIn).toEqual('LOGGED_IN');
      expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith({ currentTournaments: mockTournaments });
    });
  })

  test('If login has been attempted, should then try to Login with the token and it is successful.', (done) => {
    sessionStorage.setItem('LoginAttempt', 'true');
    tryLoginMock.mockResolvedValue(true);
    let expectedUserObject = createMockUser();
    discordServiceMock.getUserDetails.mockReturnValue(of(expectedUserObject));
    let validateUserObject = (data: UserDetails) => {
      try {
        expect(data).toEqual(expectedUserObject);
        done();
      } catch (err) {
        done(err);
      }
    };
    userDetailsServiceMock.setUserDetails.mockImplementation(validateUserObject);
    fixture = TestBed.createComponent(WelcomeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(oAuthServiceMock.configure).toHaveBeenCalledTimes(1);
    expect(oAuthServiceMock.configure).toHaveBeenCalledWith(expectedOAuthConfig);
  })

  test('If login has been attempted and login will fail, should then try to Login with the token and call Snack Bar..', (done) => {
    sessionStorage.setItem('LoginAttempt', 'true');
    tryLoginMock.mockRejectedValue(new Error('Failed to login to Discord.'));
    let snackBarOpenImpl = (message: string, action: string, config: MatSnackBarConfig) => {
      try {
        expect(message).toEqual('Failed to login to discord.');
        expect(action).toEqual('X');
        expect(config).toEqual({duration: 5000});
        expect(component.loggedIn).toEqual('NOT_LOGGED_IN');
        done();
      } catch (err) {
        done(err);
      }
    };
    matSnackBarMock.open.mockImplementation(snackBarOpenImpl);
    fixture = TestBed.createComponent(WelcomeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(oAuthServiceMock.configure).toHaveBeenCalledTimes(1);
    expect(oAuthServiceMock.configure).toHaveBeenCalledWith(expectedOAuthConfig);
  })

  test('When loginToDiscord is called, it should call the initLoginFlow for the oauthService and should set a LoginAttempt in the sessionStorage.', () => {
    tryLoginMock.mockResolvedValue(true);
    let expectedUserObject = createMockUser();
    discordServiceMock.getUserDetails.mockReturnValue(of(expectedUserObject));
    fixture = TestBed.createComponent(WelcomeDashboardComponent);
    component = fixture.componentInstance;
    component.loginToDiscord();
    expect(oAuthServiceMock.initLoginFlow).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('LoginAttempt')).toBeTruthy();
  })

  describe('Set User Details', () => {
    test('When setUserDetails is called, it should invoke the call to discord to get the user details then push that into the User Details service then make a call to retrieve the Clash Bot User Details.', () => {
      testScheduler.run(helpers => {
        const { cold, flush } = helpers;

        let mockUser = createMockUser();
        let mockClashBotUser: ClashBotUserDetails = createMockClashBotUser(mockUser);
        mockClashBotUser.username = mockUser.username;
        let mockGuilds = mockDiscordGuilds();

        let coldObservable = cold('x|', {x: mockUser});
        let coldClashBotUserObs = cold('x|', {x: mockClashBotUser})
        let coldApplicationDetailsObs = cold('x|', {x: {}});
        const mockDiscordGuildsObs = cold('-x', {x: mockGuilds});

        discordServiceMock.getUserDetails.mockReturnValue(coldObservable);
        discordServiceMock.getGuilds.mockReturnValue(mockDiscordGuildsObs);
        clashBotMock.getUserDetails.mockReturnValue(coldClashBotUserObs);
        applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(coldApplicationDetailsObs);

        fixture = TestBed.createComponent(WelcomeDashboardComponent);
        component = fixture.componentInstance;

        component.setUserDetails();

        flush();

        expect(userDetailsServiceMock.setUserDetails).toHaveBeenCalledTimes(1);
        expect(userDetailsServiceMock.setUserDetails).toHaveBeenCalledWith(mockUser);
        expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUser.id);
        expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(1);
        expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith({defaultGuild: mockClashBotUser.serverName, userGuilds: mockGuilds});
        expect(clashBotMock.postUserDetails).not.toHaveBeenCalled();
        expect(component.loggedIn).toEqual('LOGGED_IN');
      })
    })

    test('If username does not exist in Clash Bot Service when setUserDetails is called, it should invoke the call to discord to get the user details then push that into the User Details service then make a call to retrieve the Clash Bot User Details and then subsequently push a new User record to the Clash Bot Service.', () => {
      testScheduler.run(helpers => {
        const { cold, flush } = helpers;

        let mockUser = createMockUser();
        let mockClashBotUser: any = { subscriptions: { UpcomingClashTournamentDiscordDM: false }};
        let mockGuilds = mockDiscordGuilds();
        let mockReturnedClashBotUser: ClashBotUserDetails = {
          id: mockUser.id,
          username: mockUser.username,
          serverName: mockGuilds[0].name,
          preferredChampions: [],
          subscriptions: { UpcomingClashTournamentDiscordDM: false }
        }

        let coldObservable = cold('x|', {x: mockUser});
        let coldClashBotUserObs = cold('x|', {x: mockClashBotUser})
        let coldApplicationDetailsObs = cold('x|', {x: {}});
        const mockDiscordGuildsObs = cold('-x', {x: mockGuilds});
        const mockSavedUserObs = cold('x|', {x: mockReturnedClashBotUser});

        discordServiceMock.getUserDetails.mockReturnValue(coldObservable);
        discordServiceMock.getGuilds.mockReturnValue(mockDiscordGuildsObs);
        clashBotMock.getUserDetails.mockReturnValue(coldClashBotUserObs);
        clashBotMock.postUserDetails.mockReturnValue(mockSavedUserObs);
        applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(coldApplicationDetailsObs);

        fixture = TestBed.createComponent(WelcomeDashboardComponent);
        component = fixture.componentInstance;

        component.setUserDetails();

        flush();

        expect(userDetailsServiceMock.setUserDetails).toHaveBeenCalledTimes(1);
        expect(userDetailsServiceMock.setUserDetails).toHaveBeenCalledWith(mockUser);
        expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUser.id);
        expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(1);
        expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith({ defaultGuild: mockClashBotUser.serverName, userGuilds: mockGuilds });
        expect(clashBotMock.postUserDetails).toHaveBeenCalledTimes(1);
        expect(clashBotMock.postUserDetails).toHaveBeenCalledWith(mockUser.id, mockGuilds[0].name, new Set<string>(), { 'UpcomingClashTournamentDiscordDM': false }, mockUser.username);
        expect(component.loggedIn).toEqual('LOGGED_IN');
      })
    })

    test('If username does not match the username in Clash Bot Service for the id when setUserDetails is called, it should invoke the call to discord to get the user details then push that into the User Details service then make a call to retrieve the Clash Bot User Details and then subsequently push a new User record to the Clash Bot Service.', () => {
      testScheduler.run(helpers => {
        const { cold, flush } = helpers;

        let mockUser = createMockUser();
        let mockGuilds = mockDiscordGuilds();
        let mockClashBotUser: ClashBotUserDetails = { id: mockUser.id, username: 'Different', serverName: mockGuilds[0].name, preferredChampions: [], subscriptions: { UpcomingClashTournamentDiscordDM: false }};
        let mockReturnedClashBotUser: ClashBotUserDetails = {
          id: mockUser.id,
          username: mockUser.username,
          serverName: mockGuilds[0].name,
          preferredChampions: [],
          subscriptions: { UpcomingClashTournamentDiscordDM: false }
        };

        let coldObservable = cold('x|', {x: mockUser});
        let coldClashBotUserObs = cold('x|', {x: mockClashBotUser})
        let coldApplicationDetailsObs = cold('x|', {x: {}});
        const mockDiscordGuildsObs = cold('-x', {x: mockGuilds});
        const mockSavedUserObs = cold('x|', {x: mockReturnedClashBotUser});

        discordServiceMock.getUserDetails.mockReturnValue(coldObservable);
        discordServiceMock.getGuilds.mockReturnValue(mockDiscordGuildsObs);
        clashBotMock.getUserDetails.mockReturnValue(coldClashBotUserObs);
        clashBotMock.postUserDetails.mockReturnValue(mockSavedUserObs);
        applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(coldApplicationDetailsObs);

        fixture = TestBed.createComponent(WelcomeDashboardComponent);
        component = fixture.componentInstance;

        component.setUserDetails();

        flush();

        expect(userDetailsServiceMock.setUserDetails).toHaveBeenCalledTimes(1);
        expect(userDetailsServiceMock.setUserDetails).toHaveBeenCalledWith(mockUser);
        expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUser.id);
        expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(1);
        expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith({ defaultGuild: mockClashBotUser.serverName, userGuilds: mockGuilds});
        expect(clashBotMock.postUserDetails).toHaveBeenCalledTimes(1);
        expect(clashBotMock.postUserDetails).toHaveBeenCalledWith(mockUser.id, mockGuilds[0].name, new Set<string>(), { 'UpcomingClashTournamentDiscordDM': false }, mockUser.username);
        expect(component.loggedIn).toEqual('LOGGED_IN');
      })
    })

    test('ERROR - Failed to update user details - A generic error message should be displayed and the user should be failed to login.', () => {
      testScheduler.run(helpers => {
        const { cold, flush } = helpers;

        let mockUser = createMockUser();
        let mockGuilds = mockDiscordGuilds();
        let mockClashBotUser: ClashBotUserDetails = { id: mockUser.id, username: 'Different', serverName: mockGuilds[0].name, preferredChampions: [], subscriptions: { UpcomingClashTournamentDiscordDM: false }};

        const expectedError =
          new HttpErrorResponse({
            error: 'Failed to make call.',
            headers: undefined,
            status: 400,
            statusText: 'Bad Request',
            url: 'https://localhost/api/user'
          });

        let coldObservable = cold('x|', {x: mockUser});
        let coldClashBotUserObs = cold('x|', {x: mockClashBotUser})
        let coldApplicationDetailsObs = cold('x|', {x: {}});
        const mockDiscordGuildsObs = cold('-x', {x: mockGuilds});
        const mockSavedUserObs = cold('#', undefined, expectedError);

        discordServiceMock.getUserDetails.mockReturnValue(coldObservable);
        discordServiceMock.getGuilds.mockReturnValue(mockDiscordGuildsObs);
        clashBotMock.getUserDetails.mockReturnValue(coldClashBotUserObs);
        clashBotMock.postUserDetails.mockReturnValue(mockSavedUserObs);
        applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(coldApplicationDetailsObs);

        fixture = TestBed.createComponent(WelcomeDashboardComponent);
        component = fixture.componentInstance;

        component.setUserDetails();

        flush();

        expect(userDetailsServiceMock.setUserDetails).toHaveBeenCalledTimes(1);
        expect(userDetailsServiceMock.setUserDetails).toHaveBeenCalledWith(mockUser);
        expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUser.id);
        expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
        expect(matSnackBarMock.open).toHaveBeenCalledWith('Oops, we see your discord username has changed. We failed to updated it. Please try to login again.', 'X', {duration: 5000});
        expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(1);
        expect(applicationDetailsServiceMock.setApplicationDetails).not.toHaveBeenCalled();
        expect(clashBotMock.postUserDetails).toHaveBeenCalledTimes(1);
        expect(clashBotMock.postUserDetails).toHaveBeenCalledWith(mockUser.id, mockGuilds[0].name, new Set<string>(), { 'UpcomingClashTournamentDiscordDM': false }, mockUser.username);
        expect(component.loggedIn).toEqual('NOT_LOGGED_IN');
      })
    })
  })

});

function mockDiscordGuilds() {
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
    "icon": null,
    "owner": true,
    "permissions": 2147483647,
    "features": [],
    "permissions_new": "274877906943"
  }];
}

function createMockTournaments() {
  return [
    {
      "tournamentName": "bandle_city",
      "tournamentDay": "3",
      "startTime": "August 21 2021 07:00 pm PDT",
      "registrationTime": "August 21 2021 04:15 pm PDT"
    },
    {
      "tournamentName": "bandle_city",
      "tournamentDay": "4",
      "startTime": "August 22 2021 07:00 pm PDT",
      "registrationTime": "August 22 2021 04:15 pm PDT"
    }
  ];
}

function createMockUser() {
  return {
    "id": "299370234228506627",
    "username": "Roïdräge",
    "avatar": "4393f322cfd8882c2d74648ad321c1eb",
    "discriminator": "2657",
    "public_flags": 0,
    "flags": 0,
    "banner": null,
    "banner_color": "#eb0000",
    "accent_color": 15400960,
    "locale": "en-US",
    "mfa_enabled": false
  };
}

function createMockClashBotUser(mockUser: { banner_color: string; accent_color: number; flags: number; banner: null; mfa_enabled: boolean; id: string; avatar: string; public_flags: number; locale: string; username: string; discriminator: string }) {
  return {
    preferredChampions: [],
    username: 'Some User',
    subscriptions: {},
    id: mockUser.id,
    serverName: 'GoonSquad'
  };
}
