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
                    serverName: Joi.string(),
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

    unsubscribe(id) {
        return new Promise((resolve, reject) => {
            this.clashSubscriptionTable.update({key: id, subscribed: ''},
                (err, data) => {
                    if (err) reject(err);
                    else {
                        logger.info(`Successfully deleted subscription for ('${JSON.stringify(data)}').`);
                        resolve(data);
                    }
                })
        });
    }

    updatePreferredChampions(id, champion, serverName, playerName) {
        return new Promise((resolve, reject) => {
            this.retrieveUserDetails(id).then(userData => {
                if (userData.key) {
                    logger.info(`Updating user preferences id ('${id}') champions ('${champion}')`);
                    if (Array.isArray(userData.preferredChampions)
                        && userData.preferredChampions.length === 5) {
                        userData.error = 'User has maximum preferred Champions. Cannot add.';
                        resolve(userData);
                    } else {
                        if (Array.isArray(userData.preferredChampions)
                            && userData.preferredChampions.includes(champion)) {
                            userData.preferredChampions = userData.preferredChampions
                                .filter(championName => championName !== champion);
                        } else {
                            Array.isArray(userData.preferredChampions) ? userData.preferredChampions.push(champion)
                                : userData.preferredChampions = [champion];
                        }

                        this.clashSubscriptionTable.update(userData, (err, data) => {
                            if (err) reject(err);
                            else {
                                logger.info(`Successfully updated record ('${JSON.stringify(data.attrs)}')`);
                                resolve(data.attrs);
                            }
                        });
                    }
                } else {
                    logger.info(`Creating user preferences id ('${id}') champions ('${champion}')`);
                    const dateFormat = 'MMMM DD yyyy hh:mm a z';
                    const timeZone = 'America/Los_Angeles';
                    moment.tz.setDefault(timeZone);
                    let subscription = {
                        key: id,
                        playerName: playerName,
                        timeAdded: new moment().format(dateFormat),
                        subscribed: false,
                        preferredChampions: [champion],
                        serverName: serverName
                    };
                    this.clashSubscriptionTable.create(subscription, (err, dataPersisted) => {
                        if (err) reject(err);
                        else {
                            logger.info(`Successfully persisted record ('${JSON.stringify(dataPersisted.attrs)}')`);
                            resolve(dataPersisted.attrs);
                        }
                    })
                }
            });
        });
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

    retrievePlayerNames(ids) {
        return new Promise((resolve, reject) => {
            if (!ids || ids.length < 1 || ids[0] === undefined) {
                resolve({});
            } else {
                logger.info(`Retrieving names for ids ('${ids}')...`)
                this.clashSubscriptionTable.batchGetItems([...ids], (err, data) => {
                    if (err) reject(err);
                    resolve(data.reduce((map, record) => (map[record.attrs.key] = record.attrs.playerName, map), {}));
                });
            }
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
