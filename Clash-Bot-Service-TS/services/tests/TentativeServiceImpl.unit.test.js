const clashTimeDbImpl = require('../../dao/clash-time-db-impl');
const clashTentativeDbImpl = require('../../dao/clash-tentative-db-impl');
const clashSubscriptionDbImpl = require('../../dao/clash-subscription-db-impl');
const clashTentativeServiceImpl = require('../TentativeService');
const { deepCopy, createUserDetails } = require('../../utils/tests/test-utility.utility.test');

jest.mock('../../dao/clash-tentative-db-impl');
jest.mock('../../dao/clash-subscription-db-impl');
jest.mock('../../dao/clash-time-db-impl');

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('Clash Tentative Service Impl', () => {
  describe('Tentative - GET', () => {
    test('getTentativeDetails - if no Tournaments are passed, it should pull all active Tentative details.', () => {
      const serverName = 'Goon Squad';
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
        4: createUserDetails({ key: '4', playerName: 'Sera' }),
      };
      const tentativeRequestPayload = {
        serverName,
      };
      const tournaments = [
        {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
        {
          tournamentName: 'awesome_sauce',
          tournamentDay: '2',
        },
        {
          tournamentName: 'awesome_sauce',
          tournamentDay: '3',
        },
      ];
      const tentativeEntities = [
        {
          key: 'Some#Key',
          tentativePlayers: ['1', '2'],
          serverName,
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1',
          },
        },
        {
          key: 'Some#Key',
          tentativePlayers: ['2', '4'],
          serverName,
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '2',
          },
        },
      ];
      const expectedResponsePayload = [
        {
          serverName,
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1',
          },
          tentativePlayers: [{
            id: '1',
            name: idToPlayerMap['1'].playerName,
          },
          {
            id: '2',
            name: idToPlayerMap['2'].playerName,
          },
          ],
        },
        {
          serverName,
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '2',
          },
          tentativePlayers: [{
            id: '2',
            name: idToPlayerMap['2'].playerName,
          },
          {
            id: '4',
            name: idToPlayerMap['4'].playerName,
          },
          ],
        },
        {
          serverName,
          tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '3',
          },
          tentativePlayers: [],
        },
      ];
      clashTimeDbImpl.findTournament.mockResolvedValue(tournaments);
      clashTentativeDbImpl.getTentative.mockResolvedValueOnce(tentativeEntities[0]);
      clashTentativeDbImpl.getTentative.mockResolvedValueOnce(tentativeEntities[1]);
      clashTentativeDbImpl.getTentative.mockResolvedValueOnce(undefined);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(idToPlayerMap);
      return clashTentativeServiceImpl.getTentativeDetails(tentativeRequestPayload)
        .then((tentativeDetails) => {
          expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
          expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith(undefined, undefined);
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(3);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, { tournamentName: 'awesome_sauce', tournamentDay: '1' });
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(['1', '2', '4']);
          expect(tentativeDetails).toEqual({
            code: 200,
            payload: expectedResponsePayload,
          });
        });
    });

    test('getTentativeDetails - if there are no active Tournaments, or none that match the criteria given, then it should return 400.', () => {
      const serverName = 'Goon Squad';
      const tentativeRequestPayload = {
        serverName,
      };
      const tournaments = [];
      clashTimeDbImpl.findTournament.mockResolvedValue(tournaments);
      return clashTentativeServiceImpl.getTentativeDetails(tentativeRequestPayload)
        .then(() => expect(true).toBeFalsy())
        .catch((tentativeDetails) => {
          expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
          expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith(undefined, undefined);
          expect(clashTentativeDbImpl.getTentative).not.toHaveBeenCalled();
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).not.toHaveBeenCalled();
          expect(tentativeDetails).toEqual({
            code: 400,
            error: 'No Tournaments found for tentative details.',
          });
        });
    });

    test('getTentativeDetails - if a Tournament is passed, it should pull all matching active Tentative details.', () => {
      const serverName = 'Goon Squad';
      const tournamentName = 'awesome_sauce';
      const tournamentDay = '1';
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
      };
      const tentativeRequestPayload = {
        serverName,
        tournamentName,
        tournamentDay,
      };
      const tournaments = [
        {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
      ];
      const tentativeEntities = {
        key: 'Some#Key',
        tentativePlayers: ['1', '2'],
        serverName,
        tournamentDetails: {
          tournamentName,
          tournamentDay,
        },
      };
      const expectedResponsePayload = [
        {
          serverName,
          tournamentDetails: {
            tournamentName,
            tournamentDay,
          },
          tentativePlayers: [{
            id: '1',
            name: idToPlayerMap['1'].playerName,
          },
          {
            id: '2',
            name: idToPlayerMap['2'].playerName,
          }],
        },
      ];
      clashTimeDbImpl.findTournament.mockResolvedValue(tournaments);
      clashTentativeDbImpl.getTentative.mockResolvedValue(tentativeEntities);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockResolvedValue(idToPlayerMap);
      return clashTentativeServiceImpl.getTentativeDetails(tentativeRequestPayload)
        .then((tentativeDetails) => {
          expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
          expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith(tournamentName,
            tournamentDay);
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, { tournamentName, tournamentDay });
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(tentativeEntities.tentativePlayers);
          expect(tentativeDetails).toEqual({
            code: 200,
            payload: expectedResponsePayload,
          });
        });
    });
  });

  describe('Tentative - POST', () => {
    test('placePlayerOnTentative - if a Tournament is passed that has an Tentative record, a player should be placed on the Tentative queue', () => {
      const playerId = '2';
      const serverName = 'Goon Squad';
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
      };
      const tournament = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const request = {
        playerId,
        serverName,
        tournamentDetails: tournament,
      };
      const tentativeEntity = {
        key: 'Some#Key',
        tentativePlayers: ['1'],
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
      };
      const responsePayload = {
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
        tentativePlayers: [
          {
            id: '1',
            name: idToPlayerMap['1'].playerName,
          },
          {
            id: '2',
            name: idToPlayerMap['2'].playerName,
          },
        ],
      };
      const updatedTentativeEntity = deepCopy(tentativeEntity);
      updatedTentativeEntity.tentativePlayers.push(playerId);
      clashTentativeDbImpl.getTentative.mockResolvedValue(tentativeEntity);
      clashTentativeDbImpl.addToTentative.mockResolvedValue(updatedTentativeEntity);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockReturnValue(idToPlayerMap);
      return clashTentativeServiceImpl.placePlayerOnTentative({ body: request })
        .then((tentativeDetails) => {
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, tournament);
          expect(clashTentativeDbImpl.addToTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.addToTentative)
            .toHaveBeenCalledWith(playerId, serverName, tournament, tentativeEntity);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(['1', '2']);
          expect(tentativeDetails).toEqual(
            {
              code: 200,
              payload: responsePayload,
            },
          );
        });
    });

    test('placePlayerOnTentative - if a valid Tournament is passed that does not have a Tentative record, a player should be placed on the Tentative queue', () => {
      const playerId = '2';
      const serverName = 'Goon Squad';
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
        2: createUserDetails({ key: '2' }),
      };
      const tournament = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const request = {
        playerId,
        serverName,
        tournamentDetails: tournament,
      };
      const tentativeEntity = {
        key: 'Some#Key',
        tentativePlayers: ['1'],
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
      };
      const responsePayload = {
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
        tentativePlayers: [
          {
            id: '1',
            name: idToPlayerMap['1'].playerName,
          },
          {
            id: '2',
            name: idToPlayerMap['2'].playerName,
          },
        ],
      };
      const updatedTentativeEntity = deepCopy(tentativeEntity);
      updatedTentativeEntity.tentativePlayers.push(playerId);
      clashTentativeDbImpl.getTentative.mockResolvedValue(undefined);
      clashTimeDbImpl.findTournament.mockResolvedValue([tournament]);
      clashTentativeDbImpl.addToTentative.mockResolvedValue(updatedTentativeEntity);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockReturnValue(idToPlayerMap);
      return clashTentativeServiceImpl.placePlayerOnTentative({ body: request })
        .then((tentativeDetails) => {
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, tournament);
          expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
          expect(clashTimeDbImpl.findTournament)
            .toHaveBeenCalledWith(tournament.tournamentName, tournament.tournamentDay);
          expect(clashTentativeDbImpl.addToTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.addToTentative)
            .toHaveBeenCalledWith(playerId, serverName, tournament);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(['1', '2']);
          expect(tentativeDetails).toEqual(
            {
              code: 200,
              payload: responsePayload,
            },
          );
        });
    });

    test('placePlayerOnTentative - If the Tournament passed is not valid, then 400 should be returned.', () => {
      const playerId = '2';
      const serverName = 'Goon Squad';
      const tournament = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const request = {
        playerId,
        serverName,
        tournamentDetails: tournament,
      };
      clashTentativeDbImpl.getTentative.mockResolvedValue(undefined);
      return clashTentativeServiceImpl.placePlayerOnTentative({ body: request })
        .then(() => expect(true).toBeFalsy())
        .catch((tentativeDetails) => {
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, tournament);
          expect(clashTentativeDbImpl.addToTentative).not.toHaveBeenCalled();
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).not.toHaveBeenCalled();
          expect(tentativeDetails).toEqual(
            {
              code: 400,
              error: 'Tournament given does not exist.',
            },
          );
        });
    });

    test('placePlayerOnTentative - If the User is already Tentative for the Tournament, then 400 should be returned.', () => {
      const playerId = '1';
      const serverName = 'Goon Squad';
      const tournament = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const request = {
        playerId,
        serverName,
        tournamentDetails: tournament,
      };
      const tentativeEntity = {
        key: 'Some#Key',
        tentativePlayers: ['1'],
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
      };
      clashTentativeDbImpl.getTentative.mockResolvedValue(tentativeEntity);
      return clashTentativeServiceImpl.placePlayerOnTentative({ body: request })
        .then(() => expect(true).toBeFalsy())
        .catch((tentativeDetails) => {
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, tournament);
          expect(clashTentativeDbImpl.addToTentative).not.toHaveBeenCalled();
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).not.toHaveBeenCalled();
          expect(tentativeDetails).toEqual(
            {
              code: 400,
              error: 'User already on tentative queue for Tournament.',
            },
          );
        });
    });
  });

  describe('Tentative - DELETE', () => {
    test('removePlayerFromTentative - if a Tournament is passed, a player should be removed from the Tentative queue', () => {
      const playerId = '2';
      const serverName = 'Goon Squad';
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
      };
      const tournament = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const request = {
        playerId,
        serverName,
        tournamentDetails: tournament,
      };
      const tentativeEntity = {
        key: 'Some#Key',
        tentativePlayers: ['1', '2'],
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
      };
      const responsePayload = {
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
        tentativePlayers: [
          {
            id: '1',
            name: idToPlayerMap['1'].playerName,
          },
        ],
      };
      const updatedTentativeEntity = deepCopy(tentativeEntity);
      updatedTentativeEntity.tentativePlayers.pop();
      clashTentativeDbImpl.getTentative.mockResolvedValue(tentativeEntity);
      clashTentativeDbImpl.removeFromTentative.mockResolvedValue(updatedTentativeEntity);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockReturnValue(idToPlayerMap);
      return clashTentativeServiceImpl.removePlayerFromTentative({ body: request })
        .then((tentativeDetails) => {
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, tournament);
          expect(clashTentativeDbImpl.removeFromTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.removeFromTentative)
            .toHaveBeenCalledWith(playerId, tentativeEntity);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).toHaveBeenCalledTimes(1);
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails)
            .toHaveBeenCalledWith(['1']);
          expect(tentativeDetails).toEqual(
            {
              code: 200,
              payload: responsePayload,
            },
          );
        });
    });

    test('removePlayerFromTentative - if a Tournament is passed, and they are the last person on the tentative queue, the Tentative queue should be removed.', () => {
      const playerId = '2';
      const serverName = 'Goon Squad';
      const idToPlayerMap = {
        1: createUserDetails({ key: '1' }),
      };
      const tournament = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const request = {
        playerId,
        serverName,
        tournamentDetails: tournament,
      };
      const tentativeEntity = {
        key: 'Some#Key',
        tentativePlayers: ['2'],
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
      };
      const responsePayload = {
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
      };
      const updatedTentativeEntity = deepCopy(tentativeEntity);
      updatedTentativeEntity.tentativePlayers.pop();
      clashTentativeDbImpl.getTentative.mockResolvedValue(tentativeEntity);
      clashTentativeDbImpl.removeFromTentative.mockResolvedValue(updatedTentativeEntity);
      clashSubscriptionDbImpl.retrieveAllUserDetails.mockReturnValue(idToPlayerMap);
      return clashTentativeServiceImpl.removePlayerFromTentative({ body: request })
        .then((tentativeDetails) => {
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, tournament);
          expect(clashTentativeDbImpl.deleteTentativeQueue).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.deleteTentativeQueue)
            .toHaveBeenCalledWith({ key: tentativeEntity.key });
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).not.toHaveBeenCalled();
          expect(tentativeDetails).toEqual(
            {
              code: 200,
              payload: responsePayload,
            },
          );
        });
    });

    test('removePlayerFromTentative - If the User is not on Tentative for the Tournament, then 400 should be returned.', () => {
      const playerId = '2';
      const serverName = 'Goon Squad';
      const tournament = {
        tournamentName: 'awesome_sauce',
        tournamentDay: '1',
      };
      const request = {
        playerId,
        serverName,
        tournamentDetails: tournament,
      };
      const tentativeEntity = {
        key: 'Some#Key',
        tentativePlayers: ['1'],
        serverName,
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1',
        },
      };
      clashTentativeDbImpl.getTentative.mockResolvedValue(tentativeEntity);
      return clashTentativeServiceImpl.removePlayerFromTentative({ body: request })
        .then(() => expect(true).toBeFalsy())
        .catch((tentativeDetails) => {
          expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(1);
          expect(clashTentativeDbImpl.getTentative)
            .toHaveBeenCalledWith(serverName, tournament);
          expect(clashTentativeDbImpl.removeFromTentative).not.toHaveBeenCalled();
          expect(clashSubscriptionDbImpl.retrieveAllUserDetails).not.toHaveBeenCalled();
          expect(tentativeDetails).toEqual(
            {
              code: 400,
              error: 'User is not on found tentative queue for Tournament.',
            },
          );
        });
    });
  });
});
