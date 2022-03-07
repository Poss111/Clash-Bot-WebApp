import { TestBed } from '@angular/core/testing';

import { NotificationsWsService } from './notifications-ws.service';

describe('NotificationsWsService', () => {
  let service: NotificationsWsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationsWsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
