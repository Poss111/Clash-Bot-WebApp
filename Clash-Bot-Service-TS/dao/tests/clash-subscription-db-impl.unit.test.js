const Joi = require('joi');
const clashSubscriptionDbImpl = require('../clash-subscription-db-impl');
const dynamoDbHelper = require('../impl/dynamo-db-helper');

jest.mock('dynamodb');
jest.mock('../impl/dynamo-db-helper');

beforeEach(() => {
  jest.resetModules();
});

describe('Initialize Table connection', () => {
  test('Initialize the table connection to be used.', async () => {
    const expectedTableObject = { setupTable: true };
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
            preferredChampions: Joi.array(),
          },
          indexes: [
            {
              hashKey: 'key',
              rangeKey: 'subscribed',
              name: 'subscribed-users-index',
              type: 'global',
            },
          ],
        });
    });
  });

  test('Error should be handled if it occurs during table initialization', async () => {
    const expectedError = new Error('Failed to compile table def');
    dynamoDbHelper.initialize = jest.fn().mockRejectedValue(expectedError);
    return clashSubscriptionDbImpl.initialize('Sample Table', {}).catch((err) => expect(err).toEqual(expectedError));
  });
});

describe('Subscribe', () => {
  test('Subscribe should be passed with a user id, a Server, and a player name.', async () => {
    const id = '12345667';
    const server = 'TestServer';
    const playerName = 'Sample User';
    const expectedResults = {
      key: id,
      playerName,
      serverName: server,
      subscribed: 'true',
    };
    clashSubscriptionDbImpl.clashSubscriptionTable = jest.fn();
    clashSubscriptionDbImpl.clashSubscriptionTable.create = jest.fn().mockImplementation((sub, callback) => {
      callback(undefined, expectedResults);
    });
    return clashSubscriptionDbImpl.subscribe(id, server, playerName).then((data) => {
      expect(data.key).toEqual(id);
      expect(data.playerName).toEqual(playerName);
      expect(data.serverName).toEqual(server);
      expect(data.timeAdded).toBeTruthy();
      expect(data.subscribed).toEqual('true');
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledWith(expect.anything(), expect.any(Function));
    });
  });
});

describe('Unsubscribe', () => {
  test('Unsubscribe should be passed with a user id and a Server.', async () => {
    const id = '12345667';
    const server = 'TestServer';
    const expectedResults = {
      key: id,
      playerName: 'Sample User',
      serverName: server,
      timeAdded: 'Jan 20 2021 11:30 PM EST',
      subscribed: '',
    };
    clashSubscriptionDbImpl.clashSubscriptionTable = jest.fn();
    clashSubscriptionDbImpl.clashSubscriptionTable.update = jest.fn().mockImplementation((sub, callback) => {
      callback(undefined, expectedResults);
    });
    return clashSubscriptionDbImpl.unsubscribe(id, server).then((data) => {
      expect(data.key).toEqual(id);
      expect(data.playerName).toEqual(expectedResults.playerName);
      expect(data.serverName).toEqual(server);
      expect(data.timeAdded).toBeTruthy();
      expect(data.subscribed).toHaveLength(0);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith({
        key: id,
        subscribed: '',
      }, expect.any(Function));
    });
  });
});

