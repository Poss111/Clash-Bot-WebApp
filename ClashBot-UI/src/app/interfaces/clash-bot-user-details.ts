export interface ClashBotUserDetails {
  id: number,
  username: string,
  serverName: string,
  preferredChampions: string[],
  subscriptions: {[key: string]: boolean}
}
