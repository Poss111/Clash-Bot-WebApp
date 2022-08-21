import {Component, HostBinding, OnDestroy, OnInit} from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {environment} from "../environments/environment";
import {GoogleAnalyticsService} from "./google-analytics.service";
import {ApplicationDetailsService} from "./services/application-details.service";
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {RiotDdragonService} from "./services/riot-ddragon.service";
import {take} from "rxjs/operators";
import {RoutingDetails} from "./interfaces/routing-details";
import {PageLoadingService} from "./services/page-loading.service";
import {AuthConfig, OAuthService} from "angular-oauth2-oidc";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
    appVersion: string = environment.version;
    subscriptions: Subscription[] = [];
    darkMode;
    username?: string;
    pageLoadingObs$ = this.pageLoadingService.getSubject();
    $applicationDetailsObs = this.applicationDetailsService.getApplicationDetails().asObservable();

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
        this.oauthService.events.subscribe((event) => {
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
        this.toggleDarkMode(this.darkMode);
        this.subscriptions.push(
            this.router.events.subscribe(event => {
                if (event instanceof NavigationEnd) {
                    this.googleAnalyticsService.sendPageNavigationEvent(event.urlAfterRedirects);
                }
            })
        );
        this.subscriptions.push(
            this.applicationDetailsService.getApplicationDetails()
                .subscribe((applicationDetails) => {
                    if (applicationDetails.loggedIn) {
                        this.routingArray = this.loggedInArray;
                        this.username = applicationDetails.userDetails?.username;
                    } else {
                        this.routingArray = this.defaultRoutingArray;
                        delete this.username;
                    }
            })
        );
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
        this.subscriptions.forEach(sub => sub.unsubscribe());
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
