/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
*
* returns getApplicationHealth_200_response
* */
const getApplicationHealth = () => new Promise((resolve) => resolve(Service.successResponse({ status: 'Healthy' })));

module.exports = {
  getApplicationHealth,
};
