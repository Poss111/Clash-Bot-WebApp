import {FilterType} from "./filter-type";
import {DiscordGuild} from "./discord-guild";

export interface TeamFilter {
  value: DiscordGuild,
  type: FilterType
  state: boolean,
  id: string,
  numberOfTeams: number
}
