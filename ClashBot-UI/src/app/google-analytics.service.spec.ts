import { TestBed } from '@angular/core/testing';

import { GoogleAnalyticsService } from './google-analytics.service';

describe('GoogleAnalyticsServiceService', () => {
  let service: GoogleAnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleAnalyticsService);
  });

  test('should be created', () => {
    expect(service).toBeTruthy();
  });

});
