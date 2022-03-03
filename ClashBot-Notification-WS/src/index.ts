import {config} from 'dotenv';
config();
import pino from 'pino';
import {WebSocketServer, WebSocket} from 'ws';
import {createClient} from 'redis';
import {ClashBotNotificationWebsocket} from './clash-bot-notification-websocket';

const logger = pino({name: 'ClashBot-Notifications-Websocket-Service', level: 'info'});

const client = createClient({
	url: 'redis://' + (process.env.REDIS_HOST || 'localhost') + ':6379',
	socket: {
		reconnectStrategy: (retries) => Math.min(retries * 50, 500)
	}
});

client.on('error', (err) => console.log('Redis Client Error', err));

client.connect().then(() => {
	const wss = new WebSocketServer({
		port: +(process.env.PORT || 82),
		perMessageDeflate: {
			zlibDeflateOptions: {
				// See zlib defaults.
				chunkSize: 1024,
				memLevel: 7,
				level: 3
			},
			zlibInflateOptions: {
				chunkSize: 10 * 1024
			},
			// Other options settable:
			clientNoContextTakeover: true, // Defaults to negotiated value.
			serverNoContextTakeover: true, // Defaults to negotiated value.
			serverMaxWindowBits: 10, // Defaults to negotiated value.
			// Below options specified as default values.
			concurrencyLimit: 10, // Limits zlib concurrency for perf.
			threshold: 1024 // Size (in bytes) below which messages
			// should not be compressed if context takeover is disabled.
		}
	});

	logger.info('Starting up WebSocket Server...');
	wss.on('connection', (ws: WebSocket) => {
		logger.info('Websocket open.');
		const clashWs = ws as ClashBotNotificationWebsocket;
		clashWs.isAlive = true;
		clashWs.on('pong', () => {
			clashWs.isAlive = true;
		});

		clashWs.on('message', (data) => {
			logger.info('Requesting to subscribe to channel :: ' + data.toString());
			client.subscribe(data.toString(), (message) => {
				logger.info('Request to update sent from redis.');
				ws.send(message);
			}).then(() => {
				logger.info('Set up redis connection on message.');
				clashWs.channel = data.toString();
			}).catch((err) => {
				logger.error('Failed to subscribe ws connection to redis for channel : ' + data.toString(), err);
			});
			logger.info('Received data ' + data);
		});
		clashWs.on('close', () => {
			client.unsubscribe(clashWs.channel).then(() => {
				logger.info('Unsubscribed from channel :: ' + clashWs.channel);
			});
		});
	});
	logger.info('Started up WebSocket Server.');

	const interval = setInterval(function ping() {
		wss.clients.forEach(function each(ws) {
			const clashWs = ws as ClashBotNotificationWebsocket;
			if (!clashWs.isAlive) return clashWs.terminate();
			clashWs.isAlive = false;
			clashWs.ping();
		});
	}, 30000);

	wss.on('close', function close() {
		clearInterval(interval);
	});
});