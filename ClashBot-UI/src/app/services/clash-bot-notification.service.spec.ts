import { TestBed } from '@angular/core/testing';

import { ClashBotNotificationService } from './clash-bot-notification.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {ClashBotNotification} from "../interfaces/clash-bot-notification";

describe('ClashBotNotificationService', () => {
  let service: ClashBotNotificationService;
  let httpMock: HttpTestingController;

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
          id: '1',
          alertLevel: 1,
          from: 'Me',
          message: "Sample message",
          timeAdded: new Date("11-01-2022_11:11:11 EST"),
          dismissed: false
        }
      ];
      service.retrieveClashNotificationsForUser(userId).subscribe((data) => {
        expect(data).toEqual(mockResponse);
        done();
      });
      const req = httpMock.expectOne(`/api/notifications?id=${userId}`);
      req.flush(mockResponse);
    })
  })

  describe('Dismiss Notification', () => {
    test('When I dismiss a notification, I should pass the notification id.', () => {
      const notificationId = '1';
      service.dismissNotification(notificationId)
      const req = httpMock.expectOne(`/api/notifications`);
      req.flush({});
    });
  });
});