import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable, of, throwError} from "rxjs";
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn} from "@angular/forms";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {catchError, map, startWith, take, timeout} from "rxjs/operators";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {ClashBotService} from "../clash-bot.service";
import {ClashBotUserDetails} from "../clash-bot-user-details";
import {RiotDdragonService} from "../riot-ddragon.service";
import {UserDetailsService} from "../user-details.service";
import {DiscordService} from "../discord.service";
import {DiscordGuild} from "../discord-guild";
import {UserDetails} from "../user-details";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  championAutoCompleteCtrl = new FormControl();
  championsAutofillArray: Observable<string[]> = of();
  preferredChampions: Set<string> = new Set<string>();
  listOfChampions: string[] = [];
  initialFormControlState: any = {};
  initialAutoCompleteArray: string[] = [];
  defaultGuild: string = '';
  userDetails?: UserDetails;
  guilds: DiscordGuild[] = [];

  @ViewChild('championInput') championInput: any = '';
  userDetailsForm?: FormGroup;

  constructor(private discordService: DiscordService,
              private clashBotService: ClashBotService,
              private userDetailsService: UserDetailsService,
              private riotDdragonService: RiotDdragonService,
              private matSnackBar: MatSnackBar) {
  }

  notInListValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const contained = !this.listOfChampions.includes(control.value);
      return contained ? {forbiddenName: {value: control.value}} : null;
    };
  }

  ngOnInit(): void {
    this.discordService.getGuilds()
      .pipe(take(1),
        timeout(4000),
        catchError((err) => {
          console.error(err);
          this.matSnackBar.open('Oops! Failed to load your guild information.', 'X', {duration: 5000});
          return throwError(err);
        })).subscribe((guilds) => {
      guilds.forEach(guild => {
        this.guilds.push(guild);
      });
      this.userDetailsService.getUserDetails().pipe(take(1)).subscribe((userDetails) => {
        if (!userDetails || !userDetails.id || userDetails.id == '') {
          this.matSnackBar.open('Oops! You are not logged in. Please navigate back to the home screen and log in.', 'X', {duration: 5000})
        } else {
          this.userDetails = userDetails;
          this.clashBotService.getUserDetails(userDetails.id)
            .pipe(take(1),
              timeout(4000),
              catchError((err) => {
                console.error(err);
                this.matSnackBar.open('Oops! Failed to retrieve your User Information. Please try again later.', 'X', {duration: 5000});
                return throwError(err);
              }))
            .subscribe((data: ClashBotUserDetails) => {
              if (!data || !data.id) {
                data.serverName = guilds[0].name;
                data.preferredChampions = [];
                data.subscriptions = {
                  UpcomingClashTournamentDiscordDM: false
                };
              }
              this.defaultGuild = data.serverName;
              let preferredChampions = Array.isArray(data.preferredChampions) ? data.preferredChampions : [];
              this.riotDdragonService.getListOfChampions()
                .pipe(take(1),
                  timeout(4000),
                  catchError((err) => {
                    console.error(err);
                    this.matSnackBar.open('Oops! Failed to retrieve League Champion names. Please try again later.', 'X', {duration: 5000});
                    return throwError(err);
                  })).subscribe((championData) => {
                this.listOfChampions = Object.keys(championData.data);
                this.listOfChampions = this.listOfChampions.filter(record => !preferredChampions.includes(record));
                this.initialAutoCompleteArray = JSON.parse(JSON.stringify(this.listOfChampions));
                this.userDetailsForm = new FormGroup({
                  preferredChampionsFC: new FormControl([...preferredChampions]),
                  subscribedDiscordDMFC: new FormControl(data.subscriptions.UpcomingClashTournamentDiscordDM),
                  defaultGuildFC: new FormControl(this.defaultGuild)
                });
                this.preferredChampions = new Set<string>(data.preferredChampions);
                this.initialFormControlState = JSON.parse(JSON.stringify(this.userDetailsForm.value));
                this.championsAutofillArray = this.championAutoCompleteCtrl.valueChanges.pipe(
                  startWith(null),
                  map((champion: string | null) => champion ? this._filter(champion) : this.listOfChampions.slice()));
              })
            })
        }
      })
    })
  }

  private syncChampionsList(value: string) {
    if (this.listOfChampions.indexOf(value) > -1) {
      this.listOfChampions.splice(this.listOfChampions.indexOf(value), 1);
      this.listOfChampions.sort();
      this.preferredChampions.add(value);
    } else {
      this.preferredChampions.delete(value);
      this.listOfChampions.push(value);
      this.listOfChampions.sort();
    }
    this.userDetailsForm?.controls.preferredChampionsFC.setValue([...this.preferredChampions]);
    this.checkFormState();
  }

  private checkFormState() {
    if (this.compareArray([...this.preferredChampions], this.initialFormControlState.preferredChampionsFC)
      && this.userDetailsForm?.controls.subscribedDiscordDMFC.value === this.initialFormControlState.subscribedDiscordDMFC) {
      this.userDetailsForm?.markAsPristine()
    } else {
      this.userDetailsForm?.markAsDirty();
    }
  }

  remove(champion: string): void {
    this.syncChampionsList(champion);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.syncChampionsList(event.option.viewValue);
    this.championInput.nativeElement.value = '';
    this.championAutoCompleteCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.listOfChampions.filter(champion => champion.toLowerCase().includes(filterValue));
  }

  resetState() {
    this.userDetailsForm?.reset(this.initialFormControlState);
    this.preferredChampions = new Set<string>(this.initialFormControlState.preferredChampionsFC);
    this.listOfChampions = JSON.parse(JSON.stringify(this.initialAutoCompleteArray));
  }

  onSubmit() {
    if (this.userDetailsForm && this.userDetails) {
      this.clashBotService.postUserDetails(this.userDetails.id,
        this.userDetailsForm.value.defaultGuildFC,
        new Set<string>(this.userDetailsForm.value.preferredChampionsFC),
        {'UpcomingClashTournamentDiscordDM': this.userDetailsForm.value.subscribedDiscordDMFC})
        .pipe(timeout(4000),
          catchError((err) => {
            console.error(err);
            this.matSnackBar.open('Oops! Failed to persist your requested update. Please try again.', 'X', {duration: 5000});
            return throwError(err);
          }))
        .subscribe(() => {
          this.initialFormControlState = JSON.parse(JSON.stringify(this.userDetailsForm?.value));
          this.userDetailsForm?.markAsPristine();
        });
    }
  }

  sliderUpdate() {
    this.checkFormState();
  }

  compareArray(arr1: any[], arr2: any[]): boolean {
    if ((Array.isArray(arr1) && Array.isArray(arr2))
      && arr1.length === arr2.length) {
      for (let value of arr2) {
        if (!arr1.includes(value)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
}
