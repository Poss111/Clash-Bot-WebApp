/* eslint-disable no-unused-vars */
const objectMapper = require('object-mapper');
const Service = require('./Service');
const clashTentativeDbImpl = require('../dao/ClashTentativeDbImpl');
const clashTimeDbImpl = require('../dao/ClashTimeDbImpl');
const logger = require('../logger');
const clashSubscriptionDbImpl = require('../dao/ClashUserDbImpl');
const { tentativeDetailsEntityToRequest, userEntityToTentativeResponse } = require(
  '../mappers/TentativeDetailsMapper',
);

const getTentativeDetailsWithContext = (serverName, tournament) => new Promise((resolve,
  reject) => {
  clashTentativeDbImpl.getTentative(serverName, tournament)
    .then((results) => {
      resolve({
        results,
        parameters: {
          serverName,
          tournament,
        },
      });
    })
    .catch((err) => {
      reject(err);
    });
});

/**
 * A list of people on the tentative queue for upcoming Tournaments.
 *
 * serverName String The Server to filter the tentative queue by.
 * tournamentName String The Tournament name to filter by. (optional)
 * tournamentDay String The Tournament day to filter by. (optional)
 * returns List
 * */
const getTentativeDetails = ({ serverName, tournamentName, tournamentDay }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'getTentativeDetails' };
    try {
      const tournaments = await clashTimeDbImpl.findTournament(tournamentName, tournamentDay);
      if (!tournaments || tournaments.length <= 0) {
        reject(Service.rejectResponse('No Tournaments found for tentative details.', 400));
      } else {
        const results = await Promise
          .all(tournaments
            .map((tournament) => getTentativeDetailsWithContext(serverName, tournament)));
        const flatMappedResults = results
          .map((entity) => {
            if (entity.results) {
              return entity.results;
            }
            logger.debug(loggerContext, `No Tentative players for Server('${serverName}') Tournament('${entity.parameters.tournament.tournamentName}#${entity.parameters.tournament.tournamentDay}')`);
            return {
              tentativePlayers: [],
              serverName,
              tournamentDetails: entity.parameters.tournament,
            };
          });

        const listOfPlayerIds = new Set(flatMappedResults
          .map((tentativeDetail) => tentativeDetail.tentativePlayers)
          .flatMap((value) => value));
        const idToPlayerDetails = await clashSubscriptionDbImpl
          .retrieveAllUserDetails([...listOfPlayerIds]);
        const response = flatMappedResults
          .map((tentativeEntity) => {
            const mappedResponse = objectMapper(tentativeEntity, tentativeDetailsEntityToRequest);
            mappedResponse.tentativePlayers = tentativeEntity.tentativePlayers
              .map((id) => objectMapper(idToPlayerDetails[id], userEntityToTentativeResponse));
            return mappedResponse;
          });
        resolve(Service.successResponse(response));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
        reject,
      });
    }
  },
);

/**
 * Places a player on the tentative queue for an upcoming Tournament.
 *
 * placePlayerOnTentativeRequest PlacePlayerOnTentativeRequest
 * returns Tentative
 * */
const placePlayerOnTentative = ({ body }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'placePlayerOnTentative' };
    try {
      const tentativeDetails = await clashTentativeDbImpl
        .getTentative(body.serverName, body.tournamentDetails);
      if (tentativeDetails
        && Array.isArray(tentativeDetails.tentativePlayers)
        && tentativeDetails.tentativePlayers.includes(body.playerId)) {
        reject(Service
          .rejectResponse('User already on tentative queue for Tournament.', 400));
      } else {
        let updatedTentativeDetails;
        if (!tentativeDetails) {
          const tournaments = await clashTimeDbImpl
            .findTournament(body.tournamentDetails.tournamentName,
              body.tournamentDetails.tournamentDay);
          if (Array.isArray(tournaments) && tournaments.length > 0) {
            updatedTentativeDetails = await clashTentativeDbImpl
              .addToTentative(body.playerId, body.serverName, body.tournamentDetails);
          }
        } else {
          updatedTentativeDetails = await clashTentativeDbImpl
            .addToTentative(body.playerId, body.serverName, body.tournamentDetails,
              tentativeDetails);
        }

        if (!updatedTentativeDetails) {
          reject(Service.rejectResponse('Tournament given does not exist.', 400));
        } else {
          const idToPlayerMap = await clashSubscriptionDbImpl
            .retrieveAllUserDetails(updatedTentativeDetails.tentativePlayers);
          const response = objectMapper(updatedTentativeDetails, tentativeDetailsEntityToRequest);
          response.tentativePlayers = updatedTentativeDetails.tentativePlayers
            .map((id) => objectMapper(idToPlayerMap[id], userEntityToTentativeResponse));
          resolve(Service.successResponse(response));
        }
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
        reject,
      });
    }
  },
);

/**
 * Remove a player from the tentative queue for an upcoming Tournament.
 *
 * placePlayerOnTentativeRequest PlacePlayerOnTentativeRequest
 * returns Tentative
 * */
const removePlayerFromTentative = ({ body }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'removePlayerFromTeam' };
    try {
      const tentativeDetails = await clashTentativeDbImpl
        .getTentative(body.serverName, body.tournamentDetails);
      if (tentativeDetails
        && Array.isArray(tentativeDetails.tentativePlayers)
        && !tentativeDetails.tentativePlayers.includes(body.playerId)) {
        reject(Service.rejectResponse('User is not on found tentative queue for Tournament.', 400));
      } else {
        let updatedTentativeDetails = {};
        if (tentativeDetails.tentativePlayers.length <= 1) {
          await clashTentativeDbImpl
            .deleteTentativeQueue({ key: tentativeDetails.key });
          tentativeDetails.tentativePlayers = [];
          Object.assign(updatedTentativeDetails, tentativeDetails);
        } else {
          updatedTentativeDetails = await clashTentativeDbImpl
            .removeFromTentative(body.playerId, tentativeDetails);
        }
        const response = objectMapper(updatedTentativeDetails, tentativeDetailsEntityToRequest);
        if (Array.isArray(updatedTentativeDetails.tentativePlayers)
          && updatedTentativeDetails.tentativePlayers.length > 0) {
          const idToPlayerMap = await clashSubscriptionDbImpl
            .retrieveAllUserDetails(updatedTentativeDetails.tentativePlayers);
          response.tentativePlayers = updatedTentativeDetails.tentativePlayers
            .map((id) => objectMapper(idToPlayerMap[id], userEntityToTentativeResponse));
        }
        resolve(Service.successResponse(response));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
        reject,
      });
    }
  },
);

module.exports = {
  getTentativeDetails,
  placePlayerOnTentative,
  removePlayerFromTentative,
};
