import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ChampionData} from "../interfaces/championData";
import {take} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class RiotDdragonService {

    baseHost: string = 'https://ddragon.leagueoflegends.com'

    constructor(private httpClient: HttpClient) {}

    getListOfChampions(): Observable<ChampionData> {
        return this.httpClient.get<ChampionData>(`${this.baseHost}/cdn/${window.localStorage.getItem('leagueApiVersion')}/data/en_US/champion.json`);
    }

    getVersions(): Observable<string[]>{
        return this.httpClient.get<string[]>(`${this.baseHost}/api/versions.json`)
    }
}
