const Joi = require('joi');
const clashUserDbImpl = require('../ClashUserDbImpl');
const dynamoDbHelper = require('../impl/DynamoDbHelper');

jest.mock('dynamodb');
jest.mock('../impl/DynamoDbHelper');

beforeEach(() => {
  jest.resetModules();
});

describe('Initialize Table connection', () => {
  test('Initialize the table connection to be used.', async () => {
    const expectedTableObject = { setupTable: true };
    dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableObject);
    return clashUserDbImpl.initialize().then(() => {
      expect(clashUserDbImpl.clashSubscriptionTable).toEqual(expectedTableObject);
      expect(dynamoDbHelper.initialize).toBeCalledWith(clashUserDbImpl.tableName,
        {
          hashKey: 'key',
          timestamps: true,
          schema: {
            key: Joi.string(),
            playerName: Joi.string(),
            serverId: Joi.string(),
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
    return clashUserDbImpl.initialize('Sample Table', {}).catch((err) => expect(err).toEqual(expectedError));
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
      serverId: server,
      preferredChampions: ['Akali'],
      subscribed: false,
    };
    clashUserDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [{ attrs: expectedResults }] });
      }),
    };
    return clashUserDbImpl.retrieveUserDetails(id).then((data) => {
      expect(data).toEqual(expectedResults);
    });
  });

  test('I should be returned an empty object if the user record does not exist.', () => {
    const id = '123456789';
    clashUserDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [] });
      }),
    };
    return clashUserDbImpl.retrieveUserDetails(id).then((data) => {
      expect(data).toEqual({});
    });
  });

  test('I should be returned an empty object if the user record does not exist and the object returned is undefined.', () => {
    const id = '123456789';
    clashUserDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(undefined, { Items: [] });
      }),
    };
    return clashUserDbImpl.retrieveUserDetails(id).then((data) => {
      expect(data).toEqual({});
    });
  });

  test('I should be able to return the error if one occurs.', () => {
    const id = '123456789';
    clashUserDbImpl.clashSubscriptionTable = {
      query: jest.fn().mockReturnThis(),
      exec: jest.fn().mockImplementation((callback) => {
        callback(new Error('Failed to retrieve'));
      }),
    };
    return clashUserDbImpl.retrieveUserDetails(id)
      .then((data) => expect(data).toBeTruthy())
      .catch((err) => expect(err).toEqual(new Error('Failed to retrieve')));
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

    clashUserDbImpl.clashSubscriptionTable = {
      update: jest.fn()
        .mockImplementation((updateParams,
          callback) => callback(undefined, { attrs: updatedRecord })),
    };

    return clashUserDbImpl
      .updateUser({ id: expectedUserId, playerName: updatedUsername }).then((results) => {
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

    clashUserDbImpl.clashSubscriptionTable = {
      update: jest
        .fn()
        .mockImplementation((updateParams,
          callback) => callback(expectedError, { attrs: updatedRecord })),
    };

    return clashUserDbImpl.updateUser({ id: expectedUserId, playerName: updatedUsername })
      .then(() => expect(true).toBeFalsy())
      .catch((err) => expect(err).toEqual(expectedError));
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

    const expectedMap = data
      .reduce((map, record) => (map[record
        .attrs.key] = record.attrs, map), {});

    clashUserDbImpl.clashSubscriptionTable = {
      batchGetItems: jest
        .fn()
        .mockImplementation((listOfKeys,
          callback) => callback(undefined, data)),
    };

    return clashUserDbImpl.retrieveAllUserDetails(expectedPlayerId).then((usernames) => {
      expect(clashUserDbImpl.clashSubscriptionTable.batchGetItems)
        .toHaveBeenCalledTimes(1);
      expect(clashUserDbImpl.clashSubscriptionTable.batchGetItems)
        .toHaveBeenCalledWith([expectedPlayerId], expect.any(Function));
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

    const expectedMap = data
      .reduce((map, record) => (map[record
        .attrs.key] = record.attrs, map), {});

    clashUserDbImpl.clashSubscriptionTable = {
      batchGetItems: jest
        .fn()
        .mockImplementation((listOfKeys, callback) => callback(undefined, data)),
    };

    return clashUserDbImpl
      .retrieveAllUserDetails([expectedPlayerId, expectedPlayerIdTwo]).then((usernames) => {
        expect(clashUserDbImpl.clashSubscriptionTable.batchGetItems)
          .toHaveBeenCalledTimes(1);
        expect(clashUserDbImpl.clashSubscriptionTable.batchGetItems)
          .toHaveBeenCalledWith([expectedPlayerId, expectedPlayerIdTwo], expect.any(Function));
        expect(usernames).toEqual(expectedMap);
      });
  });

  test('If no ids are passed, then it should return with an empty object.', () => {
    clashUserDbImpl.clashSubscriptionTable = {
      batchGetItems: jest
        .fn()
        .mockImplementation((listOfKeys,
          callback) => callback(undefined, undefined)),
    };

    return clashUserDbImpl.retrieveAllUserDetails([]).then((usernames) => {
      expect(clashUserDbImpl.clashSubscriptionTable.batchGetItems).not.toHaveBeenCalled();
      expect(usernames).toEqual({});
    });
  });

  test('If undefined is passed, then it should return with an empty object.', () => {
    clashUserDbImpl.clashSubscriptionTable = {
      batchGetItems: jest
        .fn()
        .mockImplementation((listOfKeys,
          callback) => callback(undefined, undefined)),
    };

    return clashUserDbImpl.retrieveAllUserDetails().then((usernames) => {
      expect(clashUserDbImpl.clashSubscriptionTable.batchGetItems).not.toHaveBeenCalled();
      expect(usernames).toEqual({});
    });
  });

  describe('Create new User', () => {
    test('createNewUser - User details are passed, it should create a user entity and persist it.', () => {
      const userDetails = {
        key: '1',
        playerName: 'Roid',
        serverId: 'Goon Squad',
      };
      clashUserDbImpl.clashSubscriptionTable = {
        create: jest.fn().mockImplementation((data, callback) => {
          callback(undefined, data);
        }),
      };
      return clashUserDbImpl.createUser(userDetails).then((createdUser) => {
        expect(createdUser.key).toEqual(userDetails.key);
        expect(createdUser.playerName).toEqual(userDetails.playerName);
        expect(createdUser.serverId).toEqual(userDetails.serverId);
        expect(createdUser.timeAdded).not.toBeFalsy();
      });
    });
  });
});
