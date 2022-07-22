const dynamodb = require('dynamodb');
const streamTest = require('streamtest');
const each = require('jest-each').default;
const Joi = require('joi');
const clashTeamsDbImpl = require('../clash-teams-db-impl');
const dynamoDbHelper = require('../impl/dynamo-db-helper');
const randomNames = require('../../utils/random-names');
const { deepCopy } = require('../../utils/tests/test-utility.utility.test');
const { retrieveName } = require('../../utils/naming-utils');
const { buildMessage } = require('../../utils/template-builder');

jest.mock('dynamodb');
jest.mock('../impl/dynamo-db-helper');
jest.mock('../../utils/naming-utils');

function buildMockReturnForRegister(streamData, teamToBeReturned, add, update, del) {
  const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([streamData]));
  clashTeamsDbImpl.Team = jest.fn();
  clashTeamsDbImpl.Team.exec = mockStream;
  clashTeamsDbImpl.Team.scan = jest.fn().mockReturnThis();
  clashTeamsDbImpl.Team.filterExpression = jest.fn().mockReturnThis();
  clashTeamsDbImpl.Team.expressionAttributeValues = jest.fn().mockReturnThis();
  clashTeamsDbImpl.Team.expressionAttributeNames = jest.fn().mockReturnThis();
  if (teamToBeReturned) {
    clashTeamsDbImpl.Team.update = jest.fn();
    if (add) {
      clashTeamsDbImpl.Team.update.mockImplementationOnce((team, callback) => {
        callback(undefined, {
          attrs: teamToBeReturned,
        });
      });
    }
    if (update) {
      clashTeamsDbImpl.Team.update.mockImplementationOnce((key, params, callback) => {
        if (callback) {
          callback(undefined, {
            attrs: teamToBeReturned,
          });
        }
      });
    }
    if (del) {
      clashTeamsDbImpl.Team.update.mockImplementationOnce((key, params, callback) => {
        if (callback) {
          callback(undefined, {
            attrs: teamToBeReturned,
          });
        }
      });
    }
    dynamodb.Set = jest.fn().mockImplementation(([players]) => [players]);
  }
}

function buildMockTeamV2(serverName, players, roleToPlayerMap, tournament, teamName) {
  return {
    key: clashTeamsDbImpl.getKey(teamName, serverName, tournament.tournamentName, tournament.tournamentDay),
    version: 2,
    teamName,
    serverName,
    players,
    playersWRoles: roleToPlayerMap,
    startTime: tournament.startTime,
    tournamentName: tournament.tournamentName,
    tournamentDay: tournament.tournamentDay,
  };
}

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe('Initialize Table connection', () => {
  test('Initialize the table connection to be used.', async () => {
    const expectedTableObject = { setupTable: true };
    dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableObject);
    const expectedTableDef = {
      hashKey: 'key',
      timestamps: true,
      schema: {
        key: Joi.string(),
        version: Joi.number(),
        teamName: Joi.string(),
        serverName: Joi.string(),
        players: dynamodb.types.stringSet(),
        playersWRoles: expect.anything(),
        tournamentName: Joi.string(),
        tournamentDay: Joi.string(),
        startTime: Joi.string(),
      },
    };
    return clashTeamsDbImpl.initialize().then(() => {
      expect(clashTeamsDbImpl.Team).toEqual(expectedTableObject);
      expect(dynamoDbHelper.initialize).toBeCalledWith(clashTeamsDbImpl.tableName,
        expectedTableDef);
    });
  });

  test('Error should be handled if it occurs during table initialization', async () => {
    const expectedError = new Error('Failed to compile table def');
    dynamoDbHelper.initialize = jest.fn().mockRejectedValue(expectedError);
    return clashTeamsDbImpl.initialize('Sample Table', {}).catch((err) => expect(err).toEqual(expectedError));
  });
});

describe('Add Player with Role to Team - v2', () => {
  test('When I add player, they should be added to the Team with the requested Role.', () => {
    const expectedServerName = 'Goon Squad';
    const originalPlayers = ['1'];
    const originalRoleToPlayerMap = {
      Top: '1',
    };
    const expectedPlayers = ['1', '2'];
    const expectedRoleToPlayerMap = {
      Top: '1',
      Mid: '2',
    };
    const expectedTeamName = 'Team Sample';
    const expectedTournament = createMockListOfTournaments(1)[0];
    const originalMockTeam = buildMockTeamV2(expectedServerName, originalPlayers, originalRoleToPlayerMap, expectedTournament, expectedTeamName);
    const expectedMockTeam = buildMockTeamV2(expectedServerName, expectedPlayers, expectedRoleToPlayerMap, expectedTournament, expectedTeamName);

    clashTeamsDbImpl.Team = {
      update: jest.fn().mockImplementation((key, params, callback) => callback(null, expectedMockTeam)),
    };
    const expectedParams = {
      UpdateExpression: 'ADD players :playerName SET playersWRoles = :updatedRole',
      ExpressionAttributeValues: {
        ':playerName': dynamodb.Set(['2'], 'S'),
        ':updatedRole': expectedRoleToPlayerMap,
      },
    };
    let updatedTeam = {};
    const callback = (err, record) => {
      updatedTeam = record;
      console.log(record);
    };

    clashTeamsDbImpl.addUserToTeamV2('2', 'Mid', originalMockTeam, callback);

    expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(1);
    expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith({ key: expectedMockTeam.key },
      expectedParams, expect.any(Function));
    expect(updatedTeam).toEqual(expectedMockTeam);
  });
});

describe('Retrieve Teams', () => {
  test('I should retrieve all teams for a server when getTeams is called with a single team.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          version: 1,
          teamName: 'Sample Team',
          serverName: 'Sample Server',
          players: ['Player1', 'Player2'],
          playersWRoles: {
            Top: 'Player1',
            Jg: 'Player2',
          },
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
      },
      ],
    };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };

    return clashTeamsDbImpl.getTeams('Sample Server').then((data) => {
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                + 'AND attribute_not_exists(version)');
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({ ':name': 'Sample Server' });
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({ '#serverName': 'serverName' });
      expect(data).toEqual([value.Items[0].attrs]);
    });
  });

  test('I should retrieve all teams for a server when getTeams is called with multiple teams.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          version: 2,
          teamName: 'Sample Team',
          serverName: 'Sample Server',
          players: ['Player1', 'Player2'],
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
      },
      {
        attrs: {
          key: 'Sample Team2#Sample Server',
          version: 2,
          teamName: 'Sample Team2',
          serverName: 'Sample Server',
          players: ['Player3', 'Player4'],
          playersWRoles: {
            Top: 'Player3',
            Bot: 'Player4',
          },
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
      },
      ],
    };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };

    return clashTeamsDbImpl.getTeams('Sample Server').then((data) => {
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                + 'AND attribute_not_exists(version)');
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({ ':name': 'Sample Server' });
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({ '#serverName': 'serverName' });
      expect(data).toEqual([value.Items[0].attrs, value.Items[1].attrs]);
    });
  });
});

describe('Retrieve Teams - v2', () => {
  test('I should retrieve all teams for a server when getTeams is called with a single team that are from version 2.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          version: 1,
          teamName: 'Sample Team',
          serverName: 'Sample Server',
          players: ['Player1', 'Player2'],
          playersWRoles: {
            Top: 'Player1',
            Jg: 'Player2',
          },
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
      },
      ],
    };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };

    return clashTeamsDbImpl.getTeamsV2('Sample Server').then((data) => {
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name AND #version = :versionNumber');
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({
        ':name': 'Sample Server',
        ':versionNumber': 2,
      });
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({
        '#serverName': 'serverName',
        '#version': 'version',
      });
      expect(data).toEqual([value.Items[0].attrs]);
    });
  });

  test('I should retrieve all teams for a server when getTeams is called with multiple teams.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          version: 2,
          teamName: 'Sample Team',
          serverName: 'Sample Server',
          players: ['Player1', 'Player2'],
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
      },
      {
        attrs: {
          key: 'Sample Team2#Sample Server',
          version: 2,
          teamName: 'Sample Team2',
          serverName: 'Sample Server',
          players: ['Player3', 'Player4'],
          playersWRoles: {
            Top: 'Player3',
            Bot: 'Player4',
          },
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
      },
      ],
    };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };

    return clashTeamsDbImpl.getTeamsV2('Sample Server').then((data) => {
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name AND #version = :versionNumber');
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({
        ':name': 'Sample Server',
        ':versionNumber': 2,
      });
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({
        '#serverName': 'serverName',
        '#version': 'version',
      });
      expect(data).toEqual([value.Items[0].attrs, value.Items[1].attrs]);
    });
  });
});

describe('Retrieve Teams - v3', () => {
  test('retrieveTeamsByFilter - should be able to filter by nothing to retrieve all.', () => {
    const serverName = 'Goon Squad';
    const tournamentName = 'awesome_sauce';
    const tournamentDay = '1';
    const teamName = 'Pikachu';
    const teamToBeRetrieved = {
      key: ':serverName#:tournamentName#:tournamentDay#:teamName',
      teamName: ':teamName',
      serverName: ':serverName',
      players: [
        '1',
        '2',
        '3',
      ],
      playersWRoles: {
        Top: '1',
        Jg: Joi.string(),
        Mid: '2',
        Bot: Joi.string(),
        Supp: '3',
      },
      tournamentName: ':tournamentName',
      tournamentDay: ':tournamentDay',
    };
    const builtTeamToBeRetrieved = buildMessage(teamToBeRetrieved, {
      serverName,
      tournamentName,
      tournamentDay,
      teamName,
    });
    const value = { Items: [{ attrs: builtTeamToBeRetrieved }] };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      query: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      beginsWith: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };
    return clashTeamsDbImpl.retrieveTeamsByFilter({ serverName })
      .then((teams) => {
        expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledWith(serverName);
        expect(clashTeamsDbImpl.Team.where).not.toHaveBeenCalled();
        expect(clashTeamsDbImpl.Team.beginsWith).not.toHaveBeenCalled();
        expect(teams).toEqual([builtTeamToBeRetrieved]);
      });
  });

  test('retrieveTeamsByFilter - should be able to filter by serverName and tournamentName to retrieve all.', () => {
    const serverName = 'Goon Squad';
    const tournamentName = 'awesome_sauce';
    const tournamentDay = '1';
    const teamName = 'Pikachu';
    const teamToBeRetrieved = {
      key: ':serverName#:tournamentName#:tournamentDay#:teamName',
      teamName: ':teamName',
      serverName: ':serverName',
      players: [
        '1',
        '2',
        '3',
      ],
      playersWRoles: {
        Top: '1',
        Jg: Joi.string(),
        Mid: '2',
        Bot: Joi.string(),
        Supp: '3',
      },
      tournamentName: ':tournamentName',
      tournamentDay: ':tournamentDay',
    };
    const builtTeamToBeRetrieved = buildMessage(teamToBeRetrieved, {
      serverName,
      tournamentName,
      tournamentDay,
      teamName,
    });
    const value = { Items: [{ attrs: builtTeamToBeRetrieved }] };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      query: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      beginsWith: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };
    return clashTeamsDbImpl.retrieveTeamsByFilter({ serverName, tournamentName })
      .then((teams) => {
        expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledWith(serverName);
        expect(clashTeamsDbImpl.Team.where).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.where).toHaveBeenCalledWith('details');
        expect(clashTeamsDbImpl.Team.beginsWith).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.beginsWith).toHaveBeenCalledWith(tournamentName + '#');
        expect(teams).toEqual([builtTeamToBeRetrieved]);
      });
  });

  test('retrieveTeamsByFilter - should be able to filter by serverName, tournamentName, and tournamentDay to retrieve all.', () => {
    const serverName = 'Goon Squad';
    const tournamentName = 'awesome_sauce';
    const tournamentDay = '1';
    const teamName = 'Pikachu';
    const teamToBeRetrieved = {
      key: ':serverName#:tournamentName#:tournamentDay#:teamName',
      teamName: ':teamName',
      serverName: ':serverName',
      players: [
        '1',
        '2',
        '3',
      ],
      playersWRoles: {
        Top: '1',
        Jg: Joi.string(),
        Mid: '2',
        Bot: Joi.string(),
        Supp: '3',
      },
      tournamentName: ':tournamentName',
      tournamentDay: ':tournamentDay',
    };
    const builtTeamToBeRetrieved = buildMessage(teamToBeRetrieved, {
      serverName,
      tournamentName,
      tournamentDay,
      teamName,
    });
    const value = { Items: [{ attrs: builtTeamToBeRetrieved }] };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      query: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      beginsWith: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };
    return clashTeamsDbImpl.retrieveTeamsByFilter({ serverName, tournamentName, tournamentDay })
      .then((teams) => {
        expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledWith(serverName);
        expect(clashTeamsDbImpl.Team.where).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.where).toHaveBeenCalledWith('details');
        expect(clashTeamsDbImpl.Team.beginsWith).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.beginsWith).toHaveBeenCalledWith(`${tournamentName}#${tournamentDay}`);
        expect(teams).toEqual([builtTeamToBeRetrieved]);
      });
  });

  test('retrieveTeamsByFilter - should be able to filter by serverName, tournamentName, tournamentDay, and teamName to retrieve all.', () => {
    const serverName = 'Goon Squad';
    const tournamentName = 'awesome_sauce';
    const tournamentDay = '1';
    const teamName = 'Pikachu';
    const teamToBeRetrieved = {
      key: ':serverName#:tournamentName#:tournamentDay#:teamName',
      teamName: ':teamName',
      serverName: ':serverName',
      players: [
        '1',
        '2',
        '3',
      ],
      playersWRoles: {
        Top: '1',
        Jg: Joi.string(),
        Mid: '2',
        Bot: Joi.string(),
        Supp: '3',
      },
      tournamentName: ':tournamentName',
      tournamentDay: ':tournamentDay',
    };
    const builtTeamToBeRetrieved = buildMessage(teamToBeRetrieved, {
      serverName,
      tournamentName,
      tournamentDay,
      teamName,
    });
    const value = { Items: [{ attrs: builtTeamToBeRetrieved }] };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      query: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      beginsWith: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };
    return clashTeamsDbImpl.retrieveTeamsByFilter({ serverName, tournamentName, tournamentDay, teamName })
      .then((teams) => {
        expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledWith(serverName);
        expect(clashTeamsDbImpl.Team.where).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.where).toHaveBeenCalledWith('details');
        expect(clashTeamsDbImpl.Team.beginsWith).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.beginsWith).toHaveBeenCalledWith(`${tournamentName}#${tournamentDay}#${teamName}`);
        expect(teams).toEqual([builtTeamToBeRetrieved]);
      });
  });
});

