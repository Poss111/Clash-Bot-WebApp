import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamsTentativeTableComponent } from './teams-tentative-table.component';
import {MatIconModule} from "@angular/material/icon";
import {MatTableModule} from "@angular/material/table";
import {MatDialog} from "@angular/material/dialog";
import {ClashBotTentativeDetails} from "../../../interfaces/clash-bot-tentative-details";
import { of } from 'rxjs';
import {ConfirmationDialogComponent} from "../../../dialogs/confirmation-dialog/confirmation-dialog.component";

jest.mock("@angular/material/dialog");

describe('TeamsTentativeTableComponent', () => {
  let component: TeamsTentativeTableComponent;
  let fixture: ComponentFixture<TeamsTentativeTableComponent>;
  let matDialogMock: MatDialog;
  let openMock: any;
  let afterClosedMock: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamsTentativeTableComponent ],
      imports: [
          MatIconModule,
          MatTableModule
      ],
      providers: [MatDialog]
    })
    .compileComponents();
    matDialogMock = TestBed.inject(MatDialog);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamsTentativeTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Tentative Register', () => {

    test('When tentative Register is called and the user is a member, there should be a MatDialog called asking to be removed from the tentative list.', (done) => {
      afterClosedMock = jest.fn().mockReturnValueOnce({
        pipe: jest.fn().mockReturnValue(of(true))
      });
      openMock = jest.fn().mockReturnValueOnce( {
        afterClosed:  afterClosedMock
      })
      matDialogMock.open = openMock;
      const mockClashBotTentativeDetails : ClashBotTentativeDetails = {
        serverName: "ClashBot",
        tentativePlayers: ["Roidrage"],
        tournamentDetails: {
          tournamentName: "awesome_sauce",
          tournamentDay: "1"
        },
        isMember: true
      };
      component.register.subscribe((event) => {
        mockClashBotTentativeDetails.index = 1;
        expect(openMock).toHaveBeenCalledWith(ConfirmationDialogComponent, {data: { message:`Are you sure you want to be removed from the Tentative list for this tournament?`}});
        expect(event).toEqual(mockClashBotTentativeDetails);
        done();
      });
      component.tentativeRegister(mockClashBotTentativeDetails, 1);
    })

    test('When tentative Register is called and the user is not a member, there should be a MatDialog called asking to be added to the tentative list.', (done) => {
      afterClosedMock = jest.fn().mockReturnValueOnce({
        pipe: jest.fn().mockReturnValue(of(true))
      });
      openMock = jest.fn().mockReturnValueOnce( {
        afterClosed:  afterClosedMock
      })
      matDialogMock.open = openMock;
      const mockClashBotTentativeDetails : ClashBotTentativeDetails = {
        serverName: "ClashBot",
        tentativePlayers: ["Roidrage"],
        tournamentDetails: {
          tournamentName: "awesome_sauce",
          tournamentDay: "1"
        },
        isMember: false
      };
      component.register.subscribe((event) => {
        mockClashBotTentativeDetails.index = 1;
        expect(openMock).toHaveBeenCalledWith(ConfirmationDialogComponent, {data: { message:`Are you sure you want to be added to the Tentative list for this tournament?`}});
        expect(event).toEqual(mockClashBotTentativeDetails);
        done();
      });
      component.tentativeRegister(mockClashBotTentativeDetails, 1);
    })

    test('When tentative Register is called and the user selects not to be placed on tentative, there should not be an event emitted.', () => {
      afterClosedMock = jest.fn().mockReturnValueOnce({
        pipe: jest.fn().mockReturnValue(of(false))
      });
      openMock = jest.fn().mockReturnValueOnce( {
        afterClosed:  afterClosedMock
      })
      matDialogMock.open = openMock;
      component.register.emit = jest.fn().mockImplementation();
      const mockClashBotTentativeDetails : ClashBotTentativeDetails = {
        serverName: "ClashBot",
        tentativePlayers: ["Roidrage"],
        tournamentDetails: {
          tournamentName: "awesome_sauce",
          tournamentDay: "1"
        },
        isMember: false
      };
      component.tentativeRegister(mockClashBotTentativeDetails, 1);
      expect(openMock).toHaveBeenCalledWith(ConfirmationDialogComponent, {data: { message:`Are you sure you want to be added to the Tentative list for this tournament?`}});
      expect(component.register.emit).not.toHaveBeenCalled();
    })

  })

  describe('OnChanges', () => {
    test('When on changes is called, it should make a call to render the rows again for the mat-table.', () => {
      const mock: any = jest.fn();
      const renderRowMock: any = {
        renderRows: jest.fn().mockImplementation()
      };

      component.table = renderRowMock;
      component.ngOnChanges(mock);
      expect(component.table?.renderRows).toHaveBeenCalledTimes(1);
    })
  })
});
