const dynamoDbHelper = require("./impl/DynamoDbHelper");
const Joi = require("joi");
const logger = require("../logger");

class ClashUserTeamAssociationDbImpl {

  clashUserTeamAssociationTable;
  tableName = 'clash-user-team-association';

  initialize() {
    const loggerContext = {class: 'ClashUserTeamAssociation', method: 'initialize'};
    return new Promise((resolve, reject) => {
      dynamoDbHelper.initialize(this.tableName, {
        hashKey: 'playerId',
        rangeKey: 'association',
        timestamps: true,
        schema: {
          playerId: Joi.string(),
          // <tableType>#<tournament>#<tournamentDay>#<serverName>#<teamName>
          association: Joi.string(),
          teamName: Joi.string(),
          role: Joi.string(),
        },
      }).then(data => {
        logger.info(loggerContext, `Successfully setup table def for ('${this.tableName}')`);
        this.clashUserTeamAssociationTable = data;
        resolve(data);
      }).catch((err) => reject(err));
    })
  }

  getUserAssociation({ playerId, tournament, tournamentDay, serverName }) {
    const loggerContext = {class: 'ClashUserTeamAssociation', method: 'getUserAssociation'};
    return new Promise((resolve, reject) => {
      const filteringCriteria = `${tournament}#${tournamentDay}#${serverName}`;
      logger.debug(loggerContext, `Searching for Team with criteria ('${filteringCriteria}')...`)
      let stream = this.clashUserTeamAssociationTable
        .query(playerId)
        .where('association')
        .beginsWith(`${tournament}#${tournamentDay}#${serverName}`)
        .exec();

      const results = [];
      stream.on('readable', () => {
        let read = stream.read();
        if (read) {
          logger.debug(loggerContext, `Scanned Count : ('${read.ScannedCount}')`)
          logger.debug(loggerContext, `Items Returned : ('${read.Count}')`)
        }
        if (read) {
          read.Items.forEach((data) => {
            results.push(data.attrs)
          });
        }
      });
      stream.on('end', () => resolve(results));
      stream.on('error', (err) => {
        logger.error(
          { error: err, ...loggerContext },
          'Failed to filter for User Associations.',
        );
        reject(err)
      });
    });
  }

  createUserAssociation({ playerId, tournament, tournamentDay, serverName, teamName, role}) {
    const loggerContext = {class: 'ClashUserTeamAssociation', method: 'createUserAssociation'};
    return new Promise((resolve, reject) => {
      const entityToPersist = this.buildAssociationEntity(
        tournament,
        tournamentDay,
        serverName,
        teamName,
        playerId,
        role,
      );
      if (teamName) {
        entityToPersist.teamName = teamName;
      }
      logger.debug(loggerContext, `Creating new User Association with Player Id ('${entityToPersist.playerId}') Association ('${entityToPersist.association}')...`);
      this.clashUserTeamAssociationTable.create(entityToPersist, (err, response) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  removeUserAssociation({ playerId, tournament, tournamentDay, serverName, teamName }) {
    const loggerContext = {class: 'ClashUserTeamAssociation', method: 'removeUserAssociation'};
    return new Promise((resolve, reject) => {
      const entityToPersist = this.buildAssociationEntity(
        tournament,
        tournamentDay,
        serverName,
        teamName,
        playerId,
      );
      logger.debug(loggerContext, `Remove User Association with Player Id ('${entityToPersist.playerId}') Association ('${entityToPersist.association}')...`);
      this.clashUserTeamAssociationTable.destroy(entityToPersist, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  buildAssociationEntity(tournament, tournamentDay, serverName, teamName, playerId, role) {
    if (!teamName) teamName = 'tentative';
    let association = `${tournament}#${tournamentDay}#${serverName}#${teamName}`;
    return {playerId, association, role};
  }
}

module.exports = new ClashUserTeamAssociationDbImpl;