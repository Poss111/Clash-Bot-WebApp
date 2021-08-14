import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {UserDetails} from "./user-details";

@Injectable({
  providedIn: 'root'
})
export class DiscordService {

  hostName: string = 'https://discord.com/api';

  constructor(private httpClient: HttpClient) { }

  getGuilds(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.hostName}/users/@me/guilds`);
  }

  getUserDetails(): Observable<UserDetails> {
    return this.httpClient.get<UserDetails>(`${this.hostName}/users/@me`);
  }

}