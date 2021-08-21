import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {UserDetails} from "../interfaces/user-details";
import {DiscordGuild} from "../interfaces/discord-guild";

@Injectable()
export class DiscordService {

  hostName: string = 'https://discord.com/api';

  constructor(private httpClient: HttpClient) { }

  getGuilds(): Observable<any[]> {
    const discordGuilds: DiscordGuild[] = [
      {
        features: [],
        icon: '12321321',
        id: '1',
        name: 'LoL-ClashBotSupport',
        owner: true,
        permissions: 1,
        permissions_new: '0'
      }
    ]
    return of(discordGuilds);
    // return this.httpClient.get<any[]>(`${this.hostName}/users/@me/guilds`);
  }

  getUserDetails(): Observable<UserDetails> {
    const userDetails: UserDetails = {
      id: '1',
      username: 'Roïdräge',
      discriminator: '12321'
    };
    return of(userDetails);
    // return this.httpClient.get<UserDetails>(`${this.hostName}/users/@me`);
  }

}
