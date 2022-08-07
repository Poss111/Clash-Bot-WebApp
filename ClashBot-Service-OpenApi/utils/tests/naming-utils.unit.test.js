const { retrieveName } = require('../naming-utils');

describe('Naming Utils', () => {
  test('Should retrieve a random name from the random-names list,', () => {
    try {
      expect(retrieveName()).not.toEqual(retrieveName());
    } catch (err) {
      expect(retrieveName()).not.toEqual(retrieveName());
    }
  });
});
