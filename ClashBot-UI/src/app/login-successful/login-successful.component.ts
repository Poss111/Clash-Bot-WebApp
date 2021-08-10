import { Component, OnInit } from '@angular/core';
import {AuthConfig, OAuthService} from "angular-oauth2-oidc";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";
import {environment} from "../../environments/environment";
import {DiscordService} from "../discord.service";
import {UserDetailsService} from "../user-details.service";
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-login-successful',
  templateUrl: './login-successful.component.html',
  styleUrls: ['./login-successful.component.scss']
})
export class LoginSuccessfulComponent implements OnInit {

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
              private discordService: DiscordService,
              private userDetailsService: UserDetailsService,
              private router: Router,
              private _snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    this.oauthService.configure(this.authCodeFlowConfig);
    this.oauthService.tryLogin().then(() => {
      this.discordService.getUserDetails().subscribe((data) => {
        this.userDetailsService.setUserDetails(data);
        this.router.navigate(['/']);
      });
    }).catch(err => {
      console.error(err);
      this._snackBar.open('Failed to login to discord.',
        'X',
        {duration: 5 * 1000});
      this.router.navigate(['/']);
    });
  }

}
