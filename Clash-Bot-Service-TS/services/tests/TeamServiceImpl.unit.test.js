const Joi = require('joi');
const dynamodb = require('dynamodb');
const clashTeamsServiceImpl = require('../TeamService');
const clashTeamsDbImpl = require('../../dao/clash-teams-db-impl');
const clashTentativeDbImpl = require('../../dao/clash-tentative-db-impl');
const clashSubscriptionDbImpl = require('../../dao/clash-subscription-db-impl');
const { deepCopy } = require('../../utils/tests/test-utility.utility.test');

jest.mock('../../dao/clash-teams-db-impl');
jest.mock('../../dao/clash-tentative-db-impl');
jest.mock('../../dao/clash-subscription-db-impl');

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

function createV3Team({
  serverName, teamName = 'Abra', tournamentName = 'awesome_sauce', tournamentDay = '1', playersWRoles = {}, players = [],
}) {
  return {
    details: `${tournamentName}#${tournamentDay}#${teamName}`,
    teamName,
    serverName,
    players,
    playersWRoles,
    tournamentName,
    tournamentDay,
    startTime: new Date().toISOString(),
  };
}

function createUserDetails({
  key = '1', playerName = 'Roid', serverName = 'Goon Squad', preferredChampions = ['Braum', 'Mordekaiser', 'Lissandra'],
}) {
  return {
    key,
    playerName,
    serverName,
    timeAdded: new Date().toISOString(),
    preferredChampions,
  };
}

function buildExpectedTeamResponseWithUserMap(expectedTeams, mockUserDetails) {
  return {
    code: 200,
    payload: expectedTeams.map((team) => {
      const mappedTeam = {
        name: team.teamName,
        serverName: team.serverName,
        tournament: {
          tournamentName: team.tournamentName,
          tournamentDay: team.tournamentDay,
        },
      };
      if (team.playersWRoles) {
        mappedTeam.playerDetails = Object.entries(team.playersWRoles)
          .reduce((ret, entry) => {
            const foundUser = mockUserDetails[entry[1]];
            ret[entry[0].toLowerCase()] = {
              id: entry[1],
              name: foundUser.playerName,
              champions: foundUser.preferredChampions,
            };
            return ret;
          }, {});
      }
      return mappedTeam;
    }),
  };
}

function buildExpectedSingleTeamResponseWithUserMap(expectedTeams, mockUserDetails) {
  return {
    code: 200,
    payload: {
      name: expectedTeams.teamName,
      serverName: expectedTeams.serverName,
      tournament: {
        tournamentName: expectedTeams.tournamentName,
        tournamentDay: expectedTeams.tournamentDay,
      },
      playerDetails: Object.entries(expectedTeams.playersWRoles)
        .reduce((ret, entry) => {
          const foundUser = mockUserDetails[entry[1]];
          ret[entry[0].toLowerCase()] = {
            id: entry[1],
            name: foundUser.playerName,
            champions: foundUser.preferredChampions,
          };
          return ret;
        }, {}),
    },
  };
}