describe('Update preferred Champion', () => {
  test('Should be able to create a new record of the Users preferred champions if the user does not exist.', () => {
    const id = '12345667';
    const championToAdd = 'Akali';
    const serverName = 'Goon Squad';
    const playerName = 'Sample User';
    const expectedResults = {
      key: id,
      playerName,
      preferredChampions: ['Akali'],
      subscribed: false,
      timeAdded: expect.any(String),
      serverName,
    };
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => callback(undefined, { Items: [] })),
      create: jest.fn().mockImplementation((userData, callback) => callback(undefined, { attrs: expectedResults })),
    };
    return clashSubscriptionDbImpl.updatePreferredChampions(id, championToAdd, serverName, playerName).then((data) => {
      expect(data).toEqual(expectedResults);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledWith(expectedResults, expect.any(Function));
    });
  });

  test('Should be able to update a record of the Users preferred champions if the user does exist.', async () => {
    const id = '12345667';
    const server = 'TestServer';
    const championToAdd = 'Aatrox';
    const playerName = 'Sample User';
    const initialData = {
      key: id,
      playerName,
      serverName: server,
      preferredChampions: ['Akali'],
      subscribed: false,
      timeAdded: expect.any(String),
    };
    const expectedData = JSON.parse(JSON.stringify(initialData));
    expectedData.preferredChampions.push(championToAdd);
    expectedData.timeAdded = expect.any(String);
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [{ attrs: initialData }] });
      }),
      update: jest.fn().mockImplementation((userData, callback) => {
        if (userData.id === expectedData.id) {
          callback(undefined, { attrs: expectedData });
        } else {
          callback();
        }
      }),
    };
    return clashSubscriptionDbImpl.updatePreferredChampions(id, championToAdd, server).then((data) => {
      expect(data).toEqual(expectedData);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith(expectedData, expect.any(Function));
    });
  });

  test('Should be able to remove a found champion of the Users preferred champions if the user does exist and the user request it.', () => {
    const id = '12345667';
    const championToRemove = 'Aatrox';
    const server = 'TestServer';
    const playerName = 'Sample User';
    const initialData = {
      key: id,
      playerName,
      preferredChampions: ['Akali', 'Aatrox'],
      subscribed: false,
      serverName: server,
      timeAdded: expect.any(String),
    };
    const expectedData = JSON.parse(JSON.stringify(initialData));
    expectedData.preferredChampions = expectedData.preferredChampions.filter((record) => record !== championToRemove);
    expectedData.timeAdded = expect.any(String);
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [{ attrs: initialData }] });
      }),
      update: jest.fn().mockImplementation((sub, callback) => {
        if (sub.id === expectedData.id) {
          callback(undefined, { attrs: expectedData });
        } else {
          callback();
        }
      }),
    };
    return clashSubscriptionDbImpl.updatePreferredChampions(id, championToRemove, server).then((data) => {
      expect(data).toEqual(expectedData);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith(expectedData, expect.any(Function));
    });
  });

  test('Should not be able to add more than 5 champions to the Users preferred champions.', () => {
    const id = '12345667';
    const championToAdd = 'Aatrox';
    const server = 'TestServer';
    const playerName = 'Sample User';
    const initialData = {
      key: id,
      playerName,
      preferredChampions: ['Akali', 'Aaniva', 'Katarina', 'Ahri', 'Volibear'],
      subscribed: false,
      serverName: server,
      timeAdded: expect.any(String),
    };
    const expectedData = JSON.parse(JSON.stringify(initialData));
    expectedData.preferredChampions = initialData.preferredChampions;
    expectedData.timeAdded = expect.any(String);
    expectedData.error = 'User has maximum preferred Champions. Cannot add.';
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [{ attrs: initialData }] });
      }),
      update: jest.fn(),
    };
    return clashSubscriptionDbImpl.updatePreferredChampions(id, championToAdd, server).then((data) => {
      expect(data).toEqual(expectedData);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).not.toHaveBeenCalled();
    });
  });

  test('If the user is requesting to add a champion and the champion array is undefined, they should be able to still add.', () => {
    const id = '12345667';
    const server = 'TestServer';
    const championToAdd = 'Aatrox';
    const playerName = 'Sample User';
    const initialData = {
      key: id,
      playerName,
      serverName: server,
      subscribed: false,
      timeAdded: expect.any(String),
    };
    const expectedData = JSON.parse(JSON.stringify(initialData));
    expectedData.preferredChampions = [championToAdd];
    expectedData.timeAdded = expect.any(String);
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [{ attrs: initialData }] });
      }),
      update: jest.fn().mockImplementation((sub, callback) => {
        if (sub.id === expectedData.id) {
          callback(undefined, { attrs: expectedData });
        } else {
          callback();
        }
      }),
    };
    return clashSubscriptionDbImpl.updatePreferredChampions(id, championToAdd, server).then((data) => {
      expect(data).toEqual(expectedData);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith(expectedData, expect.any(Function));
    });
  });

  test('Should return an error if update throws one when requesting to update champion suggestions.', () => {
    const id = '12345667';
    const server = 'TestServer';
    const championToRemove = 'Aatrox';
    const playerName = 'Sample User';
    const initialData = {
      key: id,
      playerName,
      serverName: server,
      preferredChampions: ['Akali', 'Aatrox'],
      subscribed: false,
      timeAdded: expect.any(String),
    };
    const expectedData = JSON.parse(JSON.stringify(initialData));
    expectedData.preferredChampions = expectedData.preferredChampions.filter((record) => record !== championToRemove);
    expectedData.timeAdded = expect.any(String);
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [{ attrs: initialData }] });
      }),
    };
    clashSubscriptionDbImpl.clashSubscriptionTable.update = jest.fn().mockImplementation((sub, callback) => {
      callback(new Error('Failed to update.'));
    });
    return clashSubscriptionDbImpl.updatePreferredChampions(id, championToRemove, server).then((data) => {
      expect(data).toEqual(expectedData);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.update).toBeCalledWith(expectedData, expect.any(Function));
    }).catch((err) => expect(err).toEqual(new Error('Failed to update.')));
  });

  test('Should return an error if create throws one when requesting to update champion suggestions.', () => {
    const id = '12345667';
    const server = 'TestServer';
    const championToRemove = 'Aatrox';
    const playerName = 'Sample User';
    const initialData = {
      key: id,
      playerName,
      serverName: server,
      preferredChampions: ['Akali', 'Aatrox'],
      subscribed: false,
      timeAdded: expect.any(String),
    };
    const expectedData = JSON.parse(JSON.stringify(initialData));
    expectedData.preferredChampions = expectedData.preferredChampions.filter((record) => record !== championToRemove);
    expectedData.timeAdded = expect.any(String);
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [] });
      }),
      create: jest.fn().mockImplementation((sub, callback) => callback(new Error('Failed to create.'))),
    };
    return clashSubscriptionDbImpl.updatePreferredChampions(id, championToRemove, server).then((data) => {
      expect(data).toEqual(expectedData);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).toBeCalledWith(expectedData, expect.any(Function));
    }).catch((err) => expect(err).toEqual(new Error('Failed to create.')));
  });
});

