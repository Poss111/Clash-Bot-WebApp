import {config} from 'dotenv';
config();
import pino from 'pino';
import pinoHttp from 'pino-http';
import {WebSocket} from 'ws';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {createClient} from 'redis';
import {ClashBotNotificationWebsocket} from './clash-bot-notification-websocket';
const app = express();

const urlPrefix = '/api/notifications/ws';

const logger = pino({name: 'ClashBot-Notifications-Websocket-Service', level: 'info'});

const appWS = expressWs(app);
app.use(express.json());
app.use(cors());
app.use(pinoHttp());

app.get(`${urlPrefix}/health`, (req, res) => {
	res.json({
		status: 'Healthy'
	});
});

const client = createClient({
	url: 'redis://' + (process.env.REDIS_HOST || 'localhost') + ':6379',
	socket: {
		reconnectStrategy: (retries) => Math.min(retries * 50, 500)
	}
});

client.on('error', (err) => logger.error('Redis Client Connection Error', err));

client.connect().then(() => logger.info('Redis connected.'));

setInterval(() => {
	appWS.getWss().clients.forEach(s => {
		logger.info('Checking open connections...');
		const clashWs = s as ClashBotNotificationWebsocket;
		if (!clashWs.isAlive) return clashWs.terminate();
		else if (clashWs.readyState === WebSocket.OPEN) {
			clashWs.isAlive = false;
			clashWs.ping();
		}
	});
}, 30000);

appWS.app.ws(urlPrefix, (ws) => {
	logger.info('Starting up WebSocket Server...');
	logger.info('Websocket open.');
	logger.info('Started up WebSocket Server.');
	const clashWs = ws as unknown as ClashBotNotificationWebsocket;
	clashWs.isAlive = true;
	clashWs.id = uuidv4();
	clashWs.on('pong', () => {
		clashWs.isAlive = true;
	});

	clashWs.on('message', (data) => {
		logger.info('Requesting to subscribe to channel :: ' + data.toString());
		client.subscribe(data.toString(), (message, channel) => {
			logger.info('Request to update sent from redis for channel (\'' + channel + '\')...');
			ws.send(message);
		}).then(() => {
			logger.info('Set up redis connection on message.');
			clashWs.channel = data.toString();
		}).catch((err) => {
			logger.error('Failed to subscribe ws connection to redis for channel : ' + data.toString(), err);
		});
		logger.info('Received data ' + data);
	});
	clashWs.on('pong', (ws) => {
		const clashWs = ws as unknown  as ClashBotNotificationWebsocket;
		clashWs.isAlive = true;
	});
	clashWs.on('close', () => {
		logger.info('Closed connection ' + clashWs.id + ' connected to channel (\'' + clashWs.channel + '\').');
		clashWs.isAlive = false;
		client.unsubscribe(clashWs.channel).then(() => {
			logger.info('Unsubscribed from channel :: ' + clashWs.channel);
		});
	});
});

const portToStartOn = +(process.env.PORT || 80);
app.listen(portToStartOn, () => {
	logger.info('Started Notification WS Service on Port (\'' + portToStartOn + '\')');
});