describe('Clash Teams Service Impl', () => {
  describe('Create New Team', () => {
    describe('Create New Team', () => {
      const verifyCreateNewTeamResults = (expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, expectedTentativeListObject, removeFromTentative) => {
        verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
        verifyRegisterPlayerIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
        verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
        expect(data).toEqual(expectedResult);
        removeFromTentative ? verifyRemoveFromTentativeIsInvoked(expectedPlayerId, expectedTentativeListObject) : expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
      };

      const setupCreateNewTeamData = (isTentative) => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedStartTime = new Date().toISOString();
        const mockDbResponse = createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
        const idToNameObject = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

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
      };

      test('When I call to create a new Team, I should be removed from any tentative list that belongs to the server and tournament details given.', () => {
        const {
          expectedServerName, expectedTournamentName, expectedTournamentDay, expectedPlayerId, expectedStartTime, mockIsTentativeObject, expectedResult,
        } = setupCreateNewTeamData(true);
        const mockTentativeObjectReturned = deepCopy(mockIsTentativeObject.tentativeList);
        mockTentativeObjectReturned.tentativePlayers.pop();
        clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);

        return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then((data) => verifyCreateNewTeamResults(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, mockIsTentativeObject.tentativeList, true));
      });

      test('When I call to create a new Team and I do not belong to and existing tentative list, I should not be removed from any tentative list that belongs to the server and tournament details given.', () => {
        const {
          expectedServerName, expectedTournamentName, expectedTournamentDay, expectedPlayerId, expectedStartTime, expectedResult,
        } = setupCreateNewTeamData(false);
        return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then((data) => verifyCreateNewTeamResults(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResult, undefined, false));
      });

      test('No tournaments available - When I call to create a new Team, if I do not have any tournaments available to me then I should respond with a payload containing an error message.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedStartTime = new Date().toISOString();

        clashTeamsDbImpl.registerPlayer.mockResolvedValue([{ exist: true }]);

        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

        return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then((data) => {
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            verifyRegisterPlayerIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
            expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
            expect(data).toEqual({ error: 'Player is not eligible to create a new Team.' });
          });
      });

      test('Error - isTentative - If isTentative fails with an error, it should be rejected successfully.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedStartTime = new Date().toISOString();
        const error = new Error('Failed to retrieve tentative record.');
        clashTentativeDbImpl.isTentative.mockRejectedValue(error);
        return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then(() => expect(true).toBeFalsy())
          .catch((err) => expect(err).toEqual(error));
      });

      test('Error - registerPlayer - If registerPlayer fails with an error, it should be rejected successfully.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedStartTime = new Date().toISOString();
        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
        const error = new Error('Failed to retrieve tentative record.');
        clashTeamsDbImpl.registerPlayer.mockRejectedValue(error);
        return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then(() => expect(true).toBeFalsy())
          .catch((err) => expect(err).toEqual(error));
      });

      test('Error - removeFromTentative - If removeFromTentative fails with an error, it should be rejected successfully.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedStartTime = new Date().toISOString();
        setupIsTentativeReturn(true, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
        const error = new Error('Failed to retrieve tentative record.');
        clashTentativeDbImpl.removeFromTentative.mockRejectedValue(error);
        return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then(() => expect(true).toBeFalsy())
          .catch((err) => expect(err).toEqual(error));
      });
    });

    describe('Create New Team - v2', () => {
      const verifyCreateNewTeamResultsV2 = (expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName,
        expectedTournamentDay, expectedStartTime, data, expectedResult,
        expectedTentativeListObject, removeFromTentative) => {
        verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
        verifyRegisterPlayerIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName,
          expectedTournamentDay, expectedStartTime);
        expect(data).toEqual(expectedResult);
        removeFromTentative ? verifyRemoveFromTentativeIsInvoked(expectedPlayerId, expectedTentativeListObject)
          : expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
      };

      const setupCreateNewTeamDataV2 = (isTentative, teamsToBeUnregisteredFrom, numberOfUnregisteredTeams) => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedRole = 'Top';
        const expectedStartTime = new Date().toISOString();
        const mockDbResponse = createNewMockDbTeamResponseV2(expectedPlayerId, expectedRole,
          expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime);
        const mockDbResponses = {
          registeredTeam: mockDbResponse,
          unregisteredTeams: [],
        };
        if (teamsToBeUnregisteredFrom) {
          const mockUnregisteredTeams = [];
          for (let i = 0; i < numberOfUnregisteredTeams; i++) {
            mockUnregisteredTeams.push(createNewMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedServerName,
              expectedTournamentName, expectedTournamentDay));
          }
          mockDbResponses.unregisteredTeams.push(...mockUnregisteredTeams);
        }

        const expectedUserDetails = {
          key: expectedPlayerId,
          playerName: expectedUsername,
          serverName: expectedServerName,
          role: expectedRole,
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const retrieveAllUserDetail = [expectedUserDetails]
          .reduce((map, record) => (map[record.key] = record, map), {});
        clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetail);

        const expectedResult = mapToApiResponseV2(mockDbResponse, expectedServerName, retrieveAllUserDetail);
        const expectedResults = {
          registeredTeam: expectedResult,
          unregisteredTeams: [],
        };
        if (teamsToBeUnregisteredFrom) {
          expectedResults.unregisteredTeams.push(...mockDbResponses.unregisteredTeams
            .map((item) => mapToApiResponseV2(item, expectedServerName, retrieveAllUserDetail)));
        }
        const mockIsTentativeObject = setupIsTentativeReturn(isTentative, expectedPlayerId,
          expectedServerName, expectedTournamentName, expectedTournamentDay);

        clashTeamsDbImpl.registerPlayerToNewTeamV2.mockResolvedValue(mockDbResponses);
        return {
          expectedServerName,
          expectedTournamentName,
          expectedTournamentDay,
          expectedPlayerId,
          expectedRole,
          expectedStartTime,
          mockDbResponses,
          retrieveAllUserDetail,
          mockIsTentativeObject,
          expectedResults,
        };
      };

      test('When I call to create a new Team, I should be removed from any tentative list that belongs to the '
                + 'server and tournament details given. - v2', () => {
        const {
          expectedServerName, expectedTournamentName, expectedTournamentDay,
          expectedPlayerId, expectedRole, expectedStartTime, retrieveAllUserDetail,
          mockIsTentativeObject, expectedResults,
        } = setupCreateNewTeamDataV2(true);
        const mockTentativeObjectReturned = deepCopy(mockIsTentativeObject.tentativeList);
        mockTentativeObjectReturned.tentativePlayers.pop();
        clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);

        return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole,
          expectedServerName, expectedTournamentName,
          expectedTournamentDay, expectedStartTime)
          .then((data) => verifyCreateNewTeamResultsV2(expectedPlayerId, expectedRole, expectedServerName,
            expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResults,
            mockIsTentativeObject.tentativeList, true));
      });

      test('When I call to create a new Team, and I belong to existing teams, '
                + 'I should be removed from any tentative list and unregistered from said teams'
                + 'that belongs to the server and tournament details given as well as have those details'
                + 'returned. - v2', () => {
        const {
          expectedServerName, expectedTournamentName, expectedTournamentDay,
          expectedPlayerId, expectedRole, expectedStartTime,
          mockIsTentativeObject, expectedResults,
        } = setupCreateNewTeamDataV2(true, true, 1);
        const mockTentativeObjectReturned = deepCopy(mockIsTentativeObject.tentativeList);
        mockTentativeObjectReturned.tentativePlayers.pop();
        clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);

        return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole,
          expectedServerName, expectedTournamentName,
          expectedTournamentDay, expectedStartTime)
          .then((data) => verifyCreateNewTeamResultsV2(expectedPlayerId, expectedRole, expectedServerName,
            expectedTournamentName, expectedTournamentDay, expectedStartTime, data, expectedResults,
            mockIsTentativeObject.tentativeList, true));
      });

      test('When I call to create a new Team and I do not belong to and existing tentative list, '
                + 'I should not be removed from any tentative list that belongs to the server and tournament '
                + 'details given. - v2', () => {
        const {
          expectedServerName, expectedTournamentName, expectedTournamentDay,
          expectedPlayerId, expectedRole, expectedStartTime, expectedResults,
        } = setupCreateNewTeamDataV2(false);
        return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole, expectedServerName,
          expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then((data) => verifyCreateNewTeamResultsV2(expectedPlayerId, expectedRole, expectedServerName,
            expectedTournamentName, expectedTournamentDay, expectedStartTime, data,
            expectedResults, undefined, false));
      });

      test('No tournaments available - When I call to create a new Team, if I do not have any '
                + 'tournaments available to me then I should respond with a payload containing '
                + 'an error message. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedRole = 'Top';
        const expectedStartTime = new Date().toISOString();

        clashTeamsDbImpl.registerPlayerToNewTeamV2.mockResolvedValue([{ exist: true }]);

        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName,
          expectedTournamentName, expectedTournamentDay);

        return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole, expectedServerName,
          expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then((data) => {
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName,
              expectedTournamentName, expectedTournamentDay);
            verifyRegisterPlayerIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName,
              expectedTournamentName, expectedTournamentDay, expectedStartTime);
            expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
            expect(data).toEqual({ error: 'Player is not eligible to create a new Team.' });
          });
      });

      test('Error - isTentative - If isTentative fails with an error, '
                + 'it should be rejected successfully. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedRole = 'Top';
        const expectedStartTime = new Date().toISOString();
        const error = new Error('Failed to retrieve tentative record.');
        clashTentativeDbImpl.isTentative.mockRejectedValue(error);
        return clashTeamsServiceImpl.createNewTeamV2(expectedPlayerId, expectedRole, expectedServerName,
          expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then(() => expect(true).toBeFalsy())
          .catch((err) => expect(err).toEqual(error));
      });

      test('Error - registerPlayer - If registerPlayer fails with an error,'
                + ' it should be rejected successfully. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedRole = 'Top';
        const expectedStartTime = new Date().toISOString();
        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName,
          expectedTournamentDay);
        const error = new Error('Failed to retrieve tentative record.');
        clashTeamsDbImpl.registerPlayer.mockRejectedValue(error);
        return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedRole, expectedServerName,
          expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then(() => expect(true).toBeFalsy())
          .catch((err) => expect(err).toEqual(error));
      });

      test('Error - removeFromTentative - If removeFromTentative fails with an error, it '
                + 'should be rejected successfully. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedRole = 'Top';
        const expectedStartTime = new Date().toISOString();
        setupIsTentativeReturn(true, expectedPlayerId, expectedServerName,
          expectedTournamentName, expectedTournamentDay);
        const error = new Error('Failed to retrieve tentative record.');
        clashTentativeDbImpl.removeFromTentative.mockRejectedValue(error);
        return clashTeamsServiceImpl.createNewTeam(expectedPlayerId, expectedRole, expectedServerName,
          expectedTournamentName, expectedTournamentDay, expectedStartTime)
          .then(() => expect(true).toBeFalsy())
          .catch((err) => expect(err).toEqual(error));
      });
    });
  });

  describe('Register with Team', () => {
    describe('Register with Team', () => {
      function verifyRegisterWithSpecificTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName) {
        expect(clashTeamsDbImpl.registerWithSpecificTeam).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.registerWithSpecificTeam).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
          tournamentName: expectedTournamentName,
          tournamentDay: expectedTournamentDay,
        }], expectedTeamName);
      }

      test('When I call to register with a Team, I should be removed from any tentative list that belongs to the server and tournament details given.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedTeamName = 'Abra';

        const mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        clashTeamsDbImpl.registerWithSpecificTeam.mockResolvedValue(mockDbTeamResponse);
        const idToNamesMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

        const mockIsTentativeReturn = setupIsTentativeReturn(true, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
        const mockTentativeObjectReturned = deepCopy(mockIsTentativeReturn.tentativeList);
        mockTentativeObjectReturned.tentativePlayers.pop();
        clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);

        return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
            verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            verifyRemoveFromTentativeIsInvoked(expectedPlayerId, mockIsTentativeReturn.tentativeList);
            expect(resultingPayload).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, idToNamesMap));
          });
      });

      test('When I call to register with a Team and I am not on tentative, I should not be removed from any tentative list that belongs to the server and tournament details given.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedTeamName = 'Abra';

        const mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        clashTeamsDbImpl.registerWithSpecificTeam.mockResolvedValue(mockDbTeamResponse);
        const idToNamesMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

        return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
            verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
            expect(resultingPayload).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, idToNamesMap));
          });
      });

      test('When I call to register with a Team and I am not able to join it, I should return an error payload stating so.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedTeamName = 'Abra';

        clashTeamsDbImpl.registerWithSpecificTeam.mockResolvedValue(undefined);

        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

        return clashTeamsServiceImpl.registerWithTeam(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
            expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
            expect(resultingPayload).toEqual({ error: 'Unable to find the Team requested to be persisted.' });
          });
      });

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
          .catch((err) => expect(err).toEqual(error));
      });

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
          .catch((err) => expect(err).toEqual(error));
      });

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
          .catch((err) => expect(err).toEqual(error));
      });
    });

    describe('Register with Team - v2', () => {
      function verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName,
        expectedTournamentName, expectedTournamentDay,
        expectedTeamName) {
        expect(clashTeamsDbImpl.registerWithSpecificTeamV2).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.registerWithSpecificTeamV2).toHaveBeenCalledWith(expectedPlayerId,
          expectedRole,
          expectedServerName, [{
            tournamentName: expectedTournamentName,
            tournamentDay: expectedTournamentDay,
          }], expectedTeamName);
      }

      test('When I call to register with a Team, I should be removed from '
                + 'any tentative list that belongs to the server and tournament details given. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedRole = 'Top';
        const expectedTeamName = 'Abra';

        const mockReturnedRegisteredTeam = createMockDbRegisteredTeam(expectedPlayerId, expectedRole, expectedTeamName,
          expectedServerName, expectedTournamentName, expectedTournamentDay);

        const mockDbTeamResponse = {
          registeredTeam: mockReturnedRegisteredTeam,
          unregisteredTeams: [],
        };
        clashTeamsDbImpl.registerWithSpecificTeamV2.mockResolvedValue(mockDbTeamResponse);
        const expectedUserDetails = {
          key: expectedPlayerId,
          playerName: expectedUsername,
          serverName: expectedServerName,
          role: expectedRole,
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const retrieveAllUserDetail = [expectedUserDetails]
          .reduce((map, record) => (map[record.key] = record, map), {});
        clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetail);

        const mockIsTentativeReturn = setupIsTentativeReturn(true, expectedPlayerId,
          expectedServerName, expectedTournamentName, expectedTournamentDay);
        const mockTentativeObjectReturned = deepCopy(mockIsTentativeReturn.tentativeList);
        mockTentativeObjectReturned.tentativePlayers.pop();
        clashTentativeDbImpl.removeFromTentative.mockResolvedValue(mockTentativeObjectReturned);
        const expectedResponse = {
          registeredTeam: mapToApiResponseV2(mockReturnedRegisteredTeam, expectedServerName,
            retrieveAllUserDetail),
          unregisteredTeams: [],
        };

        return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName,
          expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName,
              expectedTournamentName, expectedTournamentDay, expectedTeamName);
            expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
              .toHaveBeenCalledWith([expectedPlayerId]);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName,
              expectedTournamentDay);
            verifyRemoveFromTentativeIsInvoked(expectedPlayerId, mockIsTentativeReturn.tentativeList);
            expect(resultingPayload).toEqual(expectedResponse);
          });
      });

      test('When I call to register with a Team and I am not on tentative, '
                + 'I should not be removed from any tentative list that belongs to '
                + 'the server and tournament details given. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedRole = 'Top';
        const expectedTeamName = 'Abra';

        const mockReturnedRegisteredTeam = createMockDbRegisteredTeam(expectedPlayerId, expectedRole,
          expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);

        const mockDbTeamResponse = {
          registeredTeam: mockReturnedRegisteredTeam,
          unregisteredTeams: [],
        };
        clashTeamsDbImpl.registerWithSpecificTeamV2.mockResolvedValue(mockDbTeamResponse);
        const expectedUserDetails = {
          key: expectedPlayerId,
          playerName: expectedUsername,
          serverName: expectedServerName,
          role: expectedRole,
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const retrieveAllUserDetail = [expectedUserDetails]
          .reduce((map, record) => (map[record.key] = record, map), {});
        clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetail);

        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

        const expectedResponse = {
          registeredTeam: mapToApiResponseV2(mockReturnedRegisteredTeam, expectedServerName,
            retrieveAllUserDetail),
          unregisteredTeams: [],
        };

        return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
            expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
              .toHaveBeenCalledWith([expectedPlayerId]);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
            expect(resultingPayload).toEqual(expectedResponse);
          });
      });

      test('When I call to register with a Team and I am not on tentative, and I belong to other teams beforehand '
                + 'I should not be removed from any tentative list that belongs to '
                + 'the server and tournament details given. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedRole = 'Top';
        const expectedTeamName = 'Abra';

        const mockReturnedRegisteredTeam = createMockDbRegisteredTeam(expectedPlayerId, expectedRole,
          expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        const mockReturnedUnregisteredTeam = createMockDbRegisteredTeam(undefined, expectedRole,
          'Abamasnow', expectedServerName, expectedTournamentName, expectedTournamentDay);

        const mockDbTeamResponse = {
          registeredTeam: mockReturnedRegisteredTeam,
          unregisteredTeams: [mockReturnedUnregisteredTeam],
        };
        clashTeamsDbImpl.registerWithSpecificTeamV2.mockResolvedValue(mockDbTeamResponse);
        const expectedUserDetails = {
          key: expectedPlayerId,
          playerName: expectedUsername,
          serverName: expectedServerName,
          role: expectedRole,
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const retrieveAllUserDetail = [expectedUserDetails]
          .reduce((map, record) => (map[record.key] = record, map), {});
        clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetail);

        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

        const expectedResponse = {};
        expectedResponse.registeredTeam = mapToApiResponseV2(mockReturnedRegisteredTeam,
          expectedServerName, retrieveAllUserDetail);
        expectedResponse.unregisteredTeams = [mapToApiResponseV2(mockReturnedUnregisteredTeam,
          expectedServerName, retrieveAllUserDetail)];

        return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
            expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
              .toHaveBeenCalledWith([expectedPlayerId]);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
            expect(resultingPayload).toEqual(expectedResponse);
          });
      });

      test('When I call to register with a Team and I am not on tentative, and I belong to other teams beforehand '
                + 'with existing users, I should not be removed from any tentative list that belongs to '
                + 'the server and tournament details given. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedRole = 'Top';
        const expectedTeamName = 'Abra';

        const mockReturnedRegisteredTeam = createMockDbRegisteredTeam(expectedPlayerId, expectedRole,
          expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        const mockReturnedUnregisteredTeam = createMockDbRegisteredTeam('1', 'Mid',
          'Abamasnow', expectedServerName, expectedTournamentName, expectedTournamentDay);

        const mockDbTeamResponse = {
          registeredTeam: mockReturnedRegisteredTeam,
          unregisteredTeams: [mockReturnedUnregisteredTeam],
        };
        clashTeamsDbImpl.registerWithSpecificTeamV2.mockResolvedValue(mockDbTeamResponse);
        const expectedUserDetails = {
          key: expectedPlayerId,
          playerName: expectedUsername,
          serverName: expectedServerName,
          role: expectedRole,
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const expectedUserDetailsTwo = {
          key: '1',
          playerName: 'PlayerTwo',
          serverName: expectedServerName,
          role: 'Mid',
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const retrieveAllUserDetail = [expectedUserDetails, expectedUserDetailsTwo]
          .reduce((map, record) => (map[record.key] = record, map), {});
        clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetail);

        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);

        const expectedResponse = {};
        expectedResponse.registeredTeam = mapToApiResponseV2(mockReturnedRegisteredTeam,
          expectedServerName, retrieveAllUserDetail);
        expectedResponse.unregisteredTeams = [mapToApiResponseV2(mockReturnedUnregisteredTeam,
          expectedServerName, retrieveAllUserDetail)];

        return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId, expectedRole, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedTeamName);
            expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
              .toHaveBeenCalledWith([expectedPlayerId, '1']);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
            expect(resultingPayload).toEqual(expectedResponse);
          });
      });

      test('When I call to register with a Team and I am not on tentative, and I belong to multiple teams beforehand '
                + 'with existing users, I should not be removed from any tentative list that belongs to '
                + 'the server and tournament details given. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedRole = 'Top';
        const expectedTeamName = 'Abra';

        const mockReturnedRegisteredTeam = createMockDbRegisteredTeam(expectedPlayerId, expectedRole,
          expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        const mockReturnedUnregisteredTeam = createMockDbRegisteredTeam('1', 'Mid',
          'Abamasnow', expectedServerName, expectedTournamentName, expectedTournamentDay);
        const mockReturnedUnregisteredTeamTwo = createMockDbRegisteredTeam('1', 'Mid',
          'Charmander', expectedServerName, expectedTournamentName, '2');

        const mockDbTeamResponse = {
          registeredTeam: mockReturnedRegisteredTeam,
          unregisteredTeams: [mockReturnedUnregisteredTeam, mockReturnedUnregisteredTeamTwo],
        };
        clashTeamsDbImpl.registerWithSpecificTeamV2.mockResolvedValue(mockDbTeamResponse);
        const expectedUserDetails = {
          key: expectedPlayerId,
          playerName: expectedUsername,
          serverName: expectedServerName,
          role: expectedRole,
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const expectedUserDetailsTwo = {
          key: '1',
          playerName: 'PlayerTwo',
          serverName: expectedServerName,
          role: 'Mid',
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const retrieveAllUserDetail = [expectedUserDetails, expectedUserDetailsTwo]
          .reduce((map, record) => (map[record.key] = record, map), {});
        clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetail);

        setupIsTentativeReturn(false, expectedPlayerId, expectedServerName,
          expectedTournamentName, expectedTournamentDay);

        const expectedResponse = {};
        expectedResponse.registeredTeam = mapToApiResponseV2(mockReturnedRegisteredTeam,
          expectedServerName, retrieveAllUserDetail);
        expectedResponse.unregisteredTeams = [
          mapToApiResponseV2(mockReturnedUnregisteredTeam, expectedServerName, retrieveAllUserDetail),
          mapToApiResponseV2(mockReturnedUnregisteredTeamTwo, expectedServerName, retrieveAllUserDetail),
        ];

        return clashTeamsServiceImpl.registerWithTeamV2(expectedPlayerId,
          expectedRole, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId,
              expectedRole, expectedServerName, expectedTournamentName,
              expectedTournamentDay, expectedTeamName);
            expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
              .toHaveBeenCalledWith([expectedPlayerId, '1']);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName,
              expectedTournamentName, expectedTournamentDay);
            expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
            expect(resultingPayload).toEqual(expectedResponse);
          });
      });

      test('When I call to register with a Team and I am not able to join it, '
                + 'I should return an error payload stating so. - v2', () => {
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
          .then((resultingPayload) => {
            verifyRegisterWithSpecificTeamIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName,
              expectedTournamentName, expectedTournamentDay, expectedTeamName);
            verifyIsTentativeIsInvoked(expectedPlayerId, expectedServerName,
              expectedTournamentName, expectedTournamentDay);
            expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
            expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
            expect(resultingPayload).toEqual({ error: 'Unable to find the Team requested to be persisted.' });
          });
      });

      test('Error - isTentative - If isTentative fails with an error, '
                + 'it should be rejected successfully. - v2', () => {
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
          .catch((err) => expect(err).toEqual(error));
      });

      test('Error - registerWithSpecificTeam - If registerWithSpecificTeam fails with an '
                + 'error, it should be rejected successfully. - v2', () => {
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
          .catch((err) => expect(err).toEqual(error));
      });

      test('Error - removeFromTentative - If removeFromTentative fails with an error, '
                + 'it should be rejected successfully. - v2', () => {
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
          .catch((err) => expect(err).toEqual(error));
      });
    });
  });

  describe('Unregister from Team', () => {
    describe('Unregister from Team', () => {
      function verifyUnregisterWithTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
        expect(clashTeamsDbImpl.deregisterPlayer).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.deregisterPlayer).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
          tournamentName: expectedTournamentName,
          tournamentDay: expectedTournamentDay,
        }]);
      }

      test('When I call to unregister from a Team, I should make a call to unregister with the Team Name, Server Name, and Tournament Details.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedTeamName = 'Abra';

        const idToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

        const mockUnregisterTeamsDbResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        mockUnregisterTeamsDbResponse.players.pop();

        clashTeamsDbImpl.deregisterPlayer.mockResolvedValue(mockUnregisterTeamsDbResponse);

        return clashTeamsServiceImpl.unregisterFromTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((result) => {
            verifyUnregisterWithTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            verifyRetrievePlayerNamesIsInvoked(mockUnregisterTeamsDbResponse.players);
            expect(result).toEqual(mapToApiResponse(mockUnregisterTeamsDbResponse, expectedServerName, idToPlayerNameMap));
            expect(result).toBeTruthy();
          });
      });

      test('When I call to unregister from a Team, and I do not belong to the Team then I should return a payload stating such error.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';

        clashTeamsDbImpl.deregisterPlayer.mockResolvedValue(undefined);

        return clashTeamsServiceImpl.unregisterFromTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then((result) => {
            verifyUnregisterWithTeamIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
            expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
            expect(result).toEqual({ error: 'User not found on requested Team.' });
          });
      });

      test('Error - deregisterPlayer - If deregisterPlayer fails with an error, it should be rejected properly.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';

        const error = new Error('Failed to unregister player.');

        clashTeamsDbImpl.deregisterPlayer.mockRejectedValue(error);

        clashTeamsServiceImpl.unregisterFromTeam(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay)
          .then(() => expect(true).toBeFalsy())
          .catch((err) => expect(err).toEqual(error));
      });
    });

    describe('Unregister from Team - v2', () => {
      function verifyUnregisterWithTeamIsInvokedV2(expectedPlayerId, expectedServerName,
        expectedTournamentName, expectedTournamentDay) {
        expect(clashTeamsDbImpl.deregisterPlayerV2).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.deregisterPlayerV2).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
          tournamentName: expectedTournamentName,
          tournamentDay: expectedTournamentDay,
        }]);
      }

      test('When I call to unregister from a Team, I should make a call to unregister '
                + 'with the Team Name, Server Name, and Tournament Details. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedRole = 'Top';
        const expectedUsername = 'Roidrage';
        const expectedTeamName = 'Abra';

        const expectedUserDetails = {
          key: expectedPlayerId,
          playerName: expectedUsername,
          serverName: expectedServerName,
          role: expectedRole,
          timeAdded: new Date().toISOString(),
          subscribed: {},
          preferredChampions: [],
        };
        const retrieveAllUserDetail = [expectedUserDetails]
          .reduce((map, record) => (map[record.key] = record, map), {});
        clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(retrieveAllUserDetail);

        const mockUnregisterTeamsDbResponse = createMockDbRegisteredTeam(expectedPlayerId, expectedRole,
          expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        mockUnregisterTeamsDbResponse.players.pop();

        clashTeamsDbImpl.deregisterPlayerV2.mockResolvedValue([mockUnregisterTeamsDbResponse]);

        return clashTeamsServiceImpl.unregisterFromTeamV2(expectedPlayerId, expectedServerName,
          expectedTournamentName, expectedTournamentDay)
          .then((result) => {
            verifyUnregisterWithTeamIsInvokedV2(expectedPlayerId, expectedServerName, expectedTournamentName,
              expectedTournamentDay);
            expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
            expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledWith([]);
            expect(result).toEqual([mapToApiResponseV2(mockUnregisterTeamsDbResponse, expectedServerName,
              retrieveAllUserDetail)]);
            expect(result).toBeTruthy();
          });
      });

      test('When I call to unregister from a Team, and I do not belong to the Team then '
                + 'I should return a payload stating such error. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';

        clashTeamsDbImpl.deregisterPlayerV2.mockResolvedValue(undefined);

        return clashTeamsServiceImpl.unregisterFromTeamV2(expectedPlayerId, expectedServerName,
          expectedTournamentName, expectedTournamentDay)
          .then((result) => {
            verifyUnregisterWithTeamIsInvokedV2(expectedPlayerId, expectedServerName,
              expectedTournamentName, expectedTournamentDay);
            expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
            expect(result).toEqual({ error: 'User not found on requested Team.' });
          });
      });

      test('Error - deregisterPlayer - If deregisterPlayer fails with an error, '
                + 'it should be rejected properly. - v2', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';

        const error = new Error('Failed to unregister player.');

        clashTeamsDbImpl.deregisterPlayerV2.mockRejectedValue(error);

        clashTeamsServiceImpl.unregisterFromTeamV2(expectedPlayerId, expectedServerName,
          expectedTournamentName, expectedTournamentDay)
          .then(() => expect(true).toBeFalsy())
          .catch((err) => expect(err).toEqual(error));
      });
    });
  });

  describe('Build Player Id List from registrationResponse', () => {
    test('If there is a single player in the registeredTeam list and no unregisteredTeams'
            + 'It should have a single player id.', () => {
      const registrationDetails = {
        registeredTeam: {
          players: ['1'],
        },
        unregisteredTeams: [],
      };
      expect(Array.from(clashTeamsServiceImpl
        .buildPlayerIdListFromTeamRegistrationResponse(registrationDetails))).toEqual(['1']);
    });

    test('If there are multiple players in the registeredTeam list and no unregisteredTeams'
            + 'It should have all player ids.', () => {
      const registrationDetails = {
        registeredTeam: {
          players: ['1', '2'],
        },
        unregisteredTeams: [],
      };
      expect(Array.from(clashTeamsServiceImpl
        .buildPlayerIdListFromTeamRegistrationResponse(registrationDetails))).toEqual(['1', '2']);
    });

    test('If there are multiple players in the registeredTeams and unregisteredTeams '
            + 'It should have all player ids.', () => {
      const registrationDetails = {
        registeredTeam: {
          players: ['1', '2'],
        },
        unregisteredTeams: [{
          players: ['3'],
        }],
      };
      expect(Array.from(clashTeamsServiceImpl
        .buildPlayerIdListFromTeamRegistrationResponse(registrationDetails))).toEqual(['1', '2', '3']);
    });

    test('If no player id is found. Should return with an empty set.', () => {
      const registrationDetails = {
        unregisteredTeams: [{
          players: [],
        }],
      };
      expect(Array.from(clashTeamsServiceImpl
        .buildPlayerIdListFromTeamRegistrationResponse(registrationDetails))).toEqual([]);
    });
  });

  describe('Retrieve Teams', () => {
    test('getTeam - Retrieve all teams based on serverName.', () => {
      const serverName = 'Goon Squad';
      const mockUserDetails = {
        1: createUserDetails({}),
        2: createUserDetails({
          key: '2',
          playerName: 'Meso',
          serverName,
          preferredChampions: ['Elise'],
        }),
      };
      const expectedTeams = [createV3Team(
        {
          serverName,
          tournamentDay: '1',
          playersWRoles: { Top: '1', Jg: '2' },
          players: ['1', '2'],
        },
      )];
      const expectedResponse = buildExpectedTeamResponseWithUserMap(expectedTeams, mockUserDetails);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(expectedTeams));
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(mockUserDetails);
      return clashTeamsServiceImpl.getTeam({ server: serverName })
        .then((teams) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({ serverName });
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledWith(expectedTeams[0].players);
          expect(teams).toEqual(expectedResponse);
        });
    });

    test('getTeam - Retrieve all teams based on serverName and tournamentName.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const mockUserDetails = {
        1: createUserDetails({}),
        2: createUserDetails({
          key: '2',
          playerName: 'Meso',
          serverName,
          preferredChampions: ['Elise'],
        }),
      };
      const expectedTeams = [createV3Team(
        {
          serverName,
          tournamentName,
          tournamentDay: '1',
          playersWRoles: { Top: '1', Jg: '2' },
          players: ['1', '2'],
        },
      )];
      const expectedResponse = buildExpectedTeamResponseWithUserMap(expectedTeams, mockUserDetails);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(expectedTeams));
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(mockUserDetails);
      return clashTeamsServiceImpl.getTeam({ server: serverName, tournament: tournamentName })
        .then((teams) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({ serverName, tournamentName });
          expect(teams).toEqual(expectedResponse);
        });
    });

    test('getTeam - Retrieve all teams based on serverName, tournamentName, and tournamentDay.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const mockUserDetails = {
        1: createUserDetails({}),
        2: createUserDetails({
          key: '2',
          playerName: 'Meso',
          serverName,
          preferredChampions: ['Elise'],
        }),
      };
      const expectedTeams = [createV3Team(
        {
          serverName,
          tournamentName,
          tournamentDay,
          playersWRoles: { Top: '1', Jg: '2' },
          players: ['1', '2'],
        },
      )];
      const expectedResponse = buildExpectedTeamResponseWithUserMap(expectedTeams, mockUserDetails);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(expectedTeams));
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(mockUserDetails);
      return clashTeamsServiceImpl.getTeam({
        server: serverName,
        tournament: tournamentName,
        day: tournamentDay,
      })
        .then((teams) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({ serverName, tournamentName, tournamentDay });
          expect(teams).toEqual(expectedResponse);
        });
    });

    test('getTeam - Retrieve all teams based on serverName, tournamentName, tournamentDay, and name.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Charizard';
      const mockUserDetails = {
        1: createUserDetails({}),
        2: createUserDetails({
          key: '2',
          playerName: 'Meso',
          serverName,
          preferredChampions: ['Elise'],
        }),
      };
      const expectedTeams = [createV3Team(
        {
          serverName,
          tournamentName,
          tournamentDay,
          teamName,
          playersWRoles: { Top: '1', Jg: '2' },
          players: ['1', '2'],
        },
      )];
      const expectedResponse = buildExpectedTeamResponseWithUserMap(expectedTeams, mockUserDetails);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(expectedTeams));
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(mockUserDetails);
      return clashTeamsServiceImpl.getTeam({
        name: teamName,
        server: serverName,
        tournament: tournamentName,
        day: tournamentDay,
      })
        .then((teams) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            teamName, serverName, tournamentName, tournamentDay,
          });
          expect(teams).toEqual(expectedResponse);
        });
    });

    test('getTeam - If serverName and only tournamentDay are passed, it should return 400.', () => {
      const serverName = 'Goon Squad';
      const tournamentDay = '1';
      const name = 'Abra';
      const response = {
        code: 400,
        error: 'Missing required attribute.',
      };
      return clashTeamsServiceImpl.getTeam({
        name,
        server: serverName,
        day: tournamentDay,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).not.toHaveBeenCalled();
          expect(err).toEqual(response);
        });
    });

    test('getTeam - If serverName and only team are passed, it should return 400.', () => {
      const serverName = 'Goon Squad';
      const name = 'Abra';
      const response = {
        code: 400,
        error: 'Missing required attribute.',
      };
      return clashTeamsServiceImpl.getTeam({
        name,
        server: serverName,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).not.toHaveBeenCalled();
          expect(err).toEqual(response);
        });
    });

    test('getTeam - If serverName and tournamentName, and team are passed, it should return 400.', () => {
      const serverName = 'Goon Squad';
      const name = 'Abra';
      const tournamentName = 'awesome_sauce';
      const response = {
        code: 400,
        error: 'Missing required attribute.',
      };
      return clashTeamsServiceImpl.getTeam({
        name,
        server: serverName,
        tournament: tournamentName,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).not.toHaveBeenCalled();
          expect(err).toEqual(response);
        });
    });
  });

  describe('Add to Team', () => {
    test('updateTeam - If user is not on the Team, they should be added.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const expectedUserMap = {
        2: createUserDetails({ key: '2' }),
        3: createUserDetails({ key: '3' }),
      };
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        playerId: '2',
        role: 'Top',
      };
      const returnedFilteredTeams = [createV3Team({
        serverName,
        tournamentName,
        tournamentDay,
        playersWRoles: { Supp: '3' },
        players: ['3'],
      })];
      const expectedUpdatedTeam = deepCopy(returnedFilteredTeams[0]);
      expectedUpdatedTeam.playersWRoles.Top = '2';
      expectedUpdatedTeam.players.push('2');
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam, expectedUserMap);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(returnedFilteredTeams));
      clashTeamsDbImpl.updateTeam.mockResolvedValue(expectedUpdatedTeam);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledWith(expectedUpdatedTeam);
          expect(updatedTeam).toEqual(expectedResponse);
        })
        .catch((err) => {
          expect(err).toBeFalsy();
        });
    });

    test('updateTeam - If Team pulled has no players, they should be added to the Team.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const expectedUserMap = {
        2: createUserDetails({ key: '2' }),
        3: createUserDetails({ key: '3' }),
        7: createUserDetails({ key: '7' }),
      };
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        playerId: '2',
        role: 'Top',
      };
      const returnedFilteredTeams = [createV3Team({
        serverName,
        tournamentName,
        tournamentDay,
      })];
      delete returnedFilteredTeams[0].playersWRoles;
      delete returnedFilteredTeams[0].players;
      const expectedUpdatedTeam = deepCopy(returnedFilteredTeams[0]);
      expectedUpdatedTeam.playersWRoles = {};
      expectedUpdatedTeam.playersWRoles.Top = '2';
      expectedUpdatedTeam.players = ['2'];
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam, expectedUserMap);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue([...returnedFilteredTeams]);
      clashTeamsDbImpl.updateTeam.mockResolvedValue(expectedUpdatedTeam);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledWith(expectedUpdatedTeam);
          expect(updatedTeam).toEqual(expectedResponse);
        });
    });

    test('updateTeam - If user is not on the Team, and name is passeed, they should be added.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const teamName = 'Charizard';
      const expectedUserMap = {
        2: createUserDetails({ key: '2' }),
        3: createUserDetails({ key: '3' }),
      };
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
        playerId: '2',
        role: 'Top',
      };
      const returnedFilteredTeams = [createV3Team({
        serverName,
        tournamentName,
        tournamentDay,
        teamName,
        playersWRoles: { Supp: '3' },
        players: ['3'],
      })];
      const expectedUpdatedTeam = deepCopy(returnedFilteredTeams[0]);
      expectedUpdatedTeam.playersWRoles.Top = '2';
      expectedUpdatedTeam.players.push('2');
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam, expectedUserMap);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(returnedFilteredTeams));
      clashTeamsDbImpl.updateTeam.mockResolvedValue(expectedUpdatedTeam);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledWith(expectedUpdatedTeam);
          expect(updatedTeam).toEqual(expectedResponse);
        })
        .catch((err) => {
          expect(err).toBeFalsy();
        });
    });

    test('updateTeam - If user already belongs to teamName passed, then they should not be added and an error should be returned.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const teamName = 'Charizard';
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
        playerId: '2',
        role: 'Supp',
      };
      const returnedFilteredTeams = [createV3Team({
        serverName,
        tournamentName,
        tournamentDay,
        teamName,
        playersWRoles: { Supp: '2' },
        players: ['2'],
      })];
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(returnedFilteredTeams));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).not.toHaveBeenCalled();
          expect(err).toEqual({
            code: 400,
            error: 'User already is on Team with the given role.',
          });
        });
    });

    test('updateTeam - If no team is found, then it should return with 400.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const teamName = 'Charizard';
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
        playerId: '2',
        role: 'Supp',
      };
      const returnedFilteredTeams = [];
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(returnedFilteredTeams));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).not.toHaveBeenCalled();
          expect(err).toEqual({
            code: 400,
            error: `No team found matching criteria '${teamPatchPayload}'.`,
          });
        });
    });

    test('updateTeam - If  team is found is full (5 teamMembers), then it should return with 400.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const teamName = 'Charizard';
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
        playerId: '6',
        role: 'Supp',
      };
      const returnedFilteredTeams = [createV3Team({
        serverName,
        tournamentName,
        tournamentDay,
        teamName,
        playersWRoles: {
          Top: '1',
          Mid: '3',
          Jg: '4',
          Bot: '5',
          Supp: '2',
        },
        players: [
          '1',
          '2',
          '3',
          '4',
          '5',
        ],
      })];
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(returnedFilteredTeams));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).not.toHaveBeenCalled();
          expect(err).toEqual({
            code: 400,
            error: `Team requested is already full - '${teamPatchPayload}'.`,
          });
        });
    });

    test('updateTeam - If role is already taken, then it should return with 400.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const teamName = 'Charizard';
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
        playerId: '6',
        role: 'Supp',
      };
      const returnedFilteredTeams = [createV3Team({
        serverName,
        tournamentName,
        tournamentDay,
        teamName,
        playersWRoles: {
          Supp: '2',
        },
        players: [
          '2',
        ],
      })];
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(returnedFilteredTeams));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).not.toHaveBeenCalled();
          expect(err).toEqual({
            code: 400,
            error: `Role is already taken - '${teamPatchPayload}'.`,
          });
        });
    });
  });

  describe('Remove from Team', () => {

  });

  describe('Map Team Db Response to API Response', () => {
    describe('Map Team Db Response to API Response', () => {
      test('When given a Team Db Response with a single player, I should respond with a single mapped player id.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedTeamName = 'Abra';

        const mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        const playerIdToPlayerNameMap = setupRetrievePlayerNames(expectedPlayerId, expectedUsername);

        return clashTeamsServiceImpl.mapTeamDbResponseToApiResponse(mockDbTeamResponse).then((response) => {
          verifyRetrievePlayerNamesIsInvoked(expectedPlayerId);
          expect(response).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, playerIdToPlayerNameMap));
        });
      });

      test('When given a Team Db Response with a multiple players, I should respond with multiple mapped player id.', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedSecondUsername = 'TheIncentive';
        const expectedTeamName = 'Abra';

        const mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        mockDbTeamResponse.players.push('1');
        const playerIdToPlayerNameMap = setupRetrievePlayerNames(mockDbTeamResponse.players, [expectedUsername, expectedSecondUsername]);

        return clashTeamsServiceImpl.mapTeamDbResponseToApiResponse(mockDbTeamResponse).then((response) => {
          verifyRetrievePlayerNamesIsInvoked(mockDbTeamResponse.players);
          expect(response).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, playerIdToPlayerNameMap));
        });
      });

      test('When given a Team Db Response with a no players, I should respond with the payload without a list of players and no call to retrieve .', () => {
        const expectedServerName = 'Goon Squad';
        const expectedTournamentName = 'awesome_sauce';
        const expectedTournamentDay = '2';
        const expectedPlayerId = '123131';
        const expectedUsername = 'Roidrage';
        const expectedSecondUsername = 'TheIncentive';
        const expectedTeamName = 'Abra';

        const mockDbTeamResponse = createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay);
        mockDbTeamResponse.players.push('1');
        const playerIdToPlayerNameMap = setupRetrievePlayerNames(mockDbTeamResponse.players, [expectedUsername, expectedSecondUsername]);

        return clashTeamsServiceImpl.mapTeamDbResponseToApiResponse(mockDbTeamResponse).then((response) => {
          verifyRetrievePlayerNamesIsInvoked(mockDbTeamResponse.players);
          expect(response).toEqual(mapToApiResponse(mockDbTeamResponse, expectedServerName, playerIdToPlayerNameMap));
        });
      });
    });
  });
});

