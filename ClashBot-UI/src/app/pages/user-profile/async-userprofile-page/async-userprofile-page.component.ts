import {Component, OnInit} from "@angular/core";
import {Observable} from "rxjs";
import {ApplicationDetails} from "../../../interfaces/application-details";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {RiotDdragonService} from "../../../services/riot-ddragon.service";
import {map, mergeMap, take} from "rxjs/operators";
import {Player} from "clash-bot-service-api/model/player";
import {UserService} from "clash-bot-service-api";

@Component({
  selector: "app-async-userprofile-page",
  templateUrl: "./async-userprofile-page.component.html",
  styleUrls: ["./async-userprofile-page.component.scss"]
})
export class AsyncUserprofilePageComponent implements OnInit {

  appDetailsObs$: Observable<ApplicationDetails> = this.applicationDetailsService
      .getApplicationDetails()
      .asObservable();
  listOfChampionNames: string[] = [];
  userDetails: Player = {};

  constructor(private applicationDetailsService: ApplicationDetailsService,
              private riotDdragonService: RiotDdragonService,
              private userService: UserService) { }

  ngOnInit(): void {
    this.applicationDetailsService.getApplicationDetails()
        .pipe(
            take(1),
            mergeMap(applicationDetails => {
              return this.userService.getUser(applicationDetails.clashBotUserDetails?.id ?? "0")
                  .pipe(take(1))
            })
        )
        .subscribe((details) => {
          this.userDetails = details;
        });
    this.riotDdragonService.getListOfChampions()
        .pipe(
            take(1),
            map((payload) => Object.keys(payload.data))
        )
        .subscribe((listOfChamps) => this.listOfChampionNames = listOfChamps);
  }

}
