import {Component, Input, OnInit} from '@angular/core';
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
}
