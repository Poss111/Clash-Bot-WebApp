const dynamoDbHelper = require('./impl/dynamo-db-helper');
const Joi = require('joi');
const logger = require('./../logger');

class ClashTentativeDbImpl {
    Tentative;
    tableName = 'clashtentative';

    constructor() {
    }

    initialize() {
        const loggerContext = {class: 'ClashTentativeDbImpl', method: 'initialize'};
        return new Promise((resolve, reject) => {
            dynamoDbHelper.initialize(this.tableName, {
                hashKey: 'key',
                timestamps: true,
                schema: {
                    key: Joi.string(),
                    tentativePlayers: Joi.array().items(Joi.string()),
                    serverName: Joi.string(),
                    tournamentDetails: Joi.object({
                        tournamentName: Joi.string(),
                        tournamentDay: Joi.string()
                    })
                }
            }).then(data => {
                logger.info(loggerContext, `Successfully setup table def for ('${this.tableName}')`);
                this.Tentative = data;
                resolve(data);
            }).catch((err) => reject(err));
        })
    }

    isTentative(userId, serverName, tournamentDetails) {
        return new Promise((resolve, reject) => {
            const key = this.buildKey(serverName, tournamentDetails);
            this.Tentative.get(key, (err, data) => {
                if (err) reject(err);
                resolve({
                    onTentative: data !== null && Array.isArray(data.attrs.tentativePlayers)
                        ? data.attrs.tentativePlayers.includes(userId) : false,
                    tentativeList: data === null ? data : data.attrs
                });
            })
        });
    }

    addToTentative(userId, serverName, tournamentDetails, tentativeObject) {
        return new Promise((resolve, reject) => {
            if (tentativeObject) {
                if (tentativeObject.tentativePlayers) {
                    tentativeObject.tentativePlayers.push(userId);
                } else {
                    tentativeObject.tentativePlayers = [userId];
                }
            } else {
                tentativeObject = {
                    key: this.buildKey(serverName, tournamentDetails),
                    tentativePlayers: [userId],
                    serverName: serverName,
                    tournamentDetails: {
                        tournamentName: tournamentDetails.tournamentName,
                        tournamentDay: tournamentDetails.tournamentDay
                    }
                };
            }
            this.Tentative.update(tentativeObject, (err, data) => {
                if (err) reject(err);
                else resolve(data.attrs);
            })
        })
    }

    removeFromTentative(userId, tentativeObject) {
        return new Promise((resolve, reject) => {
            if (!tentativeObject || !tentativeObject.tentativePlayers) resolve(tentativeObject)
            else {
                let indexOfUser = tentativeObject.tentativePlayers.indexOf(userId);
                if (indexOfUser > -1) {
                    tentativeObject.tentativePlayers.splice(indexOfUser, 1);
                }
                this.Tentative.update(tentativeObject, (err, data) => {
                    if (err) reject(err);
                    else resolve(data.attrs);
                });
            }
        })
    }

    handleTentative(userId, serverName, tournamentDetails) {
        return this.isTentative(userId, serverName, tournamentDetails)
            .then(tentativeDetails => {
                if (tentativeDetails.onTentative) return this.removeFromTentative(userId, tentativeDetails.tentativeList);
                else return this.addToTentative(userId, serverName, tournamentDetails, tentativeDetails.tentativeList);
            });
    }

    getTentative(serverName, tournamentDetails) {
        return new Promise((resolve, reject) => {
            this.Tentative.get(this.buildKey(serverName, tournamentDetails), (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    if (data) {
                        resolve(data.attrs);
                    } else {
                        resolve(data);
                    }
                }
            })
        })
    }

    buildKey(serverName, tournamentDetails) {
        return `${serverName}#${tournamentDetails.tournamentName}#${tournamentDetails.tournamentDay}`;
    }

    deleteTentativeQueue({ key }) {
        const loggerContext = {class: 'ClashTentativeDbImpl', method: 'deleteTentativeQueue'};
        return new Promise((resolve, reject) => {
            this.Tentative.destroy({ key }, (err) => {
                if (err) {
                    loggerContext.err = err;
                    logger.error(loggerContext, `Failed to delete Tentative Queue ('${key}').`);
                    reject(err);
                }
                else {
                    logger.debug(loggerContext, `Successfully deleted Tentative Queue ('${key}').`);
                    resolve(true);
                }
            });
        })
    }
}

module.exports = new ClashTentativeDbImpl;
