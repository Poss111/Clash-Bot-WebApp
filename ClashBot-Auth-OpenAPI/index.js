require('dotenv').config();
const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');

const launchServer = async () => {
  const loggerContext = { class: 'index', method: 'launchServer' };
  try {
    const port = process.env.PORT === undefined ? 8082 : process.env.PORT;
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