describe('Get Teams by version', () => {
  test('Should retrieve team with attribute_not_exist(version) when no version is passed.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          version: 1,
          teamName: 'Sample Team',
          serverName: 'Sample Server',
          players: ['Player1', 'Player2'],
          playersWRoles: {
            Top: 'Player1',
            Jg: 'Player2',
          },
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
      },
      ],
    };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };

    return clashTeamsDbImpl.getTeamsByVersion('Sample Server').then((data) => {
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                + 'AND attribute_not_exists(version)');
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({ ':name': 'Sample Server' });
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({ '#serverName': 'serverName' });
      expect(data).toEqual([value.Items[0].attrs]);
    });
  });

  test('Should retrieve team with AND #version = ${version} when a version is passed.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          version: 1,
          teamName: 'Sample Team',
          serverName: 'Sample Server',
          players: ['Player1', 'Player2'],
          playersWRoles: {
            Top: 'Player1',
            Jg: 'Player2',
          },
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
      },
      ],
    };
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
    };

    return clashTeamsDbImpl.getTeamsByVersion('Sample Server', 2).then((data) => {
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name AND #version = :versionNumber');
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({
        ':name': 'Sample Server',
        ':versionNumber': 2,
      });
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({
        '#serverName': 'serverName',
        '#version': 'version',
      });
      expect(data).toEqual([value.Items[0].attrs]);
    });
  });
});

describe('Filter Retrieved Teams', () => {
  describe('Filter Retrieved Teams', () => {
    test('Single Tournament - When I request Teams, I should map the Teams per Tournament and separate '
            + 'Teams that the requesting player is on for a user with a version 1 team.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const mockListOfTournaments = createMockListOfTournaments(2);

      const mockTeams = [
        {
          key: clashTeamsDbImpl.getKey('Team Abra', expectedServer, mockListOfTournaments[0]
            .tournamentName, mockListOfTournaments[0].tournamentDay),
          version: 1,
          teamName: 'Team Abra',
          serverName: expectedServer,
          players: [expectedPlayerId],
          tournamentName: mockListOfTournaments[0].tournamentName,
          tournamentDay: mockListOfTournaments[0].tournamentDay,
        },
        {
          key: clashTeamsDbImpl.getKey('Team Charizard', expectedServer, mockListOfTournaments[0]
            .tournamentName, mockListOfTournaments[0].tournamentDay),
          version: 1,
          teamName: 'Team Charizard',
          serverName: expectedServer,
          players: ['2'],
          tournamentName: mockListOfTournaments[0].tournamentName,
          tournamentDay: mockListOfTournaments[0].tournamentDay,
        },
      ];

      const expectedMap = {};
      expectedMap[`${mockListOfTournaments[0].tournamentName}#${mockListOfTournaments[0].tournamentDay}`] = {
        userTeam: mockTeams[0],
        availableTeams: [mockTeams[1]],
      };

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
        Items: mockTeams.map((record) => ({ attrs: record })),
      }]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };
      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayer(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND attribute_not_exists(version)');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({ ':name': expectedServer });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({ '#serverName': 'serverName' });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });

    test('Single Tournament - When I request Teams, I should map the Teams per Tournament and separate Teams '
            + 'that the requesting player is on for a user with a version 1 team.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const mockListOfTournaments = createMockListOfTournaments(2);

      const mockTeams = [
        {
          key: clashTeamsDbImpl.getKey('Team Abra', expectedServer, mockListOfTournaments[0].tournamentName, mockListOfTournaments[0].tournamentDay),
          version: 1,
          teamName: 'Team Abra',
          serverName: expectedServer,
          players: ['2'],
          tournamentName: mockListOfTournaments[0].tournamentName,
          tournamentDay: mockListOfTournaments[0].tournamentDay,
        },
        {
          key: clashTeamsDbImpl.getKey('Team Charizard', expectedServer, mockListOfTournaments[0].tournamentName, mockListOfTournaments[0].tournamentDay),
          version: 1,
          teamName: 'Team Charizard',
          serverName: expectedServer,
          players: [expectedPlayerId],
          tournamentName: mockListOfTournaments[0].tournamentName,
          tournamentDay: mockListOfTournaments[0].tournamentDay,
        },
      ];

      const expectedMap = {};
      expectedMap[`${mockListOfTournaments[0].tournamentName}#${mockListOfTournaments[0].tournamentDay}`] = {
        userTeam: mockTeams[1],
        availableTeams: [mockTeams[0]],
      };

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
        Items: mockTeams.map((record) => ({ attrs: record })),
      }]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };

      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayer(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND attribute_not_exists(version)');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({ ':name': expectedServer });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({ '#serverName': 'serverName' });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });

    test('Multiple Tournament - When I request Teams, I should map the Teams per Tournament and separate Teams that '
            + 'the requesting player is on for a user with a version 1 teams.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const mockListOfTournaments = createMockListOfTournaments(2);

      const mockTeams = [
        {
          key: clashTeamsDbImpl.getKey('Team Abra',
            expectedServer, mockListOfTournaments[0].tournamentName, mockListOfTournaments[0].tournamentDay),
          version: 1,
          teamName: 'Team Abra',
          serverName: expectedServer,
          players: ['2'],
          tournamentName: mockListOfTournaments[0].tournamentName,
          tournamentDay: mockListOfTournaments[0].tournamentDay,
        },
        {
          key: clashTeamsDbImpl.getKey('Team Charizard',
            expectedServer, mockListOfTournaments[0].tournamentName, mockListOfTournaments[0].tournamentDay),
          version: 1,
          teamName: 'Team Charizard',
          serverName: expectedServer,
          players: [expectedPlayerId],
          tournamentName: mockListOfTournaments[0].tournamentName,
          tournamentDay: mockListOfTournaments[0].tournamentDay,
        },
        {
          key: clashTeamsDbImpl.getKey('Team Abamasnow',
            expectedServer, mockListOfTournaments[1].tournamentName, mockListOfTournaments[1].tournamentDay),
          version: 2,
          teamName: 'Team Abamasnow',
          serverName: expectedServer,
          players: [expectedPlayerId],
          tournamentName: mockListOfTournaments[1].tournamentName,
          tournamentDay: mockListOfTournaments[1].tournamentDay,
        },
        {
          key: clashTeamsDbImpl.getKey('Team Pikachu',
            expectedServer, mockListOfTournaments[1].tournamentName, mockListOfTournaments[1].tournamentDay),
          version: 1,
          teamName: 'Team Pikachu',
          serverName: expectedServer,
          players: ['2'],
          tournamentName: mockListOfTournaments[1].tournamentName,
          tournamentDay: mockListOfTournaments[1].tournamentDay,
        },
      ];

      const expectedMap = {};
      expectedMap[`${mockListOfTournaments[0].tournamentName}#${mockListOfTournaments[0].tournamentDay}`] = { userTeam: mockTeams[1], availableTeams: [mockTeams[0]] };
      expectedMap[`${mockListOfTournaments[1].tournamentName}#${mockListOfTournaments[1].tournamentDay}`] = { userTeam: mockTeams[2], availableTeams: [mockTeams[3]] };

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
        Items: mockTeams.map((record) => ({ attrs: record })),
      }]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };

      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayer(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND attribute_not_exists(version)');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({ ':name': expectedServer });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({ '#serverName': 'serverName' });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });

    test('No Tournaments - When I request Teams, I should map the Teams per Tournament '
            + 'and separate Teams that the requesting player is on for a user with a version 1 teams.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const expectedMap = {};

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };
      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayer(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND attribute_not_exists(version)');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({ ':name': expectedServer });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({ '#serverName': 'serverName' });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });

    test('Multiple Tournament - User does not belong - When I request Teams, I should map the '
            + 'Teams per Tournament and separate Teams that the requesting player is on for a user '
            + 'with a version 1 teams.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const mockListOfTournaments = createMockListOfTournaments(2);

      const mockTeams = [
        {
          key: clashTeamsDbImpl.getKey('Team Abra', expectedServer, mockListOfTournaments[0].tournamentName, mockListOfTournaments[0].tournamentDay),
          version: 2,
          teamName: 'Team Abra',
          serverName: expectedServer,
          playersWRoles: {
            Top: '2',
          },
          tournamentName: mockListOfTournaments[0].tournamentName,
          tournamentDay: mockListOfTournaments[0].tournamentDay,
        },
        {
          key: clashTeamsDbImpl.getKey('Team Charizard', expectedServer, mockListOfTournaments[0].tournamentName, mockListOfTournaments[0].tournamentDay),
          version: 1,
          teamName: 'Team Charizard',
          serverName: expectedServer,
          players: [expectedPlayerId],
          tournamentName: mockListOfTournaments[0].tournamentName,
          tournamentDay: mockListOfTournaments[0].tournamentDay,
        },
        {
          key: clashTeamsDbImpl.getKey('Team Pikachu', expectedServer, mockListOfTournaments[1].tournamentName, mockListOfTournaments[1].tournamentDay),
          version: 1,
          teamName: 'Team Pikachu',
          serverName: expectedServer,
          players: ['2'],
          tournamentName: mockListOfTournaments[1].tournamentName,
          tournamentDay: mockListOfTournaments[1].tournamentDay,
        },
      ];

      const expectedMap = {};
      expectedMap[`${mockListOfTournaments[0].tournamentName}#${mockListOfTournaments[0].tournamentDay}`] = { userTeam: mockTeams[1], availableTeams: [mockTeams[0]] };
      expectedMap[`${mockListOfTournaments[1].tournamentName}#${mockListOfTournaments[1].tournamentDay}`] = { userTeam: {}, availableTeams: [mockTeams[2]] };

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
        Items: mockTeams.map((record) => ({ attrs: record })),
      }]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };

      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayer(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND attribute_not_exists(version)');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({ ':name': expectedServer });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({ '#serverName': 'serverName' });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });
  });

  describe('Filter Retrieved Teams - v2', () => {
    test('Single Tournament - When I request Teams, I should map the Teams per Tournament and separate '
            + 'Teams that the requesting player is on for a user with a version 2 team.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const mockListOfTournaments = createMockListOfTournaments(2);

      const mockTeams = [
        buildMockTeamV2(expectedServer, [expectedPlayerId],
          { Top: expectedPlayerId }, mockListOfTournaments[0], 'Team Abra'),
        buildMockTeamV2(expectedServer, ['2'],
          { Top: '2' }, mockListOfTournaments[0], 'Team Charizard'),
      ];

      const expectedMap = {};
      expectedMap[`${mockListOfTournaments[0].tournamentName}#${mockListOfTournaments[0].tournamentDay}`] = {
        userTeam: mockTeams[0],
        availableTeams: [mockTeams[1]],
      };

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
        Items: mockTeams.map((record) => ({ attrs: record })),
      }]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };
      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayerV2(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND #version = :versionNumber');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({
          ':name': expectedServer,
          ':versionNumber': 2,
        });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({
          '#serverName': 'serverName',
          '#version': 'version',
        });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });

    test('Single Tournament - When I request Teams, I should map the Teams per Tournament and separate Teams '
            + 'that the requesting player is on for a user with a version 2 team.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const mockListOfTournaments = createMockListOfTournaments(2);

      const mockTeams = [
        buildMockTeamV2(expectedServer, ['2'],
          { Top: '2' }, mockListOfTournaments[0], 'Team Charizard'),
        buildMockTeamV2(expectedServer, [expectedPlayerId],
          { Top: expectedPlayerId }, mockListOfTournaments[0], 'Team Abra'),
      ];

      const expectedMap = {};
      expectedMap[`${mockListOfTournaments[0].tournamentName}#${mockListOfTournaments[0].tournamentDay}`] = {
        userTeam: mockTeams[1],
        availableTeams: [mockTeams[0]],
      };

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
        Items: mockTeams.map((record) => ({ attrs: record })),
      }]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };

      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayerV2(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND #version = :versionNumber');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({
          ':name': expectedServer,
          ':versionNumber': 2,
        });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({
          '#serverName': 'serverName',
          '#version': 'version',
        });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });

    test('Multiple Tournament - When I request Teams, I should map the Teams per Tournament and separate Teams that '
            + 'the requesting player is on for a user with a version 2 teams.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const mockListOfTournaments = createMockListOfTournaments(2);

      const mockTeams = [
        buildMockTeamV2(expectedServer, ['2'],
          { Top: '2' }, mockListOfTournaments[0], 'Team Abra'),
        buildMockTeamV2(expectedServer, [expectedPlayerId],
          { Top: expectedPlayerId }, mockListOfTournaments[0], 'Team Charizard'),
        buildMockTeamV2(expectedServer, [expectedPlayerId],
          { Top: expectedPlayerId }, mockListOfTournaments[1], 'Team Abamasnow'),
        buildMockTeamV2(expectedServer, ['2'],
          { Top: '2' }, mockListOfTournaments[1], 'Team Pikachu'),
      ];

      const expectedMap = {};
      expectedMap[`${mockListOfTournaments[0].tournamentName}#${mockListOfTournaments[0].tournamentDay}`] = { userTeam: mockTeams[1], availableTeams: [mockTeams[0]] };
      expectedMap[`${mockListOfTournaments[1].tournamentName}#${mockListOfTournaments[1].tournamentDay}`] = { userTeam: mockTeams[2], availableTeams: [mockTeams[3]] };

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
        Items: mockTeams.map((record) => ({ attrs: record })),
      }]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };

      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayerV2(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND #version = :versionNumber');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({
          ':name': expectedServer,
          ':versionNumber': 2,
        });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({
          '#serverName': 'serverName',
          '#version': 'version',
        });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });

    test('No Tournaments - When I request Teams, I should map the Teams per Tournament '
            + 'and separate Teams that the requesting player is on for a user with a version 2 teams.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const expectedMap = {};

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };
      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayerV2(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND #version = :versionNumber');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({
          ':name': expectedServer,
          ':versionNumber': 2,
        });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({
          '#serverName': 'serverName',
          '#version': 'version',
        });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });

    test('Multiple Tournament - User does not belong - When I request Teams, I should '
            + 'map the Teams per Tournament and separate Teams that the requesting player is on for a '
            + 'user with a version 2 teams.', () => {
      const expectedServer = 'Goon Squad';
      const expectedPlayerId = '1';

      const mockListOfTournaments = createMockListOfTournaments(2);

      const mockTeams = [
        buildMockTeamV2(expectedServer, ['2'],
          { Top: '2' }, mockListOfTournaments[0], 'Team Abra'),
        buildMockTeamV2(expectedServer, [expectedPlayerId],
          { Top: expectedPlayerId }, mockListOfTournaments[0], 'Team Charizard'),
        buildMockTeamV2(expectedServer, ['2'],
          { Top: '2' }, mockListOfTournaments[1], 'Team Pikachu'),
      ];

      const expectedMap = {};
      expectedMap[`${mockListOfTournaments[0].tournamentName}#${mockListOfTournaments[0].tournamentDay}`] = { userTeam: mockTeams[1], availableTeams: [mockTeams[0]] };
      expectedMap[`${mockListOfTournaments[1].tournamentName}#${mockListOfTournaments[1].tournamentDay}`] = { userTeam: {}, availableTeams: [mockTeams[2]] };

      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
        Items: mockTeams.map((record) => ({ attrs: record })),
      }]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };

      return clashTeamsDbImpl.mapTeamsToTournamentsByPlayerV2(expectedPlayerId, expectedServer).then((teamsByTournaments) => {
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.filterExpression).toHaveBeenCalledWith('#serverName = :name '
                    + 'AND #version = :versionNumber');
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeValues).toHaveBeenCalledWith({
          ':name': expectedServer,
          ':versionNumber': 2,
        });
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.expressionAttributeNames).toHaveBeenCalledWith({
          '#serverName': 'serverName',
          '#version': 'version',
        });
        expect(teamsByTournaments).toEqual(expectedMap);
      });
    });
  });
});

