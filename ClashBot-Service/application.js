require('dotenv').config();
const express = require('express');
const cors = require('cors');
const clashTeamsDbImpl = require('./dao/clash-teams-db-impl');
const clashTimeDbImpl = require('./dao/clash-time-db-impl');
const clashUserDbImpl = require('./dao/clash-subscription-db-impl');
const clashTentativeDbImpl = require('./dao/clash-tentative-db-impl');
const clashTeamsServiceImpl = require('./service/clash-teams-service-impl');
const {errorHandler, badRequestHandler} = require('./utility/error-handler');
const app = express();
const urlPrefix = '/api';

let startUpApp = async () => {
    try {
        await Promise.all([
            clashTeamsDbImpl.initialize(),
            clashTimeDbImpl.initialize(),
            clashUserDbImpl.initialize(),
            clashTentativeDbImpl.initialize()]);

        app.use(express.json());
        app.use(cors())

        app.use((req, res, next) => {
            console.log(`Request Path ('${req.url}') Method ('${req.method}')`)
            next();
            console.log(`Response Path ('${req.url}') Status Code ('${res.statusCode}')`);
        })

        app.post(`${urlPrefix}/team`, (req, res) => {
            if (!req.body.id) {
                badRequestHandler(res, 'Missing User to persist.');
            } else if (!req.body.serverName) {
                badRequestHandler(res, 'Missing Server to persist with.');
            } else if (!req.body.tournamentName || !req.body.tournamentDay) {
                badRequestHandler(res, 'Missing Tournament Details to persist with.');
            } else if (!req.body.startTime) {
                badRequestHandler(res, 'Missing Tournament start time to persist.');
            } else {
                clashTeamsServiceImpl.createNewTeam(req.body.id, req.body.serverName, req.body.tournamentName, req.body.tournamentDay, req.body.startTime)
                    .then((responsePayload) => {
                        if (responsePayload.error) {
                            res.statusCode = 400;
                        }
                        res.json(responsePayload);
                    })
                    .catch(err => {
                        console.error(err);
                        errorHandler(res, 'Failed to create new Team.');
                    });
            }
        })

        app.get(`${urlPrefix}/teams/:serverName?`, (req, res) => {
            if (req.params.serverName) {
                console.log(`Querying for server : ('${req.params.serverName}')...`);
            } else {
                console.log('Querying for all teams...');
            }
            clashTimeDbImpl.findTournament().then(activeTournaments => {
                clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(req.params.serverName, activeTournaments)
                    .then(payload => res.json(payload))
                    .catch(err => {
                        console.error(err);
                        errorHandler(res, 'Failed to retrieve Teams.');
                    });
            }).catch(err => {
                console.error(err);
                errorHandler(res, 'Failed to retrieve active Tournaments.');
            });
        })

        app.post(`${urlPrefix}/team/register`, (req, res) => {
            if (!req.body.id) {
                badRequestHandler(res, 'Missing User to persist.');
            } else if (!req.body.teamName) {
                badRequestHandler(res, 'Missing Team to persist with.');
            } else if (!req.body.serverName) {
                badRequestHandler(res, 'Missing Server to persist with.');
            } else if (!req.body.tournamentName || !req.body.tournamentDay) {
                badRequestHandler(res, 'Missing Tournament Details to persist with.');
            } else {
                console.log(`Received request to add User ('${req.body.id}') to Team ('${req.body.teamName}') with Server ('${req.body.serverName}') for Tournament ('${req.body.tournamentName}') and Day ('${req.body.tournamentDay}')`);
                let teamName = req.body.teamName.split(' ')[1];
                clashTeamsServiceImpl.registerWithTeam(req.body.id, teamName, req.body.serverName, req.body.tournamentName, req.body.tournamentDay)
                    .then(data => {
                        if (data.error) res.statusCode = 400
                        res.json(data);
                    }).catch(err => {
                    console.error(err);
                    errorHandler(res, 'Failed to persist User to Team.')
                });
            }
        })

        app.delete(`${urlPrefix}/team/register`, (req, res) => {
            if (!req.body.id) {
                badRequestHandler(res, 'Missing User to unregister with.');
            } else if (!req.body.teamName) {
                badRequestHandler(res, 'Missing Team to unregister from.');
            } else if (!req.body.serverName) {
                badRequestHandler(res, 'Missing Server to unregister Team with.');
            } else if (!req.body.tournamentName || !req.body.tournamentDay) {
                badRequestHandler(res, 'Missing Tournament Details to unregister with.');
            } else {
                clashTeamsServiceImpl.unregisterFromTeam(req.body.id, req.body.serverName, req.body.tournamentName, req.body.tournamentDay)
                    .then((data) => {
                        let payload = {message: 'Successfully removed from Team.'};
                        if (data.error) {
                            res.statusCode = 400;
                            payload = {error: 'User not found on requested Team.'};
                        }
                        res.json(payload);
                    }).catch(err => {
                    console.error(err);
                    errorHandler(res, 'Failed to unregister User from Team due.')
                });
            }
        })

        app.get(`${urlPrefix}/tournaments`, (req, res) => {
            clashTimeDbImpl.findTournament().then(tournaments => {
                let tournamentsPayload = [];
                tournaments.forEach(tournament => {
                    tournamentsPayload.push({
                        tournamentName: tournament.tournamentName,
                        tournamentDay: tournament.tournamentDay,
                        startTime: tournament.startTime,
                        registrationTime: tournament.registrationTime
                    });
                });
                res.send(tournamentsPayload);
            }).catch(err => {
                console.error(err);
                errorHandler(res, 'Failed to retrieve Clash Tournament times.');
            });
        })

        app.get(`${urlPrefix}/user`, (req, res) => {
            console.log(req.query.id)
            if (!req.query.id) {
                badRequestHandler(res, 'Missing required query parameter.');
            } else {
                clashUserDbImpl.retrieveUserDetails(req.query.id).then(data => {
                    let payload = {
                        id: data.key,
                        username: data.playerName,
                        serverName: data.serverName,
                        preferredChampions: data.preferredChampions,
                        subscriptions: {
                            'UpcomingClashTournamentDiscordDM': !!data.subscribed
                        }
                    };
                    res.json(payload);
                }).catch(err => {
                    console.error(err);
                    errorHandler(res, 'Failed to retrieve User.');
                })
            }
        })

        app.post(`${urlPrefix}/user`, (req, res) => {
            if (!req.body.id) {
                badRequestHandler(res, 'Missing required User Id');
            } else if (!req.body.playerName) {
                badRequestHandler(res, 'Missing required User Details');
            } else if (!req.body.serverName) {
                badRequestHandler(res, 'Missing required Server Name');
            } else if (!req.body.preferredChampions) {
                badRequestHandler(res, 'Missing required Preferred Champions');
            } else if (!req.body.subscriptions) {
                badRequestHandler(res, 'Missing required Subscriptions');
            } else {
                clashUserDbImpl.createUpdateUserDetails(req.body.id,
                    req.body.serverName,
                    req.body.playerName,
                    req.body.preferredChampions,
                    req.body.subscriptions.UpcomingClashTournamentDiscordDM)
                    .then(data => {
                        let payload = {
                            id: data.key,
                            username: data.playerName,
                            serverName: data.serverName,
                            preferredChampions: data.preferredChampions,
                        };
                        if (!data.subscribed) {
                            payload.subscriptions = {
                                UpcomingClashTournamentDiscordDM: false
                            }
                        } else {
                            payload.subscriptions = {
                                UpcomingClashTournamentDiscordDM: true
                            }
                        }
                        res.json(payload);
                    }).catch(err => {
                    console.error(err);
                    errorHandler(res, 'Failed to retrieve User.');
                })
            }
        })

        app.get(`${urlPrefix}/tentative`, (req, res) => {
            if (!req.query.serverName) {
                badRequestHandler(res, 'Missing required query parameter.');
            } else {
                console.log(req.query.serverName);
                clashTimeDbImpl.findTournament().then((tournaments) => {
                    let queries = [];
                    tournaments.forEach(tournament => queries.push(clashTentativeDbImpl.getTentative(req.query.serverName, tournament)));
                    Promise.all(queries)
                        .then(result => {
                            let payload = [];
                            let userQueries = [];
                            result.forEach(tentativeRecord => {
                                if (tentativeRecord) {
                                    tournaments.splice(tournaments.findIndex(tournament => tournament.tournamentName === tentativeRecord.tournamentDetails.tournamentName
                                        && tournament.tournamentDay === tentativeRecord.tournamentDetails.tournamentDay), 1);
                                    userQueries.push(...tentativeRecord.tentativePlayers);

                                    payload.push({
                                            serverName: tentativeRecord.serverName,
                                            tournamentDetails: {
                                                tournamentName: tentativeRecord.tournamentDetails.tournamentName,
                                                tournamentDay: tentativeRecord.tournamentDetails.tournamentDay
                                            },
                                            tentativePlayers: tentativeRecord.tentativePlayers
                                        }
                                    )
                                }
                            })
                            if (tournaments.length > 0) {
                                tournaments.forEach(tournament => payload.push({
                                    serverName: req.query.serverName,
                                    tournamentDetails: {
                                        tournamentName: tournament.tournamentName,
                                        tournamentDay: tournament.tournamentDay
                                    },
                                    tentativePlayers: []
                                }));
                            }
                            if (userQueries.length > 0) {
                                clashUserDbImpl.retrievePlayerNames(Array.from(new Set(userQueries))).then((data) => {
                                    payload.forEach(record => record.tentativePlayers = record.tentativePlayers.map(record => data[record] ? data[record] : record));
                                    res.json(payload);
                                })
                            } else {
                                res.json(payload);
                            }
                        }).catch(err => {
                        console.error(err);
                        errorHandler(res, 'Failed to pull all Tentative players for current Tournaments.');
                    });
                }).catch((err) => {
                    console.error(err);
                    errorHandler(res, 'Failed to pull all Tentative players for current Tournaments.');
                });
            }
        })

        app.post(`${urlPrefix}/tentative`, (req, res) => {
            if (!req.body.id || !req.body.serverName
                || !req.body.tournamentDetails
                || !req.body.tournamentDetails.tournamentName
                || !req.body.tournamentDetails.tournamentDay) {
                badRequestHandler(res, 'Missing required request parameter.');
            } else {
                clashTentativeDbImpl.handleTentative(req.body.id, req.body.serverName, req.body.tournamentDetails)
                    .then((record) => {
                        clashUserDbImpl.retrievePlayerNames(Array.from(new Set(record.tentativePlayers)))
                            .then((results) => {
                                let tentativePlayers = [];
                                record.tentativePlayers.forEach((userId) => {
                                    if (results[userId]) {
                                        tentativePlayers.push(results[userId]);
                                    } else {
                                        tentativePlayers.push(userId);
                                    }
                                })
                                res.json({
                                    serverName: record.serverName,
                                    tournamentDetails: record.tournamentDetails,
                                    tentativePlayers: tentativePlayers
                                })
                            }).catch((err) => {
                            console.error(err);
                            errorHandler(res, 'Failed to retrieve mapped usernames.');
                        });
                    }).catch((err) => {
                    console.error(err);
                    errorHandler(res, 'Failed to update Tentative record.');
                });
            }
        })

        app.get(`${urlPrefix}/health`, (req, res) => {
            res.json({
                status: 'Healthy'
            });
        })

        app.use((req, res) => {
            console.error(`Path not found ('${req.url}')`);
            res.statusCode = 404;
            res.json({error: 'Path not found.'})
        })

        return app;
    } catch (err) {
        throw new Error(err);
    }
}

let convertTeamDbToTeamPayload = (expectedNewTeam, idsToNameList) => {
    return {
        teamName: expectedNewTeam.teamName,
        tournamentDetails: {
            tournamentName: expectedNewTeam.tournamentName,
            tournamentDay: expectedNewTeam.tournamentDay
        },
        serverName: expectedNewTeam.serverName,
        startTime: expectedNewTeam.startTime,
        playersDetails: Array.isArray(expectedNewTeam.players) ? expectedNewTeam.players.map(data => {
            return {name: !idsToNameList[data] ? data : idsToNameList[data]}
        }) : {}
    };
}

module.exports.startUpApp = startUpApp;
module.exports.convertTeamDbToTeamPayload = convertTeamDbToTeamPayload;
