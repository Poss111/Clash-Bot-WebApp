import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl} from "@angular/forms";
import {TeamFilter} from "../../../interfaces/team-filter";
import {MatChip} from "@angular/material/chips";

@Component({
  selector: 'app-guild-filter-list',
  templateUrl: './guild-filter-list.component.html',
  styleUrls: ['./guild-filter-list.component.scss']
})
export class GuildFilterListComponent {

  formControl?: FormControl;

  @Input()
  teamFilters: TeamFilter[] = [];

  @Output()
  selectedTeamEvent: EventEmitter<String> = new EventEmitter<String>();

  constructor() { }

  filterTeam(chip: MatChip) {
    chip.selected ? chip.deselect() : chip.selectViaInteraction();
    if (this.formControl) {
      this.selectedTeamEvent.emit(this.formControl.value.trimLeft());
    }
  }
}
