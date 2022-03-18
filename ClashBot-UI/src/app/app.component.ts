import {Component, EventEmitter, HostBinding, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {UserDetailsService} from "./services/user-details.service";
import {UserDetails} from "./interfaces/user-details";
import {Observable, Subscription} from "rxjs";
import {environment} from "../environments/environment";
import {GoogleAnalyticsService} from "./google-analytics.service";
import {ApplicationDetailsService} from "./services/application-details.service";
import {FormControl} from "@angular/forms";
import {ClashBotNotification} from "./interfaces/clash-bot-notification";
import {delay, retryWhen, take, tap} from "rxjs/operators";
import {ClashBotNotificationService} from "./services/clash-bot-notification.service";
import {NotificationsWsService} from "./services/notifications-ws.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatSidenav} from "@angular/material/sidenav";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy{
  appVersion: string = environment.version;
  userDetailsLoaded: boolean = false;
  applicationDetailsLoaded: boolean = false;
  userDetailsSub$?: Subscription;
  applicationDetailsSub$?: Subscription;
  notificationsSubscription$?: Subscription;
  notifications: ClashBotNotification[] = [];
  username: string = '';

  darkModeFormControl = new FormControl(localStorage.getItem('darkMode') === 'true');

  @ViewChild('menuSideNav') menuSideNav: MatSidenav | undefined;

  @HostBinding('class') className = '';
  private $notificationSub: Subscription | undefined;

  constructor(private router: Router,
              private userDetailsService: UserDetailsService,
              private clashBotNotificationService: ClashBotNotificationService,
              private clashBotNotificationWSService : NotificationsWsService,
              private applicationDetailsService: ApplicationDetailsService,
              private googleAnalyticsService: GoogleAnalyticsService,
              public notificationsWsService: NotificationsWsService,
              private _snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.toggleDarkMode(this.darkModeFormControl.value);
    this.darkModeFormControl.valueChanges.subscribe((value) => this.toggleDarkMode(value));
    this.router.events.subscribe(event => {
      if(event instanceof NavigationEnd) {
        this.googleAnalyticsService.sendPageNavigationEvent(event.urlAfterRedirects);
      }
    })
    this.userDetailsSub$ = this.userDetailsService.getUserDetails().subscribe((userDetails) => {
      if (userDetails.username && userDetails.username != '') {
        this.username = userDetails.username;
        this.userDetailsLoaded = true;
        this.clashBotNotificationWSService.connectToNotificationUpdates(1);
      }
    })
    this.applicationDetailsSub$ = this.applicationDetailsService.getApplicationDetails().subscribe((appDetails) => {
      if (Array.isArray(appDetails.userGuilds) && appDetails.userGuilds.length > 0)
        this.applicationDetailsLoaded = true;
    })
  }

  toggleDarkMode(turnDarkModeOn: boolean) {
    let applicationDetails = this.applicationDetailsService.getApplicationDetails().value;
    const darkModeClassName = 'darkMode';
    this.className = turnDarkModeOn ? darkModeClassName : '';
    applicationDetails.darkMode = turnDarkModeOn;
    this.applicationDetailsService.setApplicationDetails(applicationDetails);
    localStorage.setItem('darkMode', JSON.stringify(turnDarkModeOn));
  }

  ngOnDestroy() {
    this.userDetailsSub$?.unsubscribe();
    this.applicationDetailsSub$?.unsubscribe();
    this.$notificationSub?.unsubscribe();
    this.notificationsSubscription$?.unsubscribe();
  }

  navigateToWelcomePage() {
    this.router.navigate(['/']);
    this.menuSideNav?.close();
  }

  navigateToTeams() {
    this.router.navigate(['/teams']);
    this.menuSideNav?.close();
  }

  navigateToUserProfile() {
    this.router.navigate(['/user-profile']);
    this.menuSideNav?.close();
  }

}
