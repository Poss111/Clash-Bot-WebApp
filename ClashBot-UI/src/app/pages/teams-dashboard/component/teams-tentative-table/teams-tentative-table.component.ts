import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from "@angular/core";
import {MatTable} from "@angular/material/table";
import {ConfirmationDialogComponent} from "../../../../dialogs/confirmation-dialog/confirmation-dialog.component";
import {take} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";
import {TentativeRecord} from "../../../../interfaces/tentative-record";

@Component({
    selector: "app-teams-tentative-table",
    templateUrl: "./teams-tentative-table.component.html",
    styleUrls: ["./teams-tentative-table.component.scss"]
})
export class TeamsTentativeTableComponent implements OnChanges {

    showTentative: boolean = false;

    @Input()
    tentativeList?: TentativeRecord[] = [];

    @Input()
    tentativeDataStatus: string = "NOT_LOADED";

    @Output()
    register: EventEmitter<TentativeRecord> = new EventEmitter<TentativeRecord>();

    @ViewChild(MatTable) table?: MatTable<TentativeRecord>;

    constructor(private dialog: MatDialog) {}

    tentativeRegister(element: TentativeRecord, index: number) {
        let actionMessage = "added to";
        element.toBeAdded = true;
        if (element.isMember) {
            actionMessage = "removed from";
            element.toBeAdded = false;
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

    ngOnChanges(changes: SimpleChanges): void {
        this.table?.renderRows();
    }

}
