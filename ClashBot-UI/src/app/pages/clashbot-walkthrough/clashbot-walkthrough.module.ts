import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {ClashbotWalkthroughComponent} from "./clashbot-walkthrough.component";
import {MatStepperModule} from "@angular/material/stepper";
import {ClashbotWalkthroughRoutingModule} from "./clashbot-walkthrough-routing.module";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {TeamsModule} from "../teams-dashboard/teams.module";
import {ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatIconRegisteryModule} from "../teams-dashboard/component/mat-icon-registery.module";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatCardModule} from "@angular/material/card";
import {MatDividerModule} from "@angular/material/divider";



@NgModule({
  declarations: [
      ClashbotWalkthroughComponent
  ],
  imports: [
    CommonModule,
    MatStepperModule,
    ClashbotWalkthroughRoutingModule,
    MatButtonModule,
    MatIconModule,
    TeamsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconRegisteryModule,
    MatExpansionModule,
    MatCardModule,
    MatDividerModule
  ]
})
export class ClashbotWalkthroughModule { }
