require('dotenv').config();
const clashBotNotificationServiceImpl = require('./service/clash-bot-notification-service-impl');
const clashBotNotificationDbImpl = require('./dao/clash-bot-notification-db-impl');
const express = require('express');
const cors = require('cors');
const app = express();
const pinoHttp = require('pino-http')();
const pino = require('pino');
const urlPrefix = '/api/notifications';
const redis = require('redis');

let startUpApp = async () => {

    try {
        const logger = new pino({name: 'ClashBot-Notifications-Service', level: 'info'})

        await Promise.all([clashBotNotificationDbImpl.initialize()]);

        const client = redis.createClient({
            url: 'redis://' + (process.env.REDIS_HOST || 'localhost') + ':' + (process.env.REDIS_PORT || '6379'),
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500)
            }
        });

        client.on('error', (err) => logger.error('Redis Client Error', err));

        await client.connect();

        app.use(express.json());
        app.use(cors());
        app.use(pinoHttp);

        app.get(`${urlPrefix}/health`, (req, res) => {
            res.json({
                status: 'Healthy'
            });
        });

        app.get(urlPrefix, (req, res) => {
            if (!req.query.id) {
                res.statusCode = 400;
                res.json({error: "Missing required parameter."})
            } else {
                clashBotNotificationServiceImpl.retrieveNotDismissedNotificationsForUser(req.query.id).then((userNotifications) => {
                    res.json(userNotifications);
                });
            }
        })

        app.post(urlPrefix, (req, res) => {
            clashBotNotificationServiceImpl.persistUserNotification(req.body.id, req.body.from,
                req.body.serverName, req.body.message, req.body.alertLevel).then(apiResponse => {
                client.publish(req.body.id, JSON.stringify(apiResponse)).then(() => {
                    logger.info('Sent redis update.')
                }).catch((err) => logger.error('Failed to send redis update for notification.', err));
                res.json(apiResponse);
            });
        })

        app.use((req, res) => {
            req.log.error(`Path not found ('${req.url}')`);
            res.statusCode = 404;
            res.json({error: 'Path not found.'})
        })
        return app;
    } catch (err) {
        throw new Error(err);
    }
};

module.exports.startUpApp = startUpApp;
