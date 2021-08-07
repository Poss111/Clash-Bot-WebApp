import {Injectable, isDevMode} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ClashTeam} from "./clash-team";
import {Observable} from "rxjs";

@Injectable()
export class ClashBotService {

  constructor(private httpClient: HttpClient) { }


  getClashTeams(): Observable<ClashTeam[]> {
    if (isDevMode()) {
      return this.httpClient.get<ClashTeam[]>(`${window.location.protocol}//${window.location.hostname}:80/api/teams`);
    } else {
      return this.httpClient.get<ClashTeam[]>(`/api/teams`);
    }
  }
}
