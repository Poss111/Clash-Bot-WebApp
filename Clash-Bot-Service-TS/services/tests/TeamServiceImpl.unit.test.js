const clashTeamsServiceImpl = require('../TeamService');
const clashTeamsDbImpl = require('../../dao/ClashTeamsDbImpl');
const clashSubscriptionDbImpl = require('../../dao/ClashUserDbImpl');
const clashTimeDbImpl = require('../../dao/ClashTimeDbImpl');
const {
  deepCopy, buildExpectedTeamResponseWithUserMap, createUserDetails, createV3Team,
} = require('../../utils/tests/test-utility.utility.test');

jest.mock('../../dao/ClashTeamsDbImpl');
jest.mock('../../dao/ClashUserDbImpl');
jest.mock('../../dao/ClashTimeDbImpl');

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
      return clashTeamsServiceImpl.getTeam({ serverName })
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
      return clashTeamsServiceImpl.getTeam({ serverName, tournament: tournamentName })
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
        serverName,
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
        serverName,
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
      const expectedResponse = buildExpectedSingleTeamResponseWithUserMap(expectedUpdatedTeam,
        expectedUserMap);
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
        playerId: '1',
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
            error: `Role is already taken - '${teamPatchPayload}'.`,
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
      const removalPayload = {
        serverName: 'Goon Squad',
        playerId: expectedPlayerToRemove,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
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
      const response = buildExpectedSingleTeamResponseWithUserMap(updatedTeam, expectedUserMap);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(expectedUserMap);
      return clashTeamsServiceImpl.removePlayerFromTeam({ body: removalPayload })
        .then((teamWithRemoved) => {
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
      const removalPayload = {
        serverName: 'Goon Squad',
        playerId: expectedPlayerToRemove,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
      };
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
      return clashTeamsServiceImpl.removePlayerFromTeam({ body: removalPayload })
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
      const removalPayload = {
        serverName: expectedServerName,
        playerId: expectedPlayerToRemove,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
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
      clashTeamsDbImpl.updateTeam.mockRejectedValue(new Error('Failed'));
      return clashTeamsServiceImpl.removePlayerFromTeam({ body: removalPayload })
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
      const removalPayload = {
        serverName: 'Goon Squad',
        playerId: expectedPlayerToRemove,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
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
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockRejectedValue(new Error('Failed'));
      return clashTeamsServiceImpl.removePlayerFromTeam({ body: removalPayload })
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
      const removalPayload = {
        serverName: 'Goon Squad',
        playerId: expectedPlayerToRemove,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
      };
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
      return clashTeamsServiceImpl.removePlayerFromTeam({ body: removalPayload })
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
          expect(teamWithRemoved).toEqual({
            code: 200,
            payload: 'Team successfully deleted.',
          });
        });
    });

    test('removePlayerFromTeam - If the player is not on the team, return 400 as bad request.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const removalPayload = {
        serverName: 'Goon Squad',
        playerId: expectedPlayerToRemove,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
      };
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
      return clashTeamsServiceImpl.removePlayerFromTeam({ body: removalPayload })
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
            error: `Player does not exist on Team '${removalPayload}'.`,
          });
        });
    });

    test('removePlayerFromTeam - If no Team was found, return 400 as bad request.', () => {
      const expectedServerName = 'Goon Squad';
      const expectedPlayerToRemove = '1';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const teamName = 'Abra';
      const removalPayload = {
        serverName: 'Goon Squad',
        playerId: expectedPlayerToRemove,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
        teamName,
      };
      const retrieveTeams = [];
      clashTeamsDbImpl.retrieveTeamsByFilter.mockResolvedValue(retrieveTeams);
      return clashTeamsServiceImpl.removePlayerFromTeam({ body: removalPayload })
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
            error: `No Team found with criteria '${removalPayload}'.`,
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
      clashTimeDbImpl.findTournament.mockResolvedValue([{ tournamentName: 'valid', tournamentDay: '1' }]);
      clashTeamsDbImpl.createTeam.mockResolvedValue(persistedTeam);
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
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledWith(['1']);
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