describe('Get User Subscription', () => {
  test('I should be able to retrieve a user detail by an id.', () => {
    const id = '123456789';
    const server = 'Goon Squad';
    const playerName = 'Sample User';
    const expectedResults = {
      key: id,
      playerName,
      serverName: server,
      preferredChampions: ['Akali'],
      subscribed: false,
    };
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [{ attrs: expectedResults }] });
      }),
    };
    return clashSubscriptionDbImpl.retrieveUserDetails(id).then((data) => {
      expect(data).toEqual(expectedResults);
    });
  });

  test('I should be returned an empty object if the user record does not exist.', () => {
    const id = '123456789';
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [] });
      }),
    };
    return clashSubscriptionDbImpl.retrieveUserDetails(id).then((data) => {
      expect(data).toEqual({});
    });
  });

  test('I should be returned an empty object if the user record does not exist and the object returned is undefined.', () => {
    const id = '123456789';
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [] });
      }),
    };
    return clashSubscriptionDbImpl.retrieveUserDetails(id).then((data) => {
      expect(data).toEqual({});
    });
  });

  test('I should be able to return the error if one occurs.', () => {
    const id = '123456789';
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(new Error('Failed to retrieve'));
      }),
    };
    return clashSubscriptionDbImpl.retrieveUserDetails(id)
      .then((data) => expect(data).toBeTruthy())
      .catch((err) => expect(err).toEqual(new Error('Failed to retrieve')));
  });
});

