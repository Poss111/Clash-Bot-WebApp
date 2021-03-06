import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ClashBotService} from "../../services/clash-bot.service";
import {AuthConfig, OAuthService} from "angular-oauth2-oidc";
import {environment} from "../../../environments/environment";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";
import {DiscordService} from "../../services/discord.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {catchError, finalize, map, mergeMap, retryWhen, take} from "rxjs/operators";
import {throwError, timer} from "rxjs";
import {ClashBotUserDetails} from "../../interfaces/clash-bot-user-details";
import {ApplicationDetails} from "../../interfaces/application-details";
import {ClashTournaments} from "../../interfaces/clash-tournaments";
import {MatDialog} from "@angular/material/dialog";
import {
    ReleaseNotificationDialogComponent
} from "../../dialogs/release-notification-dialog/release-notification-dialog.component";
import {UserDetails} from "../../interfaces/user-details";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {PageLoadingService} from "../../services/page-loading.service";

@Component({
    selector: 'app-welcome-dashboard',
    templateUrl: './welcome-dashboard.component.html',
    styleUrls: ['./welcome-dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WelcomeDashboardComponent implements OnInit {
    tournamentDays: any[] = [];
    tournaments?: ClashTournaments[];
    dataLoaded: boolean = false;
    loggedIn: string = 'NOT_LOGGED_IN';

    authCodeFlowConfig: AuthConfig = {
        loginUrl: 'https://discord.com/api/oauth2/authorize',
        tokenEndpoint: 'https://discord.com/api/oauth2/token',
        revocationEndpoint: 'https://discord.com/api/oauth2/revoke',
        redirectUri: window.location.origin,
        clientId: environment.discordClientId,
        responseType: 'code',
        scope: 'identify guilds',
        showDebugInformation: true,
        oidc: false,
        sessionChecksEnabled: true,
        customQueryParams: {
            'prompt': 'none'
        }
    }

    constructor(private oauthService: OAuthService,
                private clashBotService: ClashBotService,
                private discordService: DiscordService,
                private applicationDetailsService: ApplicationDetailsService,
                private _snackBar: MatSnackBar,
                private matDialog: MatDialog,
                private pageLoadingService: PageLoadingService) {
    }

    ngOnInit(): void {
        if (localStorage.getItem('version') !== environment.version) {
            this.matDialog.open(ReleaseNotificationDialogComponent, {autoFocus: false});
            localStorage.setItem('version', environment.version);
        }
        this.clashBotService.getClashTournaments()
            .pipe(
                take(1),
                map(tournaments => {
                    tournaments.sort((a, b) =>
                        new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                    tournaments.forEach(tournament => this.tournamentDays.push(new Date(tournament.startTime)));
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
            this.loggedIn = 'LOGGED_IN';
        }
        this.oauthService.configure(this.authCodeFlowConfig);
        if (sessionStorage.getItem('LoginAttempt')) {
            this.oauthService.tokenValidationHandler = new JwksValidationHandler();
            this.oauthService.tryLogin()
                .then(() => {
                    this.setUserDetails();
                })
                .catch(() => {
                    this.loggedIn = 'NOT_LOGGED_IN';
                    this._snackBar.open('Failed to login to discord.',
                        'X',
                        {duration: 5 * 1000});
                });
        } else {
            if (this.oauthService.hasValidAccessToken()) {
                this.loggedIn = 'LOGGED_IN';
            }
        }
    }

    setUserDetails() {
        this.loggedIn = 'LOGGING_IN';
        this.discordService.getUserDetails()
            .pipe(
                retryWhen(error =>
                    error.pipe(
                        take(3),
                        mergeMap((response) => {
                            if (response.status == 429) {
                                this._snackBar.open(`Retrying to retrieve your details after ${response.error.retry_after}ms...`,
                                    'X',
                                    {duration: 5 * 1000}
                                );
                                return timer(response.error.retry_after);
                            } else {
                                this._snackBar.open(
                                    'Oops, we failed to retrieve your details from Discord. Please try logging in again.',
                                    'X',
                                    {duration: 5 * 1000}
                                );
                                return throwError(response);
                            }
                        })
                    )),
                catchError(error => {
                    this.loggedIn = 'NOT_LOGGED_IN';
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
                                            'X',
                                            {duration: 5 * 1000}
                                        );
                                        return timer(response.error.retry_after);
                                    } else {
                                        this._snackBar.open(
                                            'Failed to retrieve your discord server details. Please try logging in again.',
                                            'X',
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
                mergeMap(discordDetails => this.clashBotService.getUserDetails(discordDetails.discordUser.id)
                    .pipe(
                        catchError(err => {
                            this.loggedIn = 'NOT_LOGGED_IN';
                            this._snackBar.open('Oops, we failed to pull your userDetails from our Servers :( Please try again later.',
                                'X',
                                {duration: 5 * 1000});
                            return throwError(err);
                        }),
                        map(response => {
                            return {
                                discordUser: discordDetails.discordUser,
                                discordGuilds: discordDetails.discordGuilds,
                                clashBotUserDetails: response
                            }
                        }))),
                mergeMap(loginDetails => {
                    if (!loginDetails.clashBotUserDetails.username ||
                        loginDetails.discordUser.username !== loginDetails.clashBotUserDetails.username) {
                        return this.clashBotService.postUserDetails(loginDetails.discordUser.id,
                            loginDetails.discordGuilds[0].name,
                            new Set<string>(),
                            {'UpcomingClashTournamentDiscordDM': false},
                            loginDetails.discordUser.username)
                            .pipe(
                                catchError(err => {
                                    this._snackBar.open('Oops, we see your discord username has changed. We failed to updated it. Please try to login again.',
                                        'X',
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
                this.loggedIn = 'LOGGED_IN';
                this.applicationDetailsService.setApplicationDetails(value);
            });
    }

    mapLoggedInApplicationDetails(appDetails: ApplicationDetails,
                                  discordUser: UserDetails,
                                  guilds: DiscordGuild[],
                                  clashBotUserDetails: ClashBotUserDetails) {
        appDetails.userDetails = discordUser;
        appDetails.userGuilds = guilds;
        appDetails.clashBotUserDetails = clashBotUserDetails;
        appDetails.defaultGuild = clashBotUserDetails.serverName;
        appDetails.loggedIn = true;
        return appDetails;
    }

    loginToDiscord(): void {
        this.oauthService.initLoginFlow();
        sessionStorage.setItem('LoginAttempt', 'true');
    }

}
