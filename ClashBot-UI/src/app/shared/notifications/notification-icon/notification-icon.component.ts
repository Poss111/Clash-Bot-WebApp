import {AfterViewInit, Component, Input, OnDestroy} from '@angular/core';
import {ClashBotNotification} from "../../../interfaces/clash-bot-notification";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {Subscription} from "rxjs";
import {ConnectedPosition} from "@angular/cdk/overlay";

@Component({
  selector: 'app-notification-icon',
  templateUrl: './notification-icon.component.html',
  styleUrls: ['./notification-icon.component.scss']
})
export class NotificationIconComponent implements AfterViewInit, OnDestroy {

  private _notifications: ClashBotNotification[] = [];
  badgeNumber: number = 0;

  @Input()
  set notifications(array: ClashBotNotification[]) {
    this._notifications = array.sort().reverse();
    this.updateNumberOfAvailable();
    this.badgeHidden = this.badgeNumber <= 0;
  }
  get notifications() {
    return this._notifications;
  }

  badgeHidden: boolean = false;
  showNotificationPanel: boolean = false;
  classList: string[] = [];
  $applicationDetailsServiceSubscription?: Subscription;
  connectedPosition: ConnectedPosition[] = [];

  constructor(private applicationDetailsService: ApplicationDetailsService) { }

  updateNumberOfAvailable() {
    this.badgeNumber = this._notifications.filter((notification) => !notification.dismissed).length;
  }

  ngAfterViewInit(): void {
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
  }

  togglePanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  dismissNotification(dismissedNotification: ClashBotNotification): void {
    this.notifications.splice(this.notifications.findIndex(notification =>
    notification.id.localeCompare(dismissedNotification.id)), 1);
    this.updateNumberOfAvailable();
  }

}
