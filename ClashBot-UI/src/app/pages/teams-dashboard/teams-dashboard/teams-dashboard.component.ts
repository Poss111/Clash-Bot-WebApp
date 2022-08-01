import {Component, OnDestroy, OnInit} from '@angular/core';
import {TeamFilter} from "../../../interfaces/team-filter";
import {Subscription, throwError} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FilterType} from "../../../interfaces/filter-type";
import {catchError, delay, finalize, map, retryWhen, take, timeout} from "rxjs/operators";
import {HttpErrorResponse} from "@angular/common/http";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {MatDialog} from "@angular/material/dialog";
import {ClashBotTentativeDetails} from "../../../interfaces/clash-bot-tentative-details";
import {ClashBotUserRegister} from "../../../interfaces/clash-bot-user-register";
import {TeamsWebsocketService} from "../../../services/teams-websocket.service";
import {CreateNewTeamDetails} from "../../../interfaces/create-new-team-details";
import {ApplicationDetails} from "../../../interfaces/application-details";
import {PageLoadingService} from "../../../services/page-loading.service";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {
    CreateNewTeamRequest,
    PlacePlayerOnTentativeRequest,
    RemovePlayerFromTeamRequest,
    Role,
    Team,
    TeamService,
    TentativeService,
    UpdateTeamRequest
} from "clash-bot-service-api";
import {TentativeRecord} from "../../../interfaces/tentative-record";
import {PlayerUiWrapper, TeamUiWrapper} from "../../../interfaces/team-ui-wrapper";

@Component({
    selector: 'app-teams-dashboard',
    templateUrl: './teams-dashboard.component.html',
    styleUrls: ['./teams-dashboard.component.scss']
})
export class TeamsDashboardComponent implements OnInit, OnDestroy {
    currentSelectedGuild: string = '';
    roles: any = {Top: 0, Mid: 1, Jg: 2, Bot: 3, Supp: 4};
    teams: TeamUiWrapper[] = [];
    teamFilters: TeamFilter[] = [];
    currentApplicationDetails: ApplicationDetails = {loggedIn: false};
    private readonly MAX_TIMEOUT = 4000;
    eligibleTournaments: Tournament[] = [];
    tentativeList?: TentativeRecord[];
    $teamsSub: Subscription | undefined;
    tentativeDataStatus: string = 'NOT_LOADED';
    canCreateNewTeam: boolean = false;
    defaultServer?: string;
    showSpinner: boolean;
    showInnerSpinner: boolean = false;
    subs: Subscription[] = [];
    private readonly noDataAvailable = {error: 'No data'};

