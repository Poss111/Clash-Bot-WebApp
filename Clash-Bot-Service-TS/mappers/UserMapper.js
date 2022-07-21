const userEntityToResponse = {
  key: 'id',
  playerName: 'name',
  serverName: 'serverName',
  preferredChampions: {
    key: 'champions',
    transform: (value) => {
      if (!value) return [];
      return value;
    },
  },
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
        return `${found !== undefined || found !== null}`;
      }
      return 'false';
    },
  },
  serverName: 'serverName',
};

const requestToNewUserEntity = {
  id: 'key',
  name: 'playerName',
  serverName: 'serverName',
};

module.exports = {
  userEntityToResponse,
  requestToUserEntity,
  requestToNewUserEntity,
};
