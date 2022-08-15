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
import {take} from "rxjs/operators";
import {RoutingDetails} from "./interfaces/routing-details";
import {PageLoadingService} from "./services/page-loading.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
    appVersion: string = environment.version;
    subscriptions: Subscription[] = [];
    darkModeFormControl = new FormControl(localStorage.getItem("darkMode") === "true");
    username?: string;
    pageLoadingObs$ = this.pageLoadingService.getSubject();

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
                private pageLoadingService: PageLoadingService) {
        this.assets.forEach((id) => {
            this.matIconRegistry.addSvgIcon(`league-${id}`,
                this.sanitizer.bypassSecurityTrustResourceUrl(`assets/${id}.svg`));
        });
    }

    ngOnInit(): void {
        this.toggleDarkMode(this.darkModeFormControl.value);
        this.darkModeFormControl.valueChanges.subscribe((value) => this.toggleDarkMode(value));
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

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    navigate(route: string) {
        this.pageLoadingObs$.next(true);
        this.router.navigate([route])
            .catch(() => this.pageLoadingObs$.next(false));
    }
}
