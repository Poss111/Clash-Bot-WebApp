import {Component, Input, OnInit} from '@angular/core';
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

  constructor() { }

  ngOnInit(): void {
  }

}
