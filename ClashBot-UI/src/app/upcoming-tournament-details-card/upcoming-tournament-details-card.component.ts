import {Component, Input, OnInit} from '@angular/core';
import {ClashTournaments} from "../interfaces/clash-tournaments";

@Component({
  selector: 'app-upcoming-tournament-details-card',
  templateUrl: './upcoming-tournament-details-card.component.html',
  styleUrls: ['./upcoming-tournament-details-card.component.scss']
})
export class UpcomingTournamentDetailsCardComponent implements OnInit {

  @Input()
  tournaments: ClashTournaments[] = [
    {
      tournamentName: 'awesome_sauce',
      tournamentDay: '1',
      startTime: 'September 04 2021 07:00 pm PDT',
      registrationTime: 'September 14 2021 12:58 am PDT'
    }
  ];
  currentDate?: Date;
  dateFormat: string = 'MMM d, y h:mm:ss a z';
  timezoneOffset: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  constructor() {
  }

  ngOnInit(): void {
    this.currentDate = new Date();
    console.log(new Date(this.tournaments[0].startTime).toUTCString());
    console.log(new Date(this.tournaments[0].startTime).getTimezoneOffset());
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }

}
