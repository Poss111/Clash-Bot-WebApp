import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingTournamentDetailsCardComponent } from './upcoming-tournament-details-card.component';

describe('UpcomingTournamentDetailsCardComponent', () => {
  let component: UpcomingTournamentDetailsCardComponent;
  let fixture: ComponentFixture<UpcomingTournamentDetailsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpcomingTournamentDetailsCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpcomingTournamentDetailsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
