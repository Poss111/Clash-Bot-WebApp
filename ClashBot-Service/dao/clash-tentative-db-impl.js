const dynamoDbHelper = require('./impl/dynamo-db-helper');
const Joi = require('joi');

class ClashTentativeDbImpl {
    Tentative;
    tableName = 'clashtentative';

    constructor() {
    }

    initialize() {
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
                console.log(`Successfully setup table def for ('${this.tableName}')`);
                this.Tentative = data;
                resolve(data);
            }).catch((err) => reject(err));
        })
    }



}

module.exports = new ClashTentativeDbImpl;
