import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ClashBotTentativeDetails} from "../../../interfaces/clash-bot-tentative-details";
import {MatTable} from "@angular/material/table";
import {ConfirmationDialogComponent} from "../../../dialogs/confirmation-dialog/confirmation-dialog.component";
import {take} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";

@Component({
    selector: 'app-teams-tentative-table',
    templateUrl: './teams-tentative-table.component.html',
    styleUrls: ['./teams-tentative-table.component.scss']
})
export class TeamsTentativeTableComponent {

    tentativeDataStatus: string = 'NOT_LOADED';

    showTentative: boolean = false;

    @Input()
    tentativeList?: ClashBotTentativeDetails[] = [];

    @Output()
    register: EventEmitter<ClashBotTentativeDetails> = new EventEmitter<ClashBotTentativeDetails>();

    @ViewChild(MatTable) table?: MatTable<ClashBotTentativeDetails>;

    constructor(private dialog: MatDialog) {
    }

    tentativeRegister(element: ClashBotTentativeDetails, index: number) {
        let actionMessage = 'added to';
        if (element.isMember) {
            actionMessage = 'removed from';
        }
        let dialogRef = this.dialog.open(ConfirmationDialogComponent,
            {
                data: {
                    message: `Are you sure you want to be ${actionMessage} the Tentative list for this tournament?`
                }
            });
        dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
            if (result) {
                element.index = index;
                this.register.emit(element)
            }
        });
    }

}