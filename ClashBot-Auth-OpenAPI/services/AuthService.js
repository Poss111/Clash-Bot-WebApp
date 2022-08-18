/* eslint-disable no-unused-vars */
const axios = require('axios').default;
const Service = require('./Service');
const logger = require('../logger');

/**
* Post for a new Access Token for the logged in User.
*
* getAccessTokenRequest GetAccessTokenRequest The User details for retrieving an access token. (optional)
* returns getAccessToken_200_response
* */
const getAccessToken = ({ getAccessTokenRequest }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = {
      class: 'AuthService',
      method: 'getAccessToken',
    };
    try {
      logger.info({ loggerContext }, 'Received a request for an Access Token...');
      if (getAccessTokenRequest.redirect_uri !== process.env.REDIRECT_URI) {
        reject(Service.rejectResponse('Invalid redirect uri.', 400));
      } else if (getAccessTokenRequest.client_id !== process.env.CLIENT_ID) {
        reject(Service.rejectResponse('Invalid client.', 400));
      } else if (!getAccessTokenRequest.token) {
        reject(Service.rejectResponse('Invalid request.', 400));
      } else {
        const response = await axios.post('https://discord.com/api/oauth2/token',
          {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: '',
            redirect_uri: process.env.REDIRECT_URI,
          },
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
      }
      resolve(Service.successResponse({
        getAccessTokenRequest,
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
  getAccessToken,
};
