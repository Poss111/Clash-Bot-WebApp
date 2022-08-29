const clashUserServiceImpl = require('../UserService');
const clashSubscriptionDbImpl = require('../../dao/ClashUserDbImpl');
const { deepCopy } = require('../../utils/tests/test-utility.utility.test');

jest.mock('../../dao/ClashUserDbImpl');

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('Clash User Service Impl', () => {
  describe('Create base User if the user does not exist.', () => {
    test('User does not exist - it should return Error.', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'Resource not found.',
        code: 404,
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
      const expectedserverId = 'Goon Squad';
      const expectedPreferredChampions = [];
      const expectedUserDetails = {
        key: expectedUserId,
        playerName: expectedUsername,
        serverId: expectedserverId,
        preferredChampions: expectedPreferredChampions,
        subscribed: true,
      };
      const expectedPlayerResponse = {
        code: 200,
        payload: {
          id: expectedUserDetails.key,
          name: expectedUserDetails.playerName,
          serverId: expectedUserDetails.serverId,
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
        serverId: 'SampleServer',
      };
      const expectedConvertedUser = {
        key: expectedId,
        playerName: expectedUpdatedUsername,
        preferredChampions: [],
        subscribed: 'true',
        serverId: 'SampleServer',
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
          serverId: 'SampleServer',
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
        error: 'Something went wrong.',
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
          serverId: 'Goon Squad',
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
        serverId: 'Goon Squad',
      };
      clashSubscriptionDbImpl.createUser.mockResolvedValue(userRequestEntity);
      return clashUserServiceImpl.createUser({ body: userRequest })
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
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(userEntityResponse);
      return clashUserServiceImpl.retrieveUserSubscriptions({ id: expectedId }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(results).toEqual({ code: 200, payload: [{ key: 'UpcomingClashTournamentDiscordDM', isOn: true }] });
      });
    });

    test('If user does not exist, return with a 404.', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'Resource not found.',
        code: 404,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl
        .retrieveUserSubscriptions({ id: expectedUserId })
        .catch((userDetails) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(userDetails).toEqual(expectedUserDetails);
        });
    });
  });

  describe('Subscribe User', () => {
    test('subscribeUser - will subscribe user.', () => {
      const expectedUserId = '2';
      const returnedUser = {
        key: expectedUserId,
        playerName: 'Roid',
        serverId: 'Goon Squad',
      };
      const updatedUser = deepCopy(returnedUser);
      updatedUser.subscribed = 'true';
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(returnedUser);
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      return clashUserServiceImpl.subscribeUser({ id: expectedUserId })
        .then((updatedSubscriptions) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({
            key: updatedUser.key,
            subscribed: 'true',
          });
          expect(updatedSubscriptions).toEqual({
            code: 200,
            payload: [
              {
                key: 'UpcomingClashTournamentDiscordDM',
                isOn: true,
              },
            ],
          });
        });
    });

    test('subscribeUser - If user is already subscribed, do not update User.', () => {
      const expectedUserId = '2';
      const returnedUser = {
        key: expectedUserId,
        playerName: 'Roid',
        serverId: 'Goon Squad',
        subscribed: 'true',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(returnedUser);
      return clashUserServiceImpl.subscribeUser({ id: expectedUserId })
        .then((updatedSubscriptions) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
          expect(updatedSubscriptions).toEqual({
            code: 200,
            payload: [
              {
                key: 'UpcomingClashTournamentDiscordDM',
                isOn: true,
              },
            ],
          });
        });
    });

    test('subscribeUser - If user is does not exist return with 404.', () => {
      const expectedUserId = '12';
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl.subscribeUser({ id: expectedUserId })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
          expect(err).toEqual({
            code: 404,
            error: 'Resource not found.',
          });
        });
    });
  });

  describe('Unsubscribe User', () => {
    test('unsubscribeUser - will unsubscribe user.', () => {
      const expectedUserId = '2';
      const returnedUser = {
        key: expectedUserId,
        playerName: 'Roid',
        serverId: 'Goon Squad',
        subscribed: 'true',
      };
      const updatedUser = deepCopy(returnedUser);
      updatedUser.subscribed = '';
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(returnedUser);
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      return clashUserServiceImpl.unsubscribeUser({ id: expectedUserId })
        .then((updatedSubscriptions) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({
            key: expectedUserId,
            subscribed: '',
          });
          expect(updatedSubscriptions).toEqual({
            code: 200,
            payload: [
              {
                key: 'UpcomingClashTournamentDiscordDM',
                isOn: false,
              },
            ],
          });
        });
    });

    test('unsubscribeUser - If user is already unsubscribed, do not update User.', () => {
      const expectedUserId = '2';
      const returnedUser = {
        key: expectedUserId,
        playerName: 'Roid',
        serverId: 'Goon Squad',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(returnedUser);
      return clashUserServiceImpl.unsubscribeUser({ id: expectedUserId })
        .then((updatedSubscriptions) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
          expect(updatedSubscriptions).toEqual({
            code: 200,
            payload: [
              {
                key: 'UpcomingClashTournamentDiscordDM',
                isOn: false,
              },
            ],
          });
        });
    });

    test('unsubscribeUser - If user is does not exist return with 404.', () => {
      const expectedUserId = '12';
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl.unsubscribeUser({ id: expectedUserId })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
          expect(err).toEqual({
            code: 404,
            error: 'Resource not found.',
          });
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
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions = [championToAdd];
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: updatedUser.preferredChampions,
      };
      return clashUserServiceImpl
        .createNewListOfPreferredChampions(
          {
            body: { champions: [championToAdd] },
            id: expectedId,
          },
        ).then((results) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({
            key: updatedUser.key,
            preferredChampions: updatedUser.preferredChampions,
          });
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
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions = [championToAdd];
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: [championToAdd],
      };
      return clashUserServiceImpl
        .createNewListOfPreferredChampions(
          {
            body: { champions: [championToAdd] },
            id: expectedId,
          },
        )
        .then((results) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({
            key: updatedUser.key,
            preferredChampions: updatedUser.preferredChampions,
          });
          expect(results).toEqual(expectedResponse);
        });
    });

    test('createNewListOfPreferredChampions - If an array with great than 5 champions are passed, it should fail with 400.', () => {
      const expectedId = '1';
      const championToAdd = 'Taric';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const expectedResponse = {
        code: 400,
        error: 'Too many champions. Must be less than or equal to 5.',
      };
      return clashUserServiceImpl.createNewListOfPreferredChampions({
        body: {
          champions: [
            championToAdd,
            championToAdd,
            championToAdd,
            championToAdd,
            championToAdd,
            championToAdd,
          ],
        },
        id: expectedId,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
          expect(err).toEqual(expectedResponse);
        });
    });

    test('If user does not exist, return with a 404', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'Resource not found.',
        code: 404,
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
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions = [championToAdd];
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: updatedUser.preferredChampions,
      };
      return clashUserServiceImpl
        .addToListOfPreferredChampions(
          {
            body: { championName: championToAdd },
            id: expectedId,
          },
        ).then((results) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({
            key: updatedUser.key,
            preferredChampions: updatedUser.preferredChampions,
          });
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
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions.push(championToAdd);
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: updatedUser.preferredChampions,
      };
      return clashUserServiceImpl
        .addToListOfPreferredChampions(
          {
            body: { championName: championToAdd },
            id: expectedId,
          },
        ).then((results) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({
            key: updatedUser.key,
            preferredChampions: updatedUser.preferredChampions,
          });
          expect(results).toEqual(expectedResponse);
        });
    });

    test('addToListOfPreferredChampions - if User has more than five champions already, then 400 should be returned.', () => {
      const expectedId = '1';
      const championToAdd = 'Volibear';
      const foundUser = {
        key: expectedId,
        name: 'Roid',
        preferredChampions: ['Taric', 'Sejuani', 'Kha\'zix', 'Rengar', 'Ornn'],
        subscriptions: [{
          key: 'UpcomingClashTournamentDiscordDM',
          isOn: true,
        }],
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const expectedResponse = {
        code: 400,
        error: 'Too many champions. Must be less than or equal to 5.',
      };
      return clashUserServiceImpl
        .addToListOfPreferredChampions(
          {
            body: { championName: championToAdd },
            id: expectedId,
          },
        )
        .then(() => {
          expect(true).toBeFalsy();
        })
        .catch((err) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
          expect(err).toEqual(expectedResponse);
        });
    });

    test('If user does not exist, return with a 404', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'Resource not found.',
        code: 404,
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
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const expectedResponse = {
        code: 200,
        payload: foundUser.preferredChampions,
      };
      return clashUserServiceImpl.removeFromListOfPreferredChampions({
        champion: championToRemove,
        id: expectedId,
      }).then((results) => {
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
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const updatedUser = deepCopy(foundUser);
      updatedUser.preferredChampions = [];
      clashSubscriptionDbImpl.updateUser.mockResolvedValue(updatedUser);
      const expectedResponse = {
        code: 200,
        payload: updatedUser.preferredChampions,
      };
      return clashUserServiceImpl.removeFromListOfPreferredChampions({
        champion: championToRemove,
        id: expectedId,
      }).then((results) => {
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
        expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({
          key: updatedUser.key,
          preferredChampions: updatedUser.preferredChampions,
        });
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
        serverId: 'SampleServer',
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      const expectedResponse = {
        code: 200,
        payload: [],
      };
      return clashUserServiceImpl
        .removeFromListOfPreferredChampions(
          {
            body: { championName: championToRemove },
            id: expectedId,
          },
        ).then((results) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(clashSubscriptionDbImpl.updateUser).not.toHaveBeenCalled();
          expect(results).toEqual(expectedResponse);
        });
    });

    test('If user does not exist, return with a 404', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'Resource not found.',
        code: 404,
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
        serverId: 'SampleServer',
      };
      const expectedResponse = {
        code: 200,
        payload: foundUser.preferredChampions,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      return clashUserServiceImpl
        .retrieveListOfUserPreferredChampions({ id: expectedId })
        .then((results) => {
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
        serverId: 'SampleServer',
      };
      const expectedResponse = {
        code: 200,
        payload: [],
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(foundUser);
      return clashUserServiceImpl
        .retrieveListOfUserPreferredChampions({ id: expectedId })
        .then((results) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedId);
          expect(results).toEqual(expectedResponse);
        });
    });

    test('If user does not exist, return with a 404', () => {
      const expectedUserId = '1';
      const expectedUserDetails = {
        error: 'Resource not found.',
        code: 404,
      };
      clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
      return clashUserServiceImpl
        .retrieveListOfUserPreferredChampions({ id: expectedUserId })
        .catch((userDetails) => {
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
          expect(userDetails).toEqual(expectedUserDetails);
        });
    });
  });
});
