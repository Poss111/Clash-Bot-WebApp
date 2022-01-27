import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamCardPlayerDetailsComponent } from './team-card-player-details.component';
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";

describe('TeamCardPlayerDetailsComponent', () => {
  let component: TeamCardPlayerDetailsComponent;
  let fixture: ComponentFixture<TeamCardPlayerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamCardPlayerDetailsComponent ],
      imports: [MatCardModule, MatIconModule]
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
