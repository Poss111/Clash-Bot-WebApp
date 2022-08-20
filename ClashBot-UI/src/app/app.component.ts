import {Component, HostBinding, OnDestroy, OnInit} from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {environment} from "../environments/environment";
import {GoogleAnalyticsService} from "./google-analytics.service";
import {ApplicationDetailsService} from "./services/application-details.service";
import {FormControl} from "@angular/forms";
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {RiotDdragonService} from "./services/riot-ddragon.service";
import {map, take} from "rxjs/operators";
import {RoutingDetails} from "./interfaces/routing-details";
import {PageLoadingService} from "./services/page-loading.service";
import {OAuthService} from "angular-oauth2-oidc";

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
        },
        {
            name: "Settings",
            route: "/user-profile",
            icon: "settings",
            id: "clash-bot-menu-user-profile-page"
        }
    ];

    assets = ["top", "mid", "jg", "bot", "supp"];

    @HostBinding("class") className = "";

    constructor(private router: Router,
                private applicationDetailsService: ApplicationDetailsService,
                private googleAnalyticsService: GoogleAnalyticsService,
                private riotDdragonService: RiotDdragonService,
                private matIconRegistry: MatIconRegistry,
                private sanitizer: DomSanitizer,
                private pageLoadingService: PageLoadingService,
                private oauthService: OAuthService) {
        this.assets.forEach((id) => {
            this.matIconRegistry.addSvgIcon(`league-${id}`,
                this.sanitizer.bypassSecurityTrustResourceUrl(`assets/${id}.svg`));
        });
        this.darkMode = localStorage.getItem("darkMode") === "true";
    }

    ngOnInit(): void {
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
        console.log("Log Out");
        this.oauthService.logOut();
        this.applicationDetailsService.getApplicationDetails()
            .pipe(
                take(1),
                map(appDetails => {
                    return {
                        currentTournaments: appDetails.currentTournaments,
                        loggedIn: false
                    };
                })
            )
            .subscribe((appDetails) => {
                this.applicationDetailsService.setApplicationDetails(appDetails);
            });
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    navigate(route: string) {
        this.pageLoadingObs$.next(true);
        this.router.navigate([route])
            .catch(() => this.pageLoadingObs$.next(false));
    }
}
