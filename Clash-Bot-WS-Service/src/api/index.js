require('dotenv').config();
const app = require('express')();
require('express-ws')(app);
const routes = require('./routes');
const asyncapi = require('../lib/asyncapi');
const logger = require('../../logger');

const start = async () => {
  //you have access to parsed AsyncAPI document in the runtime with asyncapi.get()
  await asyncapi.init();

  app.use(routes);

  app.use((req, res, next) => {
    res.status(404).send('Error: path not found');
    next();
  });

  app.use((err, req, res, next) => {
    logger.error(err);
    next();
  });

  const runningPort = process.env.PORT ?? 8081;
  app.listen(runningPort);
  logger.info(`Listening on port ${runningPort}`);
};

start();
