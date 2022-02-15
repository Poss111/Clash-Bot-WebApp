const dynamoDbHelper = require('./impl/dynamo-db-helper');
const Joi = require('Joi');
const logger = require('pino')();

class ClashBotNotificationDbImpl {

    clashBotNotificationTable;
    tableName = 'clash-notification';

    initialize() {
        return new Promise((resolve, reject) => {
            dynamoDbHelper.initialize(this.tableName, {
                hashKey: 'key',
                rangeKey: 'notificationSortKey',
                timestamps: true,
                schema: {
                    key: Joi.string(),
                    notificationSortKey: Joi.string(),
                    message: Joi.object({
                        alertLevel: Joi.number(),
                        message: Joi.string()
                    }),
                    timeAdded: Joi.string()
                }
            }).then((tableDef) => {
                logger.info(`Successfully setup table def for ('${this.tableName}')`);
                this.clashBotNotificationTable = tableDef;
                resolve(tableDef);
            }).catch(err => reject(err));
        });
    }

    retrieveNotificationsForUser = (userId) => {
        return new Promise(resolve => {
            this.clashBotNotificationTable
                .query(`U#${userId}`)
                .limit(5)
                .exec((err, data) => {
                    logger.info(`Scanned Count ('${data.ScannedCount}') Total ('${data.Count}') for User Id ('${userId}')`);
                    resolve(data.Items.map(item => item.attrs));
                });
        });
    };
}

module.exports = new ClashBotNotificationDbImpl;
