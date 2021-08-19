import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ChampionData} from "./championData";

@Injectable({
  providedIn: 'root'
})
export class RiotDdragonService {

  host: string = 'https://ddragon.leagueoflegends.com/cdn/9.3.1/data/en_US';

  constructor(private httpClient: HttpClient) { }

  getListOfChampions(): Observable<ChampionData> {
      return this.httpClient.get<ChampionData>(`${this.host}/champion.json`);
  }
}
