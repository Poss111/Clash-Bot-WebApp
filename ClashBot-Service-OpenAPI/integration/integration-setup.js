const dynamoDbUtility = require('./dynamo-db-utility.setup');
const logger = require('../logger');

process.env.INTEGRATION_TEST = true;
process.env.REGION = 'us-east-1';

let clashTableData = new Map();

delete process.env.LOCAL;
delete process.env.TOKEN;

const promise = new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    reject(new Error('Failed to load db data in set time.'));
  }, 28000);

  dynamoDbUtility.loadAllTables()
    .then((data) => {
      logger.info('Table data setup successfully.');
      clashTableData = data;
      clearTimeout(timer);
      resolve(data);
    }).catch((err) => {
      clearTimeout(timer);
      logger.error('Failed to setup data', err);
      reject(err);
    });
});
promise.then(() => {
  logger.info('Successfully setup table data.');
  clashTableData.forEach((value, key) => {
    logger.info(`${key} => ${JSON.stringify(value)}`);
  });
}).catch((err) => {
  logger.error('Failed to load DB data for setup.', err);
  process.exit(1);
});
