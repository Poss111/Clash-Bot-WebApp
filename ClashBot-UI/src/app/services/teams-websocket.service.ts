import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {ClashTeam} from "../interfaces/clash-team";

@Injectable({
  providedIn: 'root'
})
export class TeamsWebsocketService {

  private subject = webSocket<ClashTeam|string>("ws://localhost:80/ws");

  constructor() { }

  getSubject() : WebSocketSubject<ClashTeam|string>{
   return this.subject;
  }

}
