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

    function verifyRetrievePlayerNamesIsInvoked(expectedPlayerIds) {
        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1)
        if (expectedPlayerIds) {
            !Array.isArray(expectedPlayerIds) ? expectedPlayerIds = [expectedPlayerIds] : undefined;
        }
        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith(expectedPlayerIds);
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
                return {name: idToNameObject[id] ? idToNameObject[id] : id}
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

        test('Error - isTentative - If isTentative fails with an error, it should be rejected successfully.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedStartTime = new Date().toISOString();
            const error = new Error("Failed to retrieve tentative record.");
            clashTentativeDbImpl.isTentative.mockRejectedValue(error);
            return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
        })

        test('Error - registerPlayer - If registerPlayer fails with an error, it should be rejected successfully.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedStartTime = new Date().toISOString();
            setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            const error = new Error("Failed to retrieve tentative record.");
            clashTeamsDbImpl.registerPlayer.mockRejectedValue(error);
            return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
        })

        test('Error - removeFromTentative - If removeFromTentative fails with an error, it should be rejected successfully.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedStartTime = new Date().toISOString();
            setupIsTentativeReturn(true, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            const error = new Error("Failed to retrieve tentative record.");
            clashTentativeDbImpl.removeFromTentative.mockRejectedValue(error);
            return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
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
                    expect(resultingPayload).toEqual({error: 'Unable to find the Team requested to be persisted.'});
                });
        })

        test('Error - isTentative - If isTentative fails with an error, it should be rejected successfully.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedTeamName = 'Abra';
            const error = new Error('Failed to retrieve Tentative.');
            clashTentativeDbImpl.isTentative.mockRejectedValue(error);
            return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
        })

        test('Error - registerWithSpecificTeam - If registerWithSpecificTeam fails with an error, it should be rejected successfully.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedTeamName = 'Abra';
            const error = new Error('Failed to retrieve Tentative.');
            setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            clashTeamsDbImpl.registerWithSpecificTeam.mockRejectedValue(error);
            return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
        })

        test('Error - removeFromTentative - If removeFromTentative fails with an error, it should be rejected successfully.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedTeamName = 'Abra';
            const error = new Error('Failed to retrieve Tentative.');
            setupIsTentativeReturn(true, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            clashTentativeDbImpl.removeFromTentative.mockRejectedValue(error);
            return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
        })

    })

    describe('Unregister from Team', () => {
        function verifyUnregisterWithTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
            expect(clashTeamsDbImpl.deregisterPlayer).toHaveBeenCalledTimes(1);
            expect(clashTeamsDbImpl.deregisterPlayer).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay
            }]);
        }

        test('When I call to unregister from a Team, I should make a call to unregister with the Team Name, Server Name, and Tournament Details.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedTeamName = 'Abra';

            let idToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

            let mockUnregisterTeamsDbResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
            mockUnregisterTeamsDbResponse.players.pop();

            clashTeamsDbImpl.deregisterPlayer.mockResolvedValue(mockUnregisterTeamsDbResponse);

            return clashTeamsServiceImpl.unregisterFromTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(result => {
                    verifyUnregisterWithTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                    verifyRetrievePlayerNamesIsInvoked(mockUnregisterTeamsDbResponse.players);
                    expect(result).toEqual(mapToApiResponse(mockUnregisterTeamsDbResponse, expectedServerName, idToPlayerNameMap));
                    expect(result).toBeTruthy();
                });
        })

        test('When I call to unregister from a Team, and I do not belong to the Team then I should return a payload stating such error.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';

            clashTeamsDbImpl.deregisterPlayer.mockResolvedValue(undefined);

            return clashTeamsServiceImpl.unregisterFromTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(result => {
                    verifyUnregisterWithTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
                    expect(result).toEqual({error: 'User not found on requested Team.'});
                });
        })

        test('Error - deregisterPlayer - If deregisterPlayer fails with an error, it should be rejected properly.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';

            const error = new Error('Failed to unregister player.');

            clashTeamsDbImpl.deregisterPlayer.mockRejectedValue(error);

            clashTeamsServiceImpl.unregisterFromTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
        })
    })

    describe('Retrieve Teams for given Server Name and Tournaments', () => {
        test('When I pass a Server Name, I should retrieve all Teams with the given Server Name and active Tournaments.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedTournaments = [{
                tournamentName: 'awesome_sauce',
                tournamentDay: '1'
            },
                {
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '2'
                }];
            let teamOne = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[0].tournamentDay);
            let teamTwo = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[1].tournamentDay);
            let teamThree = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, '0');
            let expectedResponse = [];
            const getTeamsDbResponse = [teamOne, teamTwo, teamThree];
            let playerIdToNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);
            getTeamsDbResponse.forEach(team => expectedResponse.push(mapToApiResponse(team, expectedServerName, playerIdToNameMap)));
            expectedResponse.pop();

            clashTeamsDbImpl.getTeams.mockResolvedValue([teamOne, teamTwo, teamThree]);
            return clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(expectedServerName, expectedTournaments).then(results => {
                expect(clashTeamsDbImpl.getTeams).toHaveBeenCalledTimes(1);
                expect(clashTeamsDbImpl.getTeams).toHaveBeenCalledWith(expectedServerName);
                verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                expect(results).toEqual(expectedResponse);
            })
        })

        test('When I pass a Server Name, I should retrieve all Teams with players and the given Server Name and active Tournaments.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedTournaments = [{
                tournamentName: 'awesome_sauce',
                tournamentDay: '1'
            },
                {
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '2'
                }];
            let teamOne = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[0].tournamentDay);
            teamOne.players = [];
            let teamTwo = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[1].tournamentDay);
            let teamThree = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, '0');
            let expectedResponse = [];
            const getTeamsDbResponse = [teamOne, teamTwo, teamThree];
            let playerIdToNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);
            getTeamsDbResponse.forEach(team => expectedResponse.push(mapToApiResponse(team, expectedServerName, playerIdToNameMap)));
            expectedResponse.splice(0, 1);
            expectedResponse.pop();

            clashTeamsDbImpl.getTeams.mockResolvedValue([teamOne, teamTwo, teamThree]);
            return clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(expectedServerName, expectedTournaments).then(results => {
                expect(clashTeamsDbImpl.getTeams).toHaveBeenCalledTimes(1);
                expect(clashTeamsDbImpl.getTeams).toHaveBeenCalledWith(expectedServerName);
                verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                expect(results).toEqual(expectedResponse);
            })
        })

        test('Error - getTeams - If getTeams fails with an error, it should be rejected properly.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournaments = [{
                tournamentName: 'awesome_sauce',
                tournamentDay: '1'
            },
                {
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '2'
                }];
            const error = new Error('Failed to retrieve clash teams.');
            clashTeamsDbImpl.getTeams.mockRejectedValue(error);
            return clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(expectedServerName, expectedTournaments)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
        })

        test('Error - retrievePlayerNames - If retrievePlayerNames fails with an error, it should be rejected properly.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedPlayerId = '123131';
            const expectedTournaments = [{
                tournamentName: 'awesome_sauce',
                tournamentDay: '1'
            },
                {
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '2'
                }];
            const error = new Error('Failed to retrieve clash teams.');
            let teamOne = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[0].tournamentDay);
            let teamTwo = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[1].tournamentDay);
            let teamThree = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, '0');
            clashTeamsDbImpl.getTeams.mockResolvedValue([teamOne, teamTwo, teamThree]);
            clashSubscriptionDbImpl.retrievePlayerNames.mockRejectedValue(error);
            return clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(expectedServerName, expectedTournaments)
                .then(() => expect(true).toBeFalsy())
                .catch(err => expect(err).toEqual(error));
        })

    })

    describe('Map Team Db Response to API Response', () => {
        test('When given a Team Db Response with a single player, I should respond with a single mapped player id.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedTeamName = 'Abra';

            let mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
            let playerIdToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

            return clashTeamsServiceImpl.mapTeamDbResponseToApiResponse(mockDbTeamResponse).then(response => {
                verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                expect(response).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, playerIdToPlayerNameMap));
            });
        })

        test('When given a Team Db Response with a multiple players, I should respond with multiple mapped player id.', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedSecondUsername = 'TheIncentive';
            const expectedTeamName = 'Abra';

            let mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
            mockDbTeamResponse.players.push('1');
            let playerIdToPlayerNameMap = setupRetrievePlayerNames(mockDbTeamResponse.players, [expectedUsername, expectedSecondUsername]);

            return clashTeamsServiceImpl.mapTeamDbResponseToApiResponse(mockDbTeamResponse).then(response => {
                verifyRetrievePlayerNamesIsInvoked(mockDbTeamResponse.players);
                expect(response).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, playerIdToPlayerNameMap));
            });
        })

        test('When given a Team Db Response with a no players, I should respond with the payload without a list of players and no call to retrieve .', () => {
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '2';
            const expectedPlayerId = '123131';
            const expectedUsername = 'Roidrage';
            const expectedSecondUsername = 'TheIncentive';
            const expectedTeamName = 'Abra';

            let mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
            mockDbTeamResponse.players.push('1');
            let playerIdToPlayerNameMap = setupRetrievePlayerNames(mockDbTeamResponse.players, [expectedUsername, expectedSecondUsername]);

            return clashTeamsServiceImpl.mapTeamDbResponseToApiResponse(mockDbTeamResponse).then(response => {
                verifyRetrievePlayerNamesIsInvoked(mockDbTeamResponse.players);
                expect(response).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, playerIdToPlayerNameMap));
            });
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
