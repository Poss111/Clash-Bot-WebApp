import {Component, Input} from "@angular/core";
import {ClashTournamentCalendarHeaderComponent} from "../clash-tournament-calendar-header/clash-tournament-calendar-header.component";

@Component({
  selector: "app-clash-tournament-calendar",
  templateUrl: "./clash-tournament-calendar.component.html",
  styleUrls: ["./clash-tournament-calendar.component.scss"]
})
export class ClashTournamentCalendarComponent {

  @Input()
  daysSelected: any[] = [];

  isSelected = (event: any) => {
    return this.daysSelected.find(x => (x.getMonth() + 1).toString() == (event.getMonth() + 1).toString() && x.getDate().toString() == event.getDate().toString()) ? "selected" : "notselected";
  };

  event: any;
  minDate: Date = new Date();
  calendarHeaderComponent: any = ClashTournamentCalendarHeaderComponent;

  constructor() { }

}
