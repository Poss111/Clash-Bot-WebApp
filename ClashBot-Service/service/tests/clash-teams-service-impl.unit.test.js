const clashTeamsServiceImpl = require('../clash-teams-service-impl');
const clashTeamsDbImpl = require('../../dao/clash-teams-db-impl');
const clashTentativeDbImpl = require('../../dao/clash-tentative-db-impl');
const clashSubscriptionDbImpl = require('../../dao/clash-subscription-db-impl');
const {deepCopy} = require("../../utility/tests/test-utility.utility.test");

jest.mock('../../dao/clash-teams-db-impl');
jest.mock('../../dao/clash-tentative-db-impl');
jest.mock('../../dao/clash-subscription-db-impl');

beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
})

describe('Clash Teams Service Impl', () => {

    function verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledTimes(1);
        expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, {
            tournamentName: expectedTournamentName,
            tournamentDay: expectedTournamentDay
        })
    }

    function verifyRegisterPlayerIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime) {
        expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
            tournamentName: expectedTournamentName,
            tournamentDay: expectedTournamentDay,
            startTime: expectedStartTime
        }]);
    }

    function verifyRetrievePlayerNamesIsInvoked(expectedPlayerId) {
        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1)
        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith([expectedPlayerId]);
    }

    function verifyRemoveFromTentativeIsInvoked(expectedPlayerId, expectedTentativeListObject) {
        expect(clashTentativeDbImpl.removeFromTentative).toHaveBeenCalledTimes(1);
        expect(clashTentativeDbImpl.removeFromTentative).toHaveBeenCalledWith(expectedPlayerId, expectedTentativeListObject);
    }

    function mapToApiResponse(mockDbResponse, expectedServerName, idToNameObject) {
        return {
            teamName: mockDbResponse.teamName,
            serverName: expectedServerName,
            playersDetails: Array.isArray(mockDbResponse.players) ? mockDbResponse.players.map(id => {
                return {name: idToNameObject[id]}
            }) : {},
            tournamentDetails: {
                tournamentName: mockDbResponse.tournamentName,
                tournamentDay: mockDbResponse.tournamentDay
            },
            startTime: mockDbResponse.startTime,
        };
    }

    function setupRetrievePlayerNames(expectedPlayerId, expectedUsername) {
        let idToNameObject = {};
        idToNameObject[expectedPlayerId] = expectedUsername;
        clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue(idToNameObject);
        return idToNameObject;
    }

    function setupIsTentativeReturn(isTentative, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
        const mockIsTentativeObject = {
            onTentative: isTentative,
            tentativeList: {
                key: 'Some#key',
                tentativePlayers: [expectedPlayerId],
                serverName: expectedServerName,
                tournamentDetails: {tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay}
            }
        };
        clashTentativeDbImpl.isTentative.mockResolvedValue(mockIsTentativeObject);
        return mockIsTentativeObject;
    }

    describe('Create New Team', () => {

        const verifyCreateNewTeamResults = (expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, expectedTentativeListObject, removeFromTentative) => {
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            verifyRegisterPlayerIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
            verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
            expect(data).toEqual(expectedResult);
            removeFromTentative ? verifyRemoveFromTentativeIsInvoked(expectedPlayerId, expectedTentativeListObject) : expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
        }

        const setupCreateNewTeamData = (isTentative) => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedStartTime = new Date().toISOString();
            const mockDbResponse = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
            let idToNameObject = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

            const expectedResult = mapToApiResponse(mockDbResponse, expectedServerName, idToNameObject);
            const mockIsTentativeObject = setupIsTentativeReturn(isTentative, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

            clashTeamsDbImpl.registerPlayer.mockResolvedValue(mockDbResponse);
            return {
                expectedServerName,
                expectedTournamentName,
                expectedTournamentDay,
                expectedPlayerId,
                expectedStartTime,
                mockDbResponse,
                idToNameObject,
                mockIsTentativeObject,
                expectedResult,
            };
        }

        test('When I call to create a new Team, I should be removed from any tentative list that belongs to the server and tournament details given.', () => {
            let {expectedServerName, expectedTournamentName, expectedTournamentDay, expectedPlayerId, expectedStartTime, mockIsTentativeObject, expectedResult} = setupCreateNewTeamData(true);
            let mockTentativeObjectReturned = deepCopy(mockIsTentativeObject.tentativeList);
            mockTentativeObjectReturned.tentativePlayers.pop();
            clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);

            return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
                .then(data => verifyCreateNewTeamResults(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, mockIsTentativeObject.tentativeList, true));
        })

        test('When I call to create a new Team and I do not belong to and existing tentative list, I should not be removed from any tentative list that belongs to the server and tournament details given.', () => {
            let {expectedServerName, expectedTournamentName, expectedTournamentDay, expectedPlayerId, expectedStartTime, expectedResult} = setupCreateNewTeamData(false);
            return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
                .then(data => verifyCreateNewTeamResults(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, undefined, false));
        })

        test('No tournaments available - When I call to create a new Team, if I do not have any tournaments available to me then I should respond with a payload containing an error message.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedStartTime = new Date().toISOString();

            clashTeamsDbImpl.registerPlayer.mockResolvedValue({exist: true});

            setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

            return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
                .then(data => {
                    verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                    verifyRegisterPlayerIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
                    expect(data).toEqual({error: 'Player is not eligible to create a new Team.'});
                });
        })
    })

    describe('Register with Team', () => {
        function verifyRegisterWithSpecificTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName) {
            expect(clashTeamsDbImpl.registerWithSpecificTeam).toHaveBeenCalledTimes(1);
            expect(clashTeamsDbImpl.registerWithSpecificTeam).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay
            }], expectedTeamName);
        }

        test('When I call to register with a Team, I should be removed from any tentative list that belongs to the server and tournament details given.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedTeamName = 'Abra';

            let mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
            clashTeamsDbImpl.registerWithSpecificTeam.mockResolvedValue(mockDbTeamResponse);
            const idToNamesMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

            let mockIsTentativeReturn = setupIsTentativeReturn(true, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            let mockTentativeObjectReturned = deepCopy(mockIsTentativeReturn.tentativeList);
            mockTentativeObjectReturned.tentativePlayers.pop();
            clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);

            return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(resultingPayload => {
                    verifyRegisterWithSpecificTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
                    verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                    verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                    verifyRemoveFromTentativeIsInvoked(expectedPlayerId, mockIsTentativeReturn.tentativeList);
                    expect(resultingPayload).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, idToNamesMap));
                });
        })

        test('When I call to register with a Team and I am not on tentative, I should not be removed from any tentative list that belongs to the server and tournament details given.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedTeamName = 'Abra';

            let mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
            clashTeamsDbImpl.registerWithSpecificTeam.mockResolvedValue(mockDbTeamResponse);
            const idToNamesMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

            setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

            return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(resultingPayload => {
                    verifyRegisterWithSpecificTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
                    verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                    verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                    expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
                    expect(resultingPayload).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, idToNamesMap));
                });
        })

        test('When I call to register with a Team and I am not able to join it, I should return an error payload stating so.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedTeamName = 'Abra';

            clashTeamsDbImpl.registerWithSpecificTeam.mockResolvedValue(undefined);

            setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

            return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(resultingPayload => {
                    verifyRegisterWithSpecificTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
                    verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
                    expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
                    expect(resultingPayload).toEqual({ error: 'Unable to find the Team requested to be persisted.' });
                });
        })

    })

    describe('Unregister from Team', () => {
        test('When I call to unregister from a Team, I should make a call to unregister with the Team Name, Server Name, and Tournament Details.', () => {
            expect(clashTeamsServiceImpl.unregisterFromTeam()).toBeTruthy();
        })

    })

    describe('Retrieve Team for Server and Tournament', () => {
        test('When I call to retrieve all Teams for a Server and Tournaments, I should be returned an array of Teams.', () => {
            expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments()).toBeTruthy();
        })

    })
})

function createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    let mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
    mockDbTeamResponseBase.teamName = `Team ${Math.random() * 10000}`;
    return mockDbTeamResponseBase;
}

function createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    let mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
    mockDbTeamResponseBase.teamName = `Team ${expectedTeamName}`;
    return mockDbTeamResponseBase;
}

function createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    return {
        key: 'Some#mock#value',
        serverName: expectedServerName,
        players: [expectedPlayerId],
        tournamentName: expectedTournamentName,
        tournamentDay: expectedTournamentDay
    };
}