function buildExpectedTeamV2(expectedTeamName, expectedUserServerName,
  expectedUserTournaments, expectedVersion, expectedUserId) {
  return {
    key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName,
      expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
    version: expectedVersion,
    teamName: expectedTeamName,
    serverName: expectedUserServerName,
    playersWRoles: {
      Top: expectedUserId,
    },
    players: [expectedUserId],
    tournamentName: expectedUserTournaments[0].tournamentName,
    tournamentDay: expectedUserTournaments[0].tournamentDay,
    startTime: expectedUserTournaments[0].startTime,
  };
}

describe('Register Player', () => {
  describe('Register Player', () => {
    test('I should return an error with getTeams if I receive an error from the stream.', () => {
      const value = {
        error: 'Failed to retrieve.',
      };
      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromErroredObjects([value]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };

      return clashTeamsDbImpl.getTeams('Sample Server').then(() => {
      })
        .catch((err) => expect(err).toEqual([value]));
    });

    test('I should register a player and create a new Team if another tournament to register is available '
            + 'and they exist by themselves on a team for the first tournament.', () => {
      const expectedPlayerName = 'Player2';
      const value = {
        Items: [{
          attrs: {
            key: 'Sample Team#Sample Server',
            teamName: 'Team Sample',
            serverName: 'Sample Server',
            players: [expectedPlayerName],
            tournamentName: 'msi2021',
            tournamentDay: 'day_2',
          },
        },
        ],
      };
      const expectedPlayers = [];
      expectedPlayers.push(expectedPlayerName);
      const mockTeam = {
        key: 'Sample Team#Sample Server',
        teamName: 'Team Sample',
        serverName: 'Sample Server',
        players: expectedPlayers,
      };
      buildMockReturnForRegister(value, mockTeam, true);

      const foundTeam = value.Items[0].attrs;
      retrieveName.mockReturnValue('Absol');
      const key = clashTeamsDbImpl.getKey('Team Absol', foundTeam.serverName, 'msi2021', 'day_3');
      const expectedCreatedTeam = {
        key,
        teamName: 'Team Absol',
        serverName: 'Sample Server',
        players: expectedPlayers,
        tournamentName: 'msi2021',
        tournamentDay: 'day_3',
      };
      const tournament = [
        {
          tournamentName: 'msi2021',
          tournamentDay: 'day_2',
        },
        {
          tournamentName: 'msi2021',
          tournamentDay: 'day_3',
        },
      ];
      return clashTeamsDbImpl.registerPlayer(expectedPlayerName, 'Sample Server', tournament).then((result) => {
        expect(result).toBeTruthy();
        expect(result.teamName).toEqual(mockTeam.teamName);
        expect(result.players.length).toEqual(1);
        expect(result.players).toContain(expectedPlayerName);
        expect(clashTeamsDbImpl.Team.update.mock.calls.length).toEqual(1);
        expect(clashTeamsDbImpl.Team.update).toBeCalledWith(expectedCreatedTeam, expect.any(Function));
      });
    });

    test('I should not register a player that already exists in a team', () => {
      const expectedPlayer = 'Player1';
      const value = {
        Items: [{
          attrs: {
            key: 'Sample Team#Sample Server',
            teamName: 'Team Sample',
            serverName: 'Sample Server',
            players: [expectedPlayer],
            tournamentName: 'msi2021',
            tournamentDay: 'day_3',
          },
        },
        ],
      };
      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team.update = jest.fn();
      clashTeamsDbImpl.Team = {
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };

      const tournament = [{ tournamentName: 'msi2021', tournamentDay: 'day_3' }];
      return clashTeamsDbImpl.registerPlayer(expectedPlayer, 'Sample Server', tournament).then((result) => {
        expect(result).toBeTruthy();
        expect(result[0].exist).toBeTruthy();
        expect(result[0].teamName).toEqual(value.Items[0].attrs.teamName);
        expect(result[0].players).toEqual([expectedPlayer]);
      });
    });

    test('I should register a player into the team if the players property is undefined', () => {
      const value = {
        Items: [
          {
            attrs: {
              key: 'Sample Team#Sample Server#msi2021#day_3',
              teamName: 'Team Sample',
              serverName: 'Sample Server',
              tournamentName: 'msi2021',
              tournamentDay: 'day_3',
            },
          },
        ],
      };
      const expectedPlayers = [];
      expectedPlayers.push('Player2');
      const mockTeam = {
        key: 'Team Sample#Sample Server#msi2021#day_3',
        teamName: 'Team Sample',
        serverName: 'Sample Server',
        tournamentName: 'msi2021',
        tournamentDay: 'day_3',
        players: expectedPlayers,
      };
      buildMockReturnForRegister(value, mockTeam, false, true);

      const tournament = [{ tournamentName: 'msi2021', tournamentDay: 'day_3' }];
      return clashTeamsDbImpl.registerPlayer('Player2', 'Sample Server', tournament).then((result) => {
        expect(result).toBeTruthy();
        expect(result.teamName).toEqual(value.Items[0].attrs.teamName);
        expect(result.players.length).toEqual(1);
        expect(result.players).toContain('Player2');
        expect(clashTeamsDbImpl.Team.update.mock.calls).toEqual([
          [
            { key: mockTeam.key },
            {
              ExpressionAttributeValues: {
                ':playerName': ['Player2'],
              },
              UpdateExpression: 'ADD players :playerName',
            }, expect.any(Function),
          ],
        ]);
      });
    });

    test('I should register a player and create a new Team if no teams exist.', () => {
      const value = {
        Items: [],
      };
      const expectedPlayer = 'Player1';
      const mockTeam = {
        key: 'Sample Team#Sample Server',
        teamName: 'Team Sample',
        serverName: 'Sample Server',
        players: [expectedPlayer],
      };
      buildMockReturnForRegister(value, mockTeam, true);

      const tournament = [{ tournamentName: 'msi2021', tournamentDay: 'day_3' }];
      return clashTeamsDbImpl.registerPlayer('Player1', 'Sample Server', tournament).then((result) => {
        expect(result).toBeTruthy();
        expect(result.teamName).toEqual(mockTeam.teamName);
        expect(result.players).toEqual([expectedPlayer]);
        expect(clashTeamsDbImpl.Team.update.mock.calls.length).toEqual(1);
      });
    });

    test('I should register the player to a completely new Team if they request one and they already '
            + 'exist on a team.', () => {
      const expectedPlayer = 'Player2';
      const expectedServerName = 'Sample Server';
      const expectedPlayers = ['Player1', expectedPlayer];
      const value = {
        Items: [{
          attrs: {
            key: 'Team Sample#Sample Server#msi2021#3',
            teamName: 'Team Sample',
            serverName: expectedServerName,
            tournamentName: 'msi2021',
            tournamentDay: '3',
            players: expectedPlayers,
          },
        }],
      };
      const mockTeam = {
        key: 'Sample Team#Sample Server',
        teamName: 'Team Sample',
        serverName: expectedServerName,
        tournamentName: 'msi2021',
        tournamentDay: '3',
        players: [expectedPlayer],
      };
      buildMockReturnForRegister(value, mockTeam, true, false, true);

      const tournament = [
        { tournamentName: 'msi2021', tournamentDay: '3' },
        { tournamentName: 'msi2021', tournamentDay: '4' },
      ];
      retrieveName.mockReturnValue('Absol');
      const expectedTeamToPersist = {
        key: 'Team Absol#Sample Server#msi2021#3',
        players: ['Player2'],
        serverName: 'Sample Server',
        teamName: 'Team Absol',
        tournamentDay: '3',
        tournamentName: 'msi2021',
      };
      const expectedTournament = JSON.parse(JSON.stringify(tournament[0]));
      return clashTeamsDbImpl.registerPlayer(expectedPlayer, expectedServerName, tournament)
        .then((result) => {
          expect(result).toBeTruthy();
          expect(result.teamName).toEqual(mockTeam.teamName);
          expect(result.players).toEqual(mockTeam.players);
          expect(result.tournamentName).toEqual(expectedTournament.tournamentName);
          expect(result.tournamentDay).toEqual(expectedTournament.tournamentDay);
          expect(clashTeamsDbImpl.Team.update.mock.calls.length).toEqual(2);
          expect(clashTeamsDbImpl.Team.update.mock.calls).toEqual([
            [
              expectedTeamToPersist,
              expect.any(Function),
            ],
            [
              { key: value.Items[0].attrs.key }, {
                ExpressionAttributeValues: {
                  ':playerName': [expectedPlayer],
                  ':nameOfTeam': 'Team Sample',
                },
                ConditionExpression: 'teamName = :nameOfTeam',
                UpdateExpression: 'DELETE players :playerName',
              },
              expect.any(Function),
            ],
          ]);
        });
    });
  });

  describe('Register Player - v2', () => {
    test('When I register a player with a id, role, server, and tournament, and they do not have a team '
            + 'then they should be successfully registered to version 2 of the team format.', () => {
      const expectedUserId = '1';
      const expectedUserRole = 'Top';
      const expectedUserServerName = 'Goon Squad';
      const expectedTeamName = 'Team Abomasnow';
      const expectedUserTournaments = createMockListOfTournaments(2);
      const expectedVersion = 2;
      retrieveName.mockReturnValue('Abomasnow');
      const expectedResults = {
        registeredTeam: buildExpectedTeamV2(expectedTeamName, expectedUserServerName,
          expectedUserTournaments, expectedVersion, expectedUserId),
        unregisteredTeams: [],
      };

      clashTeamsDbImpl.Team = {
        exec: jest.fn().mockImplementation(() => streamTest.v2.fromObjects([])),
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementation((params, callback) => callback(undefined,
          { attrs: expectedResults.registeredTeam })),
      };

      return clashTeamsDbImpl.registerPlayerToNewTeamV2(expectedUserId, expectedUserRole, expectedUserServerName, expectedUserTournaments).then((registeredTeam) => {
        expect(registeredTeam).toBeTruthy();
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith(expectedResults.registeredTeam, expect.any(Function));
        expect(registeredTeam).toEqual(expectedResults);
      });
    });

    test('When I register a player with a team that has an undefined playersWRoles attribute, role, server, '
            + 'and tournament, they should be successfully registered to version two of the team format.', () => {
      const expectedUserId = '1';
      const expectedUserRole = 'Top';
      const expectedUserServerName = 'Goon Squad';
      const expectedTeamName = 'Team Abra';
      const expectedUserTournaments = createMockListOfTournaments(2);
      const expectedVersion = 2;
      const expectedResults = {
        registeredTeam: buildExpectedTeamV2(expectedTeamName, expectedUserServerName,
          expectedUserTournaments, expectedVersion, expectedUserId),
        unregisteredTeams: [],
      };

      const expectedUndefinedPlayersReturnedTeam = {
        key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName,
          expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
        version: expectedVersion,
        teamName: expectedTeamName,
        serverName: expectedUserServerName,
        tournamentName: expectedUserTournaments[0].tournamentName,
        tournamentDay: expectedUserTournaments[0].tournamentDay,
        startTime: expectedUserTournaments[0].startTime,
      };

      clashTeamsDbImpl.Team = {
        exec: jest.fn().mockImplementation(() => streamTest.v2
          .fromObjects([{ Items: [{ attrs: expectedUndefinedPlayersReturnedTeam }] }])),
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementation((params, callback) => callback(undefined, { attrs: expectedResults.registeredTeam })),
      };

      return clashTeamsDbImpl.registerPlayerToNewTeamV2(expectedUserId, expectedUserRole, expectedUserServerName, expectedUserTournaments).then((registeredTeam) => {
        expect(registeredTeam).toBeTruthy();
        expect(clashTeamsDbImpl.Team.exec).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith(expectedResults.registeredTeam, expect.any(Function));
        expect(registeredTeam).toEqual(expectedResults);
      });
    });

    test('When I register a player with a team that has an undefined playersWRoles attribute, role, server, '
            + 'and tournament, and they have an existing team then they should be successfully registered to '
            + 'version two of the team format and unregistered from their existing team.', () => {
      const expectedUserId = '1';
      const expectedUserRole = 'Top';
      const expectedUserServerName = 'Goon Squad';
      const expectedTeamName = 'Team Abra';
      const expectedUserTournaments = createMockListOfTournaments(2);
      const expectedVersion = 2;

      const expectedResults = {
        registeredTeam: buildExpectedTeamV2(expectedTeamName, expectedUserServerName,
          expectedUserTournaments, expectedVersion, expectedUserId),
      };

      const teamToBeUnregisteredFrom = buildMockTeamV2(expectedUserServerName, [expectedUserId, '2'],
        { Top: expectedUserId, Mid: '2' }, expectedUserTournaments[0],
        'Team toBeRemovedFrom');

      const afterUnregistering = deepCopy(teamToBeUnregisteredFrom);
      afterUnregistering.players.pop();
      delete afterUnregistering.Mid;

      expectedResults.unregisteredTeams = [afterUnregistering];

      const expectedUndefinedPlayersReturnedTeam = {
        key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName,
          expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
        version: expectedVersion,
        teamName: expectedTeamName,
        serverName: expectedUserServerName,
        tournamentName: expectedUserTournaments[0].tournamentName,
        tournamentDay: expectedUserTournaments[0].tournamentDay,
        startTime: expectedUserTournaments[0].startTime,
      };

      clashTeamsDbImpl.Team = {
        exec: jest.fn().mockImplementation(() => streamTest.v2
          .fromObjects([{
            Items: [
              { attrs: expectedUndefinedPlayersReturnedTeam },
              { attrs: teamToBeUnregisteredFrom },
            ],
          }])),
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementationOnce((key, params, callback) => callback(undefined,
          [{ attrs: afterUnregistering }]))
          .mockImplementationOnce((key, callback) => callback(undefined,
            { attrs: expectedResults.registeredTeam })),
      };

      const deleteParams = {
        UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
        ConditionExpression: 'teamName = :nameOfTeam',
        ExpressionAttributeValues: {
          ':playerName': dynamodb.Set(['1'], 'S'),
          ':nameOfTeam': teamToBeUnregisteredFrom.teamName,
          ':updatedRole': { Mid: '2' },
        },
      };

      return clashTeamsDbImpl.registerPlayerToNewTeamV2(expectedUserId, expectedUserRole, expectedUserServerName, expectedUserTournaments).then((registeredTeam) => {
        expect(registeredTeam).toBeTruthy();
        expect(clashTeamsDbImpl.Team.exec).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(2);
        expect(clashTeamsDbImpl.Team.update).toHaveBeenNthCalledWith(1, { key: teamToBeUnregisteredFrom.key },
          deleteParams, expect.any(Function));
        expect(clashTeamsDbImpl.Team.update).toHaveBeenNthCalledWith(2, expectedResults.registeredTeam,
          expect.any(Function));
        expect(registeredTeam).toEqual(expectedResults);
      });
    });

    test('When I register a player with a team that has an existing team role, server, '
            + 'and tournament and the player belongs to an existing team, they should be unregistered '
            + 'from the existing team and successfully registered to version two of the team format.', () => {
      const expectedUserId = '1';
      const expectedUserRole = 'Top';
      const expectedUserServerName = 'Goon Squad';
      const expectedTeamName = 'Team Abomasnow';
      retrieveName.mockReturnValue('Abomasnow');
      const expectedUserTournaments = createMockListOfTournaments(2);
      const expectedRoleToPlayerMap = { Top: expectedUserId };

      const expectedRegistrationResults = {
        registeredTeam: buildMockTeamV2(expectedUserServerName, [expectedUserId],
          expectedRoleToPlayerMap, expectedUserTournaments[0], expectedTeamName),
      };

      const returnedPlayersReturnedTeamWithPlayer = buildMockTeamV2(expectedUserServerName, [expectedUserId],
        { Top: expectedUserId }, expectedUserTournaments[0], 'Team toBeRemovedFrom');

      expectedRegistrationResults.unregisteredTeams = [returnedPlayersReturnedTeamWithPlayer];

      clashTeamsDbImpl.Team = {
        exec: jest.fn().mockImplementation(() => streamTest.v2.fromObjects(
          [{
            Items: [{ attrs: returnedPlayersReturnedTeamWithPlayer }],
          }],
        )),
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementationOnce((key, params, callback) => callback(undefined,
          [{ attrs: returnedPlayersReturnedTeamWithPlayer }]))
          .mockImplementationOnce((key, callback) => callback(undefined,
            { attrs: expectedRegistrationResults.registeredTeam })),

      };

      const deleteParams = {
        UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
        ConditionExpression: 'teamName = :nameOfTeam',
        ExpressionAttributeValues: {
          ':playerName': dynamodb.Set(['1'], 'S'),
          ':nameOfTeam': returnedPlayersReturnedTeamWithPlayer.teamName,
          ':updatedRole': {},
        },
      };

      return clashTeamsDbImpl.registerPlayerToNewTeamV2(expectedUserId, expectedUserRole, expectedUserServerName, expectedUserTournaments).then((registerDetails) => {
        expect(registerDetails).toBeTruthy();
        expect(clashTeamsDbImpl.Team.exec).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(2);
        expect(clashTeamsDbImpl.Team.update).toHaveBeenNthCalledWith(1, { key: returnedPlayersReturnedTeamWithPlayer.key },
          deleteParams, expect.any(Function));
        expect(clashTeamsDbImpl.Team.update).toHaveBeenNthCalledWith(2, expectedRegistrationResults.registeredTeam,
          expect.any(Function));
        expect(registerDetails).toEqual(expectedRegistrationResults);
      });
    });

    test('When I register a player that belongs to a team with the specified role by himself for all tournaments, '
            + 'then an empty response should be returned.', () => {
      const expectedUserId = '1';
      const expectedUserRole = 'Top';
      const expectedUserServerName = 'Goon Squad';
      const expectedTeamName = 'Team Abra';
      const expectedUserTournaments = createMockListOfTournaments(2);
      const expectedVersion = 2;
      const expectedRegisteredTeam = {
        key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName, expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
        version: expectedVersion,
        teamName: expectedTeamName,
        serverName: expectedUserServerName,
        playersWRoles: {
          Top: expectedUserId,
        },
        players: [expectedUserId],
        tournamentName: expectedUserTournaments[0].tournamentName,
        tournamentDay: expectedUserTournaments[0].tournamentDay,
      };

      const expectedPlayersReturnedTeam = {
        key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName, expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
        version: expectedVersion,
        teamName: expectedTeamName,
        serverName: expectedUserServerName,
        playersWRoles: {
          Top: expectedUserId,
        },
        players: [expectedUserId],
        tournamentName: expectedUserTournaments[0].tournamentName,
        tournamentDay: expectedUserTournaments[0].tournamentDay,
        exist: true,
      };

      const expectedPlayersReturnedTeamTwo = {
        key: clashTeamsDbImpl.getKey('Team Abamasnow', expectedUserServerName, expectedUserTournaments[1].tournamentName, expectedUserTournaments[1].tournamentDay),
        version: expectedVersion,
        teamName: 'Team Abamasnow',
        serverName: expectedUserServerName,
        playersWRoles: {
          Top: expectedUserId,
        },
        players: [expectedUserId],
        tournamentName: expectedUserTournaments[1].tournamentName,
        tournamentDay: expectedUserTournaments[1].tournamentDay,
        exist: true,
      };

      clashTeamsDbImpl.Team = {
        exec: jest.fn().mockImplementation(() => streamTest.v2.fromObjects([{
          Items: [
            { attrs: expectedPlayersReturnedTeam },
            { attrs: expectedPlayersReturnedTeamTwo },
          ],
        }])),
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementation((params, callback) => callback(undefined, { attrs: expectedRegisteredTeam })),
      };

      return clashTeamsDbImpl.registerPlayerToNewTeamV2(expectedUserId, expectedUserRole, expectedUserServerName, expectedUserTournaments).then((registeredTeam) => {
        expect(clashTeamsDbImpl.Team.exec).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.update).not.toHaveBeenCalled();
        expect(registeredTeam).toEqual([expectedPlayersReturnedTeam, expectedPlayersReturnedTeamTwo]);
      });
    });
  });
});

