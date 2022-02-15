const clashBotNotificationDbImpl = require('../dao/clash-bot-notification-db-impl');
const clashNotificationsData = require('./mock-data/clash-notifications-sample-data');
const templateBuilder = require('../utility/template-builder');
const logger = require('pino')();

process.env.INTEGRATION_TEST = true;

let createdTables = new Map();

Date.prototype.addDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.addHours = function(hours) {
    let date = new Date(this.valueOf());
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    return date;
}

Date.prototype.minusMinutes = function(minutes) {
    let date = new Date(this.valueOf());
    date.setTime(date.getTime() - (minutes * 60 * 1000));
    return date;
}

let loadAllTables = async () => new Promise((resolve, reject) => {
    let overrides = {
        currentDateTime: new Date().toISOString(),
        earlierDateTime: new Date().minusMinutes(1).toISOString(),
        serverName: 'LoL-ClashBotSupport'
    };
    logger.info(`Dynamic Data for Integration Tests : ${JSON.stringify(overrides)}`);
    let clashNotificationsDynamicData = templateBuilder.buildMessage(clashNotificationsData, overrides);
    Promise.all([persistSampleData(clashBotNotificationDbImpl, clashNotificationsDynamicData)])
        .then(results => {
            results.forEach(table => {
                createdTables.set(table.tableName, {
                    table: table.table,
                    dataPersisted: table.data
                })
            });
            let keys = [];
            for (const key of createdTables.keys()) {
                keys.push(key);
            }
            logger.info(`Built: ${JSON.stringify(keys)}`);
            resolve(createdTables);
        }).catch(err => {
        logger.error('Failed to load table data.', err);
        reject(err);
    });
});

function getAllDataFromTable(table) {
    return new Promise((resolve, reject) => {
        table.scan().exec((err, data) => {
            if (err) reject(err);
            else {
                let results = [];
                data.Items.forEach(record => {
                    results.push(record.attrs);
                })
                resolve(results);
            }
        });
    })
}

function persistSampleData(module, data) {
    return new Promise((resolve, reject) => {
        module.initialize().then(table => {
            cleanUpTable(module.tableName, table).then(() => {
                logger.info(`Creating table ('${module.tableName}')...`);
                table.createTable((err) => {
                    if (err) {
                        logger.error(`Failed to create ${module.tableName}.`, err);
                        reject(err);
                    } else {
                        let successful = 0;
                        let failed = 0;
                        let dataPersisted = [];
                        logger.info(`Successfully created table ('${module.tableName}').`);
                        data.Items.forEach(recordToInsert => {
                            console.debug(`Inserting record into ('${module.tableName}')...`);
                            table.create(recordToInsert, (err) => {
                                if (err) {
                                    logger.error(`Failed to load data`, err);
                                    failed++;
                                } else {
                                    dataPersisted.push(recordToInsert);
                                    successful++;
                                }
                                if (data.Items.length === (failed + successful)) {
                                    logger.info(`Loaded ('${successful}') records into ('${module.tableName}')`);
                                    resolve({tableName: module.tableName, table: table, data: dataPersisted});
                                } else if (data.Items.length === failed) {
                                    logger.error(`Failed to load all data into table ('${module.tableName}')`);
                                    reject(new Error('Failed to load data'));
                                }
                            });
                        })
                    }
                })
            }).catch(err => logger.error(`Failed to delete table ('${module.tableName}')`, err));
        }).catch(err => logger.error(`Failed to load data for ('${module.tableName}').`, err));
    })
}

function cleanUpTable(tableName, table) {
    return new Promise((resolve) => {
        logger.info(`Attempting to delete table ('${tableName}')...`);
        table.deleteTable((err) => {
            if (err) logger.error('Table was unable to be deleted.', err);
            resolve(`Successfully deleted ${tableName}.`);
        })
    });
}

function clearAllTables() {
    createdTables.forEach((record, key) => cleanUpTable(key.tableName, record.table)
        .then(data => logger.info(data))
        .catch(err => logger.error(err)));
}

module.exports.loadAllTables = loadAllTables;
module.exports.getAllDataFromTable = getAllDataFromTable;
module.exports.clearAllTables = clearAllTables;
