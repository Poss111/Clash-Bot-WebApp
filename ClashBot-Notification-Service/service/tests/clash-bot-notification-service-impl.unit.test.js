const clashBotNotificationServiceImpl = require('../clash-bot-notification-service-impl');
const clashBotNotificationDbImpl = require('../../dao/clash-bot-notification-db-impl');

jest.mock('../../dao/clash-bot-notification-db-impl');

describe('Clash Bot Notification Service Implementation', () => {
    describe('Retrieve Notifications for User', () => {
        test('When retrieve notifications for user is called with a user id, a promise should be returned with an array of notifications.', () => {
            clashBotNotificationDbImpl.retrieveNotificationsForUser.mockResolvedValue([]);
            return clashBotNotificationServiceImpl.retrieveNotificationsForUser("1").then((response) => {
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledTimes(1);
                expect(clashBotNotificationDbImpl.retrieveNotificationsForUser).toHaveBeenCalledWith("1");
                expect(response).toEqual([]);
            })
        })
    })
})
