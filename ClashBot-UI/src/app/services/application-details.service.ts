import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {ApplicationDetails} from "../interfaces/application-details";
import {LoginStatus} from "../login-status";

@Injectable({
    providedIn: "root"
})
export class ApplicationDetailsService {

    private defaultStatus: ApplicationDetails = {
      loggedIn: false,
      loginStatus: LoginStatus.NOT_LOGGED_IN,
    };
    applicationDetails: BehaviorSubject<ApplicationDetails> = new BehaviorSubject<ApplicationDetails>(this.defaultStatus);

    constructor() {}

    getApplicationDetails(): BehaviorSubject<ApplicationDetails> {
        return this.applicationDetails;
    }

    setApplicationDetails(applicationDetails: ApplicationDetails) {
        this.applicationDetails.next(applicationDetails);
    }

    loggingIn() {
        let value = this.applicationDetails.value;
        this.applicationDetails.next({
          ...value,
          loggedIn: false,
          loginStatus: LoginStatus.LOGGING_IN
        });
    }

    logOutUser() {
        let value = this.applicationDetails.value;
        this.applicationDetails.next({
          currentTournaments: value.currentTournaments,
          loggedIn: false,
          loginStatus: LoginStatus.NOT_LOGGED_IN,
        });
    }
}
