import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ClashbotWalkthroughComponent} from "./clashbot-walkthrough.component";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {BehaviorSubject, of} from "rxjs";
import {ApplicationDetails} from "../../interfaces/application-details";
import {createMockPlayer, createMockUserDetails, mockSixDiscordGuilds} from "../../shared/shared-test-mocks.spec";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {LoginStatus} from "../../login-status";
import {CUSTOM_ELEMENTS_SCHEMA, Injectable, NO_ERRORS_SCHEMA} from "@angular/core";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {ReactiveFormsModule} from "@angular/forms";
import {DiscordService} from "../../services/discord.service";
import {OAuthService} from "angular-oauth2-oidc";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {RouterTestingModule} from "@angular/router/testing";
import {UserService} from "clash-bot-service-api";
import {PageLoadingService} from "../../services/page-loading.service";
import {TestScheduler} from "rxjs/testing";
import {Player} from "clash-bot-service-api/model/player";
import {Role} from "clash-bot-service-api/model/role";
import {Subscription} from "clash-bot-service-api/model/subscription";
import {UpdateUserRequest} from "clash-bot-service-api/model/updateUserRequest";
import {FREE_AGENT_GUILD} from "../../interfaces/clash-bot-constants";
import {TeamsDashboardComponent} from "../teams-dashboard/teams-dashboard/teams-dashboard.component";
import {Router} from "@angular/router";
import {TeamsModule} from "../teams-dashboard/teams.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatIconRegisteryModule} from "../teams-dashboard/component/mat-icon-registery.module";

jest.mock("../../services/discord.service");
jest.mock("angular-oauth2-oidc");
jest.mock("clash-bot-service-api");
jest.mock("../../services/page-loading.service");

const guilds = mockSixDiscordGuilds();
const user = createMockPlayer();
const discordUser = createMockUserDetails();
let applicationDetails = {};
let startingAppDetails: ApplicationDetails = {
  clashBotUserDetails: user,
  currentTournaments: [],
  defaultGuild: undefined,
  loggedIn: true,
  loginStatus: LoginStatus.LOGGED_IN,
  userDetails: discordUser,
};

class MockApplicationDetails extends ApplicationDetailsService {

  getApplicationDetails(): BehaviorSubject<ApplicationDetails> {
    const guildMap = new Map<string, DiscordGuild>();
    const guilds = mockSixDiscordGuilds();
    guilds
        .forEach((guild) => guildMap
            .set(guild.id, guild));
    startingAppDetails.userGuilds = guildMap;
    return new BehaviorSubject<ApplicationDetails>(startingAppDetails);
  }

  setApplicationDetails(details: ApplicationDetails) {
    applicationDetails = details;
  }

}

