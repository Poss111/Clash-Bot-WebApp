import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {UserProfileComponent} from "./user-profile.component";
import {UserProfileRoutingModule} from "./user-profile-routing.module";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatIconModule} from "@angular/material/icon";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatListModule} from "@angular/material/list";
import {MatChipsModule} from "@angular/material/chips";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatOptionModule} from "@angular/material/core";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatRadioModule} from "@angular/material/radio";
import {MatSliderModule} from "@angular/material/slider";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatButtonModule} from "@angular/material/button";
import {MatSelectModule} from "@angular/material/select";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {SharedModule} from "../../shared/shared.module";
import { AsyncUserprofilePageComponent } from "./async-userprofile-page/async-userprofile-page.component";
import { AsyncUserprofilePageTemplateComponent } from './async-userprofile-page-template/async-userprofile-page-template.component';
import { UserDetailsInputComponent } from './inputs/user-details-input/user-details-input.component';
import { ChampionListInputComponent } from './inputs/champion-list-input/champion-list-input.component';

@NgModule({
    declarations: [UserProfileComponent, AsyncUserprofilePageComponent, AsyncUserprofilePageTemplateComponent, UserDetailsInputComponent, ChampionListInputComponent],
    imports: [
        CommonModule,
        UserProfileRoutingModule,
        MatExpansionModule,
        MatIconModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatListModule,
        MatChipsModule,
        FormsModule,
        ReactiveFormsModule,
        MatOptionModule,
        MatAutocompleteModule,
        MatRadioModule,
        MatSliderModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatSelectModule,
        MatProgressBarModule,
        SharedModule
    ],
})
export class UserProfileModule { }
