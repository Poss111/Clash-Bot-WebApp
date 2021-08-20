export interface ClashBotUserDetails {
  id: string,
  serverName: string,
  preferredChampions: string[],
  subscriptions: {[key: string]: boolean}
}
