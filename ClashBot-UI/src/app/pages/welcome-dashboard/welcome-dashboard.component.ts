import {Component, OnInit, ViewEncapsulation} from "@angular/core";
import {AuthConfig, OAuthService} from "angular-oauth2-oidc";
import {environment} from "../../../environments/environment";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";
import {DiscordService} from "../../services/discord.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {catchError, finalize, map, mergeMap, retryWhen, take} from "rxjs/operators";
import {of, throwError, timer} from "rxjs";
import {ApplicationDetails} from "../../interfaces/application-details";
import {MatDialog} from "@angular/material/dialog";
import {
    ReleaseNotificationDialogComponent
} from "../../dialogs/release-notification-dialog/release-notification-dialog.component";
import {UserDetails} from "../../interfaces/user-details";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {PageLoadingService} from "../../services/page-loading.service";
import {UserService,TournamentService} from "clash-bot-service-api";
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
    tournamentDays: any[] = [];
    tournaments?: Tournament[];
    dataLoaded: boolean = false;
    loggedIn: LoginStatus = "NOT_LOGGED_IN";

    authCodeFlowConfig: AuthConfig = {
        loginUrl: "https://discord.com/api/oauth2/authorize",
        tokenEndpoint: "http://localhost:8082/auth/token",
        revocationEndpoint: "https://discord.com/api/oauth2/revoke",
        redirectUri: window.location.origin,
        clientId: environment.discordClientId,
        timeoutFactor: 0.02,
        responseType: "code",
        scope: "identify guilds",
        showDebugInformation: true,
        oidc: false,
        sessionChecksEnabled: true,
        customQueryParams: {
            "prompt": "none"
        }
    }

    constructor(private oauthService: OAuthService,
                private discordService: DiscordService,
                private applicationDetailsService: ApplicationDetailsService,
                private _snackBar: MatSnackBar,
                private matDialog: MatDialog,
                private pageLoadingService: PageLoadingService,
                private userService: UserService,
                private tournamentService: TournamentService) {
    }

    ngOnInit(): void {
        this.oauthService.configure(this.authCodeFlowConfig);
        this.oauthService.tokenValidationHandler = new JwksValidationHandler();
        if (localStorage.getItem("version") !== environment.version) {
            this.matDialog.open(ReleaseNotificationDialogComponent, {autoFocus: false});
            localStorage.setItem("version", environment.version);
        }
        this.tournamentService.getTournaments()
            .pipe(
                take(1),
                map(tournaments => {
                    tournaments.sort((a, b) =>
                        new Date(a.startTime === undefined ? "": a.startTime).getTime() - new Date(b.startTime === undefined ? "": b.startTime).getTime());
                    tournaments.forEach(tournament => this.tournamentDays.push(new Date(tournament.startTime === undefined ? "": tournament.startTime)));
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
            this.setUserDetails();
        } else if (localStorage.getItem("LoginAttempt")) {
            this.oauthService.tryLogin()
                .then(() => this.setUserDetails())
                .catch(() => {
                    this.loggedIn = "NOT_LOGGED_IN";
                    this._snackBar.open("Failed to login to discord.",
                        "X",
                        {duration: 5 * 1000});
                });
        }
        this.applicationDetailsService.getApplicationDetails()
            .pipe(map(appDetails => appDetails.loggedIn))
            .subscribe((userIsLoggedIn) => {
                if (!userIsLoggedIn) {
                    this.loggedIn = "NOT_LOGGED_IN";
                }
            });
    }

    setUserDetails() {
        this.loggedIn = "LOGGING_IN";
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
                            } else {
                                this._snackBar.open(
                                    "Oops, we failed to retrieve your details from Discord. Please try logging in again.",
                                    "X",
                                    {duration: 5 * 1000}
                                );
                                return throwError(response);
                            }
                        })
                    )),
                catchError(error => {
                    this.loggedIn = "NOT_LOGGED_IN";
                    return throwError(error)
                }),
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
                                        this._snackBar.open(
                                            "Failed to retrieve your discord server details. Please try logging in again.",
                                            "X",
                                            {duration: 5 * 1000}
                                        );
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
                                this.loggedIn = "NOT_LOGGED_IN";
                                this._snackBar.open("Oops, we failed to pull your userDetails from our Servers :( Please try again later.",
                                    "X",
                                    {duration: 5 * 1000});
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
                            serverName: loginDetails.discordGuilds[0].name,
                            name: loginDetails.discordUser.username,
                        }).pipe(
                                catchError(err => {
                                    this._snackBar.open("Failed to create a new profile for you. Please try to login again.",
                                        "X",
                                        {duration: 5 * 1000});
                                    return throwError(err);
                                }),
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
                            serverName: loginDetails.discordGuilds[0].name,
                            name: loginDetails.discordUser.username,
                        })
                            .pipe(
                                catchError(err => {
                                    this._snackBar.open("Oops, we see your discord username has changed. We failed to updated it. Please try to login again.",
                                        "X",
                                        {duration: 5 * 1000});
                                    return throwError(err);
                                }),
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
                this.loggedIn = "LOGGED_IN";
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
        appDetails.userDetails = discordUser;
        appDetails.userGuilds = guilds;
        appDetails.clashBotUserDetails = clashBotUserDetails;
        appDetails.defaultGuild = clashBotUserDetails.serverName;
        appDetails.loggedIn = true;
        return appDetails;
    }

    loginToDiscord(): void {
        this.oauthService.initLoginFlow();
        localStorage.setItem("LoginAttempt", "true");
    }

}
