require('dotenv').config();
const express = require('express');
const cors = require('cors');
const clashTeamsDbImpl = require('./clash-teams-db-impl');
const clashTimeDbImpl = require('./clash-time-db-impl');
const app = express();
const port = 80;
const urlPrefix = '/api';

Promise.all([
    clashTeamsDbImpl.initialize(),
    clashTimeDbImpl.initialize()])
    .then(() => {
        app.use(cors())

        app.use((req, res, next) => {
            console.log(`Request Path ('${req.url}') Method ('${req.method}')`)
            next();
            console.log(`Response Path ('${req.url}') Status Code ('${res.statusCode}')`);
        })

        app.get(`${urlPrefix}/teams/:serverName?`, (req, res) => {
            console.log(`Querying for servers : ${req.params.serverName}`);
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
                    res.send(payload);
                }
            ).catch(err => console.error(err));
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
            }).catch(err => console.error(err));
        })

        app.get(`${urlPrefix}/health`, (req, res) => {
            res.send({
                status: 'Healthy'
            });
        })

        app.use((req, res, next) => {
            console.error(`Path not found ('${req.url}')`)
            res.status(404).send("Sorry can't find that!");
            next();
        })

        app.listen(port, () => {
            console.log(`Starting instance with prefix ${urlPrefix}...`);
            console.log(`Clash Bot Service up and running on Port ('${port}')!`);
        });
    });
