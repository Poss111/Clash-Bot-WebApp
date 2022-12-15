import {Component, Input, OnInit} from "@angular/core";
import {DiscordGuild} from "../../../../interfaces/discord-guild";

@Component({
  selector: "app-user-details-input",
  templateUrl: "./user-details-input.component.html",
  styleUrls: ["./user-details-input.component.scss"]
})
export class UserDetailsInputComponent implements OnInit {

  @Input()
  defaultGuild: string = "";

  @Input()
  selectedGuilds: Map<string, DiscordGuild> = new Map<string, DiscordGuild>();

  constructor() { }

  ngOnInit(): void {
  }

}
