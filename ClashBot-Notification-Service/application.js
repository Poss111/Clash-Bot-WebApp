require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const pino  = require('pino-http')();
const urlPrefix = '/api/notifications';

let startUpApp = async () => {

    app.use(express.json());
    app.use(cors());
    app.use(pino);

    app.get(`${urlPrefix}/health`, (req, res) => {
        res.json({
            status: 'Healthy'
        });
    })

    app.use((req, res) => {
        req.log.error(`Path not found ('${req.url}')`);
        res.statusCode = 404;
        res.json({error: 'Path not found.'})
    })
    return app;
};

module.exports.startUpApp = startUpApp;
