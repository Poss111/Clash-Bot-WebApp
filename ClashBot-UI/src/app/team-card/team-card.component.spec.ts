import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TeamCardComponent} from './team-card.component';
import {MatCardModule} from "@angular/material/card";
import {MatDialog} from "@angular/material/dialog";
import {TestScheduler} from "rxjs/testing";
import {MatIconModule} from "@angular/material/icon";

jest.mock("@angular/material/dialog");

describe('TeamCardComponent', () => {
  let component: TeamCardComponent;
  let fixture: ComponentFixture<TeamCardComponent>;
  let matDialogMock: MatDialog;
  let openMock: any;
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    await TestBed.configureTestingModule({
      declarations: [TeamCardComponent],
      imports: [MatCardModule, MatIconModule],
      providers: [MatDialog]
    })
      .compileComponents();
    matDialogMock = TestBed.inject(MatDialog);
    openMock = jest.fn();
    matDialogMock.open = openMock;
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

  describe('Emit registerToTeam Event', () => {
    test('When I emit a event from registerToTeam and the dialog is accepted, I should emit the current Team Card details.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        const expectedObservable = cold('-x|', {
          x: true
        });
        jest.spyOn(component.registerUser, 'emit');
        let mockedDialogReturn = {
          afterClosed: () => {
            return expectedObservable;
          }
        };
        openMock.mockReturnValue(mockedDialogReturn);
        component.registerToTeam();
        expectObservable(expectedObservable).toBe('-x|', {x: true})
        flush();
        expect(component.registerUser.emit).toHaveBeenCalled();
      })
    })

    test('When I emit a event from registerToTeam and the dialog is rejected, I should not pass the current Team Card details.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        const expectedObservable = cold('-x|', {x: undefined});
        jest.spyOn(component.registerUser, 'emit');
        let mockedDialogReturn = {
          afterClosed: () => {
            return expectedObservable;
          }
        };
        openMock.mockReturnValue(mockedDialogReturn);
        component.registerToTeam();
        expectObservable(expectedObservable).toBe('-x|', {x: undefined})
        flush();
        expect(component.registerUser.emit).not.toHaveBeenCalled();
      })
    })
  })

  describe('Emit unregisterToTeam Event', () => {
    test('When I emit an event to unregisterFromTeam and the dialog is accepted, then I should emit the Team for the card.', () => {
      testScheduler.run((helpers) => {
        const {cold, expectObservable, flush} = helpers;
        const expectedObservable = cold('-x|', {
          x: true
        });
        jest.spyOn(component.unregisterUser, 'emit');
        let mockedDialogReturn = {
          afterClosed: () => {
            return expectedObservable;
          }
        };
        openMock.mockReturnValue(mockedDialogReturn);
        component.unregisterFromTeam();
        expectObservable(expectedObservable).toBe('-x|', {x: true})
        flush();
        expect(component.unregisterUser.emit).toHaveBeenCalled();
      })
    })
  })

  describe('Build team card poke image url', () => {
    test('When a pokemon name is passed, a url should be returned reflecting the correct image url for it.', () => {
      let exepectedName = 'Pikachu';
      expect(component.buildPokemonGifUrl(exepectedName)).toEqual('https://img.pokemondb.net/sprites/black-white/anim/normal/pikachu.gif');
    })
  })
});
