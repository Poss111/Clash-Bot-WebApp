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
const clashUserTeamAssociationDbImpl = require('../dao/ClashUserTeamAssociationDbImpl');
const clashTeamsDbImpl = require('../dao/ClashTeamsDbImpl');
const { teamEntityDeletionToResponse, teamEntityToResponse, userEntityToResponse } = require(
  '../mappers/TeamMapper',
);
const socketService = require('../socket/SocketServices');

function sendAsyncEvent(mappedResponse, loggerContext) {
  socketService.sendMessage(mappedResponse)
    .then(() => logger.debug(loggerContext, 'Successfully sent Team event.'))
    .catch((error) => logger.error({ err: error, ...loggerContext }, 'Failed to fulfill call.'));
}

function removeUserFromTeam(teamEntity, playerId, loggerContext) {
  teamEntity.players = teamEntity.players
    .filter((id) => id !== playerId);
  const playerRole = Object.entries(teamEntity.playersWRoles)
    .find((entry) => entry[1] === playerId);
  logger.debug(loggerContext, `Removing player ('${playerId}') from Role ('${playerRole[0]}')...`);
  delete teamEntity.playersWRoles[playerRole[0]];
  return { ...teamEntity };
}

async function findAssociationsAndRemoveUser({
  playerId, tournamentName, tournamentDay, serverName,
}, loggerContext) {
  const userAssociations = await clashUserTeamAssociationDbImpl.getUserAssociation({
    playerId,
    tournament: tournamentName,
    tournamentDay,
    serverName,
  });
  if (userAssociations.length > 0) {
    logger.info(loggerContext,
      `Found Player ('${userAssociations[0].playerId}') associated, Association ('${userAssociations[0].association}')`);
    const retrievedTeam = await clashTeamsDbImpl.retrieveTeamsByFilter({
      serverName,
      tournamentName,
      tournamentDay,
      teamName: userAssociations[0].teamName,
    });
    const team = retrievedTeam[0];
    const updatedTeam = removeUserFromTeam(
      team,
      playerId,
      loggerContext,
    );

    let event = {};
    if (team.players <= 0) {
      await clashTeamsDbImpl.deleteTeam({
        serverName: team.serverName,
        details: team.details,
      });
      logger.debug(
        loggerContext,
        `Server ('${team.serverName}') Team ('${team.details}') successfully deleted.`,
      );
      event = objectMapper(updatedTeam, teamEntityDeletionToResponse);
    } else {
      const teamAfterUpdate = await clashTeamsDbImpl.updateTeam(updatedTeam);
      logger.info(loggerContext,
        `Removed Player from following Server ('${teamAfterUpdate.serverName}') Team ('${teamAfterUpdate.teamName}').`);
      const idToUserDetails = await clashSubscriptionDbImpl.retrieveAllUserDetails(
        teamAfterUpdate.players,
      );
      event = objectMapper(teamAfterUpdate, teamEntityToResponse);
      Object.keys(event.playerDetails)
        .forEach((key) => event
          .playerDetails[key] = objectMapper(idToUserDetails[event
            .playerDetails[key].id], userEntityToResponse));
    }
    sendAsyncEvent(event, { ...loggerContext });
  }
}

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

        const tournaments = await clashTimeDbImpl
          .findTournament(body.tournamentDetails.tournamentName,
            body.tournamentDetails.tournamentDay);

        if (!tournaments || (Array.isArray(tournaments) && tournaments.length <= 0)) {
          reject(Service.rejectResponse('Tournament given does not exist.', 400));
        } else {
          await findAssociationsAndRemoveUser(
            {
              playerId: body.playerId,
              tournamentName: body.tournamentDetails.tournamentName,
              tournamentDay: body.tournamentDetails.tournamentDay,
              serverName: body.serverName,
            },
            loggerContext,
          );

          updatedTentativeDetails = await clashTentativeDbImpl
            .addToTentative(body.playerId, body.serverName, body.tournamentDetails,
              tentativeDetails);
          const association = await clashUserTeamAssociationDbImpl.createUserAssociation({
            playerId: body.playerId,
            tournament: body.tournamentDetails.tournamentName,
            tournamentDay: body.tournamentDetails.tournamentDay,
            serverName: body.serverName,
          });
          logger.info(
            loggerContext,
            `Added Tentative association ('${association.association}) for Player ('${body.playerId}').`,
          );
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
 * serverName String the name of the Server the queue falls under.
 * playerId String the player id to remove from the tentative queue with.
 * tournament String the Tournament that the tentative queue belongs to.
 * tournamentDay String the Tournament day that the tentative queue belongs to.
 * returns Tentative
 * */
const removePlayerFromTentative = ({
  serverName, playerId, tournament, tournamentDay,
}) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'removePlayerFromTeam' };
    try {
      const tentativeDetails = await clashTentativeDbImpl
        .getTentative(serverName, { tournamentName: tournament, tournamentDay });
      if (tentativeDetails
        && Array.isArray(tentativeDetails.tentativePlayers)
        && !tentativeDetails.tentativePlayers.includes(playerId)) {
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
            .removeFromTentative(playerId, tentativeDetails);
        }
        logger.info(loggerContext, `Removing ('${playerId}') from Tentative Queue User association record...`);
        await clashUserTeamAssociationDbImpl.removeUserAssociation({
          playerId,
          tournament,
          tournamentDay,
          serverName,
        });
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