describe('Create User Subscription', () => {
  test('I should be able to pass all required details and create the requested user.', () => {
    const id = '123456789';
    const server = 'Goon Squad';
    const preferredChampions = ['Akali'];
    const subscribed = true;
    const playerName = 'Sample User';
    const expectedResults = {
      key: id,
      playerName,
      serverName: server,
      preferredChampions,
      subscribed: JSON.stringify(subscribed),
      timeAdded: expect.anything(),
    };
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      create: jest.fn().mockImplementation((data, callback) => {
        callback(undefined, data);
      }),
    };
    return clashSubscriptionDbImpl
      .createUpdateUserDetails(id, server, playerName, preferredChampions, subscribed)
      .then((data) => {
        expect(data).toEqual(expectedResults);
      }).catch((err) => expect(err).toBeFalsy());
  });

  test('I should be able to pass all required details and create the requested user and if subscribed is given as false, I should not persist it.', () => {
    const id = '123456789';
    const server = 'Goon Squad';
    const preferredChampions = ['Akali'];
    const subscribed = false;
    const playerName = 'Sample User';
    const expectedResults = {
      key: id,
      playerName,
      serverName: server,
      preferredChampions,
      timeAdded: expect.anything(),
    };
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      create: jest.fn().mockImplementation((data, callback) => {
        callback(undefined, data);
      }),
    };
    return clashSubscriptionDbImpl
      .createUpdateUserDetails(id, server, playerName, preferredChampions, subscribed)
      .then((data) => {
        expect(data).toEqual(expectedResults);
      }).catch((err) => expect(err).toBeFalsy());
  });

  test('If a user tries to persist greater than 5 champions then an error should be returned.', () => {
    const id = '123456789';
    const server = 'Goon Squad';
    const preferredChampions = ['Akali', 'Aatrox', 'Aanivia', 'Ahri', 'Annie', 'Miss Fortune'];
    const subscribed = false;
    const playerName = 'Sample User';
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      create: jest.fn(),
    };
    return clashSubscriptionDbImpl
      .createUpdateUserDetails(id, server, playerName, preferredChampions, subscribed)
      .then((data) => {
        expect(clashSubscriptionDbImpl.clashSubscriptionTable.create).not.toHaveBeenCalled();
        expect(data.error).toEqual('Cannot persist more than 5 champions.');
      }).catch((err) => expect(err).toBeFalsy());
  });
});

describe('Update User', () => {
  test('When I call updateUser with an id and username, it should only call to update the username.', () => {
    const expectedUserId = '1';
    const priorUsername = 'Roid';
    const updatedUsername = 'Roidrage';

    const updatedRecord = {
      id: expectedUserId,
      playerName: updatedUsername,
    };

    clashSubscriptionDbImpl.clashSubscriptionTable = {
      update: jest.fn().mockImplementation((updateParams, callback) => callback(undefined, { attrs: updatedRecord })),
    };

    return clashSubscriptionDbImpl.updateUser({ id: expectedUserId, playerName: updatedUsername }).then((results) => {
      expect(results).toEqual(updatedRecord);
      expect(results.playerName).not.toEqual(priorUsername);
    });
  });

  test('When I call updateUser with an id and username and an error occurs, it should properly reject it.', () => {
    const expectedUserId = '1';
    const updatedUsername = 'Roidrage';

    const updatedRecord = {
      id: expectedUserId,
      playerName: updatedUsername,
    };

    const expectedError = new Error('Failed to update');

    clashSubscriptionDbImpl.clashSubscriptionTable = {
      update: jest.fn().mockImplementation((updateParams, callback) => callback(expectedError, { attrs: updatedRecord })),
    };

    return clashSubscriptionDbImpl.updateUser({ id: expectedUserId, playerName: updatedUsername })
      .then(() => expect(true).toBeFalsy())
      .catch((err) => expect(err).toEqual(expectedError));
  });
});

