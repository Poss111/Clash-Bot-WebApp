import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {UserDetails} from "../interfaces/user-details";
import {environment} from "../../environments/environment";

@Injectable()
export class DiscordService {

  hostName: string = 'https://discord.com';

  constructor(private httpClient: HttpClient) { }

  getGuilds(): Observable<any[]> {
    return this.httpClient.get<any[]>(this.buildHostUrl('/api/users/@me/guilds'));
  }

  getUserDetails(): Observable<UserDetails> {
    return this.httpClient.get<UserDetails>(this.buildHostUrl('/api/users/@me'));
  }

  buildHostUrl(url: string): string {
    if (!environment.production) {
      return `${window.location.protocol}//${window.location.hostname}:3000${url}`;
    } else {
      return `${this.hostName}${url}`;
    }
  }

}
