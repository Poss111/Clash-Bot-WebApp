import {Component, EventEmitter, Input, Output} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {MatOption} from "@angular/material/core";
import {CreateNewTeamDetails} from "../../../../interfaces/create-new-team-details";
import {Tournament} from "clash-bot-service-api/model/tournament";

@Component({
  selector: "app-new-team-card",
  templateUrl: "./new-team-card.component.html",
  styleUrls: ["./new-team-card.component.scss"]
})
export class NewTeamCardComponent {

  @Input()
  eligibleTournaments: Tournament[] = [];

  @Output()
  createNewTeamEvent: EventEmitter<CreateNewTeamDetails> = new EventEmitter<CreateNewTeamDetails>();

  tournamentControl: FormControl = new FormControl("", Validators.required);
  roleControl: FormControl = new FormControl("", Validators.required);
  creatingNewTeam: boolean = false;
  rolesAsString: string[] = ["Top", "Mid", "Jg", "Bot", "Supp"];

  constructor() {}

  createNewTeam(option: MatOption) {
    option.select();
    let role = this.roleControl.value;
    let tournamentName = "";
    let tournamentDay = "";
    if (this.tournamentControl.value) {
      let split = this.tournamentControl.value.split(" ");
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
