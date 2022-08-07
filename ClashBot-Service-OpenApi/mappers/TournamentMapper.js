const tournamentEntityToRequest = {
  tournamentName: 'tournamentName',
  tournamentDay: 'tournamentDay',
  startTime: {
    key: 'startTime',
    transform: (date) => new Date(date).toISOString(),
  },
  registrationTime: {
    key: 'registrationTime',
    transform: (date) => new Date(date).toISOString(),
  },
};

module.exports = {
  tournamentEntityToRequest,
};
