import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TeamCardComponent} from './team-card.component';
import {MatCardModule} from "@angular/material/card";

describe('TeamCardComponent', () => {
  let component: TeamCardComponent;
  let fixture: ComponentFixture<TeamCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TeamCardComponent],
      imports: [MatCardModule]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamCardComponent);
    component = fixture.componentInstance;
  });

  test('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  test('Should add placeholder values for Tournament if no values are given', () => {
    component.team = {
      teamName: 'Test Team',
      startTime: '123'
    };
    fixture.detectChanges();
    expect(component.team.tournamentDetails).toBeTruthy();
    expect(component.team.tournamentDetails?.tournamentName).toEqual('Placeholder');
    expect(component.team.tournamentDetails?.tournamentDay).toEqual('1');
  })

  test('Should not modify tournament Details if they are given', () => {
    let expectedTeam = {
      teamName: 'Test Team',
      startTime: '123',
      tournamentDetails: {
        tournamentName: 'test_tournament',
        tournamentDay: '2'
      }
    }
    component.team = JSON.parse(JSON.stringify(expectedTeam));
    fixture.detectChanges();
    expect(component.team.tournamentDetails).toEqual(expectedTeam.tournamentDetails);
  })
});
