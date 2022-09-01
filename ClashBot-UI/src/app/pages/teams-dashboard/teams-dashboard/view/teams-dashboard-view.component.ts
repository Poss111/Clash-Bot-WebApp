import {AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {ClashBotUserRegister} from "../../../../interfaces/clash-bot-user-register";
import {TeamFilter} from "../../../../interfaces/team-filter";
import {CreateNewTeamDetails} from "../../../../interfaces/create-new-team-details";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {TeamUiWrapper} from "src/app/interfaces/team-ui-wrapper";
import {TentativeRecord} from "../../../../interfaces/tentative-record";
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltip, MatTooltipDefaultOptions} from "@angular/material/tooltip";
import {MatDrawer} from "@angular/material/sidenav";
import {DiscordGuild} from "../../../../interfaces/discord-guild";
import {animate, style, transition, trigger} from "@angular/animations";

/** Custom options the configure the tooltip's default show/hide delays. */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 0,
  hideDelay: 1000,
  touchendHideDelay: 1000,
};

@Component({
  selector: "app-teams-dashboard-view",
  templateUrl: "./teams-dashboard-view.component.html",
  styleUrls: ["./teams-dashboard-view.component.scss"],
  providers: [{provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults}],
  animations: [
    trigger(
        "inOutAnimation",
        [
          transition(
              ":enter",
              [
                style({opacity: 0}),
                animate("1s ease-out",
                    style({opacity: 1}))
              ]
          ),
          transition(
              ":leave",
              [
                style({opacity: 1}),
                animate("1s ease-in",
                    style({opacity: 0}))
              ]
          )
        ]
    )
  ]
})
export class TeamsDashboardViewComponent implements AfterViewInit {

  @Input()
  selectedServer: DiscordGuild = {
    features: [],
    icon: "",
    id: "",
    name: "",
    owner: false,
    permissions: 0,
    permissions_new: ""
  };

  @Input()
  eligibleTournaments: Tournament[] = [];

  @Input()
  teams: TeamUiWrapper[] = [];

  @Input()
  tentativeList?: TentativeRecord[] = [];

  @Input()
  teamFilters: TeamFilter[] = [];

  @Input()
  defaultServer?: DiscordGuild;

  @Input()
  tentativeDataStatus: string = "NOT_LOADED";

  @Input()
  showSpinner?: boolean;

  @Input()
  canCreateNewTeam?: boolean;

  @Output()
  createTeamEvent: EventEmitter<CreateNewTeamDetails> = new EventEmitter<CreateNewTeamDetails>();

  @Output()
  unregisterFromTeamEvent: EventEmitter<TeamUiWrapper> = new EventEmitter<TeamUiWrapper>();

  @Output()
  registerForTeamEvent: EventEmitter<ClashBotUserRegister> = new EventEmitter<ClashBotUserRegister>();

  @Output()
  tentativeRegisterEvent: EventEmitter<TentativeRecord> = new EventEmitter<TentativeRecord>();

  @Output()
  filterTeamEvent: EventEmitter<DiscordGuild> = new EventEmitter<DiscordGuild>();

  @ViewChild("tooltip") tooltip?: MatTooltip;

  @ViewChild("drawer") drawer?: MatDrawer;

  freeAgent: boolean = false;

  constructor(private cd: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    this.tooltip?.show();
    this.cd.detectChanges();
    setTimeout(() => this.tooltip?.hide(), 2000);
  }

  createNewTeam($event: CreateNewTeamDetails) {
    this.createTeamEvent.emit($event);
  }

  unregisterFromTeam($event: TeamUiWrapper) {
    this.unregisterFromTeamEvent.emit($event);
  }

  registerForTeam($event: ClashBotUserRegister) {
    this.registerForTeamEvent.emit($event);
  }

  tentativeRegister($event: TentativeRecord) {
    this.tentativeRegisterEvent.emit($event)
  }

  filterTeam($event: DiscordGuild) {
    this.filterTeamEvent.emit($event);
    this.drawer?.toggle();
    this.selectedServer = $event;
  }

  swap() {
    this.freeAgent = !this.freeAgent;
  }
}
