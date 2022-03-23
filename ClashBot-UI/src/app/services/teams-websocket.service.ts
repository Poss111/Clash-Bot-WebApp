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
      this.subject = webSocket<ClashTeam|string>('/api/teams/ws/teams');
    } else {
      this.subject = webSocket<ClashTeam|string>(`wss://${window.location.hostname}/api/ws/teams`);
    }
  }

  getSubject() : WebSocketSubject<ClashTeam|string>{
   return this.subject;
  }

}
