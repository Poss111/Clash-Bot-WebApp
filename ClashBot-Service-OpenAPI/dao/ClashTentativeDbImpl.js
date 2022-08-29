const dynamoDbHelper = require('./impl/DynamoDbHelper');
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
                    serverId: Joi.string(),
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

    isTentative(userId, serverId, tournamentDetails) {
        return new Promise((resolve, reject) => {
            const key = this.buildKey(serverId, tournamentDetails);
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

    addToTentative(userId, serverId, tournamentDetails, tentativeObject) {
        return new Promise((resolve, reject) => {
            if (tentativeObject) {
                if (tentativeObject.tentativePlayers) {
                    tentativeObject.tentativePlayers.push(userId);
                } else {
                    tentativeObject.tentativePlayers = [userId];
                }
            } else {
                tentativeObject = {
                    key: this.buildKey(serverId, tournamentDetails),
                    tentativePlayers: [userId],
                    serverId: serverId,
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

    handleTentative(userId, serverId, tournamentDetails) {
        return this.isTentative(userId, serverId, tournamentDetails)
            .then(tentativeDetails => {
                if (tentativeDetails.onTentative) return this.removeFromTentative(userId, tentativeDetails.tentativeList);
                else return this.addToTentative(userId, serverId, tournamentDetails, tentativeDetails.tentativeList);
            });
    }

    getTentative(serverId, tournamentDetails) {
        return new Promise((resolve, reject) => {
            this.Tentative.get(this.buildKey(serverId, tournamentDetails), (err, data) => {
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

    buildKey(serverId, tournamentDetails) {
        return `${serverId}#${tournamentDetails.tournamentName}#${tournamentDetails.tournamentDay}`;
    }

    deleteTentativeQueue({ key }) {
        const loggerContext = {class: 'ClashTentativeDbImpl', method: 'deleteTentativeQueue'};
        return new Promise((resolve, reject) => {
            this.Tentative.destroy({ key }, (err) => {
                if (err) {
                    logger.error(
                      { loggerContext, error: { message: err.message, stack: err.stack } },
                      `Failed to delete Tentative Queue ('${key}').`
                    );
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
