import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClashTeam} from "../../../interfaces/clash-team";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../../../confirmation-dialog/confirmation-dialog.component";

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

  @Output()
  unregisterUser: EventEmitter<ClashTeam> = new EventEmitter<ClashTeam>();

  imageUrl: string = '';

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
      this.imageUrl = this.buildPokemonGifUrl(this.team.teamName.split(' ')[1]);
    }
  }

  registerToTeam() {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {data: { message: 'Are you sure you want to register to this Team?'}});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.registerUser.emit(this.team);
      }
    })
  }

  unregisterFromTeam() {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {data: { message: 'Are you sure you want to unregister from this Team?'}});
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
