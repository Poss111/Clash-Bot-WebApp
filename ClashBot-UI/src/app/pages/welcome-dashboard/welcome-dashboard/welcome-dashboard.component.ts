import {Component, ViewEncapsulation} from '@angular/core';
import {ClashBotService} from "../../../services/clash-bot.service";
import {AuthConfig, OAuthService} from "angular-oauth2-oidc";
import {environment} from "../../../../environments/environment";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";
import {DiscordService} from "../../../services/discord.service";
import {UserDetailsService} from "../../../services/user-details.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {catchError, mergeMap, retryWhen, take} from "rxjs/operators";
import {throwError, timer} from "rxjs";

@Component({
  selector: 'app-welcome-dashboard',
  templateUrl: './welcome-dashboard.component.html',
  styleUrls: ['./welcome-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WelcomeDashboardComponent {
  tournamentDays: any[] = [];
  dataLoaded: boolean = false;
  guilds: any[] = [];
  loggedIn: boolean = false;

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
    sessionChecksEnabled: true
  }

  constructor(private oauthService: OAuthService,
              private clashBotService: ClashBotService,
              private discordService: DiscordService,
              private userDetailsService: UserDetailsService,
              private applicationDetailsService: ApplicationDetailsService,
              private _snackBar: MatSnackBar) {
    this.clashBotService.getClashTournaments()
        .pipe(take(1))
        .subscribe((data) => {
      data.forEach(tournament => this.tournamentDays.push(new Date(tournament.startTime)));
      this.dataLoaded = true;
      this.applicationDetailsService.getApplicationDetails()
          .pipe(take(1))
          .subscribe((appDetails) => {
        appDetails.currentTournaments = data;
        applicationDetailsService.setApplicationDetails(appDetails);
      })
    });
    this.loggedIn = oauthService.hasValidAccessToken();
    this.oauthService.configure(this.authCodeFlowConfig);
    if (sessionStorage.getItem('LoginAttempt')) {
      this.oauthService.tokenValidationHandler = new JwksValidationHandler();
      this.oauthService.tryLogin()
          .then(() => this.setUserDetails())
          .catch(err => {
        console.error(err);
        this.loggedIn = false;
        this._snackBar.open('Failed to login to discord.',
          'X',
          {duration: 5 * 1000});
      });
    } else {
      this.loggedIn = oauthService.hasValidAccessToken();
    }
  }

  setUserDetails() {
    this.discordService.getUserDetails()
        .pipe(retryWhen(error =>
            error.pipe(
                take(3),
                mergeMap((response) => {
                 if (response.status == 429) {
                   this._snackBar.open('Hit a retry error!', 'X',{ duration: 10000 });
                   return timer(response.error.retry_after);
                 } else {
                   return throwError(response);}
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
                      this._snackBar.open(`You are being rate limited. You are a dirty spammer! You will need to wait ${response.error.retry_after}ms.`, 'X',{ duration: 10000 });
                      return timer(response.error.retry_after);
                    } else {
                      return throwError(response);}
                  })
              ))).subscribe((guilds) => {
              this.clashBotService.getUserDetails(data.id)
                  .pipe(take(1))
                  .subscribe((clashBotUser) => {
                this.applicationDetailsService.getApplicationDetails()
                    .pipe(take(1))
                    .subscribe((appDetails) => {
                  appDetails.defaultGuild = clashBotUser.serverName;
                  appDetails.userGuilds = guilds;
                  this.applicationDetailsService.setApplicationDetails(appDetails);
                  this.loggedIn = true;
                })
              })
          });
        });
  }

  loginToDiscord(): void {
    this.oauthService.initLoginFlow();
    sessionStorage.setItem('LoginAttempt', 'true');
  }

}
