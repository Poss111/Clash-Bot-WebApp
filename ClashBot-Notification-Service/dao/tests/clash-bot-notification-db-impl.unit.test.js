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
                            notificationUniqueId: Joi.string(),
                            dismissed: Joi.boolean(),
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
                            createdAt: "2022-02-15T03:41:17.173Z",
                            notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:40:16.874Z#abc12321321",
                            notificationUniqueId: "abc12321321",
                            timeAdded: "2022-02-15T03:40:16.874Z",
                            dismissed: false,
                            message: {
                                alertLevel: 3,
                                message: "This is a high level alert"
                            },
                            key: "U#1"
                        }
                    },
                    {
                        attrs: {
                            createdAt: "2022-02-15T03:41:17.165Z",
                            notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z#abc12321321",
                            notificationUniqueId: "abc12321321",
                            timeAdded: "2022-02-15T03:41:16.874Z",
                            dismissed: false,
                            message: {
                                alertLevel: 1,
                                message: "This is a low level alert"
                            },
                            key: "U#1"
                        }
                    }
                ],
                Count: 2,
                ScannedCount: 2
            };
            clashBotNotificationDbImpl.clashBotNotificationTable = {
                query: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                beginsWith: jest.fn().mockReturnThis(),
                exec: jest.fn().mockImplementation(callback => callback(undefined, data)),
                limit: jest.fn().mockReturnThis()
            };
            return clashBotNotificationDbImpl.retrieveNotificationsForUser("1", 5).then((dbResponse) => {
                expect(clashBotNotificationDbImpl.clashBotNotificationTable.query).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.clashBotNotificationTable.limit).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.clashBotNotificationTable.limit).toHaveBeenCalledWith(5);
                expect(dbResponse).toEqual(data.Items.map(item => item.attrs));
            })
        })
    })

    describe('Retrieve All Clash Bot Notifications per User', () => {
        test('When a userId is passed to retrieve notifications for user, an array of all notifications should be returned.', () => {
            data = {
                "Items": [
                    {
                        attrs: {
                            createdAt: "2022-02-15T03:41:17.173Z",
                            notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:40:16.874Z#abc12321321",
                            notificationUniqueId: "abc12321321",
                            timeAdded: "2022-02-15T03:40:16.874Z",
                            dismissed: false,
                            message: {
                                alertLevel: 3,
                                message: "This is a high level alert"
                            },
                            key: "U#1"
                        }
                    },
                    {
                        attrs: {
                            createdAt: "2022-02-15T03:41:17.165Z",
                            notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z#abc12321321",
                            notificationUniqueId: "abc12321321",
                            timeAdded: "2022-02-15T03:41:16.874Z",
                            dismissed: false,
                            message: {
                                alertLevel: 1,
                                message: "This is a low level alert"
                            },
                            key: "U#1"
                        }
                    },
                    {
                        attrs: {
                            createdAt: "2022-02-15T03:41:17.165Z",
                            notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z#abc12321321",
                            notificationUniqueId: "abc12321321",
                            timeAdded: "2022-02-15T03:41:16.874Z",
                            dismissed: false,
                            message: {
                                alertLevel: 1,
                                message: "This is a low level alert"
                            },
                            key: "U#1"
                        }
                    },
                    {
                        attrs: {
                            createdAt: "2022-02-15T03:41:17.165Z",
                            notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z#abc12321321",
                            notificationUniqueId: "abc12321321",
                            timeAdded: "2022-02-15T03:41:16.874Z",
                            dismissed: false,
                            message: {
                                alertLevel: 1,
                                message: "This is a low level alert"
                            },
                            key: "U#1"
                        }
                    },
                    {
                        attrs: {
                            createdAt: "2022-02-15T03:41:17.165Z",
                            notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z#abc12321321",
                            notificationUniqueId: "abc12321321",
                            timeAdded: "2022-02-15T03:41:16.874Z",
                            dismissed: false,
                            message: {
                                alertLevel: 1,
                                message: "This is a low level alert"
                            },
                            key: "U#1"
                        }
                    },
                    {
                        attrs: {
                            createdAt: "2022-02-15T03:41:17.165Z",
                            notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z#abc12321321",
                            notificationUniqueId: "abc12321321",
                            timeAdded: "2022-02-15T03:41:16.874Z",
                            dismissed: false,
                            message: {
                                alertLevel: 1,
                                message: "This is a low level alert"
                            },
                            key: "U#1"
                        }
                    }
                ],
                Count: 6,
                ScannedCount: 6
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
                expect(clashBotNotificationDbImpl.clashBotNotificationTable.limit).not.toHaveBeenCalled();
                expect(dbResponse).toEqual(data.Items.map(item => item.attrs));
            })
        })
    })

    describe('Post Clash Bot Notification for a User', () => {

        test('A notification for a single user should require a userId, from, serverName, the message, and alert level', () => {
            const expectedUserIdNotificationFor = '1'
            const whoNotificationFrom = 'Clash Bot';
            const serverName = 'Goon Squad';
            const message = 'Some message';
            const alertLevel = 1;
            const dateTime = new Date().toISOString();
            let expectedPersistResponse = {
                attrs: {
                    notificationSortKey: `U#${serverName}#${dateTime}#abc12321321`,
                    notificationUniqueId: "abc12321321",
                    timeAdded: dateTime,
                    dismissed: false,
                    message: {
                        alertLevel: 1,
                        from: whoNotificationFrom,
                        message: message
                    },
                    key: "U#1"
                }
            };
            clashBotNotificationDbImpl.clashBotNotificationTable = {
                create: jest.fn().mockImplementation((data, callback) =>
                    callback(undefined, expectedPersistResponse))
            };
            return clashBotNotificationDbImpl.persistNotification(expectedUserIdNotificationFor,
                whoNotificationFrom,
                serverName,
                message,
                alertLevel)
                .then((notification) => {
                    expect(clashBotNotificationDbImpl.clashBotNotificationTable.create).toHaveBeenCalledWith({
                        notificationSortKey: expect.any(String),
                        notificationUniqueId: expect.any(String),
                        timeAdded: expect.any(String),
                        dismissed: expect.any(Boolean),
                        message: {
                            alertLevel: 1,
                            from: whoNotificationFrom,
                            message: message
                        },
                        key: `U#${expectedUserIdNotificationFor}`
                    }, expect.any(Function));
                    expect(notification.key).toEqual(`U#${expectedUserIdNotificationFor}`);
                    expect(notification.message.from).toEqual(whoNotificationFrom);
                    expect(notification.message.message).toEqual(message);
                    expect(notification.message.alertLevel).toEqual(alertLevel);
                    expect(notification.timeAdded).not.toBeNull();
                    expect(notification.notificationSortKey).not.toBeNull();
                })
        })
    })
})
