import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Location} from '@angular/common';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {UserDetailsService} from "./services/user-details.service";
import {BehaviorSubject} from "rxjs";
import {UserDetails} from "./interfaces/user-details";
import Mock = jest.Mock;
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatCardModule} from "@angular/material/card";
import {Router} from "@angular/router";
import {WelcomeDashboardComponent} from "./welcome-dashboard/welcome-dashboard.component";
import {TeamsDashboardComponent} from "./teams-dashboard/teams-dashboard.component";
import {NO_ERRORS_SCHEMA} from "@angular/core";
import {MatChipsModule} from "@angular/material/chips";
import {DateTimeProvider, OAuthLogger, OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ClashBotService} from "./services/clash-bot.service";
import {DiscordService} from "./services/discord.service";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatSelectModule} from "@angular/material/select";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {environment} from "../environments/environment";

jest.mock('./user-details.service');

describe('AppComponent', () => {
  let userDetailsServiceMock: UserDetailsService;
  let getUserDetailsMock: Mock<BehaviorSubject<UserDetails>> = jest.fn();
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    jest.resetAllMocks();
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
        MatDialogModule
      ],
      declarations: [AppComponent, WelcomeDashboardComponent, TeamsDashboardComponent],
      providers: [UserDetailsService,
        OAuthService,
        UrlHelperService,
        OAuthLogger,
        DateTimeProvider,
        ClashBotService,
        DiscordService,
        MatDialog],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    userDetailsServiceMock = TestBed.inject(UserDetailsService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    userDetailsServiceMock.getUserDetails = getUserDetailsMock;
    router.initialNavigation();
  });

  test('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  test('The user details should be loaded when created.', () => {
    let subject = new BehaviorSubject<UserDetails>({ id: '', username: '', discriminator: ''});
    getUserDetailsMock.mockReturnValue(subject);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    expect(app.user$).toEqual(subject);
  })

  test('When navigateToWelcomePage is called, it should invoke the router to navigate to /', () => {
    let subject = new BehaviorSubject<UserDetails>({ id: '', username: '', discriminator: ''});
    getUserDetailsMock.mockReturnValue(subject);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.navigateToWelcomePage();
    expect(location.path()).toBe('/');
  })

  test('When navigateToTeams is called, it should invoke the router to navigate to /teams', fakeAsync(() => {
    let subject = new BehaviorSubject<UserDetails>({ id: '', username: '', discriminator: ''});
    getUserDetailsMock.mockReturnValue(subject);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.navigateToTeams();
    tick();
    expect(location.path()).toBe('/teams');
  }))

  test('If the version is set via the environment file, then it should be displayed.', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.appVersion).toEqual(environment.version)
  })

});
