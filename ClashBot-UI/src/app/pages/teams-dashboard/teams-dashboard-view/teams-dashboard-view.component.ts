import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {ClashBotTentativeDetails} from "../../../interfaces/clash-bot-tentative-details";
import {ClashTeam} from "../../../interfaces/clash-team";
import {ClashBotUserRegister} from "../../../interfaces/clash-bot-user-register";
import {TeamFilter} from "../../../interfaces/team-filter";
import {CreateNewTeamDetails} from "../../../interfaces/create-new-team-details";

@Component({
  selector: 'app-teams-dashboard-view',
  templateUrl: './teams-dashboard-view.component.html',
  styleUrls: ['./teams-dashboard-view.component.scss']
})
export class TeamsDashboardViewComponent implements OnInit {

  @Input()
  eligibleTournaments: ClashTournaments[] = [];

  @Input()
  teams: ClashTeam[] = [];

  @Input()
  tentativeList: ClashBotTentativeDetails[] = [];

  @Input()
  teamFilters: TeamFilter[] = [];

  @Input()
  defaultServer?: string;

  @Output()
  createTeamEvent: EventEmitter<CreateNewTeamDetails> = new EventEmitter<CreateNewTeamDetails>();

  @Output()
  unregisterFromTeamEvent: EventEmitter<ClashTeam> = new EventEmitter<ClashTeam>();

  @Output()
  registerForTeamEvent: EventEmitter<ClashTeam> = new EventEmitter<ClashTeam>();

  @Output()
  tentativeRegisterEvent: EventEmitter<ClashBotTentativeDetails> = new EventEmitter<ClashBotTentativeDetails>();

  @Output()
  filterTeamEvent: EventEmitter<string> = new EventEmitter<string>();

  canCreateNewTeam: boolean = false;
  tentativeDataStatus: string = 'NOT_LOADED';
  showSpinner: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  createNewTeam($event: any) {
    
  }

  unregisterFromTeam($event: ClashTeam) {
    
  }

  registerForTeam($event: ClashBotUserRegister) {
    
  }

  tentativeRegister($event: any) {
    
  }

  filterTeam($event: any) {

  }
}
