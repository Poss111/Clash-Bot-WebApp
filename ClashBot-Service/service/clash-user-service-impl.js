const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');

class ClashUserServiceImpl {

    checkIfIdExists(id, username, serverName) {
        return new Promise(resolve => {
            clashSubscriptionDbImpl.retrieveUserDetails(id).then((userDetails) => {
                if (!userDetails || !userDetails.id) {
                    clashSubscriptionDbImpl.createUpdateUserDetails(id, serverName, username, [])
                        .then((createdUser) => {
                            console.log(`Created a new User entry for ('${id}')`)
                            resolve(createdUser);
                        })
                } else {
                    resolve(userDetails);
                }
            })
        })
    }

}

module.exports = new ClashUserServiceImpl;
