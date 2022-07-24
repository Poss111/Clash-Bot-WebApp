const dynamodb = require('dynamodb');
const streamTest = require('streamtest');
const Joi = require('joi');
const clashTeamsDbImpl = require('../clash-teams-db-impl');
const dynamoDbHelper = require('../impl/dynamo-db-helper');
const { buildMessage } = require('../../utils/template-builder');
const namingUtils = require('../../utils/naming-utils');

jest.mock('dynamodb');
jest.mock('../impl/dynamo-db-helper');
jest.mock('../../utils/naming-utils');

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe('ClashTeamsDbImpl', () => {
  describe('Initialize Table connection', () => {
    test('Initialize the table connection to be used.', async () => {
      const expectedTableObject = { setupTable: true };
      dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableObject);
      const expectedTableDef = {
        hashKey: 'serverName',
        rangeKey: 'details',
        timestamps: true,
        schema: {
          serverName: Joi.string(),
          details: Joi.string(),
          teamName: Joi.string(),
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
      return clashTeamsDbImpl.initialize('Sample Table', {})
        .catch((err) => expect(err).toEqual(expectedError));
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

    test(
      'retrieveTeamsByFilter - should be able to filter by serverName and tournamentName to retrieve all.',
      () => {
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
            expect(clashTeamsDbImpl.Team.beginsWith).toHaveBeenCalledWith(`${tournamentName}#`);
            expect(teams).toEqual([builtTeamToBeRetrieved]);
          });
      },
    );

    test(
      'retrieveTeamsByFilter - should be able to filter by serverName, tournamentName, and tournamentDay to retrieve all.',
      () => {
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
            expect(clashTeamsDbImpl.Team.beginsWith)
              .toHaveBeenCalledWith(`${tournamentName}#${tournamentDay}`);
            expect(teams).toEqual([builtTeamToBeRetrieved]);
          });
      },
    );

    test(
      'retrieveTeamsByFilter - should be able to filter by serverName, tournamentName, tournamentDay, and teamName to retrieve all.',
      () => {
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
        return clashTeamsDbImpl.retrieveTeamsByFilter(
          {
            serverName, tournamentName, tournamentDay, teamName,
          },
        )
          .then((teams) => {
            expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledTimes(1);
            expect(clashTeamsDbImpl.Team.query).toHaveBeenCalledWith(serverName);
            expect(clashTeamsDbImpl.Team.where).toHaveBeenCalledTimes(1);
            expect(clashTeamsDbImpl.Team.where).toHaveBeenCalledWith('details');
            expect(clashTeamsDbImpl.Team.beginsWith).toHaveBeenCalledTimes(1);
            expect(clashTeamsDbImpl.Team.beginsWith)
              .toHaveBeenCalledWith(`${tournamentName}#${tournamentDay}#${teamName.toLowerCase()}`);
            expect(teams).toEqual([builtTeamToBeRetrieved]);
          });
      },
    );
  });

  describe('Update Team', () => {
    test('updateTeam, when a team is passed then it should call and persist it', () => {
      const expectedMockTeam = {
        details: 'awesome_sauce#2#Abra',
        teamName: 'Abra',
        serverName: 'Goon Squad',
        players: ['1', '2'],
        playersWRoles: {
          Top: '1',
          Mid: '2',
        },
        tournamentName: 'awesome_sauce',
        tournamentDay: '2',
        startTime: new Date().toISOString(),
      };
      clashTeamsDbImpl.Team = {
        update: jest.fn().mockImplementation((team, callback) => callback(null, {
          attrs: expectedMockTeam,
        })),
      };
      return clashTeamsDbImpl.updateTeam(expectedMockTeam)
        .then((updatedTeam) => {
          expect(clashTeamsDbImpl.Team.update).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.Team.update)
            .toHaveBeenCalledWith(expectedMockTeam, expect.any(Function));
          expect(updatedTeam).toEqual(expectedMockTeam);
        })
        .catch((err) => expect(err).toBeFalsy());
    });

    test('updateTeam - when there is an error, it should be rejected as expected.', () => {
      const expectedMockTeam = {
        details: 'awesome_sauce#2#Abra',
        teamName: 'Abra',
        serverName: 'Goon Squad',
        players: ['1', '2'],
        playersWRoles: {
          Top: '1',
          Mid: '2',
        },
        tournamentName: 'awesome_sauce',
        tournamentDay: '2',
        startTime: new Date().toISOString(),
      };
      const expectedError = new Error('This failed to persist.');
      clashTeamsDbImpl.Team = {
        update: jest.fn().mockImplementation((team, callback) => callback(expectedError, {
          attrs: expectedMockTeam,
        })),
      };
      return clashTeamsDbImpl.updateTeam(expectedMockTeam)
        .then(() => expect(false).toBeTruthy())
        .catch((err) => expect(err).toEqual(expectedError));
    });
  });

  describe('Delete Team', () => {
    test('deleteTeam - when delete team is called, it should invoke delete with dynamodb.', () => {
      const expectedDestroyPayload = {
        serverName: 'LoL-ClashBotSupport',
        details: 'awesome_sauce#2#Abra',
      };
      clashTeamsDbImpl.Team = {
        destroy: jest.fn().mockImplementation((team, callback) => callback(null)),
      };
      return clashTeamsDbImpl.deleteTeam(expectedDestroyPayload)
        .then((teamDeleted) => {
          expect(clashTeamsDbImpl.Team.destroy).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.Team.destroy)
            .toHaveBeenCalledWith(expectedDestroyPayload, expect.any(Function));
          expect(teamDeleted).toBeTruthy();
        });
    });

    test('deleteTeam - if there is an error, it should reject.', () => {
      const expectedDestroyPayload = {
        serverName: 'LoL-ClashBotSupport',
        details: 'awesome_sauce#2#Abra',
      };
      clashTeamsDbImpl.Team = {
        destroy: jest.fn().mockImplementation((team, callback) => callback(new Error('Failed to delete.'))),
      };
      return clashTeamsDbImpl.deleteTeam(expectedDestroyPayload)
        .then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(clashTeamsDbImpl.Team.destroy).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.Team.destroy)
            .toHaveBeenCalledWith(expectedDestroyPayload, expect.any(Function));
          expect(err).toBeTruthy();
        });
    });
  });

  describe('Create Team', () => {
    test('createNewTeam - If a new team is requested, it should create a new Team.', () => {
      const serverName = 'Goon Squad';
      const tournamentDetails = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const players = ['1'];
      const playersWRoles = {
        Top: '1',
      };
      const teamName = 'abra';
      const expectedCreatedTeam = {
        serverName,
        details: `${tournamentDetails.tournamentName}#${tournamentDetails.tournamentDay}#${teamName}`,
        teamName,
        tournamentName: tournamentDetails.tournamentName,
        tournamentDay: tournamentDetails.tournamentDay,
        players,
        playersWRoles,

      };
      namingUtils.retrieveName.mockReturnValue('Abra');
      clashTeamsDbImpl.Team = {
        create: jest
          .fn()
          .mockImplementation((o, c) => c(null, {
            attrs: expectedCreatedTeam,
          })),
      };
      return clashTeamsDbImpl.createTeam({
        serverName,
        players,
        playersWRoles,
        tournamentDetails,
      })
        .then((createdTeam) => {
          expect(namingUtils.retrieveName).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.Team.create).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.Team.create).toHaveBeenCalledWith(expectedCreatedTeam,
            expect.any(Function));
          expect(createdTeam).toEqual(expectedCreatedTeam);
        });
    });

    test('createNewTeam - If there is a failure, it should be caught and rejected.', () => {
      const serverName = 'Goon Squad';
      const tournamentDetails = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const players = ['1'];
      const playersWRoles = {
        Top: '1',
      };
      const teamName = 'abra';
      const expectedCreatedTeam = {
        serverName,
        details: `${tournamentDetails.tournamentName}#${tournamentDetails.tournamentDay}#${teamName}`,
        teamName,
        tournamentName: tournamentDetails.tournamentName,
        tournamentDay: tournamentDetails.tournamentDay,
        players,
        playersWRoles,

      };
      const expectedError = new Error('Failed to create.');
      namingUtils.retrieveName.mockReturnValue('Abra');
      clashTeamsDbImpl.Team = {
        create: jest
          .fn()
          .mockImplementation((o, c) => c(expectedError, {
            attrs: expectedCreatedTeam,
          })),
      };
      return clashTeamsDbImpl.createTeam({
        serverName,
        players,
        playersWRoles,
        tournamentDetails,
      }).then(() => expect(true).toBeFalsy())
        .catch((err) => {
          expect(namingUtils.retrieveName).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.Team.create).toHaveBeenCalledTimes(1);
          expect(clashTeamsDbImpl.Team.create).toHaveBeenCalledWith(expectedCreatedTeam,
            expect.any(Function));
          expect(err).toEqual(expectedError);
        });
    });
  });
});
