import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ChampionData} from "../interfaces/championData";
import {take} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class RiotDdragonService {

  baseHost: string = 'https://ddragon.leagueoflegends.com'
  host?: string;

  constructor(private httpClient: HttpClient) {
      if (!this.host) {
        this.httpClient.get<string[]>(`${this.baseHost}/api/versions.json`)
          .pipe(take(1))
          .subscribe((versions) => {
              this.host = `${this.baseHost}/cdn/${versions.sort().pop()}`
          });
      }
  }

  getListOfChampions(): Observable<ChampionData> {
      return this.httpClient.get<ChampionData>(`${this.host}/data/en_US/champion.json`);
  }
}
