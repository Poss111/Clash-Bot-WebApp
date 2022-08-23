const dotenv = require('dotenv');
dotenv.config();
// eslint-disable-next-line no-unused-vars
module.exports = (fon, config) => {
  config.env.auth0_scope = process.env.APP_AUTH0_SCOPE
  config.env.auth0_client_id = process.env.APP_AUTH0_CLIENTID
  config.env.auth0_client_secret = process.env.AUTH0_CLIENT_SECRET
  config.env.auth0_grant_type = process.env.AUTH0_GRANT_TYPE
  config.env.branch_name = process.env.BRANCH_NAME
  return config;
}


require('@applitools/eyes-cypress')(module);
