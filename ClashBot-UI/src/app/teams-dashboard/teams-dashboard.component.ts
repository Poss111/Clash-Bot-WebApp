import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClashTeam} from "../clash-team";
import {TeamFilter} from "../team-filter";
import {Subscription, throwError} from "rxjs";
import {Server} from "../server";
import {FormControl} from "@angular/forms";
import {ClashBotService} from "../clash-bot.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FilterType} from "../filter-type";
import {catchError, finalize, timeout} from "rxjs/operators";
import {MatChip} from "@angular/material/chips";

@Component({
  selector: 'app-teams-dashboard',
  templateUrl: './teams-dashboard.component.html',
  styleUrls: ['./teams-dashboard.component.scss']
})
export class TeamsDashboardComponent implements OnInit, OnDestroy {
  teams: ClashTeam[] = [];
  teamFilters: TeamFilter[] = [];
  clashTeamsServiceSubscription: Subscription | undefined;
  color: any;
  mode: any;
  value: any;
  showSpinner: boolean;
  servers: Server[] = [
    {
      name: 'Goon Squad',
      state: false
    },
    {
      name: 'quiet souls',
      state: false
    }
  ];
  formControl = new FormControl([this.servers[0].name]);

  constructor(private clashBotService: ClashBotService, private _snackBar: MatSnackBar) {
    this.showSpinner = false;
  }

  ngOnInit(): void {
    this.teamFilters.push({
      value: 'Goon Squad',
      type: FilterType.SERVER,
      state: false
    });
    this.teamFilters.push({
      value: 'quiet souls',
      type: FilterType.SERVER,
      state: false
    });
    this.color = 'primary';
    this.mode = 'indeterminate';
  }

  ngOnDestroy(): void {
    if (this.clashTeamsServiceSubscription) {
      this.clashTeamsServiceSubscription.unsubscribe();
    }
  }

  filterTeam(chip: MatChip) {
    chip.selected ? chip.deselect() : chip.selectViaInteraction();
    this.showSpinner = true;
    this.teams = [];
    this.clashTeamsServiceSubscription = this.clashBotService
      .getClashTeams(this.formControl.value.trimLeft())
      .pipe(
        timeout(7000),
        catchError(err => {
          console.error(err);
          this._snackBar.open('Failed to retrieve Teams. Please try again later.',
            'X',
            {duration: 5 * 1000});
          this.teams.push({error: err});
          return throwError(err);
        }),
        finalize(() => this.showSpinner = false)
      )
      .subscribe((data: ClashTeam[]) => {
        if (data.length < 1) {
          this.teams = [{error: 'No data'}];
        } else {
          this.teams = data;
        }
      });
  }

  changeSelected(team: TeamFilter) {
    team.state = false;
  }
}
