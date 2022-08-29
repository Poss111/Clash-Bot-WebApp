const teamEntityToResponse = {
  teamName: 'name',
  serverId: 'serverId',
  tournamentName: 'tournament.tournamentName',
  tournamentDay: 'tournament.tournamentDay',
  playersWRoles: {
    key: 'playerDetails',
    transform: (value) => {
      return Object.entries(value)
        .reduce((ret, entry) => {
          ret[entry[0]] = { id: entry[1] };
          return ret;
        }, {});
    },
  },
};

const teamEntityDeletionToResponse = {
  teamName: 'name',
  serverId: 'serverId',
};

const userEntityToResponse = {
  key: 'id',
  playerName: 'name',
  preferredChampions: 'champions',
};

module.exports = {
  teamEntityToResponse,
  userEntityToResponse,
  teamEntityDeletionToResponse,
};
