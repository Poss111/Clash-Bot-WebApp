const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');
const clashUserDbImpl = require('./dao/ClashUserDbImpl');
const clashTimeDbImpl = require('./dao/ClashTimeDbImpl');
const clashTeamsDb = require('./dao/ClashTeamsDbImpl');
const clashTentativeDb = require('./dao/ClashTentativeDbImpl');

const launchServer = async () => {
  try {
    await Promise.all([
      clashUserDbImpl.initialize(),
      clashTimeDbImpl.initialize(),
      clashTeamsDb.initialize(),
      clashTentativeDb.initialize(),
    ]);

    this.expressServer = new ExpressServer(config.URL_PORT, config.OPENAPI_YAML);
    this.expressServer.launch();
    logger.info('Express server running');
  } catch (error) {
    logger.error('Express Server failure', error.message);
    await this.close();
  }
};

launchServer().catch(e => logger.error(e));
