const dynamoDbHelper = require('./impl/DynamoDbHelper');
const Joi = require('joi');
const moment = require('moment-timezone');
const logger = require('./../logger');

class ClashUserDbImpl {

    clashSubscriptionTable;
    tableName = 'clash-registered-user';

    initialize() {
        return new Promise((resolve, reject) => {
            dynamoDbHelper.initialize(this.tableName, {
                hashKey: 'key',
                timestamps: true,
                schema: {
                    key: Joi.string(),
                    playerName: Joi.string(),
                    serverId: Joi.string(),
                    selectedServers: Joi.array(),
                    timeAdded: Joi.string(),
                    subscribed: Joi.string(),
                    preferredChampions: Joi.array()
                },
                indexes: [{
                    hashKey : 'key',
                    rangeKey : 'subscribed',
                    name : 'subscribed-users-index',
                    type : 'global'
                }]
            }).then((tableDef) => {
                logger.info(`Successfully setup table def for ('${this.tableName}')`);
                this.clashSubscriptionTable = tableDef;
                resolve(tableDef);
            }).catch(err => reject(err));
        });
    }

    createUser(newUserDetails) {
        const timeZone = 'America/Los_Angeles';
        moment.tz.setDefault(timeZone);
        newUserDetails.timeAdded = new moment().format( 'MMMM DD yyyy hh:mm a z');
        return new Promise((resolve, reject) => {
            this.clashSubscriptionTable.create(newUserDetails, (err, data) => {
                if (err) reject(err);
                else {
                    logger.info(`Successfully created new User : '${JSON.stringify(data)}'`);
                    resolve(newUserDetails);
                }
            })
        });
    }

    updateUser(userDetailsToUpdate) {
        return new Promise((resolve, reject) => {
            this.clashSubscriptionTable.update(userDetailsToUpdate, (err, data) => {
                if (err) reject(err);
                else {
                    logger.info(`Successfully updated User Details => ${JSON.stringify(data)}`);
                    resolve(data.attrs);
                }
            })
        })
    }

    retrieveUserDetails(id) {
        return new Promise((resolve, reject) => {
            logger.info(`Retrieving User Details for id ('${id}')...`);
            this.clashSubscriptionTable.query(id).exec((err, data) => {
                if (err) reject(err);
                else {
                    if (!data.Items[0]) {
                        resolve({});
                    } else {
                        resolve(data.Items[0].attrs);
                    }
                }
            });
        });
    }

    retrieveAllUserDetails(ids) {
        return new Promise((resolve, reject) => {
            if (!ids || ids.length < 1 || ids[0] === undefined) {
                resolve({});
            } else {
                this.clashSubscriptionTable.batchGetItems([...ids], (err, data) => {
                    if (err) reject(err)
                    else {
                        resolve(data.reduce((map, record) => (map[record.attrs.key] = record.attrs, map), {}));
                    }
                });
            }
        })
    }
}

module.exports = new ClashUserDbImpl;
