const clashUserDbImpl = require('../clash-subscription-db-impl');
const clashTimeDbImpl = require('../clash-time-db-impl');
const clashTeamsDb = require('../clash-teams-db-impl');
const logger = require('../../logger');

Promise.all([
  clashUserDbImpl.initialize(),
  clashTimeDbImpl.initialize(),
  clashTeamsDb.initialize(),
]).then(() => {
  clashTeamsDb.retrieveTeamsByFilter({
    serverName: 'TestServer',
    tournamentName: 'awesome_sauce',
    tournamentDay: '3',
    teamName: 'Ambipom',
  })
    .then((teams) => {
      logger.info(`Length: '${teams.length}'`);
      logger.info(teams);
    })
    .catch((err) => logger.error(err));
});
