const pino = require('pino');

const level = process.env.LOGGER_LEVEL === undefined ? 'info' : process.env.LOGGER_LEVEL;
const logger = pino({ level }).child({
  app: 'ClashBot-WS-Service',
});

module.exports = logger;
