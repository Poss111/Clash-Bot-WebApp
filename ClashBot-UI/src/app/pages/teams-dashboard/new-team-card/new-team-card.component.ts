import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {MatOption} from "@angular/material/core";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {CreateNewTeamDetails} from "../../../interfaces/create-new-team-details";

@Component({
  selector: 'app-new-team-card',
  templateUrl: './new-team-card.component.html',
  styleUrls: ['./new-team-card.component.scss']
})
export class NewTeamCardComponent implements OnInit {

  @Input()
  eligibleTournaments: ClashTournaments[] = [];

  @Output()
  createNewTeamEvent: EventEmitter<CreateNewTeamDetails> = new EventEmitter<CreateNewTeamDetails>();

  createNewTeamFormGroup?: FormGroup;
  tournamentControl: FormControl = new FormControl('');
  roleControl: FormControl = new FormControl('');
  creatingNewTeam: boolean = false;
  roles: any = {Top: 0, Mid: 1, Jg: 2, Bot: 3, Supp: 4};
  rolesAsString: string[] = Object.keys(this.roles);

  constructor() { }

  ngOnInit(): void {
    this.createNewTeamFormGroup = new FormGroup({
      tournament: this.tournamentControl,
      role: this.roleControl
    });
  }

  createNewTeam(option: MatOption) {
    option.select();
    let role = this.roleControl.value;
    let tournamentName = '';
    let tournamentDay = '';
    let clashTournaments: ClashTournaments | undefined;
    if (this.tournamentControl.value) {
      let split = this.tournamentControl.value.split(' ');
      tournamentName = split[0];
      tournamentDay = split[1];
    }
    if (clashTournaments && role) {
      option.deselect();
      const newTeamDetails: CreateNewTeamDetails = {
        tournamentName: tournamentName,
        tournamentDay: tournamentDay,
        role: role
      };
      this.createNewTeamEvent.emit(newTeamDetails);
    }
  }
}
