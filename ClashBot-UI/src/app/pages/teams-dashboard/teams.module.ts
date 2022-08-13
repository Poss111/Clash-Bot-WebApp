import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {TeamsRoutingModule} from "./teams-routing.module";
import {TeamsDashboardComponent} from "./teams-dashboard/teams-dashboard.component";
import {MatChipsModule} from "@angular/material/chips";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {TeamCardComponent} from "./component/team-card/team-card.component";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDialogModule} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../../dialogs/confirmation-dialog/confirmation-dialog.component";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {TeamsDashboardHelpDialogComponent} from "./component/teams-dashboard-help-dialog/teams-dashboard-help-dialog.component";
import {MatTableModule} from "@angular/material/table";
import {TeamCardPlayerDetailsComponent} from "./component/team-card/team-card-player-details/team-card-player-details.component";
import {SharedModule} from "../../shared/shared.module";
import {MatExpansionModule} from "@angular/material/expansion";
import {HelpDialogComponent} from "./component/help-dialog/help-dialog.component";
import {GuildFilterListComponent} from "./component/guild-filter-list/guild-filter-list.component";
import {TeamsTentativeTableComponent} from "./component/teams-tentative-table/teams-tentative-table.component";
import {NewTeamCardComponent} from "./component/new-team-card/new-team-card.component";
import {TeamsDashboardViewComponent} from "./teams-dashboard/view/teams-dashboard-view.component";
import {MatProgressBarModule} from "@angular/material/progress-bar";


@NgModule({
    declarations: [
        TeamsDashboardComponent,
        TeamCardComponent,
        ConfirmationDialogComponent,
        HelpDialogComponent,
        TeamsDashboardHelpDialogComponent,
        TeamCardPlayerDetailsComponent,
        GuildFilterListComponent,
        TeamsTentativeTableComponent,
        NewTeamCardComponent,
        TeamsDashboardViewComponent
    ],
    exports: [
        TeamCardComponent
    ],
    imports: [
        CommonModule,
        TeamsRoutingModule,
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
        MatExpansionModule,
        SharedModule,
        MatProgressBarModule
    ]
})
export class TeamsModule {
}
