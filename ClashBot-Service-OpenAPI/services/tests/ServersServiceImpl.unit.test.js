const serversService = require('../ServersService');

describe('Servers Service', () => {
  describe('GET', () => {
    test('getServerDetails - (Get Server Details) - If the server exists in the list of Teams for Tournaments, it should return as an array.', () => {
      return serversService.getServerDetails({
        id: '1',
        servers: ['Goon Squad'],
      }).then((response) => {
        expect(response).toBeTruthy();
      });
    });
  });
});