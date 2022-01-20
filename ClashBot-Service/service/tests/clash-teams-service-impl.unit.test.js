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

                clashTeamsDbImpl.registerPlayer.mockResolvedValue([{exist: true}]);

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

        describe('Create New Team - v2', () => {

            const verifyCreateNewTeamResultsV2 = (expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName,
                                                  expectedTournamentDay, expectedStartTime, data, expectedResult,
                                                  expectedTentativeListObject, removeFromTentative) => {
                verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                verifyRegisterPlayerIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName,
                    expectedTournamentDay, expectedStartTime);
                verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                expect(data).toEqual(expectedResult);
                removeFromTentative ? verifyRemoveFromTentativeIsInvoked(expectedPlayerId, expectedTentativeListObject)
                    : expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
            }

            const setupCreateNewTeamDataV2 = (isTentative) => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedRole = 'Top';
                const expectedStartTime = new Date().toISOString();
                const mockDbResponse = createNewMockDbTeamResponseV2(expectedPlayerId, expectedRole,
                    expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
                let idToNameObject = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

                const expectedResult = mapToApiResponseV2(mockDbResponse, expectedServerName, idToNameObject);
                const mockIsTentativeObject = setupIsTentativeReturn(isTentative, expectedPlayerId,
                    expectedServerName, expectedTournamentName, expectedTournamentDay);

                clashTeamsDbImpl.registerPlayerV2.mockResolvedValue(mockDbResponse);
                return {
                    expectedServerName,
                    expectedTournamentName,
                    expectedTournamentDay,
                    expectedPlayerId,
                    expectedRole,
                    expectedStartTime,
                    mockDbResponse,
                    idToNameObject,
                    mockIsTentativeObject,
                    expectedResult,
                };
            }

            test('When I call to create a new Team, I should be removed from any tentative list that belongs to the ' +
                'server and tournament details given. - v2', () => {
                let {
                    expectedServerName, expectedTournamentName, expectedTournamentDay,
                    expectedPlayerId, expectedRole, expectedStartTime, mockIsTentativeObject,
                    expectedResult
                } = setupCreateNewTeamDataV2(true);
                let mockTentativeObjectReturned = deepCopy(mockIsTentativeObject.tentativeList);
                mockTentativeObjectReturned.tentativePlayers.pop();
                clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);

                return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole,
                    expectedServerName, expectedTournamentName,
                    expectedTournamentDay, expectedStartTime)
                    .then(data => verifyCreateNewTeamResultsV2(expectedPlayerId, expectedRole, expectedServerName,
                        expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult,
                        mockIsTentativeObject.tentativeList, true));
            })

            test('When I call to create a new Team and I do not belong to and existing tentative list, ' +
                'I should not be removed from any tentative list that belongs to the server and tournament ' +
                'details given. - v2', () => {
                let {
                    expectedServerName, expectedTournamentName, expectedTournamentDay,
                    expectedPlayerId, expectedRole, expectedStartTime, expectedResult
                } = setupCreateNewTeamDataV2(false);
                return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole, expectedServerName,
                    expectedTournamentName, expectedTournamentDay, expectedStartTime)
                    .then(data => verifyCreateNewTeamResultsV2(expectedPlayerId, expectedRole, expectedServerName,
                        expectedTournamentName, expectedTournamentDay, expectedStartTime, data,
                        expectedResult, undefined, false));
            })

            test('No tournaments available - When I call to create a new Team, if I do not have any ' +
                'tournaments available to me then I should respond with a payload containing ' +
                'an error message. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedStartTime = new Date().toISOString();

                clashTeamsDbImpl.registerPlayerV2.mockResolvedValue([{exist: true}]);

                setupIsTentativeReturn(false, expectedPlayerId, expectedServerName,
                    expectedTournamentName, expectedTournamentDay);

                return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole, expectedServerName,
                    expectedTournamentName, expectedTournamentDay, expectedStartTime)
                    .then(data => {
                        verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName,
                            expectedTournamentName, expectedTournamentDay);
                        verifyRegisterPlayerIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName,
                            expectedTournamentName, expectedTournamentDay, expectedStartTime);
                        expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
                        expect(data).toEqual({error: 'Player is not eligible to create a new Team.'});
                    });
            })

            test('Error - isTentative - If isTentative fails with an error, ' +
                'it should be rejected successfully. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedStartTime = new Date().toISOString();
                const error = new Error("Failed to retrieve tentative record.");
                clashTentativeDbImpl.isTentative.mockRejectedValue(error);
                return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole, expectedServerName,
                    expectedTournamentName, expectedTournamentDay, expectedStartTime)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })

            test('Error - registerPlayer - If registerPlayer fails with an error,' +
                ' it should be rejected successfully. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedStartTime = new Date().toISOString();
                setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName,
                    expectedTournamentDay);
                const error = new Error("Failed to retrieve tentative record.");
                clashTeamsDbImpl.registerPlayer.mockRejectedValue(error);
                return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedRole, expectedServerName,
                    expectedTournamentName, expectedTournamentDay, expectedStartTime)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })

            test('Error - removeFromTentative - If removeFromTentative fails with an error, it ' +
                'should be rejected successfully. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedStartTime = new Date().toISOString();
                setupIsTentativeReturn(true, expectedPlayerId, expectedServerName,
                    expectedTournamentName, expectedTournamentDay);
                const error = new Error("Failed to retrieve tentative record.");
                clashTentativeDbImpl.removeFromTentative.mockRejectedValue(error);
                return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedRole, expectedServerName,
                    expectedTournamentName, expectedTournamentDay, expectedStartTime)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })
        })
    })

    describe('Register with Team', () => {

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

        describe('Register with Team - v2', () => {
            function verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName,
                                                               expectedTournamentName, expectedTournamentDay,
                                                               expectedTeamName) {
                expect(clashTeamsDbImpl.registerWithSpecificTeamV2).toHaveBeenCalledTimes(1);
                expect(clashTeamsDbImpl.registerWithSpecificTeamV2).toHaveBeenCalledWith(expectedPlayerId,
                    expectedRole,
                    expectedServerName, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    }], expectedTeamName);
            }

            test('When I call to register with a Team, I should be removed from ' +
                'any tentative list that belongs to the server and tournament details given. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedRole = 'Top';
                const expectedTeamName = 'Abra';

                let mockDbTeamResponse = createMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay);
                clashTeamsDbImpl.registerWithSpecificTeamV2.mockResolvedValue(mockDbTeamResponse);
                const idToNamesMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

                let mockIsTentativeReturn = setupIsTentativeReturn(true, expectedPlayerId,
                    expectedServerName, expectedTournamentName, expectedTournamentDay);
                let mockTentativeObjectReturned = deepCopy(mockIsTentativeReturn.tentativeList);
                mockTentativeObjectReturned.tentativePlayers.pop();
                clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);

                return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(resultingPayload => {
                        verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName,
                            expectedTournamentName, expectedTournamentDay, expectedTeamName);
                        verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                        verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName,
                            expectedTournamentDay);
                        verifyRemoveFromTentativeIsInvoked(expectedPlayerId, mockIsTentativeReturn.tentativeList);
                        expect(resultingPayload).toEqual(mapToApiResponseV2(mockDbTeamResponse,
                            expectedServerName, idToNamesMap));
                    });
            })

            test('When I call to register with a Team and I am not on tentative, ' +
                'I should not be removed from any tentative list that belongs to ' +
                'the server and tournament details given. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedRole = 'Top';
                const expectedTeamName = 'Abra';

                let mockDbTeamResponse = createMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
                clashTeamsDbImpl.registerWithSpecificTeamV2.mockResolvedValue(mockDbTeamResponse);
                const idToNamesMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

                setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

                return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(resultingPayload => {
                        verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
                        verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                        verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
                        expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
                        expect(resultingPayload).toEqual(mapToApiResponseV2(mockDbTeamResponse, expectedServerName, idToNamesMap));
                    });
            })

            test('When I call to register with a Team and I am not able to join it, ' +
                'I should return an error payload stating so. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedTeamName = 'Abra';

                clashTeamsDbImpl.registerWithSpecificTeamV2.mockResolvedValue(undefined);

                setupIsTentativeReturn(false, expectedPlayerId, expectedServerName,
                    expectedTournamentName, expectedTournamentDay);

                return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(resultingPayload => {
                        verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName,
                            expectedTournamentName, expectedTournamentDay, expectedTeamName);
                        verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName,
                            expectedTournamentName, expectedTournamentDay);
                        expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
                        expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
                        expect(resultingPayload).toEqual({error: 'Unable to find the Team requested to be persisted.'});
                    });
            })

            test('Error - isTentative - If isTentative fails with an error, ' +
                'it should be rejected successfully. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedTeamName = 'Abra';
                const error = new Error('Failed to retrieve Tentative.');
                clashTentativeDbImpl.isTentative.mockRejectedValue(error);
                return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })

            test('Error - registerWithSpecificTeam - If registerWithSpecificTeam fails with an ' +
                'error, it should be rejected successfully. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedTeamName = 'Abra';
                const error = new Error('Failed to retrieve Tentative.');
                setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName,
                    expectedTournamentDay);
                clashTeamsDbImpl.registerWithSpecificTeamV2.mockRejectedValue(error);
                return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })

            test('Error - removeFromTentative - If removeFromTentative fails with an error, ' +
                'it should be rejected successfully. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedTeamName = 'Abra';
                const error = new Error('Failed to retrieve Tentative.');
                setupIsTentativeReturn(true, expectedPlayerId, expectedServerName,
                    expectedTournamentName, expectedTournamentDay);
                clashTentativeDbImpl.removeFromTentative.mockRejectedValue(error);
                return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })

        })
    })

    describe('Unregister from Team', () => {

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

        describe('Unregister from Team - v2', () => {
            function verifyUnregisterWithTeamIsInvokedV2(expectedPlayerId, expectedServerName,
                                                         expectedTournamentName, expectedTournamentDay) {
                expect(clashTeamsDbImpl.deregisterPlayerV2).toHaveBeenCalledTimes(1);
                expect(clashTeamsDbImpl.deregisterPlayerV2).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                }]);
            }

            test('When I call to unregister from a Team, I should make a call to unregister ' +
                'with the Team Name, Server Name, and Tournament Details. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedRole = 'Top';
                const expectedUsername = 'Roidrage';
                const expectedTeamName = 'Abra';

                let idToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

                let mockUnregisterTeamsDbResponse = createMockDbTeamResponseV2(expectedPlayerId, expectedRole,
                    expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
                mockUnregisterTeamsDbResponse.players.pop();

                clashTeamsDbImpl.deregisterPlayerV2.mockResolvedValue([mockUnregisterTeamsDbResponse]);

                return clashTeamsServiceImpl.unregisterFromTeamV2(expectedPlayerId, expectedServerName,
                    expectedTournamentName, expectedTournamentDay)
                    .then(result => {
                        verifyUnregisterWithTeamIsInvokedV2(expectedPlayerId, expectedServerName, expectedTournamentName,
                            expectedTournamentDay);
                        verifyRetrievePlayerNamesIsInvoked(mockUnregisterTeamsDbResponse.players);
                        expect(result).toEqual([mapToApiResponseV2(mockUnregisterTeamsDbResponse, expectedServerName,
                            idToPlayerNameMap)]);
                        expect(result).toBeTruthy();
                    });
            })

            test('When I call to unregister from a Team, and I do not belong to the Team then ' +
                'I should return a payload stating such error. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';

                clashTeamsDbImpl.deregisterPlayerV2.mockResolvedValue(undefined);

                return clashTeamsServiceImpl.unregisterFromTeamV2(expectedPlayerId, expectedServerName,
                    expectedTournamentName, expectedTournamentDay)
                    .then(result => {
                        verifyUnregisterWithTeamIsInvokedV2(expectedPlayerId, expectedServerName,
                            expectedTournamentName, expectedTournamentDay);
                        expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
                        expect(result).toEqual({error: 'User not found on requested Team.'});
                    });
            })

            test('Error - deregisterPlayer - If deregisterPlayer fails with an error, ' +
                'it should be rejected properly. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';

                const error = new Error('Failed to unregister player.');

                clashTeamsDbImpl.deregisterPlayerV2.mockRejectedValue(error);

                clashTeamsServiceImpl.unregisterFromTeamV2(expectedPlayerId, expectedServerName,
                    expectedTournamentName, expectedTournamentDay)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })
        })

    })

    describe('Retrieve Teams for given Server Name and Tournaments', () => {

        describe('Retrieve Teams for given Server Name and Tournaments', () => {
            test('When I pass a Server Name, I should retrieve all Teams with the given Server Name and active Tournaments.', () => {
                const expectedServerName = 'Goon Squad';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedTournaments = [{
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1'
                }, {tournamentName: 'awesome_sauce', tournamentDay: '2'}];
                const expectedChampionsList = ['Sett', 'Volibear', 'Anivia'];
                let teamOne = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[0].tournamentDay);
                let teamTwo = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[1].tournamentDay);
                let teamThree = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, '0');
                let expectedResponse = [];
                const getTeamsDbResponse = [teamOne, teamTwo, teamThree];

                const expectedUserDetails = {
                    key: expectedPlayerId,
                    playerName: expectedUsername,
                    serverName: expectedServerName,
                    timeAdded: new Date().toISOString(),
                    subscribed: {},
                    preferredChampions: expectedChampionsList
                };
                const retrieveAllUserDetails = [expectedUserDetails].reduce((map, record) => (map[record.key] = record, map), {});

                clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetails);

                getTeamsDbResponse.forEach(team => expectedResponse.push(mapToExpectedDetailedApiResponse(team, expectedServerName, retrieveAllUserDetails)))

                expectedResponse.pop();

                clashTeamsDbImpl.getTeams.mockResolvedValue([teamOne, teamTwo, teamThree]);
                return clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(expectedServerName, expectedTournaments).then(results => {
                    expect(clashTeamsDbImpl.getTeams).toHaveBeenCalledTimes(1);
                    expect(clashTeamsDbImpl.getTeams).toHaveBeenCalledWith(expectedServerName);
                    expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1)
                    expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledWith([expectedPlayerId]);
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
                }, {tournamentName: 'awesome_sauce', tournamentDay: '2'}];
                const expectedChampionsList = ['Sett', 'Volibear', 'Anivia'];
                let teamOne = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[0].tournamentDay);
                teamOne.players = [];
                let teamTwo = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[1].tournamentDay);
                let teamThree = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournaments[0].tournamentName, '0');
                let expectedResponse = [];
                const getTeamsDbResponse = [teamOne, teamTwo, teamThree];

                const expectedUserDetails = {
                    key: expectedPlayerId,
                    playerName: expectedUsername,
                    serverName: expectedServerName,
                    timeAdded: new Date().toISOString(),
                    subscribed: {},
                    preferredChampions: expectedChampionsList
                };
                const retrieveAllUserDetails = [expectedUserDetails].reduce((map, record) => (map[record.key] = record, map), {});

                clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetails);

                getTeamsDbResponse.forEach(team => expectedResponse.push(mapToExpectedDetailedApiResponse(team, expectedServerName, retrieveAllUserDetails)));
                expectedResponse.splice(0, 1);
                expectedResponse.pop();

                clashTeamsDbImpl.getTeams.mockResolvedValue([teamOne, teamTwo, teamThree]);
                return clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(expectedServerName, expectedTournaments).then(results => {
                    expect(clashTeamsDbImpl.getTeams).toHaveBeenCalledTimes(1);
                    expect(clashTeamsDbImpl.getTeams).toHaveBeenCalledWith(expectedServerName);
                    expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1)
                    expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledWith([expectedPlayerId]);
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

                clashSubscriptionDbImpl.retrieveAllUserDetails.mockRejectedValue(error);

                return clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(expectedServerName, expectedTournaments)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })

        })

        describe('Retrieve Teams for given Server Name and Tournaments - v2', () => {
            test('When I pass a Server Name, I should retrieve all Teams with the given ' +
                'Server Name and active Tournaments. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedTournaments = [{
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1'
                }, {
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '2'
                }];
                const expectedChampionsList = ['Sett', 'Volibear', 'Anivia'];
                let teams = [createNewMockDbTeamResponseV2(expectedPlayerId, 'Top', expectedServerName,
                    expectedTournaments[0].tournamentName, expectedTournaments[0].tournamentDay),
                    createNewMockDbTeamResponseV2(expectedPlayerId, 'Mid', expectedServerName,
                        expectedTournaments[0].tournamentName, expectedTournaments[1].tournamentDay),
                    createNewMockDbTeamResponseV2(expectedPlayerId, 'Bot', expectedServerName,
                        expectedTournaments[0].tournamentName, '0')]
                let expectedResponse = [];
                const getTeamsDbResponse = [...teams];

                const expectedUserDetails = {
                    key: expectedPlayerId,
                    playerName: expectedUsername,
                    serverName: expectedServerName,
                    timeAdded: new Date().toISOString(),
                    subscribed: {},
                    preferredChampions: expectedChampionsList
                };
                const retrieveAllUserDetails = [expectedUserDetails].reduce((map, record) =>
                    (map[record.key] = record, map), {});

                clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetails);

                getTeamsDbResponse.forEach(team =>
                    expectedResponse.push(mapToExpectedDetailedApiResponseV2(team, expectedServerName,
                        retrieveAllUserDetails)))

                expectedResponse.pop();

                clashTeamsDbImpl.getTeamsV2.mockResolvedValue([...teams]);
                return clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2(expectedServerName,
                    expectedTournaments).then(results => {
                    expect(clashTeamsDbImpl.getTeamsV2).toHaveBeenCalledTimes(1);
                    expect(clashTeamsDbImpl.getTeamsV2).toHaveBeenCalledWith(expectedServerName);
                    expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1)
                    expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
                        .toHaveBeenCalledWith([expectedPlayerId]);
                    expect(results).toEqual(expectedResponse);
                })
            })

            test('When I pass a Server Name, I should retrieve all Teams with ' +
                'players and the given Server Name and active Tournaments. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedTournaments = [{
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1'
                }, {
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '2'
                }];
                const expectedChampionsList = ['Sett', 'Volibear', 'Anivia'];
                let teams = [createNewMockDbTeamResponseV2(expectedPlayerId, 'Top',
                    expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[0].tournamentDay)];
                teams[0].players = [];
                teams[0].playersWRoles = {};
                teams.push(createNewMockDbTeamResponseV2(expectedPlayerId, 'Mid',
                    expectedServerName, expectedTournaments[0].tournamentName, expectedTournaments[1].tournamentDay));
                teams.push(createNewMockDbTeamResponseV2(expectedPlayerId, 'Bot',
                    expectedServerName, expectedTournaments[0].tournamentName, '0'));
                let expectedResponse = [];
                const getTeamsDbResponse = [...teams];

                const expectedUserDetails = {
                    key: expectedPlayerId,
                    playerName: expectedUsername,
                    serverName: expectedServerName,
                    timeAdded: new Date().toISOString(),
                    subscribed: {},
                    preferredChampions: expectedChampionsList
                };
                const retrieveAllUserDetails = [expectedUserDetails]
                    .reduce((map, record) => (map[record.key] = record, map), {});

                clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetails);

                getTeamsDbResponse.forEach(team =>
                    expectedResponse.push(mapToExpectedDetailedApiResponseV2(team,
                        expectedServerName, retrieveAllUserDetails)));
                expectedResponse.splice(0, 1);
                expectedResponse.pop();

                clashTeamsDbImpl.getTeamsV2.mockResolvedValue([...teams]);
                return clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2(expectedServerName,
                    expectedTournaments).then(results => {
                    expect(clashTeamsDbImpl.getTeamsV2).toHaveBeenCalledTimes(1);
                    expect(clashTeamsDbImpl.getTeamsV2).toHaveBeenCalledWith(expectedServerName);
                    expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1)
                    expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
                        .toHaveBeenCalledWith([expectedPlayerId]);
                    expect(results).toEqual(expectedResponse);
                })
            })

            test('Error - getTeams - If getTeams fails with an error, ' +
                'it should be rejected properly. - v2', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournaments = [
                    {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    },
                    {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '2'
                    }
                ];
                const error = new Error('Failed to retrieve clash teams.');
                clashTeamsDbImpl.getTeamsV2.mockRejectedValue(error);
                return clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2(expectedServerName,
                    expectedTournaments)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })

            test('Error - retrievePlayerNames - If retrievePlayerNames fails with an ' +
                'error, it should be rejected properly. - v2', () => {
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
                let teams = [createNewMockDbTeamResponseV2(expectedPlayerId, expectedServerName,
                    expectedTournaments[0].tournamentName, expectedTournaments[0].tournamentDay),
                createNewMockDbTeamResponseV2(expectedPlayerId, expectedServerName,
                    expectedTournaments[0].tournamentName, expectedTournaments[1].tournamentDay),
                createNewMockDbTeamResponseV2(expectedPlayerId, expectedServerName,
                    expectedTournaments[0].tournamentName, '0')];

                clashTeamsDbImpl.getTeams.mockResolvedValue([...teams]);

                clashSubscriptionDbImpl.retrieveAllUserDetails.mockRejectedValue(error);

                return clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments(expectedServerName,
                    expectedTournaments)
                    .then(() => expect(true).toBeFalsy())
                    .catch(err => expect(err).toEqual(error));
            })

        })

    })

    describe('Map Team Db Response to API Response', () => {

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

        describe('Map Team Db Response to API Response - v2', () => {
            test('When given a Team Db Response with a single player, I should respond with a ' +
                'single mapped player id with v2.', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedTeamName = 'Abra';
                const expectedRole = 'Top';

                let mockDbTeamResponse = createMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay);
                let playerIdToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

                return clashTeamsServiceImpl.mapTeamDbResponseToApiResponseV2(mockDbTeamResponse).then(response => {
                    verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                    expect(response).toEqual(mapToApiResponseV2(mockDbTeamResponse, expectedServerName,
                        playerIdToPlayerNameMap));
                });
            })

            test('When given a Team Db Response with a multiple players, I should respond with ' +
                'multiple mapped player id with v2.', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedSecondUsername = 'TheIncentive';
                const expectedTeamName = 'Abra';
                const expectedRole = 'Top';

                let mockDbTeamResponse = createMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay);
                mockDbTeamResponse.players.push('1');
                let playerIdToPlayerNameMap = setupRetrievePlayerNames(mockDbTeamResponse.players, [expectedUsername, expectedSecondUsername]);

                return clashTeamsServiceImpl.mapTeamDbResponseToApiResponseV2(mockDbTeamResponse).then(response => {
                    verifyRetrievePlayerNamesIsInvoked(mockDbTeamResponse.players);
                    expect(response).toEqual(mapToApiResponseV2(mockDbTeamResponse, expectedServerName,
                        playerIdToPlayerNameMap));
                });
            })

            test('When given a Team Db Response with a no players, I should respond with the payload without a list of ' +
                'players and no call to retrieve with v2.', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedUsername = 'Roidrage';
                const expectedSecondUsername = 'TheIncentive';
                const expectedTeamName = 'Abra';

                let mockDbTeamResponse = createMockDbTeamResponseV2(null, null, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay);
                let playerIdToPlayerNameMap = setupRetrievePlayerNames(mockDbTeamResponse.players,
                    [expectedUsername, expectedSecondUsername]);

                return clashTeamsServiceImpl.mapTeamDbResponseToApiResponseV2(mockDbTeamResponse).then(response => {
                    verifyRetrievePlayerNamesIsInvoked(mockDbTeamResponse.players);
                    expect(response).toEqual(mapToApiResponseV2(mockDbTeamResponse, expectedServerName,
                        playerIdToPlayerNameMap));
                });
            })

            test('When given a Team Db Response with multiple teams, I should respond with an ' +
                'array mapped player id with v2.', () => {
                const expectedServerName = 'Goon Squad';
                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '2';
                const expectedPlayerId = '123131';
                const expectedUsername = 'Roidrage';
                const expectedTeamName = 'Abra';
                const expectedRole = 'Top';

                const arrayResponse = [createMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedTeamName,
                    expectedServerName, expectedTournamentName, expectedTournamentDay),
                    createMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedTeamName,
                        expectedServerName, expectedTournamentName, expectedTournamentDay)];

                const playerIdToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

                let mappedResponses = [];
                arrayResponse.forEach((record) => {
                    mappedResponses.push(mapToApiResponseV2(record, expectedServerName, playerIdToPlayerNameMap));
                });

                return clashTeamsServiceImpl.mapTeamDbResponseToApiResponseV2(arrayResponse).then(response => {
                    verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
                    expect(response).toEqual(mappedResponses);
                });
            })
        })

    })

})

