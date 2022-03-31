import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamCardPlayerDetailsComponent } from './team-card-player-details.component';
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {SharedModule} from "../../../../components/shared/shared.module";
import {SimpleChanges} from "@angular/core";

describe('TeamCardPlayerDetailsComponent', () => {
  let component: TeamCardPlayerDetailsComponent;
  let fixture: ComponentFixture<TeamCardPlayerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamCardPlayerDetailsComponent ],
      imports: [MatCardModule, MatIconModule, SharedModule]
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

  it('Should create with playerDetails given.', () => {
    fixture = TestBed.createComponent(TeamCardPlayerDetailsComponent);
    component = fixture.componentInstance;
    component.player =  { name: 'New User', id: 2, role: 'Top', champions: [] };
    fixture.detectChanges();
    expect(component.playerDetails).toEqual(component.player);
    expect(component.showPlayerDetails).toBeTruthy();
    expect(component.text.disappear).toBeFalsy();
    expect(component.button.disappear).toBeTruthy();
  });

  it('Should create without playerDetails given.', () => {
    fixture = TestBed.createComponent(TeamCardPlayerDetailsComponent);
    component = fixture.componentInstance;
    component.player =  { name: '', id: 2, role: 'Top', champions: [] };
    fixture.detectChanges();
    expect(component.playerDetails).toEqual(component.player);
    expect(component.showPlayerDetails).toBeFalsy();
    expect(component.text.disappear).toBeTruthy();
    expect(component.button.disappear).toBeFalsy();
  });

  describe('OnChanges', () => {
    it('If change is from player attribute, is not the first change and the update includes a name then the' +
        'button attribute with disappear should be set to true.', (done) => {
      const simpleChangesMock: SimpleChanges = {
        player: {
          currentValue: {
            id: 1,
            name: 'Someone',
            role: 'Top',
            champions: []
          },
          previousValue: {

          },
          isFirstChange: () => { return false; },
          firstChange: false
        }
      };
      component.player = {
        id: 1,
        name: 'Someone',
        role: 'Top',
        champions: []
      };
      component.ngOnChanges(simpleChangesMock);
      expect(component.button.disappear).toBeTruthy();
      setTimeout(() => {
        expect(component.playerDetails).toEqual(component.player);
        expect(component.showPlayerDetails).toBeTruthy();
        expect(component.text.disappear).toBeFalsy();
        done();
      }, 350)
    })


    it('If change is from player attribute, is not the first change and the update does not include a name then the' +
        'button attribute with disappear should be set to false.', (done) => {
      const simpleChangesMock: SimpleChanges = {
        player: {
          currentValue: {
            id: 1,
            name: '',
            role: 'Top',
            champions: []
          },
          previousValue: {

          },
          isFirstChange: () => { return false; },
          firstChange: false
        }
      };
      component.player = {
        id: 1,
        name: '',
        role: 'Top',
        champions: []
      };
      component.ngOnChanges(simpleChangesMock);
      expect(component.text.disappear).toBeTruthy();
      setTimeout(() => {
        expect(component.playerDetails).toEqual(component.player);
        expect(component.showPlayerDetails).toBeFalsy();
        expect(component.button.disappear).toBeFalsy();
        done();
      }, 350)
    })
  })

});
