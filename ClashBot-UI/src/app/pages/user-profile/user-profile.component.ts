import {Component, OnInit, ViewChild} from "@angular/core";
import {Observable, of, throwError, EMPTY, forkJoin} from "rxjs";
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn} from "@angular/forms";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {catchError, finalize, map, mergeMap, startWith, take, timeout} from "rxjs/operators";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {RiotDdragonService} from "../../services/riot-ddragon.service";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {UserDetails} from "../../interfaces/user-details";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {PageLoadingService} from "../../services/page-loading.service";
import {UserService} from "clash-bot-service-api";

@Component({
    selector: "app-user-profile",
    templateUrl: "./user-profile.component.html",
    styleUrls: ["./user-profile.component.scss"]
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
    defaultGuild: string = "";
    userDetails?: UserDetails;
    guilds: DiscordGuild[] = [];

    @ViewChild("championInput") championInput: any = "";
    userDetailsForm?: FormGroup;

    constructor(private riotDdragonService: RiotDdragonService,
                private applicationDetailsService: ApplicationDetailsService,
                private matSnackBar: MatSnackBar,
                private pageLoadingService: PageLoadingService,
                private userService: UserService) {
    }

    notInListValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const contained = !this.listOfChampions.includes(control.value);
            return contained ? {forbiddenName: {value: control.value}} : null;
        };
    }

    ngOnInit(): void {
        this.applicationDetailsService.getApplicationDetails()
            .pipe(
                take(1),
                mergeMap(details => details.userDetails ?
                    this.userService.getUser(`${details.userDetails.id}`)
                        .pipe(
                            take(1),
                            timeout(4000),
                            catchError((err) => {
                                console.error(err);
                                this.matSnackBar.open("Oops! Failed to retrieve your User Information. Please try again later.",
                                    "X",
                                    {duration: 5000});
                                return throwError(err);
                            }),
                            map(clashBotUserDetails => {
                                return {
                                    clashBotUserDetails: clashBotUserDetails,
                                    appDetails: details
                                }
                            }))
                    : EMPTY),
                mergeMap(details =>
                    this.riotDdragonService.getListOfChampions()
                        .pipe(take(1),
                            timeout(7000),
                            catchError((err) => {
                                this.matSnackBar.open("Oops! Failed to retrieve League Champion names. Please try again later.",
                                    "X",
                                    {duration: 5000});
                                return throwError(err);
                            }),
                            map(championList => {
                                return {
                                    clashBotUserDetails: details.clashBotUserDetails,
                                    appDetails: details.appDetails,
                                    championList: championList
                                }
                            }))),
                finalize(() => setTimeout(() => this.pageLoadingService.updateSubject(false), 300))
            )
            .subscribe((userProfileDetails) => {
                let defaultGuild = "";
                if (userProfileDetails.appDetails.userGuilds) {
                    defaultGuild = userProfileDetails.appDetails.userGuilds[0].name;
                    userProfileDetails.appDetails.userGuilds.forEach(guild => this.guilds.push(guild));
                }
                if (!userProfileDetails.appDetails.loggedIn) {
                    this.matSnackBar.open(
                        "Oops! You are not logged in. Please navigate back to the home screen and log in.",
                        "X",
                        {duration: 5000})
                } else if (userProfileDetails.clashBotUserDetails) {
                    this.userDetails = userProfileDetails.appDetails.userDetails;
                    if (!userProfileDetails.clashBotUserDetails || !userProfileDetails.clashBotUserDetails.id) {
                        userProfileDetails.clashBotUserDetails.serverName = defaultGuild;
                        userProfileDetails.clashBotUserDetails.champions = [];
                        userProfileDetails.clashBotUserDetails.subscriptions = [{
                            key: "UpcomingClashTournamentDiscordDM",
                            isOn: false
                        }];
                    }
                    this.defaultGuild = userProfileDetails.clashBotUserDetails.serverName === undefined ? "" : userProfileDetails.clashBotUserDetails.serverName;
                    let preferredChampions = Array.isArray(userProfileDetails.clashBotUserDetails.champions) ? userProfileDetails.clashBotUserDetails.champions : [];
                    this.listOfChampions = Object.keys(userProfileDetails.championList.data);
                    this.listOfChampions = this.listOfChampions.filter(record => !preferredChampions.includes(record));
                    this.initialAutoCompleteArray = JSON.parse(JSON.stringify(this.listOfChampions));
                    this.userDetailsForm = new FormGroup({
                        preferredChampionsFC: new FormControl([...preferredChampions]),
                        subscribedDiscordDMFC: new FormControl(userProfileDetails.clashBotUserDetails.subscriptions === undefined
                            ? false : userProfileDetails.clashBotUserDetails.subscriptions[0].isOn),
                        defaultGuildFC: new FormControl(this.defaultGuild)
                    });
                    this.preferredChampions = new Set<string>(userProfileDetails.clashBotUserDetails.champions);
                    this.initialFormControlState = JSON.parse(JSON.stringify(this.userDetailsForm.value));
                    this.championsAutofillArray = this.championAutoCompleteCtrl.valueChanges.pipe(
                        startWith(null),
                        map((champion: string | null) => champion ? this._filter(champion) : this.listOfChampions.slice()));
                }
            });
    }

    private syncChampionsList(value: string) {
        if (this.listOfChampions.indexOf(value) > -1 && this.preferredChampions.size < 5) {
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
        this.championInput.nativeElement.value = "";
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
            this.userDetailsForm.markAsPending();

            const updateCallsToMake = [];
            if (this.userDetailsForm.value
                .defaultGuildFC !== this.initialFormControlState
                .defaultGuildFC) {
                updateCallsToMake.push(this.userService.updateUser({
                    id: `${this.userDetails.id}`,
                    name: this.userDetails.username,
                    serverName: this.userDetailsForm.value.defaultGuildFC,
                }).pipe(timeout(4000),
                    catchError((err) => throwError(err))));
            } if (!this.compareArray(this.userDetailsForm.value
                .preferredChampionsFC, this.initialFormControlState
                .preferredChampionsFC)) {
                updateCallsToMake.push(this.userService.createNewListOfPreferredChampions(
                    `${this.userDetails.id}`,
                    {
                        champions: Array.from(new Set<string>(this.userDetailsForm.value.preferredChampionsFC))
                    },
                ).pipe(timeout(4000),
                    catchError((err) => throwError(err))));
            } if (this.userDetailsForm.value
                .subscribedDiscordDMFC !== this.initialFormControlState
                .subscribedDiscordDMFC) {
                if (this.userDetailsForm.value
                    .subscribedDiscordDMFC) {
                    updateCallsToMake.push(this.userService.subscribeUser(`${this.userDetails.id}`)
                        .pipe(timeout(4000),
                            catchError((err) => throwError(err))));
                } else {
                    updateCallsToMake.push(this.userService.unsubscribeUser(`${this.userDetails.id}`)
                        .pipe(timeout(4000),
                            catchError((err) => throwError(err))));
                }
            }

            forkJoin(updateCallsToMake)
                .subscribe(() => {
                    this.initialFormControlState = JSON.parse(JSON.stringify(this.userDetailsForm?.value));
                    this.userDetailsForm?.markAsPristine();
                    this.applicationDetailsService.getApplicationDetails()
                        .pipe(take(1))
                        .subscribe((appDetails) => {
                            appDetails.defaultGuild = this.userDetailsForm?.value.defaultGuildFC;
                            this.applicationDetailsService.setApplicationDetails(appDetails);
                        })
                }, (err) => {
                    console.error(err);
                    this.matSnackBar.open("Oops! Failed to persist your requested update. Please try again.", "X", {duration: 5000});
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
