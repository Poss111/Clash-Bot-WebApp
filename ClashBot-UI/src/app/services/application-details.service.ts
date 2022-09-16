import {Injectable} from "@angular/core";
import {BehaviorSubject, from, of, throwError, timer} from "rxjs";
import {ApplicationDetails} from "../interfaces/application-details";
import {LoginStatus} from "../login-status";
import {catchError, finalize, map, mergeMap, retryWhen, take} from "rxjs/operators";
import {Player} from "clash-bot-service-api/model/player";
import {UserDetails} from "../interfaces/user-details";
import {DiscordGuild} from "../interfaces/discord-guild";
import {DiscordService} from "./discord.service";
import {OAuthService} from "angular-oauth2-oidc";
import {MatSnackBar} from "@angular/material/snack-bar";
import {PageLoadingService} from "./page-loading.service";
import {UserService} from "clash-bot-service-api";

@Injectable({
    providedIn: "root"
})
export class ApplicationDetailsService {

    private defaultStatus: ApplicationDetails = {
      loggedIn: false,
      loginStatus: this.oauthService.hasValidAccessToken() ? LoginStatus.LOAD_USER_DETAILS : LoginStatus.NOT_LOGGED_IN,
    };
    applicationDetails: BehaviorSubject<ApplicationDetails> = new BehaviorSubject<ApplicationDetails>(this.defaultStatus);

    constructor(private discordService: DiscordService,
                private oauthService: OAuthService,
                private _snackBar: MatSnackBar,
                private userService: UserService,
                private pageLoadingService: PageLoadingService) {}

    getApplicationDetails(): BehaviorSubject<ApplicationDetails> {
        return this.applicationDetails;
    }

    setApplicationDetails(applicationDetails: ApplicationDetails) {
        this.applicationDetails.next(applicationDetails);
    }

    loggingIn() {
        let value = this.applicationDetails.value;
        this.applicationDetails.next({
          ...value,
          loggedIn: false,
          loginStatus: LoginStatus.LOGGING_IN
        });
    }

    loadUserDetails() {
      let value = this.applicationDetails.value;
      this.applicationDetails.next({
        ...value,
        loggedIn: false,
        loginStatus: LoginStatus.LOAD_USER_DETAILS
      });
    }

    loadingUserDetails() {
      let value = this.applicationDetails.value;
      this.applicationDetails.next({
        ...value,
        loggedIn: false,
        loginStatus: LoginStatus.LOADING_USER_DETAILS
      });
    }

    logOutUser() {
        let value = this.applicationDetails.value;
        value.userGuilds?.clear();
        this.applicationDetails.next({
          currentTournaments: value.currentTournaments,
          loggedIn: false,
          loginStatus: LoginStatus.NOT_LOGGED_IN,
          userGuilds: value.userGuilds,
        });
    }

  initUserDetails() {
    this.loadingUserDetails();
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
                      this.oauthService.initLoginFlow();
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
                this.applicationDetails
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
                  this.applicationDetails
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
            return this.applicationDetails
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
          this.applicationDetails.next(value);
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
    let selectedGuildMap = new Map<string, DiscordGuild>();
    guilds.forEach((guild) => guildMap.set(guild.id, guild));
    if (clashBotUserDetails.selectedServers) {
      clashBotUserDetails.selectedServers
        .forEach((serverId) => {
          const foundGuild = guildMap.get(serverId);
          if (foundGuild) {
            selectedGuildMap.set(serverId, foundGuild);
          }
      });
    }
    appDetails.userDetails = discordUser;
    appDetails.userGuilds = guildMap;
    appDetails.clashBotUserDetails = clashBotUserDetails;
    appDetails.defaultGuild = guildMap.get(<string>clashBotUserDetails.serverId);
    appDetails.selectedGuilds = selectedGuildMap;
    appDetails.loggedIn = true;
    appDetails.loginStatus = LoginStatus.LOGGED_IN;
    return appDetails;
  }
}
