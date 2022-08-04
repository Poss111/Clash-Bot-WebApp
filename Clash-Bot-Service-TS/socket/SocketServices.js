const { WebSocket } = require('ws');
const logger = require('../logger');
var os = require("os");

class SocketService {
  ws;

  waitForConnection(attemptNumber) {
    const loggerContext = { class: 'SocketService', method: 'waitForConnection' };
    const hostname = process.env.WS_SERVICE_HOSTNAME === undefined
      ? 'ws://localhost:8081' : process.env.WS_SERVICE_HOSTNAME
    logger.info(`Attempting to connect times ('${attemptNumber}') Hostname ('${hostname}').`);
    this.ws = new WebSocket(`${hostname}/ws/teams?service=${os.hostname()}`);
    this.ws.on('close', () => {
      logger.debug(loggerContext, 'Socket Closed.');
      setTimeout(() => this.waitForConnection(attemptNumber+=1), 1000 * 3);
    });
    this.ws.on('error', (err) => {
      loggerContext.err = err;
      logger.error(loggerContext, 'Error connecting.');
    });
    return new Promise((resolve) => {
      this.ws.on('open', () => {
        clearInterval();
        attemptNumber = 0;
        logger.debug(loggerContext, 'WS Connection open.');
        resolve(true);
      });
    });
  }

  heartbeat() {
    clearTimeout(this.pingTimeout);

    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    this.pingTimeout = setTimeout(() => {
      this.ws.terminate();
    }, 30000 + 1000);
  }

  sendMessage(payload) {
    const loggerContext = { class: 'SocketService', method: 'waitForConnection' };
    // this.ws.on('open', this.heartbeat);
    // this.ws.on('ping', this.heartbeat);
    // this.ws.on('close', () => clearTimeout(this.pingTimeout));
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ payload: payload }));
        resolve({ payload: payload });
      } else {
        logger.error(loggerContext, 'Connection not open.');
        reject(new Error('Connection not open.'));
      }
    });
  }
}

module.exports = new SocketService;