describe('Retrieve Usernames by ids', () => {
  test('If a User Id is passed an array with the username belonging to the id should be returned.', () => {
    const expectedPlayerId = '1';
    const data = [{
      attrs: {
        key: '1',
        playerName: 'Roidrage',
      },
    }];

    const expectedMap = data.reduce((map, record) => (map[record.attrs.key] = record.attrs.playerName, map), {});

    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrievePlayerNames(expectedPlayerId).then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledWith([expectedPlayerId], expect.any(Function));
      expect(usernames).toEqual(expectedMap);
    });
  });

  test('If multiple User Ids are passed an array with the usernames belonging to the id should be returned.', () => {
    const expectedPlayerId = '1';
    const expectedPlayerIdTwo = '2';

    const data = [
      {
        attrs: {
          key: '1',
          playerName: 'Roidrage',
        },
      },
      {
        attrs: {
          key: '2',
          playerName: 'TheIncentive',
        },
      },
    ];

    const expectedMap = data.reduce((map, record) => (map[record.attrs.key] = record.attrs.playerName, map), {});

    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrievePlayerNames([expectedPlayerId, expectedPlayerIdTwo]).then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledWith([expectedPlayerId, expectedPlayerIdTwo], expect.any(Function));
      expect(usernames).toEqual(expectedMap);
    });
  });

  test('If no ids are passed, then it should return with an empty object.', () => {
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrievePlayerNames([]).then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).not.toHaveBeenCalled();
      expect(usernames).toEqual({});
    });
  });

  test('If undefined is passed, then it should return with an empty object.', () => {
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrievePlayerNames().then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).not.toHaveBeenCalled();
      expect(usernames).toEqual({});
    });
  });

  test('If undefined in an array is passed, then it should return with an empty object.', () => {
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrievePlayerNames([undefined]).then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).not.toHaveBeenCalled();
      expect(usernames).toEqual({});
    });
  });
});

describe('Retrieve User details by ids', () => {
  test('If a User Id is passed an array with the user details belonging to the id should be returned.', () => {
    const expectedPlayerId = '1';
    const data = [{
      attrs: {
        key: '1',
        playerName: 'Roidrage',
      },
    }];

    const expectedMap = data.reduce((map, record) => (map[record.attrs.key] = record.attrs, map), {});

    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrieveAllUserDetails(expectedPlayerId).then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledWith([expectedPlayerId], expect.any(Function));
      expect(usernames).toEqual(expectedMap);
    });
  });

  test('If multiple User Ids are passed an array with the  user details belonging to the id should be returned.', () => {
    const expectedPlayerId = '1';
    const expectedPlayerIdTwo = '2';

    const data = [
      {
        attrs: {
          key: '1',
          playerName: 'Roidrage',
        },
      },
      {
        attrs: {
          key: '2',
          playerName: 'TheIncentive',
        },
      },
    ];

    const expectedMap = data.reduce((map, record) => (map[record.attrs.key] = record.attrs, map), {});

    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrieveAllUserDetails([expectedPlayerId, expectedPlayerIdTwo]).then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledTimes(1);
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).toHaveBeenCalledWith([expectedPlayerId, expectedPlayerIdTwo], expect.any(Function));
      expect(usernames).toEqual(expectedMap);
    });
  });

  test('If no ids are passed, then it should return with an empty object.', () => {
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrieveAllUserDetails([]).then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).not.toHaveBeenCalled();
      expect(usernames).toEqual({});
    });
  });

  test('If undefined is passed, then it should return with an empty object.', () => {
    clashSubscriptionDbImpl.clashSubscriptionTable = {
      batchGetItems: jest.fn().mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashSubscriptionDbImpl.retrieveAllUserDetails().then((usernames) => {
      expect(clashSubscriptionDbImpl.clashSubscriptionTable.batchGetItems).not.toHaveBeenCalled();
      expect(usernames).toEqual({});
    });
  });

  describe('Create new User', () => {
    test('createNewUser - User details are passed, it should create a user entity and persist it.', () => {
      const userDetails = {
        key: '1',
        playerName: 'Roid',
        serverName: 'Goon Squad',
      };
      clashSubscriptionDbImpl.clashSubscriptionTable = {
        create: jest.fn().mockImplementation((data, callback) => {
          callback(undefined, data);
        }),
      };
      return clashSubscriptionDbImpl.createUser(userDetails).then((createdUser) => {
        expect(createdUser.key).toEqual(userDetails.key);
        expect(createdUser.playerName).toEqual(userDetails.playerName);
        expect(createdUser.serverName).toEqual(userDetails.serverName);
        expect(createdUser.timeAdded).not.toBeFalsy();
      });
    });
  });
});
