const { WebSocketServer } = require('ws');
const logger = require('pino')();

const startUpWsApp = (app) => {
    const wss = new WebSocketServer({ server: app});
    logger.info('Setting up WebSocket service...');

    wss.on('open', (websocket) => {
        websocket.on('message', (message) => {
            logger.info(`Received :: ${message}`);
            websocket.send(`You sent ${message}`);
        })

        websocket.send('Hello! You have connected.');
    })
}

module.exports.startUpWsApp = startUpWsApp