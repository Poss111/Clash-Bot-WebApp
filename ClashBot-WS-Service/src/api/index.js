require('dotenv').config();
const app = require('express')();
require('express-ws')(app);
const routes = require('./routes');
const asyncapi = require('../lib/asyncapi');
const logger = require('../../logger');

const start = async () => {
  await asyncapi.init();

  app.use(routes);

  app.use((req, res, next) => {
    res.status(404).send('Error: path not found');
    next();
  });

  app.use((err, req, res, next) => {
    logger.error(err, 'Error has occurred on WS Service.');
    next();
  });

  const runningPort = process.env.PORT ?? 8081;
  app.listen(runningPort);
  logger.info(`Listening on port ('${runningPort}')`);
};

start();