describe('Register Specific Team', () => {
  describe('Register Specific Team', () => {
    test('A user should be able to request to join a specific Team based on the Tournament and Team name.', () => {
      const playerName = 'TestPlayer1';
      const serverName = 'Test Server';
      const tournaments = [{
        tournamentName: 'msi2021',
        tournamentDay: '3',
      }];
      const teamName = 'Abra';
      const dynamoDbRetrieveList = {
        Items: [{
          attrs: {
            key: clashTeamsDbImpl.getKey(teamName, serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
            teamName: 'Team Awesome',
            serverName,
            players: undefined,
            tournamentName: tournaments[0].tournamentName,
            tournamentDay: tournaments[0].tournamentDay,
          },
        }, {
          attrs: {
            key: clashTeamsDbImpl.getKey('Team Existing', serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
            teamName: 'Team Existing',
            serverName,
            players: ['Player3', playerName],
            tournamentName: tournaments[0].tournamentName,
            tournamentDay: tournaments[0].tournamentDay,
          },
        }, {
          attrs: {
            key: clashTeamsDbImpl.getKey(`Team ${teamName}`, serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
            teamName: `Team ${teamName}`,
            serverName,
            players: ['Player3'],
            tournamentName: tournaments[0].tournamentName,
            tournamentDay: tournaments[0].tournamentDay,
          },
        },
        ],
      };
      const updatedExpectedPlayers = JSON.parse(JSON.stringify(dynamoDbRetrieveList.Items[1].attrs.players)).concat(playerName);
      const mockTeam = {
        key: clashTeamsDbImpl.getKey(teamName, serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
        teamName: `Team ${teamName}`,
        serverName,
        players: updatedExpectedPlayers,
        tournamentName: tournaments[0].tournamentName,
        tournamentDay: tournaments[0].tournamentDay,
      };
      buildMockReturnForRegister(dynamoDbRetrieveList, mockTeam, false, true, true);
      return clashTeamsDbImpl.registerWithSpecificTeam(playerName, serverName, tournaments, teamName, () => {
        console.log('Do Something.');
      }).then((data) => {
        expect(data).toBeTruthy();
        expect(data.teamName).toEqual(dynamoDbRetrieveList.Items[2].attrs.teamName);
        expect(data.serverName).toEqual(dynamoDbRetrieveList.Items[2].attrs.serverName);
        expect(data.tournamentName).toEqual(dynamoDbRetrieveList.Items[2].attrs.tournamentName);
        expect(data.tournamentDay).toEqual(dynamoDbRetrieveList.Items[2].attrs.tournamentDay);
        expect(data.players).toEqual(updatedExpectedPlayers);
        expect(clashTeamsDbImpl.Team.update.mock.calls).toEqual([
          [
            { key: dynamoDbRetrieveList.Items[1].attrs.key },
            {
              ExpressionAttributeValues: {
                ':playerName': [playerName],
                ':nameOfTeam': dynamoDbRetrieveList.Items[1].attrs.teamName,
              },
              ConditionExpression: 'teamName = :nameOfTeam',
              UpdateExpression: 'DELETE players :playerName',
            }, expect.any(Function),
          ],
          [
            { key: dynamoDbRetrieveList.Items[2].attrs.key },
            {
              ExpressionAttributeValues: {
                ':playerName': [playerName],
              },
              UpdateExpression: 'ADD players :playerName',
            }, expect.any(Function),
          ],
        ]);
      });
    });

    test('If the team that the user is requesting, does not exist, return with an undefined response.', () => {
      const playerName = 'TestPlayer1';
      const serverName = 'Test Server';
      const tournaments = [{
        tournamentName: 'msi2021',
        tournamentDay: '3',
      }];
      const teamName = 'Abra';
      const dynamoDbRetrieveList = {
        Items: [{
          attrs: {
            key: clashTeamsDbImpl.getKey('Team DNE', serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
            teamName: 'Team DNE',
            serverName,
            players: ['Player3'],
            tournamentName: tournaments[0].tournamentName,
            tournamentDay: tournaments[0].tournamentDay,
          },
        }, {
          attrs: {
            key: clashTeamsDbImpl.getKey('Team DNE', serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
            teamName: 'Team Hello',
            serverName,
            players: ['Player1', 'Player2'],
            tournamentName: tournaments[0].tournamentName,
            tournamentDay: tournaments[0].tournamentDay,
          },
        },
        ],
      };
      buildMockReturnForRegister(dynamoDbRetrieveList);
      return clashTeamsDbImpl.registerWithSpecificTeam(playerName, serverName, tournaments, teamName).then((data) => {
        expect(data).toBeFalsy();
      });
    });

    test('If the team that the user is requesting, has 5 players, return with an undefined response.', () => {
      const playerName = 'TestPlayer1';
      const serverName = 'Test Server';
      const tournaments = [{
        tournamentName: 'msi2021',
        tournamentDay: '3',
      }];
      const teamName = 'Abra';
      const dynamoDbRetrieveList = {
        Items: [{
          attrs: {
            key: clashTeamsDbImpl.getKey('Team DNE', serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
            teamName: `Team ${teamName}`,
            serverName,
            players: ['Player3', 'Player2', 'Player3', 'Player4', 'Player5'],
            tournamentName: tournaments[0].tournamentName,
            tournamentDay: tournaments[0].tournamentDay,
          },
        }],
      };
      buildMockReturnForRegister(dynamoDbRetrieveList);
      return clashTeamsDbImpl.registerWithSpecificTeam(playerName, serverName, tournaments, teamName).then((data) => {
        expect(data).toBeFalsy();
      });
    });

    describe('Error', () => {
      test('If there is an error upon querying for records, the error should be caught and rejected.', () => {
        const playerName = 'TestPlayer1';
        const serverName = 'Test Server';
        const tournaments = [{
          tournamentName: 'msi2021',
          tournamentDay: '3',
        }];
        const teamName = 'Abra';
        const dynamoDbRetrieveList = {
          Items: [{
            attrs: {
              key: clashTeamsDbImpl.getKey('Team DNE', serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
              teamName: 'Team DNE',
              serverName,
              players: ['Player3'],
              tournamentName: tournaments[0].tournamentName,
              tournamentDay: tournaments[0].tournamentDay,
            },
          }, {
            attrs: {
              key: clashTeamsDbImpl.getKey('Team DNE', serverName, tournaments[0].tournamentName, tournaments[0].tournamentDay),
              teamName: 'Team Hello',
              serverName,
              players: ['Player1', 'Player2'],
              tournamentName: tournaments[0].tournamentName,
              tournamentDay: tournaments[0].tournamentDay,
            },
          },
          ],
        };
        buildMockReturnForRegister(dynamoDbRetrieveList);
        clashTeamsDbImpl.Team.exec = undefined;

        return clashTeamsDbImpl.registerWithSpecificTeam(playerName, serverName, tournaments, teamName).then((data) => {
          expect(data).toBeFalsy();
        }).catch((err) => expect(err).toBeTruthy());
      });
    });
  });

  describe('Register Specific Team - v2', () => {
    test('When a specific Team is passed. A user should pass their id, role, serverName, teamName, and '
            + 'Tournament to join with and should be successfully joined.', () => {
      const expectedUserId = '1';
      const expectedUserRole = 'Top';
      const expectedUserServerName = 'Goon Squad';
      const expectedTeamName = 'Abomasnow';
      const expectedUserTournaments = createMockListOfTournaments(2);
      const expectedVersion = 2;
      const foundTeam = {
        Items: [{
          attrs: {
            key: clashTeamsDbImpl.getKey(`Team ${expectedTeamName}`, expectedUserServerName,
              expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
            version: expectedVersion,
            teamName: `Team ${expectedTeamName}`,
            serverName: expectedUserServerName,
            players: [],
            playersWRoles: {},
            tournamentName: expectedUserTournaments[0].tournamentName,
            tournamentDay: expectedUserTournaments[0].tournamentDay,
            startTime: expectedUserTournaments[0].startTime,
          },
        }],
      };
      const expectedRegisteredTeam = {
        registeredTeam: buildExpectedTeamV2(`Team ${expectedTeamName}`, expectedUserServerName,
          expectedUserTournaments, expectedVersion, expectedUserId),
        unregisteredTeams: [],
      };

      clashTeamsDbImpl.Team = {
        exec: jest.fn().mockImplementation(() => streamTest.v2.fromObjects([foundTeam])),
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementation((key, params, callback) => callback(undefined, { attrs: expectedRegisteredTeam.registeredTeam })),
      };

      const addParams = {
        UpdateExpression: 'ADD players :playerName SET playersWRoles = :updatedRole',
        ExpressionAttributeValues: {
          ':playerName': dynamodb.Set([expectedUserId], 'S'),
          ':updatedRole': expectedRegisteredTeam.registeredTeam.playersWRoles,
        },
      };

      return clashTeamsDbImpl.registerWithSpecificTeamV2(expectedUserId,
        expectedUserRole,
        expectedUserServerName,
        expectedUserTournaments,
        expectedTeamName).then((registeredTeam) => {
        expect(registeredTeam).toBeTruthy();
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(1);
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith(
          { key: expectedRegisteredTeam.registeredTeam.key }, addParams, expect.any(Function),
        );
        expect(registeredTeam).toEqual(expectedRegisteredTeam);
      });
    });

    test('When a specific Team is passed with a role that exists on said Team, they should not be '
            + 'successfully registered to the given Team.', () => {
      const expectedUserId = '1';
      const expectedUserRole = 'Top';
      const expectedUserServerName = 'Goon Squad';
      const expectedTeamName = 'Abomasnow';
      const expectedUserTournaments = createMockListOfTournaments(2);
      const expectedVersion = 2;
      const foundTeam = {
        Items: [{
          attrs: {
            key: clashTeamsDbImpl.getKey(`Team ${expectedTeamName}`, expectedUserServerName,
              expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
            version: expectedVersion,
            teamName: `Team ${expectedTeamName}`,
            serverName: expectedUserServerName,
            players: [],
            playersWRoles: {
              Top: '2',
            },
            tournamentName: expectedUserTournaments[0].tournamentName,
            tournamentDay: expectedUserTournaments[0].tournamentDay,
            startTime: expectedUserTournaments[0].startTime,
          },
        }],
      };

      clashTeamsDbImpl.Team = {
        exec: jest.fn().mockImplementation(() => streamTest.v2.fromObjects([foundTeam])),
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        update: jest.fn(),
      };

      return clashTeamsDbImpl.registerWithSpecificTeamV2(expectedUserId,
        expectedUserRole,
        expectedUserServerName,
        expectedUserTournaments,
        expectedTeamName).then((registeredTeam) => {
        expect(registeredTeam).toBeFalsy();
        expect(clashTeamsDbImpl.Team.update).not.toHaveBeenCalled();
      });
    });

    test('When a specific Team is passed and they belong to a team during the same tournament. A user should pass their '
            + 'id, role, serverName, teamName, and Tournament to join with and should be successfully joined and be '
            + 'unregistered from their other team.', () => {
      const expectedUserId = '1';
      const expectedUserRole = 'Top';
      const expectedUserServerName = 'Goon Squad';
      const expectedTeamName = 'Abomasnow';
      const expectedUserTournaments = createMockListOfTournaments(2);
      const expectedVersion = 2;
      const expectedCurrentTeamToBeRegisteredTo = buildMockTeamV2(expectedUserServerName, [expectedUserId],
        {}, expectedUserTournaments[0], `Team ${expectedTeamName}`);
      const expectedCurrentTeamToBeUnregisteredFrom = buildMockTeamV2(expectedUserServerName, [expectedUserId],
        { Top: expectedUserId }, expectedUserTournaments[0], 'Team Abra');
      const foundTeam = {
        Items: [
          {
            attrs: expectedCurrentTeamToBeRegisteredTo,
          },
          {
            attrs: expectedCurrentTeamToBeUnregisteredFrom,
          },
        ],
      };
      const copyUnregisteredTeam = JSON.parse(JSON.stringify(expectedCurrentTeamToBeUnregisteredFrom));
      delete copyUnregisteredTeam.Top;
      const expectedRegisteredTeam = {
        registeredTeam: buildExpectedTeamV2(`Team ${expectedTeamName}`, expectedUserServerName,
          expectedUserTournaments, expectedVersion, expectedUserId),
        unregisteredTeams: [copyUnregisteredTeam],
      };

      const copyExpectedRegisteredTeam = JSON.parse(JSON.stringify(expectedRegisteredTeam));

      clashTeamsDbImpl.Team = {
        exec: jest.fn().mockImplementation(() => streamTest.v2.fromObjects([foundTeam])),
        scan: jest.fn().mockReturnThis(),
        filterExpression: jest.fn().mockReturnThis(),
        expressionAttributeValues: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        update: jest.fn()
          .mockImplementationOnce((key, params, callback) => callback(null, [{ attrs: copyUnregisteredTeam }]))
          .mockImplementationOnce((key, params, callback) => callback(undefined,
            { attrs: copyExpectedRegisteredTeam.registeredTeam })),
      };

      const unregisterParams = {
        UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
        ConditionExpression: 'teamName = :nameOfTeam',
        ExpressionAttributeValues: {
          ':playerName': dynamodb.Set([expectedUserId], 'S'),
          ':nameOfTeam': expectedCurrentTeamToBeUnregisteredFrom.teamName,
          ':updatedRole': {},
        },
      };

      const addParams = {
        UpdateExpression: 'ADD players :playerName SET playersWRoles = :updatedRole',
        ExpressionAttributeValues: {
          ':playerName': dynamodb.Set([expectedUserId], 'S'),
          ':updatedRole': expectedRegisteredTeam.registeredTeam.playersWRoles,
        },
      };

      return clashTeamsDbImpl.registerWithSpecificTeamV2(expectedUserId,
        expectedUserRole,
        expectedUserServerName,
        expectedUserTournaments,
        expectedTeamName).then((registeredTeam) => {
        expect(registeredTeam).toBeTruthy();
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(2);
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith({ key: expectedCurrentTeamToBeUnregisteredFrom.key }, unregisterParams, expect.any(Function));
        expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith({ key: expectedCurrentTeamToBeRegisteredTo.key }, addParams, expect.any(Function));
        expect(registeredTeam).toEqual(expectedRegisteredTeam);
      });
    });
  });
});

describe('Is Player on Team v2', () => {
  test('If the playersWRoles is undefined then isPlayerIsOnTeamV2 should return false.', () => {
    const expectedUserId = '1';
    const expectedUserServerName = 'Goon Squad';
    const expectedTeamName = 'Team Abomasnow';
    const expectedUserTournaments = createMockListOfTournaments(2);
    const team = {
      key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName, expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
      version: 2,
      teamName: expectedTeamName,
      serverName: expectedUserServerName,
      players: [expectedUserId],
      tournamentName: expectedUserTournaments[0].tournamentName,
      tournamentDay: expectedUserTournaments[0].tournamentDay,
      startTime: expectedUserTournaments[0].startTime,
    };

    expect(clashTeamsDbImpl.isPlayerIsOnTeamV2('1', team)).toBeFalsy();
  });
  test('If the playersWRoles is empty then isPlayerIsOnTeamV2 should return false.', () => {
    const expectedUserServerName = 'Goon Squad';
    const expectedTeamName = 'Team Abomasnow';
    const expectedUserTournaments = createMockListOfTournaments(2);
    const team = {
      key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName, expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
      version: 2,
      teamName: expectedTeamName,
      serverName: expectedUserServerName,
      players: [],
      playersWRoles: {},
      tournamentName: expectedUserTournaments[0].tournamentName,
      tournamentDay: expectedUserTournaments[0].tournamentDay,
      startTime: expectedUserTournaments[0].startTime,
    };

    expect(clashTeamsDbImpl.isPlayerIsOnTeamV2('1', team)).toBeFalsy();
  });

  test('If the playersWRoles is defined and the player is in Top then isPlayerIsOnTeamV2 should return an object with the postion the User is in.', () => {
    const expectedUserId = '1';
    const expectedUserServerName = 'Goon Squad';
    const expectedTeamName = 'Team Abomasnow';
    const expectedUserTournaments = createMockListOfTournaments(2);
    const team = {
      key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName, expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
      version: 2,
      teamName: expectedTeamName,
      serverName: expectedUserServerName,
      players: [expectedUserId],
      playersWRoles: {
        Top: expectedUserId,
      },
      tournamentName: expectedUserTournaments[0].tournamentName,
      tournamentDay: expectedUserTournaments[0].tournamentDay,
      startTime: expectedUserTournaments[0].startTime,
    };

    expect(clashTeamsDbImpl.isPlayerIsOnTeamV2(expectedUserId, team)).toEqual('Top');
  });

  test('If the playersWRoles is defined and the player is in Mid then isPlayerIsOnTeamV2 should return true.', () => {
    const expectedUserId = '1';
    const expectedUserServerName = 'Goon Squad';
    const expectedTeamName = 'Team Abomasnow';
    const expectedUserTournaments = createMockListOfTournaments(2);
    const team = {
      key: clashTeamsDbImpl.getKey(expectedTeamName, expectedUserServerName, expectedUserTournaments[0].tournamentName, expectedUserTournaments[0].tournamentDay),
      version: 2,
      teamName: expectedTeamName,
      serverName: expectedUserServerName,
      players: [expectedUserId],
      playersWRoles: {
        Mid: expectedUserId,
      },
      tournamentName: expectedUserTournaments[0].tournamentName,
      tournamentDay: expectedUserTournaments[0].tournamentDay,
      startTime: expectedUserTournaments[0].startTime,
    };

    expect(clashTeamsDbImpl.isPlayerIsOnTeamV2(expectedUserId, team)).toBeTruthy();
  });
});

describe('Filter by Team Name', () => {
  each([
    [true, 'Team Existing', { teamName: 'Team Existing' }],
    [true, 'Existing', { teamName: 'Team Existing' }],
    [true, 'existing', { teamName: 'Team Existing' }],
    [true, 'isting', { teamName: 'Team Existing' }],
    [true, 'e', { teamName: 'Team Existing' }],
    [false, 'dne', { teamName: 'Team Existing' }],
    [false, undefined, { teamName: 'Team Existing' }],
    [false, 'Team Existing', {}],
    [false, 'Team Existing', undefined],
  ]).test("Match ('%s') Search Team Name ('%s') with Team ('%s')", (shouldMatch, teamNameToMatch, team) => {
    expect(clashTeamsDbImpl.doesTeamNameMatch(teamNameToMatch, team)).toEqual(shouldMatch);
  });
});

describe('Unregister Player', () => {
  test('I should remove a player from a team if unregister is called and they exist on a team.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const expectedPlayers = ['Player1'];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback();
      }),
    };
    dynamodb.Set = jest.fn().mockReturnValue(expectedPlayers);

    const foundTeam = value.Items[0].attrs;
    const key = clashTeamsDbImpl.getKey(foundTeam.teamName, foundTeam.serverName, foundTeam.tournamentName, foundTeam.tournamentDay);

    return clashTeamsDbImpl.deregisterPlayer('Player1', 'Sample Server', leagueTimes).then((data) => {
      expect(data).toBeTruthy();
      expect(clashTeamsDbImpl.Team.update).toBeCalledWith({ key }, {
        ExpressionAttributeValues: {
          ':playerName': expectedPlayers,
          ':nameOfTeam': 'Team Sample',
        },
        ConditionExpression: 'teamName = :nameOfTeam',
        UpdateExpression: 'DELETE players :playerName',
      }, expect.any(Function));
    });
  });

  test('I should remove a player from multiple teams if unregister is called and they belong to multiple teams that match the criteria.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      }, {
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample2',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '2',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const expectedPlayers = ['Player1'];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback();
      }),
    };
    dynamodb.Set = jest.fn().mockReturnValue(expectedPlayers);

    const foundTeam = value.Items[0].attrs;
    const keyOne = clashTeamsDbImpl.getKey(foundTeam.teamName, foundTeam.serverName, foundTeam.tournamentName, foundTeam.tournamentDay);
    const foundTeamTwo = value.Items[1].attrs;
    const keyTwo = clashTeamsDbImpl.getKey(foundTeamTwo.teamName, foundTeamTwo.serverName, foundTeamTwo.tournamentName, foundTeamTwo.tournamentDay);

    return clashTeamsDbImpl.deregisterPlayer('Player1', 'Sample Server', leagueTimes).then((data) => {
      expect(data).toBeTruthy();
      expect(clashTeamsDbImpl.Team.update.mock.calls.length).toEqual(2);
      expect(clashTeamsDbImpl.Team.update.mock.calls).toEqual([[{ key: keyOne }, {
        ExpressionAttributeValues: {
          ':playerName': expectedPlayers,
          ':nameOfTeam': 'Team Sample',
        },
        ConditionExpression: 'teamName = :nameOfTeam',
        UpdateExpression: 'DELETE players :playerName',
      }, expect.any(Function)], [
        { key: keyTwo }, {
          ExpressionAttributeValues: {
            ':playerName': expectedPlayers,
            ':nameOfTeam': 'Team Sample2',
          },
          ConditionExpression: 'teamName = :nameOfTeam',
          UpdateExpression: 'DELETE players :playerName',
        }, expect.any(Function),
      ]]);
    });
  });

  test('I should remove a player from a single team if unregister is called and they belong to a single teams that matches the criteria.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      }, {
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample2',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '2',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
    ];
    const expectedPlayers = ['Player1'];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback();
      }),
    };
    dynamodb.Set = jest.fn().mockReturnValue(expectedPlayers);

    const foundTeam = value.Items[0].attrs;
    const keyOne = clashTeamsDbImpl.getKey(foundTeam.teamName, foundTeam.serverName, foundTeam.tournamentName, foundTeam.tournamentDay);

    return clashTeamsDbImpl.deregisterPlayer('Player1', 'Sample Server', leagueTimes).then((data) => {
      expect(data).toBeTruthy();
      expect(clashTeamsDbImpl.Team.update.mock.calls.length).toEqual(1);
      expect(clashTeamsDbImpl.Team.update.mock.calls).toEqual([[{ key: keyOne }, {
        ExpressionAttributeValues: {
          ':playerName': expectedPlayers,
          ':nameOfTeam': 'Team Sample',
        },
        ConditionExpression: 'teamName = :nameOfTeam',
        UpdateExpression: 'DELETE players :playerName',
      }, expect.any(Function)]]);
    });
  });

  test('I should not remove a player from a team if unregister is called and they do not exist on a team.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback();
      }),
    };

    return clashTeamsDbImpl.deregisterPlayer('Player2', 'Sample Server', leagueTimes).then((data) => {
      expect(data).toBeFalsy();
    });
  });

  test('I should not remove a player from a team if unregister is called and they do not exist on a team with the given tournament details.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '3',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback();
      }),
    };

    return clashTeamsDbImpl.deregisterPlayer('Player2', 'Sample Server', leagueTimes).then((data) => {
      expect(data).toBeFalsy();
    });
  });

  test('I should return and error if an error occurs upon the update of the Team object.', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback('Failed to update.');
      }),
    };

    return expect(clashTeamsDbImpl.deregisterPlayer('Player1', 'Sample Server', leagueTimes)).rejects.toMatch('Failed to update.');
  });
});

