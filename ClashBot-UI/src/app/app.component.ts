import {Component, EventEmitter, HostBinding, OnDestroy, OnInit} from '@angular/core';
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
import {ClashTeam} from "./interfaces/clash-team";
import {MatSnackBar} from "@angular/material/snack-bar";

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
  notifications: ClashBotNotification[] = [];
  username: string = '';

  darkModeFormControl = new FormControl(localStorage.getItem('darkMode') === 'true');

  @HostBinding('class') className = '';
  private $notificationSub: Subscription | undefined;

  constructor(private router: Router,
              private userDetailsService: UserDetailsService,
              private clashBotNotificationService: ClashBotNotificationService,
              private clashBotNotificationWSService : NotificationsWsService,
              private applicationDetailsService: ApplicationDetailsService,
              private googleAnalyticsService: GoogleAnalyticsService,
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
        this.clashBotNotificationService.retrieveClashNotificationsForUser(userDetails.id)
            .pipe(take(1))
            .subscribe((userNotifications) => {
              this.notifications = userNotifications;
              this.$notificationSub = this.clashBotNotificationWSService.getSubject()
                  .pipe(
                      retryWhen(errors =>
                          errors.pipe(
                              tap(err => {
                                  this._snackBar.open('Failed to connect to server for Notification updates, retrying...',
                                      'X',
                                      {duration: 5 * 1000});
                              }),
                              delay(1000)
                          )
                      )
                  )
                  .subscribe((msg) => {
                        if (msg instanceof Number) {
                            this._snackBar.open('Connected Successfully to server for Notification updates.',
                                'X',
                                {duration: 5 * 1000});
                        } else {
                          this.notifications.unshift(<ClashBotNotification>msg);
                        }
                      },
                      () => {
                        this._snackBar.open('Oops! Failed to connect to server for Notification updates, please try refreshing.',
                            'X',
                            {duration: 5 * 1000})
                      },
                      () => console.debug('Connection closed to notification ws.'));
            });
          this.clashBotNotificationWSService.getSubject().next(1);
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
  }

  navigateToWelcomePage() {
    this.router.navigate(['/']);
  }

  navigateToTeams() {
    this.router.navigate(['/teams']);
  }

  navigateToUserProfile() {
    this.router.navigate(['/user-profile']);
  }

}
