import { TestBed } from '@angular/core/testing';

import { NotificationOverlayService } from './notification-overlay.service';

describe('NotificationOverlayService', () => {
  let service: NotificationOverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationOverlayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
