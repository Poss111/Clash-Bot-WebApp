const clashTeamsServiceImpl = require('../TeamService');
const clashTeamsDbImpl = require('../../dao/ClashTeamsDbImpl');
const clashSubscriptionDbImpl = require('../../dao/ClashUserDbImpl');
const clashUserTeamAssociationDbImpl = require('../../dao/ClashUserTeamAssociationDbImpl');
const clashTimeDbImpl = require('../../dao/ClashTimeDbImpl');
const socketService = require('../../socket/SocketServices');
const tentativeService = require('../TentativeService');
const {
  deepCopy, buildExpectedTeamResponseWithUserMap, createUserDetails, createV3Team,
} = require('../../utils/tests/test-utility.utility.test');

jest.mock('../../dao/ClashTeamsDbImpl');
jest.mock('../../dao/ClashUserDbImpl');
jest.mock('../../dao/ClashUserTeamAssociationDbImpl');
jest.mock('../../dao/ClashTimeDbImpl');
jest.mock('../../socket/SocketServices');
jest.mock('../TentativeService');

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
          ret[entry[0]] = {
            id: entry[1],
            name: foundUser.playerName,
            champions: foundUser.preferredChampions,
          };
          return ret;
        }, {}),
    },
  };
}

function validateTeamDeletion(
  serverName, currentTeam, playerId, tournamentName, tournamentDay,
) {
  expect(clashTeamsDbImpl.deleteTeam)
    .toHaveBeenCalledTimes(1);
  expect(clashTeamsDbImpl.deleteTeam)
    .toHaveBeenCalledWith({
      serverName,
      details: currentTeam.details,
    });
  expect(clashUserTeamAssociationDbImpl.removeUserAssociation)
    .toHaveBeenCalledTimes(1);
  expect(clashUserTeamAssociationDbImpl.removeUserAssociation)
    .toHaveBeenCalledWith({
      playerId,
      tournament: tournamentName,
      tournamentDay,
      serverName,
      teamName: currentTeam.teamName,
    });
}

function validateTentativeRemoval(serverName, tournamentName, tournamentDay, playerId) {
  expect(tentativeService.removePlayerFromTentative)
    .toHaveBeenCalledTimes(1);
  expect(tentativeService.removePlayerFromTentative)
    .toHaveBeenCalledWith({
      serverName,
      playerId,
      tournament: tournamentName,
      tournamentDay,
    });
}

