import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {ClashTeam} from "../interfaces/clash-team";

@Injectable({
  providedIn: 'root'
})
export class TeamsWebsocketService {

  private readonly subject;

  constructor() {
    if (window.location.hostname === 'localhost') {
      this.subject = webSocket<ClashTeam|string>(`ws://${this.buildHostUrl('/api/ws/teams')}`);
    } else {
      this.subject = webSocket<ClashTeam|string>(`(wss|https)://${window.location.hostname}/api/ws/teams`);
    }
  }

  getSubject() : WebSocketSubject<ClashTeam|string>{
   return this.subject;
  }

  buildHostUrl(url: string): string {
    if (window.location.hostname === 'localhost') {
      return `${window.location.hostname}:80${url}`;
    }
    return `wss://${url}`;
  }

}
