/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Create a new Clash Bot Player.
*
* player Player  (optional)
* returns Player
* */
const updateUser = ({ player }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        player,
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
  updateUser,
};