function mapToExpectedDetailedApiResponse(team, expectedServerName, retrieveAllUserDetails) {
  return {
    teamName: team.teamName,
    serverName: expectedServerName,
    playersDetails: Array.isArray(team.players) ? team.players.map((id) => {
      let mappedPayload = { name: id };
      const foundUser = retrieveAllUserDetails[id];
      if (foundUser) {
        mappedPayload = { name: foundUser.playerName, champions: foundUser.preferredChampions };
      }
      return mappedPayload;
    }) : {},
    tournamentDetails: {
      tournamentName: team.tournamentName,
      tournamentDay: team.tournamentDay,
    },
    startTime: team.startTime,
  };
}

function mapToExpectedDetailedApiResponseV2(team, expectedServerName, retrieveAllUserDetails) {
  return {
    teamName: team.teamName,
    serverName: expectedServerName,
    playersDetails: Array.isArray(team.players) ? team.players.map((id) => {
      let mappedPayload = { name: id };
      const foundUser = retrieveAllUserDetails[id];
      const roleMap = Object.keys(team.playersWRoles).reduce((ret, key) => {
        ret[team.playersWRoles[key]] = key;
        return ret;
      }, {});
      if (foundUser) {
        mappedPayload = {
          name: foundUser.playerName,
          role: roleMap[id],
          id,
          champions: foundUser.preferredChampions,
        };
      }
      return mappedPayload;
    }) : {},
    tournamentDetails: {
      tournamentName: team.tournamentName,
      tournamentDay: team.tournamentDay,
    },
    startTime: team.startTime,
  };
}

