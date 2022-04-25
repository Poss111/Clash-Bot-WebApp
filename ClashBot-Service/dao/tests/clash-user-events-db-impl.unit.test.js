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

    describe('Persist User Event', () => {
        test('An event should be passed with event id, user id, and a base event detail.', async () => {
            const username = 'test-user';
            const eventName = 'team-add';
            const eventDetails = 'test-user has added themselves to test-team';

            const dataToUpdate = {
                key: `${username}#${eventName}#${new Date().toISOString()}`,
                eventTime: new Date().toISOString(),
                eventName: eventName,
                eventDetails: eventDetails,
                username: username
            };
            let calledWithObject = {};
            clashUserEventsDbImpl.clashUserEventsTable = {
                update: jest.fn().mockImplementation((dataToUpdate, callback) => {
                    calledWithObject = dataToUpdate;
                    callback(undefined, { attrs: dataToUpdate });
                })
            };
            return clashUserEventsDbImpl.persistEvent(username, eventName, eventDetails).then((results) => {
                expect(clashUserEventsDbImpl.clashUserEventsTable.update).toHaveBeenCalledTimes(1);
                expect(calledWithObject.key).toBeTruthy();
                expect(calledWithObject.eventTime).toBeTruthy();
                expect(calledWithObject.eventName).toEqual(eventName);
                expect(calledWithObject.eventDetails).toEqual(eventDetails);
                expect(calledWithObject.username).toEqual(username);
                expect(results.attrs).toEqual(dataToUpdate);
            });
        })
    })
})