describe('Unregister Player v2', () => {
  test('I should remove a player from a team if unregister is called and they exist on a team. - v2', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          playersWRoles: { Top: 'Player1' },
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      },
      ],
    };
    const expectedUpdatedValue = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: [],
          playersWRoles: {},
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const expectedPlayers = ['Player1'];
    const updatedRoleToPlayerMap = {};
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback(undefined, expectedUpdatedValue);
      }),
    };
    dynamodb.Set = jest.fn().mockReturnValue(expectedPlayers);

    const foundTeam = value.Items[0].attrs;
    const key = clashTeamsDbImpl.getKey(foundTeam.teamName, foundTeam.serverName,
      foundTeam.tournamentName, foundTeam.tournamentDay);

    return clashTeamsDbImpl.deregisterPlayerV2('Player1', 'Sample Server', leagueTimes)
      .then((data) => {
        expect(data).toBeTruthy();
        expect(clashTeamsDbImpl.Team.update).toBeCalledWith({ key }, {
          ExpressionAttributeValues: {
            ':playerName': expectedPlayers,
            ':nameOfTeam': 'Team Sample',
            ':updatedRole': updatedRoleToPlayerMap,
          },
          ConditionExpression: 'teamName = :nameOfTeam',
          UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
        }, expect.any(Function));
      });
  });

  test('I should remove a player from multiple teams if unregister is called and they belong to multiple teams '
        + 'that match the criteria. - v2', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          playersWRoles: { Top: 'Player1' },
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      }, {
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample2',
          serverName: 'Sample Server',
          players: ['Player1'],
          playersWRoles: { Top: 'Player1' },
          tournamentName: 'msi2021',
          tournamentDay: '2',
        },
      },
      ],
    };
    const expectedUpdatedValues = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: [],
          playersWRoles: {},
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      }, {
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample2',
          serverName: 'Sample Server',
          players: [],
          playersWRoles: {},
          tournamentName: 'msi2021',
          tournamentDay: '2',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const expectedPlayers = ['Player1'];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback(undefined, expectedUpdatedValues);
      }),
    };
    dynamodb.Set = jest.fn().mockReturnValue(expectedPlayers);

    const foundTeam = value.Items[0].attrs;
    const keyOne = clashTeamsDbImpl.getKey(foundTeam.teamName, foundTeam.serverName,
      foundTeam.tournamentName, foundTeam.tournamentDay);
    const foundTeamTwo = value.Items[1].attrs;
    const keyTwo = clashTeamsDbImpl.getKey(foundTeamTwo.teamName, foundTeamTwo.serverName,
      foundTeamTwo.tournamentName, foundTeamTwo.tournamentDay);

    return clashTeamsDbImpl.deregisterPlayerV2('Player1', 'Sample Server',
      leagueTimes).then((data) => {
      expect(data).toBeTruthy();
      expect(clashTeamsDbImpl.Team.update.mock.calls.length).toEqual(2);
      expect(clashTeamsDbImpl.Team.update.mock.calls).toEqual([[{ key: keyOne }, {
        ExpressionAttributeValues: {
          ':playerName': expectedPlayers,
          ':nameOfTeam': 'Team Sample',
          ':updatedRole': expectedUpdatedValues.Items[0].attrs.playersWRoles,
        },
        ConditionExpression: 'teamName = :nameOfTeam',
        UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
      }, expect.any(Function)], [
        { key: keyTwo }, {
          ExpressionAttributeValues: {
            ':playerName': expectedPlayers,
            ':nameOfTeam': 'Team Sample2',
            ':updatedRole': expectedUpdatedValues.Items[1].attrs.playersWRoles,
          },
          ConditionExpression: 'teamName = :nameOfTeam',
          UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
        }, expect.any(Function),
      ]]);
    });
  });

  test('I should remove a player from a single team if unregister is called and they belong '
        + 'to a single teams that matches the criteria (One Tournament). - v2', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          playersWRoles: { Top: 'Player1' },
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      }, {
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample2',
          serverName: 'Sample Server',
          players: ['Player1'],
          playersWRoles: { Top: 'Player1' },
          tournamentName: 'msi2021',
          tournamentDay: '2',
        },
      },
      ],
    };
    const expectedUpdatedValues = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: [],
          playersWRoles: {},
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      }],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
    ];
    const expectedPlayers = ['Player1'];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback(undefined, expectedUpdatedValues);
      }),
    };
    dynamodb.Set = jest.fn().mockReturnValue(expectedPlayers);

    const foundTeam = value.Items[0].attrs;
    const keyOne = clashTeamsDbImpl.getKey(foundTeam.teamName, foundTeam.serverName,
      foundTeam.tournamentName, foundTeam.tournamentDay);

    return clashTeamsDbImpl.deregisterPlayerV2('Player1', 'Sample Server', leagueTimes)
      .then((data) => {
        expect(data).toBeTruthy();
        expect(clashTeamsDbImpl.Team.update.mock.calls.length).toEqual(1);
        expect(clashTeamsDbImpl.Team.update.mock.calls).toEqual([[{ key: keyOne }, {
          ExpressionAttributeValues: {
            ':playerName': expectedPlayers,
            ':nameOfTeam': 'Team Sample',
            ':updatedRole': expectedUpdatedValues.Items[0].attrs.playersWRoles,
          },
          ConditionExpression: 'teamName = :nameOfTeam',
          UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
        }, expect.any(Function)]]);
      });
  });

  test('I should not remove a player from a team if unregister is called and they do not exist on a team. - v2', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback();
      }),
    };

    return clashTeamsDbImpl.deregisterPlayerV2('Player2', 'Sample Server', leagueTimes)
      .then((data) => {
        expect(data).toEqual([]);
      });
  });

  test('I should not remove a player from a team if unregister is called and they do not exist on a team with '
        + 'the given tournament details. - v2', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          tournamentName: 'msi2021',
          tournamentDay: '3',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback();
      }),
    };

    return clashTeamsDbImpl.deregisterPlayerV2('Player1', 'Sample Server',
      leagueTimes).then((data) => {
      expect(data).toEqual([]);
    });
  });

  test('I should return and error if an error occurs upon the update of the Team object. - v2', () => {
    const value = {
      Items: [{
        attrs: {
          key: 'Sample Team#Sample Server',
          teamName: 'Team Sample',
          serverName: 'Sample Server',
          players: ['Player1'],
          playersWRoles: { Top: 'Player1' },
          tournamentName: 'msi2021',
          tournamentDay: '1',
        },
      },
      ],
    };
    const leagueTimes = [
      {
        tournamentName: 'msi2021',
        tournamentDay: '1',
        startTime: 'May 29 2021 07:00 pm PDT',
        registrationTime: 'May 29 2021 04:15 pm PDT',
      },
      {
        tournamentName: 'msi2021',
        tournamentDay: '2',
        startTime: 'May 30 2021 07:00 pm PDT',
        registrationTime: 'May 30 2021 04:15 pm PDT',
      },
    ];
    const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
    dynamodb.documentClient = (() => ({
      documentClient: () => jest.fn().mockReturnThis(),
      createSet: () => jest.fn().mockReturnThis(),
    }));
    clashTeamsDbImpl.Team = jest.fn();
    clashTeamsDbImpl.Team.update = jest.fn();
    clashTeamsDbImpl.Team = {
      scan: jest.fn().mockReturnThis(),
      filterExpression: jest.fn().mockReturnThis(),
      expressionAttributeValues: jest.fn().mockReturnThis(),
      expressionAttributeNames: jest.fn().mockReturnThis(),
      exec: mockStream,
      update: jest.fn().mockImplementation((key, params, callback) => {
        callback('Failed to update.');
      }),
    };

    return expect(clashTeamsDbImpl.deregisterPlayerV2('Player1', 'Sample Server',
      leagueTimes)).rejects.toMatch('Failed to update.');
  });

  test('When I request to unregister a player from a Team, they should be removed from the player list and playersWRole object.', () => {
    const expectedServerName = 'Goon Squad';
    const originalPlayers = ['1'];
    const originalRoleToPlayerMap = {
      Top: '1',
    };
    const expectedPlayers = ['1', '2'];
    const expectedRoleToPlayerMap = {
      Top: '1',
      Mid: '2',
    };
    const expectedTeamName = 'Team Sample';
    const expectedTournament = createMockListOfTournaments(1)[0];

    const origTeam = buildMockTeamV2(expectedServerName, expectedPlayers, expectedRoleToPlayerMap, expectedTournament, expectedTeamName);
    const expectedTeam = buildMockTeamV2(expectedServerName, originalPlayers, originalRoleToPlayerMap, expectedTournament, expectedTeamName);

    clashTeamsDbImpl.Team = {
      update: jest.fn().mockImplementation((key, params, callback) => callback(null, expectedTeam)),
    };

    let updatedTeam = {};
    const callback = (err, record) => {
      updatedTeam = record;
      expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(1);
      expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith({ key: expectedTeam.key }, params, expect.any(Function));
      expect(record[0]).toEqual(expectedTeam);
    };

    let params = {
      UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
      ConditionExpression: 'teamName = :nameOfTeam',
      ExpressionAttributeValues: {
        ':playerName': dynamodb.Set(['2'], 'S'),
        ':nameOfTeam': origTeam.teamName,
        ':updatedRole': originalRoleToPlayerMap,
      },
    };

    clashTeamsDbImpl.unregisterPlayerWithSpecificTeamV2('2', [origTeam], callback);
  });

  test('When I request to unregister a player from multiple Teams, they should be removed from the player list and playersWRole object.', () => {
    const expectedServerName = 'Goon Squad';
    const originalPlayers = ['1'];
    const originalRoleToPlayerMap = {
      Top: '1',
    };
    const expectedPlayers = ['1', '2'];
    const expectedRoleToPlayerMap = {
      Top: '1',
      Mid: '2',
    };
    const expectedTeamName = 'Team Sample';
    const originalPlayers2 = ['3', '2'];
    const originalRoleToPlayerMap2 = {
      Top: '3',
    };
    const expectedPlayers2 = ['3', '2'];
    const expectedRoleToPlayerMap2 = {
      Top: '3',
      Mid: '2',
    };
    const expectedTeamName2 = 'Team Sample2';
    const expectedTournament = createMockListOfTournaments(1)[0];

    const origTeam = buildMockTeamV2(expectedServerName, expectedPlayers, expectedRoleToPlayerMap, expectedTournament, expectedTeamName);
    const origTeam2 = buildMockTeamV2(expectedServerName, expectedPlayers2, expectedRoleToPlayerMap2, expectedTournament, expectedTeamName2);
    const expectedTeam = buildMockTeamV2(expectedServerName, originalPlayers, originalRoleToPlayerMap, expectedTournament, expectedTeamName);
    const expectedTeam2 = buildMockTeamV2(expectedServerName, originalPlayers2, originalRoleToPlayerMap2, expectedTournament, expectedTeamName2);

    clashTeamsDbImpl.Team = {
      update: jest.fn().mockImplementationOnce((key, params, callback) => callback(null, expectedTeam))
        .mockImplementationOnce((key, params, callback) => callback(null, expectedTeam2)),
    };

    const updatedTeams = [];
    const callback = (err, record) => {
      updatedTeams.push(record);
      expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(2);
      expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith({ key: expectedTeam.key }, params, expect.any(Function));
      expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledWith({ key: expectedTeam2.key }, params2, expect.any(Function));
      expect(record).toEqual([expectedTeam, expectedTeam2]);
    };

    let params = {
      UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
      ConditionExpression: 'teamName = :nameOfTeam',
      ExpressionAttributeValues: {
        ':playerName': dynamodb.Set(['2'], 'S'),
        ':nameOfTeam': origTeam.teamName,
        ':updatedRole': originalRoleToPlayerMap,
      },
    };

    let params2 = {
      UpdateExpression: 'DELETE players :playerName SET playersWRoles = :updatedRole',
      ConditionExpression: 'teamName = :nameOfTeam',
      ExpressionAttributeValues: {
        ':playerName': dynamodb.Set(['2'], 'S'),
        ':nameOfTeam': origTeam2.teamName,
        ':updatedRole': originalRoleToPlayerMap2,
      },
    };

    clashTeamsDbImpl.unregisterPlayerWithSpecificTeamV2('2', [origTeam, origTeam2], callback);
  });
});

