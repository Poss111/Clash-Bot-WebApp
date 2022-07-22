/* eslint-disable no-unused-vars */
const objectMapper = require("object-mapper");
const Service = require('./Service');
const clashTeamsDbImpl = require("../dao/clash-teams-db-impl");
const clashSubscriptionDbImpl = require("../dao/clash-subscription-db-impl");
const {teamEntityToResponse, userEntityToResponse} = require("../mappers/TeamMapper");

/**
* Create a new Team
*
* team Team The Team details to use to update a specific Team (optional)
* returns Team
* */
const createNewTeam = ({ team }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        team,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
const getTeam = ({ server, name, tournament, day }) => new Promise(
  async (resolve, reject) => {
    try {
      if (!tournament && day) {
        reject(Service.rejectResponse('Missing required attribute.', 400));
      } else if ((!tournament || !day) && name) {
        reject(Service.rejectResponse('Missing required attribute.', 400));
      } else {
        clashTeamsDbImpl.retrieveTeamsByFilter({
          teamName: name,
          serverName: server,
          tournamentName: tournament,
          tournamentDay: day,
        })
          .then((teams) => {
            const listOfPlayerIds = teams.map((team) => Object.values(team.playersWRoles)).flatMap(value => value);
            clashSubscriptionDbImpl.retrieveAllUserDetails(listOfPlayerIds)
              .then((idToUserDetails) => {
                const response = teams.map((team) => {
                  const mappedResponse = objectMapper(team, teamEntityToResponse);
                  Object.keys(mappedResponse.playerDetails)
                    .forEach((key) => mappedResponse.playerDetails[key] = objectMapper(idToUserDetails[mappedResponse.playerDetails[key].id], userEntityToResponse));
                  return mappedResponse;
                });
                resolve(Service.successResponse(response));
              });
          });
      }
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      resolve(Service.successResponse({
        serverName,
        tournamentName,
        tournamentDay,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      resolve(Service.successResponse({
        placePlayerOnTentativeRequest,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      resolve(Service.successResponse({
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      resolve(Service.successResponse({
        placePlayerOnTentativeRequest,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Updates the Team that matches the details passed.
*
* teamPatchPayload TeamPatchPayload The Team details to use to update a specific Team (optional)
* returns Team
* */
const updateTeam = ({ teamPatchPayload }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        teamPatchPayload,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
