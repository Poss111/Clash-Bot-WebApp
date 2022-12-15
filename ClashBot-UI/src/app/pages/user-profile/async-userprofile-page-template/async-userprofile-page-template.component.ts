import {Component, Input, OnInit} from "@angular/core";
import {ApplicationDetails} from "../../../interfaces/application-details";
import {LoginStatus} from "../../../login-status";

@Component({
  selector: "app-async-userprofile-page-template",
  templateUrl: "./async-userprofile-page-template.component.html",
  styleUrls: ["./async-userprofile-page-template.component.scss"]
})
export class AsyncUserprofilePageTemplateComponent implements OnInit {

  @Input()
  applicationDetails: ApplicationDetails = {loggedIn: false, loginStatus: LoginStatus.NOT_LOGGED_IN};

  @Input()
  leagueChampionsList: string[] = [];

  constructor() { }

  ngOnInit(): void {
  }

}
