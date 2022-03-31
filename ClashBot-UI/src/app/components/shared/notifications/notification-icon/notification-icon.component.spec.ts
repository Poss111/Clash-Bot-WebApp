import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationIconComponent } from './notification-icon.component';
import {OverlayModule} from "@angular/cdk/overlay";
import {MatIconModule} from "@angular/material/icon";
import {MatBadgeModule} from "@angular/material/badge";
import {NotificationsComponent} from "../notifications.component";

describe('NotificationIconComponent', () => {
  let component: NotificationIconComponent;
  let fixture: ComponentFixture<NotificationIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
        imports: [OverlayModule, MatIconModule, MatBadgeModule],
      declarations: [ NotificationIconComponent, NotificationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('togglePanel', () => {
      test('When togglePanel is called, it should flip the boolean value of the badge visibility.', () => {
          component.showNotificationPanel = true;
          component.togglePanel();
          expect(component.showNotificationPanel).toBeFalsy();
      })
  })

  describe('dismissNotification', () => {
    test('When a dismiss notification event is passed, it should remove the notification from the list.', () => {
        component.notifications = [{
          id: '1',
          alertLevel: 1,
          from: 'Me',
          message: 'idk',
          timeAdded: new Date(),
          dismissed: false
        }];
        const notificationToBeDismissed = {
            id: '1',
            alertLevel: 1,
            from: 'Me',
            message: 'idk',
            timeAdded: new Date(),
            dismissed: false
        };
        component.dismissNotification(notificationToBeDismissed);
        expect(component.notifications.length).toBe(0);
    })
  })

    test('When a dismiss notification event is passed, and a matching notification is not found, it should do nothing.', () => {
        component.notifications = [{
          id: '1',
          alertLevel: 1,
          from: 'Me',
          message: 'idk',
          timeAdded: new Date(),
          dismissed: false
        }];
        const notificationToBeDismissed = {
            id: '2',
            alertLevel: 1,
            from: 'Me',
            message: 'idk',
            timeAdded: new Date(),
            dismissed: false
        };
        component.dismissNotification(notificationToBeDismissed);
        expect(component.notifications.length).toBe(1);
    })
});
