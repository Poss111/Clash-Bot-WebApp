const { Router } = require('express');
const { pathParser } = require('../lib/path');
const { yellow } = require('../lib/colors');
const { subscribeToTeamEventsBasedOnServer, publishTeamEventBasedOnServer } = require('./services/teams');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../logger');
const router = Router();
module.exports = router;

function heartbeat() {
  this.isAlive = true;
}

router.ws('/ws/teams', async (ws, req) => {
  const loggerContext = { class: 'router', method: 'router.ws' }
  ws.isAlive = true;
  ws.id = uuidv4();
  if (req.query.serverName) {
    ws.server = req.query.serverName;
  } else if (req.query.service) {
    ws.service = req.query.service;
  }
  loggerContext.wsId = ws.id;
  const path = pathParser(req.path);
  logger.info(loggerContext, `${yellow(path)} client connected.`);
  await subscribeToTeamEventsBasedOnServer(ws);

  ws.on('message', async (msg) => {
    const loggerContextMsg = { class: 'router', method: 'router.ws' };
    loggerContextMsg.payload = msg;
    loggerContextMsg.wsId = ws.id;
    logger.debug(loggerContextMsg, `Path ('${path}') message was received:`);
    logger.debug(loggerContextMsg);
    await publishTeamEventBasedOnServer(ws, { message: msg, path, query: req.query });
  });
  ws.on('pong', heartbeat);

  const interval = setInterval(function ping() {
    logger.debug(loggerContext, 'Checking for stale websocket connection...');
        if (ws.isAlive === false) {
          logger.debug(loggerContext, `Terminating stale websocket connection for Id ('${ws.id}')...`);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
  }, 5000);

  ws.on('close', function close() {
    logger.debug(loggerContext, 'Closing interval...');
    clearInterval(interval);
  });
});
