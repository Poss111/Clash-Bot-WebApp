import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClashTeam, PlayerDetails} from "../../../interfaces/clash-team";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../../../components/dialogs/confirmation-dialog/confirmation-dialog.component";
import {ClashBotUserRegister} from "../../../interfaces/clash-bot-user-register";
import {Observable, Subject, Subscription} from "rxjs";

@Component({
  selector: 'app-team-card',
  templateUrl: './team-card.component.html',
  styleUrls: ['./team-card.component.scss']
})
export class TeamCardComponent implements OnInit {

  @Input()
  team: ClashTeam = {};

  @Output()
  registerUser: EventEmitter<ClashBotUserRegister> = new EventEmitter<ClashBotUserRegister>();

  @Output()
  unregisterUser: EventEmitter<ClashTeam> = new EventEmitter<ClashTeam>();

  pokemonName: string = '';
  dateFormat: string = 'MMM d, y h:mm a';
  timezoneOffset: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    if (this.team
        && !this.team.tournamentDetails) {
      this.team.tournamentDetails = {
        tournamentName: 'Placeholder',
        tournamentDay: '1'
      };
    }
    if(this.team && this.team.teamName) {
      this.pokemonName = this.team.teamName.split(' ')[1].toLowerCase();
    }
  }

  registerToTeam(role?: string) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent,
      {data: { message: `Are you sure you want to register to this Team as ${role}?`}});
    console.log(this.team.teamName + " -> " + role);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const clashBotUserRegister: ClashBotUserRegister = {
          role: role,
          teamName: this.team.teamName,
          serverName: this.team.serverName,
          tournamentDetails: {
            tournamentName: this.team.tournamentDetails?.tournamentName,
            tournamentDay: this.team.tournamentDetails?.tournamentDay,
          }
        };
        this.registerUser.emit(clashBotUserRegister);
      }
    })
  }

  unregisterFromTeam() {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent,
      {data: { message: 'Are you sure you want to unregister from this Team?'}});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.unregisterUser.emit(this.team);
      }
    })
  }

}
