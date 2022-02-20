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
            return clashBotNotificationServiceImpl.retrieveNotificationsForUser("1").then((response) => {
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledWith("1");
                expect(response).toEqual([]);
            })
        })

        test('When retrieve notifications for user is called with a user id and a list of notifications, a promise should be returned with an array of messages.', () => {
            const expectedDbResponse = [
                {
                    "createdAt": "2022-02-15T03:41:17.173Z",
                    "notificationSortKey": "U#LoL-ClashBotSupport#2022-02-15T03:40:16.874Z",
                    "timeAdded": "2022-02-15T03:40:16.874Z",
                    "message": {
                        "alertLevel": 3,
                        "from": "Clash-Bot",
                        "message": "This is a high level alert"
                    },
                    "key": "U#1"
                },
                {
                    "createdAt": "2022-02-15T03:41:17.165Z",
                    "notificationSortKey": "U#LoL-ClashBotSupport#2022-02-15T03:41:16.874Z",
                    "timeAdded": "2022-02-15T03:41:16.874Z",
                    "message": {
                        "alertLevel": 1,
                        "from": "Clash-Bot",
                        "message": "This is a low level alert"
                    },
                    "key": "U#1"
                }
            ];
            const expectedApiResponse = expectedDbResponse.map((item) => {
                return {
                    alertLevel: item.message.alertLevel,
                    from: item.message.from,
                    message: item.message.message,
                    timeAdded: item.timeAdded
                }
            });
            clashBotNotificationDbImpl.retrieveNotificationsForUser.mockResolvedValue(expectedDbResponse);
            return clashBotNotificationServiceImpl.retrieveNotificationsForUser("1").then((response) => {
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledWith("1");
                expect(response).toEqual(expectedApiResponse);
            })
        })
    })
})
