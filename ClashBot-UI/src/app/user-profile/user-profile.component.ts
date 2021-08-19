import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Observable, of} from "rxjs";
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from "@angular/forms";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {map, startWith, tap} from "rxjs/operators";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {ClashBotService} from "../clash-bot.service";
import {ClashBotUserDetails} from "../clash-bot-user-details";
import {RiotDdragonService} from "../riot-ddragon.service";

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  username?: string;
  subscribedDiscordDM?: boolean = false;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  championCtrl = new FormControl();
  filteredChampions: Observable<string[]> = of();
  preferredChampions: Set<string> = new Set<string>();
  listOfChampions: string[] = [];


  @ViewChild('championInput') championInput: any = '';
  userDetailsForm = new FormGroup({
    preferredChampionsFC: new FormControl([], this.notInListValidator()),
    subscribedDiscordDMFC: new FormControl(true)
  });

  constructor(private clashBotService: ClashBotService, private riotDdragonService: RiotDdragonService) {
  }

  notInListValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const contained = !this.listOfChampions.includes(control.value);
      return contained ? {forbiddenName: {value: control.value}} : null;
    };
  }

  ngOnInit(): void {
    this.clashBotService.getUserDetails().subscribe((data: ClashBotUserDetails) => {
      this.riotDdragonService.getListOfChampions().subscribe((championData) => {
        this.listOfChampions = Object.keys(championData.data);
        console.log(`Starting ('${this.listOfChampions.length}')`);
        this.listOfChampions = this.listOfChampions.filter(record => !data.preferredChampions.has(record));
        console.log(`Ending ('${this.listOfChampions.length}')`);
      })
      this.username = data.username;
      this.subscribedDiscordDM = data.subscriptions.get('UpcomingClashTournamentDiscordDM');
      this.userDetailsForm.patchValue({preferredChampionsFC: [...data.preferredChampions]});
      this.preferredChampions = data.preferredChampions;
      this.filteredChampions = this.championCtrl.valueChanges.pipe(
        startWith(null),
        map((champion: string | null) => champion ? this._filter(champion) : this.listOfChampions.slice()));
    })
    this.userDetailsForm.valueChanges.subscribe((data) => {
      console.log(data);
      console.log(this.userDetailsForm.valid);
    });
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    console.log('Add event');

    // Add our fruit
    if (value && this.userDetailsForm.valid) {
      this.listOfChampions.splice(this.listOfChampions.indexOf(value), 1);
      this.listOfChampions.sort();
      this.preferredChampions.add(value);

      // Clear the input value
      event.chipInput!.clear();

      this.championCtrl.setValue(null);
    } else {
      console.error(this.userDetailsForm.controls.preferredChampionsFC.hasError('forbiddenName'));
      console.error(`Not a valid name ('${value}')`);
    }
  }

  remove(champion: string): void {
    this.listOfChampions.push(champion);
    this.listOfChampions.sort();
    this.preferredChampions.delete(champion);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.listOfChampions.splice(this.listOfChampions.indexOf(event.option.viewValue), 1);
    this.listOfChampions.sort();
    this.preferredChampions.add(event.option.viewValue);
    this.championInput.nativeElement.value = '';
    this.championCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.listOfChampions.filter(champion => champion.toLowerCase().includes(filterValue));
  }

  onSubmit() {
    console.warn(this.userDetailsForm.value);
  }
}
