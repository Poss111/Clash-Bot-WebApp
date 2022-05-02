import {Component, OnInit, ViewChild} from '@angular/core';
import {ClashTeam, PlayerDetails} from "../../../interfaces/clash-team";
import {TeamFilter} from "../../../interfaces/team-filter";
import {Subscription, throwError} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {ClashBotService} from "../../../services/clash-bot.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FilterType} from "../../../interfaces/filter-type";
import {catchError, delay, finalize, retryWhen, take, tap, timeout} from "rxjs/operators";
import {HttpErrorResponse} from "@angular/common/http";
import {UserDetailsService} from "../../../services/user-details.service";
import {UserDetails} from "../../../interfaces/user-details";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {MatDialog} from "@angular/material/dialog";
import {ClashBotTentativeDetails} from "../../../interfaces/clash-bot-tentative-details";
import {MatTable} from "@angular/material/table";
import {ClashBotUserRegister} from "../../../interfaces/clash-bot-user-register";
import {TeamsWebsocketService} from "../../../services/teams-websocket.service";
import {CreateNewTeamDetails} from "../../../interfaces/create-new-team-details";

@Component({
    selector: 'app-teams-dashboard',
    templateUrl: './teams-dashboard.component.html',
    styleUrls: ['./teams-dashboard.component.scss']
})
export class TeamsDashboardComponent implements OnInit {
    currentSelectedGuild: string = '';
    roles: any = {Top: 0, Mid: 1, Jg: 2, Bot: 3, Supp: 4};
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
    tentativeList?: ClashBotTentativeDetails[];
    $teamsSub: Subscription | undefined;
    tentativeDataStatus: string = 'NOT_LOADED';
    canCreateNewTeam: boolean = false;

    @ViewChild(MatTable) table?: MatTable<ClashBotTentativeDetails>;

