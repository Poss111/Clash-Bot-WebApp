const express = require('express');
const cors = require('cors')
const app = express();
const port = 80;
const urlPrefix = 'api';

app.use(cors())

app.get(`${urlPrefix}/teams`, (req, res) => {
    res.send([
        {
            teamName: 'Team Abra',
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
            teamName: 'Team Behaviour',
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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})
