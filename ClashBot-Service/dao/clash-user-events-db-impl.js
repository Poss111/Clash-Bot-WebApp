const dynamoDbHelper = require('./impl/dynamo-db-helper');
const Joi = require('joi');
const logger = require('pino')();

class ClashUserEventsDbImpl {

    clashUserEventsTable;
    tableName = 'clashuserevents';

    initialize() {
        return new Promise((resolve, reject) => {
            dynamoDbHelper
                .initialize(this.tableName, {
                    hashKey: 'key',
                    timestamps: true,
                    schema: {
                        key: Joi.string(),
                        eventTime: Joi.string(),
                        eventName: Joi.string(),
                        eventDetails: Joi.string(),
                        username: Joi.string()
                    }
                })
                .then((tableDef) => {
                    logger.info(`Successfully setup table def for ('${this.tableName}')`);
                    this.clashUserEventsTable = tableDef;
                    resolve(tableDef);
                }).catch(err => reject(err));
        });
    }

    persistEvent(username, eventName, eventDetails) {
        return new Promise((resolve, reject) => {

            const currentTime = new Date().toISOString();
            const eventToPersist = {
                key: `${username}#${eventName}#${currentTime}`,
                eventTime: currentTime,
                eventName: eventName,
                eventDetails: eventDetails,
                username: username
            };
            this.clashUserEventsTable.update(eventToPersist, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            })
        });
    }

}

module.exports = new ClashUserEventsDbImpl;