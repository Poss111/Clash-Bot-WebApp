import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TeamsRoutingModule} from "./teams-routing.module";
import {TeamsDashboardComponent} from "../teams-dashboard/teams-dashboard.component";
import {MatChipsModule} from "@angular/material/chips";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {TeamCardComponent} from "../team-card/team-card.component";
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDialogModule} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../../../dialogs/confirmation-dialog/confirmation-dialog.component";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {TeamsDashboardHelpDialogComponent} from "../teams-dashboard-help-dialog/teams-dashboard-help-dialog.component";
import {MatTableModule} from "@angular/material/table";
import {TournamentNameTransformerPipe} from "../../../tournament-name-transformer.pipe";
import {TeamCardPlayerDetailsComponent} from "../team-card/team-card-player-details/team-card-player-details.component";
import {SharedModule} from "../../../shared/shared.module";
import { MatExpansionModule } from '@angular/material/expansion';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {HelpDialogComponent} from "../help-dialog/help-dialog.component";


@NgModule({
    declarations: [TeamsDashboardComponent, TeamCardComponent, ConfirmationDialogComponent,
        HelpDialogComponent, TeamsDashboardHelpDialogComponent, TournamentNameTransformerPipe, TeamCardPlayerDetailsComponent],
    exports: [
        TeamCardComponent,
        TournamentNameTransformerPipe
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
        BrowserAnimationsModule,
        SharedModule
    ]
})
export class TeamsModule {
}
