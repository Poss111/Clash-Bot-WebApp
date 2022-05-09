import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Location} from '@angular/common';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {of} from "rxjs";
import {UserDetails} from "./interfaces/user-details";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatCardModule} from "@angular/material/card";
import {Router} from "@angular/router";
import {WelcomeDashboardComponent} from "./pages/welcome-dashboard/welcome-dashboard.component";
import {TeamsDashboardComponent} from "./pages/teams-dashboard/teams-dashboard/teams-dashboard.component";
import {NgModule, NO_ERRORS_SCHEMA} from "@angular/core";
import {MatChipsModule} from "@angular/material/chips";
import {DateTimeProvider, OAuthLogger, OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ClashBotService} from "./services/clash-bot.service";
import {DiscordService} from "./services/discord.service";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatSelectModule} from "@angular/material/select";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {environment} from "../environments/environment";
import {GoogleAnalyticsService} from "./google-analytics.service";
import {TestScheduler} from "rxjs/testing";
import {ApplicationDetails} from "./interfaces/application-details";
import {ApplicationDetailsService} from "./services/application-details.service";
import {MatTableModule} from "@angular/material/table";
import {MarkdownModule} from "ngx-markdown";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {
    ClashTournamentCalendarHeaderComponent
} from "./clash-tournament-calendar-header/clash-tournament-calendar-header.component";
import {
    ReleaseNotificationDialogComponent
} from "./dialogs/release-notification-dialog/release-notification-dialog.component";
import {SharedModule} from "./shared/shared.module";
import {RiotDdragonService} from "./services/riot-ddragon.service";
import * as mocks from './shared/shared-test-mocks.spec';

jest.mock('./services/application-details.service');
jest.mock('./google-analytics.service');
jest.mock('./services/riot-ddragon.service');

@NgModule({
    declarations: [ClashTournamentCalendarHeaderComponent, ReleaseNotificationDialogComponent],
    entryComponents: [ClashTournamentCalendarHeaderComponent, ReleaseNotificationDialogComponent],
    imports: [MatIconModule, MatDialogModule, MarkdownModule.forRoot()]
})
class WelcomeDashboardTestModule {
}

describe('AppComponent', () => {
    let applicationDetailsMock: any;
    let googleAnalyticsService: any;
    let riotDdragonServiceMock: any;
    let router: Router;
    let location: Location;
    let testScheduler: TestScheduler;

    beforeEach(async () => {
        jest.resetAllMocks();
        testScheduler = new TestScheduler((a, b) => expect(a).toBe(b));
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    {path: '', component: WelcomeDashboardComponent},
                    {path: 'teams', component: TeamsDashboardComponent},
                    {path: '**', redirectTo: ''}
                ]),
                MatButtonModule,
                MatIconModule,
                MatMenuModule,
                MatToolbarModule,
                MatCardModule,
                MatChipsModule,
                HttpClientTestingModule,
                MatSnackBarModule,
                MatSelectModule,
                MatDialogModule,
                MatTableModule,
                MarkdownModule.forRoot(),
                BrowserAnimationsModule,
                WelcomeDashboardTestModule,
                SharedModule
            ],
            declarations: [AppComponent, WelcomeDashboardComponent, TeamsDashboardComponent],
            providers: [
                ApplicationDetailsService,
                OAuthService,
                UrlHelperService,
                OAuthLogger,
                DateTimeProvider,
                ClashBotService,
                DiscordService,
                MatDialog,
                GoogleAnalyticsService,
                RiotDdragonService
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
        applicationDetailsMock = TestBed.inject(ApplicationDetailsService);
        googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
        riotDdragonServiceMock = TestBed.inject(RiotDdragonService);
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        router.initialNavigation();
        window.localStorage.clear();
    });

    test('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    test('should check to see if the appropriate user details have been loaded for the User Details, Application Details subjects and should retrieve and set the latest League API Version.', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        testScheduler.run(helper => {
            let {cold, flush} = helper;

            let mockUserDetails: UserDetails = mocks.createMockUserDetails();
            let mockApplicationDetails: ApplicationDetails = mocks.createMockAppDetails([],
                mocks.createMockClashBotUserDetails(), mockUserDetails);
            mockApplicationDetails.loggedIn = false;

            let mockLeagueVersion: String[] = [
                "12.8.2",
                "12.8.1"
            ];

            let applicationObs = cold('x----z|', {x: mockApplicationDetails, z: mockApplicationDetails});
            let riotVersionObs = cold('x|', {x: mockLeagueVersion});

            applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationObs);
            riotDdragonServiceMock.getVersions.mockReturnValue(riotVersionObs);

            expect(window.localStorage.getItem('leagueApiVersion')).toBeFalsy();
            expect(app.routingArray).toEqual([]);

            fixture.detectChanges();

            flush();

            expect(window.localStorage.getItem('leagueApiVersion')).toEqual('12.8.2');
            expect(app.routingArray).toEqual(app.defaultRoutingArray);
            expect(app.username).toBeFalsy();
        })
    });

    test('If the user is logged in, it should check to see if the appropriate user details have been loaded for the User Details, Application Details subjects and should retrieve and set the latest League API Version.', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        testScheduler.run(helper => {
            let {cold, flush} = helper;

            let mockUserDetails: UserDetails = mocks.createMockUserDetails();
            let mockApplicationDetails: ApplicationDetails = mocks.createMockAppDetails([],
                mocks.createMockClashBotUserDetails(), mockUserDetails);
            mockApplicationDetails.loggedIn = true;

            let mockLeagueVersion: String[] = [
                "12.8.2",
                "12.8.1"
            ];

            let applicationObs = cold('x----z|', {x: mockApplicationDetails, z: mockApplicationDetails});
            let riotVersionObs = cold('x|', {x: mockLeagueVersion});

            applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationObs);
            riotDdragonServiceMock.getVersions.mockReturnValue(riotVersionObs);

            expect(window.localStorage.getItem('leagueApiVersion')).toBeFalsy();
            expect(app.routingArray).toEqual([]);

            fixture.detectChanges();

            flush();

            expect(window.localStorage.getItem('leagueApiVersion')).toEqual('12.8.2');
            expect(app.routingArray).toEqual(app.loggedInArray);
            expect(app.username).toEqual(mockUserDetails.username);
        })
    });

    test('When navigate is called, it should invoke the router to navigate to /', fakeAsync(() => {
        const fixture = TestBed.createComponent(AppComponent);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(of({}));
        riotDdragonServiceMock.getVersions.mockReturnValue(of(['12.8.1']));
        const app = fixture.componentInstance;
        fixture.detectChanges();
        let route = '/teams';
        app.navigate(route);
        tick();
        expect(location.path()).toBe(route);
        expect(googleAnalyticsService.sendPageNavigationEvent).toHaveBeenCalledTimes(1);
        expect(googleAnalyticsService.sendPageNavigationEvent).toHaveBeenCalledWith(route);
    }))

    test('If the version is set via the environment file, then it should be displayed.', () => {
        const fixture = TestBed.createComponent(AppComponent);
        applicationDetailsMock.getApplicationDetails.mockReturnValue(of({}));
        const app = fixture.componentInstance;
        expect(app.appVersion).toEqual(environment.version)
    })

});