    constructor(private _snackBar: MatSnackBar,
                private applicationDetailsService: ApplicationDetailsService,
                private dialog: MatDialog,
                private teamsWebsocketService: TeamsWebsocketService,
                private pageLoadingService: PageLoadingService,
                private tentativeService: TentativeService,
                private teamsService: TeamService) {
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
                                this.teams = [this.noDataAvailable];
                            }));

                    if (appDetails.defaultGuild) {
                        this.defaultServer = appDetails.defaultGuild;
                        this.currentSelectedGuild = appDetails.defaultGuild;
                        this.filterForTeamsByServer(appDetails.defaultGuild);
                    }
                    setTimeout(() => this.pageLoadingService.updateSubject(false), 300);
                }
            });
    }

    ngOnDestroy() {
        this.subs.forEach(subscriptions => subscriptions.unsubscribe());
    }

    updateTentativeList(guildName: string) {
        if (this.currentApplicationDetails.loggedIn) {
            this.tentativeDataStatus = 'LOADING';

            this.tentativeService.getTentativeDetails(guildName)
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
                    map(response => {
                        return response.slice(0, 4)
                    }),
                    map(response => {
                        return response.map((tentative) => {
                            const tentativeRecord: TentativeRecord = tentative as TentativeRecord;
                            if (tentative.tentativePlayers) {
                                tentativeRecord.isMember = tentative
                                    .tentativePlayers
                                    .some((record) => record
                                        .id === this
                                        .currentApplicationDetails.userDetails?.id ?? '')
                            } else {
                                tentativeRecord.isMember = false;
                            }
                            return tentativeRecord;
                        });
                    })
                )
                .subscribe((mappedResponse) => {
                    this.tentativeList = mappedResponse;
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
                'Oops! You are not logged in, ' +
                'please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
            this.teams = [this.noDataAvailable];
        } else {
            this.updateTentativeList(valueToSearchFor);
            this.showInnerSpinner = true;
            this.teamsService
                .getTeam(valueToSearchFor)
                .pipe(
                    map((records) => records.map((team) => this.mapTeamToTeamUiWrapper(team))),
                    take(1),
                    timeout(7000),
                    catchError((err: HttpErrorResponse) => {
                        return throwError(err);
                    }),
                    finalize(() => this.showInnerSpinner = false)
                ).subscribe(response => {
                    if (this.currentApplicationDetails.loggedIn) {
                        this.teams = response;
                        this.repopulateEligibleTournaments(response);
                    }
                }, () => {
                    this.teams = [{error: 'Failed to make call.'}];
                    this._snackBar.open('Failed to retrieve Teams. ' +
                        'Please try again later.',
                        'X',
                        {duration: 5 * 1000});
                }
            );
            this.teamsWebsocketService.getSubject().next(valueToSearchFor);
        }
    }

    handleIncomingTeamsWsEvent(message: Team | String) {
        let teamToBeUpdated = <Team>message;
        if (teamToBeUpdated.name) {
            let foundTeam = this.teams.find((team) =>
                team.name === teamToBeUpdated.name
                && team.tournament?.tournamentName === teamToBeUpdated.tournament?.tournamentName
                && team.tournament?.tournamentDay === teamToBeUpdated.tournament?.tournamentDay);
            if (!foundTeam) {
                if (teamToBeUpdated.name) {
                    let mappedTeam = this.mapTeamToTeamUiWrapper(teamToBeUpdated);
                    this.updateTentativeListBasedOnTeam(mappedTeam);
                    if (this.teams.length === 1
                        && this.teams.find(team => team.error)) {
                        this.teams = [mappedTeam];
                    } else {
                        this.teams.push(mappedTeam);
                    }
                }
            } else if (teamToBeUpdated.playerDetails
                && Object.keys(teamToBeUpdated.playerDetails).length > 0) {
                let mappedTeam = this.mapTeamToTeamUiWrapper(teamToBeUpdated);
                this.updateTentativeListBasedOnTeam(mappedTeam);
                if (foundTeam.playerDetails && mappedTeam.playerDetails) {
                    Object.assign(foundTeam, {...mappedTeam});
                }
            } else {
                this.teams = this.teams.filter((team) => team.name !== teamToBeUpdated.name);
            }
            this.repopulateEligibleTournaments(this.teams);
        }
    }

    updateTentativeListBasedOnTeam(mappedTeam: Team) {
        let playerNames: string[] = [];
        if (mappedTeam.playerDetails) {
            playerNames = Object
                .entries(mappedTeam.playerDetails)
                .map((entry) => entry[1].id);
        }
        if (this.tentativeList && playerNames.length > 0) {
            for (let i = 0; i < this.tentativeList?.length; i++) {
                if (this.tentativeList[i].tournamentDetails?.tournamentName === mappedTeam.tournament?.tournamentName
                    && this.tentativeList[i].tournamentDetails?.tournamentDay === mappedTeam.tournament?.tournamentDay) {
                    let updatedTentative = this.tentativeList[i]
                        .tentativePlayers?.filter((player) => {
                            if (player.name) {
                                return !playerNames.includes(player.name);
                            } else {
                                return true;
                            }
                        });
                    if (updatedTentative !== this.tentativeList[i].tentativePlayers
                        && this.tentativeList[i].isMember) {
                        this.tentativeList[i].isMember = false;
                    }
                    this.tentativeList[i].tentativePlayers = updatedTentative;
                }
            }
        }
    }

    repopulateEligibleTournaments(clashTeams: Team[]) {
        const currentTournaments = this.currentApplicationDetails
            .currentTournaments ?? [];
        if (clashTeams.length < 1) {
            this.teams = [this.noDataAvailable];
            this.eligibleTournaments = currentTournaments;
            this.canCreateNewTeam = this
                .eligibleTournaments && this
                .eligibleTournaments.length != 0;
        } else {
            let map = this.createUserToTournamentMap(
                this.currentApplicationDetails.userDetails?.id ?? 0,
                currentTournaments,
                this.teams
            );
            let newEligibleTournaments: Tournament[] = [];
            map.forEach((value, key) => {
                if (!value
                    || Object.keys(value.playerDetails).length != 1) {
                    newEligibleTournaments.push(key);
                }
            });
            this.eligibleTournaments = newEligibleTournaments;
            this.canCreateNewTeam = this.eligibleTournaments
                && this.eligibleTournaments.length != 0;
        }
    }

    mapTeamToTeamUiWrapper(record: Team): TeamUiWrapper {
        let teamUiWrapper: TeamUiWrapper = record as TeamUiWrapper;
        teamUiWrapper.id = `${record.serverName}-${record.name}`
            .replace(new RegExp(/ /, 'g'), '-')
            .toLowerCase();
        let rolesMissing: string[] = [...Object.keys(this.roles)];
        if (record.playerDetails) {
            teamUiWrapper.teamDetails = Object.entries(record.playerDetails)
                .map((record) => {
                    let playerUiWrapper: PlayerUiWrapper = record[1] as PlayerUiWrapper;
                    playerUiWrapper
                        .isUser = record[1].id === this
                        .currentApplicationDetails.userDetails?.id;
                    playerUiWrapper.role = this.getKeyByValue(record[0]);
                    rolesMissing = rolesMissing
                        .filter(role => role !== record[0]);
                    return playerUiWrapper;
                });
        }
        if (!record.playerDetails
            || Object.keys(record.playerDetails).length === 0) {
            teamUiWrapper.teamDetails = [];
        }
        for (let role in rolesMissing) {
            teamUiWrapper
                .teamDetails?.push({
                id: '0',
                isUser: false,
                role: this.getKeyByValue(rolesMissing[role])
            });
        }
        teamUiWrapper.teamDetails?.sort((a: PlayerUiWrapper, b: PlayerUiWrapper) => {
            if (a.role && b.role) {
                return this.roles[a.role] - this.roles[b.role]
                    || a.role.localeCompare(b.role);
            } else if (a.role) {
                return 1;
            }
            return -1;
        })
        return teamUiWrapper;
    }

    registerForTeam($event: ClashBotUserRegister) {
        if (this.currentApplicationDetails.loggedIn &&
            this.currentApplicationDetails.userDetails) {
            let updateTeamRequest: UpdateTeamRequest = {
                playerId: `${this.currentApplicationDetails.userDetails.id}`,
                role: this.getKeyByValue($event.role),
                serverName: $event.serverName ?? '',
                teamName: $event.teamName ?? '',
                tournamentDetails: $event.tournamentDetails ?? {}
            };
            this.teamsService.updateTeam(updateTeamRequest)
                .pipe(
                    timeout(7000),
                    catchError((err) => {
                        let errorMessage = 'Oops! Failed to register you to the Team, missing required details.';
                        if (err.name === 'TimeoutError') {
                            errorMessage = 'Oops! Your registration timed out, please try again!';
                        }
                        return throwError(errorMessage);
                    }),
                    take(1)
                ).subscribe(() => {
                },
                (err) => {
                    this._snackBar.open(err,
                        'X',
                        {duration: 5 * 1000});
                });
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
        }
    }

    unregisterFromTeam($event: TeamUiWrapper) {
        if (this.currentApplicationDetails.loggedIn &&
            this.currentApplicationDetails.userDetails) {
            const removePlayerFromTeamRequest: RemovePlayerFromTeamRequest = {
                serverName: $event.serverName ?? '',
                playerId: `${this.currentApplicationDetails.userDetails.id}`,
                tournamentDetails: {
                    tournamentName: $event.tournament?.tournamentName,
                    tournamentDay: $event.tournament?.tournamentDay
                },
                teamName: $event.name ?? ''
            };
            this.teamsService.removePlayerFromTeam(removePlayerFromTeamRequest)
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
                ).subscribe(() => {
            });
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
        }
    }

    createUserToTournamentMap(currentUserId: number, clashTournaments: Tournament[], clashTeams: Team[]) {
        let tournamentToTeamUserMap = new Map<Tournament, any>();
        clashTournaments.forEach((tournament) =>
            tournamentToTeamUserMap.set(tournament, clashTeams.find(team => {
                let reducedMap;
                if (team.playerDetails) {
                    reducedMap = new Set(Object.entries(team.playerDetails).map(object => object[1].id));
                }
                return team.tournament
                    && team.tournament.tournamentName === tournament.tournamentName
                    && team.tournament.tournamentDay === tournament.tournamentDay
                    && reducedMap
                    && reducedMap.has(`${currentUserId}`);
            })));
        return tournamentToTeamUserMap;
    }

    createNewTeam(createNewTeamEvent: CreateNewTeamDetails) {
        if (this.currentApplicationDetails.loggedIn &&
            this.currentApplicationDetails.userDetails) {
            const createNewTeamRequest: CreateNewTeamRequest = {
                serverName: this.currentSelectedGuild,
                tournamentName: createNewTeamEvent.tournamentName,
                tournamentDay: createNewTeamEvent.tournamentDay,
                playerDetails: {
                    id: `${this.currentApplicationDetails.userDetails.id}`,
                    role: this.getKeyByValue(createNewTeamEvent.role)
                }
            };
            this.teamsService.createNewTeam(createNewTeamRequest)
                .pipe(
                    timeout(7000),
                    catchError((err) => {
                        let message = 'Oops! An error occurred while creating a new team.';
                        if (err.name === 'TimeoutError') {
                            message = 'Oops! Your request to create a new Team has timed out. Please try again.'
                        }
                        return throwError(message);
                    }),
                    take(1),
                ).subscribe(() => {
                },
                (err) => {
                    this._snackBar.open(err,
                        'X',
                        {duration: 5 * 1000});
                });
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
            this.teams = [this.noDataAvailable];
        }
    }

    tentativeRegister(tentativeUserDetails: TentativeRecord) {
        if (this.currentApplicationDetails.loggedIn &&
            this.currentApplicationDetails.userDetails) {
            const payload: PlacePlayerOnTentativeRequest = {
                playerId: `${this.currentApplicationDetails.userDetails.id}`,
                serverName: this.currentSelectedGuild,
                tournamentDetails: tentativeUserDetails.tournamentDetails ?? {}
            };
            let obs = this.tentativeService.placePlayerOnTentative(payload);
            if (!tentativeUserDetails.toBeAdded) {
                obs = this.tentativeService.removePlayerFromTentative(payload);
            }
            obs
                .pipe(take(1),
                    map(response => {
                        const tentativeRecord: TentativeRecord = {
                            serverName: response.serverName,
                            tournamentDetails: response.tournamentDetails,
                            tentativePlayers: response.tentativePlayers,
                            playerNames: response.tentativePlayers?.map((player) => player.name ?? '') ?? [],
                            isMember: response.tentativePlayers?.some((player) => {
                                return player.id === `${this.currentApplicationDetails.userDetails?.id}`
                            }) ?? false
                        };
                        return tentativeRecord;
                    }),
                    timeout(7000),
                    catchError((err) => {
                        return throwError('Oops, we were unable to update the tentative list. Please try again later!');
                    })
                ).subscribe((response) => {
                if (this.tentativeList && tentativeUserDetails.index !== undefined) {
                    this.tentativeList[tentativeUserDetails.index] = response;
                    this.tentativeList = [...this.tentativeList];
                }
            }, (err) => {
                this._snackBar.open(err,
                    'X',
                    {duration: 5 * 1000});
            });
        } else {
            this._snackBar.open('Oops! You are not logged in, please navigate to the Welcome page and login.',
                'X',
                {duration: 5 * 1000});
        }
    }

    getKeyByValue(value?: string): Role {
        switch (value) {
            case "Top":
                return Role.Top;
            case "Bot":
                return Role.Bot;
            case "Mid":
                return Role.Mid;
            case "Supp":
                return Role.Supp;
            case "Jg":
                return Role.Jg;
            default:
                return Role.Jg;
        }
    }
}
