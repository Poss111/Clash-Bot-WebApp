import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {ApplicationDetails} from "./application-details";

@Injectable({
    providedIn: 'root'
})
export class ApplicationDetailsService {

    applicationDetails: BehaviorSubject<ApplicationDetails> = new BehaviorSubject<ApplicationDetails>({});

    constructor() {}

    getApplicationDetails(): BehaviorSubject<ApplicationDetails> {
        return this.applicationDetails;
    }

    setApplicationDetails(applicationDetails: ApplicationDetails) {
        console.log(JSON.stringify(applicationDetails));
        this.applicationDetails.next(applicationDetails);
    }
}
