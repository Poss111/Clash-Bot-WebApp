import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTeamCardComponent } from './new-team-card.component';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {KebabCasePipe} from "../../../shared/kebab-case.pipe";
import {MatCardModule} from "@angular/material/card";

describe('NewTeamCardComponent', () => {
  let component: NewTeamCardComponent;
  let fixture: ComponentFixture<NewTeamCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NewTeamCardComponent,
        KebabCasePipe
      ],
      imports: [
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatOptionModule,
        MatSelectModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewTeamCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('On Init', () => {
    test('A form group should be created successfully on init of the component.', () => {
      component.ngOnInit()
      expect(component.createNewTeamFormGroup?.controls).toBeTruthy();
    })
  })

  describe('Create New Team', () => {
    test ('When createNewTeam is called, it should select the matOption given and should emit only if Tournament and Role are populated.', () => {
      const mockMatOption : any = {
        select: jest.fn().mockImplementation(),
        deselect: jest.fn().mockImplementation()
      }

      const createNewTeamEventMock : any = {
        emit: jest.fn().mockImplementation()
      };

      component.createNewTeamEvent = createNewTeamEventMock;

      component.createNewTeam(mockMatOption);

      expect(component.createNewTeamEvent.emit).not.toHaveBeenCalled();
      expect(mockMatOption.select).toHaveBeenCalledTimes(1);
    })

    test ('When createNewTeam is called, it should select the matOption given and should not emit if Tournament and not Role are populated.', () => {
      const mockMatOption : any = {
        select: jest.fn().mockImplementation(),
        deselect: jest.fn().mockImplementation()
      }

      const createNewTeamEventMock : any = {
        emit: jest.fn().mockImplementation()
      };

      component.createNewTeamEvent = createNewTeamEventMock;
      component.tournamentControl.setValue('awesome_sauce 1');

      component.createNewTeam(mockMatOption);

      expect(component.createNewTeamEvent.emit).not.toHaveBeenCalled();
      expect(mockMatOption.select).toHaveBeenCalledTimes(1);
    })

    test ('When createNewTeam is called, it should select the matOption given and should emit if Tournament and Role are populated.', () => {
      const mockMatOption : any = {
        select: jest.fn().mockImplementation(),
        deselect: jest.fn().mockImplementation()
      }

      const createNewTeamEventMock : any = {
        emit: jest.fn().mockImplementation()
      };

      component.createNewTeamEvent = createNewTeamEventMock;
      component.tournamentControl.setValue('awesome_sauce 1');
      component.roleControl.setValue('Top');

      component.createNewTeam(mockMatOption);

      expect(component.createNewTeamEvent.emit).toHaveBeenCalledWith({
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
        role: 'Top'
      });
      expect(mockMatOption.select).toHaveBeenCalledTimes(1);
      expect(mockMatOption.deselect).toHaveBeenCalledTimes(1);
    })
  })
});
