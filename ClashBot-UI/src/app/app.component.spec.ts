import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Location} from '@angular/common';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {UserDetailsService} from "./services/user-details.service";
import {of} from "rxjs";
import {UserDetails} from "./interfaces/user-details";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatCardModule} from "@angular/material/card";
import {Router} from "@angular/router";
import {WelcomeDashboardComponent} from "./pages/welcome-dashboard/welcome-dashboard/welcome-dashboard.component";
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
import {ClashTournamentCalendarHeaderComponent} from "./clash-tournament-calendar-header/clash-tournament-calendar-header.component";
import {ReleaseNotificationDialogComponent} from "./dialogs/release-notification-dialog/release-notification-dialog.component";

jest.mock('./services/user-details.service');
jest.mock('./services/application-details.service');
jest.mock('./google-analytics.service');

@NgModule({
  declarations: [ClashTournamentCalendarHeaderComponent, ReleaseNotificationDialogComponent],
  entryComponents: [ClashTournamentCalendarHeaderComponent, ReleaseNotificationDialogComponent],
  imports: [MatIconModule, MatDialogModule, MarkdownModule.forRoot()]
})
class WelcomeDashboardTestModule {
}


describe('AppComponent', () => {
  let userDetailsServiceMock: any;
  let applicationDetailsMock: any;
  let googleAnalyticsService: any;
  let router: Router;
  let location: Location;
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    jest.resetAllMocks();
    testScheduler = new TestScheduler((a,b) => expect(a).toBe(b));
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
        WelcomeDashboardTestModule
      ],
      declarations: [AppComponent, WelcomeDashboardComponent, TeamsDashboardComponent],
      providers: [UserDetailsService,
        ApplicationDetailsService,
        OAuthService,
        UrlHelperService,
        OAuthLogger,
        DateTimeProvider,
        ClashBotService,
        DiscordService,
        MatDialog,
        GoogleAnalyticsService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    userDetailsServiceMock = TestBed.inject(UserDetailsService);
    applicationDetailsMock = TestBed.inject(ApplicationDetailsService);
    googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    router.initialNavigation();
  });

  test('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  test('should check to see if the appropriate user details have been loaded for the User Details and Application Details subjects.', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    testScheduler.run(helper => {
      let {cold, flush} = helper;

      let mockUserDetails: UserDetails = {
        username: '',
        id: '',
        discriminator: ''
      };
      let mockApplicationDetails: ApplicationDetails = {
        currentTournaments: [],
        userGuilds: []
      };

      let mockUserDetailsPopulated: UserDetails = {
        username: 'Roidrage',
        id: '1',
        discriminator: '131232131'
      };
      let mockApplicationDetailsPopulated: ApplicationDetails = {
        currentTournaments: [],
        userGuilds: [{
          features: ['nothing'],
          icon: '12312',
          id: '1',
          name: 'Awesome Server',
          owner: true,
          permissions: 1,
          permissions_new: 'yes'
        }]
      };

      let userDetailsObs = cold('x----z|', {x: mockUserDetails, z: mockUserDetailsPopulated});
      let applicationObs = cold('x----z|', {x: mockApplicationDetails, z: mockApplicationDetailsPopulated});

      userDetailsServiceMock.getUserDetails.mockReturnValue(userDetailsObs);
      applicationDetailsMock.getApplicationDetails.mockReturnValue(applicationObs);

      expect(app.userDetailsLoaded).toBeFalsy();
      expect(app.applicationDetailsLoaded).toBeFalsy();

      fixture.detectChanges();

      flush();

      expect(app.userDetailsLoaded).toBeTruthy();
      expect(app.applicationDetailsLoaded).toBeTruthy();
    })
  });

  test('When navigateToWelcomePage is called, it should invoke the router to navigate to /', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    userDetailsServiceMock.getUserDetails.mockReturnValue(of({ id: '', username: '', discriminator: '12321312'}));
    applicationDetailsMock.getApplicationDetails.mockReturnValue(of({}));
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.navigateToTeams();
    tick();
    fixture.detectChanges();
    app.navigateToWelcomePage();
    tick();
    expect(location.path()).toBe('/');
    expect(googleAnalyticsService.sendPageNavigationEvent).toHaveBeenCalledTimes(2);
    expect(googleAnalyticsService.sendPageNavigationEvent).toHaveBeenCalledWith('/');
  }))

  test('When navigateToTeams is called, it should invoke the router to navigate to /teams', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    userDetailsServiceMock.getUserDetails.mockReturnValue(of({ id: '', username: '', discriminator: '12321312'}));
    applicationDetailsMock.getApplicationDetails.mockReturnValue(of({}));
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.navigateToTeams();
    tick();
    expect(location.path()).toBe('/teams');
    expect(googleAnalyticsService.sendPageNavigationEvent).toHaveBeenCalledTimes(1);
    expect(googleAnalyticsService.sendPageNavigationEvent).toHaveBeenCalledWith('/teams');
  }))

  test('If the version is set via the environment file, then it should be displayed.', () => {
    const fixture = TestBed.createComponent(AppComponent);
    userDetailsServiceMock.getUserDetails.mockReturnValue(of({ id: '', username: '', discriminator: '12321312'}));
    applicationDetailsMock.getApplicationDetails.mockReturnValue(of({}));
    const app = fixture.componentInstance;
    expect(app.appVersion).toEqual(environment.version)
  })

});
