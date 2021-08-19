export interface ClashBotUserDetails {
  username: string,
  id: string,
  preferredChampions: Set<string>,
  subscriptions: Map<string, boolean>
}
