import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ClashTeam} from "./clash-team";
import {Observable} from "rxjs";

@Injectable()
export class ClashBotService {

  host: string = 'http://localhost:8000';

  constructor(private httpClient: HttpClient) { }


  getClashTeams(): Observable<ClashTeam[]> {
    return this.httpClient.get<ClashTeam[]>(`${this.host}/teams`);
  }
}
