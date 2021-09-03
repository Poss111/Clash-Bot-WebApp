const clashUserServiceImpl = require('../clash-user-service-impl');
const clashSubscriptionDbImpl = require('../../dao/clash-subscription-db-impl');

jest.mock('../../dao/clash-subscription-db-impl');

beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
})

describe('Clash User Service Impl', () => {
    describe('Create base User if the user does not exist.', () => {
        test('User does not exist - It if is false, then create a base User Object.', () => {
            const expectedUserId = '1';
            const expectedUsername = 'Roidrage';
            const expectedServername = 'Goon Squad';
            const expectedPreferredChampions = [];
            const expectedUserDetails = {
                key: expectedUserId,
                username: expectedUsername,
                serverName: expectedServername,
                preferredChampions: expectedPreferredChampions,
            };
            clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(undefined);
            clashSubscriptionDbImpl.createUpdateUserDetails.mockResolvedValue(expectedUserDetails);
            return clashUserServiceImpl.checkIfIdExists(expectedUserId, expectedUsername, expectedServername).then((userDetails) => {
                expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
                expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
                expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledTimes(1)
                expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledWith(expectedUserId, expectedServername, expectedUsername, expectedPreferredChampions);
                expect(userDetails).toEqual(expectedUserDetails);
            })
        })

        test('User does not exist - It if is false (Is empty object), then create a base User Object.', () => {
            const expectedUserId = '1';
            const expectedUsername = 'Roidrage';
            const expectedServername = 'Goon Squad';
            const expectedPreferredChampions = [];
            const expectedUserDetails = {
                key: expectedUserId,
                username: expectedUsername,
                serverName: expectedServername,
                preferredChampions: expectedPreferredChampions,
            };
            clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue({});
            clashSubscriptionDbImpl.createUpdateUserDetails.mockResolvedValue(expectedUserDetails);
            return clashUserServiceImpl.checkIfIdExists(expectedUserId, expectedUsername, expectedServername).then((userDetails) => {
                expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
                expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
                expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledTimes(1)
                expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledWith(expectedUserId, expectedServername, expectedUsername, expectedPreferredChampions);
                expect(userDetails).toEqual(expectedUserDetails);
            })
        })

        test('User exists - It if is true , then return immediately.', () => {
            const expectedUserId = '1';
            const expectedUsername = 'Roidrage';
            const expectedServername = 'Goon Squad';
            const expectedPreferredChampions = [];
            const expectedUserDetails = {
                key: expectedUserId,
                username: expectedUsername,
                serverName: expectedServername,
                preferredChampions: expectedPreferredChampions,
            };
            clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(expectedUserDetails);
            return clashUserServiceImpl.checkIfIdExists(expectedUserId, expectedUsername, expectedServername).then((userDetails) => {
                expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
                expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(expectedUserId);
                expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledTimes(0);
                expect(userDetails).toEqual(expectedUserDetails);
            })
        })
    })

    describe('Update a User record.', () => {
        test('When I pass the user id and a username, it should map it to playerName and pass it along to update the record.', () => {
            const expectedId = '1';
            const expectedUpdatedUsername = 'Roid';
            clashSubscriptionDbImpl.updateUser.mockResolvedValue({ key: expectedId, playerName: expectedUpdatedUsername });
            return clashUserServiceImpl.updateUserDetails(expectedId, expectedUpdatedUsername).then((results) => {
                expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
                expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({ key: expectedId, playerName: expectedUpdatedUsername });
                expect(results).toEqual({ key: expectedId, playerName: expectedUpdatedUsername });
            })
        })

        test('When I pass the user id and a preferred, it should map it to playerName and pass it along to update the record.', () => {
            const expectedId = '1';
            const expectedUpdatedUsername = 'Roid';
            clashSubscriptionDbImpl.updateUser.mockResolvedValue({ key: expectedId, playerName: expectedUpdatedUsername });
            return clashUserServiceImpl.updateUserDetails(expectedId, expectedUpdatedUsername).then((results) => {
                expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledTimes(1);
                expect(clashSubscriptionDbImpl.updateUser).toHaveBeenCalledWith({ key: expectedId, playerName: expectedUpdatedUsername });
                expect(results).toEqual({ key: expectedId, playerName: expectedUpdatedUsername });
            })
        })

        test('Error - If id is not passed then reject', () => {
            return clashUserServiceImpl.updateUserDetails().then(() => {
                expect(true).toBeFalsy();
            }).catch(err => expect(err).toEqual('Failed to pass id.'))
        })
    })
})
