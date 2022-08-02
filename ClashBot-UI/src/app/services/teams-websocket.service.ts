import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {Team} from "clash-bot-service-api";

@Injectable({
  providedIn: 'root'
})
export class TeamsWebsocketService {

  private subject$: WebSocketSubject<Team|string>| undefined;

  constructor() {}

  connect(serverName: string) : WebSocketSubject<Team|string> {
    if (!this.subject$ || this.subject$.closed){
      if (window.location.hostname === 'localhost') {
        this.subject$ = webSocket<Team|string>(`ws://${this.buildLocalhostUrl(`/ws/teams?serverName=${encodeURIComponent(serverName)}`)}`);
      } else {
        this.subject$ = webSocket<Team|string>(`wss://${window.location.hostname}/ws/teams?serverName=${encodeURIComponent(serverName)}`);
      }
    }
    return this.subject$;
  }

  buildLocalhostUrl(url: string): string {
      return `${window.location.hostname}:8081${url}`;
  }

}
