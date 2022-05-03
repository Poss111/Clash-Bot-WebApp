import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MatOption} from "@angular/material/core";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {CreateNewTeamDetails} from "../../../interfaces/create-new-team-details";

@Component({
  selector: 'app-new-team-card',
  templateUrl: './new-team-card.component.html',
  styleUrls: ['./new-team-card.component.scss']
})
export class NewTeamCardComponent {

  @Input()
  eligibleTournaments: ClashTournaments[] = [];

  @Output()
  createNewTeamEvent: EventEmitter<CreateNewTeamDetails> = new EventEmitter<CreateNewTeamDetails>();

  tournamentControl: FormControl = new FormControl('', Validators.required);
  roleControl: FormControl = new FormControl('', Validators.required);
  creatingNewTeam: boolean = false;
  rolesAsString: string[] = ['Top', 'Mid', 'Jg', 'Bot', 'Supp'];

  constructor() {}

  createNewTeam(option: MatOption) {
    option.select();
    let role = this.roleControl.value;
    let tournamentName = '';
    let tournamentDay = '';
    if (this.tournamentControl.value) {
      let split = this.tournamentControl.value.split(' ');
      tournamentName = split[0];
      tournamentDay = split[1];
    }
    if (tournamentName && tournamentDay && role) {
      option.deselect();
      const newTeamDetails: CreateNewTeamDetails = {
        tournamentName: tournamentName,
        tournamentDay: tournamentDay,
        role: role
      };
      this.createNewTeamEvent.emit(newTeamDetails);
      this.tournamentControl.reset();
      this.roleControl.reset();
      this.creatingNewTeam = false;
    }
  }
}
