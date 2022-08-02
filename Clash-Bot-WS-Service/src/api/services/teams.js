const service = module.exports = {};
const logger = require('../../../logger');

let wsClients = [];

setInterval(() => {
  logger.info(wsClients.map((client) => `${client.id} - ${client.server}`))
  wsClients = [...wsClients.filter((client) => client.readyState === 1 || client.readyState === 2)];
}, 5000);

/**
 *
 * @param {object} ws WebSocket connection.
 */
service.subscribeToTeamEventsBasedOnServer = async (ws) => {
  wsClients.push(ws);
  ws.send('Connected');
};

/**
 *
 * @param {object} ws WebSocket connection.
 * @param {object} options
 * @param {string} options.path The path in which the message was received.
 * @param {object} options.query The query parameters used when connecting to the server.
 * @param {object} options.message The received message.
 * @param {string} options.message.payload.name - The name of the Team.
 * @param {object} options.message.payload.playerDetails
 * @param {object} options.message.payload.playerDetails.Top
 * @param {string} options.message.payload.playerDetails.Top.id - Unique identifier for Player
 * @param {string} options.message.payload.playerDetails.Top.name - The Players discord name
 * @param {string} options.message.payload.playerDetails.Top.role - A League of Legends role.
 * @param {array} options.message.payload.playerDetails.Top.champions - A list of the Users preferred champions.
 * @param {array} options.message.payload.playerDetails.Top.subscriptions
 * @param {string} options.message.payload.playerDetails.Top.serverName
 * @param {object} options.message.payload.playerDetails.Mid
 * @param {string} options.message.payload.playerDetails.Mid.id - Unique identifier for Player
 * @param {string} options.message.payload.playerDetails.Mid.name - The Players discord name
 * @param {string} options.message.payload.playerDetails.Mid.role - A League of Legends role.
 * @param {array} options.message.payload.playerDetails.Mid.champions - A list of the Users preferred champions.
 * @param {array} options.message.payload.playerDetails.Mid.subscriptions
 * @param {string} options.message.payload.playerDetails.Mid.serverName
 * @param {object} options.message.payload.playerDetails.Jg
 * @param {string} options.message.payload.playerDetails.Jg.id - Unique identifier for Player
 * @param {string} options.message.payload.playerDetails.Jg.name - The Players discord name
 * @param {string} options.message.payload.playerDetails.Jg.role - A League of Legends role.
 * @param {array} options.message.payload.playerDetails.Jg.champions - A list of the Users preferred champions.
 * @param {array} options.message.payload.playerDetails.Jg.subscriptions
 * @param {string} options.message.payload.playerDetails.Jg.serverName
 * @param {object} options.message.payload.playerDetails.Bot
 * @param {string} options.message.payload.playerDetails.Bot.id - Unique identifier for Player
 * @param {string} options.message.payload.playerDetails.Bot.name - The Players discord name
 * @param {string} options.message.payload.playerDetails.Bot.role - A League of Legends role.
 * @param {array} options.message.payload.playerDetails.Bot.champions - A list of the Users preferred champions.
 * @param {array} options.message.payload.playerDetails.Bot.subscriptions
 * @param {string} options.message.payload.playerDetails.Bot.serverName
 * @param {object} options.message.payload.playerDetails.Supp
 * @param {string} options.message.payload.playerDetails.Supp.id - Unique identifier for Player
 * @param {string} options.message.payload.playerDetails.Supp.name - The Players discord name
 * @param {string} options.message.payload.playerDetails.Supp.role - A League of Legends role.
 * @param {array} options.message.payload.playerDetails.Supp.champions - A list of the Users preferred champions.
 * @param {array} options.message.payload.playerDetails.Supp.subscriptions
 * @param {string} options.message.payload.playerDetails.Supp.serverName
 * @param {string} options.message.payload.serverName - The Discord server that the Team belongs to.
 * @param {object} options.message.payload.tournament
 * @param {string} options.message.payload.tournament.tournamentName - The name of the Tournament.
 * @param {string} options.message.payload.tournament.tournamentDay - The day number of the Tournament. [1-4]
 * @param {string} options.message.payload.tournament.startTime - When the Tournament starts.
 * @param {string} options.message.payload.tournament.registrationTime - When you can register for the Tournament.
 */
service.publishTeamEventBasedOnServer = async (ws, { message, path, query }) => {
  const loggerContext = { class: 'teams', method: 'publishTeamEventBasedOnServer'};
  if (wsClients.length > 0) {
    const parsedMessage = JSON.parse(message);
    wsClients.forEach(client => {
      if (client !== ws
        && client.readyState === 1
        && client.server === parsedMessage.payload.serverName) {
        logger.debug({ id: client.id, server: client.server, ...loggerContext }, 'Sending payload to server.')
        client.send(JSON.stringify(parsedMessage.payload));
      }
    });
  }
};
