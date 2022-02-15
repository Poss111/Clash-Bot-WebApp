const clashBotNotificationDbImpl = require('../dao/clash-bot-notification-db-impl');

class ClashBotNotificationServiceImpl {

    retrieveNotificationsForUser = (userId) => {
        return new Promise((resolve) => clashBotNotificationDbImpl.retrieveNotificationsForUser(userId)
            .then((dbResponse) => {
                resolve(dbResponse.map(messageRecord => {
                    return {
                        alertLevel: messageRecord.message.alertLevel,
                        message: messageRecord.message.message,
                        timeAdded: messageRecord.timeAdded
                    };
                }));
            }));
    }

}

module.exports = new ClashBotNotificationServiceImpl;