describe("ClashbotWalkthroughComponent", () => {
  let component: ClashbotWalkthroughComponent;
  let fixture: ComponentFixture<ClashbotWalkthroughComponent>;
  let mockUserService: UserService;
  let mockPageLoadingService: PageLoadingService;
  let testScheduler: TestScheduler;
  let spiedRouter: Router;

  beforeEach(async () => {
    jest.resetAllMocks();
    testScheduler = new TestScheduler((a, b) => expect(a).toBe(b));
    await TestBed.configureTestingModule({
      declarations: [ ClashbotWalkthroughComponent ],
      imports: [
          TeamsModule,
          MatAutocompleteModule,
          ReactiveFormsModule,
          MatSnackBarModule,
          HttpClientTestingModule,
          BrowserAnimationsModule,
          MatIconRegisteryModule,
          RouterTestingModule.withRoutes(
            [{path: "teams", component: TeamsDashboardComponent}]
          )
      ],
      providers: [
        {provide: ApplicationDetailsService, useClass: MockApplicationDetails},
        DiscordService,
        OAuthService,
        UserService,
        PageLoadingService
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
    TestBed.inject(DiscordService);
    mockUserService = TestBed.inject(UserService);
    mockPageLoadingService = TestBed.inject(PageLoadingService);
    spiedRouter = TestBed.inject(Router);
  });

  beforeEach(() => {
    (mockPageLoadingService.getSubject as any).mockReturnValue({
      asObservable: () => of(true)
    });
    fixture = TestBed.createComponent(ClashbotWalkthroughComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("ClashBot Walkthrough", () => {

    describe("Add Server", () => {
      test("addServer - (Should add another server form) - when invoked, it should add another server form and remove the currently added server from the list", () => {
        component = fixture.componentInstance;

        expect(component.serverFormControls.controls).toHaveLength(1);
        expect(component.servers).toHaveLength(6);
        component.serverFormControls.setValue([{server: component.servers[0]}]);
        component.addServer();
        expect(component.servers).toHaveLength(5);
        expect(component.serverFormControls.controls).toHaveLength(2);
      });
    });

    test("addServer - (Should not allow more than 5 servers) - when invoked, it should add another server form and remove the currently added server from the list", () => {
      component = fixture.componentInstance;

      expect(component.serverFormControls.controls).toHaveLength(1);
      expect(component.servers).toHaveLength(6);
      component.serverFormControls.setValue([
          {server: guilds[0].name}
      ]);
      component.addServer();
      expect(component.serverFormControls.controls).toHaveLength(2);
      expect(component.servers).toHaveLength(5);
      component.serverFormControls.setValue([
        {server: guilds[0].name},
        {server: guilds[1].name}
      ]);
      component.addServer();
      expect(component.serverFormControls.controls).toHaveLength(3);
      expect(component.servers).toHaveLength(4);
      component.serverFormControls.setValue([
        {server: guilds[0].name},
        {server: guilds[1].name},
        {server: guilds[2].name}
      ]);
      component.addServer();
      expect(component.serverFormControls.controls).toHaveLength(4);
      expect(component.servers).toHaveLength(3);
      component.serverFormControls.setValue([
        {server: guilds[0].name},
        {server: guilds[1].name},
        {server: guilds[2].name},
        {server: guilds[3].name}
      ]);
      component.addServer();
      expect(component.serverFormControls.controls).toHaveLength(5);
      expect(component.servers).toHaveLength(2);
      component.serverFormControls.setValue([
        {server: guilds[0].name},
        {server: guilds[1].name},
        {server: guilds[2].name},
        {server: guilds[3].name},
        {server: guilds[4].name}
      ]);
      component.addServer();
      expect(component.servers).toHaveLength(1);
      expect(component.serverFormControls.controls).toHaveLength(5);
    });
  });

  describe("Submit", () => {
    test("submit - (Submit details) - should submit a list of servers for the user to take and default gulid.", () => {
      component = fixture.componentInstance;
      component.serverFormControls.setValue([
        {server: guilds[0].name}
      ]);
      expect(component.serverMap.size).toEqual(0);
      component.submit();
      expect(component.serverMap.size).toEqual(1);
    });
  });

  describe("Finish Walkthrough", () => {
    test("finishWalkthrough - (Submit User Details) - should invoke updating user details with selectedGuilds and default gulid.", () => {
      component = fixture.componentInstance;
      testScheduler.run(helper => {
        let {cold, flush} = helper;
        const mockServerMap = new Map<string, DiscordGuild>();
        mockServerMap.set(guilds[0].id,guilds[0]);
        mockServerMap.set(guilds[1].id,guilds[1]);
        component.serverMap = mockServerMap;
        component.defaultServerFormControls
            .setValue({server: guilds[0].name});
        const playerUpdate: Player = {
          id: user.id,
          name: user.name,
          serverId: guilds[0].id,
          selectedServers: [
            guilds[0].id,
            guilds[1].id
          ]
        };

        const navigateSpy = jest.spyOn(spiedRouter, "navigate");
        const navigateByUrlSpy = jest.spyOn(spiedRouter, "navigateByUrl");
        const expectedUpdatePayload: UpdateUserRequest = {
          id: user.id ?? "",
          selectedServers: [
            guilds[0].id,
            guilds[1].id
          ],
          serverId: guilds[0].id
        };
        const expectedServerMap = new Map<string, DiscordGuild>([...mockServerMap]);
        expectedServerMap.set(FREE_AGENT_GUILD.id, FREE_AGENT_GUILD);

        (mockUserService.updateUser as any)
            .mockReturnValue(cold("x|", {x: playerUpdate}));
        (mockUserService.getUser as any)
            .mockReturnValue(cold("x|", {x: playerUpdate}));

        component.finishWalkThrough();

        flush();

        expect(mockUserService.updateUser)
            .toHaveBeenCalledTimes(1);
        expect(mockUserService.updateUser)
            .toHaveBeenCalledWith(expectedUpdatePayload);
        expect(applicationDetails).toEqual({
          ...startingAppDetails,
          selectedGuilds: expectedServerMap,
          clashBotUserDetails: playerUpdate
        });
        expect(navigateByUrlSpy).toHaveBeenCalledTimes(1);
        expect(navigateByUrlSpy).toHaveBeenCalledWith("/teams");
      })
    });
  });
});
