require('dotenv').config();
const express = require('express');
const cors = require('cors');
const clashTeamsDbImpl = require('./dao/clash-teams-db-impl');
const clashTimeDbImpl = require('./dao/clash-time-db-impl');
const clashUserDbImpl = require('./dao/clash-subscription-db-impl');
const errorHandler = require('./utility/error-handler');
const app = express();
const urlPrefix = '/api';

let startUpApp = async () => {
    try {
        await Promise.all([
            clashTeamsDbImpl.initialize(),
            clashTimeDbImpl.initialize(),
            clashUserDbImpl.initialize()]);

        app.use(express.json());
        app.use(cors())

        app.use((req, res, next) => {
            console.log(`Request Path ('${req.url}') Method ('${req.method}')`)
            next();
            console.log(`Response Path ('${req.url}') Status Code ('${res.statusCode}')`);
        })

        let convertTeamDbToTeamPayload = (expectedNewTeam) => {
            return {
                teamName: expectedNewTeam.teamName,
                tournamentDetails: {
                    tournamentName: expectedNewTeam.tournamentName,
                    tournamentDay: expectedNewTeam.tournamentDay
                },
                serverName: expectedNewTeam.serverName,
                startTime: expectedNewTeam.startTime,
                playersDetails: Array.isArray(expectedNewTeam.players) ? expectedNewTeam.players.map(data => {
                    return {name: data}
                }) : {}
            };
        }

        app.post(`${urlPrefix}/team`, (req, res) => {
            if (!req.body.username || !req.body.id) {
                res.statusCode = 400;
                res.json({error: 'Missing User to persist.'});
            } else if (!req.body.serverName) {
                res.statusCode = 400;
                res.json({error: 'Missing Server to persist with.'});
            } else if (!req.body.tournamentName || !req.body.tournamentDay) {
                res.statusCode = 400;
                res.json({error: 'Missing Tournament Details to persist with.'});
            } else if (!req.body.startTime) {
                res.statusCode = 400;
                res.json({error: 'Missing Tournament start time to persist.'});
            } else {
                clashTeamsDbImpl.registerPlayer(req.body.username, req.body.serverName, [{
                    tournamentName: req.body.tournamentName,
                    tournamentDay: req.body.tournamentDay,
                    startTime: req.body.startTime
                }]).then((newTeam) => {
                    if (Array.isArray(newTeam) && newTeam[0].exist) {
                        res.statusCode = 400;
                        res.json({error: 'Player is not eligible to create a new Team.'});
                    } else {
                        res.json(convertTeamDbToTeamPayload(newTeam));
                    }
                }).catch(err => {
                    console.error(err);
                    errorHandler.errorHandler(res, 'Failed to create new Team.');
                });
            }
        })

        app.get(`${urlPrefix}/teams/:serverName?`, (req, res) => {
            if (req.params.serverName) {
                console.log(`Querying for server : ('${req.params.serverName}')...`);
            } else {
                console.log('Querying for all teams...');
            }
            clashTeamsDbImpl.getTeams(req.params.serverName).then((data) => {
                    console.log('Successfully retrieved teams.');
                    console.log(JSON.stringify(data));
                    let payload = [];
                    data.forEach(team => {
                        if (team && team.players) {
                            payload.push({
                                teamName: team.teamName,
                                tournamentDetails: {
                                    tournamentName: team.tournamentName,
                                    tournamentDay: team.tournamentDay
                                },
                                serverName: team.serverName,
                                startTime: team.startTime,
                                playersDetails: Array.isArray(team.players) ? team.players.map(data => {
                                    return {name: data}
                                }) : {}
                            });
                        }
                    });
                    res.json(payload);
                }
            ).catch(err => {
                console.error(err);
                errorHandler.errorHandler(res, 'Failed to retrieve Teams.');
            });
        })

        app.post(`${urlPrefix}/team/register`, (req, res) => {
            if (!req.body.username || !req.body.id) {
                res.statusCode = 400;
                res.json({error: 'Missing User to persist.'});
            } else if (!req.body.teamName) {
                res.statusCode = 400;
                res.json({error: 'Missing Team to persist with.'});
            } else if (!req.body.serverName) {
                res.statusCode = 400;
                res.json({error: 'Missing Server to persist with.'});
            } else if (!req.body.tournamentName || !req.body.tournamentDay) {
                res.statusCode = 400;
                res.json({error: 'Missing Tournament Details to persist with.'});
            } else {
                console.log(`Received request to add User ('${req.body.id}') to Team ('${req.body.teamName}') with Server ('${req.body.serverName}') for Tournament ('${req.body.tournamentName}') and Day ('${req.body.tournamentDay}')`);
                let teamName = req.body.teamName.split(' ')[1];
                clashTeamsDbImpl.registerWithSpecificTeam(req.body.username, req.body.serverName, [{
                    tournamentName: req.body.tournamentName,
                    tournamentDay: req.body.tournamentDay
                }], teamName).then(data => {
                    let payload;
                    if (!data) {
                        res.statusCode = 400;
                        payload = {error: 'Unable to find the Team requested to be persisted.'};
                    } else {
                        payload = {
                            teamName: data.teamName,
                            tournamentDetails: {
                                tournamentName: data.tournamentName,
                                tournamentDay: data.tournamentDay
                            },
                            serverName: data.serverName,
                            startTime: data.startTime,
                            playersDetails: Array.isArray(data.players) ? data.players.map(player => {
                                return {name: player}
                            }) : {}
                        };
                    }
                    res.json(payload);
                }).catch(err => {
                    console.error(err);
                    errorHandler.errorHandler(res, 'Failed to persist User to Team.')
                });
            }
        })

        app.delete(`${urlPrefix}/team/register`, (req, res) => {
            if (!req.body.username || !req.body.id) {
                res.statusCode = 400;
                res.json({error: 'Missing User to unregister with.'});
            } else if (!req.body.teamName) {
                res.statusCode = 400;
                res.json({error: 'Missing Team to unregister from.'});
            } else if (!req.body.serverName) {
                res.statusCode = 400;
                res.json({error: 'Missing Server to unregister Team with.'});
            } else if (!req.body.tournamentName || !req.body.tournamentDay) {
                res.statusCode = 400;
                res.json({error: 'Missing Tournament Details to unregister with.'});
            } else {
                clashTeamsDbImpl.deregisterPlayer(req.body.username, req.body.serverName, [{
                    tournamentName: req.body.tournamentName,
                    tournamentDay: req.body.tournamentDay
                }]).then((data) => {
                    let payload = {message: 'Successfully removed from Team.'};
                    if (!data) {
                        res.statusCode = 400;
                        payload = {error: 'User not found on requested Team.'};
                    }
                    res.json(payload);
                }).catch(err => {
                    console.error(err);
                    errorHandler.errorHandler(res, 'Failed to unregister User from Team due.')
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
                errorHandler.errorHandler(res, 'Failed to retrieve Clash Tournament times.');
            });
        })

        app.get(`${urlPrefix}/user`, (req, res) => {
            console.log(req.query.id)
            if (!req.query.id) {
                res.statusCode = 400;
                res.json({error: 'Missing required query parameter.'});
            } else {
                clashUserDbImpl.retrieveUserDetails(req.query.id).then(data => {
                    let payload = {
                        username: data.username,
                        id: data.key,
                        serverName: data.serverName,
                        preferredChampions: data.preferredChampions,
                        subscriptions: {
                            'UpcomingClashTournamentDiscordDM': !!data.subscribed
                        }
                    };
                    res.json(payload);
                }).catch(err => {
                    console.error(err);
                    errorHandler.errorHandler(res, 'Failed to retrieve User.');
                })
            }
        })

        app.post(`${urlPrefix}/user`, (req, res) => {
            if (!req.body.id) {
                res.statusCode = 400;
                res.json({error: 'Missing required User Id'});
            } else if (!req.body.serverName) {
                res.statusCode = 400;
                res.json({error: 'Missing required Server Name'});
            } else if (!req.body.preferredChampions) {
                res.statusCode = 400;
                res.json({error: 'Missing required Preferred Champions'});
            }  else if (!req.body.subscriptions) {
                res.statusCode = 400;
                res.json({error: 'Missing required Subscriptions'});
            } else {
                clashUserDbImpl.createUpdateUserDetails(req.body.id,
                    req.body.serverName,
                    req.body.preferredChampions,
                    req.body.subscriptions.UpcomingClashTournamentDiscordDM)
                    .then(data => {
                        let payload = {
                            id: data.key,
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
                    errorHandler.errorHandler(res, 'Failed to retrieve User.');
                })
            }
        })

        app.get(`${urlPrefix}/tentative`, (req, res) => {
            console.log(req.query.serverName);
            res.json([{
                tournamentDetails: {
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1'
                },
                tentativePlayers: [{
                    name: 'Roidrage'
                }]
            }]);
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

module.exports = startUpApp;
