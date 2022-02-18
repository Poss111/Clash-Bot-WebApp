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
import {take} from "rxjs/operators";
import {ClashBotNotificationService} from "./services/clash-bot-notification.service";
import {Overlay} from "@angular/cdk/overlay";
import {NotificationsComponent} from "./shared/notifications/notifications.component";
import {ComponentPortal} from "@angular/cdk/portal";
import {NotificationOverlayService} from "./shared/notifications/notification-overlay.service";

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

  hidden: boolean = false;
  notificationOverlayEvent?: EventEmitter<MouseEvent>;
  overlayAttachedEvent?: EventEmitter<void>;

  constructor(private router: Router,
              private userDetailsService: UserDetailsService,
              private clashBotNotificationService: ClashBotNotificationService,
              private applicationDetailsService: ApplicationDetailsService,
              private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.overlayAttachedEvent?.subscribe(() => {
      this.notificationOverlayEvent?.subscribe((event) => console.log('Clicked outside.'))
    });
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
              this.notifications.push(...userNotifications);
            });
      }
    })
    this.applicationDetailsSub$ = this.applicationDetailsService.getApplicationDetails().subscribe((appDetails) => {
      if (Array.isArray(appDetails.userGuilds) && appDetails.userGuilds.length > 0)
        this.applicationDetailsLoaded = true;
    })
  }

  toggleDarkMode(turnDarkModeOn: boolean) {
    const darkModeClassName = 'darkMode';
    this.className = turnDarkModeOn ? darkModeClassName : '';
    localStorage.setItem('darkMode', JSON.stringify(turnDarkModeOn));
  }

  ngOnDestroy() {
    this.userDetailsSub$?.unsubscribe();
    this.applicationDetailsSub$?.unsubscribe();
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

  toggleBadgeVisibility() {
    this.hidden = !this.hidden;
  }
}
