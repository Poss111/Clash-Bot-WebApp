import {ComponentFixture, TestBed} from "@angular/core/testing";

import {AsyncUserprofilePageComponent} from "./async-userprofile-page.component";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import Mock = jest.Mock;
import {TestScheduler} from "rxjs/testing";
import {RiotDdragonService} from "../../../services/riot-ddragon.service";
import {
  createMockPlayer,
  getMockDdragonChampionList, setupLoggedInMockApplicationDetails
} from "../../../shared/shared-test-mocks.spec";
import {
  AsyncUserprofilePageTemplateComponent
} from "../async-userprofile-page-template/async-userprofile-page-template.component";
import {UserService} from "clash-bot-service-api";
import {UserDetailsInputComponent} from "../inputs/user-details-input/user-details-input.component";
import {ChampionListInputComponent} from "../inputs/champion-list-input/champion-list-input.component";

jest.mock("../../../services/application-details.service");
jest.mock("../../../services/riot-ddragon.service");
jest.mock("clash-bot-service-api");

describe("AsyncUserprofilePageComponent", () => {
  let component: AsyncUserprofilePageComponent;
  let fixture: ComponentFixture<AsyncUserprofilePageComponent>;
  let applicationDetailsMock: ApplicationDetailsService;
  let riotDdragonServiceMock: RiotDdragonService;
  let userServiceMock: UserService;
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    await TestBed.configureTestingModule({
      declarations: [
        AsyncUserprofilePageComponent,
        AsyncUserprofilePageTemplateComponent,
        UserDetailsInputComponent,
        ChampionListInputComponent
      ],
      providers: [ ApplicationDetailsService, RiotDdragonService, UserService ]
    })
    .compileComponents();
    applicationDetailsMock = TestBed.inject(ApplicationDetailsService);
    riotDdragonServiceMock = TestBed.inject(RiotDdragonService);
    userServiceMock = TestBed.inject(UserService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("OnInit", () => {
    test("OnInit - (Initial Loading - Logged In) - Should load in userApplicationDetails.", () => {
      testScheduler.run((helpers) => {
        let {cold,flush} = helpers;
        const listOfChampionsPayload = getMockDdragonChampionList();
        const championNames = Object.keys(listOfChampionsPayload.data);
        const userDetails = setupLoggedInMockApplicationDetails();
        (applicationDetailsMock.getApplicationDetails as Mock)
            .mockReturnValueOnce({
              asObservable: jest.fn().mockImplementationOnce(() => cold(""))
            });
        (applicationDetailsMock.getApplicationDetails as Mock)
            .mockReturnValueOnce(cold("x|", {x: userDetails}));
        (riotDdragonServiceMock.getListOfChampions as Mock)
            .mockReturnValue(cold("x|", {x: getMockDdragonChampionList()}));
        (userServiceMock.getUser as Mock)
            .mockReturnValue(cold("x|", {x: userDetails.clashBotUserDetails}))
        fixture = TestBed.createComponent(AsyncUserprofilePageComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        flush();
        expect(riotDdragonServiceMock.getListOfChampions).toHaveBeenCalledTimes(1);
        expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(2);
        expect(userServiceMock.getUser).toHaveBeenCalledTimes(1);
        expect(component.appDetailsObs$).toBeTruthy();
        expect(component.listOfChampionNames).toEqual(championNames);
        expect(component.userDetails).toEqual(userDetails.clashBotUserDetails);
      });
    });
  })
});
