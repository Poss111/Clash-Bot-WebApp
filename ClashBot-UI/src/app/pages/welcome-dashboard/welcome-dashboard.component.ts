import {Component, OnInit, ViewEncapsulation} from "@angular/core";
import {OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {environment} from "../../../environments/environment";
import {DiscordService} from "../../services/discord.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {catchError, finalize, map, mergeMap, retryWhen, take} from "rxjs/operators";
import {from, Observable, of, throwError, timer} from "rxjs";
import {ApplicationDetails} from "../../interfaces/application-details";
import {MatDialog} from "@angular/material/dialog";
import {
  ReleaseNotificationDialogComponent
} from "../../dialogs/release-notification-dialog/release-notification-dialog.component";
import {UserDetails} from "../../interfaces/user-details";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {PageLoadingService} from "../../services/page-loading.service";
import {TournamentService, UserService} from "clash-bot-service-api";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {Player} from "clash-bot-service-api/model/player";
import {LoginStatus} from "../../login-status";

@Component({
    selector: "app-welcome-dashboard",
    templateUrl: "./welcome-dashboard.component.html",
    styleUrls: ["./welcome-dashboard.component.scss"],
    encapsulation: ViewEncapsulation.None
})
export class WelcomeDashboardComponent implements OnInit {
    readonly NOT_LOGGED_IN: LoginStatus = LoginStatus.NOT_LOGGED_IN;
    readonly LOGGING_IN: LoginStatus = LoginStatus.LOGGING_IN;
    readonly LOGGED_IN: LoginStatus = LoginStatus.LOGGED_IN;
    tournamentDays: any[] = [];
    tournaments?: Tournament[];
    dataLoaded: boolean = false;
    $applicationDetailsServiceObs: Observable<ApplicationDetails> = this
      .applicationDetailsService.getApplicationDetails().asObservable();

    constructor(private oauthService: OAuthService,
                private discordService: DiscordService,
                private applicationDetailsService: ApplicationDetailsService,
                private _snackBar: MatSnackBar,
                private matDialog: MatDialog,
                private pageLoadingService: PageLoadingService,
                private userService: UserService,
                private tournamentService: TournamentService,
                private urlHelperService: UrlHelperService) {
    }

    ngOnInit(): void {
        if (localStorage.getItem("version") !== environment.version) {
            this.matDialog.open(ReleaseNotificationDialogComponent, {autoFocus: false});
            localStorage.setItem("version", environment.version);
        }
        this.tournamentService.getTournaments()
            .pipe(
                take(1),
                map(tournaments => {
                    tournaments.forEach(tournament => this.tournamentDays
                        .push(new Date(tournament.startTime === undefined ? "": tournament.startTime)));
                    return tournaments;
                }))
            .subscribe((data) => {
                this.tournaments = data;
                this.dataLoaded = true;
                this.applicationDetailsService.getApplicationDetails()
                    .pipe(take(1))
                    .subscribe((appDetails) => {
                        appDetails.currentTournaments = data;
                        this.applicationDetailsService.setApplicationDetails(appDetails);
                    })
            });
        if (this.oauthService.hasValidAccessToken()) {
            this.initUserDetails();
        } else {
            const parts: any = this.getCodePartsFromUrl(window.location.search);
            if (parts && parts["code"] && parts["state"]) {
                this.applicationDetailsService.loggingIn();
                this.oauthService.tryLogin()
                    .then(() => this.initUserDetails())
                    .catch(() => {
                        this.applicationDetailsService.logOutUser();
                        this._snackBar.open("Failed to get authorization from Discord.",
                            "X",
                            {duration: 5 * 1000});
                    });
            }
        }
    }

    private getCodePartsFromUrl(queryString: string): object {
        if (!queryString || queryString.length === 0) {
            return this.urlHelperService.getHashFragmentParams();
        }

        if (queryString.charAt(0) === "?") {
            queryString = queryString.substr(1);
        }

        return this.urlHelperService.parseQueryString(queryString);
    }

    initUserDetails() {
        this.discordService.getUserDetails()
            .pipe(
                retryWhen(error =>
                    error.pipe(
                        take(3),
                        mergeMap((response) => {
                            if (response.status == 429) {
                                this._snackBar.open(`Retrying to retrieve your details after ${response.error.retry_after}ms...`,
                                    "X",
                                    {duration: 5 * 1000}
                                );
                                return timer(response.error.retry_after);
                            } else if (response.status === 401) {
                              return from(this.oauthService.refreshToken())
                                  .pipe(catchError((error) => {
                                      if (error.status === 401) {
                                        this.oauthService.logOut();
                                        this.loginToDiscord();
                                        return of();
                                      } else {
                                        return throwError(error);
                                      }
                                }));
                            } else {
                                return throwError(response);
                            }
                        })
                    )),
                catchError(error => throwError(error)),
                mergeMap(userDetails => this.discordService.getGuilds()
                    .pipe(retryWhen(error =>
                            error.pipe(
                                take(3),
                                mergeMap((response) => {
                                    if (response.status == 429) {
                                        this._snackBar.open(
                                            `Retrying to retrieve your server details after ${response.error.retry_after}ms...`,
                                            "X",
                                            {duration: 5 * 1000}
                                        );
                                        return timer(response.error.retry_after);
                                    } else {
                                        return throwError(response);
                                    }
                                }))),
                        map(response => {
                            return {
                                discordUser: userDetails,
                                discordGuilds: response
                            }
                        }))),
                mergeMap(discordDetails => this.userService.getUser(`${discordDetails.discordUser.id}`)
                    .pipe(
                        catchError(err => {
                            if (err.status === 404 && err.error === "Resource not found.") {
                                 const player: Player = {}
                                return of(player);
                            } else {
                                return throwError(err);
                            }
                        }),
                        map(response => {
                            return {
                                discordUser: discordDetails.discordUser,
                                discordGuilds: discordDetails.discordGuilds,
                                clashBotUserDetails: response
                            }
                        }))),
                mergeMap(loginDetails => {
                    if (!loginDetails.clashBotUserDetails.id) {
                        return this.userService.createUser({
                            id: `${loginDetails.discordUser.id}`,
                            serverId: loginDetails.discordGuilds[0].id,
                            name: loginDetails.discordUser.username,
                        }).pipe(
                                catchError(err => throwError(err)),
                                mergeMap(response =>
                                    this.applicationDetailsService.getApplicationDetails()
                                        .pipe(
                                            take(1),
                                            map(appDetails =>
                                                this.mapLoggedInApplicationDetails(appDetails,
                                                    loginDetails.discordUser,
                                                    loginDetails.discordGuilds,
                                                    response)
                                            )
                                        )));
                    } else if (!loginDetails.clashBotUserDetails.name ||
                        loginDetails.discordUser.username !== loginDetails.clashBotUserDetails.name) {
                        return this.userService.updateUser({
                            id: `${loginDetails.discordUser.id}`,
                            serverId: loginDetails.clashBotUserDetails.serverId
                              ?? loginDetails.discordGuilds[0].id,
                            name: loginDetails.discordUser.username,
                        })
                            .pipe(
                                catchError(err => throwError(err)),
                                mergeMap(response =>
                                    this.applicationDetailsService.getApplicationDetails()
                                        .pipe(
                                            take(1),
                                            map(appDetails =>
                                                this.mapLoggedInApplicationDetails(appDetails,
                                                    loginDetails.discordUser,
                                                    loginDetails.discordGuilds,
                                                    response)
                                            )
                                        ))
                            );
                    } else {
                        return this.applicationDetailsService.getApplicationDetails()
                            .pipe(
                                take(1),
                                map(appDetails =>
                                    this.mapLoggedInApplicationDetails(appDetails,
                                        loginDetails.discordUser,
                                        loginDetails.discordGuilds,
                                        loginDetails.clashBotUserDetails)
                                ));
                    }
                }),
                finalize(() => setTimeout(() => this.pageLoadingService.updateSubject(false), 300))
            )
            .subscribe(value => {
                this.applicationDetailsService.setApplicationDetails(value);
            }, () => this._snackBar
                .open(
                    "Failed to log you in.",
                    "X",
                    {duration: 5 * 1000}
                )
            );
    }

    mapLoggedInApplicationDetails(appDetails: ApplicationDetails,
                                  discordUser: UserDetails,
                                  guilds: DiscordGuild[],
                                  clashBotUserDetails: Player) {
        let guildMap = new Map<string, DiscordGuild>();
        guilds.forEach((guild) => guildMap.set(guild.id, guild));
        appDetails.userDetails = discordUser;
        appDetails.userGuilds = guildMap;
        appDetails.clashBotUserDetails = clashBotUserDetails;
        appDetails.defaultGuild = guildMap.get(<string>clashBotUserDetails.serverId);
        appDetails.loggedIn = true;
        appDetails.loginStatus = LoginStatus.LOGGED_IN;
        return appDetails;
    }

    loginToDiscord(): void {
        this.oauthService.initLoginFlow();
    }

}
