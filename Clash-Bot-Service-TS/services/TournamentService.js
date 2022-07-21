/* eslint-disable no-unused-vars */
const objectMapper = require('object-mapper');
const Service = require('./Service');
const clashTimeDb = require('../dao/clash-time-db-impl');
const { tournamentEntityToRequest } = require('../mappers/TournamentMapper');

/**
*
* returns List
* */
const getTournaments = ({ tournament, day }) => new Promise(
  async (resolve, reject) => {
    try {
      clashTimeDb.findTournament(tournament, day).then((tournaments) => {
        if (!tournaments || tournaments.length <= 0) {
          reject(Service.rejectResponse('No Tournaments found.', 204));
        } else {
          // eslint-disable-next-line max-len
          resolve(Service.successResponse(tournaments.map((tourney) => objectMapper(tourney, tournamentEntityToRequest))));
        }
      }).catch((error) => reject(Service.rejectResponse(error.message)));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  getTournaments,
};
