import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable, of} from "rxjs";
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn} from "@angular/forms";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {map, startWith, take} from "rxjs/operators";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {ClashBotService} from "../clash-bot.service";
import {ClashBotUserDetails} from "../clash-bot-user-details";
import {RiotDdragonService} from "../riot-ddragon.service";
import {UserDetailsService} from "../user-details.service";

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

    username?: string;
    selectable = true;
    removable = true;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    championAutoCompleteCtrl = new FormControl();
    filteredChampions: Observable<string[]> = of();
    preferredChampions: Set<string> = new Set<string>();
    listOfChampions: string[] = [];
    initialFormControlState: any = {};
    initialAutoCompleteArray: string[] = [];

    @ViewChild('championInput') championInput: any = '';
    userDetailsForm?: FormGroup;

    constructor(private clashBotService: ClashBotService, private userDetailsService: UserDetailsService, private riotDdragonService: RiotDdragonService) {
    }

    notInListValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const contained = !this.listOfChampions.includes(control.value);
            return contained ? {forbiddenName: {value: control.value}} : null;
        };
    }

    ngOnInit(): void {
        this.userDetailsService.getUserDetails().pipe(take(1)).subscribe((userDetails) => {
            this.clashBotService.getUserDetails(userDetails.id).pipe(take(1)).subscribe((data: ClashBotUserDetails) => {
                this.riotDdragonService.getListOfChampions().pipe(take(1)).subscribe((championData) => {
                    this.listOfChampions = Object.keys(championData.data);
                    this.listOfChampions = this.listOfChampions.filter(record => !data.preferredChampions.has(record));
                    this.initialAutoCompleteArray = JSON.parse(JSON.stringify(this.listOfChampions));
                })
                // this.username = data.username;
                this.userDetailsForm = new FormGroup({
                    preferredChampionsFC: new FormControl([...data.preferredChampions]),
                    subscribedDiscordDMFC: new FormControl(data.subscriptions.UpcomingClashTournamentDiscordDM)
                });
                this.preferredChampions = new Set<string>(data.preferredChampions);
                this.initialFormControlState = JSON.parse(JSON.stringify(this.userDetailsForm.value));
                this.filteredChampions = this.championAutoCompleteCtrl.valueChanges.pipe(
                    startWith(null),
                    map((champion: string | null) => champion ? this._filter(champion) : this.listOfChampions.slice()));
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
        console.log(`${JSON.stringify(this.initialFormControlState)}`);
        this.userDetailsForm?.reset(this.initialFormControlState);
        this.preferredChampions = new Set<string>(this.initialFormControlState.preferredChampionsFC);
        this.listOfChampions = JSON.parse(JSON.stringify(this.initialAutoCompleteArray));
    }

    onSubmit() {
        console.log(`SUBMIT ${JSON.stringify(this.initialFormControlState)}`);
        console.log(this.userDetailsForm?.value);
        this.initialFormControlState = JSON.parse(JSON.stringify(this.userDetailsForm?.value));
        this.userDetailsForm?.markAsPristine();
        console.log(this.userDetailsForm?.pristine);
        console.log(`AFTER SUBMIT ${JSON.stringify(this.initialFormControlState)}`);
    }

    sliderUpdate() {
        this.checkFormState();
    }

    compareArray(arr1: any[], arr2: any[]): boolean {
        if (arr1.length === arr2.length) {
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
