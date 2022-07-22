const dynamodb = require('dynamodb');
const Joi = require('joi');
const dynamoDbHelper = require('./impl/dynamo-db-helper');
const { retrieveName } = require('../utils/naming-utils');
const logger = require('./../logger');

class ClashTeamsDbImpl {
    Team;
    tableName = 'ClashTeam';

    constructor() {
    }

    initialize() {
        return new Promise((resolve, reject) => {
            dynamoDbHelper.initialize(this.tableName, {
                hashKey: 'serverName',
                rangeKey: 'details',
                timestamps: true,
                schema: {
                    details: Joi.string(),
                    version: Joi.number(),
                    teamName: Joi.string(),
                    serverName: Joi.string(),
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
                logger.info(`Successfully setup table def for ('${this.tableName}')`);
                this.Team = data;
                resolve(data);
            }).catch((err) => reject(err));
        })
    }

    buildTournamentToTeamsMap(id, teamsList) {
        let tournamentMap = new Map();
        teamsList.forEach(team => {
            let key = `${team.tournamentName}#${team.tournamentDay}`;
            let teamDetailsForTournament = tournamentMap.get(key);
            if (!teamDetailsForTournament) teamDetailsForTournament = {};

            if (team.players && team.players.includes(id)) {
                teamDetailsForTournament.teamCurrentlyOn = team;
                if (team.players.length <= 1) {
                    teamDetailsForTournament.unableToJoin = true;
                }
            } else {
                if (Array.isArray(teamDetailsForTournament.availableTeams)) teamDetailsForTournament.availableTeams.push(team);
                else teamDetailsForTournament.availableTeams = [team];
            }

            tournamentMap.set(`${team.tournamentName}#${team.tournamentDay}`, teamDetailsForTournament);
        });
        return tournamentMap;
    }

    registerPlayer(id, serverName, tournaments) {
        return new Promise((resolve, reject) => {
            this.getTeams(serverName).then((data) => {
                let teams = data;
                logger.info(`# of teams pulled for server ('${teams.length}')`);
                const tournamentToTeamMap = this.buildTournamentToTeamsMap(id, data);
                let teamsCurrentlyOn = [];
                let availableTeam = undefined;
                let tournamentToUseKey = undefined;
                tournaments.every((entry) => {
                    tournamentToUseKey = `${entry.tournamentName}#${entry.tournamentDay}`;
                    let teamsForTournamentDetails = tournamentToTeamMap.get(tournamentToUseKey);
                    if (teamsForTournamentDetails) {
                        teamsCurrentlyOn.push(teamsForTournamentDetails.teamCurrentlyOn)
                        if (teamsForTournamentDetails.unableToJoin) {
                            tournamentToUseKey = undefined;
                            return true;
                        } else {
                            availableTeam = teamsForTournamentDetails.availableTeams;
                            return false;
                        }
                    } else {
                        return false;
                    }
                });
                logger.info(`Number of Tournaments from Teams found => ('${tournamentToTeamMap.size}')`);
                logger.info(`Requesting User ('${id}') Tournament To Use ('${tournamentToUseKey}')`);
                logger.info(`Requesting User ('${id}') Available Team ('${JSON.stringify(availableTeam)}')`);
                logger.info(`Requesting User ('${id}') Teams Currently on ('${JSON.stringify(teamsCurrentlyOn)}')`);
                if (!tournamentToUseKey) {
                    teamsCurrentlyOn.forEach(record => record.exist = true);
                    resolve(teamsCurrentlyOn);
                } else {
                    let tournamentToUse = tournaments.find(tournament => {
                        let tourneyKeySplit = tournamentToUseKey.split('#');
                        return tournament.tournamentName === tourneyKeySplit[0]
                            && tournament.tournamentDay === tourneyKeySplit[1];
                    });

                    let updateCallback = (err, record) => {
                        if (err) reject(err);
                        else {
                            logger.info(`Added ${id} to ${record.attrs.teamName}.`);
                            if (tournamentToTeamMap.get(tournamentToUseKey)
                                && tournamentToTeamMap.get(tournamentToUseKey).teamCurrentlyOn) {
                                this.unregisterPlayerWithSpecificTeam(id,
                                    [tournamentToTeamMap.get(tournamentToUseKey).teamCurrentlyOn]
                                    , serverName, reject);
                            }
                            resolve(record.attrs);
                        }
                    };

                    availableTeam = Array.isArray(availableTeam) ? availableTeam.find(record => !record.players) : availableTeam;

                    if (availableTeam) {
                        logger.info(`Adding ${id} to first available team ${availableTeam.teamName}...`);
                        this.addUserToTeam(id, availableTeam, updateCallback);
                    } else {
                        this.createNewTeam(id, serverName, tournamentToUse, updateCallback);
                    }
                }
            });
        });
    }

    registerPlayerToNewTeamV2(id, role, serverName, tournaments) {
        return new Promise((resolve, reject) => {
            this.mapTeamsToTournamentsByPlayerV2(id, serverName).then(teamsToTournaments => {
                    let requestedTournamentKeys = tournaments
                        .map(tournamentKey => `${tournamentKey.tournamentName}#${tournamentKey.tournamentDay}`);
                    const filteredTeamsToTournamentMap = Object.keys(teamsToTournaments)
                        .filter(key => requestedTournamentKeys.includes(key))
                        .reduce((obj, key) => {
                            obj[key] = teamsToTournaments[key];
                            return obj;
                        }, {})
                    let reducedTeams = Object.values(filteredTeamsToTournamentMap).filter(record => record.userTeam
                        && record.userTeam.players
                        && record.userTeam.players.length === 1
                        && record.userTeam.playersWRoles
                        && Object.keys(record.userTeam.playersWRoles).length === 1);
                    if (reducedTeams.length === tournaments.length) {
                        logger.info(`V2 - Player ('${id}') is ineligible to create a new Team.`);
                        resolve(reducedTeams.map(team => {
                            team.userTeam.exist = true;
                            return team.userTeam;
                        }));
                    } else {
                        let teamForTournaments = teamsToTournaments[
                            `${tournaments[0].tournamentName}#${tournaments[0].tournamentDay}`];
                        logger.info(`V2 - Tournament selected ('${tournaments[0].tournamentName}#${tournaments[0].tournamentDay}').`);
                        let unregisterPromise;
                        let registerDetails = {
                            unregisteredTeams: []
                        };

                        if (!teamForTournaments) {
                            teamForTournaments = {};
                        }

                        // Unregister if User is on a team for the Tournament
                        if (teamForTournaments.userTeam
                            && Object.keys(teamForTournaments.userTeam).length !== 0) {
                            logger.info(`V2 - Player is currently on Team for Tournament ('${teamForTournaments.userTeam.key}')...`);
                            unregisterPromise = new Promise((resolve1, reject1) => {
                                this.unregisterPlayerWithSpecificTeamV2(id,
                                    [teamForTournaments.userTeam], (err, data) => {
                                        if (err) reject1(err);
                                        else {
                                            let unregisteredTeams = data.map(item => item.attrs);
                                            registerDetails.unregisteredTeams.push(...unregisteredTeams);
                                            unregisteredTeams.forEach(item =>
                                                logger.info(`V2 - Successfully unregistered player ('${id}') from Team ('${item.teamName}').`))
                                            resolve1(unregisteredTeams);
                                        }
                                    })
                            });
                        }

                        // Find an available undefined Team to join
                        let teamToModify;
                        if (Array.isArray(teamForTournaments.availableTeams)) {
                            teamToModify = teamForTournaments.availableTeams.find((record) => {
                                return !record.playersWRoles || Object.keys(record.playersWRoles).length === 0
                            });
                        }

                        // If user wants to createNew and an undefined Team is available
                        if (teamToModify) {
                            teamToModify.players = [id];
                            teamToModify.playersWRoles = {};
                            teamToModify.playersWRoles[role] = id;
                            logger.info(`V2 - Found undefined Team, Register Player ('${id}') to Team ('${teamToModify.teamName}') with Role ('${role}')...`);
                            if (unregisterPromise) {
                                unregisterPromise.then(() => {
                                    this.Team.update(teamToModify, (err, data) => {
                                        if (err) reject(err);
                                        else {
                                            logger.info(`V2 - Successfully registered player ('${id}') to Team ('${data.attrs.teamName}').`);
                                            registerDetails.registeredTeam = data.attrs;
                                            resolve(registerDetails);
                                        }
                                    })
                                }).catch(err => reject(err));
                            } else {
                                this.Team.update(teamToModify, (err, data) => {
                                    if (err) reject(err);
                                    else {
                                        logger.info(`V2 - Successfully registered player ('${id}') to Team ('${data.attrs.teamName}').`);
                                        registerDetails.registeredTeam = data.attrs;
                                        resolve(registerDetails);
                                    }
                                });
                            }
                        }
                        // If user wants to createNew and no undefined Team to join
                        else {
                            if (unregisterPromise) {
                                unregisterPromise.then(() => {
                                    this.createNewTeamV2(id, serverName, role, tournaments[0], (err, data) => {
                                        if (err) reject(err);
                                        else {
                                            logger.info(`V2 - Successfully registered player ('${id}') to Team ('${data.attrs.teamName}').`);
                                            registerDetails.registeredTeam = data.attrs;
                                            resolve(registerDetails);
                                        }
                                    })
                                }).catch(err => reject(err));
                            } else {
                                this.createNewTeamV2(id, serverName, role, tournaments[0], (err, data) => {
                                    if (err) reject(err);
                                    else {
                                        logger.info(`V2 - Successfully registered player ('${id}') to Team ('${data.attrs.teamName}').`);
                                        registerDetails.registeredTeam = data.attrs;
                                        resolve(registerDetails);
                                    }
                                })
                            }
                        }
                    }
                }
            );
        })
    }

    registerWithSpecificTeam(id, serverName, tournaments, teamName) {
        return new Promise((resolve, reject) => {
            this.getTeams(serverName).then((teams) => {
                teams = teams.filter(team => team.tournamentName === tournaments[0].tournamentName
                    && team.tournamentDay === tournaments[0].tournamentDay);
                let foundTeam = teams.find(team => this.doesTeamNameMatch(teamName, team)
                    && team.players
                    && !team.players.includes(id)
                    && team.players.length < 5);
                let currentTeam = teams.find(team => team.players
                    && team.players.includes(id));
                logger.info(`Team to be assigned to : ('${JSON.stringify(foundTeam)}')...`);
                if (!foundTeam) {
                    resolve(foundTeam);
                }
                if (currentTeam) {
                    this.unregisterPlayerWithSpecificTeam(id, [currentTeam], serverName, reject);
                }
                let callback = (err, data) => {
                    if (err) reject(err);
                    else {
                        logger.info(`Successfully added user to Team ('${JSON.stringify(data.attrs.key)}').`);
                        foundTeam = data.attrs;
                        resolve(foundTeam);
                    }
                };
                this.addUserToTeam(id, foundTeam, callback);
            }).catch(err => reject(err));
        })
    }

    registerWithSpecificTeamV2(id, role, serverName, tournament, teamName) {
        return new Promise((resolve, reject) => {
            this.getTeamsV2(serverName).then((teams) => {
                teams = teams.filter(team => team.tournamentName === tournament[0].tournamentName
                    && team.tournamentDay === tournament[0].tournamentDay);
                let key = this.getKey(`Team ${teamName}`, serverName,
                    tournament[0].tournamentName, tournament[0].tournamentDay)
                let foundTeam = teams.find(team => team.key === key
                    && ((team.playersWRoles && !team.playersWRoles[role]) || !team.playersWRoles));
                let currentTeam = teams.find(team => this.isPlayerIsOnTeamV2(id, team));
                if (!foundTeam) {
                    logger.info(`V2 - Error - ('${key}') - Unable to join Team due to either dne or role is taken.`)
                    resolve(foundTeam);
                }
                let registrationDetails = {
                    unregisteredTeams: []
                };
                logger.info(`V2 - Team to be assigned to : ('${foundTeam.key}')...`);
                let callback = (err, data) => {
                    if (err) reject(err);
                    else {
                        logger.info(`V2 - Successfully added user to Team ('${data.key}') as role ('${role}').`);
                        registrationDetails.registeredTeam = data.attrs;
                        resolve(registrationDetails);
                    }
                };
                if (currentTeam) {
                    const unregisterCallback = (err, data) => {
                        if (err) reject(err);
                        else {
                            logger.info(`V2 - Successfully unregistered ('${id}') from ('${currentTeam.key}').`)
                            registrationDetails.unregisteredTeams = data.map(item => item.attrs);
                            this.addUserToTeamV2(id, role, foundTeam, callback);
                        }
                    };
                    this.unregisterPlayerWithSpecificTeamV2(id, [currentTeam],
                        unregisterCallback);
                } else {
                    this.addUserToTeamV2(id, role, foundTeam, callback);
                }
            }).catch(err => reject(err));
        });
    }

    isPlayerIsOnTeam(id, team) {
        return team.players && team.players.includes(id);
    }

    isPlayerIsOnTeamV2(id, team) {
        if (team.playersWRoles) {
            return Object.keys(team.playersWRoles).find(key => team.playersWRoles[key] === id);
        } else {
            return false;
        }
    }

    mapTeamsToTournamentsByPlayer(playerId, serverName) {
        return new Promise(resolve => {
            this.getTeams(serverName)
                .then(teams => this.buildTeamToTournamentByPlayerLogic(playerId, teams, null, resolve));
        })
    }

    mapTeamsToTournamentsByPlayerV2(playerId, serverName) {
        return new Promise(resolve => {
            this.getTeamsV2(serverName)
                .then(teams => this.buildTeamToTournamentByPlayerLogic(playerId, teams, 2, resolve));
        })
    }

    buildTeamToTournamentByPlayerLogic = (playerId, teams, version, callback) => {
        let teamByTournaments = teams.reduce((acc, team) => {
            let key = `${team.tournamentName}#${team.tournamentDay}`;
            if (!acc[key]) {
                acc[key] = {
                    availableTeams: [],
                    userTeam: {}
                }
            }
            let objectToUpdate = acc[key];
            if ((!version && this.isPlayerIsOnTeam(playerId, team)) ||
                (version = 2 && this.isPlayerIsOnTeamV2(playerId, team))) {
                objectToUpdate.userTeam = team;
            } else {
                objectToUpdate.availableTeams.push(team);
            }
            acc[key] = objectToUpdate;
            return acc
        }, {});
        callback(teamByTournaments);
    };

    doesTeamNameMatch(teamNameToSearch, team) {
        if (!teamNameToSearch || !team || !team.teamName) {
            return false;
        }
        let expectedName = team.teamName.toLowerCase();
        teamNameToSearch = teamNameToSearch.toLowerCase();
        return expectedName === teamNameToSearch || expectedName.includes(teamNameToSearch);
    }

    addUserToTeam(id, foundTeam, callback) {
        let params = {};
        params.UpdateExpression = 'ADD players :playerName';
        params.ExpressionAttributeValues = {
            ':playerName': dynamodb.Set([id], 'S')
        };
        this.Team.update({
            key: this.getKey(foundTeam.teamName,
                foundTeam.serverName,
                foundTeam.tournamentName,
                foundTeam.tournamentDay)
        }, params, (err, record) => callback(err, record));
    }

    addUserToTeamV2(id, role, teamToBeUpdated, callback) {
        let params = {};
        teamToBeUpdated.playersWRoles[role] = id;
        params.UpdateExpression = 'ADD players :playerName SET playersWRoles = :updatedRole';
        params.ExpressionAttributeValues = {
            ':playerName': dynamodb.Set([id], 'S'),
            ':updatedRole': teamToBeUpdated.playersWRoles
        };
        this.Team.update({
            key: this.getKey(teamToBeUpdated.teamName,
                teamToBeUpdated.serverName,
                teamToBeUpdated.tournamentName,
                teamToBeUpdated.tournamentDay)
        }, params, (err, record) => callback(err, record));
    }

    buildTeamLogic(tournaments, tournamentToTeamMap) {
        let teamToJoin;
        let currentTeams = [];
        let createNewTeam = false;
        let tournamentToUse;
        for (let i = 0; i < tournaments.length; i++) {
            tournamentToUse = tournaments[i];
            let key = `${tournamentToUse.tournamentName}#${tournamentToUse.tournamentDay}`;
            let teamDetailsForTournament = tournamentToTeamMap.get(key);
            if (!teamDetailsForTournament) {
                createNewTeam = true;
                break;
            } else {
                if (teamDetailsForTournament.availableTeams && teamDetailsForTournament.availableTeams.length > 0) {
                    teamToJoin = {
                        existingTeams: teamDetailsForTournament.availableTeams.filter(team => team.players),
                        emptyTeams: teamDetailsForTournament.availableTeams.filter(team => !team.players)
                    };
                    currentTeams = teamDetailsForTournament.teamCurrentlyOn;
                    break;
                } else {
                    if (teamDetailsForTournament.teamCurrentlyOn)
                        currentTeams.push(teamDetailsForTournament.teamCurrentlyOn)
                }
            }
        }
        return {teamToJoin, currentTeams, tournamentToUse, createNewTeam};
    }

    deregisterPlayer(id, serverName, tournaments) {
        return new Promise((resolve, reject) => {
            this.getTeams(serverName).then((data) => {
                let filter = [];
                data.forEach(record => {
                    if (record.players && record.players.includes(id)
                        && tournaments.some(tournament => tournament.tournamentName === record.tournamentName
                            && tournament.tournamentDay === record.tournamentDay)) {
                        filter.push(record);
                    }
                });
                if (filter.length > 0) {
                    this.unregisterPlayerWithSpecificTeam(id, filter, serverName, reject);
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    deregisterPlayerV2(id, serverName, tournaments) {
        return new Promise((resolve, reject) => {
            this.getTeamsV2(serverName).then((data) => {
                let teamsRemovedFrom = [];
                const callback = (err, response) => {
                    if (err) reject(err);
                    else {
                        response.forEach((items) => {
                            teamsRemovedFrom.push(items.attrs);
                        })
                        resolve(teamsRemovedFrom);
                    }
                };
                data = data.filter(record => {
                    let role = this.isPlayerIsOnTeamV2(id, record);
                    return role && tournaments.some(tournament => tournament.tournamentName === record.tournamentName
                        && tournament.tournamentDay === record.tournamentDay)
                });
                this.unregisterPlayerWithSpecificTeamV2(id, data, callback);
            });
        });
    }

    unregisterPlayerWithSpecificTeam(id, teamsToBeRemovedFrom, serverName, callback) {
        logger.info(`Unregistering ${id} from teams ('${teamsToBeRemovedFrom.map(team => team.teamName)}')...`);
        teamsToBeRemovedFrom.forEach(record => {
            logger.info(`Unregistering ${id} from team ('${record.teamName}')...`);
            let params = {};
            params.UpdateExpression = 'DELETE players :playerName';
            params.ConditionExpression = 'teamName = :nameOfTeam';
            params.ExpressionAttributeValues = {
                ':playerName': dynamodb.Set([id], 'S'),
                ':nameOfTeam': record.teamName,
            };
            this.Team.update({
                    key: this.getKey(record.teamName,
                        serverName,
                        record.tournamentName,
                        record.tournamentDay)
                },
                params,
                function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        logger.info(`Successfully unregistered ('${id}') from ('${record.teamName}').`);
                    }
                });
        });
    }

    unregisterPlayerWithSpecificTeamV2(id, teamsToBeRemovedFrom, callback) {
        logger.info(`V2 - Unregistering ('${id}') from teams ('${teamsToBeRemovedFrom.map(team => team.teamName)}')...`);
        let promises = [];
        teamsToBeRemovedFrom.forEach(record => {
            logger.info(`V2 - Unregistering ('${id}') from team ('${record.teamName}')...`);
            let role = this.isPlayerIsOnTeamV2(id, record);
            delete record.playersWRoles[role];
            let params = {};
            params.UpdateExpression = 'DELETE players :playerName SET playersWRoles = :updatedRole';
            params.ConditionExpression = 'teamName = :nameOfTeam';
            params.ExpressionAttributeValues = {
                ':playerName': dynamodb.Set([id], 'S'),
                ':nameOfTeam': record.teamName,
                ':updatedRole': record.playersWRoles,
            };
            promises.push(new Promise((resolve, reject) => {
                this.Team.update({
                        key: this.getKey(record.teamName,
                            record.serverName,
                            record.tournamentName,
                            record.tournamentDay)
                    },
                    params, (err, data) => {
                        if (err) reject(err);
                        else resolve(data);
                    });
            }));
        });
        Promise.all(promises).then((results) => {
            callback(undefined, results.flat());
        }).catch(err => callback(err));
    }

    getTeams(serverName) {
        return this.getTeamsByVersion(serverName);
    }

    getTeamsV2(serverName) {
        return this.getTeamsByVersion(serverName, 2);
    }

    getTeamsByVersion(serverName, version) {
        return new Promise((resolve, reject) => {
            let teams = [];
            let stream = this.Team.scan();
            if (serverName) {
                let filterExpression = '#serverName = :name';
                let expressionAttributeValues = {':name': `${serverName}`};
                let expressionAttributeNames = {'#serverName': 'serverName'};
                if (!version) {
                    filterExpression += ' AND attribute_not_exists(version)';
                } else {
                    filterExpression += ' AND #version = :versionNumber';
                    expressionAttributeValues[':versionNumber'] = version;
                    expressionAttributeNames['#version'] = 'version';
                }
                stream.filterExpression(filterExpression)
                    .expressionAttributeValues(expressionAttributeValues)
                    .expressionAttributeNames(expressionAttributeNames);
            }
            stream = stream.exec();
            stream.on('readable', function () {
                let read = stream.read();
                if (read) {
                    read.Items.forEach((data) => {
                        teams.push(data.attrs)
                    });
                }
            });
            stream.on('end', function () {
                resolve(teams);
            });
            stream.on('error', (err) => reject(err));
        });
    }

    retrieveTeamsByFilter({serverName, tournamentName, tournamentDay, teamName}) {
        return new Promise((resolve, reject) => {
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
                              rangeKey += `#${teamName}`;
                          }
                      }
                  }
                  filteringCriteria += ' - ' + rangeKey;
                stream = stream
                  .where('details')
                  .beginsWith(rangeKey);
              }
              logger.info('Searching for Team with criteria \'' + filteringCriteria + '\'...')
              stream = stream.exec();
            const teams = [];
            stream.on('readable', function () {
                let read = stream.read();
                if (read) {
                    logger.debug(`Scanned Count : '${read.ScannedCount}'`)
                    logger.debug(`Items Returned : '${read.Count}'`)
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
            stream.on('error', (err) => reject(err));
        });
    }

    createNewTeam(id, serverName, tournament, callback) {
        logger.info(`Creating new team for ${id} and Tournament ${tournament.tournamentName} and Day ${tournament.tournamentDay} since there are no available teams.`);
        let createTeam = {
            teamName: `Team ${retrieveName()}`,
            serverName: serverName,
            players: [id],
            tournamentName: tournament.tournamentName,
            tournamentDay: tournament.tournamentDay,
            startTime: tournament.startTime
        };
        createTeam.key = this.getKey(createTeam.teamName, serverName, tournament.tournamentName, tournament.tournamentDay);
        this.Team.update(createTeam, (err, data) => callback(err, data));
    }

    createNewTeamV2(id, serverName, role, tournament, callback) {
        logger.info(`V2 - Creating new team for ${id} and Tournament ${tournament.tournamentName} and Day ${tournament.tournamentDay} since there are no available teams...`);
        let playerWRoles = {};
        playerWRoles[role] = id;
        let createTeam = {
            teamName: `Team ${retrieveName()}`,
            serverName: serverName,
            playersWRoles: playerWRoles,
            players: [id],
            tournamentName: tournament.tournamentName,
            tournamentDay: tournament.tournamentDay,
            startTime: tournament.startTime,
            version: 2
        };
        createTeam.key = this.getKey(createTeam.teamName, serverName, tournament.tournamentName, tournament.tournamentDay);
        this.Team.update(createTeam, (err, data) => callback(err, data));
    }

    getKey(teamName, serverName, tournamentName, tournamentDay) {
        return `${teamName}#${serverName}#${tournamentName}#${tournamentDay}`;
    }

    findFirstAvailableTeam(id, tournaments, teams) {
        if (teams && teams.length > 0) {
            const tournamentTeams = teams.filter(data =>
                tournaments.some(record =>
                    record.tournamentName === data.tournamentName && record.tournamentDay === data.tournamentDay));
            let i;
            for (i = 0; i < tournamentTeams.length; i++) {
                if (!tournamentTeams[i].players
                    || (tournamentTeams[i].players
                        && tournamentTeams[i].players.length < 5
                        && !tournamentTeams[i].players.includes(id))) {
                    return tournamentTeams[i];
                }
            }
        }
    }

    filterAvailableTournaments(tournaments, id, teams) {
        if (teams && teams.length > 0) {
            let availableTournaments = [];
            let tournamentToPlayersMap = new Map();
            teams.forEach((team) => {
                if (team.players) {
                    let key = `${team.tournamentName}#${team.tournamentDay}`;
                    if (tournamentToPlayersMap.get(key)) {
                        tournamentToPlayersMap.get(key).push(...team.players);
                    } else {
                        tournamentToPlayersMap.set(key, team.players);
                    }
                }
            });
            tournaments.forEach((tournament) => {
                const players = tournamentToPlayersMap.get(`${tournament.tournamentName}#${tournament.tournamentDay}`);
                if (!players || !players.includes(id)) {
                    availableTournaments.push(tournament);
                }
            });
            return availableTournaments;
        }
        return tournaments;
    }
}

module.exports = new ClashTeamsDbImpl;
