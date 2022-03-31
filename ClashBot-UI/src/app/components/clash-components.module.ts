import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TeamCardComponent} from "./team-card/team-card.component";
import {MatCardModule} from "@angular/material/card";
import {TeamCardPlayerDetailsComponent} from "./team-card/team-card-player-details/team-card-player-details.component";
import {SharedModule} from "./shared/shared.module";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";


@NgModule({
    declarations: [
        TeamCardComponent,
        TeamCardPlayerDetailsComponent
    ],
    exports: [
        TeamCardComponent
    ],
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        SharedModule
    ]
})
export class ClashComponentsModule {
}
