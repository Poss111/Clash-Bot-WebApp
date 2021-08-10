import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {UserDetailsService} from "./user-details.service";
import {UserDetails} from "./user-details";
import {Observable} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  user$?: Observable<UserDetails>;

  constructor(private router: Router,
              private userDetailsService: UserDetailsService) {
    this.user$ = this.userDetailsService.getUserDetails();
  }

  navigateToWelcomePage() {
    this.router.navigate(['/'])
  }

  navigateToTeams() {
    this.router.navigate(['/teams'])
  }

}
