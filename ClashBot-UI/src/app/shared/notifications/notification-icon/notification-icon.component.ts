import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {ClashBotNotification} from "../../../interfaces/clash-bot-notification";

@Component({
  selector: 'app-notification-icon',
  templateUrl: './notification-icon.component.html',
  styleUrls: ['./notification-icon.component.scss']
})
export class NotificationIconComponent {

  @Input()
  notifications: ClashBotNotification[] = [];
  badgeHidden: boolean = false;
  showNotificationPanel: boolean = false;

  constructor() { }

  toggleBadgeVisibility() {
    this.badgeHidden = true;
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  dismissNotification(dismissedNotification: ClashBotNotification): void {
    this.notifications.splice(this.notifications.findIndex(notification => {
      return notification.from === dismissedNotification.from
          && notification.message === dismissedNotification.message;
    }), 1);
    console.log(this.notifications);
    console.log('Dismissed Notification.');
  }

}
