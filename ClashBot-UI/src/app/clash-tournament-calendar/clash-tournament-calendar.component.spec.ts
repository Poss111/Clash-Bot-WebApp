import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClashTournamentCalendarComponent } from './clash-tournament-calendar.component';

describe('ClashTournamentCalendarComponent', () => {
  let component: ClashTournamentCalendarComponent;
  let fixture: ComponentFixture<ClashTournamentCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClashTournamentCalendarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClashTournamentCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
