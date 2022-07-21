const clashUserServiceImpl = require('../UserService');
const clashSubscriptionDbImpl = require('../../dao/clash-subscription-db-impl');
const { deepCopy } = require('../../utils/tests/test-utility.utility.test');

jest.mock('../../dao/clash-subscription-db-impl');

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('Clash User Service Impl', () => {
  describe('Create base User if the user does not exist.', () => {
    test('User does not exist - it should return Error.', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'User not found.',
        code: 204,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl.getUser({ id: expectedUserId }).catch((userDetails) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
        expect(userDetails).toEqual(expectedUserDetails);
      });
    });

    test('User exists - then return the User Details.', () => {
      const expectedUserId = '1';
      const expectedUsername = 'Roidrage';
      const expectedServername = 'Goon Squad';
      const expectedPreferredChampions = [];
      const expectedUserDetails = {
        key: expectedUserId,
        playerName: expectedUsername,
        serverName: expectedServername,
        preferredChampions: expectedPreferredChampions,
        subscribed: true,
      };
      const expectedPlayerResponse = {
        code: 200,
        payload: {
          id: expectedUserDetails.key,
          name: expectedUserDetails.playerName,
          serverName: expectedUserDetails.serverName,
          champions: expectedUserDetails.preferredChampions,
          subscriptions: [{
            key: 'UpcomingClashTournamentDiscordDM',
            isOn: true,
          }],
        },
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(expectedUserDetails);
      return clashUserServiceImpl.getUser({ id: expectedUserId }).then((userDetails) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
        expect(userDetails).toEqual(expectedPlayerResponse);
      });
    });
  });

  describe('Update a User record.', () => {
    test('When I pass the user id and a username, it should map it to playerName and pass it along to update the record.', () => {
      const expectedId = '1';
      const expectedUpdatedUsername = 'Roid';
      const passedUser = {
        id: expectedId,
        name: expectedUpdatedUsername,
        champions: [],
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      const expectedConvertedUser = {
        key: expectedId,
        playerName: expectedUpdatedUsername,
        preferredChampions: [],
        subscribed: 'true',
        serverName: 'SampleServer',
      };
      const expectedResponse = {
        code: 200,
        payload: {
          id: passedUser.id,
          name: expectedUpdatedUsername,
          champions: [],
          subscriptions: [{
            key: 'UpcomingClashTournamentDiscordDM',
            isOn: true,
          }],
          serverName: 'SampleServer',
        },
      };
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(expectedConvertedUser);
      return clashUserServiceImpl.updateUser({ body: passedUser }).then((results) => {
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith(expectedConvertedUser);
        expect(results).toEqual(expectedResponse);
      });
    });

    test('If something goes wrong - it should return Error.', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'Failed to persist.',
        code: 500,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockRejectedValue(new Error('Failed to persist.'));
      return clashUserServiceImpl.getUser({ id: expectedUserId }).catch((userDetails) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
        expect(userDetails).toEqual(expectedUserDetails);
      });
    });
  });

  describe('Create a User record.', () => {
    test('createUser - pass a new user to be created when given details.', () => {
      const userRequest = {
        id: '1',
        name: 'Me',
        server: 'Goon Squad',
      };
      const userResponse = {
        code: 200,
        payload: {
          id: '1',
          name: 'Me',
          serverName: 'Goon Squad',
          champions: [],
          subscriptions: [{
            key: 'UpcomingClashTournamentDiscordDM',
            isOn: false,
          }],
        },
      };
      const userRequestEntity = {
        key: '1',
        playerName: 'Me',
        serverName: 'Goon Squad',
      };
      clashSubscriptionDbImpl.createUser.mockResolvedValue(userRequestEntity);
      return clashUserServiceImpl.createUser({ createUserRequest: userRequest })
        .then((response) => {
          expect(response).toEqual(userResponse);
        });
    });
  });

  describe('Get Subscription', () => {
    test('retrieveUserSubscriptions - When a user is subscribed, it should retrieve and return a subscription object.', () => {
      const expectedId = '1';
      const userEntityResponse = {
        key: expectedId,
        playerName: 'Roid',
        subscribed: 'true',
        serverName: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(userEntityResponse);
      return clashUserServiceImpl.retrieveUserSubscriptions({ id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(results).toEqual({ code: 200, payload: [{ key: 'UpcomingClashTournamentDiscordDM', isOn: true }] });
      });
    });

    test('If user does not exist, return with a 204', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'User not found.',
        code: 400,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl.retrieveUserSubscriptions({ id: expectedUserId }).catch((userDetails) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
        expect(userDetails).toEqual(expectedUserDetails);
      });
    });
  });

  describe('Update the champion list completely', () => {
    test('createNewListOfPreferredChampions - If a valid array is passed, it should update the champions list there.', () => {
      const expectedId = '1';
      const championToAdd = 'Taric';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions = [championToAdd];
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: updatedUser.preferredChampions,
      };
      return clashUserServiceImpl.createNewListOfPreferredChampions({ body: { champions: [ championToAdd ] }, id: expectedId })
        .then((results) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith(updatedUser);
          expect(results).toEqual(expectedResponse);
        });
    });

    test('createNewListOfPreferredChampions - if User already has preferred champions, overwrite the list. ', () => {
      const expectedId = '1';
      const championToAdd = 'Sejuani';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        preferredChampions: ['Taric'],
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions = [championToAdd];
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: [championToAdd],
      };
      return clashUserServiceImpl.createNewListOfPreferredChampions({ body: { champions: [championToAdd ] }, id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith(updatedUser);
        expect(results).toEqual(expectedResponse);
      });
    });

    test('If user does not exist, return with a 204', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'User not found.',
        code: 400,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl.createNewListOfPreferredChampions({ body: { championName: 'SomeChamp' }, id: expectedUserId }).catch((userDetails) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
        expect(userDetails).toEqual(expectedUserDetails);
      });
    });
  });

  describe('Add a preferred champion', () => {
    test('addToListOfPreferredChampions - When a preferred champion list is undefined it should add a preferred champion to the requested users preferred champions list.', () => {
      const expectedId = '1';
      const championToAdd = 'Sejuani';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions = [championToAdd];
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: updatedUser.preferredChampions,
      };
      return clashUserServiceImpl.addToListOfPreferredChampions({ body: { championName: championToAdd }, id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith(updatedUser);
        expect(results).toEqual(expectedResponse);
      });
    });

    test('addToListOfPreferredChampions - if User already has preferred champions, then add to the existing list. ', () => {
      const expectedId = '1';
      const championToAdd = 'Sejuani';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        preferredChampions: ['Taric'],
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions.push(championToAdd);
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: updatedUser.preferredChampions,
      };
      return clashUserServiceImpl.addToListOfPreferredChampions({ body: { championName: championToAdd }, id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith(updatedUser);
        expect(results).toEqual(expectedResponse);
      });
    });

    test('If user does not exist, return with a 204', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'User not found.',
        code: 400,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl.addToListOfPreferredChampions({ body: { championName: 'SomeChamp' }, id: expectedUserId }).catch((userDetails) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
        expect(userDetails).toEqual(expectedUserDetails);
      });
    });
  });

  describe('Remove a preferred champion', () => {
    test('removeFromListOfPreferredChampions - if a champion is not found in the list then return the same array.', () => {
      const expectedId = '1';
      const championToRemove = 'Sejuani';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        preferredChampions: ['Taric'],
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const expectedResponse = {
        code: 200,
        payload: foundUser.preferredChampions,
      };
      return clashUserServiceImpl.removeFromListOfPreferredChampions({ body: { championName: championToRemove }, id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
        expect(results).toEqual(expectedResponse);
      });
    });

    test('removeFromListOfPreferredChampions - if User already has preferred champions, then remove them from the existing list. ', () => {
      const expectedId = '1';
      const championToRemove = 'Taric';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        preferredChampions: ['Taric'],
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions = [];
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: updatedUser.preferredChampions,
      };
      return clashUserServiceImpl.removeFromListOfPreferredChampions({ body: { championName: championToRemove }, id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith(updatedUser);
        expect(results).toEqual(expectedResponse);
      });
    });

    test('removeFromListOfPreferredChampions - If user has empty preferred champions list then it should return an empty array.', () => {
      const expectedId = '1';
      const championToRemove = 'Taric';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const expectedResponse = {
        code: 200,
        payload: [],
      };
      return clashUserServiceImpl.removeFromListOfPreferredChampions({ body: { championName: championToRemove }, id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
        expect(results).toEqual(expectedResponse);
      });
    });

    test('If user does not exist, return with a 204', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'User not found.',
        code: 400,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl.removeFromListOfPreferredChampions({ body: { championName: 'SomeChamp' }, id: expectedUserId })
        .then(() => expect(true).toBeFalsy())
        .catch((userDetails) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(userDetails).toEqual(expectedUserDetails);
        });
    });
  });

  describe('Retrieve a preferred champions list', () => {
    test('Retrieve the requested users preferred champions list.', () => {
      const expectedId = '1';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        preferredChampions: ['Taric', 'Jayce'],
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      const expectedResponse = {
        code: 200,
        payload: foundUser.preferredChampions,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      return clashUserServiceImpl.retrieveListOfUserPreferredChampions({ id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(results).toEqual(expectedResponse);
      });
    });

    test('If user preferred champion list is undefined, return an empty array.', () => {
      const expectedId = '1';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverName: 'SampleServer',
      };
      const expectedResponse = {
        code: 200,
        payload: [],
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      return clashUserServiceImpl.retrieveListOfUserPreferredChampions({ id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(results).toEqual(expectedResponse);
      });
    });

    test('If user does not exist, return with a 204', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'User not found.',
        code: 400,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl.retrieveListOfUserPreferredChampions({ id: expectedUserId }).catch((userDetails) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
        expect(userDetails).toEqual(expectedUserDetails);
      });
    });
  });
});