function createNewMockDbTeamResponse(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
  const mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
  mockDbTeamResponseBase.teamName = `Team ${Math.random() * 10000}`;
  return mockDbTeamResponseBase;
}

function createNewMockDbTeamResponseV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName, expectedTournamentDay) {
  const mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
  mockDbTeamResponseBase.teamName = `Team ${Math.random() * 10000}`;
  mockDbTeamResponseBase.playersWRoles = {};
  if (expectedRole) {
    mockDbTeamResponseBase.playersWRoles[expectedRole] = expectedPlayerId;
  }
  return mockDbTeamResponseBase;
}

function createMockDbTeamResponse(expectedPlayerId, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay) {
  const mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
  mockDbTeamResponseBase.teamName = `Team ${expectedTeamName}`;
  return mockDbTeamResponseBase;
}

function createMockDbRegisteredTeam(expectedPlayerId, role, expectedTeamName, expectedServerName, expectedTournamentName, expectedTournamentDay) {
  const mockDbTeamResponseBase = createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay);
  mockDbTeamResponseBase.teamName = `Team ${expectedTeamName}`;
  mockDbTeamResponseBase.playersWRoles = {};
  if (role) {
    mockDbTeamResponseBase.playersWRoles[role] = expectedPlayerId;
  }
  return mockDbTeamResponseBase;
}

