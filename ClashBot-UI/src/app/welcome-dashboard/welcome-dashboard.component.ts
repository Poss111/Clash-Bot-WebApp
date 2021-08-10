import {Component, ViewEncapsulation} from '@angular/core';
import {ClashBotService} from "../clash-bot.service";
@Component({
  selector: 'app-welcome-dashboard',
  templateUrl: './welcome-dashboard.component.html',
  styleUrls: ['./welcome-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WelcomeDashboardComponent {
  tournamentDays: any[] = [];
  dataLoaded: boolean = false;

  constructor(private clashBotService: ClashBotService) {
    this.clashBotService.getClashTournaments().subscribe((data) => {
      data.forEach(tournament => this.tournamentDays.push(new Date(tournament.startTime)));
      this.dataLoaded = true;
    });
  }

}
