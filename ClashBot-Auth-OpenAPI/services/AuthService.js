/* eslint-disable no-unused-vars */
const axios = require('axios').default;
const querystring = require('querystring');
const Service = require('./Service');
const logger = require('../logger');

/**
 * Post for a new Access Token for the logged in User.
 *
 * clientUnderscoreid String
 * redirectUnderscoreuri String
 * code String  (optional)
 * token String  (optional)
 * codeUnderscoreverifier String  (optional)
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
      if (getAccessTokenRequest.client_id !== process.env.CLIENT_ID) {
        reject(Service.rejectResponse('Invalid client.', 400));
      } else if (!getAccessTokenRequest.refresh_token && !getAccessTokenRequest.code) {
        reject(Service.rejectResponse('Invalid request.', 400));
      } else if (
        getAccessTokenRequest.code
        && !getAccessTokenRequest.code_verifier
        && getAccessTokenRequest.redirect_uri !== process.env.REDIRECT_URI
      ) {
        reject(Service.rejectResponse('Invalid request.', 400));
      } else {
        let baseRequest = {
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
        };
        if (getAccessTokenRequest.code) {
          logger.info({ loggerContext }, 'Requesting Discord for Access Token...');
          baseRequest = {
            ...baseRequest,
            grant_type: 'authorization_code',
            code: getAccessTokenRequest.code,
            code_verifier: getAccessTokenRequest.code_verifier,
            redirect_uri: process.env.REDIRECT_URI,
          };
        } else if (getAccessTokenRequest.refresh_token) {
          logger.info({ loggerContext }, 'Requesting Discord for refreshed Access Token...');
          baseRequest = {
            ...baseRequest,
            grant_type: 'refresh_token',
            refresh_token: getAccessTokenRequest.refresh_token,
          };
        }
        const response = await axios.post(
          'https://discord.com/api/oauth2/token',
          querystring.stringify(baseRequest),
        );
        logger.info({
          loggerContext,
          response: {
            status: response.status,
            headers: response.headers,
            data: response.data,
          },
        },
        'Successfully called Discord Authentication Service.');
        resolve(Service.successResponse(response.data));
      }
    } catch (e) {
      logger.error({
        loggerContext,
        response: {
          status: e.response.status,
          headers: e.response.headers,
          data: e.response.data,
        },
      },
      'Failed to make call.');
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 500,
      ));
    }
  },
);

module.exports = {
  getAccessToken,
};
