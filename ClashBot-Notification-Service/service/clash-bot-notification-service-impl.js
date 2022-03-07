const clashBotNotificationDbImpl = require('../dao/clash-bot-notification-db-impl');

class ClashBotNotificationServiceImpl {

    retrieveNotificationsForUser = (userId) => {
        return new Promise((resolve) => clashBotNotificationDbImpl.retrieveNotificationsForUser(userId)
            .then((dbResponse) => {
                resolve(dbResponse.map(messageRecord => {
                    return {
                        id: messageRecord.notificationUniqueId,
                        alertLevel: messageRecord.message.alertLevel,
                        from: messageRecord.message.from,
                        message: messageRecord.message.message,
                        timeAdded: messageRecord.timeAdded
                    };
                }));
            }));
    }

    persistUserNotification(userId, from, serverName, message, alertLevel) {
        return new Promise((resolve, reject) => {
           clashBotNotificationDbImpl.persistNotification(userId, from, serverName, message, alertLevel)
               .then((dbResponse) => {
               resolve({
                   alertLevel: dbResponse.message.alertLevel,
                   from: dbResponse.message.from,
                   message: dbResponse.message.message,
                   timeAdded: dbResponse.timeAdded
               })
           })
        });
    }

}

module.exports = new ClashBotNotificationServiceImpl;
