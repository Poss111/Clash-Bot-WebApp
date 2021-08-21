import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {ChampionData} from "../interfaces/championData";

@Injectable({
  providedIn: 'root'
})
export class RiotDdragonService {

  host: string = 'https://ddragon.leagueoflegends.com/cdn/11.16.1/data/en_US';

  constructor(private httpClient: HttpClient) { }

  getListOfChampions(): Observable<ChampionData> {
    const championPayload: ChampionData = {
      type: '1',
      format: 'json',
      version: '1.23',
      data: {
        'Aatrox': {},
        'Ahri': {},
        'Anivia': {},
        'Annie': {}
      }
    }
    return of(championPayload);
      // return this.httpClient.get<ChampionData>(`${this.host}/champion.json`);
  }
}
