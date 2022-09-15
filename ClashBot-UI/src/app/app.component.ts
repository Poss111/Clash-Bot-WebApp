import {Component, HostBinding, OnDestroy, OnInit} from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";
import {Subject} from "rxjs";
import {environment} from "../environments/environment";
import {GoogleAnalyticsService} from "./google-analytics.service";
import {ApplicationDetailsService} from "./services/application-details.service";
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {RiotDdragonService} from "./services/riot-ddragon.service";
import {filter, take, takeUntil, tap} from "rxjs/operators";
import {RoutingDetails} from "./interfaces/routing-details";
import {PageLoadingService} from "./services/page-loading.service";
import {AuthConfig, OAuthService} from "angular-oauth2-oidc";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";
import {MatSnackBar} from "@angular/material/snack-bar";
import {LoginStatus} from "./login-status";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
    appVersion: string = environment.version;
    darkMode;
    username?: string;
    pageLoadingObs$ = this.pageLoadingService.getSubject();
    $applicationDetailsObs = this.applicationDetailsService.getApplicationDetails().asObservable();
    $takeUntil = new Subject();

    routingArray: RoutingDetails[] = [];

    defaultRoutingArray: RoutingDetails[] = [
        {
            name: "Welcome Page",
            route: "/",
            icon: "house",
            id: "clash-bot-menu-welcome-page"
        }
    ];

    loggedInArray: RoutingDetails[] = [
        this.defaultRoutingArray[0],
        {
            name: "Teams",
            route: "/teams",
            icon: "groups",
            id: "clash-bot-menu-teams-page"
        },
        {
            name: "Walkthrough",
            route: "/walkthrough",
            icon: "groups",
            id: "clash-bot-menu-walkthrough"
        }
    ];

    assets = ["top", "mid", "jg", "bot", "supp"];

    @HostBinding("class") className = "";

    authCodeFlowConfig: AuthConfig = {
        loginUrl: "https://discord.com/api/oauth2/authorize",
        tokenEndpoint: this.getAuthPath(),
        revocationEndpoint: "https://discord.com/api/oauth2/revoke",
        redirectUri: window.location.origin,
        clientId: environment.discordClientId,
        responseType: "code",
        scope: "identify guilds",
        oidc: false,
        sessionChecksEnabled: true,
        customQueryParams: {
            "prompt": "none"
        }
    }

    constructor(private router: Router,
                private applicationDetailsService: ApplicationDetailsService,
                private googleAnalyticsService: GoogleAnalyticsService,
                private riotDdragonService: RiotDdragonService,
                private matIconRegistry: MatIconRegistry,
                private sanitizer: DomSanitizer,
                private pageLoadingService: PageLoadingService,
                private oauthService: OAuthService,
                private _snackBar: MatSnackBar) {
        this.assets.forEach((id) => {
            this.matIconRegistry.addSvgIcon(`league-${id}`,
                this.sanitizer.bypassSecurityTrustResourceUrl(`assets/${id}.svg`));
        });
        this.darkMode = localStorage.getItem("darkMode") === "true";
    }

    ngOnInit(): void {
        this.oauthService.configure(this.authCodeFlowConfig);
        this.oauthService.tokenValidationHandler = new JwksValidationHandler();
        this.oauthService.events
            .pipe(takeUntil(this.$takeUntil))
            .subscribe((event) => {
            if ("token_expires" === event.type) {
                this.oauthService.refreshToken()
                    .then(() => this._snackBar
                        .open("Refreshed your session.", "X", {duration: 5 * 1000}))
                    .catch(() => {
                        this.applicationDetailsService.logOutUser();
                        this._snackBar
                            .open("Failed to refresh", "X", {duration: 5 * 1000});
                    });
            }
        });
        this.applicationDetailsService.getApplicationDetails()
          .pipe(
            takeUntil(this.$takeUntil),
            filter(details => (details.loginStatus === LoginStatus.LOAD_USER_DETAILS)
                && this.oauthService.hasValidAccessToken()),
            tap(() => this._snackBar.open("Logging in....", "X", {duration: 5 * 1000})),
          )
          .subscribe(() => {
            this.applicationDetailsService.initUserDetails();
          });
        this.toggleDarkMode(this.darkMode);
        this.router.events
            .pipe(takeUntil(this.$takeUntil))
            .subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.googleAnalyticsService.sendPageNavigationEvent(event.urlAfterRedirects);
            }
        });
        this.applicationDetailsService.getApplicationDetails()
            .pipe(
                takeUntil(this.$takeUntil)
            )
            .subscribe((applicationDetails) => {
                if (applicationDetails.loggedIn) {
                    this.routingArray = this.loggedInArray;
                    this.username = applicationDetails.userDetails?.username;
                } else {
                    this.routingArray = this.defaultRoutingArray;
                    delete this.username;
                }
        });
        this.riotDdragonService.getVersions().pipe(take(1)).subscribe((versions) => {
            window.localStorage.setItem("leagueApiVersion", versions[0]);
        });
    }

    toggleDarkMode(turnDarkModeOn: boolean) {
        const darkModeClassName = "dark";
        this.className = turnDarkModeOn ? darkModeClassName : "";
        localStorage.setItem("darkMode", JSON.stringify(turnDarkModeOn));
    }

    toggleDarkModeForUser(darkModeCurrentStatus: boolean) {
        const darkModeClassName = "dark";
        this.className = !darkModeCurrentStatus ? darkModeClassName : "";
        localStorage.setItem("darkMode", JSON.stringify(!darkModeCurrentStatus));
        this.darkMode = !darkModeCurrentStatus;
    }

    logUserOut() {
        this.oauthService.logOut();
        this.applicationDetailsService.logOutUser();
    }

    ngOnDestroy() {
        this.$takeUntil.next();
    }

    navigate(route: string) {
        this.pageLoadingObs$.next(true);
        this.router.navigate([route])
            .catch(() => this.pageLoadingObs$.next(false));
    }

    private getAuthPath() {
        if (environment.authPath.includes("localhost")) {
            return environment.authPath;
        }
        return window.location.origin + environment.authPath;
    }
}
