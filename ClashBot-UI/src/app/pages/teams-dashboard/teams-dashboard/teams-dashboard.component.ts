import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClashTeam, PlayerDetails} from "../../../interfaces/clash-team";
import {TeamFilter} from "../../../interfaces/team-filter";
import {Subscription, throwError} from "rxjs";
import {ClashBotService} from "../../../services/clash-bot.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FilterType} from "../../../interfaces/filter-type";
import {catchError, delay, finalize, map, retryWhen, take, tap, timeout} from "rxjs/operators";
import {HttpErrorResponse} from "@angular/common/http";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {MatDialog} from "@angular/material/dialog";
import {ClashBotTentativeDetails} from "../../../interfaces/clash-bot-tentative-details";
import {ClashBotUserRegister} from "../../../interfaces/clash-bot-user-register";
import {TeamsWebsocketService} from "../../../services/teams-websocket.service";
import {CreateNewTeamDetails} from "../../../interfaces/create-new-team-details";
import {ApplicationDetails} from "../../../interfaces/application-details";

@Component({
    selector: 'app-teams-dashboard',
    templateUrl: './teams-dashboard.component.html',
    styleUrls: ['./teams-dashboard.component.scss']
})
export class TeamsDashboardComponent implements OnInit, OnDestroy {
    currentSelectedGuild: string = '';
    roles: any = {Top: 0, Mid: 1, Jg: 2, Bot: 3, Supp: 4};
    teams: ClashTeam[] = [];
    teamFilters: TeamFilter[] = [];
    currentApplicationDetails: ApplicationDetails = {loggedIn: false};
    private readonly MAX_TIMEOUT = 4000;
    eligibleTournaments: ClashTournaments[] = [];
    tentativeList?: ClashBotTentativeDetails[];
    $teamsSub: Subscription | undefined;
    tentativeDataStatus: string = 'NOT_LOADED';
    canCreateNewTeam: boolean = false;
    defaultServer?: string;
    showSpinner: boolean;
    showInnerSpinner: boolean = false;
    subs: Subscription[] = [];
    subMap: Map<string, Subscription> = new Map<string, Subscription>();

    constructor(private clashBotService: ClashBotService,
                private _snackBar: MatSnackBar,
                private applicationDetailsService: ApplicationDetailsService,
                private dialog: MatDialog,
                private teamsWebsocketService: TeamsWebsocketService) {
        this.showSpinner = false;
    }

