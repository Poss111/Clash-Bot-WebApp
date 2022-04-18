const clashUserEventsDbImpl = require('../clash-user-events-db-impl');
const dynamoDbHelper = require('../impl/dynamo-db-helper');
const streamTest = require('streamtest');
const moment = require('moment-timezone');
const Joi = require('joi');

jest.mock('../impl/dynamo-db-helper');

beforeEach(() => {
    jest.resetAllMocks();
})

describe('Clash User Events Clash Database Impl', () => {

    describe('Initialize Table connection', () => {
        test('Initialize the table connection to be used.', async () => {
            let expectedTableDef = {
                hashKey: 'key',
                timestamps: true,
                schema: {
                    key: Joi.string(),
                    eventTime: Joi.string(),
                    eventName: Joi.string(),
                    eventDetails: Joi.string(),
                    username: Joi.string()
                }
            };
            dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableDef);
            return clashUserEventsDbImpl.initialize().then(() => {
                expect(clashUserEventsDbImpl.clashUserEventsTable).toEqual(expectedTableDef);
                expect(dynamoDbHelper.initialize).toBeCalledWith(clashUserEventsDbImpl.tableName, expectedTableDef);
            });
        })

        test('Error should be handled if it occurs during table initialization', async () => {
            const expectedError = new Error('Failed to compile table def');
            dynamoDbHelper.initialize = jest.fn().mockRejectedValue(expectedError);
            return clashUserEventsDbImpl.initialize('Sample Table', {}).catch(err => expect(err).toEqual(expectedError));
        })
    })

    describe('Add User Event', () => {
        test('An event should be passed with event id, user id, and a base event detail.', () => {

        })
    })
})