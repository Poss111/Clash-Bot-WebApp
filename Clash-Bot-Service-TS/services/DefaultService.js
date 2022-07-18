/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Returns a single Team or multiple Teams that match the name used.
*
* name String the name of the Team to retrieve. (optional)
* returns List
* */
const getTeam = ({ name }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        name,
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
*
* returns List
* */
const getTournaments = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
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
  getTeam,
  getTournaments,
};
