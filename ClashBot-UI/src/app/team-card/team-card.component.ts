import {Component, Input, OnInit} from '@angular/core';
import {ClashTeam} from "../clash-team";
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-team-card',
  templateUrl: './team-card.component.html',
  styleUrls: ['./team-card.component.scss']
})
export class TeamCardComponent implements OnInit {

  @Input()
  team: ClashTeam = {};

  constructor() {
  }

  ngOnInit(): void {
    if (this.team && !this.team.tournamentDetails) {
      moment.tz.setDefault();
      this.team.tournamentDetails = {
        tournamentName: 'Placeholder',
        tournamentDay: '1'
      };
    } else {
      this.team.startTime = moment(this.team.startTime, 'MMMM DD yyyy hh:mm a z')
        .tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
        .format('MMMM DD yyyy hh:mm a z');
    }
  }
}
