import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ClashBotService} from "../../services/clash-bot.service";
import {AuthConfig, OAuthService} from "angular-oauth2-oidc";
import {environment} from "../../../environments/environment";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";
import {DiscordService} from "../../services/discord.service";
import {UserDetailsService} from "../../services/user-details.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {catchError, mergeMap, retryWhen, take} from "rxjs/operators";
import {throwError, timer} from "rxjs";
import {ClashBotUserDetails} from "../../interfaces/clash-bot-user-details";
import {ApplicationDetails} from "../../interfaces/application-details";
import {ClashTournaments} from "../../interfaces/clash-tournaments";
import {MatDialog} from "@angular/material/dialog";
import {ReleaseNotificationDialogComponent} from "../../components/dialogs/release-notification-dialog/release-notification-dialog.component";

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
              private userDetailsService: UserDetailsService,
              private applicationDetailsService: ApplicationDetailsService,
              private _snackBar: MatSnackBar,
              private matDialog: MatDialog) { }

  ngOnInit(): void {
    if (localStorage.getItem('version') !== environment.version) {
        this.matDialog.open(ReleaseNotificationDialogComponent, { autoFocus: false });
        localStorage.setItem('version', environment.version);
    }
    this.clashBotService.getClashTournaments()
      .pipe(take(1))
      .subscribe((data) => {
        this.tournaments = data.sort((a,b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        data.forEach(tournament => this.tournamentDays.push(new Date(tournament.startTime)));
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
        .then(() => this.setUserDetails())
        .catch(err => {
          console.error(err);
          this.loggedIn = 'NOT_LOGGED_IN';
          this._snackBar.open('Failed to login to discord.',
            'X',
            {duration: 5 * 1000});
        });
    } else if (!environment.production) {
        this.loggedIn = 'LOGGED_IN';
        this.setUserDetails();
    } else {
      if (this.oauthService.hasValidAccessToken()) {
        this.loggedIn = 'LOGGED_IN';
      }
    }
  }

  setUserDetails() {
    this.loggedIn = 'LOGGING_IN';
    this.discordService.getUserDetails()
      .pipe(retryWhen(error =>
          error.pipe(
            take(3),
            mergeMap((response) => {
              if (response.status == 429) {
                this._snackBar.open('Hit a retry error!', 'X', {duration: 10000});
                return timer(response.error.retry_after);
              } else {
                return throwError(response);
              }
            })
          )),
        catchError(error => throwError(error)))
      .subscribe((data) => {
        this.userDetailsService.setUserDetails(data);
        this.discordService.getGuilds()
          .pipe(retryWhen(error =>
            error.pipe(
              take(3),
              mergeMap((response) => {
                if (response.status == 429) {
                  this._snackBar.open(`You are being rate limited. You are a dirty spammer! You will need to wait ${response.error.retry_after}ms.`, 'X', {duration: 10000});
                  return timer(response.error.retry_after);
                } else {
                  return throwError(response);
                }
              })
            ))).subscribe((guilds) => {
          this.clashBotService.getUserDetails(data.id)
            .pipe(take(1),
              catchError(err => {
              console.error(err);
              this.loggedIn = 'NOT_LOGGED_IN';
              this._snackBar.open('Oops, we failed to pull your data from our Servers :( Please try again later.',
                'X',
                {duration: 5 * 1000});
              return throwError(err);
            }))
            .subscribe((clashBotUser) => {
              this.applicationDetailsService.getApplicationDetails()
                .pipe(take(1))
                .subscribe((appDetails) => {
                  if (!clashBotUser.username || data.username !== clashBotUser.username) {
                    this.clashBotService.postUserDetails(data.id, guilds[0].name, new Set<string>(), {'UpcomingClashTournamentDiscordDM': false}, data.username)
                      .pipe(take(1),
                        catchError(err => {
                        console.error(err);
                        this.loggedIn = 'NOT_LOGGED_IN';
                        this._snackBar.open('Oops, we see your discord username has changed. We failed to updated it. Please try to login again.',
                          'X',
                          {duration: 5 * 1000});
                        return throwError(err);
                      }))
                      .subscribe((savedUser) => {
                        this.setLoggedInDetails(appDetails, savedUser, guilds);
                      });
                  } else {
                    this.setLoggedInDetails(appDetails, clashBotUser, guilds);
                  }
                })
            })
        });
      });
  }

  private setLoggedInDetails(appDetails: ApplicationDetails, clashBotUser: ClashBotUserDetails, guilds: any[]) {
    appDetails.defaultGuild = clashBotUser.serverName;
    appDetails.userGuilds = guilds;
    this.applicationDetailsService.setApplicationDetails(appDetails);
    this.loggedIn = 'LOGGED_IN';
  }

  loginToDiscord(): void {
    this.oauthService.initLoginFlow();
    sessionStorage.setItem('LoginAttempt', 'true');
  }

}
