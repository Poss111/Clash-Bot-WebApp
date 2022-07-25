const clashTournamentService = require('../TournamentService');
const clashTimeDb = require('../../dao/ClashTimeDbImpl');

jest.mock('../../dao/ClashTimeDbImpl');

beforeEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

describe('Retrieve Tournament times.', () => {
  test('When no filter is given, all times should be retrieved and transformed to correct response.', () => {
    const dbTournaments = [{
      key: 'some#key',
      startTime: 'June 1st, 2022 1:30 PM',
      tournamentName: 'shadow_lands',
      tournamentDay: 'Day 1',
      registrationTime: 'June 1st, 2022 1:00 PM',
    }];
    const expectedReturnedTournaments = [
      {
        tournamentName: dbTournaments[0].tournamentName,
        tournamentDay: dbTournaments[0].tournamentDay,
        startTime: dbTournaments[0].startTime,
        registrationTime: dbTournaments[0].registrationTime,
      },
    ];
    clashTimeDb.findTournament.mockResolvedValue(dbTournaments);
    return clashTournamentService.getTournaments({}).then((tournaments) => {
      expect(clashTimeDb.findTournament).toHaveBeenCalledTimes(1);
      expect(clashTimeDb.findTournament).toHaveBeenCalledWith(undefined, undefined);
      expect(tournaments).toEqual({
        code: 200,
        payload: expectedReturnedTournaments,
      });
    });
  });

  test('If no tournaments are found, it should return as 204.', () => {
    const dbTournaments = [];
    clashTimeDb.findTournament.mockResolvedValue(dbTournaments);
    return clashTournamentService.getTournaments({})
      .then(() => expect(true).toBeFalsy())
      .catch((response) => {
        expect(clashTimeDb.findTournament).toHaveBeenCalledTimes(1);
        expect(clashTimeDb.findTournament).toHaveBeenCalledWith(undefined, undefined);
        expect(response).toEqual({
          code: 204,
          error: 'No Tournaments found.',
        });
      });
  });
});

describe('Error', () => {
  test('If there is an error returned from retrieving the db details, 500 should be returned.', () => {
    clashTimeDb.findTournament.mockRejectedValue(new Error('Failed to connect.'));
    return clashTournamentService.getTournaments({}).catch((response) => {
      expect(response).toEqual({
        code: 500,
        error: 'Something went wrong.',
      });
    });
  });
});
