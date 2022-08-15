import {Component} from "@angular/core";
import {MatCalendar} from "@angular/material/datepicker";

@Component({
  selector: "app-clash-tournament-calendar-header",
  templateUrl: "./clash-tournament-calendar-header.component.html",
  styleUrls: ["./clash-tournament-calendar-header.component.scss"]
})
export class ClashTournamentCalendarHeaderComponent {

  monthsPastDate: number = 0;

  constructor(private calendar: MatCalendar<any>) {}

  prevClicked() {
    if (this.monthsPastDate > 0) {
      this.monthsPastDate--;
      this.calendar._goToDateInView(new Date(new Date().setMonth(this.calendar.activeDate.getMonth() - 1)), "month");
    }
  }

  nextClicked() {
    this.monthsPastDate++;
    this.calendar._goToDateInView(new Date(new Date().setMonth(this.calendar.activeDate.getMonth() + 1)), "month");
  }

}
