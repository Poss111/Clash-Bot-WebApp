require('dotenv').config();
const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');
const clashUserDbImpl = require('./dao/ClashUserDbImpl');
const clashTimeDbImpl = require('./dao/ClashTimeDbImpl');
const clashTeamsDb = require('./dao/ClashTeamsDbImpl');
const clashTentativeDb = require('./dao/ClashTentativeDbImpl');
const socketService = require('./socket/SocketServices');

const launchServer = async () => {
  try {
    await Promise.all([
      clashUserDbImpl.initialize(),
      clashTimeDbImpl.initialize(),
      clashTeamsDb.initialize(),
      clashTentativeDb.initialize(),
    ]);

    socketService.waitForConnection(1)
      .then(() => logger.info('Connected to Websocket Service.'))
      .catch((err) => logger.error(err));

    const port = process.env.PORT === undefined ? config.URL_PORT : process.env.PORT;
    this.expressServer = new ExpressServer(
      port,
      config.OPENAPI_YAML,
    );
    this.expressServer.launch();
    logger.info(`Express server running on Port ('${port}')`);
  } catch (error) {
    logger.error('Express Server failure', error.message);
    await this.close();
  }
};

launchServer().catch((e) => logger.error(e));
