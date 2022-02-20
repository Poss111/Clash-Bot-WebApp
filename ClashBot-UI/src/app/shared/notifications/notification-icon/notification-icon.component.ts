import {AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ClashBotNotification} from "../../../interfaces/clash-bot-notification";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {Subscription} from "rxjs";
import {CdkOverlayOrigin, ConnectedPosition, FlexibleConnectedPositionStrategy, OverlayRef} from "@angular/cdk/overlay";

@Component({
  selector: 'app-notification-icon',
  templateUrl: './notification-icon.component.html',
  styleUrls: ['./notification-icon.component.scss']
})
export class NotificationIconComponent implements AfterViewInit, OnDestroy {

  @Input()
  notifications: ClashBotNotification[] = [];

  badgeHidden: boolean = false;
  showNotificationPanel: boolean = false;
  classList: string[] = [];
  $applicationDetailsServiceSubscription?: Subscription;
  connectedPosition: ConnectedPosition[] = [];

  constructor(private applicationDetailsService: ApplicationDetailsService) { }

  ngAfterViewInit(): void {
    this.connectedPosition.push({
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top'
    })
    this.$applicationDetailsServiceSubscription = this.applicationDetailsService.getApplicationDetails()
        .subscribe((applicationDetails) => {
          console.log(`Dark Mode updated... ${applicationDetails.darkMode}`);
      if (applicationDetails.darkMode) {
        this.classList.pop();
        this.classList.push('darkMode');
      } else {
        this.classList.pop();
        this.classList.push('lightMode');
      }
      console.log(this.classList);
    });
  }

  ngOnDestroy() {
    this.$applicationDetailsServiceSubscription?.unsubscribe();
  }

  toggleBadgeVisibility() {
    this.badgeHidden = true;
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  dismissNotification(dismissedNotification: ClashBotNotification): void {
    this.notifications.splice(this.notifications.findIndex(notification => {
      return notification.from === dismissedNotification.from
          && notification.message === dismissedNotification.message;
    }), 1);
  }

}
