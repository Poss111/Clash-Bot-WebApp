import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {ClashTeam} from "../interfaces/clash-team";

@Injectable({
  providedIn: 'root'
})
export class TeamsWebsocketService {

  private subject = webSocket<ClashTeam|string>(`${this.buildHostUrl('/api/ws/teams')}`);

  constructor() { }

  getSubject() : WebSocketSubject<ClashTeam|string>{
   return this.subject;
  }


  buildHostUrl(url: string): string {
    if (window.location.hostname === 'localhost') {
      return `ws://${window.location.hostname}:80${url}`;
    }
    return `wss://${url}`;
  }

}