describe('Create New Team', () => {
  describe('Create New Team', () => {
    test('When I create a new team and an error occurs then it should be logged.', () => {
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        update: jest.fn().mockImplementation((key, callback) => {
          callback('Failed to update.');
        }),
      };
      const tournament = {
        tournamentName: 'msi2021',
        tournamentDay: 'day_2',
      };
      clashTeamsDbImpl.createNewTeam('Player1', 'Sample Server', tournament, (err) => {
        expect(err).toBeTruthy();
      });
    });

    test('I should be able to successfully create a team with the following details: Player Name, Server Name, Tournament Details, and Team Number', () => {
      const playerName = 'Player1';
      const serverName = 'Sample Server';
      const tournament = {
        tournamentName: 'msi2021',
        tournamentDay: 'day_2',
        startTime: '1234567',
      };
      const teamCreated = {
        teamName: 'Sample Team',
        players: [playerName],
        tournamentName: 'msi2021',
        tournamentDay: 'day_2',
        serverName,
      };
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        update: jest.fn().mockImplementation((key, callback) => {
          callback(undefined, teamCreated);
        }),
      };
      const teamName = 'Team Abomasnow';
      retrieveName.mockReturnValue('Abomasnow');
      const expectedBuiltTeam = {
        teamName,
        serverName,
        players: [playerName],
        tournamentName: tournament.tournamentName,
        tournamentDay: tournament.tournamentDay,
        startTime: tournament.startTime,
        key: clashTeamsDbImpl.getKey(teamName, serverName, tournament.tournamentName, tournament.tournamentDay),
      };
      clashTeamsDbImpl.createNewTeam(playerName, serverName, tournament, (err, data) => {
        expect(clashTeamsDbImpl.Team.update).toBeCalledWith(expectedBuiltTeam, expect.any(Function));
        expect(data).toEqual(teamCreated);
      });
    });
  });

  describe('Create New Team v2', () => {
    test('When I create a new team and an error occurs then it should be logged.', () => {
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        update: jest.fn().mockImplementation((key, callback) => {
          callback('Failed to update.');
        }),
      };
      const tournament = {
        tournamentName: 'msi2021',
        tournamentDay: 'day_2',
      };
      clashTeamsDbImpl.createNewTeamV2('Player1', 'Sample Server', 'Top', tournament, (err) => {
        expect(err).toBeTruthy();
      });
    });

    test('I should be able to successfully create a team with the following details: Player Name, Server Name, Tournament Details, and Team Number', () => {
      const expectedPlayerId = '1';
      const serverName = 'Sample Server';
      const tournament = {
        tournamentName: 'msi2021',
        tournamentDay: 'day_2',
        startTime: '1234567',
      };
      const teamCreated = {
        teamName: 'Sample Team',
        playersWRoles: {
          Top: expectedPlayerId,
        },
        players: [expectedPlayerId],
        tournamentName: 'msi2021',
        tournamentDay: 'day_2',
        serverName,
      };
      retrieveName.mockReturnValue('Abomasnow');
      clashTeamsDbImpl.Team = jest.fn();
      clashTeamsDbImpl.Team = {
        update: jest.fn().mockImplementation((key, callback) => {
          callback(undefined, teamCreated);
        }),
      };
      const teamName = 'Team Abomasnow';
      const expectedBuiltTeam = {
        teamName,
        serverName,
        playersWRoles: {
          Top: expectedPlayerId,
        },
        players: [expectedPlayerId],
        tournamentName: tournament.tournamentName,
        tournamentDay: tournament.tournamentDay,
        startTime: tournament.startTime,
        version: 2,
        key: clashTeamsDbImpl.getKey(teamName, serverName, tournament.tournamentName, tournament.tournamentDay),
      };
      clashTeamsDbImpl.createNewTeamV2(expectedPlayerId, serverName, 'Top', tournament, (err, data) => {
        expect(clashTeamsDbImpl.Team.update).toBeCalledWith(expectedBuiltTeam, expect.any(Function));
        expect(data).toEqual(teamCreated);
      });
    });
  });
});

