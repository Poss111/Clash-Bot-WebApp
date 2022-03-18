import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit, Output,
  ViewChild,
  ViewRef
} from '@angular/core';
import {ClashBotNotification} from "../interfaces/clash-bot-notification";
import {MatSidenav} from "@angular/material/sidenav";
import {NotificationsWsService} from "../services/notifications-ws.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-username-notifications',
  templateUrl: './username-notifications.component.html',
  styleUrls: ['./username-notifications.component.scss']
})
export class UsernameNotificationsComponent implements OnInit, OnDestroy {

  @ViewChild('drawer') sidenav: MatSidenav | undefined;

  badgeNumber: number = 0;
  badgeHidden: boolean = true;

  notificationsSubscription$: Subscription | undefined = undefined;

  @Input()
  username: string = "";

  @Output()
  openNotifications: EventEmitter<void> = new EventEmitter<void>();

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if(!this.eRef.nativeElement.contains(event.target)) {
      this.sidenav?.close();
    }
  }

  constructor(private eRef: ElementRef,
              public notificationsWsService: NotificationsWsService) { }

  ngOnInit(): void {
    this.notificationsSubscription$ = this.notificationsWsService.notifications.subscribe((subscriptionNotifications) => {
      this.badgeNumber = subscriptionNotifications.filter((notification) => !notification.dismissed).length;
      this.badgeHidden = this.badgeNumber == 0;
    });
  }

  ngOnDestroy() {
    this.notificationsSubscription$?.unsubscribe();
  }

  openNotificationsPanel() {
    this.openNotifications.emit();
  }
}
