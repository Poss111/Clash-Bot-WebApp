import {Component, HostBinding, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {UserDetailsService} from "./services/user-details.service";
import {UserDetails} from "./interfaces/user-details";
import {Observable, Subscription} from "rxjs";
import {environment} from "../environments/environment";
import {GoogleAnalyticsService} from "./google-analytics.service";
import {ApplicationDetailsService} from "./services/application-details.service";
import {FormControl} from "@angular/forms";

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
  username: string = '';

  darkModeFormControl = new FormControl(localStorage.getItem('darkMode') === 'true');

  @HostBinding('class') className = '';

  constructor(private router: Router,
              private userDetailsService: UserDetailsService,
              private applicationDetailsService: ApplicationDetailsService,
              private googleAnalyticsService: GoogleAnalyticsService) {}

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
}
