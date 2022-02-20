import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {MatChipsModule} from "@angular/material/chips";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDialogModule} from "@angular/material/dialog";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {MatTableModule} from "@angular/material/table";
import {ComponentTestingComponent} from "./component-testing.component";
import {ComponentTestingRoutingModule} from "./component-testing-routing.module";
import {TeamsModule} from "../teams-dashboard/teams-module/teams.module";
import {SharedModule} from "../../shared/shared.module";
import {OverlayModule} from "@angular/cdk/overlay";
import {MatBadgeModule} from "@angular/material/badge";

@NgModule({
  declarations: [ComponentTestingComponent],
  exports: [
    ComponentTestingComponent
  ],
  imports: [
    CommonModule,
    ComponentTestingRoutingModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatOptionModule,
    MatSelectModule,
    MatTableModule,
    TeamsModule,
    SharedModule
  ]
})
export class ComponentTestingModule {
}
