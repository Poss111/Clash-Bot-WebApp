import { Injectable } from '@angular/core';
import { webSocket } from "rxjs/webSocket";
import {ClashTeam} from "../interfaces/clash-team";

@Injectable({
  providedIn: 'root'
})
export class TeamsWebsocketService {

  subject = webSocket<ClashTeam|string>("ws://localhost:80/ws");

  constructor() { }

}
