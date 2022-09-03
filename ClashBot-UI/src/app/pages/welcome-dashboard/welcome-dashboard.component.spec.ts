import {ComponentFixture, TestBed} from "@angular/core/testing";
import {WelcomeDashboardComponent} from "./welcome-dashboard.component";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {ClashTournamentCalendarComponent} from "../../clash-tournament-calendar/clash-tournament-calendar.component";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {DateTimeProvider, OAuthLogger, OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {DiscordService} from "../../services/discord.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatNativeDateModule} from "@angular/material/core";
import {
    ClashTournamentCalendarHeaderComponent
} from "../../clash-tournament-calendar-header/clash-tournament-calendar-header.component";
import {NgModule} from "@angular/core";
import {environment} from "../../../environments/environment";
import {MatSnackBarConfig} from "@angular/material/snack-bar/snack-bar-config";
import {TestScheduler} from "rxjs/testing";
import {ApplicationDetailsService} from "../../services/application-details.service";
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
  create400HttpError,
  create404HttpError,
  create429HttpError,
  createMockGuilds,
  createMockPlayer,
  createMockUserDetails, mockDiscordGuilds,
  setupLoggedOutMockApplicationDetails
} from "../../shared/shared-test-mocks.spec";
import {ApplicationDetails} from "../../interfaces/application-details";
import {SharedModule} from "../../shared/shared.module";
import {Tournament, TournamentService, UserService} from "clash-bot-service-api";
import {LoginStatus} from "../../login-status";
import {cold} from "jest-marbles";
import {DiscordGuild} from "../../interfaces/discord-guild";

jest.mock("angular-oauth2-oidc");
jest.mock("clash-bot-service-api");
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