    constructor(private clashBotService: ClashBotService,
                private _snackBar: MatSnackBar,
                private userDetailsService: UserDetailsService,
                private applicationDetailsService: ApplicationDetailsService,
                private dialog: MatDialog,
                private teamsWebsocketService: TeamsWebsocketService) {
        this.showSpinner = false;
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
                        data = data.sort((itemOne, itemTwo) =>
                            itemOne.tournamentDetails.tournamentDay.localeCompare(itemTwo.tournamentDetails.tournamentDay));
                        this.tentativeList = data;
                        this.tentativeDataStatus = 'SUCCESSFUL';
                    });
            });
    }

    filterTeam(filterValue: string) {
        this.currentSelectedGuild = filterValue;
        if (this.$teamsSub) {
            this.$teamsSub.unsubscribe();
        }
        this.showSpinner = true;
        this.teams = [];
        this.filterForTeamsByServer(filterValue);
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
                            if (this.$teamsSub) this.$teamsSub.unsubscribe();
                            this.teamsWebsocketService.getSubject().next(valueToSearchFor);
                            this.$teamsSub = this.teamsWebsocketService.getSubject()
                                .pipe(
                                    retryWhen(errors =>
                                        errors.pipe(
                                            tap(err => {
                                                console.error('Got error', err);
                                            }),
                                            delay(1000)
                                        )
                                    )
                                )
                                .subscribe((msg) => this.handleIncomingTeamsWsEvent(msg, userDetails),
                                    () => {
                                        this._snackBar.open('Oops! Failed to connect to server for Team updates, please try refreshing.',
                                            'X',
                                            {duration: 5 * 1000}),
                                            this.teams = [{error: 'No data'}];
                                    },
                                    () => console.log('Connection closed to teams ws.'));
                        })
                }
            })
    }

    handleIncomingTeamsWsEvent(message: ClashTeam | String, userDetails: UserDetails) {
        let teamToBeUpdated = <ClashTeam>message;
        if (teamToBeUpdated.teamName) {
            let foundTeam = this.teams.find((team) =>
                team.teamName === teamToBeUpdated.teamName
                && team.tournamentDetails?.tournamentName === teamToBeUpdated.tournamentDetails?.tournamentName
                && team.tournamentDetails?.tournamentDay === teamToBeUpdated.tournamentDetails?.tournamentDay);
            if (!foundTeam) {
                if (teamToBeUpdated.teamName) {
                    let mappedTeam = this.mapDynamicValues([teamToBeUpdated], userDetails);
                    this.updateTentativeListBasedOnTeam(mappedTeam[0]);
                    if (this.teams.length === 1 && this.teams.find(team => team.error)) {
                        this.teams = [...mappedTeam];
                    } else {
                        this.teams.push(...mappedTeam);
                    }
                }
            } else if (teamToBeUpdated.playersDetails && teamToBeUpdated.playersDetails.length > 0) {
                let mappedTeam = this.mapDynamicValues([teamToBeUpdated], userDetails);
                this.updateTentativeListBasedOnTeam(mappedTeam[0]);
                if (foundTeam.playersDetails && mappedTeam[0].playersDetails) {
                    for (let i = 0; i < 5; i++) {
                        let roleDetailsToUpdate = foundTeam.playersDetails[i];
                        if (roleDetailsToUpdate) {
                            let foundRecord = mappedTeam[0].playersDetails
                                .find(record => record.role === roleDetailsToUpdate.role);
                            if (foundRecord && roleDetailsToUpdate.name !== foundRecord.name) {
                                foundTeam.playersDetails[i] = foundRecord;
                            }
                        }
                    }
                }
            } else {
                this.teams = this.teams.filter((team) => team.teamName !== teamToBeUpdated.teamName);
            }
            this.syncTournaments(this.teams, userDetails);
        }
    }

    updateTentativeListBasedOnTeam(mappedTeam: ClashTeam) {
        let playerNames: string[] = [];
        if (mappedTeam.playersDetails) {
            playerNames = mappedTeam.playersDetails?.map(details => details.name);
        }
        if (this.tentativeList && playerNames.length > 0) {
            for (let i = 0; i < this.tentativeList?.length; i++) {
                if (this.tentativeList[i].tournamentDetails.tournamentName === mappedTeam.tournamentDetails?.tournamentName
                    && this.tentativeList[i].tournamentDetails.tournamentDay === mappedTeam.tournamentDetails?.tournamentDay) {
                    let updatedTentative =
                        this.tentativeList[i].tentativePlayers
                            .filter((name) => !playerNames.includes(name));
                    if (updatedTentative !== this.tentativeList[i].tentativePlayers
                        && this.tentativeList[i].isMember) {
                        this.tentativeList[i].isMember = false;
                    }
                    this.tentativeList[i].tentativePlayers = updatedTentative;
                }
            }
        }
    }

    syncTeamInformation(data: ClashTeam[], userDetails: UserDetails) {
        this.teams = this.mapDynamicValues(data, userDetails);
        this.syncTournaments(data, userDetails);
    }

    private syncTournaments(clashTeams: ClashTeam[], userDetails: UserDetails) {
        this.applicationDetailsService.getApplicationDetails()
            .pipe(take(1))
            .subscribe((applicationDetails) => {
                if (applicationDetails && applicationDetails.currentTournaments) {
                    if (clashTeams.length < 1) {
                        this.teams = [{error: 'No data'}];
                        this.eligibleTournaments = applicationDetails.currentTournaments;
                        this.canCreateNewTeam = this.eligibleTournaments && this.eligibleTournaments.length != 0;
                    } else {
                        let map = this.createUserToTournamentMap(userDetails.id, applicationDetails.currentTournaments, this.teams);
                        let newEligibleTournaments: ClashTournaments[] = [];
                        map.forEach((value, key) => {
                            if (!value) {
                                newEligibleTournaments.push(key);
                            }
                        });
                        this.eligibleTournaments = newEligibleTournaments;
                        this.canCreateNewTeam = this.eligibleTournaments && this.eligibleTournaments.length != 0;
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
                            take(1)
                        ).subscribe(() => console.log('Registered successfully.'));
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
                            })
                        ).subscribe(() => console.log('Unregistered User successfully.'));
                }
            });
    }

    createUserToTournamentMap(currentUserId: number, clashTournaments: ClashTournaments[], clashTeams: ClashTeam[]) {
        let tournamentToTeamUserMap = new Map<ClashTournaments, any>();
        clashTournaments.forEach((tournament) =>
            tournamentToTeamUserMap.set(tournament, clashTeams.find(team => {
                let reducedMap;
                if (team.playersDetails) {
                    reducedMap = new Set(team.playersDetails.map(object => object.id));
                }
                return team.tournamentDetails
                    && team.tournamentDetails.tournamentName === tournament.tournamentName
                    && team.tournamentDetails.tournamentDay === tournament.tournamentDay
                    && reducedMap
                    && reducedMap.size === 2
                    && reducedMap.has(currentUserId)
            })));
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

    createNewTeam(createNewTeamEvent: CreateNewTeamDetails) {
        this.userDetailsService.getUserDetails()
            .pipe(take(1))
            .subscribe((userDetails) => {
                const newTeamRequest: ClashTeam = {
                    serverName: this.currentSelectedGuild,
                    tournamentDetails: {
                        tournamentName: createNewTeamEvent.tournamentName,
                        tournamentDay: createNewTeamEvent.tournamentDay
                    }
                };
                this.clashBotService.createNewTeam(userDetails,
                    newTeamRequest,
                    createNewTeamEvent.role)
                    .pipe(
                        catchError((err) => {
                            console.error(err);
                            this._snackBar.open('You are not able to create a new Team. Please try again later.',
                                'X',
                                {duration: 5 * 1000});
                            this.teams = [{error: err.message}];
                            return throwError(err);
                        }),
                        take(1),
                    ).subscribe(() => console.log('Successfully created new team.'));
            });
    }

    tentativeRegister(tentativeUserDetails: ClashBotTentativeDetails) {
        this.userDetailsService.getUserDetails()
            .pipe(take(1))
            .subscribe((userDetails) => {
                this.clashBotService.postTentativeList(`${userDetails.id}`,
                    tentativeUserDetails.serverName,
                    tentativeUserDetails.tournamentDetails.tournamentName,
                    tentativeUserDetails.tournamentDetails.tournamentDay)
                    .pipe(take(1),
                        catchError(err => {
                            console.error(err);
                            this._snackBar.open('Oops, we were unable to update the tentative list. Please try again later!',
                                'X',
                                {duration: 5 * 1000});
                            return throwError(err);
                        })
                    ).subscribe((response) => {
                    response.isMember = response.tentativePlayers
                        && response.tentativePlayers.includes(userDetails.username);
                    if (this.tentativeList && tentativeUserDetails.index) {
                        this.tentativeList[tentativeUserDetails.index] = response;
                        if (this.table) this.table.renderRows();
                    }
                });
            });
    }
}
