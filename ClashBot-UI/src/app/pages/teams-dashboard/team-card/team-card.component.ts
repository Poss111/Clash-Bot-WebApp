import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClashTeam, PlayerDetails} from "../../../interfaces/clash-team";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../../../dialogs/confirmation-dialog/confirmation-dialog.component";
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

  eventsSubject: any = {};
  imageUrl: string = '';
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
    this.team.playersDetails?.forEach(playerDetail => {
      this.eventsSubject[playerDetail.role] = new Subject<boolean>();
    });
    if(this.team && this.team.teamName) {
      this.imageUrl = this.buildPokemonGifUrl(this.team.teamName.split(' ')[1]);
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
        if (role) {
          this.eventsSubject[role].next(result);
        }
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

    buildPokemonGifUrl(pokemonName: string) {
        let name = pokemonName.toLowerCase();
        return `https://img.pokemondb.net/sprites/black-white/anim/normal/${name}.gif`;
    }
}