function mapToExpectedDetailedApiResponse(team, expectedServerName, retrieveAllUserDetails) {
    return {
        teamName: team.teamName,
        serverName: expectedServerName,
        playersDetails: Array.isArray(team.players) ? team.players.map(id => {
            let mappedPayload = {name: id};
            let foundUser = retrieveAllUserDetails[id];
            if (foundUser) {
                mappedPayload = {name: foundUser.playerName, champions: foundUser.preferredChampions}
            }
            return mappedPayload;
        }) : {},
        tournamentDetails: {
            tournamentName: team.tournamentName,
            tournamentDay: team.tournamentDay
        },
        startTime: team.startTime,
    };
}

function mapToExpectedDetailedApiResponseV2(team, expectedServerName, retrieveAllUserDetails) {
    let mappedResponse = {
        teamName: team.teamName,
        serverName: expectedServerName,
        playersDetails: Array.isArray(team.players) ? team.players.map(id => {
            let mappedPayload = {name: id};
            let foundUser = retrieveAllUserDetails[id];
            let roleMap = Object.keys(team.playersWRoles).reduce((ret, key) => {
                ret[team.playersWRoles[key]] = key;
                return ret;
            }, {});
            if (foundUser) {
                mappedPayload = {
                    name: foundUser.playerName,
                    role: roleMap[id],
                    id: id,
                    champions: foundUser.preferredChampions
                };
            }
            return mappedPayload;
        }) : {},
        tournamentDetails: {
            tournamentName: team.tournamentName,
            tournamentDay: team.tournamentDay
        },
        startTime: team.startTime,
    };
    return mappedResponse
}

function createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    let mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
    mockDbTeamResponseBase.teamName = `Team ${Math.random() * 10000}`;
    return mockDbTeamResponseBase;
}

function createNewMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    let mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
    mockDbTeamResponseBase.teamName = `Team ${Math.random() * 10000}`;
    mockDbTeamResponseBase.playersWRoles = {};
    if (expectedRole) {
        mockDbTeamResponseBase.playersWRoles[expectedRole] = expectedPlayerId;
    }
    return mockDbTeamResponseBase;
}

function createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    let mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
    mockDbTeamResponseBase.teamName = `Team ${expectedTeamName}`;
    return mockDbTeamResponseBase;
}

function createMockDbTeamResponseV2(expectedPlayerId, role, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    let mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
    mockDbTeamResponseBase.teamName = `Team ${expectedTeamName}`;
    mockDbTeamResponseBase.playersWRoles = {};
    if (role) {
        mockDbTeamResponseBase.playersWRoles[role] = expectedPlayerId;
    }
    return mockDbTeamResponseBase;
}

function createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
    let mockObj = {
        key: 'Some#mock#value',
        serverName: expectedServerName,
        tournamentName: expectedTournamentName,
        tournamentDay: expectedTournamentDay
    };
    if (expectedPlayerId) {
        mockObj.players = [expectedPlayerId];
    }
    return mockObj;
}

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

function verifyRegisterPlayerIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime) {
    expect(clashTeamsDbImpl.registerPlayerV2).toHaveBeenCalledTimes(1);
    expect(clashTeamsDbImpl.registerPlayerV2).toHaveBeenCalledWith(expectedPlayerId, expectedRole,
        expectedServerName, [{
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

function mapToApiResponseV2(mockDbResponse, expectedServerName, idToNameObject) {
    let mockObj = {
        teamName: mockDbResponse.teamName,
        serverName: expectedServerName,
        playersDetails: Array.isArray(mockDbResponse.players) ? mockDbResponse.players.map(id => {
            return {name: idToNameObject[id] ? idToNameObject[id] : id, id: id}
        }) : {},
        tournamentDetails: {
            tournamentName: mockDbResponse.tournamentName,
            tournamentDay: mockDbResponse.tournamentDay
        },
        startTime: mockDbResponse.startTime,
        playersRoleDetails: {}
    };
    let keys = Object.keys(mockDbResponse.playersWRoles);
    for (let key in keys) {
        mockObj.playersRoleDetails[keys[key]] = idToNameObject[mockDbResponse.playersWRoles[keys[key]]]
    }
    return mockObj;
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
