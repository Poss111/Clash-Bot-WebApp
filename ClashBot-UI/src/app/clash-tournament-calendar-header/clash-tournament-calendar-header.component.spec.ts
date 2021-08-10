import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClashTournamentCalendarHeaderComponent } from './clash-tournament-calendar-header.component';

describe('ClashTournamentCalendarHeaderComponent', () => {
  let component: ClashTournamentCalendarHeaderComponent;
  let fixture: ComponentFixture<ClashTournamentCalendarHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClashTournamentCalendarHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClashTournamentCalendarHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
