import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ClashTournamentCalendarComponent} from "./clash-tournament-calendar.component";
import {MatNativeDateModule} from "@angular/material/core";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatCardModule} from "@angular/material/card";
import {NgModule} from "@angular/core";
import {ClashTournamentCalendarHeaderComponent} from "../clash-tournament-calendar-header/clash-tournament-calendar-header.component";
import {MatIconModule} from "@angular/material/icon";


@NgModule({
  declarations: [ClashTournamentCalendarHeaderComponent],
  entryComponents: [ClashTournamentCalendarHeaderComponent],
  imports: [MatIconModule]
})
class ClashTournamentCalendarHeaderTestModule {
}

describe("ClashTournamentCalendarComponent", () => {
  let component: ClashTournamentCalendarComponent;
  let fixture: ComponentFixture<ClashTournamentCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClashTournamentCalendarComponent ],
      imports: [MatCardModule, MatDatepickerModule, MatNativeDateModule, ClashTournamentCalendarHeaderTestModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClashTournamentCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test("should create", () => {
    expect(component).toBeTruthy();
  });

  test("Is Selected function should return true if the data passed to it matches one of the days given as an input.", () => {
    let mockDaysSelect = [];
    let currentDate = new Date();
    let tomorrowDate = new Date();
    tomorrowDate.setDate(currentDate.getDate() + 1);
    mockDaysSelect.push(currentDate);
    mockDaysSelect.push(tomorrowDate);
    component.daysSelected = mockDaysSelect;
    let yesterday = new Date();
    yesterday.setDate(currentDate.getDate() - 1);
    let twoDaysAhead = new Date();
    twoDaysAhead.setDate(currentDate.getDate() + 2);
    expect(component.isSelected(yesterday)).toEqual("notselected");
    expect(component.isSelected(twoDaysAhead)).toEqual("notselected");
    expect(component.isSelected(currentDate)).toEqual("selected");
    expect(component.isSelected(tomorrowDate)).toEqual("selected");
  })

  test("The minimum date for the calendar should be set to today.", () => {
    expect(isToday(component.minDate)).toBeTruthy();
  })

  test("The calendar header component should be of instance ClashTournamentCalendarHeaderComponent", () => {
    expect(component.calendarHeaderComponent).toBeTruthy();
  })

  let isToday = (date: Date) => {
    let today = new Date();
    return date.getDay() === today.getDay() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

});
