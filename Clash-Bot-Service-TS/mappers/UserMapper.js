const userEntityToResponse = {
  key: 'id',
  playerName: 'name',
  serverName: 'serverName',
  preferredChampions: 'champions',
  subscribed: {
    key: 'subscriptions',
    transform: (value) => {
      if (value) return [{ key: 'UpcomingClashTournamentDiscordDM', isOn: true }];
      return [{ key: 'UpcomingClashTournamentDiscordDM', isOn: false }];
    },
  },
};

const requestToUserEntity = {
  id: 'key',
  name: 'playerName',
  champions: 'preferredChampions',
  subscriptions: {
    key: 'subscribed',
    transform: (value) => {
      if (value) {
        const found = value.find((item) => item.key === 'UpcomingClashTournamentDiscordDM' && item.isOn);
        return `${found !== undefined && found !== null}`;
      }
      return 'false';
    },
  },
  serverName: 'serverName',
};

module.exports = {
  userEntityToResponse,
  requestToUserEntity,
};
