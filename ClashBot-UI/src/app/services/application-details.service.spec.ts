import { TestBed } from '@angular/core/testing';

import { ApplicationDetailsService } from './application-details.service';
import {ApplicationDetails} from "../interfaces/application-details";
import {take} from "rxjs/operators";

describe('ApplicationDetailsService', () => {
  let service: ApplicationDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationDetailsService);
  });

  test('should be created', () => {
    expect(service).toBeTruthy();
  });

  test('getApplicationDetails should return a Subject.', () => {
    expect(service.getApplicationDetails()).toBeTruthy()
  })

  test('When setApplicationDetails are set, it should emit to all subscribed.', (done) => {
    let applicationDetails: ApplicationDetails = {
      currentTournaments: [{
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
        startTime: new Date().toISOString(),
        registrationTime: new Date().toISOString()
      }]
    };
    service.setApplicationDetails(applicationDetails);
    service.getApplicationDetails().pipe(take(1)).subscribe((data) => {
      expect(data).toEqual(applicationDetails);
      done()
    })
  })
});
