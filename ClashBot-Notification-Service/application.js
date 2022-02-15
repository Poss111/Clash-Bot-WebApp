require('dotenv').config();
const clashBotNotificationServiceImpl = require('./service/clash-bot-notification-service-impl');
const clashBotNotificationDbImpl = require('./dao/clash-bot-notification-db-impl');
const express = require('express');
const cors = require('cors');
const app = express();
const pino = require('pino-http')();
const urlPrefix = '/api/notifications';

let startUpApp = async () => {

    try {

        await Promise.all([clashBotNotificationDbImpl.initialize()]);

        app.use(express.json());
        app.use(cors());
        app.use(pino);

        app.get(`${urlPrefix}/health`, (req, res) => {
            res.json({
                status: 'Healthy'
            });
        })

        app.get(urlPrefix, (req, res) => {
            if (!req.query.id) {
                res.statusCode = 400;
                res.json({error: "Missing required parameter."})
            } else {
                clashBotNotificationServiceImpl.retrieveNotificationsForUser(req.query.id).then((userNotifications) => {
                    res.json(userNotifications);
                });
            }
        })

        app.use((req, res) => {
            req.log.error(`Path not found ('${req.url}')`);
            res.statusCode = 404;
            res.json({error: 'Path not found.'})
        })
        return app;
    } catch (err) {
        logger.error('Failed to start Notification Service due to error.', err);
    }
};

module.exports.startUpApp = startUpApp;
