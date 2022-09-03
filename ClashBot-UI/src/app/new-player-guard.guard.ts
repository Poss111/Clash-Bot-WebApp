import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from "@angular/router";
import {Observable} from "rxjs";
import {ApplicationDetailsService} from "./services/application-details.service";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class NewPlayerGuardGuard implements CanActivate {

  constructor(private appDetails: ApplicationDetailsService,
              private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.appDetails.getApplicationDetails()
      .pipe(map((details) => {
        if (details.loggedIn && details.selectedGuilds) {
          return true;
        } else if (details.loggedIn && !details.selectedGuilds) {
          return this.router.parseUrl("/walkthrough");
        }
        return this.router.parseUrl("/");
      }));
  }

}