describe('Filter Available Team', () => {
  test('I should be able to receive an available Team if the player passed does not belong to the team.', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day2',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1'],
        tournamentName: 'msi2021',
        tournamentDay: 'day2',
      },
      {
        key: 'Sample Team1#Sample Server#msi2021#day3',
        teamName: 'Sample Team1',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'msi2021',
        tournamentDay: 'day3',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day3',
    }, {
      tournamentName: 'shurima2022',
      tournamentDay: 'day3',
    }];
    expect(clashTeamsDbImpl.findFirstAvailableTeam('Player1', tournaments, teams)).toEqual(teams[1]);
  });

  test('I should be able to receive an available Team if the player passed does not belong to the team and the tournament.', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day2',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'msi2021',
        tournamentDay: 'day2',
      },
      {
        key: 'Sample Team1#Sample Server#msi2022#day3',
        teamName: 'Sample Team1',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'msi2022',
        tournamentDay: 'day3',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2022',
      tournamentDay: 'day3',
    }, {
      tournamentName: 'shurima2022',
      tournamentDay: 'day3',
    }];
    expect(clashTeamsDbImpl.findFirstAvailableTeam('Player1', tournaments, teams)).toEqual(teams[1]);
  });

  test('I should be able to receive an available Team if the player passed does not belong to the team and the first available tournament.', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day3',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1'],
        tournamentName: 'msi2021',
        tournamentDay: 'day3',
      },
      {
        key: 'Sample Team1#Sample Server#msi2022#day1',
        teamName: 'Sample Team1',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'msi2022',
        tournamentDay: 'day1',
      },
      {
        key: 'Sample Team#Sample Server#shurima2022#day3',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'shurima2022',
        tournamentDay: 'day3',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day3',
    }, {
      tournamentName: 'msi2022',
      tournamentDay: 'day1',
    }, {
      tournamentName: 'shurima2022',
      tournamentDay: 'day3',
    }];
    expect(clashTeamsDbImpl.findFirstAvailableTeam('Player1', tournaments, teams)).toEqual(teams[1]);
  });

  test('I should be able to receive an available Team if the player passed does not belong to the team and the first available tournament and day.', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day1',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1'],
        tournamentName: 'msi2021',
        tournamentDay: 'day1',
      },
      {
        key: 'Sample Team1#Sample Server#msi2021#day2',
        teamName: 'Sample Team1',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'msi2021',
        tournamentDay: 'day2',
      },
      {
        key: 'Sample Team#Sample Server#shurima2022#day3',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'shurima2022',
        tournamentDay: 'day3',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day1',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }, {
      tournamentName: 'shurima2022',
      tournamentDay: 'day3',
    }];
    expect(clashTeamsDbImpl.findFirstAvailableTeam('Player1', tournaments, teams)).toEqual(teams[1]);
  });

  test('I should be able to receive an available Team if the player passed does not belong to the team and the first available tournament and day with less than 5 players.', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day1',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
        tournamentName: 'msi2021',
        tournamentDay: 'day1',
      },
      {
        key: 'Sample Team1#Sample Server#msi2021#day2',
        teamName: 'Sample Team1',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'msi2021',
        tournamentDay: 'day2',
      },
      {
        key: 'Sample Team#Sample Server#shurima2022#day3',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'shurima2022',
        tournamentDay: 'day3',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day1',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }, {
      tournamentName: 'shurima2022',
      tournamentDay: 'day3',
    }];
    expect(clashTeamsDbImpl.findFirstAvailableTeam('Player6', tournaments, teams)).toEqual(teams[1]);
  });

  test('I should receive a Team with the exist value populated if the player passed belongs to the tournament and tournament day passed', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day1',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
        tournamentName: 'msi2021',
        tournamentDay: 'day1',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day1',
    }];
    const foundTeam = clashTeamsDbImpl.findFirstAvailableTeam('Player1', tournaments, teams);
    expect(foundTeam).toBeFalsy();
  });

  test('I should receive all Teams with the exist value populated if the player passed belongs to the tournament and tournament day passed', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day1',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
        tournamentName: 'msi2021',
        tournamentDay: 'day1',
      },
      {
        key: 'Sample Team#Sample Server#msi2021#day1',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1', 'Player2', 'Player3'],
        tournamentName: 'msi2021',
        tournamentDay: 'day2',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day1',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }];
    const foundTeam = clashTeamsDbImpl.findFirstAvailableTeam('Player1', tournaments, JSON.parse(JSON.stringify(teams)));
    expect(foundTeam).toBeFalsy();
    3;
  });

  test('I should receive a single team if a player passed does not belong to one of the tournaments and tournament days passed.', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day1',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
        tournamentName: 'msi2021',
        tournamentDay: 'day1',
      },
      {
        key: 'Sample Team#Sample Server#msi2021#day1',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1', 'Player2', 'Player3'],
        tournamentName: 'msi2021',
        tournamentDay: 'day2',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day1',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }];
    const foundTeam = clashTeamsDbImpl.findFirstAvailableTeam('Player4', tournaments, teams);
    expect(foundTeam).toEqual(teams[1]);
  });

  test('I should receive an undefined if there are no Teams currently available.', () => {
    const teams = [];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day1',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }];
    const foundTeam = clashTeamsDbImpl.findFirstAvailableTeam('Player4', tournaments, teams);
    expect(foundTeam).toEqual(undefined);
  });
});

