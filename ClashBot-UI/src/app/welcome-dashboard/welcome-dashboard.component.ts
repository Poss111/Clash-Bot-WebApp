import {Component, ViewEncapsulation} from '@angular/core';
import {ClashBotService} from "../clash-bot.service";
import {AuthConfig, OAuthService } from "angular-oauth2-oidc";
import {environment} from "../../environments/environment";

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
    redirectUri: window.location.origin + '/login',
    clientId: environment.discordClientId,
    responseType: 'code',
    scope: 'identify guilds',
    showDebugInformation: true,
    oidc: false,
    sessionChecksEnabled: true
  }

  constructor(private oauthService: OAuthService,
              private clashBotService: ClashBotService) {
    this.clashBotService.getClashTournaments().subscribe((data) => {
      data.forEach(tournament => this.tournamentDays.push(new Date(tournament.startTime)));
      this.dataLoaded = true;
    });
    this.oauthService.configure(this.authCodeFlowConfig);
    this.loggedIn = oauthService.hasValidAccessToken();
  }

  refresh() {
    this.oauthService.refreshToken();
  }

  loginToDiscord(): void {
    this.oauthService.initLoginFlow();
  }

}
