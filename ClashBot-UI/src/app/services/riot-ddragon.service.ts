import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ChampionData} from "../interfaces/championData";

@Injectable({
  providedIn: 'root'
})
export class RiotDdragonService {

  host: string = 'https://ddragon.leagueoflegends.com/cdn/11.16.1/data/en_US';

  constructor(private httpClient: HttpClient) { }

  getListOfChampions(): Observable<ChampionData> {
      return this.httpClient.get<ChampionData>(`${this.host}/champion.json`);
  }
}
