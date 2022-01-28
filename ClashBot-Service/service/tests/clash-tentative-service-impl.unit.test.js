const clashTentativeServiceImpl = require('../clash-tentative-service-impl');
const clashTentativeDbImpl = require('../../dao/clash-tentative-db-impl');
const clashSubscriptionDbImpl = require('../../dao/clash-subscription-db-impl');
const clashTeamsServiceImpl = require('../../service/clash-teams-service-impl');
const {deepCopy} = require('../../utility/tests/test-utility.utility.test');

jest.mock('../../dao/clash-tentative-db-impl');
jest.mock('../../service/clash-teams-service-impl');
jest.mock('../../dao/clash-subscription-db-impl');

beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
})

describe('Clash Tentative Service', () => {

    describe('Handle Tentative', () => {

        describe('Handle Tentative', () => {
            test('As a user, when I call to handle tentative and I am being added, I should be unregistered from the existing the Team for the server and Tournament.', () => {
                const expectedPlayerId = '12321311';
                const expectedUsername = 'Roidrage';
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '1';
                const tentativeObject = {
                    key: '1234566',
                    tentativePlayers: [],
                    serverName: expectedServerName,
                    tournamentDetails: {tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay}
                };
                clashTentativeDbImpl.isTentative.mockResolvedValue({
                    onTentative: false,
                    tentativeList: tentativeObject
                });
                clashTeamsServiceImpl.unregisterFromTeam.mockResolvedValue({});
                let addTentativeDbResponse = deepCopy(tentativeObject);
                addTentativeDbResponse.tentativePlayers.push(expectedPlayerId);
                let idToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);
                const expectedApiResponse = {
                    serverName: addTentativeDbResponse.serverName,
                    tournamentDetails: addTentativeDbResponse.tournamentDetails,
                    tentativePlayers: [idToPlayerNameMap[addTentativeDbResponse.tentativePlayers[0]]]
                };
                clashTentativeDbImpl.addToTentative.mockResolvedValue(addTentativeDbResponse);
                return clashTentativeServiceImpl.handleTentativeRequest(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(tentativeResponse => {
                        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledTimes(1);
                        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, {
                            tournamentName: expectedTournamentName,
                            tournamentDay: expectedTournamentDay
                        });
                        expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
                        expect(clashTentativeDbImpl.addToTentative).toHaveBeenCalledTimes(1);
                        expect(clashTentativeDbImpl.addToTentative).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, {
                            tournamentName: expectedTournamentName,
                            tournamentDay: expectedTournamentDay
                        }, tentativeObject);
                        expect(clashTeamsServiceImpl.unregisterFromTeam).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.unregisterFromTeam).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                        verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                        expect(tentativeResponse).toEqual(expectedApiResponse);
                    });
            })

            test('As a user, when I call to handle tentative and I am being removed, I should be not be unregistered from the existing the Team for the server and Tournament.', () => {
                const expectedPlayerId = '12321312';
                const expectedPlayerIdTwo = '12321311';
                const expectedUsername = 'Roidrage';
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '1';
                const tentativeObject = {
                    key: '1234566',
                    tentativePlayers: [expectedPlayerId, expectedPlayerIdTwo],
                    serverName: expectedServerName,
                    tournamentDetails: {tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay}
                };
                clashTentativeDbImpl.isTentative.mockResolvedValue({onTentative: true, tentativeList: tentativeObject});
                clashTeamsServiceImpl.unregisterFromTeam.mockResolvedValue({});
                let removeTentativeDbResponse = deepCopy(tentativeObject);
                removeTentativeDbResponse.tentativePlayers.pop();
                let idToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);
                const expectedApiResponse = {
                    serverName: removeTentativeDbResponse.serverName,
                    tournamentDetails: removeTentativeDbResponse.tournamentDetails,
                    tentativePlayers: [idToPlayerNameMap[removeTentativeDbResponse.tentativePlayers[0]]]
                };
                clashTentativeDbImpl.removeFromTentative.mockResolvedValue(removeTentativeDbResponse);
                return clashTentativeServiceImpl.handleTentativeRequest(expectedPlayerIdTwo, expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(tentativeResponse => {
                        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledTimes(1);
                        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledWith(expectedPlayerIdTwo, expectedServerName, {
                            tournamentName: expectedTournamentName,
                            tournamentDay: expectedTournamentDay
                        });
                        expect(clashTentativeDbImpl.addToTentative).not.toHaveBeenCalled();
                        expect(clashTentativeDbImpl.removeFromTentative).toHaveBeenCalledTimes(1);
                        expect(clashTentativeDbImpl.removeFromTentative).toHaveBeenCalledWith(expectedPlayerIdTwo, tentativeObject);
                        expect(clashTeamsServiceImpl.unregisterFromTeam).not.toHaveBeenCalled();
                        verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                        expect(tentativeResponse).toEqual(expectedApiResponse);
                    });
            })
        })

        describe('Handle Tentative - v2', () => {
            test('As a user, when I call to handle tentative and I am being added, ' +
                'I should be unregistered from the existing the Team for the ' +
                'server and Tournament. - v2', () => {
                const expectedPlayerId = '12321311';
                const expectedUsername = 'Roidrage';
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '1';
                const tentativeObject = {
                    key: '1234566',
                    tentativePlayers: [],
                    serverName: expectedServerName,
                    tournamentDetails: {tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay}
                };
                clashTentativeDbImpl.isTentative.mockResolvedValue({
                    onTentative: false,
                    tentativeList: tentativeObject
                });
                clashTeamsServiceImpl.unregisterFromTeamV2.mockResolvedValue({});
                let addTentativeDbResponse = deepCopy(tentativeObject);
                addTentativeDbResponse.tentativePlayers.push(expectedPlayerId);
                let idToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);
                const expectedApiResponse = {
                    serverName: addTentativeDbResponse.serverName,
                    tournamentDetails: addTentativeDbResponse.tournamentDetails,
                    tentativePlayers: [idToPlayerNameMap[addTentativeDbResponse.tentativePlayers[0]]]
                };
                clashTentativeDbImpl.addToTentative.mockResolvedValue(addTentativeDbResponse);
                return clashTentativeServiceImpl.handleTentativeRequestV2(expectedPlayerId,
                    expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(tentativeResponse => {
                        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledTimes(1);
                        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledWith(expectedPlayerId,
                            expectedServerName, {
                            tournamentName: expectedTournamentName,
                            tournamentDay: expectedTournamentDay
                        });
                        expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
                        expect(clashTentativeDbImpl.addToTentative).toHaveBeenCalledTimes(1);
                        expect(clashTentativeDbImpl.addToTentative).toHaveBeenCalledWith(expectedPlayerId,
                            expectedServerName, {
                            tournamentName: expectedTournamentName,
                            tournamentDay: expectedTournamentDay
                        }, tentativeObject);
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2).toHaveBeenCalledWith(expectedPlayerId,
                            expectedServerName, expectedTournamentName, expectedTournamentDay);
                        verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                        expect(tentativeResponse).toEqual(expectedApiResponse);
                    });
            })

            test('As a user, when I call to handle tentative and I am being removed, I should be not ' +
                'be unregistered from the existing the Team for the server and Tournament. - v2', () => {
                const expectedPlayerId = '12321312';
                const expectedPlayerIdTwo = '12321311';
                const expectedUsername = 'Roidrage';
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '1';
                const tentativeObject = {
                    key: '1234566',
                    tentativePlayers: [expectedPlayerId, expectedPlayerIdTwo],
                    serverName: expectedServerName,
                    tournamentDetails: {tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay}
                };
                clashTentativeDbImpl.isTentative.mockResolvedValue({onTentative: true,
                    tentativeList: tentativeObject});
                clashTeamsServiceImpl.unregisterFromTeamV2.mockResolvedValue({});
                let removeTentativeDbResponse = deepCopy(tentativeObject);
                removeTentativeDbResponse.tentativePlayers.pop();
                let idToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);
                const expectedApiResponse = {
                    serverName: removeTentativeDbResponse.serverName,
                    tournamentDetails: removeTentativeDbResponse.tournamentDetails,
                    tentativePlayers: [idToPlayerNameMap[removeTentativeDbResponse.tentativePlayers[0]]]
                };
                clashTentativeDbImpl.removeFromTentative.mockResolvedValue(removeTentativeDbResponse);
                return clashTentativeServiceImpl.handleTentativeRequestV2(expectedPlayerIdTwo,
                    expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(tentativeResponse => {
                        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledTimes(1);
                        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledWith(expectedPlayerIdTwo,
                            expectedServerName, {
                            tournamentName: expectedTournamentName,
                            tournamentDay: expectedTournamentDay
                        });
                        expect(clashTentativeDbImpl.addToTentative).not.toHaveBeenCalled();
                        expect(clashTentativeDbImpl.removeFromTentative).toHaveBeenCalledTimes(1);
                        expect(clashTentativeDbImpl.removeFromTentative).toHaveBeenCalledWith(expectedPlayerIdTwo,
                            tentativeObject);
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2).not.toHaveBeenCalled();
                        verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                        expect(tentativeResponse).toEqual(expectedApiResponse);
                    });
            })
        })

    })
    test('Error - isTentative fails - if the promise to isTentative fails, then it should be rejected successfully.', () => {
        const expectedPlayerIdTwo = '12321311';
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '1';
        let error = new Error('Failed to retrieve');
        clashTentativeDbImpl.isTentative.mockRejectedValue(error);
        return clashTentativeServiceImpl.handleTentativeRequest(expectedPlayerIdTwo, expectedServerName, expectedTournamentName, expectedTournamentDay)
            .then(() => expect(true).toBeFalsy())
            .catch(err => expect(err).toEqual(error));
    })

    test('Error - unregisterFromTeam fails - if the promise to unregisterFromTeam fails, then it should be rejected successfully.', () => {
        const expectedPlayerId = '12321311';
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '1';
        const tentativeObject = {key: '1234566', tentativePlayers: [], serverName: expectedServerName, tournamentDetails: { tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay }};
        let error = new Error('Failed to unregister');
        clashTentativeDbImpl.isTentative.mockResolvedValue({onTentative: false, tentativeList: tentativeObject});
        clashTeamsServiceImpl.unregisterFromTeam.mockRejectedValue(error);
        return clashTentativeServiceImpl.handleTentativeRequest(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
            .then(() => expect(true).toBeFalsy())
            .catch(err => expect(err).toEqual(error));
    })

    test('Error - addToTentative fails - if the promise to addToTentative fails, then it should be rejected successfully.', () => {
        const expectedPlayerId = '12321311';
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '1';
        const tentativeObject = {key: '1234566', tentativePlayers: [], serverName: expectedServerName, tournamentDetails: { tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay }};
        let error = new Error('Failed to addToTentative');
        clashTentativeDbImpl.isTentative.mockResolvedValue({onTentative: false, tentativeList: tentativeObject});
        clashTeamsServiceImpl.unregisterFromTeam.mockResolvedValue({});
        clashTentativeDbImpl.addToTentative.mockRejectedValue(error);
        return clashTentativeServiceImpl.handleTentativeRequest(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
            .then(() => expect(true).toBeFalsy())
            .catch(err => expect(err).toEqual(error));
    })

    test('Error - removeFromTentative fails - if the promise to removeFromTentative fails, then it should be rejected successfully.', () => {
        const expectedPlayerId = '12321311';
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '1';
        const tentativeObject = {key: '1234566', tentativePlayers: [], serverName: expectedServerName, tournamentDetails: { tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay }};
        let error = new Error('Failed to removeFromTentative');
        clashTentativeDbImpl.isTentative.mockResolvedValue({onTentative: true, tentativeList: tentativeObject});
        clashTentativeDbImpl.removeFromTentative.mockRejectedValue(error);
        return clashTentativeServiceImpl.handleTentativeRequest(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
            .then(() => expect(true).toBeFalsy())
            .catch(err => expect(err).toEqual(error));
    })
})

function setupRetrievePlayerNames(expectedPlayerId, expectedUsername) {
    let idToNameObject = {};
    if (Array.isArray(expectedPlayerId)) {
        for (let index in expectedPlayerId) {
            idToNameObject[expectedPlayerId[index]] = expectedUsername[index];
        }
    } else {
        idToNameObject[expectedPlayerId] = expectedUsername;
    }
    clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue(idToNameObject);
    return idToNameObject;
}

function verifyRetrievePlayerNamesIsInvoked(expectedPlayerIds) {
    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1)
    if (expectedPlayerIds) {
        !Array.isArray(expectedPlayerIds) ? expectedPlayerIds = [expectedPlayerIds] : undefined;
    }
    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith(expectedPlayerIds);
}
