import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClashTeam} from "./clash-team";
import {ClashBotService} from "./clash-bot.service";
import {Subscription, throwError} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {catchError, finalize} from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Clash-Bot';
  teams: ClashTeam[] = [];
  clashServiceSubscription: Subscription | undefined;
  color: any;
  mode: any;
  value: any;
  showSpinner: boolean;

  constructor(private clashBotService: ClashBotService, private _snackBar : MatSnackBar) {
    this.showSpinner = true;
  }

  ngOnInit(): void {
    this.color = 'primary';
    this.mode = 'indeterminate';
    this.clashServiceSubscription = this.clashBotService
      .getClashTeams()
      .pipe(
        catchError(err => {
          console.error(err);
          this._snackBar.open('Failed to retrieve Teams. Please try again later.', 'X', { duration: 5*1000});
          this.teams.push({ error: err });
          return throwError(err);
        }),
        finalize(() => this.showSpinner = false)
      )
      .subscribe((data: ClashTeam[]) => {
        this.teams = data;
      });
  }

  ngOnDestroy(): void {
    if (this.clashServiceSubscription) {
      this.clashServiceSubscription.unsubscribe();
    }
  }

}
