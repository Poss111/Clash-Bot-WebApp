import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClashTournamentCalendarHeaderComponent } from './clash-tournament-calendar-header.component';
import {MatCalendar} from "@angular/material/datepicker";
import {MatIconModule} from "@angular/material/icon";
import {ChangeDetectorRef} from "@angular/core";
import {DateAdapter, MatNativeDateModule} from "@angular/material/core";

jest.mock('@angular/material/datepicker')

describe('ClashTournamentCalendarHeaderComponent', () => {
  let component: ClashTournamentCalendarHeaderComponent;
  let fixture: ComponentFixture<ClashTournamentCalendarHeaderComponent>;
  let calendar: MatCalendar<any>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClashTournamentCalendarHeaderComponent ],
      imports: [ MatIconModule, MatNativeDateModule ],
      providers: [ MatCalendar, ChangeDetectorRef, DateAdapter ]
    })
    .compileComponents();
    calendar = TestBed.inject(MatCalendar);
  });

  beforeEach(() => {
    calendar.activeDate = new Date();
    fixture = TestBed.createComponent(ClashTournamentCalendarHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Previous Clicked', () => {
    test('When prevClicked is called and the monthsPast is 0, it should not update the calendar current view.', () => {
      fixture = TestBed.createComponent(ClashTournamentCalendarHeaderComponent);
      component = fixture.componentInstance;
      component.prevClicked();
      expect(calendar._goToDateInView).not.toHaveBeenCalled();
    })

    test('When prevClicked is called and the monthsPast is greater than 0, it should update the calendar current view.', () => {
      fixture = TestBed.createComponent(ClashTournamentCalendarHeaderComponent);
      component = fixture.componentInstance;
      component.monthsPastDate = 1;
      component.prevClicked();
      expect(calendar._goToDateInView).toHaveBeenCalledTimes(1);
      expect(component.monthsPastDate).toEqual(0);
    })
  })

  describe('Next Clicked', () => {

    test('When nextClicked is called and the monthsPast, it should update the calendar current view by one.', () => {
      fixture = TestBed.createComponent(ClashTournamentCalendarHeaderComponent);
      component = fixture.componentInstance;
      component.monthsPastDate = 0;
      component.nextClicked();
      expect(calendar._goToDateInView).toHaveBeenCalledTimes(1);
      expect(component.monthsPastDate).toEqual(1);
    })
  })


});
