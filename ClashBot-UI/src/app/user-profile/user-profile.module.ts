import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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



@NgModule({
  declarations: [ UserProfileComponent ],
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
    MatAutocompleteModule
  ]
})
export class UserProfileModule { }
