require('dotenv').config();
const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');
const clashUserDbImpl = require('./dao/ClashUserDbImpl');
const clashTimeDbImpl = require('./dao/ClashTimeDbImpl');
const clashTeamsDb = require('./dao/ClashTeamsDbImpl');
const clashTentativeDb = require('./dao/ClashTentativeDbImpl');
const clashUserTeamAssociationDb = require('./dao/ClashUserTeamAssociationDbImpl');
const socketService = require('./socket/SocketServices');

const launchServer = async () => {
  const loggerContext = { class: 'index', method: 'launchServer'};
  try {
    await Promise.all([
      clashUserDbImpl.initialize(),
      clashTimeDbImpl.initialize(),
      clashTeamsDb.initialize(),
      clashTentativeDb.initialize(),
      clashUserTeamAssociationDb.initialize(),
    ]);

    try {
      socketService.waitForConnection(1)
        .then(() => logger.info(loggerContext, 'Connected to Websocket Service.'))
        .catch((err) => logger.error(
          { loggerContext, error: { message: err.message, stack: err.stack } },
        ));
    } catch (err) {
      logger.error(
        { loggerContext, error: { message: err.message, stack: err.stack } },
        'Unable to connect to Websocket service.'
      );
    }

    const port = process.env.PORT === undefined ? 8080 : process.env.PORT;
    logger.info(loggerContext, `Attempting to start server on port ('${port}')`);
    this.expressServer = new ExpressServer(
      port,
      config.OPENAPI_YAML,
    );
    this.expressServer.launch();
    logger.info(loggerContext, `Express server running on Port ('${port}')`);
  } catch (err) {
    logger.error(
      { loggerContext, error: { message: err.message, stack: err.stack } },
      'Express Server failure',
    );
    await this.expressServer.close();
  }
};

launchServer()
  .catch((err) => logger
    .error({ error: { message: err.message, stack: err.stack } }));
