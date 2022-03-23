import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from "rxjs";
import {ClashBotNotification} from "../interfaces/clash-bot-notification";
import {HttpClient} from "@angular/common/http";
import {take} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ClashBotNotificationService {

  constructor(private httpClient: HttpClient) { }

  retrieveClashNotificationsForUser(userId: number): Observable<ClashBotNotification[]> {
    return this.httpClient.get<ClashBotNotification[]>("/api/notifications?id=1");
  }

  dismissNotification(notificationId: string) {
    this.httpClient.put<ClashBotNotification>("/api/notifications", { id: notificationId })
        .pipe(take(1))
        .subscribe();
  }
}
