import {TestBed} from "@angular/core/testing";

import {ApplicationDetailsService} from "./application-details.service";
import {ApplicationDetails} from "../interfaces/application-details";
import {take} from "rxjs/operators";
import {BehaviorSubject} from "rxjs";
import {LoginStatus} from "../login-status";

describe("ApplicationDetailsService", () => {
  let service: ApplicationDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationDetailsService);
  });

  test("should be created", () => {
    expect(service).toBeTruthy();
  });

  test("getApplicationDetails should return a Subject.", () => {
    expect(service.getApplicationDetails()).toBeTruthy()
  })

  test("When setApplicationDetails are set, it should emit to all subscribed.", (done) => {
    let applicationDetails: ApplicationDetails = {
      currentTournaments: [{
        tournamentName: "awesome_sauce",
        tournamentDay: "1",
        startTime: new Date().toISOString(),
        registrationTime: new Date().toISOString()
      }],
      loggedIn: false,
      loginStatus: LoginStatus.NOT_LOGGED_IN
    };
    service.setApplicationDetails(applicationDetails);
    service.getApplicationDetails().pipe(take(1)).subscribe((data) => {
      expect(data).toEqual(applicationDetails);
      done()
    })
  })

  describe("Logging in User", () => {
    test("loggingIn - it should set loggedIn to false and should set the loginStatus to LoggingIn.", () => {
      let applicationDetails: ApplicationDetails = {
        currentTournaments: [{
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          startTime: new Date().toISOString(),
          registrationTime: new Date().toISOString(),
        }],
        loggedIn: false,
        loginStatus: LoginStatus.NOT_LOGGED_IN,
      };
      service.applicationDetails = new BehaviorSubject<ApplicationDetails>(applicationDetails);
      service.loggingIn();
      const updatedApplicationDetails = service.getApplicationDetails().value;
      expect(updatedApplicationDetails.userDetails).toBeFalsy();
      expect(updatedApplicationDetails.clashBotUserDetails).toBeFalsy();
      expect(updatedApplicationDetails.loggedIn).toBeFalsy();
      expect(updatedApplicationDetails.userGuilds).toBeFalsy();
      expect(updatedApplicationDetails.defaultGuild).toBeFalsy();
      expect(updatedApplicationDetails.currentTournaments).toEqual(applicationDetails.currentTournaments);
      expect(updatedApplicationDetails.loginStatus).toEqual(LoginStatus.LOGGING_IN);
    });
  });

  describe("Log Out User", () => {
    test("logOutUser - it should clear the applicationsDetails and set it back to default.", () => {
      let applicationDetails: ApplicationDetails = {
        currentTournaments: [{
          tournamentName: "awesome_sauce",
          tournamentDay: "1",
          startTime: new Date().toISOString(),
          registrationTime: new Date().toISOString(),
        }],
        loggedIn: true,
        loginStatus: LoginStatus.LOGGED_IN,
        defaultGuild: "Goon Squad",
        userGuilds: [{
          features: [],
          icon: "",
          id: "",
          name: "",
          owner: false,
          permissions: 0,
          permissions_new: ""
        }],
        userDetails: {
          id: 1,
          username: "Roidrage",
          discriminator: "hehe",
          avatar: "avatar",
          bot: false,
          system: false,
          mfa_enabled: true,
          locale: "NA",
          verified: true,
          email: "NA",
          flags: 0,
          premium_type: 0,
          public_flags: 0
        },
        clashBotUserDetails: {
          id: "1",
          name: "Roidrage",
          champions: ["Sett"],
          subscriptions: [],
          serverName: "Goon Squad",
        }
      };
      service.applicationDetails = new BehaviorSubject<ApplicationDetails>(applicationDetails);
      service.logOutUser();
      const updatedApplicationDetails = service.getApplicationDetails().value;
      expect(updatedApplicationDetails.userDetails).toBeFalsy();
      expect(updatedApplicationDetails.clashBotUserDetails).toBeFalsy();
      expect(updatedApplicationDetails.loggedIn).toBeFalsy();
      expect(updatedApplicationDetails.userGuilds).toBeFalsy();
      expect(updatedApplicationDetails.defaultGuild).toBeFalsy();
      expect(updatedApplicationDetails.currentTournaments).toEqual(applicationDetails.currentTournaments);
      expect(updatedApplicationDetails.loginStatus).toEqual(LoginStatus.NOT_LOGGED_IN);
    });
  });
});
