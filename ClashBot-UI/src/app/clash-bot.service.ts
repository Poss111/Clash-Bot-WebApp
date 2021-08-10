import {Injectable, isDevMode} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ClashTeam} from "./clash-team";
import {Observable} from "rxjs";
import {ClashTournaments} from "./clash-tournaments";

@Injectable()
export class ClashBotService {

  constructor(private httpClient: HttpClient) { }

  getClashTeams(server: string): Observable<ClashTeam[]> {
    if (isDevMode()) {
      return this.httpClient.get<ClashTeam[]>(`${window.location.protocol}//${window.location.hostname}:80/api/teams/${server}`);
    } else {
      return this.httpClient.get<ClashTeam[]>(`/api/teams/${server}`);
    }
  }

  getClashTournaments(): Observable<ClashTournaments[]> {
    if (isDevMode()) {
      return this.httpClient.get<ClashTournaments[]>(`${window.location.protocol}//${window.location.hostname}:80/api/tournaments`);
    } else {
      return this.httpClient.get<ClashTournaments[]>(`/api/tournaments`);
    }
  }

}
