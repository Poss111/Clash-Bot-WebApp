import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output
} from "@angular/core";
import {Observable} from "rxjs";
import {PlayerUiWrapper} from "src/app/interfaces/team-ui-wrapper";

@Component({
    selector: "app-team-card-player-details",
    templateUrl: "./team-card-player-details.component.html",
    styleUrls: ["./team-card-player-details.component.scss"]
})
export class TeamCardPlayerDetailsComponent implements OnInit {

    @Input()
    player: PlayerUiWrapper = {name: "Hello", id: "1", role: "Top", champions: [], isUser: false};

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
        if (!this.player.role) {
            this.player.role = "Top";
        }
        const lsApiVersion = window.localStorage.getItem("leagueApiVersion");
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
