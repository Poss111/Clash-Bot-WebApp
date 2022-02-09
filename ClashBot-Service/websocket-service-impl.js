const { WebSocket } = require('ws');

let sendTeamUpdateThroughWs = (data, expressWs) => {
    console.log('WS notified to update clients...');
    try {
        let serverReducePayload = data.reduce((map, key) => {
            if (!map[key.serverName]) {
                map[key.serverName] = [key];
            } else {
                map[key.serverName].push(key);
            }
            return map;
        }, {});
        [...expressWs.getWss().clients]
            .filter(client => Object.keys(serverReducePayload).includes(client.topic))
            .forEach(client => {
                if (client && client.readyState === WebSocket.OPEN) {
                    serverReducePayload[client.topic].forEach((payload) => {
                        client.send(JSON.stringify(payload));
                    });
                    console.log(`Posted '${serverReducePayload[client.topic].length}' message to subscribed client for '${client.topic}'.`);
                }
            })
    } catch (err) {
        console.error(`Failed to send update through ws for '${JSON.stringify(data)}'`, err);
    }
}

module.exports.sendTeamUpdateThroughWs = sendTeamUpdateThroughWs;