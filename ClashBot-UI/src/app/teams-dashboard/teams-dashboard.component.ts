import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClashTeam} from "../clash-team";
import {TeamFilter} from "../team-filter";
import {Subscription, throwError} from "rxjs";
import {FormControl} from "@angular/forms";
import {ClashBotService} from "../clash-bot.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FilterType} from "../filter-type";
import {catchError, finalize, take, timeout} from "rxjs/operators";
import {MatChip} from "@angular/material/chips";
import {DiscordService} from "../discord.service";
import {HttpErrorResponse} from "@angular/common/http";
import {UserDetailsService} from "../user-details.service";

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

  constructor(private clashBotService: ClashBotService,
              private discordService: DiscordService,
              private _snackBar: MatSnackBar,
              private userDetailsService: UserDetailsService) {
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
        data.forEach((record: any) => {
          this.teamFilters.push({
            value: record.name,
            type: FilterType.SERVER,
            state: false,
            id: record.name.replace(new RegExp(/ /, 'g'), '-').toLowerCase()
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
          this.teams = data.map(record => {
            record.id = `${record.serverName}-${record.teamName}`.replace(new RegExp(/ /, 'g'), '-').toLowerCase()
            return record;
          },);
        }
      });
  }

  changeSelected(team: TeamFilter) {
    team.state = false;
  }

  registerForTeam($event: ClashTeam) {
    this.userDetailsService.getUserDetails()
      .pipe(take(1))
      .subscribe((data) => {
        if (!data || !data.username || data.username === '') {
          this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
          'X',
          {duration: 5 * 1000});
        } else {
          this.clashBotService.registerUserForTeam(data, $event)
            .pipe(
              timeout(7000),
              catchError((err) => {
                console.error(err);
                let errorMessage = 'Oops! Failed to register you to the Team, missing required details.';
                if (err.name === 'TimeoutError') {
                  errorMessage = 'Oops! Your registration timed out, please try again!';
                }
                this._snackBar.open(errorMessage,
                  'X',
                  {duration: 5 * 1000});
                return throwError(err);
              }),
              take(1))
            .subscribe(() => {
              this.teams.find(record => record.teamName === $event.teamName)?.playersDetails?.push({name: data.username});
            });
        }
      })
  }
}
