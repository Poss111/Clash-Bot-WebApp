import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';
import {PlayerDetails} from "../../../../../interfaces/clash-team";
import {Observable} from "rxjs";
import {RiotDdragonService} from "../../../../../services/riot-ddragon.service";

@Component({
    selector: 'app-team-card-player-details',
    templateUrl: './team-card-player-details.component.html',
    styleUrls: ['./team-card-player-details.component.scss']
})
export class TeamCardPlayerDetailsComponent implements OnInit {

    @Input()
    player: PlayerDetails = {name: 'Hello', id: 1, role: 'Top', champions: []};

    @Input()
    event: Observable<boolean> = new Observable<boolean>();

    @Output()
    registerUserForRole: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    unregisterUserForRole: EventEmitter<void> = new EventEmitter<void>();

    showPlayerDetails: boolean = false;
    apiVersion?: string;

    constructor() {}

    ngOnInit() {
        const lsApiVersion = window.localStorage.getItem('leagueApiVersion');
        if (lsApiVersion && !this.apiVersion) {
            this.apiVersion = lsApiVersion;
        }
        if (!this.player.champions) {
            this.player.champions=[];
        }
    }

    registerToTeam(role: string) {
        this.registerUserForRole.emit(role);
    }

    unregisterFromTeam() {
        this.unregisterUserForRole.emit();
    }
}
