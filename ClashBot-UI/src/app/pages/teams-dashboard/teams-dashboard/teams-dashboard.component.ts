import {Component, OnInit, ViewChild} from '@angular/core';
import {ClashTeam, PlayerDetails} from "../../../interfaces/clash-team";
import {TeamFilter} from "../../../interfaces/team-filter";
import {throwError} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {ClashBotService} from "../../../services/clash-bot.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FilterType} from "../../../interfaces/filter-type";
import {catchError, finalize, take, timeout} from "rxjs/operators";
import {MatChip} from "@angular/material/chips";
import {HttpErrorResponse} from "@angular/common/http";
import {UserDetailsService} from "../../../services/user-details.service";
import {UserDetails} from "../../../interfaces/user-details";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {MatOption} from "@angular/material/core";
import {MatDialog} from "@angular/material/dialog";
import {TeamsDashboardHelpDialogComponent} from "../teams-dashboard-help-dialog/teams-dashboard-help-dialog.component";
import {ClashBotTentativeDetails} from "../../../interfaces/clash-bot-tentative-details";
import {ConfirmationDialogComponent} from "../../../dialogs/confirmation-dialog/confirmation-dialog.component";
import {MatTable} from "@angular/material/table";
import {ClashBotUserRegister} from "../../../interfaces/clash-bot-user-register";

@Component({
  selector: 'app-teams-dashboard',
  templateUrl: './teams-dashboard.component.html',
  styleUrls: ['./teams-dashboard.component.scss']
})
export class TeamsDashboardComponent implements OnInit {
  roles: any = {Top: 0, Mid: 1, Jg: 2, Bot: 3, Supp: 4};
  rolesAsString: string[] = Object.keys(this.roles);
  teams: ClashTeam[] = [];
  teamFilters: TeamFilter[] = [];
  color: any;
  mode: any;
  value: any;
  showSpinner: boolean;
  formControl?: FormControl;
  createNewTeamFormGroup: FormGroup;
  tournamentControl: FormControl = new FormControl('');
  roleControl: FormControl = new FormControl('');
  private readonly MAX_TIMEOUT = 4000;
  eligibleTournaments: ClashTournaments[] = [];
  creatingNewTeam: boolean;
  tentativeList?: ClashBotTentativeDetails[];
  displayedColumns: string[] = ['tournamentName', 'tournamentDay', 'tentativePlayers', 'action'];
  showTentative: boolean = false;
  tentativeDataStatus: string = 'NOT_LOADED';

  @ViewChild(MatTable) table?: MatTable<ClashBotTentativeDetails>;

  constructor(private clashBotService: ClashBotService,
              private _snackBar: MatSnackBar,
              private userDetailsService: UserDetailsService,
              private applicationDetailsService: ApplicationDetailsService,
              private dialog: MatDialog) {
    this.showSpinner = false;
    this.creatingNewTeam = false;
    this.createNewTeamFormGroup = new FormGroup({
      tournament: this.tournamentControl,
      role: this.roleControl
    })
  }

  ngOnInit(): void {
    this.applicationDetailsService.getApplicationDetails()
      .pipe(take(1))
      .subscribe((appDetails) => {
        if (appDetails.userGuilds) {
          appDetails.userGuilds.forEach((record: any) => {
            this.teamFilters.push({
              value: record.name,
              type: FilterType.SERVER,
              state: record.name === appDetails.defaultGuild,
              id: record.name.replace(new RegExp(/ /, 'g'), '-').toLowerCase()
            });
          })

          this.formControl = new FormControl(appDetails.defaultGuild);
          if (appDetails.defaultGuild) {
            this.filterForTeamsByServer(appDetails.defaultGuild);
          }
        }
      })
    this.color = 'primary';
    this.mode = 'indeterminate';
  }

  updateTentativeList(guildName: string) {
    this.tentativeDataStatus = 'LOADING';
    this.userDetailsService.getUserDetails().pipe(take(1))
      .subscribe((userDetails) => {
        this.clashBotService.getServerTentativeList(guildName)
          .pipe(take(1),
            timeout(this.MAX_TIMEOUT),
            catchError((err: HttpErrorResponse) => {
              console.error(err);
              this._snackBar.open('Oops! We were unable to retrieve the Tentative details list for the server! Please try again later.',
                'X',
                {duration: 5 * 1000});
              this.tentativeDataStatus = 'FAILED';
              return throwError(err);
            }))
          .subscribe((data) => {
            data.forEach(tentativeRecord => tentativeRecord.isMember
              = tentativeRecord.tentativePlayers.includes(userDetails.username));
            this.tentativeList = data;
            this.tentativeDataStatus = 'SUCCESSFUL';
          });
      });
  }

