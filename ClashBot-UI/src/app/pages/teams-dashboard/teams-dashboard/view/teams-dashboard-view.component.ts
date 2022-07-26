import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ClashTournaments} from "../../../../interfaces/clash-tournaments";
import {ClashBotTentativeDetails} from "../../../../interfaces/clash-bot-tentative-details";
import {ClashTeam} from "../../../../interfaces/clash-team";
import {ClashBotUserRegister} from "../../../../interfaces/clash-bot-user-register";
import {TeamFilter} from "../../../../interfaces/team-filter";
import {CreateNewTeamDetails} from "../../../../interfaces/create-new-team-details";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {Tentative} from "clash-bot-service-api/model/tentative";

@Component({
  selector: 'app-teams-dashboard-view',
  templateUrl: './teams-dashboard-view.component.html',
  styleUrls: ['./teams-dashboard-view.component.scss']
})
export class TeamsDashboardViewComponent {

  @Input()
  eligibleTournaments: Tournament[] = [];

  @Input()
  teams: ClashTeam[] = [];

  @Input()
  tentativeList?: Tentative[] = [];

  @Input()
  teamFilters: TeamFilter[] = [];

  @Input()
  defaultServer?: string;

  @Input()
  tentativeDataStatus: string = 'NOT_LOADED';

  @Input()
  showSpinner?: boolean;

  @Input()
  canCreateNewTeam?: boolean;

  @Output()
  createTeamEvent: EventEmitter<CreateNewTeamDetails> = new EventEmitter<CreateNewTeamDetails>();

  @Output()
  unregisterFromTeamEvent: EventEmitter<ClashTeam> = new EventEmitter<ClashTeam>();

  @Output()
  registerForTeamEvent: EventEmitter<ClashBotUserRegister> = new EventEmitter<ClashBotUserRegister>();

  @Output()
  tentativeRegisterEvent: EventEmitter<ClashBotTentativeDetails> = new EventEmitter<ClashBotTentativeDetails>();

  @Output()
  filterTeamEvent: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  createNewTeam($event: CreateNewTeamDetails) {
    this.createTeamEvent.emit($event);
  }

  unregisterFromTeam($event: ClashTeam) {
    this.unregisterFromTeamEvent.emit($event);
  }

  registerForTeam($event: ClashBotUserRegister) {
    this.registerForTeamEvent.emit($event);
  }

  tentativeRegister($event: ClashBotTentativeDetails) {
    this.tentativeRegisterEvent.emit($event)
  }

  filterTeam($event: string) {
    this.filterTeamEvent.emit($event);
  }
}
