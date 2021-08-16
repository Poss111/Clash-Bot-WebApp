import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ClashTeam} from "./clash-team";
import {Observable} from "rxjs";
import {ClashTournaments} from "./clash-tournaments";
import {UserDetails} from "./user-details";

@Injectable()
export class ClashBotService {

  constructor(private httpClient: HttpClient) {
  }

  getClashTeams(server: string): Observable<ClashTeam[]> {
    return this.httpClient.get<ClashTeam[]>(this.buildHostUrl(`/api/teams/${server}`));
  }

  getClashTournaments(): Observable<ClashTournaments[]> {
    return this.httpClient.get<ClashTournaments[]>(this.buildHostUrl('/api/tournaments'));
  }

  registerUserForTeam(userDetail: UserDetails, teamRequest: ClashTeam): Observable<ClashTeam> {
    let payload = {
      id: userDetail.id,
      username: userDetail.username,
      teamName: teamRequest.teamName,
      serverName: teamRequest.serverName,
      tournamentName: teamRequest.tournamentDetails?.tournamentName,
      tournamentDay: teamRequest.tournamentDetails?.tournamentDay
    }
    return this.httpClient.post<ClashTeam>(this.buildHostUrl('/api/team/register'), payload);
  }

  buildHostUrl(url: string): string {
    if (window.location.hostname === 'localhost') {
      return `${window.location.protocol}//${window.location.hostname}:80${url}`;
    }
    return url;
  }
}
