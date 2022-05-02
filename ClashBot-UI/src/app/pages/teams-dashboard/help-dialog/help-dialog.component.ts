import { Component } from '@angular/core';
import {TeamsDashboardHelpDialogComponent} from "../teams-dashboard-help-dialog/teams-dashboard-help-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss']
})
export class HelpDialogComponent {

  constructor(private dialog: MatDialog) { }

  showHelpDialog() {
    this.dialog.open(TeamsDashboardHelpDialogComponent);
  }
}
