require('dotenv').config();
const express = require('express');
const cors = require('cors');
const clashTeamsDbImpl = require('./dao/clash-teams-db-impl');
const clashTimeDbImpl = require('./dao/clash-time-db-impl');
const errorHandler = require('./utility/error-handler');
const app = express();
const urlPrefix = '/api';

let startUpApp = async () => {
    try {
        await Promise.all([
            clashTeamsDbImpl.initialize(),
            clashTimeDbImpl.initialize()]);

        app.use(express.json());
        app.use(cors())

        app.use((req, res, next) => {
            console.log(`Request Path ('${req.url}') Method ('${req.method}')`)
            next();
            console.log(`Response Path ('${req.url}') Status Code ('${res.statusCode}')`);
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

        app.get(`${urlPrefix}/health`, (req, res) => {
            res.send({
                status: 'Healthy'
            });
        })

        app.use((req, res) => {
            console.error(`Path not found ('${req.url}')`);
            res.statusCode = 404;
            res.json({ error: 'Path not found.'})
        })

        return app;
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = startUpApp;