function createMockDbTeamResponseBase(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay) {
  const mockObj = {
    key: 'Some#mock#value',
    serverName: expectedServerName,
    tournamentName: expectedTournamentName,
    tournamentDay: expectedTournamentDay,
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
    tournamentDay: expectedTournamentDay,
  });
}

function verifyRegisterPlayerIsInvoked(expectedPlayerId, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime) {
  expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledTimes(1);
  expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledWith(expectedPlayerId, expectedServerName, [{
    tournamentName: expectedTournamentName,
    tournamentDay: expectedTournamentDay,
    startTime: expectedStartTime,
  }]);
}

function verifyRegisterPlayerIsInvokedV2(expectedPlayerId, expectedRole, expectedServerName, expectedTournamentName, expectedTournamentDay, expectedStartTime) {
  expect(clashTeamsDbImpl.registerPlayerToNewTeamV2).toHaveBeenCalledTimes(1);
  expect(clashTeamsDbImpl.registerPlayerToNewTeamV2).toHaveBeenCalledWith(expectedPlayerId, expectedRole,
    expectedServerName, [{
      tournamentName: expectedTournamentName,
      tournamentDay: expectedTournamentDay,
      startTime: expectedStartTime,
    }]);
}

function verifyRetrievePlayerNamesIsInvoked(expectedPlayerIds) {
  expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1);
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
    playersDetails: Array.isArray(mockDbResponse.players) ? mockDbResponse.players.map((id) => ({ name: idToNameObject[id] ? idToNameObject[id] : id })) : {},
    tournamentDetails: {
      tournamentName: mockDbResponse.tournamentName,
      tournamentDay: mockDbResponse.tournamentDay,
    },
    startTime: mockDbResponse.startTime,
  };
}

function mapToApiResponseV2(mockDbResponse, expectedServerName, idToNameObject) {
  const mockObj = {
    teamName: mockDbResponse.teamName,
    serverName: expectedServerName,
    tournamentDetails: {
      tournamentName: mockDbResponse.tournamentName,
      tournamentDay: mockDbResponse.tournamentDay,
    },
    startTime: mockDbResponse.startTime,
  };
  mockObj.playersDetails = Array.isArray(mockDbResponse.players) ? mockDbResponse.players.map((id) => {
    const foundUser = idToNameObject[id];
    return {
      name: foundUser.playerName,
      id,
      role: foundUser.role,
      champions: foundUser.preferredChampions,
    };
  }) : {};
  return mockObj;
}

function setupRetrievePlayerNames(expectedPlayerId, expectedUsername) {
  const idToNameObject = {};
  if (Array.isArray(expectedPlayerId)) {
    for (const index in expectedPlayerId) {
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
      tournamentDetails: { tournamentName: expectedTournamentName, tournamentDay: expectedTournamentDay },
    },
  };
  clashTentativeDbImpl.isTentative.mockResolvedValue(mockIsTentativeObject);
  return mockIsTentativeObject;
}
