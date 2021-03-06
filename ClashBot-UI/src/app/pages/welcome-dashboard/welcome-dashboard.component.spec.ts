import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WelcomeDashboardComponent} from './welcome-dashboard.component';
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {ClashTournamentCalendarComponent} from "../../clash-tournament-calendar/clash-tournament-calendar.component";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {AuthConfig, DateTimeProvider, OAuthLogger, OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {ClashBotService} from "../../services/clash-bot.service";
import {DiscordService} from "../../services/discord.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {of} from "rxjs";
import {MatNativeDateModule} from "@angular/material/core";
import {
    ClashTournamentCalendarHeaderComponent
} from "../../clash-tournament-calendar-header/clash-tournament-calendar-header.component";
import {NgModule} from "@angular/core";
import {environment} from "../../../environments/environment";
import {MatSnackBarConfig} from "@angular/material/snack-bar/snack-bar-config";
import {TestScheduler} from "rxjs/testing";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {ClashTournaments} from "../../interfaces/clash-tournaments";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {
    UpcomingTournamentDetailsCardComponent
} from "../../upcoming-tournament-details-card/upcoming-tournament-details-card.component";
import {MatListModule} from "@angular/material/list";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {
    ReleaseNotificationDialogComponent
} from "../../dialogs/release-notification-dialog/release-notification-dialog.component";
import {MarkdownModule} from "ngx-markdown";
import {
    copyObject, create400HttpError, create429HttpError,
    createMockClashBotUserDetails,
    createMockGuilds, createMockUserDetails,
    setupLoggedOutMockApplicationDetails
} from "../../shared/shared-test-mocks.spec";
import {ApplicationDetails} from "../../interfaces/application-details";
import {SharedModule} from "../../shared/shared.module";

jest.mock("angular-oauth2-oidc");
jest.mock("../../services/clash-bot.service");
jest.mock("../../services/discord.service");
jest.mock("../../services/application-details.service");
jest.mock("@angular/material/snack-bar");

@NgModule({
    declarations: [ClashTournamentCalendarHeaderComponent, ReleaseNotificationDialogComponent],
    entryComponents: [ClashTournamentCalendarHeaderComponent, ReleaseNotificationDialogComponent],
    imports: [MatIconModule, MatDialogModule, MarkdownModule.forRoot()]
})
class WelcomeDashboardTestModule {
}

describe('WelcomeDashboardComponent', () => {
    let component: WelcomeDashboardComponent;
    let fixture: ComponentFixture<WelcomeDashboardComponent>;
    let httpMock: HttpTestingController;
    let clashBotMock: any;
    let discordServiceMock: any;
    let oAuthServiceMock: OAuthService;
    let matSnackBarMock: any;
    let applicationDetailsServiceMock: any;
    let validAccessTokenMock: any;
    let tryLoginMock: any;
    let matDialogMock: any;
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
        sessionChecksEnabled: true,
        customQueryParams: {
            prompt: "none"
        },
    };
    let testScheduler: TestScheduler;

    beforeEach(async () => {
        testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
        jest.resetAllMocks();
        await TestBed.configureTestingModule({
            declarations: [WelcomeDashboardComponent, ClashTournamentCalendarComponent, UpcomingTournamentDetailsCardComponent],
            imports: [MatCardModule,
                MatIconModule,
                MatDatepickerModule,
                HttpClientTestingModule,
                MatNativeDateModule,
                WelcomeDashboardTestModule,
                MatProgressBarModule,
                MatListModule,
                MatDialogModule,
                SharedModule,
                BrowserAnimationsModule],
            providers: [OAuthService, UrlHelperService, OAuthLogger, DateTimeProvider, ApplicationDetailsService, ClashBotService, DiscordService, MatSnackBar, MatDialog]
        })
            .compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
        clashBotMock = TestBed.inject(ClashBotService);
        discordServiceMock = TestBed.inject(DiscordService);
        oAuthServiceMock = TestBed.inject(OAuthService);
        applicationDetailsServiceMock = TestBed.inject(ApplicationDetailsService);
        matSnackBarMock = TestBed.inject(MatSnackBar);
        matDialogMock = TestBed.inject(MatDialog);
        validAccessTokenMock = jest.fn().mockReturnValueOnce(false);
        tryLoginMock = jest.fn();
        clashBotMock.getClashTournaments = jest.fn().mockReturnValue(of([]));
        oAuthServiceMock.hasValidAccessToken = validAccessTokenMock;
        oAuthServiceMock.tryLogin = tryLoginMock;
    });

    beforeEach(() => {
        localStorage.clear();
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

    describe('Release Notification', () => {
        test('Should display the Release Notification dialog box if there is not a Release Notification version in local storage.', () => {
            jest.spyOn(matDialogMock, 'open');
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(matDialogMock.open).toHaveBeenCalledTimes(1);
            expect(localStorage.getItem('version')).toEqual(environment.version);
        })

        test('Should NOT display the Release Notification dialog box if there is a Release Notification version in local storage matching the one in the Environment and should then set the environment version into the local storage under version.', () => {
            environment.version = '1';
            localStorage.setItem('version', '1');
            jest.spyOn(matDialogMock, 'open');
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(matDialogMock.open).toHaveBeenCalledTimes(0);
        })

        test('Should display the Release Notification dialog box if there is a Release Notification version in local storage not matching the one in the Environment.', () => {
            environment.version = '2';
            localStorage.setItem('version', '1');
            jest.spyOn(matDialogMock, 'open');
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(matDialogMock.open).toHaveBeenCalledTimes(1);
            expect(localStorage.getItem('version')).toEqual('2');
        })
    })

    describe('On Init', () => {
        test('Should attempt to login upon load up if there has not been a Login Attempt', () => {
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            expect(component.loggedIn).toEqual('NOT_LOGGED_IN');
            fixture.detectChanges();
            expect(oAuthServiceMock.configure).toHaveBeenCalledTimes(1);
            expect(oAuthServiceMock.configure).toHaveBeenCalledWith(expectedOAuthConfig);
            expect(component.loggedIn).toEqual('LOGGED_IN');
        })

        test('(Load Tournaments when not logged in) - Should attempt to login with existing Tournament Days upon load up if there has not been a Login Attempt', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;

                let mockTournaments: ClashTournaments[] = createMockTournaments();
                clashBotMock.getClashTournaments = jest.fn().mockReturnValue(cold('-x|', {x: mockTournaments}));
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold('-x', {x: setupLoggedOutMockApplicationDetails()}));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;
                expect(component.loggedIn).toEqual('NOT_LOGGED_IN');
                fixture.detectChanges();

                expect(oAuthServiceMock.configure).toHaveBeenCalledTimes(1);
                expect(oAuthServiceMock.configure).toHaveBeenCalledWith(expectedOAuthConfig);
                expect(component.loggedIn).toEqual('LOGGED_IN');

                fixture.detectChanges();

                flush();

                let expectedTournamentsList: ClashTournaments[] = copyObject(mockTournaments);
                expectedTournamentsList.sort((a, b) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                expect(component.tournamentDays).toHaveLength(2);
                expect(component.dataLoaded).toBeTruthy();
                expect(component.loggedIn).toEqual('LOGGED_IN');
                expect(applicationDetailsServiceMock.setApplicationDetails)
                    .toHaveBeenCalledWith({
                        currentTournaments: expectedTournamentsList,
                        loggedIn: false
                    });
            });
        })

        test('If login has been attempted, should then try to Login with the token and it is successful.', () => {
            sessionStorage.setItem('LoginAttempt', 'true');
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;
                tryLoginMock.mockResolvedValue(true);
                let expectedUserObject = createMockUser();
                let mockClashBotUser = createMockClashBotUserDetails();
                mockClashBotUser.username = expectedUserObject.username;
                let mockGuilds = createMockGuilds();

                // discordServiceMock.getUserDetails.mockReturnValue(cold('x|', {x: expectedUserObject}));
                discordServiceMock.getUserDetails.mockReturnValue(cold('#|', {x: expectedUserObject}, create400HttpError()));
                discordServiceMock.getGuilds.mockReturnValue(cold('x|', {x: mockGuilds}));
                clashBotMock.getUserDetails.mockReturnValue(cold('x|', {x: {}}));
                clashBotMock.postUserDetails.mockReturnValue(cold('x|', {x: mockClashBotUser}));
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold('-x', {x: setupLoggedOutMockApplicationDetails()}));


                component.ngOnInit();

                flush();

                expect(oAuthServiceMock.configure).toHaveBeenCalledTimes(1);
                expect(oAuthServiceMock.configure).toHaveBeenCalledWith(expectedOAuthConfig);
                expect(tryLoginMock).toHaveBeenCalledTimes(1);
            })
        })

        test('If login has been attempted and login will fail, should then try to Login with the token and call Snack Bar..', (done) => {
            sessionStorage.setItem('LoginAttempt', 'true');
            tryLoginMock.mockRejectedValue(create400HttpError());
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
    })

    describe('Set User Details', () => {
        test('(Brand new User) - it should invoke the call to discord to get the user details and guilds, then make a call to retrieve the Clash Bot User Details, then make a call with the details to Clash Bot Service, then push that into the App Details service.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                let mockUser = createMockUser();
                let mockClashBotUser = createMockClashBotUserDetails();
                mockClashBotUser.username = mockUser.username;
                let mockGuilds = createMockGuilds();

                discordServiceMock.getUserDetails.mockReturnValue(cold('x|', {x: mockUser}));
                discordServiceMock.getGuilds.mockReturnValue(cold('x|', {x: mockGuilds}));
                clashBotMock.getUserDetails.mockReturnValue(cold('x|', {x: {}}));
                clashBotMock.postUserDetails.mockReturnValue(cold('x|', {x: mockClashBotUser}));
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold('-x', {x: setupLoggedOutMockApplicationDetails()}));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                const expectedApplicationDetails: ApplicationDetails = {
                    defaultGuild: mockClashBotUser.serverName,
                    userGuilds: mockGuilds,
                    clashBotUserDetails: mockClashBotUser,
                    userDetails: mockUser,
                    loggedIn: true
                };

                expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUser.id);
                expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(1);
                expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith(expectedApplicationDetails);
                expect(clashBotMock.postUserDetails).toHaveBeenCalledTimes(1);
                expect(clashBotMock.postUserDetails).toHaveBeenCalledWith(
                    mockUser.id,
                    mockGuilds[0].name,
                    new Set<string>(),
                    {'UpcomingClashTournamentDiscordDM': false},
                    mockUser.username
                );
                expect(component.loggedIn).toEqual('LOGGED_IN');
            })
        })

        test('(Existing User) - it should invoke the call to discord to get the user details then push that into the Applications Details service then make a call to retrieve the Clash Bot User Details.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                let mockUser = createMockUserDetails();
                let mockClashBotUser = createMockClashBotUserDetails();
                let mockGuilds = createMockGuilds();

                discordServiceMock.getUserDetails.mockReturnValue(cold('x|', {x: mockUser}));
                discordServiceMock.getGuilds.mockReturnValue(cold('x|', {x: mockGuilds}));
                clashBotMock.getUserDetails.mockReturnValue(cold('x|', {x: mockClashBotUser}));
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold('-x', {x: setupLoggedOutMockApplicationDetails()}));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                const expectedApplicationDetails: ApplicationDetails = {
                    defaultGuild: mockClashBotUser.serverName,
                    userGuilds: mockGuilds,
                    clashBotUserDetails: mockClashBotUser,
                    userDetails: mockUser,
                    loggedIn: true
                };

                expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUser.id);
                expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(1);
                expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith(expectedApplicationDetails);
                expect(clashBotMock.postUserDetails).not.toHaveBeenCalled();
                expect(component.loggedIn).toEqual('LOGGED_IN');
            })
        })

        test('(Existing User with mismatched name) - it should invoke the call to discord to get the user details then push that into the Applications Details service then make a call to retrieve the Clash Bot User Details.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                let mockUser = createMockUser();
                mockUser.username = 'The Boas';
                let mockClashBotUser = createMockClashBotUserDetails();
                let mockGuilds = createMockGuilds();

                discordServiceMock.getUserDetails.mockReturnValue(cold('x|', {x: mockUser}));
                discordServiceMock.getGuilds.mockReturnValue(cold('x|', {x: mockGuilds}));
                clashBotMock.getUserDetails.mockReturnValue(cold('x|', {x: mockClashBotUser}));
                clashBotMock.postUserDetails.mockReturnValue(cold('x|', {x: mockClashBotUser}));
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold('-x', {x: setupLoggedOutMockApplicationDetails()}));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                const expectedApplicationDetails: ApplicationDetails = {
                    defaultGuild: mockClashBotUser.serverName,
                    userGuilds: mockGuilds,
                    clashBotUserDetails: mockClashBotUser,
                    userDetails: mockUser,
                    loggedIn: true
                };

                expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUser.id);
                expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(1);
                expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith(expectedApplicationDetails);
                expect(clashBotMock.postUserDetails).toHaveBeenCalledTimes(1);
                expect(clashBotMock.postUserDetails).toHaveBeenCalledWith(
                    mockUser.id,
                    mockGuilds[0].name,
                    new Set<string>(),
                    {'UpcomingClashTournamentDiscordDM': false},
                    mockUser.username
                );
                expect(component.loggedIn).toEqual('LOGGED_IN');
            })
        })

        test('(Discord User Details API call fails) - it should invoke a mat snack bar with a generic error message and not be logged in.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                discordServiceMock.getUserDetails.mockReturnValue(cold('#|', undefined, create400HttpError()));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
                expect(discordServiceMock.getGuilds).not.toHaveBeenCalled();
                expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
                expect(matSnackBarMock.open).toHaveBeenCalledWith(
                    'Oops, we failed to retrieve your details from Discord. Please try logging in again.',
                    'X',
                    {duration: 5000});
                expect(clashBotMock.getUserDetails).not.toHaveBeenCalled();
                expect(clashBotMock.postUserDetails).not.toHaveBeenCalled();
            })
        })

        test('(Retry 3 times Discord User Details API call fails with 429) - it should invoke a mat snack bar with a generic error message and not be logged in.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                discordServiceMock.getUserDetails.mockReturnValue(cold('#-#-#|', undefined, create429HttpError()));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
                expect(discordServiceMock.getGuilds).not.toHaveBeenCalled();
                expect(matSnackBarMock.open).toHaveBeenCalledTimes(3);
                expect(matSnackBarMock.open).toHaveBeenCalledWith(
                    'Retrying to retrieve your details after 10ms...',
                    'X',
                    {duration: 5000});
                expect(clashBotMock.getUserDetails).not.toHaveBeenCalled();
                expect(clashBotMock.postUserDetails).not.toHaveBeenCalled();
            })
        })

        test('(Discord Guilds API fails) - it should invoke a mat snack bar with a generic error message and not be logged in.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                discordServiceMock.getUserDetails.mockReturnValue(cold('x|', {x: createMockUserDetails()}));
                discordServiceMock.getGuilds.mockReturnValue(cold('#|', undefined, create400HttpError()));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
                expect(discordServiceMock.getGuilds).toHaveBeenCalledTimes(1);
                expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
                expect(matSnackBarMock.open).toHaveBeenCalledWith(
                    'Failed to retrieve your discord server details. Please try logging in again.',
                    'X',
                    {duration: 5000});
                expect(clashBotMock.getUserDetails).not.toHaveBeenCalled();
                expect(clashBotMock.postUserDetails).not.toHaveBeenCalled();
            })
        })

        test('(Retry 3 times Discord Guilds API fails with 429) - it should invoke a mat snack bar with a generic error message and not be logged in.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                discordServiceMock.getUserDetails.mockReturnValue(cold('x|', {x: createMockUserDetails()}));
                discordServiceMock.getGuilds.mockReturnValue(cold('#-#-#|', undefined, create429HttpError()));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
                expect(discordServiceMock.getGuilds).toHaveBeenCalledTimes(1);
                expect(matSnackBarMock.open).toHaveBeenCalledTimes(3);
                expect(matSnackBarMock.open).toHaveBeenCalledWith(
                    'Retrying to retrieve your server details after 10ms...',
                    'X',
                    {duration: 5000});
                expect(clashBotMock.getUserDetails).not.toHaveBeenCalled();
                expect(clashBotMock.postUserDetails).not.toHaveBeenCalled();
            })
        })

        test('(Clash Bot Service get user details call API fails) - it should invoke a mat snack bar with a generic error message and not be logged in.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                let mockUserDetails = createMockUserDetails();
                discordServiceMock.getUserDetails.mockReturnValue(cold('x|', {x: mockUserDetails}));
                discordServiceMock.getGuilds.mockReturnValue(cold('x|', {x: createMockGuilds()}));
                clashBotMock.getUserDetails.mockReturnValue(cold('#|', undefined, create400HttpError()));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
                expect(discordServiceMock.getGuilds).toHaveBeenCalledTimes(1);
                expect(clashBotMock.getUserDetails).toHaveBeenCalledTimes(1);
                expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUserDetails.id);
                expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
                expect(matSnackBarMock.open).toHaveBeenCalledWith(
                    'Oops, we failed to pull your userDetails from our Servers :( Please try again later.',
                    'X',
                    {duration: 5000});
                expect(clashBotMock.postUserDetails).not.toHaveBeenCalled();
            })
        })

        test('(Clash Bot Service post user details call API fails) - it should invoke a mat snack bar with a generic error message and not be logged in.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                let mockUserDetails = createMockUserDetails();
                mockUserDetails.username = "Pompous Loaf";
                let mockGuilds = createMockGuilds();
                discordServiceMock.getUserDetails.mockReturnValue(cold('x|', {x: mockUserDetails}));
                discordServiceMock.getGuilds.mockReturnValue(cold('x|', {x: mockGuilds}));
                clashBotMock.getUserDetails.mockReturnValue(cold('x|', {x: createMockClashBotUserDetails()}));
                clashBotMock.postUserDetails.mockReturnValue(cold('#|', undefined, create400HttpError()));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.setUserDetails();

                flush();

                expect(discordServiceMock.getUserDetails).toHaveBeenCalledTimes(1);
                expect(discordServiceMock.getGuilds).toHaveBeenCalledTimes(1);
                expect(clashBotMock.getUserDetails).toHaveBeenCalledTimes(1);
                expect(clashBotMock.getUserDetails).toHaveBeenCalledWith(mockUserDetails.id);
                expect(clashBotMock.postUserDetails).toHaveBeenCalledTimes(1);
                expect(clashBotMock.postUserDetails).toHaveBeenCalledWith(
                    mockUserDetails.id,
                    mockGuilds[0].name,
                    new Set<string>(),
                    {'UpcomingClashTournamentDiscordDM': false},
                    mockUserDetails.username
                );
                expect(matSnackBarMock.open).toHaveBeenCalledTimes(1);
                expect(matSnackBarMock.open).toHaveBeenCalledWith(
                    'Oops, we see your discord username has changed. We failed to updated it. Please try to login again.',
                    'X',
                    {duration: 5000});
            })
        })
    })

});

function createMockTournaments() {
    return [
        {
            "tournamentName": "bandle_city",
            "tournamentDay": "3",
            "startTime": "August 22 2021 07:00 pm PDT",
            "registrationTime": "August 22 2021 04:15 pm PDT"
        },
        {
            "tournamentName": "bandle_city",
            "tournamentDay": "4",
            "startTime": "June 21 2021 07:00 pm PDT",
            "registrationTime": "June 21 2021 04:15 pm PDT"
        }
    ];
}

function createMockUser() {
    return {
        id: 299370234228506627,
        "username": "Ro??dr??ge",
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
