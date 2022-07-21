/* eslint-disable no-unused-vars */
const Service = require('./Service');

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
* name String the name of the Team to retrieve. (optional)
* serverName String the name of the Server to filter the Teams by. (optional)
* tournamentName String the name of the Tournament to filter the Teams by. (optional)
* tournamentDay String the day of the Tournament to filter the Teams by. (optional)
* returns List
* */
// TODO - getTeam
const getTeam = ({ name, serverName, tournamentName, tournamentDay }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        name,
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
* Updates the Team that matches the details passed.
*
* teamPatchPayload TeamPatchPayload The Team details to use to update a specific Team (optional)
* returns Team
* */
// TODO - updateTeam
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
  updateTeam,
};
