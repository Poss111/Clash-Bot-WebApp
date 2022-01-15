const dynamodb = require('dynamodb');
const dynamoDbHelper = require('./impl/dynamo-db-helper');
const Joi = require('joi');
const names = require('../random-names');

class ClashTeamsDbImpl {
    Team;
    tableName = 'ClashTeam';

    constructor() {
    }

    initialize() {
        return new Promise((resolve, reject) => {
            dynamoDbHelper.initialize(this.tableName, {
                hashKey: 'key',
                timestamps: true,
                schema: {
                    key: Joi.string(),
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
                console.log(`Successfully setup table def for ('${this.tableName}')`);
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
                console.log(`# of teams pulled for server ('${teams.length}')`);
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
                console.log(`Number of Tournaments from Teams found => ('${tournamentToTeamMap.size}')`);
                console.log(`Requesting User ('${id}') Tournament To Use ('${tournamentToUseKey}')`);
                console.log(`Requesting User ('${id}') Available Team ('${JSON.stringify(availableTeam)}')`);
                console.log(`Requesting User ('${id}') Teams Currently on ('${JSON.stringify(teamsCurrentlyOn)}')`);
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
                            console.log(`Added ${id} to ${record.attrs.teamName}.`);
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
                        console.log(`Adding ${id} to first available team ${availableTeam.teamName}...`);
                        this.addUserToTeam(id, availableTeam, updateCallback);
                    } else {
                        this.createNewTeam(id, serverName, tournamentToUse, teams.length + 1, updateCallback);
                    }
                }
            });
        });
    }

    registerPlayerV2(id, role, serverName, tournaments) {
        return new Promise((resolve, reject) => {
            this.mapTeamsToTournamentsByPlayer(id, serverName).then(teamsToTournaments => {
                let reducedTeams = Object.values(teamsToTournaments).filter(record => record.userTeam
                    && record.userTeam.players
                    && record.userTeam.players.length === 1
                    && record.userTeam.playersWRoles
                    && Object.keys(record.userTeam.playersWRoles).length === 1);
                if (reducedTeams.length === tournaments.length) {
                    console.log(`V2 - Player ('${id}') is ineligible to create a new Team.`);
                    resolve();
                } else {
                    const teamForTournaments = teamsToTournaments[`${tournaments[0].tournamentName}#${tournaments[0].tournamentDay}`];
                    const callback = (err, data) => {
                        if (err) reject(err);
                        else resolve(data.attrs);
                    };
                    if (teamForTournaments && Array.isArray(teamForTournaments.availableTeams) && teamForTournaments.availableTeams.length > 0) {
                        // TODO Move this into separate method since it is reusable
                        let teamToModify = teamForTournaments.availableTeams[0];
                        teamToModify.players = [id];
                        teamToModify.playersWRoles = {};
                        teamToModify.playersWRoles[role] = id;
                        console.log(`V2 - Found undefined Team, Register Player ('${id}') to Team ('${teamToModify.teamName}') with Role ('${role}')...`)
                        this.Team.update(teamToModify, callback);
                    } else {
                        let nextTeamIndex = teamsToTournaments.length + 1;
                        if (!teamsToTournaments || !Array.isArray(teamsToTournaments)) {
                           nextTeamIndex = 0;
                        }
                        this.createNewTeamV2(id, serverName, role, tournaments[0], nextTeamIndex, callback);
                    }
                }
            });
        });
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
                console.log(`Team to be assigned to : ('${JSON.stringify(foundTeam)}')...`);
                if (!foundTeam) {
                    resolve(foundTeam);
                }
                if (currentTeam) {
                    this.unregisterPlayerWithSpecificTeam(id, [currentTeam], serverName, reject);
                }
                let callback = (err, data) => {
                    if (err) reject(err);
                    else {
                        console.log(`Successfully added user to Team ('${JSON.stringify(data)}').`);
                        foundTeam = data.attrs;
                        resolve(foundTeam);
                    }
                };
                this.addUserToTeam(id, foundTeam, callback);
            }).catch(err => reject(err));
        })
    }

    registerWithSpecificTeamV2(id, role, serverName, tournament, teamName){
        return new Promise((resolve, reject) => {
            this.getTeams(serverName).then((teams) => {
                teams = teams.filter(team => team.tournamentName === tournament.tournamentName
                    && team.tournamentDay === tournament.tournamentDay);
                let foundTeam = teams.find(team => team.key === this.getKey(teamName, serverName,
                    tournament.tournamentName, tournament.tournamentDay));
                let currentTeam = teams.find(team => this.isPlayerIsOnTeamV2(id, team));
                console.log(`V2 - Team to be assigned to : ('${foundTeam.key}')...`);
                if (!foundTeam) {
                    resolve(foundTeam);
                }
                if (currentTeam) {
                    const unregisterCallback = (err) => {
                        if (err) reject();
                        else console.log(`V2 - Successfully unregistered ('${id}') from ('${currentTeam.key}').`)
                    };
                    this.unregisterPlayerWithSpecificTeamV2(id, role, [currentTeam],
                        unregisterCallback);
                }
                let callback = (err, data) => {
                    if (err) reject(err);
                    else {
                        console.log(`V2 - Successfully added user to Team ('${data.key}') as role ('${role}').`);
                        foundTeam = data.attrs;
                        resolve(foundTeam);
                    }
                };
                this.addUserToTeamV2(id, role, foundTeam, callback);
            }).catch(err => reject(err));
        });
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
            this.getTeams(serverName).then(teams => {
                let teamByTournaments = teams.reduce((acc, team) => {
                    let key = `${team.tournamentName}#${team.tournamentDay}`;
                    if (!acc[key]) {
                        acc[key] = {
                            availableTeams: [],
                            userTeam: {}
                        }
                    }
                    let objectToUpdate = acc[key];
                    if ((team.players && team.players.includes(playerId))
                        || (team.playersWRoles && Object.values(team.playersWRoles).includes(playerId))) {
                        objectToUpdate.userTeam = team;
                    } else {
                        objectToUpdate.availableTeams.push(team);
                    }
                    acc[key] = objectToUpdate;
                    return acc
                }, {});
                resolve(teamByTournaments);
            });
        })
    }

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
        params.UpdateExpression = 'ADD players :playerName, SET #playersWRoles = :updatedRole';
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

    unregisterPlayerWithSpecificTeam(id, teamsToBeRemovedFrom, serverName, callback) {
        console.log(`Unregistering ${id} from teams ('${teamsToBeRemovedFrom.map(team => team.teamName)}')...`);
        teamsToBeRemovedFrom.forEach(record => {
            console.log(`Unregistering ${id} from team ('${record.teamName}')...`);
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
                        console.log(`Successfully unregistered ('${id}') from ('${record.teamName}').`);
                    }
                });
        });
    }

    unregisterPlayerWithSpecificTeamV2(id, role, teamsToBeRemovedFrom, callback) {
        console.log(`V2 - Unregistering ('${id}') from teams ('${teamsToBeRemovedFrom.map(team => team.teamName)}')...`);
        teamsToBeRemovedFrom.forEach(record => {
            console.log(`V2 - Unregistering ('${id}') from team ('${record.teamName}')...`);
            delete record.playersWRoles[role];
            let params = {};
            params.UpdateExpression = 'DELETE players :playerName, SET #playersWRoles = :updatedRole';
            params.ConditionExpression = 'teamName = :nameOfTeam';
            params.ExpressionAttributeValues = {
                ':playerName': dynamodb.Set([id], 'S'),
                ':nameOfTeam': record.teamName,
                ':updatedRole': record.playersWRoles,
            };
            this.Team.update({
                    key: this.getKey(record.teamName,
                        record.serverName,
                        record.tournamentName,
                        record.tournamentDay)
                },
                params,
                callback);
        });
    }

    getTeams(serverName) {
        return new Promise((resolve, reject) => {
            let teams = [];
            let stream = this.Team.scan();
            if (serverName) {
                stream.filterExpression('#serverName = :name')
                    .expressionAttributeValues({':name': `${serverName}`})
                    .expressionAttributeNames({'#serverName': 'serverName'})
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

    createNewTeam(id, serverName, tournament, number, callback) {
        console.log(`Creating new team for ${id} and Tournament ${tournament.tournamentName} and Day ${tournament.tournamentDay} since there are no available teams.`);
        let name = names[number];
        let createTeam = {
            teamName: `Team ${name}`,
            serverName: serverName,
            players: [id],
            tournamentName: tournament.tournamentName,
            tournamentDay: tournament.tournamentDay,
            startTime: tournament.startTime
        };
        createTeam.key = this.getKey(createTeam.teamName, serverName, tournament.tournamentName, tournament.tournamentDay);
        this.Team.update(createTeam, (err, data) => callback(err, data));
    }

    createNewTeamV2(id, serverName, role, tournament, number, callback) {
        console.log(`V2 - Creating new team for ${id} and Tournament ${tournament.tournamentName} and Day ${tournament.tournamentDay} since there are no available teams.`);
        let name = names[number];
        let playerWRoles = {};
        playerWRoles[role] = id;
        let createTeam = {
            teamName: `Team ${name}`,
            serverName: serverName,
            playersWRoles: playerWRoles,
            players: [id],
            tournamentName: tournament.tournamentName,
            tournamentDay: tournament.tournamentDay,
            startTime: tournament.startTime,
            version: '2'
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
