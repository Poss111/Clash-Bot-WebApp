import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClashTeam} from "../clash-team";
import {TeamFilter} from "../team-filter";
import {Subscription, throwError} from "rxjs";
import {FormControl} from "@angular/forms";
import {ClashBotService} from "../clash-bot.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FilterType} from "../filter-type";
import {catchError, finalize, timeout} from "rxjs/operators";
import {MatChip} from "@angular/material/chips";
import {DiscordService} from "../discord.service";
import {HttpErrorResponse} from "@angular/common/http";

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
  formControl = new FormControl([]);

  constructor(private clashBotService: ClashBotService, private discordService: DiscordService, private _snackBar: MatSnackBar) {
    this.showSpinner = false;
  }

  ngOnInit(): void {
    this.showSpinner = true;
    this.discordService.getGuilds()
      .pipe(
        timeout(7000),
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          if (err.status === 401) {
            this._snackBar.open('Invalid Discord Token. Please login to Discord again.',
              'X',
              {duration: 5 * 1000});

          } else {
            this._snackBar.open('Failed to retrieve Servers. Please try again later.',
              'X',
              {duration: 5 * 1000});
          }
          this.teams.push({error: err.message});
          return throwError(err);
        }),
        finalize(() => this.showSpinner = false)
      )
      .subscribe((data: any) => {
        data.forEach((record:any) => {
          this.teamFilters.push({
            value: record.name,
            type: FilterType.SERVER,
            state: false
          });
        })
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
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          this._snackBar.open('Failed to retrieve Teams. Please try again later.',
            'X',
            {duration: 5 * 1000});
          this.teams.push({error: err.message});
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
