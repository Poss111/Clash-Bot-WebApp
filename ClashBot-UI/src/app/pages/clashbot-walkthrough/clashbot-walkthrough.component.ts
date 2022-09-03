import {Component} from "@angular/core";
import {TeamUiWrapper} from "../../interfaces/team-ui-wrapper";
import {Tournament} from "clash-bot-service-api/model/tournament";
import {TentativeRecord} from "../../interfaces/tentative-record";
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {Router} from "@angular/router";

@Component({
  selector: "app-clashbot-walkthrough",
  templateUrl: "./clashbot-walkthrough.component.html",
  styleUrls: ["./clashbot-walkthrough.component.scss"]
})
export class ClashbotWalkthroughComponent {
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
  // form = this.fb.group({
  //   serveri: this.fb.group({
  //     servers: this.fb.array([
  //       this.fb.group({
  //         server: ["", [Validators.required]],
  //       })
  //     ]),
  //     defaultServer: this.fb.group({
  //       server: ["", [Validators.required]],
  //     }),
  //   }),
  // })
  servers: string[] = [];
  serverNameToIdMap: Map<string, string> = new Map();

  // get serverFormControls(): FormArray {
  //   return this.form.get("serveri")?.get("servers") as FormArray
  // }
  //
  // get defaultServerFormControls(): FormArray {
  //   return this.form.get("serveri")?.get("defaultServer") as FormArray
  // }

  constructor(private fb: FormBuilder,
              private appDetails: ApplicationDetailsService,
              private router: Router) {
    const details = appDetails.getApplicationDetails().value;
    details.userGuilds?.forEach(item => {
      this.servers.push(item.name);
      this.serverNameToIdMap.set(item.name, item.id);
    });
  }

  // addServer() {
  //   let serverForm = this.form.value.serveri.servers;
  //   let serverFC = this.serverFormControls;
  //
  //   this.servers.splice(
  //       this.servers.indexOf(
  //           serverForm[serverForm.length-1].server), 1);
  //
  //   if (serverForm.length < 5) {
  //     const server = this.fb.group({
  //       server: ["", [Validators.required]],
  //     })
  //     serverFC.push(server);
  //   }
  // }

  submit() {
    // const serverIds: string[] = [];
    // console.dir(this.form.value);
    // this.form.value.serveri.servers.forEach((server: any) => {
    //   serverIds.push(this.serverNameToIdMap.get(server.server) ?? "");
    // });
  }

  navigate(route: string) {

  }
}
