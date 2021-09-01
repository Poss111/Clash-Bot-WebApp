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
                id: expectedUserId,
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

        test('User exists - It if is true, then return immediately.', () => {
            const expectedUserId = '1';
            const expectedUsername = 'Roidrage';
            const expectedServername = 'Goon Squad';
            const expectedPreferredChampions = [];
            const expectedUserDetails = {
                id: expectedUserId,
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
})
