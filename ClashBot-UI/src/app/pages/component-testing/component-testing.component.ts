import { Component, OnInit } from '@angular/core';
import {ClashTeam} from "../../interfaces/clash-team";

@Component({
  selector: 'app-component-testing',
  templateUrl: './component-testing.component.html',
  styleUrls: ['./component-testing.component.scss']
})
export class ComponentTestingComponent {

  sampleTeam: ClashTeam = {
    userOnTeam: true,
    teamName: 'Team Charizard',
    playersDetails: [
      {
        name: 'Roidrage',
        role: 'Top',
        champions: ['Sett', 'Volibear', 'Ornn']
      },
      {
        name: 'TheIncentive',
        role: 'ADC',
        champions: ['Lucian', 'Senna', 'Jhin']
      }
    ],
    tournamentDetails: {
      tournamentName: 'awesome_sauce',
      tournamentDay: '1'
    },
    serverName: 'Goon Squad',
    startTime: new Date().toISOString(),
    id: 'charizard'
  }

  constructor() { }

}
