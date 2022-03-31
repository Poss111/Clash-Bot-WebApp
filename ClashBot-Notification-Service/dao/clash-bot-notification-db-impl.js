const dynamoDbHelper = require('./impl/dynamo-db-helper');
const Joi = require('Joi');
const logger = require('pino')();
const { v4: uuidv4 } = require('uuid');

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
                    notificationUniqueId: Joi.string(),
                    dismissed: Joi.boolean(),
                    message: Joi.object({
                        alertLevel: Joi.number(),
                        from: Joi.string(),
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

    retrieveNotificationsForUser = (userId, limit) => {
        return new Promise(resolve => {
            let query = this.clashBotNotificationTable.query(`U#${userId}`);
                if (limit) {
                    query = query.limit(limit);
                }
                query.exec((err, data) => {
                    logger.info(`Scanned Count ('${data.ScannedCount}') Total ('${data.Count}') for User Id ('${userId}')`);
                    resolve(data.Items.map(item => item.attrs));
                });
        });
    };

    persistNotification(userId, from, serverName, message, alertLevel) {
        return new Promise((resolve, reject) => {
            const dateCreated = new Date().toISOString();
            const messageUniqueId = uuidv4();
            const notificationToPersist = {
                key: `U#${userId}`,
                notificationSortKey: `U#${serverName}#${dateCreated}#${messageUniqueId}`,
                notificationUniqueId: messageUniqueId,
                dismissed: false,
                message: {
                    alertLevel: alertLevel,
                    from: from,
                    message: message
                },
                timeAdded: new Date().toISOString()
            };
            this.clashBotNotificationTable.create(notificationToPersist, (err, persistedNotification) => {
                if (err) reject(err);
                else resolve(persistedNotification.attrs);
            });
        })
    }
}

module.exports = new ClashBotNotificationDbImpl;
