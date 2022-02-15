const clashBotNotificationDbImpl = require('../dao/clash-bot-notification-db-impl');

class ClashBotNotificationServiceImpl {

    retrieveNotificationsForUser = (userId) => {
        return new Promise((resolve) => clashBotNotificationDbImpl.retrieveNotificationsForUser(userId)
            .then(resolve));
    }

}

module.exports = new ClashBotNotificationServiceImpl;
