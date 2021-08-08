require('dotenv').config();
const express = require('express');
const cors = require('cors');
const clashTeamsDbImpl = require('./clash-teams-db-impl');
const app = express();
const port = 80;
const urlPrefix = '/api';

clashTeamsDbImpl.initialize().then(() => {
    app.use(cors())

    app.use((req, res, next) => {
        console.log(`Request Path ('${req.url}') Method ('${req.method}')`)
        next();
    })

    app.get(`${urlPrefix}/teams`, (req, res) => {
        console.log('Returning team information...');
        clashTeamsDbImpl.getTeams('Goon Squad').then((data) => {
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
                            playersDetails: Array.isArray(team.players) ? team.players.map(data => {
                                return {name: data }
                            }) : {}
                        });
                    }
                });
                res.send(payload);
            }
        ).catch(err => console.error(err));
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
