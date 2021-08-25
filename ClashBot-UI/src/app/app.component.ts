import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {UserDetailsService} from "./services/user-details.service";
import {UserDetails} from "./interfaces/user-details";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import {GoogleAnalyticsService} from "./google-analytics.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  user$?: Observable<UserDetails>;
  appVersion: string = environment.version;

  constructor(private router: Router,
              private userDetailsService: UserDetailsService,
              private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.user$ = this.userDetailsService.getUserDetails();
    this.router.events.subscribe(event => {
      if(event instanceof NavigationEnd) {
        this.googleAnalyticsService.sendPageNavigationEvent(event.urlAfterRedirects);
      }
    })
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
