const pino = require('pino');

const logger = pino({ level: 'debug' });

module.exports = logger;
