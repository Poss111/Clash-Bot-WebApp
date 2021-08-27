const clashSubscriptionDbImpl = require('../clash-subscription-db-impl');
const dynamoDbHelper = require('../impl/dynamo-db-helper');
const Joi = require('joi');

jest.mock('dynamodb');
jest.mock('../impl/dynamo-db-helper');

beforeEach(() => {
    jest.resetModules();
});

describe('Initialize Table connection', () => {
    test('Initialize the table connection to be used.', async () => {
        let expectedTableObject = {setupTable: true};
        dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableObject);
        return clashSubscriptionDbImpl.initialize().then(() => {
            expect(clashSubscriptionDbImpl.clashSubscriptionTable).toEqual(expectedTableObject);
            expect(dynamoDbHelper.initialize).toBeCalledWith(clashSubscriptionDbImpl.tableName,
                {
                    hashKey: 'key',
                    timestamps: true,
                    schema: {
                        key: Joi.string(),
                        playerName: Joi.string(),
                        serverName: Joi.string(),
                        timeAdded: Joi.string(),
                        subscribed: Joi.string(),
                        preferredChampions: Joi.array()
                    }
                });
        });
    })

    test('Error should be handled if it occurs during table initialization', async () => {
        const expectedError = new Error('Failed to compile table def');
        dynamoDbHelper.initialize = jest.fn().mockRejectedValue(expectedError);
        return clashSubscriptionDbImpl.initialize('Sample Table', {}).catch(err => expect(err).toEqual(expectedError));
    })
})

describe('Subscribe', () => {
    test('Subscribe should be passed with a user id, a Server, and a player name.', async () => {
        let id = '12345667';
        let server = 'TestServer';
        let playerName = 'Sample User'
        let expectedResults = {
            key: id,
            playerName: playerName,
            serverName: server,
            subscribed: 'true'
        };
        clashSubscriptionDbImpl.clashSubscriptionTable = jest.fn();
        clashSubscriptionDbImpl.clashSubscriptionTable.create = jest.fn().mockImplementation((sub, callback) => {
            callback(undefined, expectedResults)
        });
        return clashSubscriptionDbImpl.subscribe(id, server, playerName).then(data => {
            expect(data.key).toEqual(id);
            expect(data.playerName).toEqual(playerName);
            expect(data.serverName).toEqual(server);
            expect(data.timeAdded).toBeTruthy();
            expect(data.subscribed).toEqual('true')
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledWith(expect.anything(), expect.any(Function));
        });
    })
})

describe('Unsubscribe', () => {
    test('Unsubscribe should be passed with a user id and a Server.', async () => {
        let id = '12345667';
        let server = 'TestServer';
        let expectedResults = {
            key: id,
            playerName: 'Sample User',
            serverName: server,
            timeAdded: 'Jan 20 2021 11:30 PM EST',
            subscribed: ''
        };
        clashSubscriptionDbImpl.clashSubscriptionTable = jest.fn();
        clashSubscriptionDbImpl.clashSubscriptionTable.update = jest.fn().mockImplementation((sub, callback) => {
            callback(undefined, expectedResults)
        });
        return clashSubscriptionDbImpl.unsubscribe(id, server).then(data => {
            expect(data.key).toEqual(id);
            expect(data.playerName).toEqual(expectedResults.playerName);
            expect(data.serverName).toEqual(server);
            expect(data.timeAdded).toBeTruthy();
            expect(data.subscribed).toHaveLength(0);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith({
                key: id,
                subscribed: ''
            }, expect.any(Function));
        });
    })
})

