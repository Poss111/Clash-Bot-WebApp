import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClashTeam} from "./clash-team";
import {ClashBotService} from "./clash-bot.service";
import {Subscription, throwError} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {catchError} from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Clash-Bot';
  teams: ClashTeam[] = [];
  clashServiceSubscription: Subscription | undefined;


  constructor(private clashBotService: ClashBotService, private _snackBar : MatSnackBar) {
  }

  ngOnInit(): void {
    this.clashServiceSubscription = this.clashBotService
      .getClashTeams()
      .pipe(
        catchError(err => {
          console.error(err);
          this._snackBar.open('Failed to retrieve Teams. Please try again later.', 'X', { duration: 5*1000});
          this.teams.push({ error: err });
          return throwError(err);
        })
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
