import {AfterViewInit, Component, Input, OnDestroy} from '@angular/core';
import {ClashBotNotification} from "../../../interfaces/clash-bot-notification";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {Subscription} from "rxjs";
import {ConnectedPosition} from "@angular/cdk/overlay";
import {NotificationsWsService} from "../../../services/notifications-ws.service";

@Component({
  selector: 'app-notification-icon',
  templateUrl: './notification-icon.component.html',
  styleUrls: ['./notification-icon.component.scss']
})
export class NotificationIconComponent implements AfterViewInit, OnDestroy {

  badgeNumber: number = 0;

  badgeHidden: boolean = false;
  showNotificationPanel: boolean = false;
  classList: string[] = [];
  $applicationDetailsServiceSubscription?: Subscription;
  $notificationWsSubscription?: Subscription;
  connectedPosition: ConnectedPosition[] = [];

  constructor(private applicationDetailsService: ApplicationDetailsService,
              public notificationsWsService: NotificationsWsService) { }

  ngAfterViewInit(): void {
    this.$notificationWsSubscription = this.notificationsWsService.notifications.subscribe((subscriptionNotifications) => {
      this.badgeNumber = subscriptionNotifications.filter((notification) => !notification.dismissed).length;
      this.badgeHidden = this.badgeNumber == 0;
    });
    this.connectedPosition.push({
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top'
    });
    this.$applicationDetailsServiceSubscription = this.applicationDetailsService.getApplicationDetails()
        .subscribe((applicationDetails) => {
      if (applicationDetails.darkMode) {
        this.classList.pop();
        this.classList.push('darkMode');
      } else {
        this.classList.pop();
        this.classList.push('lightMode');
      }
    });
  }

  ngOnDestroy() {
    this.$applicationDetailsServiceSubscription?.unsubscribe();
    this.$notificationWsSubscription?.unsubscribe();
  }

  togglePanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  dismissNotification(dismissedNotification: ClashBotNotification): void {
    this.notificationsWsService.dismissNotification(dismissedNotification.id);
  }

}