  filterTeam(chip: MatChip) {
    chip.selected ? chip.deselect() : chip.selectViaInteraction();
    this.showSpinner = true;
    this.teams = [];
    let valueToSearchFor = '';
    if (this.formControl) {
      valueToSearchFor = this.formControl.value.trimLeft();
    }
    this.filterForTeamsByServer(valueToSearchFor);
  }

  private filterForTeamsByServer(valueToSearchFor: string) {
    this.updateTentativeList(valueToSearchFor);
    this.userDetailsService.getUserDetails()
      .pipe(take(1))
      .subscribe((userDetails) => {
        if (!userDetails.username || userDetails.username === '') {
          this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
            'X',
            {duration: 5 * 1000});
          this.teams = [{error: 'No data'}];
          this.showSpinner = false;
        } else {
          this.clashBotService
            .getClashTeams(valueToSearchFor)
            .pipe(
              take(1),
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
              this.syncTeamInformation(data, userDetails);
            })
        }
      })
  }

  syncTeamInformation(data: ClashTeam[], userDetails: UserDetails) {
    this.teams = this.mapDynamicValues(data, userDetails);
    this.applicationDetailsService.getApplicationDetails()
      .pipe(take(1))
      .subscribe((applicationDetails) => {
        if (applicationDetails && applicationDetails.currentTournaments) {
          if (data.length < 1) {
            this.teams = [{error: 'No data'}];
            this.eligibleTournaments = applicationDetails.currentTournaments;
          } else {
            let map = this.createUserToTournamentMap(userDetails.username, applicationDetails.currentTournaments, this.teams);
            let newEligibleTournaments: ClashTournaments[] = [];
            map.forEach((value, key) => {
              if (!value) {
                newEligibleTournaments.push(key);
              }
            });
            this.eligibleTournaments = newEligibleTournaments;
          }
        }
      });
  }

  private mapDynamicValues(data: ClashTeam[], userDetails: UserDetails) {
    return data.map(record => {
      record.id = `${record.serverName}-${record.teamName}`
        .replace(new RegExp(/ /, 'g'), '-').toLowerCase();
      let rolesMissing: string[] = [...Object.keys(this.roles)];
      if (record.playersDetails) {
        record.playersDetails.map((record) => {
          record.isUser = record.id === userDetails.id;
          rolesMissing = rolesMissing.filter(role => role !== record.role);
          return record;
        });
      }
      if (!Array.isArray(record.playersDetails)
        || record.playersDetails.length === 0) {
        record.playersDetails = [];
      }
      for (let role in rolesMissing) {
        record.playersDetails.push({name: '', id: 0, isUser: false, role: rolesMissing[role]});
      }
      record.playersDetails.sort((a: PlayerDetails, b: PlayerDetails) =>
        this.roles[a.role] - this.roles[b.role] || a.role.localeCompare(b.role));
      return record;
    });
  }

  registerForTeam($event: ClashBotUserRegister) {
    this.userDetailsService.getUserDetails()
      .pipe(take(1))
      .subscribe((userDetails) => {
        if (!userDetails || !userDetails.username || userDetails.username === '') {
          this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
            'X',
            {duration: 5 * 1000});
        } else {
          this.clashBotService.registerUserForTeam(userDetails, $event)
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
              take(1),
              finalize(() => {
                if ($event.serverName) {
                  this.showSpinner = true;
                  this.clashBotService.getClashTeams($event.serverName)
                    .pipe(take(1),
                      catchError((err) => this.handleClashTeamsError(this._snackBar, err)),
                      finalize(() => this.showSpinner = false))
                    .subscribe((updatedTeams) => this.syncTeamInformation(updatedTeams, userDetails))
                }
              }))
            .subscribe(() => console.log('Registered successfully.'));
        }
      })
  }

  unregisterFromTeam($event: ClashTeam) {
    this.userDetailsService.getUserDetails()
      .pipe(take(1))
      .subscribe((userDetails) => {
        if (!userDetails || !userDetails.username || userDetails.username === '') {
          this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
            'X',
            {duration: 5 * 1000});
          this.teams = [{error: 'No data'}];
        } else {
          this.clashBotService.unregisterUserFromTeam(userDetails, $event)
            .pipe(
              timeout(7000),
              take(1),
              catchError((err) => {
                console.error(err);
                let errorMessage = 'Oops! Failed to unregister you from the Team.';
                if (err.name === 'TimeoutError') {
                  errorMessage = 'Oops! Your request timed out, please try again!';
                }
                this._snackBar.open(errorMessage,
                  'X',
                  {duration: 5 * 1000});
                return throwError(err);
              }),
              finalize(() => {
                if ($event.serverName) {
                  this.showSpinner = true;
                  this.clashBotService.getClashTeams($event.serverName)
                    .pipe(
                      take(1),
                      timeout(this.MAX_TIMEOUT),
                      catchError((err) => this.handleClashTeamsError(this._snackBar, err)),
                      finalize(() => this.showSpinner = false))
                    .subscribe((updatedTeams) => this.syncTeamInformation(updatedTeams, userDetails))
                }
              }))
            .subscribe(() => console.log('Unregistered User successfully.'));
        }
      });
  }

  createUserToTournamentMap(loggedInUser: string, clashTournaments: ClashTournaments[], clashTeams: ClashTeam[]) {
    let tournamentToTeamUserMap = new Map<ClashTournaments, any>();
    clashTournaments.forEach((tournament) =>
      tournamentToTeamUserMap.set(tournament, clashTeams.find(team => team.tournamentDetails
        && team.tournamentDetails.tournamentName === tournament.tournamentName
        && team.tournamentDetails.tournamentDay === tournament.tournamentDay
        && team.playersDetails
        && team.playersDetails.length == 1
        && team.playersDetails.find(user => user.name === loggedInUser))));
    return tournamentToTeamUserMap;
  }

  handleClashTeamsError(snackBar: MatSnackBar, err: HttpErrorResponse) {
    console.error(err);
    snackBar.open('Failed to retrieve Teams. Please try again later.',
      'X',
      {duration: 5 * 1000});
    this.teams = [{error: err.message}];
    return throwError(err);
  }

  createNewTeam(element: MatOption) {
    element.select();
    let role = this.roleControl.value;
    let tournamentName = '';
    let tournamentDay = '';
    let clashTournaments: ClashTournaments | undefined;
    if (this.tournamentControl.value) {
      let split = this.tournamentControl.value.split(' ');
      tournamentName = split[0];
      tournamentDay = split[1];
      clashTournaments = this.eligibleTournaments.find(tournament =>
        tournament.tournamentName === tournamentName
        && tournament.tournamentDay === tournamentDay);
    }
    let serverName = '';
    if (this.formControl) {
      serverName = this.formControl.value.trimLeft().trimRight();
    }
    if (role && tournamentName && tournamentDay) {
      element.deselect();
      this.userDetailsService.getUserDetails()
        .pipe(take(1))
        .subscribe((userDetails) => {
          this.clashBotService.createNewTeam(userDetails, {
              serverName: serverName,
              tournamentDetails: {
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
              },
              startTime: clashTournaments?.startTime
            },
            role).pipe(
            catchError((err) => {
              console.error(err);
              this._snackBar.open('You are not able to create a new Team. Please try again later.',
                'X',
                {duration: 5 * 1000});
              this.teams = [{error: err.message}];
              return throwError(err);
            }),
            take(1),
            finalize(() => {
              if (serverName) {
                this.showSpinner = true;
                this.clashBotService.getClashTeams(serverName)
                  .pipe(
                    take(1),
                    timeout(this.MAX_TIMEOUT),
                    catchError((err) => this.handleClashTeamsError(this._snackBar, err)),
                    finalize(() => this.showSpinner = false))
                  .subscribe((updatedTeams) => this.syncTeamInformation(updatedTeams, userDetails))
              }
            }))
            .subscribe(() => console.log('Successfully created new team.'));
        })
      this.creatingNewTeam = false;
    }
  }

  showHelpDialog() {
    this.dialog.open(TeamsDashboardHelpDialogComponent);
  }

  tentativeRegister(element: ClashBotTentativeDetails, index: number) {
    let actionMessage = 'added to';
    if (element.isMember) {
      actionMessage = 'removed from';
    }
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {data: {message: `Are you sure you want to be ${actionMessage} the Tentative list for this tournament?`}});
    dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
      this.userDetailsService.getUserDetails()
        .pipe(take(1))
        .subscribe((userDetails) => {
          if (result) {
            this.clashBotService.postTentativeList(`${userDetails.id}`, element.serverName,
              element.tournamentDetails.tournamentName, element.tournamentDetails.tournamentDay)
              .pipe(take(1),
                catchError(err => {
                  console.error(err);
                  this._snackBar.open('Oops, we were unable to update the tentative list. Please try again later!',
                    'X',
                    {duration: 5 * 1000});
                  return throwError(err);
                })
              ).subscribe((response) => {
              response.isMember = response.tentativePlayers.includes(userDetails.username);
              if (this.tentativeList) {
                this.tentativeList[index] = response;
                if (this.table) this.table.renderRows();
              }
              if (this.formControl) {
                this.filterForTeamsByServer(this.formControl.value);
              }
            });
          }
        })
    })
  }
}
