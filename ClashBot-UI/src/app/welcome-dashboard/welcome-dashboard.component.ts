import {Component, OnDestroy, ViewEncapsulation} from '@angular/core';
import {ClashBotService} from "../clash-bot.service";
import {AuthConfig, OAuthService} from "angular-oauth2-oidc";
import {environment} from "../../environments/environment";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";
import {DiscordService} from "../discord.service";
import {UserDetailsService} from "../user-details.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApplicationDetailsService} from "../application-details.service";

@Component({
  selector: 'app-welcome-dashboard',
  templateUrl: './welcome-dashboard.component.html',
  styleUrls: ['./welcome-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WelcomeDashboardComponent implements OnDestroy{
  tournamentDays: any[] = [];
  dataLoaded: boolean = false;
  guilds: any[] = [];
  loggedIn: boolean = false;
  $discordServiceSubscription: any;

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
    this.clashBotService.getClashTournaments().subscribe((data) => {
      data.forEach(tournament => this.tournamentDays.push(new Date(tournament.startTime)));
      this.dataLoaded = true;
      applicationDetailsService.setApplicationDetails({ currentTournaments: data });
    });
    this.loggedIn = oauthService.hasValidAccessToken();
    this.oauthService.configure(this.authCodeFlowConfig);
    if (sessionStorage.getItem('LoginAttempt')) {
      this.oauthService.tokenValidationHandler = new JwksValidationHandler();
      this.oauthService.tryLogin().then(() => {
        this.$discordServiceSubscription = this.discordService.getUserDetails().subscribe((data) => {
          this.loggedIn = true;
          console.log(JSON.stringify(data));
          this.userDetailsService.setUserDetails(data);
        });
      }).catch(err => {
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

  loginToDiscord(): void {
    this.oauthService.initLoginFlow();
    sessionStorage.setItem('LoginAttempt', 'true');
  }

  ngOnDestroy(): void {
    if (this.$discordServiceSubscription) {
      this.$discordServiceSubscription.unsubscribe();
    }
  }

}
