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
                hashKey: 'serverName',
                rangeKey: 'teamDetails',
                timestamps: true,
                schema: {
                    teamDetails: Joi.string(),
                    teamName: Joi.string(),
                    serverName: Joi.string(),
                    players: dynamodb.types.stringSet(),
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
                console.log(JSON.stringify(teams));
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
            serverName: foundTeam.serverName, teamDetails: this.getKey(foundTeam.teamName,
                foundTeam.serverName,
                foundTeam.tournamentName,
                foundTeam.tournamentDay)
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

    getTeams(serverName, tournamentName, tournamentDay) {
        return new Promise((resolve, reject) => {
            let query = this.Team.query(serverName);
            let queryParameter;
            if (tournamentName) {
                queryParameter = tournamentName;
            } if (tournamentDay) {
                queryParameter += `#${tournamentDay}`;
            }
            if (queryParameter) {
                console.log(`Querying for Team that match :: '${queryParameter}...'`);
                query.where('teamDetails')
                    .beginsWith(queryParameter)
                    .exec(this.parseDynamoResponse(reject, resolve));
            } else {
                query.exec(this.parseDynamoResponse(reject, resolve));
            }
        });
    }

    retrieveTeamsBasedOnTournaments(serverName, tournaments) {
        let calls = [];
        for (let i in tournaments) {
            calls.push(this.getTeams(serverName, tournaments[i].tournamentName, tournaments[i].tournamentDay));
        }
        return new Promise((resolve, reject) =>
            Promise.all(calls)
                .then((arrayOfArrayOfTeams) => {
                    resolve([...new Set([].concat(...arrayOfArrayOfTeams))]);
                })
                .catch(err => reject(err)));
    }

    parseDynamoResponse(reject, resolve) {
        return (err, team) => {
            if (err) reject(err);
            let teams = [];
            console.log(`Scanned a total of '${team.ScannedCount}' records`)
            if (team && Array.isArray(team.Items)) {
                team.Items.forEach((data) => {
                    teams.push(data.attrs)
                });
            } else {
                teams.push(team.attrs)
            }
            resolve(teams);
        };
    }

    createNewTeam(id, serverName, tournament, number, callback) {
        console.log(`Creating new team for ${id} and Tournament ${tournament.tournamentName} and Day ${tournament.tournamentDay} since there are no available teams.`);
        let name = names[number];
        let createTeam = {
            teamName: name,
            serverName: serverName,
            players: [id],
            tournamentName: tournament.tournamentName,
            tournamentDay: tournament.tournamentDay,
            startTime: tournament.startTime
        };
        createTeam.teamDetails = `${tournament.tournamentName}#${tournament.tournamentDay}#${name}`;
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
