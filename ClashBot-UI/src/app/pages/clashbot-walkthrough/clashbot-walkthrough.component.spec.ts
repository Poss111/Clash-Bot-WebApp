import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ClashbotWalkthroughComponent} from "./clashbot-walkthrough.component";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {BehaviorSubject, of} from "rxjs";
import {ApplicationDetails} from "../../interfaces/application-details";
import {
  create401HttpError,
  createMockPlayer,
  createMockUserDetails,
  mockSixDiscordGuilds
} from "../../shared/shared-test-mocks.spec";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {LoginStatus} from "../../login-status";
import {CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA} from "@angular/core";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {DiscordService} from "../../services/discord.service";
import {OAuthService} from "angular-oauth2-oidc";
import {MatSnackBar} from "@angular/material/snack-bar";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {RouterTestingModule} from "@angular/router/testing";
import {UserService} from "clash-bot-service-api";
import {PageLoadingService} from "../../services/page-loading.service";
import {TestScheduler} from "rxjs/testing";
import {Player} from "clash-bot-service-api/model/player";
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
jest.mock("@angular/material/snack-bar");
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
  let mockSnackBar: MatSnackBar;
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
        PageLoadingService,
        MatSnackBar
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
    TestBed.inject(DiscordService);
    mockUserService = TestBed.inject(UserService);
    mockPageLoadingService = TestBed.inject(PageLoadingService);
    mockSnackBar = TestBed.inject(MatSnackBar);
    spiedRouter = TestBed.inject(Router);
  });

  beforeEach(() => {
    applicationDetails = {};
    startingAppDetails = {
      clashBotUserDetails: user,
      currentTournaments: [],
      defaultGuild: undefined,
      loggedIn: true,
      loginStatus: LoginStatus.LOGGED_IN,
      userDetails: discordUser,
    };
    (mockPageLoadingService.getSubject as any).mockReturnValue({
      asObservable: () => of(true)
    });
    fixture = TestBed.createComponent(ClashbotWalkthroughComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("Finish Walkthrough", () => {
    test("finishWalkthrough - (Submit User Details) - should invoke updating user details with selectedGuilds and default guild.", () => {
      component = fixture.componentInstance;
      testScheduler.run(helper => {
        let {cold, flush} = helper;

        const mockServerNameToIdMap = new Map<string, string>();
        mockServerNameToIdMap.set(guilds[0].name, guilds[0].id);
        mockServerNameToIdMap.set(guilds[1].name, guilds[1].id);

        const mockServerMap = new Map<string, DiscordGuild>();
        mockServerMap.set(guilds[0].id, guilds[0]);
        mockServerMap.set(guilds[1].id, guilds[1]);
        component.serverNameToIdMap = mockServerNameToIdMap;
        const playerUpdate: Player = {
          id: user.id,
          name: user.name,
          serverId: guilds[0].id,
          selectedServers: [
            guilds[0].id,
            guilds[1].id
          ]
        };

        component.emittedDefaultServerGroup = new FormGroup({
          defaultServer: new FormControl(guilds[0].name,[])
        });
        component.emittedPreferredServers = new FormGroup({
          server0: new FormControl(guilds[0].name,[]),
          server1: new FormControl(guilds[1].name,[])
        });

        const navigateSpy = jest.spyOn(spiedRouter, "navigate");
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
        expect(navigateSpy).toHaveBeenCalledTimes(1);
        expect(navigateSpy).toHaveBeenCalledWith(["../teams"]);
      })
    });

    test("finishWalkthrough - (Submit User Details - POST fails) - if there are any failures with persisting the user, it should respond with a snack bar.", () => {
      component = fixture.componentInstance;
      testScheduler.run(helper => {
        let {cold, flush} = helper;

        const mockServerNameToIdMap = new Map<string, string>();
        mockServerNameToIdMap.set(guilds[0].name, guilds[0].id);
        mockServerNameToIdMap.set(guilds[1].name, guilds[1].id);

        const mockServerMap = new Map<string, DiscordGuild>();
        mockServerMap.set(guilds[0].id, guilds[0]);
        mockServerMap.set(guilds[1].id, guilds[1]);
        component.serverNameToIdMap = mockServerNameToIdMap;
        const playerUpdate: Player = {
          id: user.id,
          name: user.name,
          serverId: guilds[0].id,
          selectedServers: [
            guilds[0].id,
            guilds[1].id
          ]
        };

        component.emittedDefaultServerGroup = new FormGroup({
          defaultServer: new FormControl(guilds[0].name,[])
        });
        component.emittedPreferredServers = new FormGroup({
          server0: new FormControl(guilds[0].name,[]),
          server1: new FormControl(guilds[1].name,[])
        });

        const navigateSpy = jest.spyOn(spiedRouter, "navigate");
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
            .mockReturnValue(cold("#|",undefined,  create401HttpError()));
        (mockUserService.getUser as any)
            .mockReturnValue(cold("x|", {x: playerUpdate}));

        component.finishWalkThrough();

        flush();

        expect(mockUserService.updateUser)
            .toHaveBeenCalledTimes(1);
        expect(mockUserService.updateUser)
            .toHaveBeenCalledWith(expectedUpdatePayload);

        expect(mockUserService.getUser)
            .toHaveBeenCalledTimes(0);
        expect(applicationDetails).toEqual({});
        expect(navigateSpy).toHaveBeenCalledTimes(0);
        expect(mockSnackBar.open).toHaveBeenCalledTimes(1);
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          "Failed to save your preferences. Please try again.",
          "X",
          {duration: 5000}
        );
        expect(mockPageLoadingService.updateSubject).toHaveBeenCalledTimes(2);
        expect(mockPageLoadingService.updateSubject).toHaveBeenNthCalledWith(2, true);
        expect(mockPageLoadingService.updateSubject).toHaveBeenNthCalledWith(1, false)
      })
    });
  });
});
