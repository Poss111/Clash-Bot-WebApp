import {Component, OnInit} from "@angular/core";
import {TeamUiWrapper} from "../../interfaces/team-ui-wrapper";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {TentativeRecord} from "../../interfaces/tentative-record";
import {FormArray, FormBuilder, Validators} from "@angular/forms";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {Router} from "@angular/router";
import {UserService} from "clash-bot-service-api";
import {UpdateUserRequest} from "clash-bot-service-api/model/updateUserRequest";
import {MatSnackBar} from "@angular/material/snack-bar";
import {PageLoadingService} from "../../services/page-loading.service";
import {take} from "rxjs/operators";
import {DiscordGuild} from "../../interfaces/discord-guild";

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
  form = this.fb.group({
    serveri: this.fb.group({
      servers: this.fb.array([
        this.fb.group({
          server: ["", [Validators.required]],
        })
      ]),
      defaultServer: this.fb.group({
        server: ["", [Validators.required]],
      }),
    }),
  })
  servers: string[] = [];
  serverNameToIdMap: Map<string, string> = new Map();
  serverIds: Map<string, DiscordGuild> = new Map();

  get serverFormControls(): FormArray {
    return this.form.get("serveri")?.get("servers") as FormArray
  }

  get defaultServerFormControls(): FormArray {
    return this.form.get("serveri")?.get("defaultServer") as FormArray
  }

  constructor(private fb: FormBuilder,
              private appDetails: ApplicationDetailsService,
              private router: Router,
              private userService: UserService,
              private pageLoadingService: PageLoadingService,
              private _snackBar: MatSnackBar) {
    const details = appDetails.getApplicationDetails().value;
    details.userGuilds?.forEach(item => {
      this.servers.push(item.name);
      this.serverNameToIdMap.set(item.name, item.id);
    });
  }

  ngOnInit() {
    this.pageLoadingService.updateSubject(false);
  }

  addServer() {
    let serverForm = this.form.value.serveri.servers;
    let serverFC = this.serverFormControls;

    this.servers.splice(
        this.servers.indexOf(
            serverForm[serverForm.length-1].server), 1);

    if (serverForm.length < 5) {
      const server = this.fb.group({
        server: ["", [Validators.required]],
      });
      serverFC.push(server);
    }
  }

  submit() {
    const app = this.appDetails.getApplicationDetails().value;
    const listOfIds: string[] = [];
    this.serverFormControls.controls.forEach((formGroup: any) => {
      listOfIds.push(this.serverNameToIdMap.get(formGroup.value.server) ?? "");
    });
    if (app.userGuilds) {
      this.serverIds = new Map([...app.userGuilds]
        .filter((key) => listOfIds.includes(key[0])));
    }
  }

  finishWalkthrough() {
    console.dir(this.serverIds);
    const app = this.appDetails.getApplicationDetails().value;
    const payload: UpdateUserRequest = {
      id: app.clashBotUserDetails?.id ?? "",
      selectedServers: [...this.serverIds.keys()],
    }
    this.userService.updateUser(payload)
      .pipe(take(1))
      .subscribe(() => {
          this.pageLoadingService.updateSubject(true);
          this.userService.getUser(`${app.userDetails?.id}`)
            .pipe(take(1))
            .subscribe((response) => {
              this.appDetails.setApplicationDetails({
                ...app,
                selectedGuilds: this.serverIds,
                clashBotUserDetails: response
              });
            });
          this.router.navigateByUrl("/teams")
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
        },
        () => {
          this._snackBar.open(
            "Failed to save your preferences. Please try again.",
            "X",
            {duration: 5 * 1000});
        });
  }
}
