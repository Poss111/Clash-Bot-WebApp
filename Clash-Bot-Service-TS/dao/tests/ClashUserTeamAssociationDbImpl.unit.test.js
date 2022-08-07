const Joi = require('joi');
const clashUserTeamAssociation = require('../ClashUserTeamAssociationDbImpl');
const dynamoDbHelper = require('../impl/DynamoDbHelper');
const streamTest = require("streamtest");
const clashTeamsDbImpl = require("../ClashTeamsDbImpl");

jest.mock('dynamodb');
jest.mock('../impl/DynamoDbHelper');

beforeEach(() => {
  jest.resetModules();
});

describe('Clash User Team Association DAO', () => {
  describe('Initialize Table connection', () => {
    test('Initialize the table connection to be used.', async () => {
      const expectedTableObject = { setupTable: true };
      dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableObject);
      return clashUserTeamAssociation.initialize().then(() => {
        expect(clashUserTeamAssociation.clashUserTeamAssociationTable).toEqual(expectedTableObject);
        expect(dynamoDbHelper.initialize).toBeCalledWith(clashUserTeamAssociation.tableName,
          {
            hashKey: 'playerId',
            rangeKey: 'association',
            timestamps: true,
            schema: {
              playerId: Joi.string(),
              // <tournament>#<tournamentDay>#<serverName>#<teamName>
              association: Joi.string(),
            },
          });
      });
    });

    test('Error should be handled if it occurs during table initialization', async () => {
      const expectedError = new Error('Failed to compile table def');
      dynamoDbHelper.initialize = jest.fn().mockRejectedValue(expectedError);
      return clashUserTeamAssociation.initialize('Sample Table', {})
        .catch((err) => expect(err).toEqual(expectedError));
    });
  });

  describe('Create user association', () => {
    test('createUserAssociation - (Add User with Team) - If a user is passed with, team type, tournament, and day along with server name and team name, they should have a record created.', () => {
      const userTeamAssociationRequest = {
        playerId: '1',
        tournament: 'awesome_sauce',
        tournamentDay: '1',
        serverName: 'Test Server',
        teamName: 'absol',
      };
      const expectedEntity = {
        playerId: userTeamAssociationRequest.playerId,
        association: `${userTeamAssociationRequest.tournament}#${userTeamAssociationRequest.tournamentDay}#${userTeamAssociationRequest.serverName}#${userTeamAssociationRequest.teamName}`,
      };
      clashUserTeamAssociation.clashUserTeamAssociationTable = {
        create: jest
          .fn()
          .mockImplementation((o, c) => c(null, { attrs: { ...expectedEntity } })),
      };
      return clashUserTeamAssociation
        .createUserAssociation({ ...userTeamAssociationRequest })
        .then((persistedRecord) => {
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.create)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.create)
            .toHaveBeenCalledWith(expectedEntity, expect.any(Function));
          expect(persistedRecord).toEqual({ attrs: expectedEntity });
        })
        .catch((err) => expect(err).toBeFalsy());
    });

    test('createUserAssociation - (Add User with Tentative) - If a user is passed with, team type, tournament, and day, they should have a record created.', () => {
      const userTeamAssociationRequest = {
        playerId: '1',
        tournament: 'awesome_sauce',
        tournamentDay: '1',
        serverName: 'Goon Squad',
      };
      const expectedEntity = {
        playerId: userTeamAssociationRequest.playerId,
        association: `${userTeamAssociationRequest.tournament}#${userTeamAssociationRequest.tournamentDay}#${userTeamAssociationRequest.serverName}#tentative`,
      };
      clashUserTeamAssociation.clashUserTeamAssociationTable = {
        create: jest
          .fn()
          .mockImplementation((o, c) => c(null, { attrs: { ...expectedEntity } })),
      };
      return clashUserTeamAssociation
        .createUserAssociation({ ...userTeamAssociationRequest })
        .then((persistedRecord) => {
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.create)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.create)
            .toHaveBeenCalledWith(expectedEntity, expect.any(Function));
          expect(persistedRecord).toEqual({ attrs: expectedEntity });
        })
        .catch((err) => expect(err).toBeFalsy());
    });

    test('createUserAssociation - (Error) - If an error occurs, it should be rejected.', () => {
      const userTeamAssociationRequest = {
        playerId: '1',
        tournament: 'awesome_sauce',
        tournamentDay: '1',
        teamName: 'absol',
        serverName: 'Goon Squad',
      };
      const expectedEntity = {
        playerId: userTeamAssociationRequest.playerId,
        association: `${userTeamAssociationRequest.tournament}#${userTeamAssociationRequest.tournamentDay}#${userTeamAssociationRequest.serverName}#${userTeamAssociationRequest.teamName}`,
      };
      const expectedError = new Error('Failed to persist. :(');
      clashUserTeamAssociation.clashUserTeamAssociationTable = {
        create: jest
          .fn()
          .mockImplementation((o, c) => c(expectedError)),
      };
      return clashUserTeamAssociation
        .createUserAssociation({ ...userTeamAssociationRequest })
        .then((persistedRecord) => {
          expect(persistedRecord).toEqual({ attrs: expectedEntity });
        })
        .catch((err) => {
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.create)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.create)
            .toHaveBeenCalledWith(expectedEntity, expect.any(Function));
          expect(err).toEqual(expectedError);
        });
    });
  });

  describe('Remove user association', () => {
    test('removeUserAssociation - (Remove User with Team) - If a user is passed with, team type, tournament, and day along with team name, the record should be removed.', () => {
      const userTeamAssociationRequest = {
        playerId: '1',
        tournament: 'awesome_sauce',
        tournamentDay: '1',
        serverName: 'Goon Squad',
        teamName: 'absol',
      };
      const expectedEntity = {
        playerId: userTeamAssociationRequest.playerId,
        association: `${userTeamAssociationRequest.tournament}#${userTeamAssociationRequest.tournamentDay}#${userTeamAssociationRequest.serverName}#${userTeamAssociationRequest.teamName}`,
      };
      clashUserTeamAssociation.clashUserTeamAssociationTable = {
        destroy: jest
          .fn()
          .mockImplementation((o, c) => c(null, { attrs: { ...expectedEntity } })),
      };
      return clashUserTeamAssociation
        .removeUserAssociation({ ...userTeamAssociationRequest })
        .then((response) => {
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.destroy)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.destroy)
            .toHaveBeenCalledWith(expectedEntity, expect.any(Function));
          expect(response).toBeTruthy();
        })
        .catch((err) => expect(err).toBeFalsy());
    });

    test('removeUserAssociation - (Remove User with Tentative) - If a user is passed with, team type, tournament, and day, the record should be removed.', () => {
      const userTeamAssociationRequest = {
        playerId: '1',
        tournament: 'awesome_sauce',
        tournamentDay: '1',
        serverName: 'Goon Squad',
      };
      const expectedEntity = {
        playerId: userTeamAssociationRequest.playerId,
        association: `${userTeamAssociationRequest.tournament}#${userTeamAssociationRequest.tournamentDay}#${userTeamAssociationRequest.serverName}#tentative`,
      };
      clashUserTeamAssociation.clashUserTeamAssociationTable = {
        destroy: jest
          .fn()
          .mockImplementation((o, c) => c(null, { attrs: { ...expectedEntity } })),
      };
      return clashUserTeamAssociation
        .removeUserAssociation({ ...userTeamAssociationRequest })
        .then((response) => {
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.destroy)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.destroy)
            .toHaveBeenCalledWith(expectedEntity, expect.any(Function));
          expect(response).toBeTruthy();
        })
        .catch((err) => expect(err).toBeFalsy());
    });

    test('removeUserAssociation - (Error) - If an error occurs, it should be rejected.', () => {
      const userTeamAssociationRequest = {
        playerId: '1',
        tournament: 'awesome_sauce',
        tournamentDay: '1',
        serverName: 'Goon Squad',
        teamName: 'absol',
      };
      const expectedEntity = {
        playerId: userTeamAssociationRequest.playerId,
        association: `${userTeamAssociationRequest.tournament}#${userTeamAssociationRequest.tournamentDay}#${userTeamAssociationRequest.serverName}#${userTeamAssociationRequest.teamName}`,
      };
      const expectedError = new Error('Failed to remove. :(');
      clashUserTeamAssociation.clashUserTeamAssociationTable = {
        destroy: jest
          .fn()
          .mockImplementation((o, c) => c(expectedError)),
      };
      return clashUserTeamAssociation
        .removeUserAssociation({ ...userTeamAssociationRequest })
        .then((persistedRecord) => {
          expect(persistedRecord).toEqual({ attrs: expectedEntity });
        })
        .catch((err) => {
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.destroy)
            .toHaveBeenCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.destroy)
            .toHaveBeenCalledWith(expectedEntity, expect.any(Function));
          expect(err).toEqual(expectedError);
        });
    });
  });

  describe('Get user association', () => {
    test('getUserAssociation - (Get Team User Association) - should retrieve user association for given tournament, tournament day, server name, and team name.', () => {
      const expectedParameters = {
        playerId: '1',
        tournament: 'awesome_sauce',
        tournamentDay: '1',
        serverName: 'Test Server',
      };
      const associationEntity = {
        playerId: expectedParameters.playerId,
        association: `${expectedParameters.tournament}#${expectedParameters.tournamentDay}#${expectedParameters.serverName}#absol`,
      };
      const value = { Items: [{ attrs: associationEntity }] };
      const mockStream = jest.fn().mockImplementation(() => streamTest.v2.fromObjects([value]));
      clashUserTeamAssociation.clashUserTeamAssociationTable = jest.fn();
      clashUserTeamAssociation.clashUserTeamAssociationTable = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        beginsWith: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };
      return clashUserTeamAssociation.getUserAssociation({ ...expectedParameters })
        .then((response) => {
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.query)
            .toBeCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.query)
            .toBeCalledWith(expectedParameters.playerId);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.beginsWith)
            .toBeCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.beginsWith)
            .toBeCalledWith(`${expectedParameters.tournament}#${expectedParameters.tournamentDay}#${expectedParameters.serverName}`);
          expect(response)
            .toEqual([{ ...associationEntity }]);
        }).catch((err) => expect(err).toBeFalsy());
    });

    test('getUserAssociation - (Error) - If an error occurs, it should respond with one.', () => {
      const expectedParameters = {
        playerId: '1',
        tournament: 'awesome_sauce',
        tournamentDay: '1',
        serverName: 'Test Server',
      };
      const error = new Error('Failed to query.');
      const mockStream = jest.fn()
        .mockImplementation(() => streamTest.v2.fromErroredObjects(error));
      clashUserTeamAssociation.clashUserTeamAssociationTable = jest.fn();
      clashUserTeamAssociation.clashUserTeamAssociationTable = {
        query: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        beginsWith: jest.fn().mockReturnThis(),
        expressionAttributeNames: jest.fn().mockReturnThis(),
        exec: mockStream,
      };
      return clashUserTeamAssociation.getUserAssociation({ ...expectedParameters })
        .then((response) => expect(response).toBeFalsy())
        .catch((err) => {
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.query)
            .toBeCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.query)
            .toBeCalledWith(expectedParameters.playerId);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.beginsWith)
            .toBeCalledTimes(1);
          expect(clashUserTeamAssociation.clashUserTeamAssociationTable.beginsWith)
            .toBeCalledWith(`${expectedParameters.tournament}#${expectedParameters.tournamentDay}#${expectedParameters.serverName}`);
          expect(err).toEqual(error);
        });
    });
  });
});
