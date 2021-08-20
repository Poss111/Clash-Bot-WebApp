export interface ClashBotUserDetails {
  id: string,
  preferredChampions: Set<string>,
  subscriptions: {[key: string]: boolean}
}