describe('Update preferred Champion', () => {
    test('Should be able to create a new record of the Users preferred champions if the user does not exist.', () => {
        let id = '12345667';
        let championToAdd = 'Akali';
        let serverName = 'Goon Squad';
        let playerName = 'Sample User';
        let expectedResults = {
            key: id,
            playerName: playerName,
            preferredChampions: ['Akali'],
            subscribed: false,
            timeAdded: expect.any(String),
            serverName: serverName
        };
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => callback(undefined, {Items: []})),
            create: jest.fn().mockImplementation((userData, callback) => callback(undefined, {attrs: expectedResults}))
        }
        return clashSubscriptionDbImpl.updatePreferredChampions(id, championToAdd, serverName, playerName).then(data => {
            expect(data).toEqual(expectedResults);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledWith(expectedResults, expect.any(Function));
        });
    })

    test('Should be able to update a record of the Users preferred champions if the user does exist.', async () => {
        let id = '12345667';
        let server = 'TestServer';
        let championToAdd = 'Aatrox';
        let playerName = 'Sample User';
        let initialData = {
            key: id,
            playerName: playerName,
            serverName: server,
            preferredChampions: ['Akali'],
            subscribed: false,
            timeAdded: expect.any(String)
        };
        let expectedData = JSON.parse(JSON.stringify(initialData));
        expectedData.preferredChampions.push(championToAdd);
        expectedData.timeAdded = expect.any(String);
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(undefined, {Items: [{attrs: initialData}]});
            }),
            update: jest.fn().mockImplementation((userData, callback) => {
                if (userData.id === expectedData.id) {
                    callback(undefined, {attrs: expectedData});
                } else {
                    callback();
                }
            })
        };
        return clashSubscriptionDbImpl.updatePreferredChampions(id, championToAdd, server).then(data => {
            expect(data).toEqual(expectedData);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith(expectedData, expect.any(Function));
        });
    })

    test('Should be able to remove a found champion of the Users preferred champions if the user does exist and the user request it.', () => {
        let id = '12345667';
        let championToRemove = 'Aatrox';
        let server = 'TestServer';
        let playerName = 'Sample User';
        let initialData = {
            key: id,
            playerName: playerName,
            preferredChampions: ['Akali', 'Aatrox'],
            subscribed: false,
            serverName: server,
            timeAdded: expect.any(String)
        };
        let expectedData = JSON.parse(JSON.stringify(initialData));
        expectedData.preferredChampions = expectedData.preferredChampions.filter(record => record !== championToRemove);
        expectedData.timeAdded = expect.any(String);
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(undefined, {Items: [{attrs: initialData}]});
            }),
            update: jest.fn().mockImplementation((sub, callback) => {
                if (sub.id === expectedData.id) {
                    callback(undefined, {attrs: expectedData});
                } else {
                    callback();
                }
            })
        };
        return clashSubscriptionDbImpl.updatePreferredChampions(id, championToRemove, server).then(data => {
            expect(data).toEqual(expectedData);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith(expectedData, expect.any(Function));
        });
    })

    test('If the user is requesting to add a champion and the champion array is undefined, they should be able to still add.', () => {
        let id = '12345667';
        let server = 'TestServer';
        let championToAdd = 'Aatrox';
        let playerName = 'Sample User';
        let initialData = {
            key: id,
            playerName: playerName,
            serverName: server,
            subscribed: false,
            timeAdded: expect.any(String)
        };
        let expectedData = JSON.parse(JSON.stringify(initialData));
        expectedData.preferredChampions = [championToAdd];
        expectedData.timeAdded = expect.any(String);
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(undefined, {Items: [{attrs: initialData}]});
            }),
            update: jest.fn().mockImplementation((sub, callback) => {
                if (sub.id === expectedData.id) {
                    callback(undefined, {attrs: expectedData});
                } else {
                    callback();
                }
            })
        };
        return clashSubscriptionDbImpl.updatePreferredChampions(id, championToAdd, server).then(data => {
            expect(data).toEqual(expectedData);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith(expectedData, expect.any(Function));
        });
    })

    test('Should return an error if update throws one when requesting to update champion suggestions.', () => {
        let id = '12345667';
        let server = 'TestServer';
        let championToRemove = 'Aatrox';
        let playerName = 'Sample User';
        let initialData = {
            key: id,
            playerName: playerName,
            serverName: server,
            preferredChampions: ['Akali', 'Aatrox'],
            subscribed: false,
            timeAdded: expect.any(String)
        };
        let expectedData = JSON.parse(JSON.stringify(initialData));
        expectedData.preferredChampions = expectedData.preferredChampions.filter(record => record !== championToRemove);
        expectedData.timeAdded = expect.any(String);
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(undefined, {Items: [{attrs: initialData}]});
            })
        };
        clashSubscriptionDbImpl.clashSubscriptionTable.update = jest.fn().mockImplementation((sub, callback) => {
            callback(new Error('Failed to update.'));
        });
        return clashSubscriptionDbImpl.updatePreferredChampions(id, championToRemove, server).then(data => {
            expect(data).toEqual(expectedData);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith(expectedData, expect.any(Function));
        }).catch(err => expect(err).toEqual(new Error('Failed to update.')));
    })

    test('Should return an error if create throws one when requesting to update champion suggestions.', () => {
        let id = '12345667';
        let server = 'TestServer';
        let championToRemove = 'Aatrox';
        let playerName = 'Sample User';
        let initialData = {
            key: id,
            playerName: playerName,
            serverName: server,
            preferredChampions: ['Akali', 'Aatrox'],
            subscribed: false,
            timeAdded: expect.any(String)
        };
        let expectedData = JSON.parse(JSON.stringify(initialData));
        expectedData.preferredChampions = expectedData.preferredChampions.filter(record => record !== championToRemove);
        expectedData.timeAdded = expect.any(String);
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(undefined, {Items: []});
            }),
            create: jest.fn().mockImplementation((sub, callback) => callback(new Error('Failed to create.')))
        }
        return clashSubscriptionDbImpl.updatePreferredChampions(id, championToRemove, server).then(data => {
            expect(data).toEqual(expectedData);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledWith(expectedData, expect.any(Function));
        }).catch(err => expect(err).toEqual(new Error('Failed to create.')));
    })
})