describe('Filter Available Tournaments', () => {
  test('I should receive all tournaments that the player is not registered to.', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day2',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1'],
        tournamentName: 'msi2021',
        tournamentDay: 'day2',
      },
      {
        key: 'Sample Team1#Sample Server#msi2021#day3',
        teamName: 'Sample Team1',
        serverName: 'Sample Server',
        players: undefined,
        tournamentName: 'msi2021',
        tournamentDay: 'day3',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day3',
    }, {
      tournamentName: 'shurima2022',
      tournamentDay: 'day3',
    }];

    const expectedTournaments = tournaments.slice(1, 3);

    expect(clashTeamsDbImpl.filterAvailableTournaments(tournaments, 'Player1', teams)).toEqual(expectedTournaments);
  });

  test('I should receive all tournaments if the teams is undefined.', () => {
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day3',
    }, {
      tournamentName: 'shurima2022',
      tournamentDay: 'day3',
    }];

    expect(clashTeamsDbImpl.filterAvailableTournaments(tournaments, 'Player1')).toEqual(tournaments);
  });

  test('I should receive all tournaments if the teams is empty.', () => {
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day3',
    }, {
      tournamentName: 'shurima2022',
      tournamentDay: 'day3',
    }];

    expect(clashTeamsDbImpl.filterAvailableTournaments(tournaments, 'Player1', [])).toEqual(tournaments);
  });

  test('I should receive no tournaments if the player belongs to a team registered for each tournament passed.', () => {
    const teams = [
      {
        key: 'Sample Team#Sample Server#msi2021#day2',
        teamName: 'Sample Team',
        serverName: 'Sample Server',
        players: ['Player1'],
        tournamentName: 'msi2021',
        tournamentDay: 'day2',
      },
      {
        key: 'Sample Team1#Sample Server#msi2021#day3',
        teamName: 'Sample Team1',
        serverName: 'Sample Server',
        players: ['Player1'],
        tournamentName: 'msi2021',
        tournamentDay: 'day3',
      },
    ];
    const tournaments = [{
      tournamentName: 'msi2021',
      tournamentDay: 'day2',
    }, {
      tournamentName: 'msi2021',
      tournamentDay: 'day3',
    }];

    expect(clashTeamsDbImpl.filterAvailableTournaments(tournaments, 'Player1', teams)).toEqual([]);
  });
});

describe('Build Tournament to Teams Map', () => {
  each([
    ['Player1', [{
      teamName: 'Team Absol',
      serverName: 'Sample Server',
      players: ['Player1', 'Player2'],
      tournamentName: 'msi2021',
      tournamentDay: '1',
    }, {
      teamName: 'Team Magma',
      serverName: 'Sample Server',
      players: ['Player1', 'Player2'],
      tournamentName: 'msi2021',
      tournamentDay: '2',
    }], 2, [0, 1], [[-1], [-1]]],
    ['Player1', [{
      teamName: 'Team Absol',
      serverName: 'Sample Server',
      players: ['Player1', 'Player2'],
      tournamentName: 'msi2021',
      tournamentDay: '1',
    }, {
      teamName: 'Team Scampy',
      serverName: 'Sample Server',
      players: undefined,
      tournamentName: 'msi2021',
      tournamentDay: '1',
    }, {
      teamName: 'Team Magma',
      serverName: 'Sample Server',
      players: ['Player1', 'Player2'],
      tournamentName: 'msi2021',
      tournamentDay: '2',
    }], 2, [0, 2], [[1], [-1]]],
    ['Player1', [{
      teamName: 'Team Absol',
      serverName: 'Sample Server',
      players: ['Player1', 'Player2'],
      tournamentName: 'msi2021',
      tournamentDay: '1',
    }, {
      teamName: 'Team Crazy Train',
      serverName: 'Sample Server',
      players: ['Player3'],
      tournamentName: 'msi2021',
      tournamentDay: '1',
    }, {
      teamName: 'Team Amber',
      serverName: 'Sample Server',
      players: undefined,
      tournamentName: 'msi2021',
      tournamentDay: '1',
    }, {
      teamName: 'Team Magma',
      serverName: 'Sample Server',
      players: ['Player1', 'Player2'],
      tournamentName: 'msi2021',
      tournamentDay: '2',
    }], 2, [0, 3], [[1, 2], [-1]]],
    ['Player1', [], 0, [-1], [[-1]]],
  ]).test('Player Name %s - Tournaments %s - Teams %s - expected number of keys %d', (playerName, teamsList, expectedNumberOfKeys, expectedTeamsCurrentlyOnIndex, expectedAvailableTeamsIndex) => {
    const map = clashTeamsDbImpl.buildTournamentToTeamsMap(playerName, teamsList);
    const expectedAvailableTeamsMap = [];
    for (let j = 0; j < expectedAvailableTeamsIndex.length; j++) {
      const availableTeamArray = [];
      for (const index in expectedAvailableTeamsIndex[j]) {
        if (teamsList[expectedAvailableTeamsIndex[j][index]]) {
          availableTeamArray.push(teamsList[expectedAvailableTeamsIndex[j][index]]);
        }
      }
      expectedAvailableTeamsMap.push(availableTeamArray);
    }
    expect(map.size).toEqual(expectedNumberOfKeys);
    if (expectedNumberOfKeys) {
      const keys = map.keys();
      console.log(map);
      for (let i = 0; i < expectedTeamsCurrentlyOnIndex.length; i++) {
        const keyToUse = keys.next();
        expect(map.get(keyToUse.value).teamCurrentlyOn).toEqual(teamsList[expectedTeamsCurrentlyOnIndex[i]]);
        const expectVar = expect(map.get(keyToUse.value).availableTeams);
        if (Array.isArray(expectedAvailableTeamsMap[i]) && expectedAvailableTeamsMap[i].length > 0) expectVar.toEqual(expectedAvailableTeamsMap[i]);
        else expectVar.toBeFalsy();
      }
    }
  });
});

describe('Build register Player logic map', () => {
  test('Should be able to build a map for the Tournament to defined Teams.', () => {
    const tournament = [{ tournamentName: 'msi2021', tournamentDay: '1' }, {
      tournamentName: 'msi2021',
      tournamentDay: '2',
    }];
    const tournamentToTeamMap = new Map();
    const expectedTeam = buildSampleTeam();
    const expectedTeamTwo = buildSampleTeam(undefined, undefined, 'Team Two');
    expectedTeamTwo.players = undefined;
    const expectedTeamThree = buildSampleTeam();

    tournamentToTeamMap.set(`${tournament[0].tournamentName}#${tournament[0].tournamentDay}`, {
      availableTeams: [expectedTeam, expectedTeamTwo],
      teamCurrentlyOn: expectedTeamThree,
    });
    tournamentToTeamMap.set(`${tournament[1].tournamentName}#${tournament[1].tournamentDay}`, {
      availableTeams: [expectedTeam, expectedTeamTwo],
    });
    const builtMap = clashTeamsDbImpl.buildTeamLogic(tournament, tournamentToTeamMap);
    expect(builtMap.createNewTeam).toBeFalsy();
    expect(builtMap.teamToJoin.existingTeams).toEqual([expectedTeam]);
    expect(builtMap.teamToJoin.emptyTeams).toEqual([expectedTeamTwo]);
    expect(builtMap.currentTeams).toEqual(expectedTeamThree);
    expect(builtMap.tournamentToUse).toEqual(tournament[0]);
  });

  test('Should be able to build a map for the Tournament to defined Teams until a Tournament with available teams are found.', () => {
    const tournaments = [
      { tournamentName: 'msi2021', tournamentDay: '1' },
      { tournamentName: 'msi2021', tournamentDay: '2' },
    ];
    const tournamentToTeamMap = new Map();
    const expectedTeam = buildSampleTeam();
    const expectedTeamTwo = buildSampleTeam(undefined, undefined, 'Team Two');
    expectedTeamTwo.players = undefined;
    const expectedTeamThree = buildSampleTeam();
    const expectedTeamFour = buildSampleTeam();

    tournamentToTeamMap.set(`${tournaments[0].tournamentName}#${tournaments[0].tournamentDay}`, {
      teamCurrentlyOn: expectedTeamThree,
    });
    tournamentToTeamMap.set(`${tournaments[1].tournamentName}#${tournaments[1].tournamentDay}`, {
      availableTeams: [expectedTeam, expectedTeamTwo],
      teamCurrentlyOn: expectedTeamFour,
    });
    const builtMap = clashTeamsDbImpl.buildTeamLogic(tournaments, tournamentToTeamMap);
    expect(builtMap.createNewTeam).toBeFalsy();
    expect(builtMap.teamToJoin.existingTeams).toEqual([expectedTeam]);
    expect(builtMap.teamToJoin.emptyTeams).toEqual([expectedTeamTwo]);
    expect(builtMap.currentTeams).toEqual(expectedTeamFour);
    expect(builtMap.tournamentToUse).toEqual(tournaments[1]);
  });

  test('Should be able to build a logic map to create a new team if the tournament has no data available in the map passed.', () => {
    const tournament = [{ tournamentName: 'msi2021', tournamentDay: '1' },
      { tournamentName: 'msi2021', tournamentDay: '2' }];
    const tournamentToTeamMap = new Map();
    const builtMap = clashTeamsDbImpl.buildTeamLogic(tournament, tournamentToTeamMap);
    expect(builtMap.createNewTeam).toBeTruthy();
    expect(builtMap.currentTeams).toHaveLength(0);
    expect(builtMap.tournamentToUse).toEqual(tournament[0]);
  });
});

test('Should return a hashkey of the team name and the server name passed.', () => {
  expect(clashTeamsDbImpl.getKey('Sample Team', 'Sample Server', 'msi2021', 'day1')).toEqual('Sample Team#Sample Server#msi2021#day1');
});

function buildSampleTeam(players, serverName, teamName, tournamentName, tournamentDay) {
  return {
    teamName: teamName || `Team ${randomNames[0]}`,
    serverName: serverName || 'Sample Server',
    players: players || ['Player1'],
    tournamentName: tournamentName || 'msi2021',
    tournamentDay: tournamentDay || '1',
  };
}

function createMockListOfTournaments(numberOfTournaments) {
  const tournaments = [];
  const mockTournamentName = 'awesome_sauce';
  numberOfTournaments === undefined ? numberOfTournaments = 1 : numberOfTournaments;
  for (let i = 1; i <= numberOfTournaments; i++) {
    tournaments.push(
      {
        startTime: new Date().toISOString(),
        tournamentDay: `${i}`,
        key: `${mockTournamentName}#${i}`,
        tournamentName: mockTournamentName,
        registrationTime: new Date().toISOString(),
      },
    );
  }
  return tournaments;
}
