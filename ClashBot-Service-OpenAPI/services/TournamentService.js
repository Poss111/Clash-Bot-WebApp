/* eslint-disable no-unused-vars */
const objectMapper = require('object-mapper');
const Service = require('./Service');
const clashTimeDb = require('../dao/ClashTimeDbImpl');
const { tournamentEntityToRequest } = require('../mappers/TournamentMapper');

/**
*
* returns List
* */
const getTournaments = ({ tournament, day }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TournamentService', method: 'getTournaments' };
    try {
      const tournaments = await clashTimeDb.findTournament(tournament, day);
      if (!tournaments || tournaments.length <= 0) {
        reject(Service.rejectResponse('No Tournaments found.', 204));
      } else {
        // eslint-disable-next-line max-len
        resolve(Service.successResponse(tournaments.map((tourney) => objectMapper(tourney, tournamentEntityToRequest))));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

module.exports = {
  getTournaments,
};
