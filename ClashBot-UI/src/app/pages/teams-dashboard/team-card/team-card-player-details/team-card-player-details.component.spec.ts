import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamCardPlayerDetailsComponent } from './team-card-player-details.component';

describe('TeamCardPlayerDetailsComponent', () => {
  let component: TeamCardPlayerDetailsComponent;
  let fixture: ComponentFixture<TeamCardPlayerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamCardPlayerDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamCardPlayerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
