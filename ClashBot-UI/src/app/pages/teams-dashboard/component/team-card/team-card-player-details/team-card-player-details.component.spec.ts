import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TeamCardPlayerDetailsComponent} from './team-card-player-details.component';
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {SharedModule} from "../../../../../shared/shared.module";
import {MatExpansionModule} from "@angular/material/expansion";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {RiotDdragonService} from "../../../../../services/riot-ddragon.service";
import Mock = jest.Mock;

jest.mock('../../../../../services/riot-ddragon.service')

describe('TeamCardPlayerDetailsComponent', () => {
  let component: TeamCardPlayerDetailsComponent;
  let fixture: ComponentFixture<TeamCardPlayerDetailsComponent>;
  let riotDdragonService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamCardPlayerDetailsComponent ],
      imports: [
          MatCardModule,
          MatIconModule,
          SharedModule,
          MatExpansionModule,
          BrowserAnimationsModule
      ],
      providers: [
          RiotDdragonService
      ]
    })
    .compileComponents();
    riotDdragonService = TestBed.inject(RiotDdragonService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamCardPlayerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });

  describe("OnInit", () => {
    test("If the player champion array is empty, then it should populate with an empty array.", () => {
      component.player = { name: 'Hi', id: 2, role: 'Mid'}

      component.ngOnInit();

      expect(component.player.champions).toHaveLength(0)
    })

    test("If the riotDdragonService has a baseUrl, then it should populate the baseUrl property.", () => {
      window.localStorage.setItem('leagueApiVersion', '12.8.1');

      component.ngOnInit();

      expect(component.apiVersion).toEqual('12.8.1')
    })
  })

  describe("Register Team", () => {
    test("When registerToTeam is called, it should be emitted with the player role.", (done) => {
      component.registerUserForRole.subscribe((value) => {
        expect(value).toEqual('Top');
        done();
      })
      component.registerToTeam('Top');
    })
  })

  describe("Unregister Team", () => {
    test("When unregisterFromTeam is called, it should be emitted with the player role.", () => {
      component.unregisterUserForRole = {
        emit: jest.fn().mockImplementation()
      } as any;
      component.unregisterFromTeam();
      expect(component.unregisterUserForRole.emit).toHaveBeenCalledTimes(1);
    })
  })
});
