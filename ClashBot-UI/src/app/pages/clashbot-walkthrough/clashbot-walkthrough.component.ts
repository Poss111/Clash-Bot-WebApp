import {Component, OnInit} from "@angular/core";
import {TeamUiWrapper} from "../../interfaces/team-ui-wrapper";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {TentativeRecord} from "../../interfaces/tentative-record";
import {
  FormBuilder,
  FormGroup,
} from "@angular/forms";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {Router} from "@angular/router";
import {UserService} from "clash-bot-service-api";
import {UpdateUserRequest} from "clash-bot-service-api/model/updateUserRequest";
import {MatSnackBar} from "@angular/material/snack-bar";
import {PageLoadingService} from "../../services/page-loading.service";
import {map, mergeMap, take} from "rxjs/operators";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {FREE_AGENT_GUILD} from "../../interfaces/clash-bot-constants";
import {Observable} from "rxjs";
import {ApplicationDetails} from "../../interfaces/application-details";

@Component({
  selector: "app-clashbot-walkthrough",
  templateUrl: "./clashbot-walkthrough.component.html",
  styleUrls: ["./clashbot-walkthrough.component.scss"]
})
export class ClashbotWalkthroughComponent implements OnInit {
  mockTeam: TeamUiWrapper = {
    name: "abra",
    teamDetails: [
      {
        name: "Roidrage",
        id: "1",
        role: "Top",
        champions: ["Sett"],
        isUser: true
      },
      {
        name: "",
        id: "0",
        role: "Mid",
        isUser: false
      },
      {
        name: "",
        id: "0",
        role: "Jg",
        isUser: false
      },
      {
        name: "",
        id: "0",
        role: "Bot",
        isUser: false
      },
      {
        name: "",
        id: "0",
        role: "Supp",
        isUser: false
      },
    ],
    tournament: {
      tournamentName: "awesome_sauce",
      tournamentDay: "1"
    },
    server: {
      features: [],
      icon: "",
      id: "0",
      name: "Clash Bot",
      owner: false,
      permissions: 0,
      permissions_new: ""
    },
    id: "1"
  };
  eligibleTournaments: Tournament[] = [
    {
      tournamentName: "awesome_sauce",
      tournamentDay: "1",
    },
    {
      tournamentName: "awesome_sauce",
      tournamentDay: "2",
    }
  ];
  tentativeList: TentativeRecord[] = [
    {
      serverId: "0",
      tentativePlayers: [],
      isMember: false,
      tournamentDetails: {
        tournamentName: "awesome_sauce",
        tournamentDay: "1"
      }
    },
    {
      serverId: "0",
      tentativePlayers: [{
        name: "Roidrage"
      }],
      playerNames: ["Roidrage"],
      isMember: true,
      tournamentDetails: {
        tournamentName: "awesome_sauce",
        tournamentDay: "2"
      }
    }];
  data = [];
  $pageLoadingServiceObs: Observable<boolean> = this.pageLoadingService.getSubject().asObservable();
  emittedPreferredServers?: FormGroup;
  emittedDefaultServerGroup?: FormGroup;
  serverNameToIdMap: Map<string, string> = new Map<string, string>();
  $appDetailsObs: Observable<Map<string, DiscordGuild>> = this.appDetails.getApplicationDetails()
      .asObservable()
      .pipe(map(appDetails => {
        if (appDetails && appDetails.userGuilds) {
          return appDetails.userGuilds;
        }
        return new Map<string, DiscordGuild>();
      }));

  constructor(private fb: FormBuilder,
              private appDetails: ApplicationDetailsService,
              private router: Router,
              private userService: UserService,
              private pageLoadingService: PageLoadingService,
              private _snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.pageLoadingService.updateSubject(false);
    const details = this.appDetails.getApplicationDetails().value;
    details.userGuilds?.forEach((value, key) => {
      this.serverNameToIdMap.set(value.name, key);
    })
  }

  finishWalkThrough() {
    const defaultGuildId = this.serverNameToIdMap.get(this.emittedDefaultServerGroup?.value.defaultServer);
    const preferredServerIds: string[] = [];
    preferredServerIds.push(FREE_AGENT_GUILD.id);
    Object.values(this.emittedPreferredServers?.controls ?? {})
        .map(control => control.value)
        .forEach(names => {
          preferredServerIds.push(this.serverNameToIdMap.get(names) ?? "");
        });
    const app = this.appDetails.getApplicationDetails().value;
    const payload: UpdateUserRequest = {
      id: app.clashBotUserDetails?.id ?? "",
      selectedServers: [...preferredServerIds],
      serverId: defaultGuildId
    };
    this.pageLoadingService.updateSubject(true);
    this.userService.updateUser(payload)
      .pipe(
          take(1),
          mergeMap(() => this.userService
              .getUser(`${app.userDetails?.id}`)
              .pipe(
                  take(1),
                  map(response => {
                    const newServerMap = new Map<string, DiscordGuild>();
                    app.userGuilds?.forEach((server, id) => {
                      if (Array.isArray(response.selectedServers)
                          && response.selectedServers.includes(id)) {
                        newServerMap.set(id, server);
                      }
                    });
                    return {
                      ...app,
                      selectedGuilds: newServerMap,
                      clashBotUserDetails: response
                    } as ApplicationDetails;
                  })
              )))
      .subscribe((newAppDetails) => {
          this.appDetails.setApplicationDetails(newAppDetails);
          this.router.navigate(["../teams"])
              .then(() => {
                this.pageLoadingService.updateSubject(false);
                this._snackBar.open(
                    "Welcome to Clash Bot!",
                    "X",
                    {duration: 5 * 1000})
              })
              .catch(() => this._snackBar.open(
                  "Failed to navigate. Try navigating through the Menu.",
                  "X",
                  {duration: 5 * 1000}));
        },() => {
          this._snackBar.open(
            "Failed to save your preferences. Please try again.",
            "X",
            {duration: 5 * 1000});
        }, () => {
            this.pageLoadingService.updateSubject(false);
          });
  }

  onFormGroupChange($event: any) {
    this.emittedPreferredServers = $event.serverFormGroup;
    this.emittedDefaultServerGroup = $event.defaultServerFormGroup;
  }
}
