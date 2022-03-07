import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {ClashTeam} from "../interfaces/clash-team";
import {ClashBotNotification} from "../interfaces/clash-bot-notification";

@Injectable({
  providedIn: 'root'
})
export class NotificationsWsService {

  private readonly subject;

  constructor() {
    if (window.location.hostname === 'localhost') {
      this.subject = webSocket<ClashBotNotification|number>(`ws://${this.buildLocalhostUrl('/api/notifications/ws')}`);
    } else {
      this.subject = webSocket<ClashBotNotification|number>(`wss://${window.location.hostname}/api/notifications/ws`);
    }
  }

  getSubject() : WebSocketSubject<ClashBotNotification|number>{
    return this.subject;
  }

  buildLocalhostUrl(url: string): string {
    return `${window.location.hostname}:82${url}`;
  }

}