    ngOnInit(): void {
        this.subs.push(this.applicationDetailsService.getApplicationDetails()
            .subscribe((details) => this.currentApplicationDetails = details));
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
                    this.subs.push(this.teamsWebsocketService.getSubject()
                        .pipe(retryWhen(errors => errors.pipe(delay(1000))))
                        .subscribe((msg) => {
                                if (this.currentApplicationDetails.loggedIn) {
                                    this.handleIncomingTeamsWsEvent(msg);
                                }
                            },
                            () => {
                                this._snackBar.open(
                                    'Oops! Failed to connect to server for Team updates, please try refreshing.',
                                    'X',
                                    {duration: 5 * 1000});
                                this.teams = [{error: 'No data'}];
                            }));

                    if (appDetails.defaultGuild) {
                        this.defaultServer = appDetails.defaultGuild;
                        this.currentSelectedGuild = appDetails.defaultGuild;
                        this.filterForTeamsByServer(appDetails.defaultGuild);
                    }
                }
            });
    }

    ngOnDestroy() {
        this.subs.forEach(subscriptions => subscriptions.unsubscribe());
    }

    updateTentativeList(guildName: string) {
        if (this.currentApplicationDetails.loggedIn) {
            this.tentativeDataStatus = 'LOADING';

            this.clashBotService.getServerTentativeList(guildName)
                .pipe(take(1),
                    timeout(this.MAX_TIMEOUT),
                    catchError((err: HttpErrorResponse) => {
                        this._snackBar.open('Oops! We were unable to retrieve the Tentative details list for the server! Please try again later.',
                            'X',
                            {duration: 5 * 1000}
                        );
                        this.tentativeDataStatus = 'FAILED';
                        return throwError(err);
                    }),
                  map(response => {return response.slice(0,4)}),
                  map(response => {
                    response.forEach(tentativeRecord => tentativeRecord.isMember
                      = tentativeRecord.tentativePlayers.includes(this.currentApplicationDetails.userDetails?.username ?? ''))
                    return response;
                  }))
                .subscribe((response) => {
                    this.tentativeList = response;
                    this.tentativeDataStatus = 'SUCCESSFUL';
                });
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});

        }
    }

    filterTeam(filterValue: string) {
        this.currentSelectedGuild = filterValue;
        this.showInnerSpinner = true;
        if (this.$teamsSub) {
            this.$teamsSub.unsubscribe();
        }
        this.teams = [];
        this.filterForTeamsByServer(filterValue);
    }

    private filterForTeamsByServer(valueToSearchFor: string) {
        if (!this.currentApplicationDetails.loggedIn) {
            this._snackBar.open(
                'Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
            this.teams = [{error: 'No data'}];
        } else {
            this.updateTentativeList(valueToSearchFor);
            this.showInnerSpinner = true;
            this.clashBotService
                .getClashTeams(valueToSearchFor)
                .pipe(
                    take(1),
                    timeout(7000),
                    catchError((err: HttpErrorResponse) => {
                        this._snackBar.open('Failed to retrieve Teams. Please try again later.',
                            'X',
                            {duration: 5 * 1000});
                        this.teams.push({error: 'Failed to make call.'});
                        return throwError(err);
                    }),
                    finalize(() => this.showInnerSpinner = false)
                ).subscribe(response => {
                if (this.currentApplicationDetails.loggedIn) {
                    this.syncTeamInformation(response);
                }
            });
            this.teamsWebsocketService.getSubject().next(valueToSearchFor);
        }
    }

    handleIncomingTeamsWsEvent(message: ClashTeam | String) {
        let teamToBeUpdated = <ClashTeam>message;
        if (teamToBeUpdated.teamName) {
            let foundTeam = this.teams.find((team) =>
                team.teamName === teamToBeUpdated.teamName
                && team.tournamentDetails?.tournamentName === teamToBeUpdated.tournamentDetails?.tournamentName
                && team.tournamentDetails?.tournamentDay === teamToBeUpdated.tournamentDetails?.tournamentDay);
            if (!foundTeam) {
                if (teamToBeUpdated.teamName) {
                    let mappedTeam = this.mapDynamicValues([teamToBeUpdated]);
                    this.updateTentativeListBasedOnTeam(mappedTeam[0]);
                    if (this.teams.length === 1 && this.teams.find(team => team.error)) {
                        this.teams = [...mappedTeam];
                    } else {
                        this.teams.push(...mappedTeam);
                    }
                }
            } else if (teamToBeUpdated.playersDetails && teamToBeUpdated.playersDetails.length > 0) {
                let mappedTeam = this.mapDynamicValues([teamToBeUpdated]);
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
            this.syncTournaments(this.teams);
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

    syncTeamInformation(data: ClashTeam[]) {
        this.teams = this.mapDynamicValues(data);
        this.syncTournaments(data);
    }

    private syncTournaments(clashTeams: ClashTeam[]) {
        const currentTournaments = this.currentApplicationDetails.currentTournaments ?? [];
        if (clashTeams.length < 1) {
            this.teams = [{error: 'No data'}];
            this.eligibleTournaments = currentTournaments;
            this.canCreateNewTeam = this.eligibleTournaments && this.eligibleTournaments.length != 0;
        } else {
            let map = this.createUserToTournamentMap(
                this.currentApplicationDetails.userDetails?.id ?? 0,
                currentTournaments,
                this.teams
            );
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

    private mapDynamicValues(data: ClashTeam[]) {
        return data.map(record => {
            record.id = `${record.serverName}-${record.teamName}`
                .replace(new RegExp(/ /, 'g'), '-').toLowerCase();
            let rolesMissing: string[] = [...Object.keys(this.roles)];
            if (record.playersDetails) {
                record.playersDetails.map((record) => {
                    record.isUser = record.id === this.currentApplicationDetails.userDetails?.id;
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
        if (this.currentApplicationDetails.loggedIn &&
            this.currentApplicationDetails.userDetails) {
            this.clashBotService.registerUserForTeam(this.currentApplicationDetails.userDetails, $event)
                .pipe(
                    timeout(7000),
                    catchError((err) => {
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
                ).subscribe(() => {});
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
        }
    }

    unregisterFromTeam($event: ClashTeam) {
        if (this.currentApplicationDetails.loggedIn &&
            this.currentApplicationDetails.userDetails) {
            this.clashBotService.unregisterUserFromTeam(this.currentApplicationDetails.userDetails, $event)
                .pipe(
                    timeout(7000),
                    take(1),
                    catchError((err) => {
                        let errorMessage = 'Oops! Failed to unregister you from the Team.';
                        if (err.name === 'TimeoutError') {
                            errorMessage = 'Oops! Your request timed out, please try again!';
                        }
                        this._snackBar.open(errorMessage,
                            'X',
                            {duration: 5 * 1000});
                        return throwError(err);
                    })
                ).subscribe(() => {});
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
        }
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

    createNewTeam(createNewTeamEvent: CreateNewTeamDetails) {
        if (this.currentApplicationDetails.loggedIn &&
            this.currentApplicationDetails.userDetails) {
            const clashTournament = this.eligibleTournaments.find(item => item.tournamentName === createNewTeamEvent.tournamentName
                && item.tournamentDay === createNewTeamEvent.tournamentDay);
            const newTeamRequest: ClashTeam = {
                serverName: this.currentSelectedGuild,
                startTime: clashTournament?.startTime,
                tournamentDetails: {
                    tournamentName: createNewTeamEvent.tournamentName,
                    tournamentDay: createNewTeamEvent.tournamentDay
                }
            };
            this.clashBotService.createNewTeam(this.currentApplicationDetails.userDetails,
                newTeamRequest,
                createNewTeamEvent.role)
                .pipe(
                    timeout(7000),
                    catchError((err) => {
                        let message = 'Oops! An error occurred while creating a new team.';
                        if (err.name === 'TimeoutError') {
                            message = 'Oops! Your request to create a new Team has timed out. Please try again.'
                        }
                        this._snackBar.open(message,
                            'X',
                            {duration: 5 * 1000});
                        return throwError(err);
                    }),
                    take(1),
                ).subscribe(() => {});
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
            this.teams = [{error: "No data"}];
        }
    }

    tentativeRegister(tentativeUserDetails: ClashBotTentativeDetails) {
        if (this.currentApplicationDetails.loggedIn &&
            this.currentApplicationDetails.userDetails) {
            this.clashBotService.postTentativeList(
                `${this.currentApplicationDetails.userDetails.id}`,
                tentativeUserDetails.serverName,
                tentativeUserDetails.tournamentDetails.tournamentName,
                tentativeUserDetails.tournamentDetails.tournamentDay)
                .pipe(take(1),
                    timeout(7000),
                    catchError(err => {
                        console.error(err);
                        this._snackBar.open('Oops, we were unable to update the tentative list. Please try again later!',
                            'X',
                            {duration: 5 * 1000});
                        return throwError(err);
                    })
                ).subscribe((response) => {
                response.isMember = response.tentativePlayers
                    && response.tentativePlayers.includes(this.currentApplicationDetails.userDetails?.username ?
                        this.currentApplicationDetails.userDetails.username : '');
                if (this.tentativeList && tentativeUserDetails.index !== undefined) {
                    this.tentativeList[tentativeUserDetails.index] = response;
                    this.tentativeList = JSON.parse(JSON.stringify(this.tentativeList));
                }
            });
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
        }
    }
}
