const clashTentativeDbImpl = require('../clash-tentative-db-impl');
const dynamoDbHelper = require('../impl/dynamo-db-helper');
const Joi = require('joi');

jest.mock('../impl/dynamo-db-helper');

beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
});

describe('Initialize Table connection', () => {
    test('Initialize the table connection to be used.', async () => {
        let expectedTableObject = {setupTable: true};
        dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableObject);
        const expectedTableDef = {
            hashKey: 'key',
            timestamps: true,
            schema: {
                key: Joi.string(),
                tentativePlayers: Joi.array().items(Joi.string()),
                serverName: Joi.string(),
                tournamentDetails: expect.anything()
            }
        };
        return clashTentativeDbImpl.initialize().then(() => {
            expect(clashTentativeDbImpl.Tentative).toEqual(expectedTableObject);
            expect(dynamoDbHelper.initialize).toBeCalledWith(clashTentativeDbImpl.tableName,
                expectedTableDef);
        });

    })

    test('Error should be handled if it occurs during table initialization', async () => {
        const expectedError = new Error('Failed to compile table def');
        dynamoDbHelper.initialize = jest.fn().mockRejectedValue(expectedError);
        return clashTentativeDbImpl.initialize('Sample Table', {}).catch(err => expect(err).toEqual(expectedError));
    })
})
