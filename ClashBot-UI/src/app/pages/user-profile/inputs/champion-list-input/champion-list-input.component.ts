import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from "@angular/core";
import {FormControl} from "@angular/forms";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {Observable, of} from "rxjs";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {map, startWith} from "rxjs/operators";

@Component({
  selector: "app-champion-list-input",
  templateUrl: "./champion-list-input.component.html",
  styleUrls: ["./champion-list-input.component.scss"]
})
export class ChampionListInputComponent implements OnInit {

  @Input()
  selectedChampions: string[] = [];

  @Input()
  listOfChampions: string[] = [];

  @Output()
  removeEvent: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  addEvent: EventEmitter<string> = new EventEmitter<string>();

  championAutoCompleteCtrl = new FormControl();
  separatorKeysCodes: number[] = [ENTER, COMMA];
  removable = true;
  selectable = true;
  championsAutofillArray: Observable<string[]> = of();

  @ViewChild("championInput") championInput: any = "";

  constructor() { }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.listOfChampions.filter(champion => champion.toLowerCase().includes(filterValue));
  }

  private syncChampionsList(value: string) {
    if (this.listOfChampions.indexOf(value) > -1 && this.selectedChampions.length < 5) {
      this.listOfChampions.splice(this.listOfChampions.indexOf(value), 1);
      this.listOfChampions.sort();
      this.selectedChampions.push(value);
      this.addEvent.emit(value);
    } else if (this.selectedChampions.indexOf(value) >= 0){
      this.selectedChampions.splice(this.selectedChampions.indexOf(value), 1);
      this.listOfChampions.push(value);
      this.listOfChampions.sort();
      this.removeEvent.emit(value);
    }
    this.championAutoCompleteCtrl.setValue(null);
  }

  ngOnInit(): void {
    this.championsAutofillArray = this.championAutoCompleteCtrl.valueChanges.pipe(
        startWith(null),
        map((champion: string | null) => champion ? this._filter(champion) : this.listOfChampions.slice()));
  }

  remove(champion: string): void {
    this.syncChampionsList(champion);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.syncChampionsList(event.option.viewValue);
    this.championInput.nativeElement.value = "";
  }
}
