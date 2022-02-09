import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    OnDestroy,
    Output,
    ViewChild,
    ElementRef,
    OnChanges, SimpleChanges, ChangeDetectionStrategy
} from '@angular/core';
import {PlayerDetails} from "../../../../interfaces/clash-team";
import {Observable, Subscription} from "rxjs";

@Component({
    selector: 'app-team-card-player-details',
    templateUrl: './team-card-player-details.component.html',
    styleUrls: ['./team-card-player-details.component.scss']
})
export class TeamCardPlayerDetailsComponent implements OnInit, OnChanges {

    @Input()
    player: PlayerDetails = {name: 'Hello', id: 1, role: 'Top', champions: []};

    playerDetails: PlayerDetails = {name: 'Hello', id: 1, role: 'Top', champions: []};

    @Input()
    event: Observable<boolean> = new Observable<boolean>();

    @Output()
    registerUserForRole: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    unregisterUserForRole: EventEmitter<string> = new EventEmitter<string>();

    showPlayerDetails: boolean = false;

    button = {
        disappear: false
    }

    text = {
        disappear: false
    }

    constructor() {
    }

    ngOnInit(): void {
        Object.assign(this.playerDetails, this.player);
        this.showPlayerDetails = this.playerDetails.name !== '';
        if (this.showPlayerDetails) {
            this.text.disappear = false;
            this.button.disappear = true;
        } else {
            this.text.disappear = true;
            this.button.disappear = false;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.player && !changes.player.isFirstChange()) {
                if (changes.player.currentValue.name !== '') {
                    this.button.disappear = true;
                    setTimeout(() => {
                        Object.assign(this.playerDetails, this.player);
                        this.showPlayerDetails = true;
                        this.text.disappear = false;
                    }, 300);
                } else {
                    this.text.disappear = true;
                    setTimeout(() => {
                        Object.assign(this.playerDetails, this.player);
                        this.showPlayerDetails = false;
                        this.button.disappear = false;
                    }, 300);
                }
        }
    }

    registerToTeam(role: string) {
        this.registerUserForRole.emit(role);
    }

    unregisterFromTeam() {
        this.unregisterUserForRole.emit();
    }
}
