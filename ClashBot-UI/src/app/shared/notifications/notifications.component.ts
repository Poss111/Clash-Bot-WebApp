import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClashBotNotification} from "../../interfaces/clash-bot-notification";

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {

  @Input()
  notification?: ClashBotNotification;
  dateFormat: string = 'MMM d, y h:mm a';
  timezoneOffset: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
  showClass: string = '';

  @Output()
  dismissEvent: EventEmitter<ClashBotNotification> = new EventEmitter<ClashBotNotification>();

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => {
      this.showClass = 'show';
    }, 200);
  }

  dismissNotification(): void {
    this.showClass = '';
    this.dismissEvent.emit(this.notification);
  }

}
