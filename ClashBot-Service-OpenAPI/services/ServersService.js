/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Returns all available server details
*
* id String The Clash bot Player's id
* servers List Comma separated Server list
* returns List
* */
const getServerDetails = ({ id, servers }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        servers,
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
  getServerDetails,
};
