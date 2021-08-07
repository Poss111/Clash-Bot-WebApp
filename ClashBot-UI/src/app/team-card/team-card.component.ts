import {Component, Input, OnInit} from '@angular/core';
import {ClashTeam} from "../clash-team";

@Component({
  selector: 'app-team-card',
  templateUrl: './team-card.component.html',
  styleUrls: ['./team-card.component.scss']
})
export class TeamCardComponent implements OnInit {

  @Input()
  team: ClashTeam = {};

  constructor() { }

  ngOnInit(): void {
    console.log(JSON.stringify(this.team));
    if (this.team && !this.team.tournamentDetails) {
      this.team.tournamentDetails ={
        tournamentName: 'Placeholder',
        tournamentDay: '1'
      };
    }
  }

}
