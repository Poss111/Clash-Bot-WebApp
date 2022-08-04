const dynamodb = require('dynamodb');
const Joi = require('joi');
const dynamoDbHelper = require('./impl/DynamoDbHelper');
const logger = require('./../logger');
const namingUtils = require("../utils/naming-utils");

class ClashTeamsDbImpl {
    Team;
    tableName = 'server-clash-team';

    constructor() {
    }

    initialize() {
        const loggerContext = {class: 'ClashTeamsDbImpl', method: 'initialize'};
        return new Promise((resolve, reject) => {
            dynamoDbHelper.initialize(this.tableName, {
                hashKey: 'serverName',
                rangeKey: 'details',
                timestamps: true,
                schema: {
                    serverName: Joi.string(),
                    details: Joi.string(),
                    teamName: Joi.string(),
                    players: dynamodb.types.stringSet(),
                    playersWRoles: Joi.object({
                        Top: Joi.string(),
                        Jg: Joi.string(),
                        Mid: Joi.string(),
                        Bot: Joi.string(),
                        Supp: Joi.string(),
                    }),
                    tournamentName: Joi.string(),
                    tournamentDay: Joi.string(),
                    startTime: Joi.string()
                }
            }).then(data => {
                logger.info(loggerContext, `Successfully setup table def for ('${this.tableName}')`);
                this.Team = data;
                resolve(data);
            }).catch((err) => reject(err));
        })
    }

    createTeam({ serverName, players, playersWRoles, tournamentDetails }) {
        const loggerContext = {class: 'ClashTeamsDbImpl', method: 'createTeam'};
        return new Promise((resolve, reject) => {
            logger.debug(loggerContext, 'Creating new Team...');
            const teamName = namingUtils.retrieveName().toLowerCase();
            const builtTeam = {
                serverName,
                details: `${tournamentDetails.tournamentName}#${tournamentDetails.tournamentDay}#${teamName}`,
                tournamentName: tournamentDetails.tournamentName,
                tournamentDay: tournamentDetails.tournamentDay,
                players,
                playersWRoles,
                teamName
            };
            logger.debug(loggerContext, `New Team to be persisted Server ('${serverName}') Team('${builtTeam.details}')...`);
            this.Team.create(builtTeam, (err, data) => {
                if (err) {
                    loggerContext.err = err;
                    logger.error(loggerContext, `ClashTeamsDbImpl.createTeam - Failed to persist Error.`)
                    reject(err);
                } else {
                    logger.debug(loggerContext, `Successfully created new Server ('${data.attrs.serverName}') Team ('${data.attrs.details}')`);
                    resolve(data.attrs);
                }
            });
        });
    }

    updateTeam(updatedTeam) {
        const loggerContext = {class: 'ClashTeamsDbImpl', method: 'updateTeam'};
        return new Promise((resolve, reject) => {
            this.Team.update(updatedTeam, (err, data) => {
               if (err) {
                   logger.error(loggerContext, `Failed to update Team - ${err.message}`);
                   reject(err);
               } else {
                   resolve(data.attrs);
               }
            });
        });
    }

    retrieveTeamsByFilter({serverName, tournamentName, tournamentDay, teamName}) {
        const loggerContext = {class: 'ClashTeamsDbImpl', method: 'retrieveTeamsByFilter'};
        return new Promise((resolve, reject) => {
            logger.debug(loggerContext, `Retrieving Teams based on criteria serverName ('${serverName}') tournamentName ('${tournamentName}') tournamentDay ('${tournamentDay}') teamName ('${teamName}')`)
            let stream = this.Team
              .query(serverName);
            let filteringCriteria = serverName;
              if (tournamentName
                || tournamentDay
                || teamName) {
                  let rangeKey = '';
                  if (tournamentName) {
                      rangeKey += `${tournamentName}#`;
                      if (tournamentDay) {
                          rangeKey += `${tournamentDay}`;
                          if (teamName) {
                              rangeKey += `#${teamName.toLowerCase()}`;
                          }
                      }
                  }
                  filteringCriteria += ' - ' + rangeKey;
                stream = stream
                  .where('details')
                  .beginsWith(rangeKey);
              }
              logger.debug(loggerContext, `Searching for Team with criteria ('${filteringCriteria}')...`)
              stream = stream.exec();
            const teams = [];
            stream.on('readable', function () {
                let read = stream.read();
                if (read) {
                    logger.debug(loggerContext, `Scanned Count : '${read.ScannedCount}'`)
                    logger.debug(loggerContext, `Items Returned : '${read.Count}'`)
                }
                if (read) {
                    read.Items.forEach((data) => {
                        teams.push(data.attrs)
                    });
                }
            });
            stream.on('end', function () {
                resolve(teams);
            });
            stream.on('error', (err) => {
                loggerContext.err = err;
                logger.error(loggerContext, 'Failed to filter for Clash Teams.');
                reject(err)
            });
        });
    }

    deleteTeam(expectedDestroyPayload) {
        const loggerContext = {class: 'ClashTeamsDbImpl', method: 'deleteTeam'};
        logger.debug(loggerContext, `Deleting team '${expectedDestroyPayload}'...`);
        return new Promise((resolve, reject) => {
           this.Team.destroy(expectedDestroyPayload, (err) => {
               if (err) {
                   loggerContext.err = err;
                   logger.error(loggerContext, `Failed to delete Team due to ('${err.message}')`);
                   reject(err);
               } else {
                   logger.debug(loggerContext, `Successfully deleted team '${expectedDestroyPayload}'...`);
                   resolve(true);
               }
           })
        });
    }
}

module.exports = new ClashTeamsDbImpl;
