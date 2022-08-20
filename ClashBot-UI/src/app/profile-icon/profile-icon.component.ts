import {Component, EventEmitter, Input, Output} from "@angular/core";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../dialogs/confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: "app-profile-icon",
  templateUrl: "./profile-icon.component.html",
  styleUrls: ["./profile-icon.component.scss"]
})
export class ProfileIconComponent{

  @Input()
  username: string = "";

  @Input()
  loggedIn: boolean = true;

  @Input()
  isDarkModeOn: boolean = false;

  @Output()
  goToSettingsEvent: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  logOutEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  toggleDarkModeEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private matDialog: MatDialog) { }

  goToSettings(routing: string) {
    this.goToSettingsEvent.emit(routing);
  }

  logOut() {
    let dialogRef = this.matDialog.open(ConfirmationDialogComponent,
        {data: {message: "Are you sure you want to log out?"}})
    dialogRef.afterClosed()
        .subscribe((logOutUser) => {
          if (logOutUser) {
            this.logOutEvent.emit(true);
          }
        });
  }

  toggleDarkMode() {
    this.toggleDarkModeEvent.emit(this.isDarkModeOn);
  }

}
