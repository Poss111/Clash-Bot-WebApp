import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {ClashBotNotification} from "../interfaces/clash-bot-notification";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ClashBotNotificationService {

  constructor(private httpClient: HttpClient) { }

  retrieveClashNotificationsForUser(userId: number): Observable<ClashBotNotification[]> {
    return this.httpClient.get<ClashBotNotification[]>("http://localhost:81/api/notifications?id=1");
  }

}
