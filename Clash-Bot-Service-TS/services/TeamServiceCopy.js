/* eslint-disable no-unused-vars */
const objectMapper = require('object-mapper');
const Service = require('./Service');
const clashTeamsDbImpl = require('../dao/clash-teams-db-impl');
const { teamEntityToResponse } = require('../mappers/TeamMapper');

/**
* Create a new Team
*
* team Team The Team details to use to update a specific Team (optional)
* returns Team
* */
// TODO createNewTeam Implementation
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
* name String the name of the Team to retrieve. (optional)
* serverName String the name of the Server to filter the Teams by. (optional)
* tournamentName String the name of the Tournament to filter the Teams by. (optional)
* tournamentDay String the day of the Tournament to filter the Teams by. (optional)
* returns List
* */
const getTeam = ({
  name, serverName, tournamentName, tournamentDay,
}) => new Promise(
  async (resolve, reject) => {
    try {
      if (!tournamentName && tournamentDay) {
        reject(Service.rejectResponse('Missing required attribute.', 400));
      } else if ((!tournamentName || !tournamentDay) && name) {
        reject(Service.rejectResponse('Missing required attribute.', 400));
      } else {
        clashTeamsDbImpl.retrieveTeamsByFilter({
          name,
          serverName,
          tournamentName,
          tournamentDay,
        })
          .then((teams) => {
            resolve(Service.successResponse(teams.map((team) => objectMapper(team, teamEntityToResponse))));
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
// TODO getTentativeDetails Implementation
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
// TODO placePlayerOnTentative Implementation
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
// TODO removePlayerFromTeam Implementation
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
// TODO removePlayerFromTentative Implementation
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
// TODO updateTeam Implementation
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