describe('Get User Subscription', () => {
    test('I should be able to retrieve a user detail by an id.', () => {
        let id = '123456789';
        let server = 'Goon Squad';
        let playerName = 'Sample User';
        let expectedResults = {
            key: id,
            playerName: playerName,
            serverName: server,
            preferredChampions: ['Akali'],
            subscribed: false
        };
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(undefined, {Items: [{attrs: expectedResults}]});
            })
        }
        return clashSubscriptionDbImpl.retrieveUserDetails(id).then(data => {
            expect(data).toEqual(expectedResults)
        })
    })

    test('I should be returned an empty object if the user record does not exist.', () => {
        let id = '123456789';
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(undefined, {Items: []});
            })
        }
        return clashSubscriptionDbImpl.retrieveUserDetails(id).then(data => {
            expect(data).toEqual({});
        })
    })

    test('I should be returned an empty object if the user record does not exist and the object returned is undefined.', () => {
        let id = '123456789';
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(undefined, {Items: []});
            })
        }
        return clashSubscriptionDbImpl.retrieveUserDetails(id).then(data => {
            expect(data).toEqual({});
        })
    })

    test('I should be able to return the error if one occurs.', () => {
        let id = '123456789';
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            query: jest.fn().mockReturnThis(),
            exec: jest.fn().mockImplementation((callback) => {
                callback(new Error('Failed to retrieve'));
            })
        }
        return clashSubscriptionDbImpl.retrieveUserDetails(id)
            .then(data => expect(data).toBeTruthy())
            .catch(err => expect(err).toEqual(new Error('Failed to retrieve')))
    })
})

describe('Create User Subscription', () => {
    test('I should be able to pass all required details and create the requested user.', () => {
        let id = '123456789';
        let server = 'Goon Squad';
        let preferredChampions = ['Akali'];
        let subscribed = true;
        let playerName = 'Sample User';
        let expectedResults = {
            key: id,
            playerName: playerName,
            serverName: server,
            preferredChampions: preferredChampions,
            subscribed: JSON.stringify(subscribed),
            timeAdded: expect.anything()
        };
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            create: jest.fn().mockImplementation((data, callback) => {
                callback(undefined, data);
            })
        }
        return clashSubscriptionDbImpl
            .createUpdateUserDetails(id, server, playerName, preferredChampions, subscribed)
            .then(data => {
                expect(data).toEqual(expectedResults);
            }).catch(err => expect(err).toBeFalsy());
    })

    test('I should be able to pass all required details and create the requested user and if subscribed is given as false, I should not persist it.', () => {
        let id = '123456789';
        let server = 'Goon Squad';
        let preferredChampions = ['Akali'];
        let subscribed = false;
        let playerName = 'Sample User';
        let expectedResults = {
            key: id,
            playerName: playerName,
            serverName: server,
            preferredChampions: preferredChampions,
            timeAdded: expect.anything()
        };
        clashSubscriptionDbImpl.clashSubscriptionTable = {
            create: jest.fn().mockImplementation((data, callback) => {
                callback(undefined, data);
            })
        }
        return clashSubscriptionDbImpl
            .createUpdateUserDetails(id, server, playerName, preferredChampions, subscribed)
            .then(data => {
                expect(data).toEqual(expectedResults);
            }).catch(err => expect(err).toBeFalsy());
    })
})

describe('Retrieve Usernames by ids', () => {
    test('If a User Id is passed an array with the username belonging to the id should be returned.', () => {
        const expectedPlayerId = '1';
        const data = {
            Items: [{
                attrs: {
                    id: '1',
                    playerName: 'Roidrage'
                }
            }]
        }

        const expectedMap = data.Items.reduce((map, record) => (map[record.attrs.id] = record.attrs.playerName, map), {});

        clashSubscriptionDbImpl.clashSubscriptionTable = {
            batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data))
        }

        return clashSubscriptionDbImpl.retrievePlayerNames(expectedPlayerId).then((usernames) => {
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledWith([expectedPlayerId], expect.any(Function));
            expect(usernames).toEqual(expectedMap);
        })
    })

    test('If multiple User Ids are passed an array with the usernames belonging to the id should be returned.', () => {
        const expectedPlayerId = '1';
        const expectedPlayerIdTwo = '2';

        const data = {
            Items: [
                {
                    attrs: {
                        id: '1',
                        playerName: 'Roidrage'
                    }
                },
                {
                    attrs: {
                        id: '2',
                        playerName: 'TheIncentive'
                    }
                }
            ]
        };

        const expectedMap = data.Items.reduce((map, record) => (map[record.attrs.id] = record.attrs.playerName, map), {});

        clashSubscriptionDbImpl.clashSubscriptionTable = {
            batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data))
        };

        return clashSubscriptionDbImpl.retrievePlayerNames([expectedPlayerId, expectedPlayerIdTwo]).then((usernames) => {
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledTimes(1);
            expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledWith([expectedPlayerId, expectedPlayerIdTwo], expect.any(Function));
            expect(usernames).toEqual(expectedMap);
        })
    })
})
