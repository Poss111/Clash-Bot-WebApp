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
import {FREE_AGENT_GUILD} from "../../interfaces/clash-bot-constants";

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
        const parts: any = this.getCodePartsFromUrl(window.location.search);
        if (parts && parts["code"] && parts["state"]) {
            this.applicationDetailsService.loggingIn();
            this.oauthService.tryLogin()
                .then(() => this.applicationDetailsService.loadingUserDetails())
                .catch(() => {
                    this.applicationDetailsService.logOutUser();
                    this._snackBar.open("Failed to get authorization from Discord.",
                        "X",
                        {duration: 5 * 1000});
                });
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

    loginToDiscord(): void {
        this.oauthService.initLoginFlow();
    }

}
