import { Component } from '@angular/core';
import {ClashTeam} from "../../interfaces/clash-team";
import {MatDialog} from "@angular/material/dialog";
import {ReleaseNotificationDialogComponent} from "../../dialogs/release-notification-dialog/release-notification-dialog.component";

@Component({
  selector: 'app-component-testing',
  templateUrl: './component-testing.component.html',
  styleUrls: ['./component-testing.component.scss']
})
export class ComponentTestingComponent {

  sampleTeam: ClashTeam = {
    teamName: 'Team Applin',
    playersDetails: [
      {
        name: 'Roidrage',
        id: 1,
        role: 'Top',
        champions: ['Sett', 'Volibear', 'Ornn'],
        isUser: true
      },
      {
        name: 'TheIncentive',
        id: 1,
        role: 'Bot',
        champions: ['Lucian', 'Senna', 'Jhin']
      }
    ],
    tournamentDetails: {
      tournamentName: 'awesome_sauce',
      tournamentDay: '1'
    },
    serverName: 'Goon Squad',
    startTime: new Date().toISOString(),
    id: 'charizard'
  }

  constructor(private dialog: MatDialog) { }

  openReleaseNotification() {
    this.dialog.open(ReleaseNotificationDialogComponent, {autoFocus: false});
  }
}
