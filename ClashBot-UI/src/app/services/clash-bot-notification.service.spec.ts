import { TestBed } from '@angular/core/testing';

import { ClashBotNotificationService } from './clash-bot-notification.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {ClashBotNotification} from "../interfaces/clash-bot-notification";

describe('ClashBotNotificationService', () => {
  let service: ClashBotNotificationService;
  let httpMock: HttpTestingController;

  function stubLocation(location: any) {
    jest.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      ...location,
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClashBotNotificationService]
    });
    service = TestBed.inject(ClashBotNotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  })

  test('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Get Clash Notification', () => {
    test('When the window hostname is localhost, it should make a get call to localhost with port 81 for /api/notifications', (done) => {
      const userId = 1;
      const mockResponse: ClashBotNotification[] = [
        {
          alertLevel: 1,
          message: "Sample message",
          timeAdded: new Date("11-01-2022_11:11:11 EST")
        }
      ];
      stubLocation({hostname: "localhost"});
      service.retrieveClashNotificationsForUser(userId).subscribe((data) => {
        expect(data).toEqual(mockResponse);
        done();
      });
      const req = httpMock.expectOne(`http://localhost:81/api/notifications?id=${userId}`);
      req.flush(mockResponse);
    })
  })
});
