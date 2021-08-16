import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClashTeam} from "../clash-team";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: 'app-team-card',
  templateUrl: './team-card.component.html',
  styleUrls: ['./team-card.component.scss']
})
export class TeamCardComponent implements OnInit {

  @Input()
  team: ClashTeam = {};

  @Output()
  registerUser: EventEmitter<ClashTeam> = new EventEmitter<ClashTeam>();

  constructor(private dialog: MatDialog) {
  }

  ngOnInit(): void {
    if (this.team && !this.team.tournamentDetails) {
      this.team.tournamentDetails = {
        tournamentName: 'Placeholder',
        tournamentDay: '1'
      };
    }
  }

  registerToTeam() {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.registerUser.emit(this.team);
      }
    })
  }
}
