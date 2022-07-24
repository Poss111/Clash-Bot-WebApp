const tentativeDetailsEntityToRequest = {
  serverName: 'serverName',
  tournamentDetails: {
    key: 'tournamentDetails',
    transform: (tournament) => ({
      tournamentName: tournament.tournamentName,
      tournamentDay: tournament.tournamentDay,
    }),
  },
};

const userEntityToTentativeResponse = {
  key: 'id',
  playerName: 'name',
};

module.exports = {
  tentativeDetailsEntityToRequest,
  userEntityToTentativeResponse,
};
