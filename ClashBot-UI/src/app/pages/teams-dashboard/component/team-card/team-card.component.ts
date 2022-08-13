import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ClashTeam} from "../../../../interfaces/clash-team";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../../../../dialogs/confirmation-dialog/confirmation-dialog.component";
import {ClashBotUserRegister} from "../../../../interfaces/clash-bot-user-register";
import {TeamUiWrapper} from "src/app/interfaces/team-ui-wrapper";

@Component({
  selector: "app-team-card",
  templateUrl: "./team-card.component.html",
  styleUrls: ["./team-card.component.scss"]
})
export class TeamCardComponent implements OnInit {

  @Input()
  team: TeamUiWrapper = {};

  @Output()
  registerUser: EventEmitter<ClashBotUserRegister> = new EventEmitter<ClashBotUserRegister>();

  @Output()
  unregisterUser: EventEmitter<ClashTeam> = new EventEmitter<ClashTeam>();

  pokemonName: string = "";

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    if (this.team
        && !this.team.tournament) {
      this.team.tournament = {
        tournamentName: "Placeholder",
        tournamentDay: "1"
      };
    }
    if (this.team && this.team.name) {
      this.pokemonName = this.team.name;
    }
  }

  registerToTeam(role?: string) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent,
      {data: {message: `Are you sure you want to register to this Team as ${role}?`}});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const clashBotUserRegister: ClashBotUserRegister = {
          role: role,
          teamName: this.team.name,
          serverName: this.team.serverName,
          tournamentDetails: {
            tournamentName: this.team.tournament?.tournamentName,
            tournamentDay: this.team.tournament?.tournamentDay,
          }
        };
        this.registerUser.emit(clashBotUserRegister);
      }
    })
  }

  unregisterFromTeam() {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent,
      {data: {message: "Are you sure you want to unregister from this Team?"}});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.unregisterUser.emit(this.team);
      }
    })
  }

}
