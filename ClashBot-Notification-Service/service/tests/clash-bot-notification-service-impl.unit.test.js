const clashBotNotificationServiceImpl = require('../clash-bot-notification-service-impl');
const clashBotNotificationDbImpl = require('../../dao/clash-bot-notification-db-impl');

jest.mock('../../dao/clash-bot-notification-db-impl');

beforeEach(() => {
    jest.resetAllMocks();
})

describe('Clash Bot Notification Service Implementation', () => {
    describe('Retrieve Notifications for User', () => {
        test('When retrieve notifications for user is called with a user id and no notifications are found, an empty array should be returned.', () => {
            clashBotNotificationDbImpl.retrieveNotificationsForUser.mockResolvedValue([]);
            return clashBotNotificationServiceImpl.retrieveNotDismissedNotificationsForUser("1", 5).then((response) => {
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledWith("1", 5);
                expect(response).toEqual([]);
            })
        })

        test('When retrieve notifications for user is called with a user id and a list of notifications, a promise should be returned with an array of messages.', () => {
            const expectedDbResponse = [
                {
                    createdAt: "2022-02-15T03:41:17.173Z",
                    notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:40:16.874Z",
                    notificationUniqueId: "1",
                    timeAdded: "2022-02-15T03:40:16.874Z",
                    dismissed: false,
                    message: {
                        alertLevel: 3,
                        from: "Clash-Bot",
                        message: "This is a high level alert"
                    },
                    key: "U#1"
                },
                {
                    createdAt: "2022-02-15T03:41:17.165Z",
                    notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z",
                    notificationUniqueId: "2",
                    timeAdded: "2022-02-15T03:41:16.874Z",
                    dismissed: false,
                    message: {
                        alertLevel: 1,
                        from: "Clash-Bot",
                        message: "This is a low level alert"
                    },
                    key: "U#1"
                }
            ];
            const expectedApiResponse = expectedDbResponse.map((item) => {
                return {
                    id: item.notificationUniqueId,
                    alertLevel: item.message.alertLevel,
                    from: item.message.from,
                    message: item.message.message,
                    timeAdded: item.timeAdded
                }
            });
            clashBotNotificationDbImpl.retrieveNotificationsForUser.mockResolvedValue(expectedDbResponse);
            return clashBotNotificationServiceImpl.retrieveNotDismissedNotificationsForUser("1", 5).then((response) => {
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledWith("1", 5);
                expect(response).toEqual(expectedApiResponse);
            })
        })

        test('When retrieve notifications for user is called with a user id and a list of notifications, a ' +
            'promise should be returned with an array of messages that have not been dismissed.', () => {
            const expectedDbResponse = [
                {
                    createdAt: "2022-02-15T03:41:17.173Z",
                    notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:40:16.874Z",
                    notificationUniqueId: "1",
                    timeAdded: "2022-02-15T03:40:16.874Z",
                    dismissed: false,
                    message: {
                        alertLevel: 3,
                        from: "Clash-Bot",
                        message: "This is a high level alert"
                    },
                    key: "U#1"
                },
                {
                    createdAt: "2022-02-15T03:41:17.165Z",
                    notificationSortKey: "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z",
                    notificationUniqueId: "2",
                    timeAdded: "2022-02-15T03:41:16.874Z",
                    dismissed: true,
                    message: {
                        alertLevel: 1,
                        from: "Clash-Bot",
                        message: "This is a low level alert"
                    },
                    key: "U#1"
                }
            ];

            const expectedApiResponse = expectedDbResponse
                .filter(a => !a.dismissed)
                .map((item) => {
                    return {
                        id: item.notificationUniqueId,
                        alertLevel: item.message.alertLevel,
                        from: item.message.from,
                        message: item.message.message,
                        timeAdded: item.timeAdded
                    }
                });
            clashBotNotificationDbImpl.retrieveNotificationsForUser.mockResolvedValue(expectedDbResponse);
            return clashBotNotificationServiceImpl.retrieveNotDismissedNotificationsForUser("1", 5).then((response) => {
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledWith("1", 5);
                expect(response).toEqual(expectedApiResponse);
            })
        })
    })

    describe('Persist Notification for User', () => {
        test('Should persist notification for user with userId, from, serverName, ' +
            'message, alertLevel and return the ' +
            'response mapped to api details.', () => {
            const expectedUserId = '1';
            const from = 'Clash Bot';
            const serverName = 'Goon Squad';
            const message = 'Some Message';
            const alertLevel = 1;
            const timeAdded = new Date().toISOString();
            const expectedDbResponse = {
                createdAt: "2022-02-15T03:41:17.165Z",
                notificationSortKey: `U#${serverName}#2022-02-15T03:41:16.874Z#abcd123`,
                notificationUniqueId: "abcd123",
                timeAdded: timeAdded,
                message: {
                    alertLevel: alertLevel,
                    from: from,
                    message: message
                },
                key: `U#${expectedUserId}`
            };
            clashBotNotificationDbImpl.persistNotification.mockResolvedValue(expectedDbResponse)
            return clashBotNotificationServiceImpl.persistUserNotification(expectedUserId, from, serverName,
                message, alertLevel)
                .then((mappedApiResponse) => {
                    expect(clashBotNotificationDbImpl.persistNotification).toHaveBeenCalledTimes(1);
                    expect(clashBotNotificationDbImpl.persistNotification).toHaveBeenCalledWith(expectedUserId,
                        from, serverName, message, alertLevel);
                    expect(mappedApiResponse).toEqual({
                        message: message,
                        from: from,
                        alertLevel: alertLevel,
                        timeAdded: timeAdded
                    });
                })
        })
    })
})
