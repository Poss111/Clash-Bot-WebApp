import { TestBed } from '@angular/core/testing';

import { TeamsWebsocketService } from './teams-websocket.service';

describe('TeamsWebsocketService', () => {
  let service: TeamsWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeamsWebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  test('getSubject - (Subscribe) - should subscribe to a websocket subject with a query param of serverName.', () => {

  });
});
