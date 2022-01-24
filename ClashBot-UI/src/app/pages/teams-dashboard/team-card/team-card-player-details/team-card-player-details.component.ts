import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PlayerDetails} from "../../../../interfaces/clash-team";

@Component({
  selector: 'app-team-card-player-details',
  templateUrl: './team-card-player-details.component.html',
  styleUrls: ['./team-card-player-details.component.scss']
})
export class TeamCardPlayerDetailsComponent implements OnInit {

  @Input()
  player: PlayerDetails = { name: 'Hello', id: 1, role: 'Top', champions: []};

  @Output()
  registerUserForRole: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  unregisterUserForRole: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

  registerToTeam(role: string) {
    this.registerUserForRole.emit(role);
  }

  unregisterFromTeam() {
    this.unregisterUserForRole.emit();
  }
}
