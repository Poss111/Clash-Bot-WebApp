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

    describe('Create New Team', () => {

        const verifyCreateNewTeamResults = (expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, removeFromTentative) => {
            expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledTimes(1);
            expect(clashTentativeDbImpl.isTentative).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, {
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay
            })

            expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledTimes(1);
            expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay,
                startTime: expectedStartTime
            }]);
            expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1)
            expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith([expectedPlayerId]);
            expect(data).toEqual(expectedResult);
            removeFromTentative ? expect(clashTentativeDbImpl.removeFromTentative).toHaveBeenCalledTimes(1) : expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
        }

        const setupCreateNewTeamData = (isTentative) => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedStartTime = new Date().toISOString();
            const mockDbResponse = createMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
            let idToNameObject = {};
            idToNameObject[expectedPlayerId] = expectedUsername;
            const expectedResult = {
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

            const mockIsTentativeObject = { onTentative: isTentative, tentativeList: { key: 'Some#key', tentativePlayers: [expectedPlayerId], serverName: expectedServerName, tournamentDetails: { tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay }}};

            clashTeamsDbImpl.registerPlayer.mockResolvedValue(mockDbResponse);
            clashTentativeDbImpl.isTentative.mockResolvedValue(mockIsTentativeObject);
            clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue(idToNameObject);
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
                .then(data => verifyCreateNewTeamResults(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, true));
        })

        test('When I call to create a new Team and I do not belong to and existing tentative list, I should not be removed from any tentative list that belongs to the server and tournament details given.', () => {
            let {expectedServerName, expectedTournamentName, expectedTournamentDay, expectedPlayerId, expectedStartTime, expectedResult} = setupCreateNewTeamData(false);
            return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
                .then(data => verifyCreateNewTeamResults(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, false));
        })
    })

    describe('Register with Team', () => {
        test('When I call to register with a Team, I should be removed from any tentative list that belongs to the server and tournament details given.', () => {
            expect(clashTeamsServiceImpl.registerWithTeam()).toBeTruthy();
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

function createMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    return {
        key: 'Some#mock#value',
        teamName: `Team ${Math.random() * 100000000}`,
        serverName: expectedServerName,
        players: [expectedPlayerId],
        tournamentName: expectedTournamentName,
        tournamentDay: expectedTournamentDay
    };
}
