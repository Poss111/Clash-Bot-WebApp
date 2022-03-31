import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ClashBotNotification} from "../../interfaces/clash-bot-notification";
import {BreakpointObserver, Breakpoints, BreakpointState} from "@angular/cdk/layout";
import {Observable, Subject, Subscription} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {NotificationsWsService} from "../../services/notifications-ws.service";

@Component({
  selector: 'app-clash-user-panel',
  templateUrl: './clash-user-panel.component.html',
  styleUrls: ['./clash-user-panel.component.scss']
})
export class ClashUserPanelComponent implements OnInit, OnDestroy {

  destroyed = new Subject<void>();

  notifications: ClashBotNotification[] = [];

  @Input()
  username: string = '';

  @Output()
  openNotifications: EventEmitter<void> = new EventEmitter<void>();

  isSmallScreen$: Observable<BreakpointState> | undefined;

  constructor(private breakpointObserver: BreakpointObserver) { }

  ngOnInit() {
    this.isSmallScreen$ = this.breakpointObserver.observe([Breakpoints.XSmall,
      Breakpoints.Small]);
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  openNotificationsPanel() {
    this.openNotifications.emit();
  }
}
