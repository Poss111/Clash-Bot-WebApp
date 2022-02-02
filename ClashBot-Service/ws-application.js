const { WebSocketServer } = require('ws');

const startUpWsApp = (app) => {
    const wss = new WebSocketServer({ server: app});
    console.log('Setting up WebSocket service...');

    wss.on('open', (websocket) => {
        websocket.on('message', (message) => {
            console.log(`Received :: ${message}`);
            websocket.send(`You sent ${message}`);
        })

        websocket.send('Hello! You have connected.');
    })
}

module.exports.startUpWsApp = startUpWsApp