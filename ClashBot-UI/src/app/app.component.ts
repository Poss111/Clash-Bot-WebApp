import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {UserDetailsService} from "./user-details.service";
import {UserDetails} from "./user-details";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  user$?: Observable<UserDetails>;
  appVersion: string = environment.version;

  constructor(private router: Router,
              private userDetailsService: UserDetailsService) {}

  navigateToWelcomePage() {
    this.router.navigate(['/']);
  }

  navigateToTeams() {
    this.router.navigate(['/teams']);
  }

  ngOnInit(): void {
    this.user$ = this.userDetailsService.getUserDetails();
  }

  navigateToUserProfile() {
    this.router.navigate(['/user-profile']);
  }
}
