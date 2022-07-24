/* eslint-disable no-unused-vars */
const objectMapper = require('object-mapper');
const Service = require('./Service');
const clashTeamsDbImpl = require('../dao/clash-teams-db-impl');
const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');
const clashTimeDbImpl = require('../dao/clash-time-db-impl');
const { teamEntityToResponse, userEntityToResponse } = require('../mappers/TeamMapper');
const logger = require('../logger');

/**
* Create a new Team
*
* team Team The Team details to use to update a specific Team (optional)
* returns Team
* */
const createNewTeam = ({ body }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'createNewTeam' };
    try {
      const tournamentTimes = await clashTimeDbImpl.findTournament(body.tournamentName, body.tournamentDay);
      if (!tournamentTimes || tournamentTimes.length <= 0) {
        reject(Service.rejectResponse('Tournament given was not valid.', 400));
      } else {
        const playersWRoles = {};
        playersWRoles[body.playerDetails.role] = body.playerDetails.id;
        const createdTeam = await clashTeamsDbImpl.createTeam({
          serverName: body.serverName,
          players: [body.playerDetails.id],
          playersWRoles,
          tournamentDetails: {
            tournamentName: body.tournamentName,
            tournamentDay: body.tournamentDay,
          },
        });
        const idToPlayerMap = await clashSubscriptionDbImpl.retrieveAllUserDetails(createdTeam.players);
        const mappedResponse = objectMapper(createdTeam, teamEntityToResponse);
        Object.keys(mappedResponse.playerDetails)
          .forEach((key) => mappedResponse
            .playerDetails[key] = objectMapper(idToPlayerMap[mappedResponse
              .playerDetails[key].id], userEntityToResponse));
        resolve(Service.successResponse(mappedResponse));
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
* Returns a single Team or multiple Teams that match the filtering criteria.
*
* server String the name of the Server to filter the Teams by.
* name String the name of the Team to retrieve. (optional)
* tournament String the name of the Tournament to filter the Teams by. (optional)
* day String the day of the Tournament to filter the Teams by. (optional)
* returns List
* */
const getTeam = ({
  server, name, tournament, day,
}) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'getTeam' };
    try {
      if (!tournament && day) {
        reject(Service.rejectResponse('Missing required attribute.', 400));
      } else if ((!tournament || !day) && name) {
        reject(Service.rejectResponse('Missing required attribute.', 400));
      } else {
        const teams = await clashTeamsDbImpl.retrieveTeamsByFilter({
          teamName: name,
          serverName: server,
          tournamentName: tournament,
          tournamentDay: day,
        });
        const listOfPlayerIds = new Set(teams.map((team) => Object.values(team.playersWRoles)).flatMap((value) => value));
        const idToUserDetails = await clashSubscriptionDbImpl.retrieveAllUserDetails([...listOfPlayerIds]);
        const response = teams.map((team) => {
          const mappedResponse = objectMapper(team, teamEntityToResponse);
          Object.keys(mappedResponse.playerDetails)
            .forEach((key) => mappedResponse.playerDetails[key] = objectMapper(idToUserDetails[mappedResponse.playerDetails[key].id], userEntityToResponse));
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
      resolve(Service.successResponse({
        serverName,
        tournamentName,
        tournamentDay,
      }));
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
const placePlayerOnTentative = ({ placePlayerOnTentativeRequest }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'placePlayerOnTentative' };
    try {
      resolve(Service.successResponse({
        placePlayerOnTentativeRequest,
      }));
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
* Removes a Player from a Team
*
* body TeamRemovalBody The details of a Team to remove a player from. (optional)
* returns Team
* */
const removePlayerFromTeam = ({ body }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'removePlayerFromTeam' };
    try {
      const retrievedTeams = await clashTeamsDbImpl.retrieveTeamsByFilter({
        serverName: body.serverName,
        tournamentName: body.tournamentDetails.tournamentName,
        tournamentDay: body.tournamentDetails.tournamentDay,
        teamName: body.teamName,
      });
      logger.debug(loggerContext, `Retrieved Teams ('${retrievedTeams}').`);
      if (!retrievedTeams || retrievedTeams.length <= 0) {
        reject(Service.rejectResponse(`No Team found with criteria '${body}'.`, 400));
      } else if (!retrievedTeams[0].players.some((playerId) => playerId === body.playerId)) {
        reject(Service.rejectResponse(`Player does not exist on Team '${body}'.`, 400));
      } else {
        logger.debug(loggerContext, `Retrieved Teams Server ('${body.serverName}') length ('${retrievedTeams.length}')`);
        const teamToUpdate = { ...retrievedTeams[0] };
        logger.debug(loggerContext, `Removing player ('${body.playerId}') from Server ('${retrievedTeams[0].serverName}') Team ('${retrievedTeams[0].details}')...`);
        teamToUpdate.players =
          teamToUpdate.players.filter((playerId) => playerId !== body.playerId);
        const playerRole = Object.entries(teamToUpdate.playersWRoles)
          .find((entry) => entry[1] === body.playerId);
        logger.debug(loggerContext, `Removing player ('${body.playerId}') from Role ('${playerRole[0]}')...`);
        delete teamToUpdate.playersWRoles[playerRole[0]];
        if (teamToUpdate.players <= 0) {
          logger.debug(loggerContext, 'Team will be empty after removal, deleting team instead...');
          await clashTeamsDbImpl.deleteTeam({
            serverName: teamToUpdate.serverName,
            details: teamToUpdate.details,
          });
          logger.debug(loggerContext, `Server ('${body.serverName}') Team ('${teamToUpdate.details}') successfully deleted.`);
          resolve(Service.successResponse('Team successfully deleted.'));
        } else {
          const updatedTeam = await clashTeamsDbImpl.updateTeam(teamToUpdate);
          logger.debug(loggerContext, `Player ('${body.playerId}') removed successfully from Server ('${retrievedTeams[0].serverName}') Team ('${updatedTeam.details}')`);
          const idToPlayerMap = await clashSubscriptionDbImpl.retrieveAllUserDetails(updatedTeam.players);
          const mappedResponse = objectMapper(updatedTeam, teamEntityToResponse);
          Object.keys(mappedResponse.playerDetails)
            .forEach((key) => mappedResponse.playerDetails[key] = objectMapper(idToPlayerMap[mappedResponse.playerDetails[key].id],
              userEntityToResponse));
          resolve(Service.successResponse(mappedResponse));
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
const removePlayerFromTentative = ({ placePlayerOnTentativeRequest }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'removePlayerFromTeam' };
    try {
      resolve(Service.successResponse({
        placePlayerOnTentativeRequest,
      }));
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
* Updates the Team that matches the details passed.
*
* teamPatchPayload TeamPatchPayload The Team details to use to update a specific Team (optional)
* returns Team
* */
const updateTeam = ({ body }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'TeamService', method: 'updateTeam' };
    try {
      const retrievedTeams = await clashTeamsDbImpl.retrieveTeamsByFilter({
        serverName: body.serverName,
        tournamentName: body.tournamentDetails.tournamentName,
        tournamentDay: body.tournamentDetails.tournamentDay,
        teamName: body.teamName,
      });
      if (!retrievedTeams || retrievedTeams.length <= 0) {
        reject(Service.rejectResponse(`No team found matching criteria '${body}'.`, 400));
      } else if (retrievedTeams[0].players.length >= 5) {
        reject(Service.rejectResponse(`Team requested is already full - '${body}'.`, 400));
      } else if (retrievedTeams[0].playersWRoles[body.role]) {
        reject(Service.rejectResponse(`Role is already taken - '${body}'.`, 400));
      } else {
        const updatedTeam = { ...retrievedTeams[0] };
        if (!updatedTeam.playersWRoles) {
          updatedTeam.playersWRoles = {};
          updatedTeam.players = [];
        }
        updatedTeam.playersWRoles[body.role] = body.playerId;
        updatedTeam.players.push(body.playerId);
        const updatedTeamAfterPersist = await clashTeamsDbImpl.updateTeam(updatedTeam);
        const idToUserDetails = await clashSubscriptionDbImpl.retrieveAllUserDetails(
          updatedTeamAfterPersist.players);
        const mappedResponse = objectMapper(updatedTeamAfterPersist, teamEntityToResponse);
        Object.keys(mappedResponse.playerDetails)
          .forEach((key) => mappedResponse.playerDetails[key] =
            objectMapper(idToUserDetails[mappedResponse.playerDetails[key].id],
              userEntityToResponse));
        resolve(Service.successResponse(mappedResponse));
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
  createNewTeam,
  getTeam,
  getTentativeDetails,
  placePlayerOnTentative,
  removePlayerFromTeam,
  removePlayerFromTentative,
  updateTeam,
};
