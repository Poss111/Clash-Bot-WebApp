const clashBotNotificationDbImpl = require('../clash-bot-notification-db-impl');

describe('Clash Bot Notification Database Implementation', () => {

    describe('Initialization', () => {

    })

    describe('Retrieve Clash Bot Notifications per User', () => {
        test('When a userId is passed to retrieve notifications for user, an array of notifications should be returned.', () => {
            return clashBotNotificationDbImpl.retrieveNotificationsForUser("1").then((dbResponse) => {
                expect(dbResponse).toEqual([]);
            })
        })
    })
})
