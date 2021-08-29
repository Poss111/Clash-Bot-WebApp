export interface ClashBotUserDetails {
  id: string,
  username: string,
  serverName: string,
  preferredChampions: string[],
  subscriptions: {[key: string]: boolean}
}
