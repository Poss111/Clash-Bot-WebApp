const express = require('express');
const cors = require('cors')
const app = express();
const port = 80;
const urlPrefix = '/api';

app.use(cors())

app.use((req, res, next) => {
    console.log(`Request Path ('${req.url}') Method ('${req.method}')`)
    next();
})

app.get(`${urlPrefix}/teams`, (req, res) => {
    console.log('Returning team information...');
    res.send([
        {
            teamName: 'Team Charizard',
            tournamentDetails: {
                tournamentName: 'Bandle City',
                tournamentDay: '1'
            },
            playersDetails: [
                {
                    name: 'Roïdräge',
                    champions: ['Volibear', 'Ornn', 'Sett'],
                    role: 'Top'
                },
                {
                    name: 'TheIncentive',
                    champions: ['Lucian'],
                    role: 'ADC'
                },
                {
                    name: 'Pepe Conrad',
                    champions: ['Lucian'],
                    role: 'Jg'
                }
            ]
        },
        {
            teamName: 'Team Rayquaza',
            tournamentDetails: {
                tournamentName: 'Bandle City',
                tournamentDay: '2'
            },
            playersDetails: [
                {
                    name: 'Roïdräge',
                    champions: ['Volibear', 'Ornn', 'Sett'],
                    role: 'Top'
                },
                {
                    name: 'TheIncentive',
                    champions: ['Lucian'],
                    role: 'ADC'
                },
                {
                    name: 'Pepe Conrad',
                    champions: ['Lucian'],
                    role: 'Jg'
                }
            ]
        }
    ]);
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
})
