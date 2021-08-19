import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ClashTeam} from "./clash-team";
import {Observable, of} from "rxjs";
import {ClashTournaments} from "./clash-tournaments";
import {UserDetails} from "./user-details";
import {ClashBotGenericResponse} from "./clash-bot-generic-response";
import {ClashBotUserDetails} from "./clash-bot-user-details";

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

  unregisterUserFromTeam(userDetail: UserDetails, teamRequest: ClashTeam): Observable<ClashBotGenericResponse> {
    let payload = {
      id: userDetail.id,
      username: userDetail.username,
      teamName: teamRequest.teamName,
      serverName: teamRequest.serverName,
      tournamentName: teamRequest.tournamentDetails?.tournamentName,
      tournamentDay: teamRequest.tournamentDetails?.tournamentDay
    };
    return this.httpClient.delete<ClashBotGenericResponse>(this.buildHostUrl('/api/team/register'), { body: payload});
  }

  buildHostUrl(url: string): string {
    if (window.location.hostname === 'localhost') {
      return `${window.location.protocol}//${window.location.hostname}:80${url}`;
    }
    return url;
  }

  createNewTeam(userDetail: UserDetails, teamRequest: ClashTeam): Observable<ClashTeam> {
    let payload = {
      id: userDetail.id,
      username: userDetail.username,
      teamName: teamRequest.teamName,
      serverName: teamRequest.serverName,
      tournamentName: teamRequest.tournamentDetails?.tournamentName,
      tournamentDay: teamRequest.tournamentDetails?.tournamentDay,
      startTime: teamRequest.startTime
    };
    return this.httpClient.post<ClashTeam>(this.buildHostUrl('/api/team'), payload);
  }

  getUserDetails(): Observable<ClashBotUserDetails> {
    const userSubscriptionSettings = new Map<string, boolean>();
    userSubscriptionSettings.set('UpcomingClashTournamentDiscordDM', true);
    const preferredChampions = new Set<string>();
    preferredChampions.add('Volibear');
    preferredChampions.add('Ornn');
    preferredChampions.add('Sett');
    return of({
      id: '12345566',
      username: 'Roïdräge',
      preferredChampions: preferredChampions,
      subscriptions: userSubscriptionSettings
    })
  }
}
