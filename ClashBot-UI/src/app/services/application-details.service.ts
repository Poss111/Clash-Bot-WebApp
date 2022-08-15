import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {ApplicationDetails} from "../interfaces/application-details";

@Injectable({
    providedIn: "root"
})
export class ApplicationDetailsService {

    applicationDetails: BehaviorSubject<ApplicationDetails> = new BehaviorSubject<ApplicationDetails>({});

    constructor() {}

    getApplicationDetails(): BehaviorSubject<ApplicationDetails> {
        return this.applicationDetails;
    }

    setApplicationDetails(applicationDetails: ApplicationDetails) {
        this.applicationDetails.next(applicationDetails);
    }
}
