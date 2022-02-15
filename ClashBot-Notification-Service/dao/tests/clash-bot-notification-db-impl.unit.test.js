const clashBotNotificationDbImpl = require('../clash-bot-notification-db-impl');
const dynamoDbHelper = require('../impl/dynamo-db-helper');
const Joi = require('Joi');

jest.mock('../impl/dynamo-db-helper');

describe('Clash Bot Notification Database Implementation', () => {

    describe('Initialization', () => {
        test('Initialize the table connection to be used.', async () => {
            let expectedTableObject = {setupTable: true};
            dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableObject);
            return clashBotNotificationDbImpl.initialize().then(() => {
                expect(clashBotNotificationDbImpl.clashBotNotificationTable).toEqual(expectedTableObject);
                expect(dynamoDbHelper.initialize).toHaveBeenCalledWith(clashBotNotificationDbImpl.tableName,
                    {
                        hashKey: 'key',
                        rangeKey: 'notificationSortKey',
                        timestamps: true,
                        schema: {
                            key: Joi.string(),
                            notificationSortKey: Joi.string(),
                            message: expect.anything(),
                            timeAdded: Joi.string()
                        }
                    });
            });
        })

        test('Error should be handled if it occurs during table initialization', async () => {
            const expectedError = new Error('Failed to compile table def');
            dynamoDbHelper.initialize = jest.fn().mockRejectedValue(expectedError);
            return clashBotNotificationDbImpl.initialize('Sample Table', {}).catch(err => expect(err).toEqual(expectedError));
        })
    })

    describe('Retrieve Clash Bot Notifications per User', () => {
        test('When a userId is passed to retrieve notifications for user, an array of notifications should be returned.', () => {
            data = {
                "Items": [
                    {
                        attrs: {
                            "createdAt": "2022-02-15T03:41:17.173Z",
                            "notificationSortKey": "U#LoL-ClashBotSupport#2022-02-15T03:40:16.874Z",
                            "timeAdded": "2022-02-15T03:40:16.874Z",
                            "message": {
                                "alertLevel": 3,
                                "message": "This is a high level alert"
                            },
                            "key": "U#1"
                        }
                    },
                    {
                        attrs: {
                            "createdAt": "2022-02-15T03:41:17.165Z",
                            "notificationSortKey": "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z",
                            "timeAdded": "2022-02-15T03:41:16.874Z",
                            "message": {
                                "alertLevel": 1,
                                "message": "This is a low level alert"
                            },
                            "key": "U#1"
                        }
                    }
                ],
                "Count": 2,
                "ScannedCount": 2
            };
            clashBotNotificationDbImpl.clashBotNotificationTable = {
                query: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                beginsWith: jest.fn().mockReturnThis(),
                exec: jest.fn().mockImplementation(callback => callback(undefined, data)),
                limit: jest.fn().mockReturnThis()
            };
            return clashBotNotificationDbImpl.retrieveNotificationsForUser("1").then((dbResponse) => {
                expect(clashBotNotificationDbImpl.clashBotNotificationTable.query).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.clashBotNotificationTable.limit).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.clashBotNotificationTable.limit).toHaveBeenCalledWith(5);
                expect(dbResponse).toEqual(data.Items.map(item => item.attrs));
            })
        })
    })
})
