import {Component, Input} from '@angular/core';
import {ClashTournaments} from "../../interfaces/clash-tournaments";

@Component({
  selector: 'app-upcoming-tournament-details-card',
  templateUrl: './upcoming-tournament-details-card.component.html',
  styleUrls: ['./upcoming-tournament-details-card.component.scss']
})
export class UpcomingTournamentDetailsCardComponent {

  @Input()
  tournaments: ClashTournaments[] = [];
  currentDate?: Date = new Date();
  dateFormat: string = 'MMM d, y h:mm a';
  timezoneOffset: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  constructor() {}

}
