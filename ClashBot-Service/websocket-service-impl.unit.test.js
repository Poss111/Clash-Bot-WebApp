const { sendTeamUpdateThroughWs } = require('./websocket-service-impl');
const { WebSocket } = require('ws');

describe('Websocket Service Impl', () => {
    test('Send payload to subscribed clients match expected topic/serverName.', () => {
        let expectedServer = 'Integration Server'
        let expectedTournamentName = "awesome_sauce";
        let expectedTournamentDay = "1";
        const payload = [
            {
                tournamentDetails: {
                    tournamentDay: expectedTournamentDay,
                    tournamentName: expectedTournamentName,
                },
                serverName: expectedServer,
                teamName: 'Team One',
                playersDetails: [
                    {
                        name: '1234321',
                        role: 'Mid'
                    }
                ]
            },
            {
                tournamentDetails: {
                    tournamentDay: expectedTournamentDay,
                    tournamentName: expectedTournamentName,
                },
                serverName: expectedServer,
                teamName: 'Team Two',
                playersDetails: [
                    {
                        name: '1234321',
                        role: 'Mid'
                    }
                ]
            }
        ];
        const clientOne = {
            send: jest.fn(),
            topic: expectedServer,
            readyState: WebSocket.OPEN
        }
        let listOfClients = new Set();
        listOfClients.add(clientOne);
        const expressWs = {
            getWss: () => {
                return {
                    clients: listOfClients
                }
            }
        }
        sendTeamUpdateThroughWs(payload, expressWs);
        expect(clientOne.send).toHaveBeenCalledTimes(payload.length);
        payload.forEach(toBeSent => {
            expect(clientOne.send).toHaveBeenCalledWith(JSON.stringify(toBeSent));
        })
    })

    test('Send payload with multiple servers to subscribed clients match expected topic/serverName.', () => {
        let expectedServer = 'Integration Server'
        let expectedServerTwo = 'Integration Server Two'
        let expectedTournamentName = "awesome_sauce";
        let expectedTournamentDay = "1";
        const payload = [
            {
                tournamentDetails: {
                    tournamentDay: expectedTournamentDay,
                    tournamentName: expectedTournamentName,
                },
                serverName: expectedServer,
                teamName: 'Team One',
                playersDetails: [
                    {
                        name: '1234321',
                        role: 'Mid'
                    }
                ]
            },
            {
                tournamentDetails: {
                    tournamentDay: expectedTournamentDay,
                    tournamentName: expectedTournamentName,
                },
                serverName: expectedServerTwo,
                teamName: 'Team Two',
                playersDetails: [
                    {
                        name: '1234321',
                        role: 'Mid'
                    }
                ]
            }
        ];
        const clientOne = {
            send: jest.fn(),
            topic: expectedServer,
            readyState: WebSocket.OPEN
        }
        const clientTwo = {
            send: jest.fn(),
            topic: expectedServerTwo,
            readyState: WebSocket.OPEN
        }
        let listOfClients = new Set();
        listOfClients.add(clientOne);
        listOfClients.add(clientTwo);
        const expressWs = {
            getWss: () => {
                return {
                    clients: listOfClients
                }
            }
        }
        sendTeamUpdateThroughWs(payload, expressWs);
        expect(clientOne.send).toHaveBeenCalledTimes(1);
        expect(clientTwo.send).toHaveBeenCalledTimes(1);
        expect(clientOne.send).toHaveBeenCalledWith(JSON.stringify(payload[0]));
        expect(clientTwo.send).toHaveBeenCalledWith(JSON.stringify(payload[1]));
    })

    test('Send payload only for servers that subscribed clients match expected topic/serverName.', () => {
        let expectedServer = 'Integration Server'
        let expectedServerTwo = 'Integration Server Two'
        let expectedTournamentName = "awesome_sauce";
        let expectedTournamentDay = "1";
        const payload = [
            {
                tournamentDetails: {
                    tournamentDay: expectedTournamentDay,
                    tournamentName: expectedTournamentName,
                },
                serverName: expectedServer,
                teamName: 'Team One',
                playersDetails: [
                    {
                        name: '1234321',
                        role: 'Mid'
                    }
                ]
            },
            {
                tournamentDetails: {
                    tournamentDay: expectedTournamentDay,
                    tournamentName: expectedTournamentName,
                },
                serverName: expectedServerTwo,
                teamName: 'Team Two',
                playersDetails: [
                    {
                        name: '1234321',
                        role: 'Mid'
                    }
                ]
            }
        ];
        const clientOne = {
            send: jest.fn(),
            topic: expectedServer,
            readyState: WebSocket.OPEN
        }
        const clientTwo = {
            send: jest.fn(),
            topic: expectedServer,
            readyState: WebSocket.OPEN
        }
        let listOfClients = new Set();
        listOfClients.add(clientOne);
        listOfClients.add(clientTwo);
        const expressWs = {
            getWss: () => {
                return {
                    clients: listOfClients
                }
            }
        }
        sendTeamUpdateThroughWs(payload, expressWs);
        expect(clientOne.send).toHaveBeenCalledTimes(1);
        expect(clientTwo.send).toHaveBeenCalledTimes(1);
        expect(clientOne.send).toHaveBeenCalledWith(JSON.stringify(payload[0]));
        expect(clientTwo.send).not.toHaveBeenCalledWith(JSON.stringify(payload[1]));
        expect(clientTwo.send).toHaveBeenCalledWith(JSON.stringify(payload[0]));
    })

})