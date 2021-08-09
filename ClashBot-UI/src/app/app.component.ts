import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClashTeam} from "./clash-team";
import {ClashBotService} from "./clash-bot.service";
import {Subscription, throwError} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {catchError, finalize, timeout} from "rxjs/operators";
import {MatChip} from "@angular/material/chips";
import {FormControl} from "@angular/forms";
import {Server} from "./server";
import * as moment from "moment-timezone";

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
  servers: Server[] = [
    {
      name: 'Goon Squad',
      state: false
    },
    {
      name: 'quiet souls',
      state: false
    }
  ];
  formControl = new FormControl([this.servers[0].name]);

  constructor(private clashBotService: ClashBotService, private _snackBar: MatSnackBar) {
    this.showSpinner = false;
  }

  ngOnInit(): void {
    this.color = 'primary';
    this.mode = 'indeterminate';
    moment.tz.setDefault(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }

  ngOnDestroy(): void {
    if (this.clashServiceSubscription) {
      this.clashServiceSubscription.unsubscribe();
    }
  }

  changeSelected(server: Server) {
    server.state = false;
  }

  filterTeam(chip: MatChip) {
    chip.selectViaInteraction();
    this.showSpinner = true;
    this.teams = [];
    this.clashServiceSubscription = this.clashBotService
      .getClashTeams(this.formControl.value.trimLeft())
      .pipe(
        timeout(7000),
        catchError(err => {
          console.error(err);
          this._snackBar.open('Failed to retrieve Teams. Please try again later.',
            'X',
            {duration: 5 * 1000});
          this.teams.push({error: err});
          return throwError(err);
        }),
        finalize(() => this.showSpinner = false)
      )
      .subscribe((data: ClashTeam[]) => {
        if (data.length < 1) {
          this.teams = [{ error: 'No data' }];
        } else {
          this.teams = data;
        }
      });
  }
}
