import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {ClashTeam} from "../interfaces/clash-team";
import {ClashBotNotification} from "../interfaces/clash-bot-notification";
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {ClashBotNotificationService} from "./clash-bot-notification.service";
import {take} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class NotificationsWsService {

  private readonly subject;
  notifications: BehaviorSubject<ClashBotNotification[]> = new BehaviorSubject<ClashBotNotification[]>([]);
  subjectSubscription$: Subscription | undefined;

  constructor(private notificationService: ClashBotNotificationService) {
    notificationService.retrieveClashNotificationsForUser(1)
        .pipe(take(1))
        .subscribe((latestNotifications) => {
          this.notifications.next(latestNotifications);
        });
    if (window.location.hostname === 'localhost') {
      this.subject = webSocket<ClashBotNotification|number>('/api/notifications/ws');
    } else {
      this.subject = webSocket<ClashBotNotification|number>(`wss://${window.location.hostname}/api/notifications/ws`);
    }
  }

  connectToNotificationUpdates(userId: number) : void {
    this.subjectSubscription$ = this.subject.subscribe((newNotification) => {
      if (newNotification instanceof Number) {
        this.notifications
            .pipe(take(1))
            .subscribe((userNotifications) => {
              userNotifications.unshift(newNotification as ClashBotNotification)
              this.notifications.next(userNotifications);
        });
      }
    });
  }

  dismissNotification(id: string) : void {
    this.notifications
        .pipe(take(1))
        .subscribe((currentNotifications) => {
          currentNotifications.splice(
              currentNotifications.findIndex(notification =>
                  notification.id === id), 1);
          this.notifications.next(currentNotifications);
    });
  }

  destroy() {
    this.subjectSubscription$?.unsubscribe();
  }
}
