import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl} from "@angular/forms";
import {TeamFilter} from "../../../interfaces/team-filter";
import {MatChip} from "@angular/material/chips";

@Component({
  selector: 'app-guild-filter-list',
  templateUrl: './guild-filter-list.component.html',
  styleUrls: ['./guild-filter-list.component.scss']
})
export class GuildFilterListComponent implements OnInit {

  formControl: FormControl = new FormControl([]);

  @Input()
  teamFilters: TeamFilter[] = [];

  @Input()
  defaultSelection?: string;

  @Output()
  selectedTeamEvent: EventEmitter<string> = new EventEmitter<string>();

  constructor() {}

  ngOnInit() {
    if (this.defaultSelection) {
      this.formControl.setValue(this.defaultSelection);
    }
  }

  filterTeam(chip: MatChip) {
    chip.selected ? chip.deselect() : chip.selectViaInteraction();
    if (this.formControl) {
      this.selectedTeamEvent.emit(this.formControl.value.trimLeft());
    }
  }
}
