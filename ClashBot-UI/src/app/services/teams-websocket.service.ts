import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {ClashTeam} from "../interfaces/clash-team";

@Injectable({
  providedIn: 'root'
})
export class TeamsWebsocketService {

  private subject = webSocket<ClashTeam|string>(`ws://${this.buildHostUrl('/api/teams/ws')}`);

  constructor() { }

  getSubject() : WebSocketSubject<ClashTeam|string>{
   return this.subject;
  }


  buildHostUrl(url: string): string {
    if (window.location.hostname === 'localhost') {
      return `${window.location.hostname}:80${url}`;
    }
    return url;
  }

}
