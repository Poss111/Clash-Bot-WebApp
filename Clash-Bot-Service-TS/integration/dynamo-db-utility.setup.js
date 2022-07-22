const clashTimeDb = require('../dao/clash-time-db-impl');
const clashTeamsDb = require('../dao/clash-teams-db-impl');
const clashSubscriptionDb = require('../dao/clash-subscription-db-impl');
const clashTentativeDb = require('../dao/clash-tentative-db-impl');
const clashTimesData = require('./mock-data/clash-times-sample-data');
const clashTeamsData = require('./mock-data/clash-teams-sample-data');
const clashSubscriptionData = require('./mock-data/clash-subscriptions-sample-data');
const clashTentativeData = require('./mock-data/clash-tentative-sample-data');
const templateBuilder = require('../utils/template-builder');
const logger = require('../logger');

process.env.INTEGRATION_TEST = true;

const createdTables = new Map();

Date.prototype.addDays = function (days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

Date.prototype.addHours = function (hours) {
  const date = new Date(this.valueOf());
  date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
  return date;
};

const loadAllTables = async () => new Promise((resolve, reject) => {
  const options = { dateStyle: 'medium', timeStyle: 'long' };
  const datePlusOneHour = new Date().addHours(1);
  const datePlusOneDay = new Date().addDays(1);
  const datePlusFiveDays = new Date().addDays(5);
  const datePlusSixDays = new Date().addDays(6);
  const formattedDatePlusOneHour = new Intl.DateTimeFormat('en-US', options).format(datePlusOneHour);
  const formattedDatePlusOneDay = new Intl.DateTimeFormat('en-US', options).format(datePlusOneDay);
  const formattedDatePlusFiveDays = new Intl.DateTimeFormat('en-US', options).format(datePlusFiveDays);
  const formattedDatePlusSixDays = new Intl.DateTimeFormat('en-US', options).format(datePlusSixDays);
  const overrides = {
    tournamentName: 'awesome_sauce',
    currentDateOne: formattedDatePlusOneHour,
    tournamentDayOne: '1',
    datePlusOneDay: formattedDatePlusOneDay,
    tournamentDayTwo: '2',
    datePlusTwoDays: formattedDatePlusFiveDays,
    tournamentDayThree: '3',
    datePlusThreeDays: formattedDatePlusSixDays,
    tournamentDayFour: '4',
    serverName: 'LoL-ClashBotSupport',
  };
  logger.info(`Dynamic Data for Integration Tests : ${JSON.stringify(overrides)}`);
  const clashTimesDynamicData = templateBuilder.buildMessage(clashTimesData, overrides);
  const clashTeamDynamicData = templateBuilder.buildMessage(clashTeamsData, overrides);
  const clashSubscriptionDynamicData = templateBuilder.buildMessage(clashSubscriptionData, overrides);
  const clashTentativeDynamicData = templateBuilder.buildMessage(clashTentativeData, overrides);
  Promise.all([
    persistSampleData(clashTimeDb, clashTimesDynamicData),
    persistSampleData(clashTeamsDb, clashTeamDynamicData),
    persistSampleData(clashSubscriptionDb, clashSubscriptionDynamicData),
    persistSampleData(clashTentativeDb, clashTentativeDynamicData)])
    .then((results) => {
      results.forEach((table) => {
        createdTables.set(table.tableName, {
          table: table.table,
          dataPersisted: table.data,
        });
      });
      const keys = [];
      for (const key of createdTables.keys()) {
        keys.push(key);
      }
      logger.info(`Built: ${JSON.stringify(keys)}`);
      resolve(createdTables);
    }).catch((err) => {
      logger.error('Failed to load table data.', err);
      reject(err);
    });
});

function getAllDataFromTable(table) {
  return new Promise((resolve, reject) => {
    table.scan().exec((err, data) => {
      if (err) reject(err);
      else {
        const results = [];
        data.Items.forEach((record) => {
          results.push(record.attrs);
        });
        resolve(results);
      }
    });
  });
}

function persistSampleData(module, data) {
  return new Promise((resolve, reject) => {
    module.initialize().then((table) => {
      cleanUpTable(module.tableName, table).then(() => {
        logger.info(`Creating table ('${module.tableName}')...`);
        table.createTable((err) => {
          if (err) {
            logger.error(`Failed to create ${module.tableName}.`, err);
            reject(err);
          } else {
            let successful = 0;
            let failed = 0;
            const dataPersisted = [];
            logger.info(`Successfully created table ('${module.tableName}').`);
            data.Items.forEach((recordToInsert) => {
              console.debug(`Inserting record into ('${module.tableName}')...`);
              table.create(recordToInsert, (err) => {
                if (err) {
                  logger.error('Failed to load data', err);
                  failed++;
                } else {
                  dataPersisted.push(recordToInsert);
                  successful++;
                }
                if (data.Items.length === (failed + successful)) {
                  logger.info(`Loaded ('${successful}') records into ('${module.tableName}')`);
                  resolve({ tableName: module.tableName, table, data: dataPersisted });
                } else if (data.Items.length === failed) {
                  logger.error(`Failed to load all data into table ('${module.tableName}')`);
                  reject(new Error('Failed to load data'));
                }
              });
            });
          }
        });
      }).catch((err) => logger.error(`Failed to delete table ('${module.tableName}')`, err));
    }).catch((err) => logger.error(`Failed to load data for ('${module.tableName}').`, err));
  });
}

function cleanUpTable(tableName, table) {
  return new Promise((resolve) => {
    logger.info(`Attempting to delete table ('${tableName}')...`);
    table.deleteTable((err) => {
      if (err) logger.error('Table was unable to be deleted.', err);
      resolve(`Successfully deleted ${tableName}.`);
    });
  });
}

function clearAllTables() {
  createdTables.forEach((record, key) => cleanUpTable(key.tableName, record.table)
    .then((data) => logger.info(data))
    .catch((err) => logger.error(err)));
}

module.exports.loadAllTables = loadAllTables;
module.exports.getAllDataFromTable = getAllDataFromTable;
module.exports.clearAllTables = clearAllTables;