function validateAssociationSwap(
  playerId, tournamentName, tournamentDay, serverName, originalTeamName, newTeamName, role,
) {
  expect(clashUserTeamAssociationDbImpl.removeUserAssociation)
    .toHaveBeenCalledTimes(1);
  expect(clashUserTeamAssociationDbImpl.removeUserAssociation)
    .toHaveBeenCalledWith({
      playerId,
      tournament: tournamentName,
      tournamentDay,
      serverName,
      teamName: originalTeamName,
    });
  expect(clashUserTeamAssociationDbImpl.createUserAssociation)
    .toHaveBeenCalledTimes(1);
  expect(clashUserTeamAssociationDbImpl.createUserAssociation)
    .toHaveBeenCalledWith({
      playerId,
      tournament: tournamentName,
      tournamentDay,
      serverName,
      teamName: newTeamName,
      role,
    });
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('Clash Teams Service Impl', () => {
  describe('Team - GET', () => {
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
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(expectedTeams[0].players);
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
          expect(clashTeamsDbImpl.retrieveTeamsByFilter)
            .toHaveBeenCalledWith({ serverName, tournamentName });
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
          expect(clashTeamsDbImpl.retrieveTeamsByFilter)
            .toHaveBeenCalledWith({ serverName, tournamentName, tournamentDay });
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
        serverName,
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
        serverName,
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
        serverName,
        tournament: tournamentName,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).not.toHaveBeenCalled();
          expect(err).toEqual(response);
        });
    });
  });

  describe('Team - PATCH', () => {
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
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam,
        expectedUserMap);
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([]);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(returnedFilteredTeams));
      clashTeamsDbImpl.updateTeam.mockResolvedValue(expectedUpdatedTeam);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '2',
        association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
        role: 'Top',
        teamName: expectedUpdatedTeam.teamName,
      });
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      socketService.sendMessage.mockResolvedValue(true);
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashUserTeamAssociationDbImpl.createUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.createUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
              serverName: teamPatchPayload.serverName,
              teamName: expectedUpdatedTeam.teamName,
              role: teamPatchPayload.role,
            });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledWith(expectedUpdatedTeam);
          expect(socketService.sendMessage).toHaveBeenCalledTimes(1);
          expect(socketService.sendMessage)
            .toHaveBeenCalledWith(expectedResponse.payload);
          expect(updatedTeam).toEqual(expectedResponse);
        });
    });

    test('updateTeam - (User belongs to another Team) - If user is not on the Team and on another Team, they should be removed from the first team and added.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const expectedUserMap = {
        2: createUserDetails({ key: '2' }),
        3: createUserDetails({ key: '3' }),
        4: createUserDetails({ key: '4' }),
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
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam,
        expectedUserMap);
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([
        {
          playerId: '2',
          association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
          serverName: teamPatchPayload.serverName,
          role: 'Supp',
          teamName: 'some-team',
        },
      ]);
      const currentTeam = createV3Team({
        serverName,
        teamName: 'some-team',
        tournamentName,
        tournamentDay,
        playersWRoles: { Top: '4', Supp: '2' },
        players: ['4', '2'],
      });
      const expectedUpdateOfCurrentTeam = { ...currentTeam };
      expectedUpdateOfCurrentTeam.playersWRoles = { Top: '4' };
      expectedUpdateOfCurrentTeam.players = ['4'];
      const expectedRemoveEvent = buildExpectedSingleTeamResponseWithUserMap(
        expectedUpdateOfCurrentTeam,
        expectedUserMap,
      );
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce([{ ...currentTeam }]);
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce(deepCopy(returnedFilteredTeams));
      clashTeamsDbImpl.updateTeam
        .mockResolvedValueOnce(expectedUpdateOfCurrentTeam);
      clashTeamsDbImpl.updateTeam
        .mockResolvedValueOnce(expectedUpdatedTeam);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '2',
        association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
        role: 'Top',
        teamName: expectedUpdatedTeam.teamName,
      });
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      socketService.sendMessage.mockResolvedValue(true);
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            });
          validateAssociationSwap(
            teamPatchPayload.playerId,
            tournamentName,
            tournamentDay,
            serverName,
            currentTeam.teamName,
            expectedUpdatedTeam.teamName,
            teamPatchPayload.role,
          );
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(2);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenNthCalledWith(1, {
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: currentTeam.teamName,
          });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenNthCalledWith(2, {
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(2);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenNthCalledWith(1, expectedUpdateOfCurrentTeam);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenNthCalledWith(2, expectedUpdatedTeam);
          expect(socketService.sendMessage).toHaveBeenCalledTimes(2);
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(1, expectedRemoveEvent.payload);
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(2, expectedResponse.payload);
          expect(updatedTeam).toEqual(expectedResponse);
        });
    });

    test('updateTeam - (User belongs to another Team with same Role) - If user is not on the Team and on another Team, they should be removed from the first team and added.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const expectedUserMap = {
        2: createUserDetails({ key: '2' }),
        3: createUserDetails({ key: '3' }),
        4: createUserDetails({ key: '4' }),
      };
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        playerId: '2',
        role: 'Top',
        // teamName: 'Abra'
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
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam,
        expectedUserMap);
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([
        {
          playerId: '2',
          association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
          role: 'Top',
          teamName: 'some-team',
        },
      ]);
      const currentTeam = createV3Team({
        serverName,
        teamName: 'some-team',
        tournamentName,
        tournamentDay,
        playersWRoles: { Top: '2', Supp: '4' },
        players: ['4', '2'],
      });
      const expectedUpdateOfCurrentTeam = { ...currentTeam };
      expectedUpdateOfCurrentTeam.playersWRoles = { Supp: '4' };
      expectedUpdateOfCurrentTeam.players = ['4'];
      const expectedRemoveEvent = buildExpectedSingleTeamResponseWithUserMap(
        expectedUpdateOfCurrentTeam,
        expectedUserMap,
      );
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce([{ ...currentTeam }]);
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce(deepCopy(returnedFilteredTeams));
      clashTeamsDbImpl.updateTeam
        .mockResolvedValueOnce(expectedUpdateOfCurrentTeam);
      clashTeamsDbImpl.updateTeam
        .mockResolvedValueOnce(expectedUpdatedTeam);
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([{
        playerId: '2',
        association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
        serverName: teamPatchPayload.serverName,
        role: 'Top',
        teamName: 'some-team',
      }]);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '2',
        association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
        role: 'Top',
        teamName: expectedUpdatedTeam.teamName,
      });
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      socketService.sendMessage.mockResolvedValue(true);
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            });
          validateAssociationSwap(
            teamPatchPayload.playerId,
            tournamentName,
            tournamentDay,
            serverName,
            currentTeam.teamName,
            expectedUpdatedTeam.teamName,
            teamPatchPayload.role,
          );
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(2);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenNthCalledWith(1, {
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: currentTeam.teamName,
          });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenNthCalledWith(2, {
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(2);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenNthCalledWith(1, expectedUpdateOfCurrentTeam);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenNthCalledWith(2, expectedUpdatedTeam);
          expect(socketService.sendMessage).toHaveBeenCalledTimes(2);
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(1, expectedRemoveEvent.payload);
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(2, expectedResponse.payload);
          expect(updatedTeam).toEqual(expectedResponse);
        });
    });

    test('updateTeam - (Error, User already belongs to Team) - If user is already associated to the requested Team with the same role, they should be returned 400 as an error.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        playerId: '2',
        role: 'Top',
        teamName: 'abra',
      };
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([
        {
          playerId: '2',
          association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#abra`,
          role: 'Top',
          teamName: 'abra',
        },
      ]);
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => expect(updatedTeam).toBeFalsy())
        .catch((response) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).not.toHaveBeenCalled();
          expect(clashTeamsDbImpl.updateTeam).not.toHaveBeenCalled();
          expect(socketService.sendMessage).not.toHaveBeenCalled();
          expect(response).toEqual({
            code: 400,
            error: 'User already belongs on Team requested with role.',
          });
        });
    });

    test('updateTeam - (User belongs to another Team by themselves) - If user is not on the Team and is on another Team by themselves, the original team should be deleted and then they should added.', () => {
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
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam,
        expectedUserMap);
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([
        {
          playerId: '2',
          association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
          serverName: teamPatchPayload.serverName,
          role: 'Supp',
          teamName: 'some-team',
        },
      ]);
      const currentTeam = createV3Team({
        serverName,
        teamName: 'some-team',
        tournamentName,
        tournamentDay,
        playersWRoles: { Supp: '2' },
        players: ['2'],
      });
      const expectedUpdateOfCurrentTeam = { ...currentTeam };
      const expectedRemoveEvent = buildExpectedSingleTeamResponseWithUserMap(
        expectedUpdateOfCurrentTeam,
        expectedUserMap,
      );
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce([{ ...currentTeam }]);
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce(deepCopy(returnedFilteredTeams));
      clashTeamsDbImpl.deleteTeam
        .mockResolvedValue(true);
      clashTeamsDbImpl.updateTeam
        .mockResolvedValue(expectedUpdatedTeam);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '2',
        association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
        role: 'Top',
        teamName: expectedUpdatedTeam.teamName,
      });
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      socketService.sendMessage.mockResolvedValue(true);
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(2);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenNthCalledWith(1, {
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: currentTeam.teamName,
          });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenNthCalledWith(2, {
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          validateTeamDeletion(
            serverName,
            currentTeam,
            teamPatchPayload.playerId,
            tournamentName,
            tournamentDay,
          );
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledWith(expectedUpdatedTeam);
          expect(socketService.sendMessage)
            .toHaveBeenCalledTimes(2);
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(1, {
              name: expectedRemoveEvent.payload.name,
              serverName: expectedRemoveEvent.payload.serverName,
            });
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(2, expectedResponse.payload);
          expect(updatedTeam).toEqual(expectedResponse);
        });
    });

    test('updateTeam - (User belongs to a Tentative Queue) - If user is not on the Team and on another Tentative Queue, they should be removed from the Tentative Queue then added.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const expectedUserMap = {
        2: createUserDetails({ key: '2' }),
        3: createUserDetails({ key: '3' }),
        4: createUserDetails({ key: '4' }),
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
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam,
        expectedUserMap);
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([
        {
          playerId: '2',
          association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#tentative`,
          serverName: teamPatchPayload.serverName,
        },
      ]);
      tentativeService.removePlayerFromTentative
        .mockResolvedValue({
          code: 200,
          payload: {
            serverName,
            tournamentDetails: {
              tournamentName,
              tournamentDay,
            },
            tentativePlayers: [],
          },
        });
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce(deepCopy(returnedFilteredTeams));
      clashTeamsDbImpl.updateTeam
        .mockResolvedValueOnce(expectedUpdatedTeam);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '2',
        association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
        role: 'Top',
        teamName: expectedUpdatedTeam.teamName,
      });
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      socketService.sendMessage.mockResolvedValue(true);
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            });
          validateTentativeRemoval(
            serverName, tournamentName, tournamentDay, teamPatchPayload.playerId,
          );
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledWith(expectedUpdatedTeam);
          expect(socketService.sendMessage).toHaveBeenCalledTimes(1);
          expect(socketService.sendMessage)
            .toHaveBeenCalledWith(expectedResponse.payload);
          expect(updatedTeam).toEqual(expectedResponse);
        });
    });

    test('updateTeam - If user is not on the Team, and name is passed, they should be added.', () => {
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
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam,
        expectedUserMap);
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([]);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(deepCopy(returnedFilteredTeams));
      clashTeamsDbImpl.updateTeam.mockResolvedValue(expectedUpdatedTeam);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '2',
        association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
        role: 'Top',
        teamName: expectedUpdatedTeam.teamName,
      });
      socketService.sendMessage.mockResolvedValue(true);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((updatedTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledWith(expectedUpdatedTeam);
          expect(clashUserTeamAssociationDbImpl.createUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.createUserAssociation)
            .toHaveBeenCalledWith({
              playerId: teamPatchPayload.playerId,
              tournament: teamPatchPayload.tournamentDetails.tournamentName,
              tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
              serverName: teamPatchPayload.serverName,
              teamName: expectedUpdatedTeam.teamName,
              role: teamPatchPayload.role,
            });
          expect(socketService.sendMessage).toHaveBeenCalledTimes(1);
          expect(socketService.sendMessage)
            .toHaveBeenCalledWith(expectedResponse.payload);
          expect(updatedTeam).toEqual(expectedResponse);
        });
    });

    test('updateTeam - (User wants to swap role) - If user already belongs to teamName passed with a different role, then they should be added with the requested role and removed from the current role.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '2';
      const teamName = 'charizard';
      const expectedUserMap = {
        1: createUserDetails({ key: '1' }),
      };
      const teamPatchPayload = {
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
        playerId: '1',
        role: 'Top',
      };
      const returnedFilteredTeams = [createV3Team({
        serverName,
        tournamentName,
        tournamentDay,
        teamName,
        playersWRoles: { Supp: '1' },
        players: ['1'],
      })];
      const expectedUpdatedTeam = deepCopy(returnedFilteredTeams[0]);
      expectedUpdatedTeam.playersWRoles = {
        Top: '1',
      };
      expectedUpdatedTeam.players = ['1'];
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([
        {
          playerId: '1',
          association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#${teamName}`,
          teamName,
          serverName: teamPatchPayload.serverName,
          role: 'Supp',
        },
      ]);
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValueOnce(deepCopy(returnedFilteredTeams));
      socketService.sendMessage.mockResolvedValue(true);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '1',
        association: `${teamPatchPayload.tournamentDetails.tournamentName}#${teamPatchPayload.tournamentDetails.tournamentDay}#${teamPatchPayload.serverName}#some-team`,
        role: 'Top',
        teamName: expectedUpdatedTeam.teamName,
      });
      clashTeamsDbImpl.updateTeam.mockResolvedValue(expectedUpdatedTeam);
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam,
        expectedUserMap);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(deepCopy(expectedUserMap));
      return clashTeamsServiceImpl.updateTeam({ body: teamPatchPayload })
        .then((response) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: teamPatchPayload.serverName,
            tournamentName: teamPatchPayload.tournamentDetails.tournamentName,
            tournamentDay: teamPatchPayload.tournamentDetails.tournamentDay,
            teamName: teamPatchPayload.teamName,
          });
          expect(clashUserTeamAssociationDbImpl.getUserAssociation).toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation).toHaveBeenCalledWith({
            playerId: '1',
            tournament: tournamentName,
            tournamentDay,
          });
          expect(clashUserTeamAssociationDbImpl.createUserAssociation).toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.createUserAssociation).toHaveBeenCalledWith({
            playerId: '1',
            tournament: tournamentName,
            tournamentDay,
            serverName,
            teamName,
            role: 'Top',
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledWith(expectedUpdatedTeam);
          expect(response).toEqual(expectedResponse);
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
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([]);
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
            error: `No team found matching criteria '${serverName}#${tournamentName}#${tournamentDay}#${teamName}'.`,
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
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([]);
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
            error: `Team requested is already full - '${serverName}#${tournamentName}#${tournamentDay}#${teamName}'.`,
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
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([]);
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
            error: `Role is already taken - '${serverName}#${tournamentName}#${tournamentDay}#${teamName}#Supp'.`,
          });
        });
    });
  });

  describe('Team - DELETE', () => {
    test('removePlayerFromTeam - If a player exists on the Team, they should be removed from it.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const expectedUserMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
      };
      const retrieveTeams = [createV3Team({
        serverName: expectedServerName,
        tournamentName,
        tournamentDay,
        playersWRoles: {
          Top: expectedPlayerToRemove,
          Bot: '2',
        },
        players: [expectedPlayerToRemove, '2'],
        teamName,
      })];
      const updatedTeam = deepCopy(retrieveTeams[0]);
      updatedTeam.players = ['2'];
      updatedTeam.playersWRoles = { Bot: '2' };
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(retrieveTeams);
      clashTeamsDbImpl.updateTeam.mockResolvedValue(updatedTeam);
      socketService.sendMessage.mockResolvedValue(true);
      const response = buildExpectedSingleTeamResponseWithUserMap(updatedTeam, expectedUserMap);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(expectedUserMap);
      return clashTeamsServiceImpl.removePlayerFromTeam({
        name: teamName,
        serverName: 'Goon Squad',
        tournament: tournamentName,
        tournamentDay,
        playerId: expectedPlayerToRemove,
      })
        .then((teamWithRemoved) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: expectedServerName,
            tournamentName,
            tournamentDay,
            teamName,
          });
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam)
            .toHaveBeenCalledWith(updatedTeam);
          expect(clashUserTeamAssociationDbImpl.removeUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.removeUserAssociation)
            .toHaveBeenCalledWith({
              playerId: expectedPlayerToRemove,
              tournament: tournamentName,
              tournamentDay,
              serverName: expectedServerName,
              teamName: updatedTeam.teamName,
            });
          expect(socketService.sendMessage)
            .toHaveBeenCalledTimes(1);
          expect(socketService.sendMessage)
            .toHaveBeenCalledWith(response.payload);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledWith(['2']);
          expect(teamWithRemoved).toEqual(response);
        });
    });

    test('removePlayerFromTeam - retrieveTeamsByFilter fails, it should return 500.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const removalPayload = {
        serverName: expectedServerName,
        playerId: expectedPlayerToRemove,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
      };
      clashTeamsDbImpl.retrieveTeamsByFilter.mockRejectedValue(new Error('Something went wrong.'));
      return clashTeamsServiceImpl.removePlayerFromTeam({ body: removalPayload })
        .then(() => expect(true).toBeFalsy())
        .catch((err) => expect(err).toEqual({ code: 500, error: 'Something went wrong.' }));
    });

    test('removePlayerFromTeam - deleteTeam fails, it should return 500.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const retrieveTeams = [createV3Team({
        serverName: expectedServerName,
        tournamentName,
        tournamentDay,
        playersWRoles: {
          Top: expectedPlayerToRemove,
        },
        players: [expectedPlayerToRemove],
        teamName,
      })];
      const updatedTeam = deepCopy(retrieveTeams[0]);
      updatedTeam.players = [];
      updatedTeam.playersWRoles = {};
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(retrieveTeams);
      clashTeamsDbImpl.deleteTeam.mockRejectedValue(new Error('Failed'));
      return clashTeamsServiceImpl.removePlayerFromTeam({
        name: teamName,
        serverName: 'Goon Squad',
        tournament: tournamentName,
        tournamentDay,
        playerId: expectedPlayerToRemove,
      })
        .then(() => expect(true).toBeTruthy())
        .catch((teamWithRemoved) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: expectedServerName,
            tournamentName,
            tournamentDay,
            teamName,
          });
          expect(clashTeamsDbImpl.deleteTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.deleteTeam).toHaveBeenCalledWith({
            serverName: expectedServerName,
            details: retrieveTeams[0].details,
          });
          expect(teamWithRemoved).toEqual({
            code: 500,
            error: 'Something went wrong.',
          });
        });
    });

    test('removePlayerFromTeam - updateTeam fails, it should return 500.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const retrieveTeams = [createV3Team({
        serverName: expectedServerName,
        tournamentName,
        tournamentDay,
        playersWRoles: {
          Top: expectedPlayerToRemove,
          Bot: '2',
        },
        players: [expectedPlayerToRemove, '2'],
        teamName,
      })];
      const updatedTeam = deepCopy(retrieveTeams[0]);
      updatedTeam.players = ['2'];
      updatedTeam.playersWRoles = { Bot: '2' };
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(retrieveTeams);
      clashTeamsDbImpl.updateTeam.mockRejectedValue(new Error('Failed'));
      return clashTeamsServiceImpl.removePlayerFromTeam({
        name: teamName,
        serverName: 'Goon Squad',
        tournament: tournamentName,
        tournamentDay,
        playerId: expectedPlayerToRemove,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((teamWithRemoved) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: expectedServerName,
            tournamentName,
            tournamentDay,
            teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledWith(updatedTeam);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).not.toHaveBeenCalled();
          expect(teamWithRemoved).toEqual({
            code: 500,
            error: 'Something went wrong.',
          });
        });
    });

    test('removePlayerFromTeam - retrieveAllUserDetails fails, it should return 500', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const retrieveTeams = [createV3Team({
        serverName: expectedServerName,
        tournamentName,
        tournamentDay,
        playersWRoles: {
          Top: expectedPlayerToRemove,
          Bot: '2',
        },
        players: [expectedPlayerToRemove, '2'],
        teamName,
      })];
      const updatedTeam = deepCopy(retrieveTeams[0]);
      updatedTeam.players = ['2'];
      updatedTeam.playersWRoles = { Bot: '2' };
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(retrieveTeams);
      clashTeamsDbImpl.updateTeam.mockResolvedValue(updatedTeam);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockRejectedValue(new Error('Failed'));
      return clashTeamsServiceImpl.removePlayerFromTeam({
        name: teamName,
        serverName: 'Goon Squad',
        tournament: tournamentName,
        tournamentDay,
        playerId: expectedPlayerToRemove,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((teamWithRemoved) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: expectedServerName,
            tournamentName,
            tournamentDay,
            teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.updateTeam).toHaveBeenCalledWith(updatedTeam);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledWith(['2']);
          expect(teamWithRemoved).toEqual({
            code: 500,
            error: 'Something went wrong.',
          });
        });
    });

    test('removePlayerFromTeam - If a player exists on the Team, and they are the last person on the Team. The team should be removed completely.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const retrieveTeams = [createV3Team({
        serverName: expectedServerName,
        tournamentName,
        tournamentDay,
        playersWRoles: {
          Top: expectedPlayerToRemove,
        },
        players: [expectedPlayerToRemove],
        teamName,
      })];
      const updatedTeam = deepCopy(retrieveTeams[0]);
      updatedTeam.players = [];
      updatedTeam.playersWRoles = {};
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(retrieveTeams);
      clashTeamsDbImpl.deleteTeam.mockResolvedValue(true);
      socketService.sendMessage.mockResolvedValue(true);
      return clashTeamsServiceImpl.removePlayerFromTeam({
        name: teamName,
        serverName: 'Goon Squad',
        tournament: tournamentName,
        tournamentDay,
        playerId: expectedPlayerToRemove,
      })
        .then((teamWithRemoved) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: expectedServerName,
            tournamentName,
            tournamentDay,
            teamName,
          });
          expect(clashTeamsDbImpl.deleteTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.deleteTeam).toHaveBeenCalledWith({
            serverName: expectedServerName,
            details: retrieveTeams[0].details,
          });
          expect(clashUserTeamAssociationDbImpl.removeUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.removeUserAssociation)
            .toHaveBeenCalledWith({
              playerId: expectedPlayerToRemove,
              tournament: tournamentName,
              tournamentDay,
              serverName: expectedServerName,
              teamName: updatedTeam.teamName,
            });
          expect(socketService.sendMessage).toHaveBeenCalledTimes(1);
          expect(socketService.sendMessage).toHaveBeenCalledWith({
            name: teamName,
            serverName: expectedServerName,
          });
          expect(teamWithRemoved).toEqual({
            code: 200,
            payload: {
              name: teamName,
              serverName: expectedServerName,
            },
          });
        });
    });

    test('removePlayerFromTeam - If the player is not on the team, return 400 as bad request.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const retrieveTeams = [createV3Team({
        serverName: expectedServerName,
        tournamentName,
        tournamentDay,
        playersWRoles: {
          Bot: '2',
        },
        players: ['2'],
        teamName,
      })];
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(retrieveTeams);
      return clashTeamsServiceImpl.removePlayerFromTeam({
        name: teamName,
        serverName: 'Goon Squad',
        tournament: tournamentName,
        tournamentDay,
        playerId: expectedPlayerToRemove,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((teamWithRemoved) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: expectedServerName,
            tournamentName,
            tournamentDay,
            teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).not.toHaveBeenCalled();
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).not.toHaveBeenCalled();
          expect(teamWithRemoved).toEqual({
            code: 400,
            error: `Player does not exist on Team '${expectedServerName}#${tournamentName}#${tournamentDay}#${teamName}'.`,
          });
        });
    });

    test('removePlayerFromTeam - If no Team was found, return 400 as bad request.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const retrieveTeams = [];
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(retrieveTeams);
      return clashTeamsServiceImpl.removePlayerFromTeam({
        name: teamName,
        serverName: 'Goon Squad',
        tournament: tournamentName,
        tournamentDay,
        playerId: expectedPlayerToRemove,
      })
        .then(() => expect(true).toBeFalsy())
        .catch((teamWithRemoved) => {
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.retrieveTeamsByFilter).toHaveBeenCalledWith({
            serverName: expectedServerName,
            tournamentName,
            tournamentDay,
            teamName,
          });
          expect(clashTeamsDbImpl.updateTeam).not.toHaveBeenCalled();
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).not.toHaveBeenCalled();
          expect(teamWithRemoved).toEqual({
            code: 400,
            error: 'No Team found with criteria.',
          });
        });
    });
  });

  describe('Team - POST', () => {
    test('createNewTeam - should invoke creating a new team and return it.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const playerDetails = {
        id: '1',
        role: 'Top',
      };
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
      };
      const teamPostPayload = {
        playerDetails,
        serverName,
        tournamentName,
        tournamentDay,
      };
      const persistedTeam = {
        teamName: 'abra',
        details: `${tournamentName}#${tournamentDay}#abra`,
        serverName,
        tournamentName,
        tournamentDay,
        players: ['1'],
        playersWRoles: {
          Top: '1',
        },
      };
      const expectedResponse = {
        code: 200,
        payload: {
          name: 'abra',
          serverName,
          tournament: {
            tournamentName,
            tournamentDay,
          },
          playerDetails: {
            Top: {
              id: '1',
              name: idToPlayerMap['1'].playerName,
              champions: idToPlayerMap['1'].preferredChampions,
            },
          },
        },
      };
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([]);
      clashTimeDbImpl.findTournament.mockResolvedValue([{ tournamentName: 'valid', tournamentDay: '1' }]);
      clashTeamsDbImpl.createTeam.mockResolvedValue(persistedTeam);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '1',
        association: `${tournamentName}#${tournamentDay}#${serverName}#abra`,
        role: 'Top',
        teamName: 'abra',
      });
      socketService.sendMessage.mockResolvedValue(true);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockReturnValue(idToPlayerMap);
      return clashTeamsServiceImpl.createNewTeam({ body: teamPostPayload })
        .then((createdTeam) => {
          expect(clashTeamsDbImpl.createTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.createTeam).toHaveBeenCalledWith({
            serverName,
            players: ['1'],
            playersWRoles: {
              Top: '1',
            },
            tournamentDetails: {
              tournamentName,
              tournamentDay,
            },
          });
          expect(clashUserTeamAssociationDbImpl.createUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.createUserAssociation)
            .toHaveBeenCalledWith({
              playerId: playerDetails.id,
              tournament: tournamentName,
              tournamentDay,
              serverName,
              teamName: persistedTeam.teamName,
              role: playerDetails.role,
            });
          expect(socketService.sendMessage).toHaveBeenCalledTimes(1);
          expect(socketService.sendMessage)
            .toHaveBeenCalledWith(expectedResponse.payload);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(['1']);
          expect(createdTeam).toEqual(expectedResponse);
        });
    });

    test('createNewTeam - (User is on another Team) - should be removed from other Team and then a new team created.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const playerDetails = {
        id: '1',
        role: 'Top',
      };
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
        4: createUserDetails({ key: '4' }),
      };
      const teamPostPayload = {
        playerDetails,
        serverName,
        tournamentName,
        tournamentDay,
      };
      const persistedTeam = {
        teamName: 'abra',
        details: `${tournamentName}#${tournamentDay}#abra`,
        serverName,
        tournamentName,
        tournamentDay,
        players: ['1'],
        playersWRoles: {
          Top: '1',
        },
      };
      const expectedResponse = {
        code: 200,
        payload: {
          name: 'abra',
          serverName,
          tournament: {
            tournamentName,
            tournamentDay,
          },
          playerDetails: {
            Top: {
              id: '1',
              name: idToPlayerMap['1'].playerName,
              champions: idToPlayerMap['1'].preferredChampions,
            },
          },
        },
      };
      const currentTeam = createV3Team({
        serverName,
        teamName: 'some-team',
        tournamentName,
        tournamentDay,
        playersWRoles: { Top: '1', Supp: '2' },
        players: ['1', '2'],
      });
      const expectedUpdateOfCurrentTeam = { ...currentTeam };
      expectedUpdateOfCurrentTeam.playersWRoles = { Supp: '2' };
      expectedUpdateOfCurrentTeam.players = ['2'];
      const expectedRemoveEvent = buildExpectedSingleTeamResponseWithUserMap(
        expectedUpdateOfCurrentTeam,
        idToPlayerMap,
      );
      clashTimeDbImpl.findTournament
        .mockResolvedValue([{ tournamentName: 'valid', tournamentDay: '1' }]);
      clashUserTeamAssociationDbImpl
        .getUserAssociation
        .mockResolvedValue([
          {
            playerId: '1',
            association: `${tournamentName}#${tournamentDay}#${serverName}#some-team`,
            serverName,
            role: 'Top',
            teamName: 'some-team',
          },
        ]);
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce([{ ...currentTeam }]);
      clashTeamsDbImpl.updateTeam
        .mockResolvedValue(expectedUpdateOfCurrentTeam);
      clashTeamsDbImpl.createTeam.mockResolvedValue(persistedTeam);
      clashUserTeamAssociationDbImpl.createUserAssociation.mockResolvedValue({
        playerId: '1',
        association: `${tournamentName}#${tournamentDay}#${serverName}#abra`,
        role: 'Top',
        teamName: 'abra',
      });
      socketService.sendMessage.mockResolvedValue(true);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockReturnValue(idToPlayerMap);
      return clashTeamsServiceImpl.createNewTeam({ body: teamPostPayload })
        .then((createdTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: '1',
              tournament: tournamentName,
              tournamentDay,
            });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter)
            .toHaveBeenCalledWith({
              serverName,
              tournamentName,
              tournamentDay,
              teamName: 'some-team',
            });
          expect(clashTeamsDbImpl.createTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.createTeam).toHaveBeenCalledWith({
            serverName,
            players: ['1'],
            playersWRoles: {
              Top: '1',
            },
            tournamentDetails: {
              tournamentName,
              tournamentDay,
            },
          });
          validateAssociationSwap(
            playerDetails.id,
            tournamentName,
            tournamentDay,
            serverName,
            currentTeam.teamName,
            persistedTeam.teamName,
            'Top',
          );
          expect(socketService.sendMessage).toHaveBeenCalledTimes(2);
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(1, expectedRemoveEvent.payload);
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(2, expectedResponse.payload);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledTimes(2);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenNthCalledWith(1, ['2']);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenNthCalledWith(2, ['1']);
          expect(createdTeam).toEqual(expectedResponse);
        });
    });

    test('createNewTeam - (User is on another Team by themselves) - should delete other Team and then a new team created.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const playerDetails = {
        id: '1',
        role: 'Top',
      };
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
        4: createUserDetails({ key: '4' }),
      };
      const teamPostPayload = {
        playerDetails,
        serverName,
        tournamentName,
        tournamentDay,
      };
      const persistedTeam = {
        teamName: 'abra',
        details: `${tournamentName}#${tournamentDay}#abra`,
        serverName,
        tournamentName,
        tournamentDay,
        players: ['1'],
        playersWRoles: {
          Top: '1',
        },
      };
      const expectedResponse = {
        code: 200,
        payload: {
          name: 'abra',
          serverName,
          tournament: {
            tournamentName,
            tournamentDay,
          },
          playerDetails: {
            Top: {
              id: '1',
              name: idToPlayerMap['1'].playerName,
              champions: idToPlayerMap['1'].preferredChampions,
            },
          },
        },
      };
      const currentTeam = createV3Team({
        serverName,
        teamName: 'some-team',
        tournamentName,
        tournamentDay,
        playersWRoles: { Top: '1' },
        players: ['1'],
      });
      const expectedUpdateOfCurrentTeam = { ...currentTeam };
      expectedUpdateOfCurrentTeam.playersWRoles = {};
      expectedUpdateOfCurrentTeam.players = [];
      const expectedRemoveEvent = buildExpectedSingleTeamResponseWithUserMap(
        expectedUpdateOfCurrentTeam,
        idToPlayerMap,
      );
      clashTimeDbImpl.findTournament
        .mockResolvedValue([{ tournamentName: 'valid', tournamentDay: '1' }]);
      clashUserTeamAssociationDbImpl
        .getUserAssociation
        .mockResolvedValue([
          {
            playerId: '1',
            association: `${tournamentName}#${tournamentDay}#${serverName}#some-team`,
            serverName,
            role: 'Top',
            teamName: 'some-team',
          },
        ]);
      clashTeamsDbImpl.retrieveTeamsByFilter
        .mockResolvedValueOnce([{ ...currentTeam }]);
      clashTeamsDbImpl.deleteTeam
        .mockResolvedValue(true);
      clashTeamsDbImpl.createTeam.mockResolvedValue(persistedTeam);
      socketService.sendMessage.mockResolvedValue(true);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockReturnValue(idToPlayerMap);
      return clashTeamsServiceImpl.createNewTeam({ body: teamPostPayload })
        .then((createdTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: '1',
              tournament: tournamentName,
              tournamentDay,
            });
          expect(clashTeamsDbImpl.retrieveTeamsByFilter)
            .toHaveBeenCalledWith({
              serverName,
              tournamentName,
              tournamentDay,
              teamName: 'some-team',
            });
          validateTeamDeletion(
            serverName, currentTeam, playerDetails.id, tournamentName, tournamentDay,
          );
          expect(clashTeamsDbImpl.createTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.createTeam).toHaveBeenCalledWith({
            serverName,
            players: ['1'],
            playersWRoles: {
              Top: '1',
            },
            tournamentDetails: {
              tournamentName,
              tournamentDay,
            },
          });
          expect(clashUserTeamAssociationDbImpl.createUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.createUserAssociation)
            .toHaveBeenCalledWith({
              playerId: playerDetails.id,
              tournament: tournamentName,
              tournamentDay,
              serverName,
              teamName: persistedTeam.teamName,
              role: playerDetails.role,
            });
          expect(socketService.sendMessage).toHaveBeenCalledTimes(2);
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(1, {
              name: expectedRemoveEvent.payload.name,
              serverName: expectedRemoveEvent.payload.serverName,
            });
          expect(socketService.sendMessage)
            .toHaveBeenNthCalledWith(2, expectedResponse.payload);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(['1']);
          expect(createdTeam).toEqual(expectedResponse);
        });
    });

    test('createNewTeam - (User is on Tentative Queue) - should be removed from Tentative Queue and then a new team created.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const playerDetails = {
        id: '1',
        role: 'Top',
      };
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
        4: createUserDetails({ key: '4' }),
      };
      const teamPostPayload = {
        playerDetails,
        serverName,
        tournamentName,
        tournamentDay,
      };
      const persistedTeam = {
        teamName: 'abra',
        details: `${tournamentName}#${tournamentDay}#abra`,
        serverName,
        tournamentName,
        tournamentDay,
        players: ['1'],
        playersWRoles: {
          Top: '1',
        },
      };
      const expectedResponse = {
        code: 200,
        payload: {
          name: 'abra',
          serverName,
          tournament: {
            tournamentName,
            tournamentDay,
          },
          playerDetails: {
            Top: {
              id: '1',
              name: idToPlayerMap['1'].playerName,
              champions: idToPlayerMap['1'].preferredChampions,
            },
          },
        },
      };
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([
        {
          playerId: '1',
          association: `${tournamentName}#${tournamentDay}#${serverName}#tentative`,
          serverName,
        },
      ]);
      tentativeService.removePlayerFromTentative
        .mockResolvedValue({
          code: 200,
          payload: {
            serverName,
            tournamentDetails: {
              tournamentName,
              tournamentDay,
            },
            tentativePlayers: [],
          },
        });
      clashTimeDbImpl.findTournament
        .mockResolvedValue([{ tournamentName: 'valid', tournamentDay: '1' }]);
      clashTeamsDbImpl.createTeam.mockResolvedValue(persistedTeam);
      socketService.sendMessage.mockResolvedValue(true);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockReturnValue(idToPlayerMap);
      return clashTeamsServiceImpl.createNewTeam({ body: teamPostPayload })
        .then((createdTeam) => {
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociationDbImpl.getUserAssociation)
            .toHaveBeenCalledWith({
              playerId: '1',
              tournament: tournamentName,
              tournamentDay,
            });
          validateTentativeRemoval(serverName, tournamentName, tournamentDay, playerDetails.id);
          expect(clashTeamsDbImpl.createTeam).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.createTeam).toHaveBeenCalledWith({
            serverName,
            players: ['1'],
            playersWRoles: {
              Top: '1',
            },
            tournamentDetails: {
              tournamentName,
              tournamentDay,
            },
          });
          expect(socketService.sendMessage).toHaveBeenCalledTimes(1);
          expect(socketService.sendMessage)
            .toHaveBeenCalledWith(expectedResponse.payload);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(['1']);
          expect(createdTeam).toEqual(expectedResponse);
        });
    });

    test('createNewTeam - If tournament is invalid and is not upcoming, it should return 400.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const playerDetails = {
        id: '1',
        role: 'Top',
      };
      const teamPostPayload = {
        playerDetails,
        serverName,
        tournamentName,
        tournamentDay,
      };
      const expectedResponse = {
        code: 400,
        error: 'Tournament given was not valid.',
      };
      clashUserTeamAssociationDbImpl.getUserAssociation.mockResolvedValue([]);
      clashTimeDbImpl.findTournament.mockResolvedValue([]);
      return clashTeamsServiceImpl.createNewTeam({ body: teamPostPayload })
        .then(() => expect(true).toBeFalsy())
        .catch((createdTeam) => {
          expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
          expect(clashTimeDbImpl.findTournament)
            .toHaveBeenCalledWith(tournamentName, tournamentDay);
          expect(clashTeamsDbImpl.createTeam).not.toHaveBeenCalled();
          expect(createdTeam).toEqual(expectedResponse);
        });
    });
  });
});
