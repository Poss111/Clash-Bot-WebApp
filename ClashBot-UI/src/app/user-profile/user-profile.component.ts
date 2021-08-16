import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Observable, of} from "rxjs";
import {FormControl} from "@angular/forms";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {map, startWith} from "rxjs/operators";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  championCtrl = new FormControl();
  filteredChampions: Observable<string[]> = of();
  preferredChampions: string[] = ['Ashe'];
  listOfChampions: string[] = ['Ashe', 'Aatrox', 'Anivia'];

  @ViewChild('championInput') championInput: any = '';

  constructor() { }

  ngOnInit(): void {
    this.filteredChampions = this.championCtrl.valueChanges.pipe(
      startWith(null),
      map((champion: string | null) => champion ? this._filter(champion) : this.listOfChampions.slice()));
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our fruit
    if (value) {
      this.preferredChampions.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();

    this.championCtrl.setValue(null);
  }

  remove(champion: string): void {
    const index = this.preferredChampions.indexOf(champion);

    if (index >= 0) {
      this.preferredChampions.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.preferredChampions.push(event.option.viewValue);
    this.championInput.nativeElement.value = '';
    this.championCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.listOfChampions.filter(champion => champion.toLowerCase().includes(filterValue));
  }
}
