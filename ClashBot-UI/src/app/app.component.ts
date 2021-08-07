import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClashTeam} from "./clash-team";
import {ClashBotService} from "./clash-bot.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Clash-Bot';
  teams: ClashTeam[] = [
    {
      teamName: 'Team Kayn',
      playersDetails: [
        {
          name: 'Roïdräge',
          champions: ['Volibear', 'Ornn', 'Sett'],
          role: 'Top'
        },
        {
          name: 'TheIncentive',
          champions: ['Lucian'],
          role: 'ADC'
        },
        {
          name: 'Pepe Conrad',
          champions: ['Lucian'],
          role: 'Jg'
        }
      ]
    }
  ];
  clashServiceSubscription: Subscription | undefined;


  constructor(private clashBotService: ClashBotService) {
  }

  ngOnInit(): void {
    this.clashServiceSubscription = this.clashBotService
      .getClashTeams()
      .subscribe((data: ClashTeam[]) => {
        this.teams = data;
      });
  }

  ngOnDestroy(): void {
    if (this.clashServiceSubscription) {
      this.clashServiceSubscription.unsubscribe();
    }
  }

}
