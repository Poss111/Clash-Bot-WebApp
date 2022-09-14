import {TestBed} from "@angular/core/testing";

import {NewPlayerGuardGuard} from "./new-player-guard.guard";
import {ApplicationDetailsService} from "./services/application-details.service";
import {DiscordService} from "./services/discord.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {DateTimeProvider, OAuthLogger, OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {GoogleAnalyticsService} from "./google-analytics.service";
import {RiotDdragonService} from "./services/riot-ddragon.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {RouterTestingModule} from "@angular/router/testing";
import {TeamsDashboardComponent} from "./pages/teams-dashboard/teams-dashboard/teams-dashboard.component";
import {TeamsModule} from "./pages/teams-dashboard/teams.module";
import {ClashbotWalkthroughComponent} from "./pages/clashbot-walkthrough/clashbot-walkthrough.component";
import {ClashbotWalkthroughModule} from "./pages/clashbot-walkthrough/clashbot-walkthrough.module";
import {TestScheduler} from "rxjs/testing";
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from "@angular/router";
import Mock = jest.Mock;
import {
  mockSixDiscordGuilds,
  setupLoggedInMockApplicationDetails,
  setupLoggedOutMockApplicationDetails
} from "./shared/shared-test-mocks.spec";
import {Observable} from "rxjs";
import {DiscordGuild} from "./interfaces/discord-guild";

jest.mock("./services/application-details.service");

describe("NewPlayerGuardGuard", () => {
  let guard: NewPlayerGuardGuard;
  let mockAppService: ApplicationDetailsService;
  let testScheduler: TestScheduler;
  let router: Router;

  beforeEach(() => {
    testScheduler = new TestScheduler((a, b) => expect(a).toBe(b));
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        RouterTestingModule.withRoutes(
            [{path: "teams", component: TeamsDashboardComponent},
            {path: "walkthrough", component: ClashbotWalkthroughComponent}]
        ),
        TeamsModule,
        ClashbotWalkthroughModule
      ],
      providers: [
        ApplicationDetailsService,
        OAuthService,
        UrlHelperService,
        OAuthLogger,
        DateTimeProvider,
        DiscordService,
        MatDialog,
        GoogleAnalyticsService,
        RiotDdragonService,
        MatSnackBar
      ]
    });
    guard = TestBed.inject(NewPlayerGuardGuard);
    mockAppService = TestBed.inject(ApplicationDetailsService);
    router = TestBed.inject(Router);
  });

  describe("Guard", () => {
    test("canActivate - (Can Activate) - If user is not logged in, it should go to the home page.", (done) => {
      testScheduler.run((helper) => {
        let {flush, cold} = helper;
        (mockAppService.getApplicationDetails as Mock)
            .mockReturnValue(cold("x|", {x: setupLoggedOutMockApplicationDetails()}));
        const navigateSpy = jest.spyOn(router, "parseUrl");
        (guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{url: "/"}) as Observable<boolean|UrlTree>)
            .subscribe((routeToHome) => {
              expect(routeToHome instanceof UrlTree).toBeTruthy();
              expect(navigateSpy).toHaveBeenCalledTimes(1);
              expect(navigateSpy).toHaveBeenCalledWith("/");
              done();
            });
        flush();
      })
    });

    test("canActivate - (Can Activate) - If user is logged in but does not have any selected servers, it should go to the walkthrough page.", (done) => {
      testScheduler.run((helper) => {
        let {flush, cold} = helper;
        (mockAppService.getApplicationDetails as Mock)
            .mockReturnValue(cold("x|", {x: setupLoggedInMockApplicationDetails()}));
        const navigateSpy = jest.spyOn(router, "parseUrl");
        (guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{url: "/"}) as Observable<boolean|UrlTree>)
            .subscribe((routeToHome) => {
              expect(routeToHome instanceof UrlTree).toBeTruthy();
              expect(navigateSpy).toHaveBeenCalledTimes(1);
              expect(navigateSpy).toHaveBeenCalledWith("/walkthrough");
              done();
            });
        flush();
      })
    });

    test("canActivate - (Can Activate) - If user is logged in and has any selected servers, it should go to which ever page they like.", (done) => {
      testScheduler.run((helper) => {
        let {flush, cold} = helper;
        const appDetails = setupLoggedInMockApplicationDetails();
        const guilds = mockSixDiscordGuilds();
        const discordGuild = new Map<string, DiscordGuild>();
        guilds.forEach((guild) => discordGuild.set(guild.id, guild))
        appDetails.selectedGuilds = discordGuild;
        (mockAppService.getApplicationDetails as Mock)
            .mockReturnValue(cold("x|", {x: appDetails}));
        const navigateSpy = jest.spyOn(router, "parseUrl");
        (guard.canActivate(new ActivatedRouteSnapshot(), <RouterStateSnapshot>{url: "/"}) as Observable<boolean|UrlTree>)
            .subscribe((routeToHome) => {
              expect(routeToHome).toEqual(true);
              expect(navigateSpy).not.toHaveBeenCalled();
              done();
            });
        flush();
      })
    });
  });
});