describe("WelcomeDashboardComponent", () => {
    let component: WelcomeDashboardComponent;
    let fixture: ComponentFixture<WelcomeDashboardComponent>;
    let httpMock: HttpTestingController;
    let urlHelperServiceMock: UrlHelperService;
    let tournamentServiceMock: TournamentService;
    let userServiceMock: UserService;
    let discordServiceMock: any;
    let oAuthServiceMock: OAuthService;
    let matSnackBarMock: any;
    let applicationDetailsServiceMock: any;
    let validAccessTokenMock: any;
    let tryLoginMock: any;
    let matDialogMock: any;
    let testScheduler: TestScheduler;

    beforeEach(async () => {
        testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
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
            providers: [OAuthService, UrlHelperService, OAuthLogger, DateTimeProvider, ApplicationDetailsService, UserService, TournamentService, DiscordService, MatSnackBar, MatDialog]
        })
            .compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
        urlHelperServiceMock = TestBed.inject(UrlHelperService);
        tournamentServiceMock = TestBed.inject(TournamentService);
        userServiceMock = TestBed.inject(UserService);
        discordServiceMock = TestBed.inject(DiscordService);
        oAuthServiceMock = TestBed.inject(OAuthService);
        applicationDetailsServiceMock = TestBed.inject(ApplicationDetailsService);
        matSnackBarMock = TestBed.inject(MatSnackBar);
        matDialogMock = TestBed.inject(MatDialog);
        validAccessTokenMock = jest.fn().mockReturnValueOnce(false);
        tryLoginMock = jest.fn();
        oAuthServiceMock.hasValidAccessToken = validAccessTokenMock;
        oAuthServiceMock.tryLogin = tryLoginMock;
    });

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        httpMock.verify();
        validAccessTokenMock.mockReturnValueOnce(true);
    });

    function setupBaseWindowQueryParams() {
        global.window = Object.create(window);
        const url = "http://dummy.com";
        Object.defineProperty(window, "location", {
            value: {
                href: url,
                search: "?iam=shooketh",
                origin: "http://localhost"
            }
        });
        (urlHelperServiceMock.parseQueryString as any).mockReturnValue({
            iam: "shooketh"
        });
    }

    function setupAfterAuthorizationWindowQueryParams() {
        global.window = Object.create(window);
        const url = "http://dummy.com";
        Object.defineProperty(window, "location", {
            value: {
                href: url,
                search: "?code=abc123&state=cba321",
                origin: "http://localhost"
            }
        });
        (urlHelperServiceMock.parseQueryString as any).mockReturnValue({
            code: "abc123",
            state: "cba321"
        });
    }

    test("should create", () => {
        setupBaseWindowQueryParams();
        applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold(""));
        applicationDetailsServiceMock.getApplicationDetails.mockReturnValueOnce({
            asObservable: jest.fn().mockImplementationOnce(() => cold(""))
        });
        fixture = TestBed.createComponent(WelcomeDashboardComponent);
        component = fixture.componentInstance;
        (tournamentServiceMock.getTournaments as any).mockReturnValue({
            pipe: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis()
        });
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe("Release Notification", () => {
        test("Should display the Release Notification dialog box if there is not a Release Notification version in local storage.", () => {
            setupBaseWindowQueryParams();
            applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold(""));
            applicationDetailsServiceMock.getApplicationDetails.mockReturnValueOnce({
                asObservable: jest.fn().mockImplementationOnce(() => cold(""))
            });
            jest.spyOn(matDialogMock, "open");
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            (tournamentServiceMock.getTournaments as any).mockReturnValue({
                pipe: jest.fn().mockReturnThis(),
                subscribe: jest.fn().mockReturnThis()
            });
            fixture.detectChanges();
            expect(matDialogMock.open).toHaveBeenCalledTimes(1);
            expect(localStorage.getItem("version")).toEqual(environment.version);
        })

        test("Should NOT display the Release Notification dialog box if there is a Release Notification version in local storage matching the one in the Environment and should then set the environment version into the local storage under version.", () => {
            setupBaseWindowQueryParams();
            applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold(""));
            applicationDetailsServiceMock.getApplicationDetails.mockReturnValueOnce({
                asObservable: jest.fn().mockImplementationOnce(() => cold(""))
            });
            environment.version = "1";
            localStorage.setItem("version", "1");
            jest.spyOn(matDialogMock, "open");
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            (tournamentServiceMock.getTournaments as any).mockReturnValue({
                pipe: jest.fn().mockReturnThis(),
                subscribe: jest.fn().mockReturnThis()
            })
            fixture.detectChanges();
            expect(matDialogMock.open).toHaveBeenCalledTimes(0);
        })

        test("Should display the Release Notification dialog box if there is a Release Notification version in local storage not matching the one in the Environment.", () => {
            setupBaseWindowQueryParams();
            applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold(""));
            applicationDetailsServiceMock.getApplicationDetails.mockReturnValueOnce({
                asObservable: jest.fn().mockImplementationOnce(() => cold(""))
            });
            environment.version = "2";
            localStorage.setItem("version", "1");
            jest.spyOn(matDialogMock, "open");
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            (tournamentServiceMock.getTournaments as any).mockReturnValue({
                pipe: jest.fn().mockReturnThis(),
                subscribe: jest.fn().mockReturnThis()
            })
            fixture.detectChanges();
            expect(matDialogMock.open).toHaveBeenCalledTimes(1);
            expect(localStorage.getItem("version")).toEqual("2");
        })
    })

    function setupEmptyApplicationDetailsForInit() {
        applicationDetailsServiceMock.getApplicationDetails.mockReturnValueOnce({
            asObservable: jest.fn().mockImplementationOnce(() => cold(""))
        });
    }

    describe("On Init", () => {
        test("(Initial Load up) - Should configure oauth2 config upon load up but not try to login if code and state are not in the url.", () => {
            setupBaseWindowQueryParams();
            applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold(""));
            applicationDetailsServiceMock.getApplicationDetails.mockReturnValueOnce({
                asObservable: jest.fn().mockImplementationOnce(() => cold(""))
            });
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            (tournamentServiceMock.getTournaments as any).mockReturnValue({
                pipe: jest.fn().mockReturnThis(),
                subscribe: jest.fn().mockReturnThis()
            })
            fixture.detectChanges();
        })

        test("(Load Tournaments when not logged in) - Should attempt to login with existing Tournament Days upon load up if there has not been a Login Attempt", () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                setupBaseWindowQueryParams();
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold("-x", {x: setupLoggedOutMockApplicationDetails()}));
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValueOnce({
                    asObservable: jest.fn().mockImplementationOnce(() => cold(""))
                });

                fixture = TestBed.createComponent(WelcomeDashboardComponent);

                let mockTournaments: Tournament[] = createMockTournaments();
                (tournamentServiceMock.getTournaments as any).mockReturnValue(cold("-x|", {x: mockTournaments}));
                tryLoginMock.mockResolvedValue(true);
                component = fixture.componentInstance;

                fixture.detectChanges();

                flush();
                expect(component.tournamentDays).toHaveLength(2);
                expect(component.dataLoaded).toBeTruthy();
                expect(tryLoginMock).not.toHaveBeenCalled();
                expect(applicationDetailsServiceMock.setApplicationDetails)
                    .toHaveBeenCalledWith({
                        currentTournaments: mockTournaments,
                        loggedIn: false,
                        loginStatus: LoginStatus.NOT_LOGGED_IN
                    });
            });
        })

        test("(After Auth Code retrieved) - should invoke Clash Bot Auth and set up Application Details.", () => {
            sessionStorage.setItem("LoginAttempt", "true");
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValueOnce({
                    asObservable: jest.fn().mockImplementationOnce(() => cold(""))
                });
                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;
                tryLoginMock.mockResolvedValue(true);
                let expectedUserObject = createMockUser();
                let mockClashBotUser = createMockPlayer();
                mockClashBotUser.name = expectedUserObject.username;
                let mockGuilds = createMockGuilds();

                let mockTournaments: Tournament[] = createMockTournaments();
                (tournamentServiceMock.getTournaments as any).mockReturnValue(cold("-x|", {x: mockTournaments}));
                discordServiceMock.getUserDetails.mockReturnValue(cold("#|", {x: expectedUserObject}, create400HttpError()));
                discordServiceMock.getGuilds.mockReturnValue(cold("x|", {x: mockGuilds}));
                (userServiceMock.getUser as any).mockReturnValue(cold("x|", {x: {}}));
                (userServiceMock.updateUser as any).mockReturnValue(cold("x|", {x: mockClashBotUser}));
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold("-x", {x: setupLoggedOutMockApplicationDetails()}));
                setupAfterAuthorizationWindowQueryParams();

                component.ngOnInit();

                flush();

                expect(applicationDetailsServiceMock.loggingIn).toHaveBeenCalledTimes(1);
                expect(tryLoginMock).toHaveBeenCalledTimes(1);
            })
        })

        test("(Failure to Authorize Clash Bot) If there is a failure with getting authorization from Discord from the user, then a snack bar should be triggered.", (done) => {
            setupAfterAuthorizationWindowQueryParams();
            setupEmptyApplicationDetailsForInit();
            tryLoginMock.mockRejectedValue(create400HttpError());
            (tournamentServiceMock.getTournaments as any).mockReturnValue({
                pipe: jest.fn().mockReturnThis(),
                subscribe: jest.fn().mockReturnThis()
            })
            let snackBarOpenImpl = (message: string, action: string, config: MatSnackBarConfig) => {
                try {
                    expect(applicationDetailsServiceMock.logOutUser).toHaveBeenCalledTimes(1);
                    expect(message).toEqual("Failed to get authorization from Discord.");
                    expect(action).toEqual("X");
                    expect(config).toEqual({duration: 5000});
                    done();
                } catch (err) {
                    done(err);
                }
            };
            matSnackBarMock.open.mockImplementation(snackBarOpenImpl);
            fixture = TestBed.createComponent(WelcomeDashboardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        })
    })

    describe("Set User Details", () => {
        test("(Brand new User) - it should invoke the call to discord to get the user details and guilds, then make a call to retrieve the Clash Bot User Details, then make a call with the details to Clash Bot Service, then push that into the App Details service.", () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                let mockUser = createMockUser();
                let mockClashBotUser = createMockPlayer();
                mockClashBotUser.name = mockUser.username;
                let mockGuilds = mockDiscordGuilds();
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
                mockClashBotUser.serverId = mockGuilds[0].id
                discordServiceMock.getUserDetails.mockReturnValue(cold("x|", {x: mockUser}));
                discordServiceMock.getGuilds.mockReturnValue(cold("x|", {x: mockGuilds}));
                (userServiceMock.getUser as any).mockReturnValue(cold("#|", undefined, create404HttpError()));
                (userServiceMock.createUser as any).mockReturnValue(cold("x|", {x: mockClashBotUser}));
                applicationDetailsServiceMock.getApplicationDetails.mockReturnValue(cold("-x", {x: setupLoggedOutMockApplicationDetails()}));
                setupEmptyApplicationDetailsForInit();

                const expectedGuilds = [...mockGuilds, freeAgentGuild];
                expectedGuilds.forEach(guild => guildMap.set(guild.id, guild));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

                flush();

                const expectedApplicationDetails: ApplicationDetails = {
                    defaultGuild: mockGuilds[0],
                    userGuilds: guildMap,
                    clashBotUserDetails: mockClashBotUser,
                    userDetails: mockUser,
                    loggedIn: true,
                    loginStatus: LoginStatus.LOGGED_IN
                };

                expect(userServiceMock.getUser).toHaveBeenCalledWith(`${mockUser.id}`);
                expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(2);
                expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith(expectedApplicationDetails);
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
                let mockGuilds = mockDiscordGuilds();
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

                discordServiceMock.getUserDetails.mockReturnValue(cold("x|", {x: mockUser}));
                discordServiceMock.getGuilds.mockReturnValue(cold("x|", {x: mockGuilds}));
                (userServiceMock.getUser as any).mockReturnValue(cold("x|", {x: mockClashBotUser}));
                applicationDetailsServiceMock
                    .getApplicationDetails
                    .mockReturnValue(cold(
                        "-x",
                        {x: setupLoggedOutMockApplicationDetails()}
                    ));
                setupEmptyApplicationDetailsForInit();

                const expectedGuilds = [...mockGuilds, freeAgentGuild];
                expectedGuilds.forEach(guild => guildMap.set(guild.id, guild));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

                flush();

                const expectedApplicationDetails: ApplicationDetails = {
                    defaultGuild: guildMap.get(<string>mockClashBotUser.serverId),
                    userGuilds: guildMap,
                    clashBotUserDetails: mockClashBotUser,
                    userDetails: mockUser,
                    loggedIn: true,
                    loginStatus: LoginStatus.LOGGED_IN
                };

                expect(userServiceMock.getUser).toHaveBeenCalledWith(`${mockUser.id}`);
                expect(applicationDetailsServiceMock.getApplicationDetails)
                    .toHaveBeenCalledTimes(2);
                expect(applicationDetailsServiceMock.setApplicationDetails)
                    .toHaveBeenCalledWith(expectedApplicationDetails);
                expect(userServiceMock.updateUser).not.toHaveBeenCalled();
            })
        })

        test("(Existing User with mismatched name) - it should invoke the call to discord to get the user details then push that into the Applications Details service then make a call to retrieve the Clash Bot User Details.", () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;

                let mockUser = createMockUser();
                mockUser.username = "The Boas";
                let mockClashBotUser = createMockPlayer();
                let mockGuilds = mockDiscordGuilds();
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

                discordServiceMock
                  .getUserDetails
                  .mockReturnValue(cold("x|", {x: mockUser}));
                discordServiceMock
                  .getGuilds.mockReturnValue(cold("x|", {x: mockGuilds}));
                (userServiceMock.getUser as any)
                  .mockReturnValue(cold("x|", {x: mockClashBotUser}));
                (userServiceMock.updateUser as any)
                  .mockReturnValue(cold("x|", {x: mockClashBotUser}));
                applicationDetailsServiceMock
                  .getApplicationDetails
                  .mockReturnValue(cold("-x", {x: setupLoggedOutMockApplicationDetails()}));
                setupEmptyApplicationDetailsForInit();

                const expectedGuilds = [...mockGuilds, freeAgentGuild];
                expectedGuilds.forEach(guild => guildMap.set(guild.id, guild));

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

                flush();

                const expectedApplicationDetails: ApplicationDetails = {
                    defaultGuild: guildMap.get(<string>mockClashBotUser.serverId),
                    userGuilds: guildMap,
                    clashBotUserDetails: mockClashBotUser,
                    userDetails: mockUser,
                    loggedIn: true,
                    loginStatus: LoginStatus.LOGGED_IN
                };

                expect(userServiceMock.getUser).toHaveBeenCalledWith(`${mockUser.id}`);
                expect(applicationDetailsServiceMock.getApplicationDetails).toHaveBeenCalledTimes(2);
                expect(applicationDetailsServiceMock.setApplicationDetails).toHaveBeenCalledWith(expectedApplicationDetails);
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

                discordServiceMock.getUserDetails.mockReturnValue(cold("#|", undefined, create400HttpError()));
                setupEmptyApplicationDetailsForInit();

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

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

                discordServiceMock.getUserDetails.mockReturnValue(cold("#-#-#|", undefined, create429HttpError()));
                setupEmptyApplicationDetailsForInit();

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

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

                discordServiceMock.getUserDetails.mockReturnValue(cold("x|", {x: createMockUserDetails()}));
                discordServiceMock.getGuilds.mockReturnValue(cold("#|", undefined, create400HttpError()));
                setupEmptyApplicationDetailsForInit();

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

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

                discordServiceMock.getUserDetails.mockReturnValue(cold("x|", {x: createMockUserDetails()}));
                discordServiceMock.getGuilds.mockReturnValue(cold("#-#-#|", undefined, create429HttpError()));
                setupEmptyApplicationDetailsForInit();

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

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
                discordServiceMock.getUserDetails.mockReturnValue(cold("x|", {x: mockUserDetails}));
                discordServiceMock.getGuilds.mockReturnValue(cold("x|", {x: createMockGuilds()}));
                (userServiceMock.getUser as any).mockReturnValue(cold("#|", undefined, create400HttpError()));
                setupEmptyApplicationDetailsForInit();

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

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
                discordServiceMock.getUserDetails.mockReturnValue(cold("x|", {x: mockUserDetails}));
                discordServiceMock.getGuilds.mockReturnValue(cold("x|", {x: mockGuilds}));
                (userServiceMock.getUser as any).mockReturnValue(cold("x|", {x: mockClashBotPlayer}));
                (userServiceMock.updateUser as any).mockReturnValue(cold("#|", undefined, create400HttpError()));
                setupEmptyApplicationDetailsForInit();

                fixture = TestBed.createComponent(WelcomeDashboardComponent);
                component = fixture.componentInstance;

                component.initUserDetails();

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

function createMockTournaments(): Tournament[] {
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
