require('dotenv').config();
const express = require('express');
const cors = require('cors');
const application = express();
const pino  = require('pino-http')();
const urlPrefix = '/api/notifications';

let startUpApp = async () => {

    application.use(express.json());
    application.use(cors());
    application.use(pino);

    application.get(`${urlPrefix}/health`, (req, res) => {
        res.json({
            status: 'Healthy'
        });
    })

    application.use((req, res) => {
        req.log.error(`Path not found ('${req.url}')`);
        res.statusCode = 404;
        res.json({error: 'Path not found.'})
    })
};

module.exports.startUpApp = startUpApp;
